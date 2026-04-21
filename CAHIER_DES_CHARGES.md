# Cahier des Charges — SchoolarD
## Application web de gestion scolaire

**Version** : 1.0  
**Date** : Avril 2026  
**Statut** : Draft

---

## 1. Contexte et objectifs

### 1.1 Contexte

SchoolarD est une application destinée à une directrice d'école primaire ou élémentaire. Elle doit centraliser et simplifier la gestion quotidienne d'un établissement : organisation des classes, suivi des élèves, communication avec les familles et partage de documents.

### 1.2 Objectifs principaux

- Permettre l'import et la normalisation d'une liste d'élèves depuis un fichier PDF ou Excel
- Automatiser la répartition des élèves en classes selon des critères définis
- Offrir un suivi individualisé de chaque élève (notes, signalements, coordonnées)
- Proposer un espace de communication par classe à destination des parents
- Envoyer des notifications à l'ensemble de l'école en cas d'événement important

---

## 2. Périmètre fonctionnel

### 2.1 Vue d'ensemble des modules

| Module | Description |
|---|---|
| Import & Normalisation | Ingestion de listes (PDF, Excel) et nettoyage des données |
| Composition des classes | Répartition automatique et ajustement manuel |
| Fiches élèves | Profil complet par élève |
| Espace classe | Plateforme de communication par classe |
| Partage de documents | Dépôt de fichiers ciblé par classe ou global |
| Notifications | Alertes push et bannières d'annonces |
| Gestion des accès | Rôles différenciés selon le type d'utilisateur |

---

## 3. Fonctionnalités détaillées

### 3.1 Import et normalisation des données

**Import de fichiers**
- Formats acceptés : `.xlsx`, `.xls`, `.csv`, `.pdf`
- Types d'acteurs importables : élèves, enseignants, accompagnateurs (AESH / assistants de vie scolaire)
- Détection automatique des colonnes (nom, prénom, classe actuelle, niveau, etc.)
- Interface de mapping manuel si les colonnes ne sont pas reconnues
- Prévisualisation avant validation de l'import

**Normalisation**
- Détection et signalement des doublons
- Normalisation des noms (casse, accents)
- Vérification de cohérence des données (niveau, âge, etc.)

---

### 3.2 Composition et répartition des classes

**Paramètres de composition**
- Nombre de classes à créer
- Effectif maximum par classe (ex. : 15 ou 21 élèves — configurable)
- Affectation obligatoire d'un enseignant par classe
- Affectation optionnelle d'un ou plusieurs accompagnateurs (AESH) par classe
- Critères de répartition : équilibre filles/garçons, niveau scolaire, cas particuliers

**Modes de répartition**
- **Mode automatique** : l'algorithme répartit les élèves selon les paramètres, en quelques clics
- **Mode manuel** : glisser-déposer des élèves entre classes après proposition automatique
- **Mode mixte** : proposition automatique, puis ajustements manuels

**Résultat**
- Vue tableau de chaque classe constituée avec ses effectifs
- Alertes si une contrainte n'est pas respectée (classe sans enseignant, effectif dépassé, etc.)
- Export de la composition en PDF ou Excel

---

### 3.3 Fiches élèves

Chaque élève dispose d'une fiche individuelle accessible aux administrateurs et enseignants.

**Informations générales**
- Nom, prénom, date de naissance
- Photo (optionnel)
- Niveau scolaire (CP, CE1, CE2, CM1, CM2, etc.)
- Classe assignée

**Suivi pédagogique**
- Notes et bulletins (par matière et période)
- Observations générales de l'enseignant

**Cas particuliers et signalements**
- Problèmes médicaux (allergies, traitements, protocoles d'urgence PAI)
- Besoins d'aide spécifiques (AESH, orthophonie, soutien scolaire à domicile)
- Champ libre pour toute observation importante

**Coordonnées**
- Informations de contact des parents/tuteurs (nom, téléphone, email)
- Personnes autorisées à récupérer l'enfant
- Médecin traitant (optionnel)

---

### 3.4 Espace classe (plateforme parents)

Chaque classe dispose d'un espace dédié, visible uniquement par les membres de cette classe (élèves assignés, leurs parents et l'enseignant).

**Fonctionnalités**
- Fil d'actualité par classe (devoirs, activités, sorties, informations pratiques)
- Publication par l'enseignant ou la direction (texte, pièce jointe)
- Commentaires des parents sur les publications (optionnel — activable/désactivable)
- Calendrier de classe (dates importantes, sorties scolaires)

---

### 3.5 Partage de documents

**Ciblage**
- **Par classe** : visible uniquement par les membres de la classe concernée
- **Global (école)** : visible par l'ensemble des utilisateurs de l'établissement

**Types de fichiers supportés**
- Documents : PDF (cahiers de textes, fiches de travail, autorisations)
- Images : JPEG, PNG, GIF
- Audio : MP3, OGG (chansons, comptines)
- Vidéo : MP4, MOV (limité en taille — ex. 500 Mo max)

**Organisation**
- Dossiers par thème ou matière au sein de chaque classe
- Horodatage et auteur de chaque dépôt
- Prévisualisation en ligne pour PDF et images

---

### 3.6 Notifications et annonces

**Notifications push** (via navigateur web et mobile)
- Déclenchées par la direction ou un enseignant
- Ciblage : classe spécifique ou ensemble de l'établissement

**Types d'événements notifiables**
- Absence d'enseignant
- Grève
- Incident ou fermeture exceptionnelle
- Nouvelle publication dans l'espace classe
- Nouveau document partagé

**Historique**
- Toutes les notifications sont archivées et consultables dans un centre de notifications

---

## 4. Gestion des accès et rôles

### 4.1 Rôles utilisateurs

| Rôle | Description | Droits |
|---|---|---|
| **Directeur / Admin** | Directrice de l'école | Accès complet à toutes les fonctionnalités |
| **Enseignant** | Professeur d'une classe | Gestion de sa classe, fiches élèves, publications, documents |
| **Parent / Tuteur** | Parent d'un élève | Lecture de l'espace classe de son enfant, réception des notifications |
| **Élève** (optionnel) | Accès restreint | Lecture de l'espace classe uniquement |

### 4.2 Détail des permissions

| Fonctionnalité | Admin | Enseignant | Parent | Élève |
|---|---|---|---|---|
| Importer des listes | ✅ | ❌ | ❌ | ❌ |
| Composer les classes | ✅ | ❌ | ❌ | ❌ |
| Voir toutes les fiches élèves | ✅ | Classe uniquement | ❌ | ❌ |
| Modifier une fiche élève | ✅ | Classe uniquement | ❌ | ❌ |
| Publier dans l'espace classe | ✅ | Classe uniquement | ❌ | ❌ |
| Voir l'espace classe | ✅ | ✅ | Classe de l'enfant | Propre classe |
| Partager des documents | ✅ | Classe uniquement | ❌ | ❌ |
| Envoyer une notification école | ✅ | ❌ | ❌ | ❌ |
| Envoyer une notification de classe | ✅ | ✅ | ❌ | ❌ |
| Gérer les utilisateurs | ✅ | ❌ | ❌ | ❌ |

### 4.3 Authentification

- Inscription sur invitation uniquement (lien envoyé par la direction)
- Authentification par email + mot de passe
- Possibilité d'authentification via Google (OAuth2)
- Réinitialisation de mot de passe par email
- Sessions sécurisées avec expiration automatique

---

## 5. Exigences techniques

### 5.1 Type d'application

Application web progressive (**PWA — Progressive Web App**) :
- Accessible depuis un navigateur desktop et mobile
- Installable sur l'écran d'accueil d'un smartphone (Android et iOS) sans passer par un store
- Fonctionnement partiel hors-ligne (lecture du cache) pour les parents
- Notifications push via service workers

### 5.2 Stack technique recommandée

| Composant | Technologie proposée |
|---|---|
| Frontend | Next.js (React) + TypeScript |
| Styles | Tailwind CSS |
| Backend / API | Next.js API Routes ou Node.js (Express/Fastify) |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Authentification | NextAuth.js ou Auth.js |
| Stockage fichiers | Amazon S3 ou équivalent (Cloudflare R2, Supabase Storage) |
| Notifications push | Web Push API (service worker) |
| Hébergement | Vercel, Railway ou VPS dédié |

### 5.3 Import de fichiers

- Parsing PDF : librairie `pdf-parse` ou `pdfjs-dist`
- Parsing Excel/CSV : librairie `xlsx` (SheetJS)
- Validation des données côté serveur avant persistence

### 5.4 Performance et disponibilité

- Temps de chargement initial < 3 secondes sur connexion 4G
- Disponibilité cible : 99,5 % (hors maintenance planifiée)
- Sauvegarde automatique quotidienne de la base de données

---

## 6. Sécurité et conformité

### 6.1 Protection des données personnelles (RGPD)

- Les données des élèves sont des données sensibles (mineurs) — conformité RGPD obligatoire
- Recueil du consentement explicite des parents lors de l'inscription
- Droit à l'effacement : toute fiche élève peut être supprimée à la demande
- Les données ne sont pas partagées avec des tiers
- Hébergement des données en Union Européenne

### 6.2 Sécurité applicative

- Toutes les communications chiffrées en HTTPS (TLS 1.2+)
- Mots de passe hachés (bcrypt)
- Protection CSRF sur tous les formulaires
- Validation stricte des entrées côté serveur (prévention injection SQL, XSS)
- Rate limiting sur les endpoints sensibles (login, import)
- Journaux d'accès (logs) horodatés pour les actions sensibles (modification de fiche, envoi de notification)

### 6.3 Cloisonnement des données

- Un parent ne peut accéder qu'aux données relatives à son propre enfant
- Un enseignant ne peut accéder qu'aux données de sa classe
- Isolation stricte entre les établissements si le système est multi-école à terme

---

## 7. Interface utilisateur

### 7.1 Principes directeurs

- Interface simple, accessible à des utilisateurs non techniques
- Design responsive (mobile-first)
- Accessibilité WCAG 2.1 niveau AA
- Support des navigateurs modernes (Chrome, Firefox, Safari, Edge — 2 dernières versions majeures)

### 7.2 Écrans principaux

**Pour l'administrateur (directrice)**
- Tableau de bord : récapitulatif de l'école (effectifs, classes, alertes)
- Page d'import : upload de fichier + prévisualisation + mapping
- Page de composition des classes : outil de répartition avec paramètres
- Annuaire élèves : liste filtrée et recherchable
- Fiche élève : affichage et édition
- Gestion des utilisateurs : liste des comptes parents et enseignants
- Envoi de notification globale

**Pour l'enseignant**
- Tableau de bord de la classe
- Liste des élèves de la classe
- Fiche de chaque élève de la classe
- Espace publication (fil d'actualité de la classe)
- Dépôt de documents

**Pour le parent**
- Accueil : fil d'actualité de la classe de son enfant
- Documents partagés
- Notifications reçues
- Fiche de son enfant (lecture seule)

---

## 8. Contraintes et hypothèses

- L'application est pensée pour une école de taille standard : 5 à 15 classes, 100 à 400 élèves
- Un élève ne peut être assigné qu'à une seule classe à la fois
- Une classe a obligatoirement un et un seul enseignant principal
- Les accompagnateurs (AESH) peuvent être partagés entre plusieurs classes
- L'accès parents est activé classe par classe, à la discrétion de la direction
- La gestion des notes est simplifiée (pas un remplacement d'un logiciel type Pronote ou EcoleDirecte)

---

## 9. Jalons envisagés

| Phase | Contenu | Durée estimée |
|---|---|---|
| Phase 1 — MVP | Import, fiches élèves, composition de classes, authentification | 6-8 semaines |
| Phase 2 — Communication | Espace classe, partage de documents, notifications | 4-6 semaines |
| Phase 3 — Affinements | RGPD, export, PWA, accessibilité, tests utilisateurs | 3-4 semaines |

---

## 10. Glossaire

| Terme | Définition |
|---|---|
| AESH | Accompagnant des Élèves en Situation de Handicap |
| PAI | Projet d'Accueil Individualisé (protocole médical scolaire) |
| PWA | Progressive Web App — application web installable sur mobile |
| RGPD | Règlement Général sur la Protection des Données |
| MVP | Minimum Viable Product — version minimale fonctionnelle |
