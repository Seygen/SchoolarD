# SchoolarD

Application web de gestion scolaire multi-tenant pour directeurs d'école, enseignants et parents.

## Fonctionnalités

- **Annuaire des élèves** — fiche complète avec contacts, données médicales, observations et documents
- **Import Excel/CSV** — assistant 3 étapes avec détection automatique des colonnes
- **Composition des classes** — glisser-déposer, répartition automatique garçons/filles
- **Espace classe** — fil d'actualité, pièces jointes, commentaires parents
- **Bibliothèque de documents** — dossiers hiérarchiques, upload, téléchargement
- **Notifications** — envoi ciblé (école entière ou classe spécifique)
- **Multi-tenant** — isolation par `school_id`, chaque école a son propre espace
- **Rôles** : Super Admin (plateforme) · Admin/Directeur · Enseignant · Parent

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| UI | React 19 + Tailwind CSS 3.4 |
| Auth | NextAuth v5 beta (JWT, Credentials) |
| ORM | Prisma 6 |
| Base de données | PostgreSQL 16 |
| Langage | TypeScript strict |

---

## Démarrage en local

### Prérequis

- **Node.js** >= 20 (`node -v`)
- **PostgreSQL** >= 14 (`psql --version`)
- **npm** >= 10 (`npm -v`)

### 1. Cloner le dépôt

```bash
git clone <url-du-repo> schoolard
cd schoolard
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Ouvrir `.env.local` et renseigner **au minimum** :

```env
DATABASE_URL="postgresql://schoolard_user:schoolard_dev@localhost:5432/schoolard"
AUTH_SECRET="un-secret-aléatoire-32-chars"   # voir commande ci-dessous
NEXTAUTH_URL="http://localhost:3000"
```

Pour générer un `AUTH_SECRET` :

```bash
openssl rand -base64 32
```

### 4. Créer la base de données PostgreSQL

```bash
# Se connecter en superutilisateur
sudo -u postgres psql

# Dans le shell psql :
CREATE USER schoolard_user WITH PASSWORD 'schoolard_dev' CREATEDB;
CREATE DATABASE schoolard OWNER schoolard_user;
\q
```

### 5. Appliquer les migrations et alimenter la base

```bash
DATABASE_URL="postgresql://schoolard_user:schoolard_dev@localhost:5432/schoolard" \
  npx prisma migrate dev --name init
```

```bash
DATABASE_URL="postgresql://schoolard_user:schoolard_dev@localhost:5432/schoolard" \
  npm run db:seed
```

Le seed crée :
| Compte | Email | Mot de passe | Notes |
|---|---|---|---|
| Super Admin | `admin@schoolard.fr` | `ChangeMe123!` | Requiert TOTP (voir ci-dessous) |
| Directrice démo | `directrice@ecole-demo.fr` | `DemoAdmin123!` | Accès complet à l'école démo |

**TOTP Super Admin** — clé secrète : `ORABGQBGGNIGWRJ6`  
Importer dans une app 2FA (Google Authenticator, Authy, 1Password) ou générer un code via :

```bash
node -e "const t=require('otplib'); t.authenticator.options={secret:'ORABGQBGGNIGWRJ6'}; console.log(t.authenticator.generate('ORABGQBGGNIGWRJ6'))"
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Parcours de test

### Connexion en tant que directrice

1. Aller sur [http://localhost:3000/login](http://localhost:3000/login)
2. Email : `directrice@ecole-demo.fr` / Mot de passe : `DemoAdmin123!`
3. Vous arrivez sur le tableau de bord admin

### Importer des élèves

1. Menu **Import**
2. Glisser-déposer un fichier `.xlsx` ou `.csv` (colonnes : Nom, Prénom, Niveau, Sexe)
3. Vérifier le mapping automatique, valider, lancer l'import

Exemple de fichier CSV minimal :

```
Nom,Prénom,Niveau,Sexe
Dupont,Alice,CP,F
Martin,Léo,CE1,M
Bernard,Emma,CE2,F
```

### Créer et composer des classes

1. Menu **Classes** → bouton **Composition des classes**
2. Créer une classe (ex. : `CP-A`, niveau `CP`, 25 élèves max)
3. Glisser les élèves depuis le panneau gauche vers la classe
4. Ou cliquer **Répartition automatique** pour un équilibrage M/F
5. **Sauvegarder**

### Publier dans l'espace classe

1. Menu **Classes** → cliquer sur une classe
2. Rédiger un message et (optionnel) joindre un PDF
3. Cliquer **Publier**

### Envoyer une notification

1. Menu **Notifications**
2. Choisir la portée : toute l'école ou une classe
3. Rédiger le titre et le corps, puis **Envoyer**

---

## Commandes utiles

```bash
# Migrations
npm run db:migrate          # appliquer les migrations

# Interface graphique Prisma Studio
npm run db:studio           # ouvrir http://localhost:5555

# Vérification TypeScript
npx tsc --noEmit

# Linter
npm run lint
```

---

## Structure du projet

```
.
├── app/
│   ├── (auth)/             # Pages login, vérification 2FA
│   ├── (school)/           # Pages protégées (layout avec sidebar)
│   │   ├── dashboard/
│   │   ├── eleves/         # Annuaire + fiches élèves
│   │   ├── classes/        # Liste, composition, espace classe
│   │   ├── import/         # Assistant d'import
│   │   └── notifications/
│   └── superadmin/         # Console Super Admin
├── components/
│   ├── classes/            # ClassComposer, ClassFeed, DocumentLibrary
│   ├── import/             # ImportWizard
│   ├── layout/             # Sidebar
│   ├── notifications/      # NotificationForm
│   └── students/           # StudentFilters, StudentProfile
├── lib/
│   ├── constants.ts        # Couleurs niveaux, labels
│   ├── db.ts               # Client Prisma singleton
│   └── storage.ts          # Abstraction stockage fichiers
├── prisma/
│   ├── schema.prisma       # 22 modèles
│   ├── seed.ts             # Données de démo
│   └── migrations/
├── auth.ts                 # Configuration NextAuth v5
├── middleware.ts           # Protection des routes
└── types/next-auth.d.ts    # Extensions de session
```

---

## Déploiement (aperçu)

Pour un déploiement en production :

1. Remplacer `lib/storage.ts` par une implémentation S3/Cloudflare R2 (les variables `STORAGE_*` dans `.env.example` sont prévues à cet effet)
2. Configurer `DATABASE_URL` vers une base PostgreSQL hébergée
3. Définir `AUTH_SECRET` avec une valeur forte et aléatoire
4. `npm run build && npm start`
