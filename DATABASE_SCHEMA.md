# Schéma de base de données — SchoolarD

**Version** : 1.0  
**Date** : Avril 2026  
**SGBD cible** : PostgreSQL 15+  
**ORM** : Prisma

---

## 1. Principes de conception

### Multi-tenancy
- Toutes les tables métier portent une colonne `school_id UUID NOT NULL`
- Les clés étrangères inter-tables incluent `school_id` en tant que colonne de la FK composite, ce qui garantit qu'un enregistrement d'un tenant ne peut jamais référencer un enregistrement d'un autre tenant au niveau base de données
- Le middleware applicatif injecte systématiquement `school_id` depuis le JWT dans chaque requête
- Les fichiers stockés sont préfixés `/{school_id}/...` dans le bucket objet

### Identifiants
- Toutes les clés primaires sont des **UUID v4** (pas d'entier auto-incrémenté) : évite la prédictibilité des IDs dans les URLs et facilite les migrations futures

### Données sensibles
- Les données médicales des élèves sont dans une table dédiée (`student_medical`) pour faciliter le contrôle d'accès et les audits RGPD
- Les mots de passe et secrets TOTP ne sont jamais stockés en clair

---

## 2. Diagramme entité-relation (simplifié)

```
┌──────────────┐
│ super_admins │  (niveau plateforme, hors tenant)
└──────────────┘

┌──────────┐         ┌───────────────┐
│  schools │ 1 ───── N  users        │  (admins, enseignants, parents)
└──────────┘         └───────────────┘
     │                      │
     │                      │ parent_student_links
     │               ┌──────┴──────┐
     │               │   students  │ ──── student_contacts
     │               └──────┬──────┘      student_medical
     │                      │             student_observations
     │               class_enrollments
     │                      │
     ├── academic_years      │
     │        │              │
     │   ┌────┴────┐ ────────┘
     │   │ classes │
     │   └────┬────┘
     │        ├── class_teachers  (→ users)
     │        ├── class_staff     (→ staff_members)
     │        ├── posts ── post_attachments
     │        └── document_folders ── documents
     │
     ├── staff_members
     ├── notifications ── notification_reads
     ├── import_jobs
     └── audit_logs
```

---

## 3. DDL — Tables plateforme

```sql
-- Opérateurs de la plateforme SchoolarD (hors tenant)
CREATE TABLE super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    totp_secret     TEXT NOT NULL,           -- 2FA obligatoire
    full_name       TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- Établissements scolaires (tenants)
CREATE TABLE schools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,    -- ex: "ecole-jules-ferry-lyon"
    country         CHAR(2) NOT NULL DEFAULT 'FR',
    contact_email   TEXT,
    status          TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspended_at    TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);
```

---

## 4. DDL — Utilisateurs et authentification

```sql
-- Comptes utilisateurs de l'école (admins, enseignants, parents, élèves ≥13 ans)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    email           TEXT NOT NULL,
    password_hash   TEXT,                    -- NULL si connexion OAuth uniquement
    oauth_provider  TEXT,                    -- 'google' | NULL
    oauth_sub       TEXT,                    -- identifiant côté provider
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    role            TEXT NOT NULL
                    CHECK (role IN ('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')),
    date_of_birth   DATE,                    -- requis pour le rôle STUDENT (vérif. âge)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    UNIQUE (school_id, email)
);

-- Index pour les lookups fréquents
CREATE INDEX idx_users_school_role ON users(school_id, role);
CREATE INDEX idx_users_email ON users(email);    -- pour le login cross-tenant
```

---

## 5. DDL — Élèves

Les élèves sont des **entités distinctes des comptes utilisateurs** : un élève de primaire n'a pas de compte. Un `user` avec `role = 'STUDENT'` peut être lié à un élève via `parent_student_links` (côté parent) ou directement (élève ≥ 13 ans avec compte propre).

```sql
-- Profil élève
CREATE TABLE students (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          CHAR(1) CHECK (gender IN ('M', 'F', 'X')),
    photo_url       TEXT,
    level           TEXT NOT NULL            -- 'CP','CE1','CE2','CM1','CM2','TPS','PS','MS','GS'
                    CHECK (level IN ('TPS','PS','MS','GS','CP','CE1','CE2','CM1','CM2')),
    notes           TEXT,                    -- observations libres de la direction
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_student_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_school_level ON students(school_id, level);

-- Contacts et responsables légaux d'un élève
CREATE TABLE student_contacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL,
    school_id           UUID NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    relationship        TEXT NOT NULL        -- 'MOTHER','FATHER','GUARDIAN','OTHER'
                        CHECK (relationship IN ('MOTHER','FATHER','GUARDIAN','OTHER')),
    phone               TEXT,
    email               TEXT,
    is_authorized_pickup BOOLEAN NOT NULL DEFAULT FALSE,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_sc_student FOREIGN KEY (student_id, school_id)
        REFERENCES students(id, school_id)   -- FK composite multi-tenant
);

CREATE INDEX idx_student_contacts_student ON student_contacts(student_id);

-- Données médicales (table isolée pour contrôle d'accès renforcé)
CREATE TABLE student_medical (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL,
    school_id       UUID NOT NULL,
    allergies       TEXT,
    treatments      TEXT,
    pai_protocol    TEXT,                    -- Projet d'Accueil Individualisé
    home_support    TEXT,                    -- orthophonie, AVS à domicile, etc.
    other_notes     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID,                    -- user_id de qui a modifié
    CONSTRAINT fk_sm_student FOREIGN KEY (student_id, school_id)
        REFERENCES students(id, school_id),
    UNIQUE (student_id)                      -- une fiche médicale par élève
);

-- Observations pédagogiques (appréciations par période)
CREATE TABLE student_observations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL,
    school_id       UUID NOT NULL,
    author_id       UUID NOT NULL,           -- user_id de l'enseignant
    period          TEXT NOT NULL,           -- ex: '2025-T1', '2025-T2', '2025-T3'
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_so_student FOREIGN KEY (student_id, school_id)
        REFERENCES students(id, school_id),
    CONSTRAINT fk_so_author FOREIGN KEY (author_id, school_id)
        REFERENCES users(id, school_id)
);

CREATE INDEX idx_obs_student ON student_observations(student_id);

-- Lien parent (user) ↔ élève
CREATE TABLE parent_student_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    parent_user_id  UUID NOT NULL,
    student_id      UUID NOT NULL,
    relationship    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_psl_parent FOREIGN KEY (parent_user_id, school_id)
        REFERENCES users(id, school_id),
    CONSTRAINT fk_psl_student FOREIGN KEY (student_id, school_id)
        REFERENCES students(id, school_id),
    UNIQUE (parent_user_id, student_id)
);

CREATE INDEX idx_psl_parent ON parent_student_links(parent_user_id);
CREATE INDEX idx_psl_student ON parent_student_links(student_id);
```

---

## 6. DDL — Personnel non-enseignant (AESH, AVS)

```sql
-- Accompagnateurs, AESH, personnel non-enseignant
CREATE TABLE staff_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    staff_type      TEXT NOT NULL DEFAULT 'AESH'
                    CHECK (staff_type IN ('AESH', 'AVS', 'OTHER')),
    email           TEXT,
    phone           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_school ON staff_members(school_id);
```

---

## 7. DDL — Années scolaires et classes

```sql
-- Année scolaire (ex: "2025-2026")
CREATE TABLE academic_years (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    label           TEXT NOT NULL,           -- '2025-2026'
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (school_id, label)
);

-- Trigger ou contrainte applicative : une seule année courante par école

-- Classes
CREATE TABLE classes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID NOT NULL REFERENCES schools(id),
    academic_year_id    UUID NOT NULL,
    name                TEXT NOT NULL,       -- ex: 'CE2-A', 'CP-Dupont'
    level               TEXT,               -- niveau principal si classe à simple niveau
    max_students        SMALLINT NOT NULL DEFAULT 25,
    parent_access       BOOLEAN NOT NULL DEFAULT FALSE,  -- espace classe activé pour les parents
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_class_year FOREIGN KEY (academic_year_id, school_id)
        REFERENCES academic_years(id, school_id)
);

CREATE INDEX idx_classes_school_year ON classes(school_id, academic_year_id);

-- Inscription d'un élève dans une classe
CREATE TABLE class_enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    class_id        UUID NOT NULL,
    student_id      UUID NOT NULL,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unenrolled_at   TIMESTAMPTZ,             -- NULL = toujours inscrit
    CONSTRAINT fk_ce_class FOREIGN KEY (class_id, school_id)
        REFERENCES classes(id, school_id),
    CONSTRAINT fk_ce_student FOREIGN KEY (student_id, school_id)
        REFERENCES students(id, school_id),
    UNIQUE (class_id, student_id)            -- un élève ne peut être dans 2 classes en même temps
);

CREATE INDEX idx_enrollments_class ON class_enrollments(class_id) WHERE unenrolled_at IS NULL;
CREATE INDEX idx_enrollments_student ON class_enrollments(student_id);

-- Affectation d'un enseignant à une classe
CREATE TABLE class_teachers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    class_id        UUID NOT NULL,
    user_id         UUID NOT NULL,           -- doit avoir role = 'TEACHER' ou 'ADMIN'
    is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ct_class FOREIGN KEY (class_id, school_id)
        REFERENCES classes(id, school_id),
    CONSTRAINT fk_ct_user FOREIGN KEY (user_id, school_id)
        REFERENCES users(id, school_id),
    UNIQUE (class_id, user_id)
);

-- Affectation d'un membre du personnel (AESH) à une classe
CREATE TABLE class_staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    class_id        UUID NOT NULL,
    staff_member_id UUID NOT NULL,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id, school_id)
        REFERENCES classes(id, school_id),
    CONSTRAINT fk_cs_staff FOREIGN KEY (staff_member_id, school_id)
        REFERENCES staff_members(id, school_id),
    UNIQUE (class_id, staff_member_id)
);
```

---

## 8. DDL — Espace classe (publications et documents)

```sql
-- Publications dans le fil d'actualité d'une classe
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    class_id        UUID NOT NULL,
    author_id       UUID NOT NULL,
    content         TEXT NOT NULL,
    comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,             -- soft delete
    CONSTRAINT fk_post_class FOREIGN KEY (class_id, school_id)
        REFERENCES classes(id, school_id),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id, school_id)
        REFERENCES users(id, school_id)
);

CREATE INDEX idx_posts_class ON posts(class_id, created_at DESC) WHERE deleted_at IS NULL;

-- Pièces jointes d'une publication
CREATE TABLE post_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    post_id         UUID NOT NULL REFERENCES posts(id),
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,           -- chemin dans le bucket S3
    file_type       TEXT NOT NULL            -- 'PDF','IMAGE','AUDIO','VIDEO'
                    CHECK (file_type IN ('PDF','IMAGE','AUDIO','VIDEO')),
    file_size_bytes BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commentaires des parents sur les publications
CREATE TABLE post_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    post_id         UUID NOT NULL REFERENCES posts(id),
    author_id       UUID NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT fk_pc_author FOREIGN KEY (author_id, school_id)
        REFERENCES users(id, school_id)
);

CREATE INDEX idx_comments_post ON post_comments(post_id) WHERE deleted_at IS NULL;

-- Dossiers de documents par classe
CREATE TABLE document_folders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    class_id        UUID,                    -- NULL = bibliothèque globale de l'école
    parent_id       UUID REFERENCES document_folders(id),
    name            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents partagés
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    folder_id       UUID REFERENCES document_folders(id),
    class_id        UUID,                    -- NULL = document visible par toute l'école
    uploader_id     UUID NOT NULL,
    name            TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    file_type       TEXT NOT NULL
                    CHECK (file_type IN ('PDF','IMAGE','AUDIO','VIDEO','OTHER')),
    file_size_bytes BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_documents_class ON documents(school_id, class_id) WHERE deleted_at IS NULL;
```

---

## 9. DDL — Notifications

```sql
-- Notification émise par un admin ou enseignant
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    author_id       UUID NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    target_scope    TEXT NOT NULL
                    CHECK (target_scope IN ('SCHOOL', 'CLASS')),
    target_class_id UUID,                    -- NULL si target_scope = 'SCHOOL'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_school ON notifications(school_id, created_at DESC);

-- Statut de lecture par utilisateur
CREATE TABLE notification_reads (
    notification_id UUID NOT NULL REFERENCES notifications(id),
    user_id         UUID NOT NULL,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);
```

---

## 10. DDL — Imports

```sql
-- Suivi des imports de fichiers (élèves, enseignants)
CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id),
    author_id       UUID NOT NULL,
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    import_type     TEXT NOT NULL
                    CHECK (import_type IN ('STUDENTS', 'TEACHERS', 'STAFF')),
    status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PROCESSING','DONE','ERROR')),
    rows_total      INT,
    rows_imported   INT,
    rows_skipped    INT,
    error_details   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);
```

---

## 11. DDL — Journal d'audit

```sql
-- Toutes les actions sensibles (modification fiche médicale, accès super admin, etc.)
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID,                    -- NULL pour actions niveau plateforme
    actor_id        UUID,                    -- user_id ou super_admin_id
    actor_type      TEXT NOT NULL
                    CHECK (actor_type IN ('USER', 'SUPER_ADMIN', 'SYSTEM')),
    action          TEXT NOT NULL,           -- ex: 'UPDATE_MEDICAL', 'SUPERADMIN_ACCESS_TENANT'
    resource_type   TEXT,                    -- 'STUDENT', 'CLASS', 'SCHOOL', ...
    resource_id     UUID,
    metadata        JSONB,                   -- contexte additionnel (IP, diff, etc.)
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_school ON audit_logs(school_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
```

---

## 12. Relations clés — récapitulatif

| Relation | Cardinalité | Table de jonction |
|---|---|---|
| École → Utilisateurs | 1–N | `users.school_id` |
| École → Élèves | 1–N | `students.school_id` |
| Élève → Contacts | 1–N | `student_contacts` |
| Élève → Données médicales | 1–1 | `student_medical` |
| Parent (user) → Élève | N–N | `parent_student_links` |
| Classe → Élèves | N–N | `class_enrollments` |
| Classe → Enseignants | N–N | `class_teachers` |
| Classe → AESH | N–N | `class_staff` |
| Classe → Publications | 1–N | `posts.class_id` |
| Publication → Pièces jointes | 1–N | `post_attachments` |
| Publication → Commentaires | 1–N | `post_comments` |
| Classe → Documents | 1–N | `documents.class_id` |
| Notification → Lectures | 1–N | `notification_reads` |

---

## 13. Contraintes d'intégrité multi-tenant

Pour forcer l'isolation au niveau base de données, les FK composites sur `(id, school_id)` nécessitent que la colonne `(id, school_id)` soit déclarée comme contrainte `UNIQUE` sur la table référencée :

```sql
-- Exemple : permettre les FK composites sur students
ALTER TABLE students ADD CONSTRAINT uq_student_id_school UNIQUE (id, school_id);
ALTER TABLE users    ADD CONSTRAINT uq_user_id_school    UNIQUE (id, school_id);
ALTER TABLE classes  ADD CONSTRAINT uq_class_id_school   UNIQUE (id, school_id);
ALTER TABLE academic_years ADD CONSTRAINT uq_year_id_school UNIQUE (id, school_id);
ALTER TABLE staff_members  ADD CONSTRAINT uq_staff_id_school UNIQUE (id, school_id);
```

---

## 14. Évolutions futures prévues

| Besoin | Solution envisagée |
|---|---|
| Montée en charge massive | Partitionnement PostgreSQL par `school_id` ou migration vers schema-per-tenant |
| Recherche full-text élèves | Index `pg_trgm` sur `first_name || last_name` |
| Historique des changements | Table `student_history` via trigger ou extension `temporal_tables` |
| Pièces jointes volumineuses | Signed URLs S3 avec expiration courte (pas de proxy applicatif) |
