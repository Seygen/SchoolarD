# Wireframes textuels — SchoolarD

**Version** : 1.0  
**Date** : Avril 2026  
**Convention** : `[ Bouton ]`  `< placeholder >`  `[x]` checkbox  `(•)` radio  `▼` dropdown

---

## INDEX DES ÉCRANS

| # | Écran | Rôle |
|---|---|---|
| 01 | Connexion | Tous |
| 02 | Vérification 2FA | Super Admin |
| 03 | Dashboard Super Admin | Super Admin |
| 04 | Créer un établissement | Super Admin |
| 05 | Dashboard école | Admin |
| 06 | Import — Étape 1 Upload | Admin |
| 07 | Import — Étape 2 Mapping | Admin |
| 08 | Import — Étape 3 Validation | Admin |
| 09 | Composition des classes | Admin |
| 10 | Annuaire élèves | Admin |
| 11 | Fiche élève | Admin / Enseignant |
| 12 | Notification école | Admin |
| 13 | Dashboard classe — Enseignant | Enseignant |
| 14 | Fil d'actualité — Nouvelle publication | Enseignant |
| 15 | Bibliothèque de documents | Enseignant |
| 16 | Accueil parent | Parent |
| 17 | Documents — vue parent | Parent |

---

## 01 — Connexion
> Commun à tous les rôles. Détection du rôle après authentification.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    🏫  SchoolarD                        │
│                                                         │
│          ┌───────────────────────────────┐              │
│          │  Adresse email                │              │
│          │  <votre@email.fr>             │              │
│          └───────────────────────────────┘              │
│                                                         │
│          ┌───────────────────────────────┐              │
│          │  Mot de passe                 │              │
│          │  <••••••••••>             👁  │              │
│          └───────────────────────────────┘              │
│                                                         │
│          [ Continuer                            ]        │
│                                                         │
│          ─────────────  ou  ─────────────               │
│                                                         │
│          [ G  Connexion avec Google             ]        │
│                                                         │
│          Mot de passe oublié ?                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> **Mobile** : même layout, pleine largeur, clavier numérique sur champ email.  
> **Erreur** : bandeau rouge sous le bouton « Email ou mot de passe incorrect ».

---

## 02 — Vérification 2FA
> Super Admin uniquement, après l'écran 01.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    🏫  SchoolarD                        │
│                                                         │
│          Vérification en deux étapes                    │
│          ─────────────────────────────                  │
│          Entrez le code affiché dans votre              │
│          application d'authentification.                │
│                                                         │
│          ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐         │
│          │ _ │ │ _ │ │ _ │  │ _ │ │ _ │ │ _ │         │
│          └───┘ └───┘ └───┘  └───┘ └───┘ └───┘         │
│                                                         │
│          [ Vérifier                             ]        │
│                                                         │
│          ← Retour à la connexion                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 03 — Dashboard Super Admin
> Vue globale de la plateforme. Accessible sur `admin.schoolard.fr`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏫 SchoolarD  /  Back-office                          [Admin: J.Martin ▼]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Tableau de bord plateforme                                              │
│  ──────────────────────────                                              │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Établissements │  │  Élèves total   │  │  Connexions 24h │         │
│  │                 │  │                 │  │                 │         │
│  │      24         │  │     3 840       │  │      217        │         │
│  │  ▲ +2 ce mois   │  │  ▲ +128        │  │                 │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  Établissements récents                    [ + Nouvel établissement ]   │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Nom                        Pays  Statut    Admins  Élèves  Créé le     │
│  ─────────────────────────────────────────────────────────────────────  │
│  École Jules Ferry Lyon      FR   ● Actif     1      284   12/01/2026   │
│  École Pasteur Bordeaux      FR   ● Actif     1      196   03/02/2026   │
│  École des Lilas Paris 20e   FR   ● Actif     2      412   14/02/2026   │
│  École Saint-Exupéry Nantes  FR   ⏸ Suspendu  1       98   01/03/2026  │
│                                                                          │
│  [ Voir tous les établissements ]                                        │
│                                                                          │
│  Journal d'audit récent                                                  │
│  ─────────────────────────────────────────────────────────────────────  │
│  2026-04-23 09:14  SUPERADMIN_ACCESS_TENANT  École Jules Ferry  J.Martin│
│  2026-04-22 17:32  SCHOOL_SUSPENDED           École St-Exupéry  J.Martin│
│  2026-04-21 11:05  SCHOOL_CREATED             École des Lilas   J.Martin│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 04 — Créer un établissement
> Modale ou page dédiée depuis le dashboard Super Admin.

```
┌──────────────────────────────────────────────────────────┐
│  Nouvel établissement                              [  ✕ ] │
│  ────────────────────────────────────────────────────── │
│                                                          │
│  Nom de l'école *                                        │
│  ┌──────────────────────────────────────────────┐       │
│  │ <École Jules Ferry>                          │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  Identifiant URL (slug) *                                │
│  ┌──────────────────────────────────────────────┐       │
│  │ <ecole-jules-ferry-lyon>                     │       │
│  └──────────────────────────────────────────────┘       │
│  schoolard.fr/ecole-jules-ferry-lyon                     │
│                                                          │
│  Pays *                                                  │
│  ┌──────────────────────────────────────────────┐       │
│  │ France                                      ▼│       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  Email du directeur / de la directrice *                 │
│  ┌──────────────────────────────────────────────┐       │
│  │ <directeur@ecole.fr>                         │       │
│  └──────────────────────────────────────────────┘       │
│  Un lien d'invitation sera envoyé à cette adresse.       │
│                                                          │
│  [ Annuler ]                  [ Créer et envoyer l'invitation ]│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 05 — Dashboard école (Admin / Directeur)
> Page d'accueil après connexion de la directrice.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏫 École Jules Ferry                                   [Directrice M. ▼]│
├────────────────┬─────────────────────────────────────────────────────────┤
│                │                                                         │
│  ☰ Navigation  │  Tableau de bord                                        │
│  ─────────     │  ───────────────                                        │
│                │                                                         │
│  🏠 Accueil    │  Année scolaire : 2025-2026  ▼          [ Nouvelle année]│
│                │                                                         │
│  👥 Élèves     │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│                │  │   Élèves     │ │   Classes    │ │  Enseignants │   │
│  🏫 Classes    │  │              │ │              │ │              │   │
│                │  │    284       │ │      10      │ │      12      │   │
│  👨‍🏫 Équipe     │  │  inscrits    │ │  constituées │ │              │   │
│                │  └──────────────┘ └──────────────┘ └──────────────┘   │
│  📂 Import     │                                                         │
│                │  ⚠️  Alertes                                            │
│  🔔 Notif.     │  ────────────────────────────────────────────          │
│                │  • Classe CP-B : aucun enseignant affecté               │
│  ⚙️  Réglages  │  • 3 élèves sans classe assignée                       │
│                │                                                         │
│                │  Classes — aperçu                [ Gérer les classes ]  │
│                │  ────────────────────────────────────────────          │
│                │                                                         │
│                │  Classe      Niveau  Enseignant        Élèves  AESH    │
│                │  ─────────────────────────────────────────────────     │
│                │  CP-A         CP    Mme Dupont          22/25   1      │
│                │  CP-B         CP    —  ⚠️               18/25   0      │
│                │  CE1-A        CE1   M. Bernard          24/25   1      │
│                │  CE1-B        CE1   Mme Martin          21/25   0      │
│                │  CE2          CE2   M. Leroy            23/25   2      │
│                │  CM1-A        CM1   Mme Blanc           25/25   1      │
│                │  ...                                                    │
│                │                                                         │
└────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 06 — Import — Étape 1 : Upload du fichier

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📂 Import de données                                                    │
│  ────────────────────                                                    │
│                                                                          │
│   ①  Upload   ──────  ②  Mapping   ──────  ③  Validation               │
│   ●                       ○                    ○                        │
│                                                                          │
│  Type de données à importer                                              │
│  (•) Élèves    ( ) Enseignants    ( ) Personnel (AESH)                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │                                                            │         │
│  │              📄  Glissez votre fichier ici                 │         │
│  │                                                            │         │
│  │              ou  [ Parcourir ]                             │         │
│  │                                                            │         │
│  │       Formats acceptés : .xlsx  .xls  .csv  .pdf           │         │
│  │       Taille max : 10 Mo                                   │         │
│  │                                                            │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  [ Annuler ]                                    [ Suivant → ]            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 07 — Import — Étape 2 : Mapping des colonnes

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📂 Import de données — Mapping                                          │
│                                                                          │
│   ①  Upload   ──────  ②  Mapping   ──────  ③  Validation               │
│       ✓                   ●                    ○                        │
│                                                                          │
│  Fichier : liste_eleves_2026.xlsx  —  247 lignes détectées               │
│                                                                          │
│  Associez les colonnes de votre fichier aux champs SchoolarD :           │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  Champ SchoolarD        Colonne dans votre fichier                       │
│  ─────────────────────────────────────────────────                      │
│  Prénom *               [ Prénom de l'élève            ▼ ]              │
│  Nom *                  [ NOM                          ▼ ]              │
│  Date de naissance      [ Date naissance               ▼ ]              │
│  Niveau *               [ Classe actuelle              ▼ ]              │
│  Genre                  [ Non mappé                    ▼ ]              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Aperçu (5 premières lignes)                            │            │
│  │  ─────────────────────────────────────────────────────  │            │
│  │  Prénom    Nom        Date nais.   Niveau               │            │
│  │  Emma      MARTIN     12/05/2018   CE1                  │            │
│  │  Lucas     BERNARD    03/11/2017   CE2                  │            │
│  │  Chloé     DUPONT     28/07/2018   CE1                  │            │
│  │  ...                                                    │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                          │
│  [ ← Retour ]                                   [ Valider le mapping → ]│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 08 — Import — Étape 3 : Validation et résultat

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📂 Import de données — Validation                                       │
│                                                                          │
│   ①  Upload   ──────  ②  Mapping   ──────  ③  Validation               │
│       ✓                   ✓                    ●                        │
│                                                                          │
│  Résultat de l'analyse                                                   │
│  ─────────────────────────────────────────────────────────────          │
│  ✅  231  lignes prêtes à importer                                       │
│  ⚠️    12  doublons détectés (déjà présents en base)                     │
│  ❌     4  erreurs à corriger                                             │
│                                                                          │
│  Erreurs (à corriger avant import)                                       │
│  ─────────────────────────────────────────────────────────────          │
│  Ligne 47  │ Date de naissance invalide : "32/13/2018"                   │
│  Ligne 89  │ Niveau inconnu : "CE3" — valeurs acceptées : CP CE1…        │
│  Ligne 112 │ Prénom manquant                                             │
│  Ligne 203 │ Date de naissance invalide : "—"                            │
│                                                                          │
│  Doublons (seront ignorés)                                               │
│  ─────────────────────────────────────────────────────────────          │
│  [x] Afficher les 12 doublons   ▼                                        │
│                                                                          │
│  [ ← Corriger le fichier ]        [ Importer 231 élèves valides → ]     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 09 — Composition des classes

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏫 Composition des classes — 2025-2026                                  │
│                                                                          │
│  Paramètres                           [ Répartir automatiquement ]      │
│  ───────────────────────────────────────────────────────────────────    │
│  Nombre de classes        [ 10    ]   Effectif max / classe  [ 25  ]    │
│  Équilibre filles/garçons  [x]        Tenir compte du niveau  [x]       │
│  Séparer les cas PAI       [x]                                          │
│                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ CP-A                     22/25 │  │ CP-B                     18/25 │ │
│  │ Enseignant : Mme Dupont   [▼]  │  │ Enseignant : — ⚠️         [▼]  │ │
│  │ AESH       : M. Rousseau  [▼]  │  │ AESH       : —            [▼]  │ │
│  │ ─────────────────────────────  │  │ ─────────────────────────────  │ │
│  │ ☰ Emma MARTIN        ♀  CP    │  │ ☰ Tom LEFEVRE        ♂  CP    │ │
│  │ ☰ Lucas BERNARD      ♂  CP    │  │ ☰ Léa SIMON          ♀  CP    │ │
│  │ ☰ Chloé DUPONT       ♀  CP    │  │ ☰ Hugo MOREAU        ♂  CP    │ │
│  │   ...  (+19)                   │  │   ...  (+15)                   │ │
│  └────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────┐                                      │
│  │  📦 Non assignés          3   │  ← glisser-déposer vers une classe   │
│  │  ─────────────────────────── │                                      │
│  │  ☰ Axel NGUYEN        ♂  CP  │                                      │
│  │  ☰ Inès KHALIL        ♀  CE1 │                                      │
│  │  ☰ Paul ROUX           ♂  CP  │                                      │
│  └────────────────────────────────┘                                      │
│                                                                          │
│  [ Annuler ]              [ Exporter PDF/Excel ]   [ Enregistrer ]      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

> **Interaction** : les cartes élèves sont glissables entre colonnes. Clic sur un élève ouvre sa fiche en panneau latéral.

---

## 10 — Annuaire élèves

```
┌──────────────────────────────────────────────────────────────────────────┐
│  👥 Élèves                                           [ + Ajouter ]      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  🔍 [ Rechercher un élève...                        ]                   │
│                                                                          │
│  Niveau ▼  │  Classe ▼  │  Statut ▼  │  AESH ▼                         │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Nom               Prénom    Niveau  Classe   AESH  Signalement         │
│  ─────────────────────────────────────────────────────────────────────  │
│  BERNARD           Lucas     CE2     CE2-A     —    —                   │
│  BLANC             Sophie    CM1     CM1-A     —    PAI ⚠️              │
│  DUPONT            Chloé     CE1     CE1-B     —    —                   │
│  KHALIL            Inès      CE1     —  ⚠️     ✓   —                   │
│  LEFEVRE           Tom       CP      CP-B      —    —                   │
│  MARTIN            Emma      CE1     CE1-A     —    —                   │
│  MOREAU            Hugo      CP      CP-B      —    —                   │
│  NGUYEN            Axel      CP      —  ⚠️     —    —                   │
│  ...                                                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│  Affichage 1-20 sur 284   [ ← ]  1  2  3 ... 15  [ → ]                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 11 — Fiche élève

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Annuaire    │  Emma MARTIN  —  CE1-A                  [ Modifier ]   │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌──────────┐  Nom          : MARTIN                                    │
│  │          │  Prénom       : Emma                                       │
│  │   Photo  │  Né(e) le     : 12/05/2018  (7 ans)                       │
│  │          │  Genre        : Féminin                                    │
│  └──────────┘  Niveau       : CE1                                        │
│                Classe       : CE1-A  —  Mme Dupont                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  Onglets :  Contacts  │  Médical  │  Observations  │  Docs   │       │
│  ├──────────────────────────────────────────────────────────────┤       │
│  │                                                              │       │
│  │  CONTACTS                                                    │       │
│  │  ────────────────────────────────────────────────────────   │       │
│  │  👩 Sophie MARTIN  (Mère)  📞 06 12 34 56 78                │       │
│  │     sophie.martin@email.fr   ✅ Autorisée à récupérer       │       │
│  │                                                              │       │
│  │  👨 Pierre MARTIN  (Père)  📞 06 98 76 54 32                │       │
│  │     p.martin@email.fr        ✅ Autorisé à récupérer        │       │
│  │                                                              │       │
│  │  [ + Ajouter un contact ]                                    │       │
│  │                                                              │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                          │
│                ┌────────────────────┐  ┌────────────────────┐           │
│                │  Onglet Médical    │  │  Onglet Observations│          │
│                │  ─────────────     │  │  ─────────────      │          │
│                │  Allergies : —     │  │  T1 2025-2026 :     │          │
│                │  PAI       : Non   │  │  "Emma fait preuve  │          │
│                │  AESH      : Non   │  │   de sérieux..."    │          │
│                │  Soutien   : Ortho │  │  — Mme Dupont       │          │
│                └────────────────────┘  └────────────────────┘           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 12 — Envoi d'une notification école

```
┌────────────────────────────────────────────────────────────┐
│  🔔 Nouvelle notification                          [  ✕ ] │
│  ──────────────────────────────────────────────────────── │
│                                                            │
│  Destinataires                                             │
│  (•) Toute l'école   ( ) Une classe spécifique             │
│                                                            │
│  Type d'événement                                          │
│  ┌────────────────────────────────────────────────┐       │
│  │ Absence d'enseignant                          ▼│       │
│  └────────────────────────────────────────────────┘       │
│  Absence enseignant / Grève / Fermeture / Autre            │
│                                                            │
│  Titre *                                                   │
│  ┌────────────────────────────────────────────────┐       │
│  │ <Absence Mme Dupont — Vendredi 25 avril>       │       │
│  └────────────────────────────────────────────────┘       │
│                                                            │
│  Message *                                                 │
│  ┌────────────────────────────────────────────────┐       │
│  │ Mme Dupont sera absente vendredi 25 avril.     │       │
│  │ La classe CP-A sera prise en charge par M.     │       │
│  │ Bernard. Les horaires sont inchangés.          │       │
│  └────────────────────────────────────────────────┘       │
│                                                            │
│  [ Annuler ]                    [ Envoyer la notification ]│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 13 — Dashboard classe (Enseignant)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏫 École Jules Ferry               CE1-A               [Mme Dupont ▼]  │
├────────────────┬─────────────────────────────────────────────────────────┤
│                │                                                         │
│  Ma classe     │  CE1-A  —  22 élèves                                   │
│  ───────       │  ────────────────────────────────────────────────────  │
│                │                                                         │
│  📋 Élèves     │  ┌──────────────┐  ┌──────────────┐                   │
│                │  │   Élèves     │  │  Signalements│                   │
│  📣 Actualité  │  │    22        │  │    3         │                   │
│                │  │  dont 1 AESH │  │  PAI, Ortho  │                   │
│  📂 Documents  │  └──────────────┘  └──────────────┘                   │
│                │                                                         │
│  🔔 Notifier   │  Dernières publications                                 │
│                │  ────────────────────────────────────────────────────  │
│                │  📣  Devoirs semaine du 28 avril          23/04 09:00  │
│                │      "Lecture p.34-36, calcul mental..."               │
│                │                                                         │
│                │  📣  Sortie musée — autorisation          18/04 14:30  │
│                │      "Merci de retourner le bon signé..." 💬 4         │
│                │                                                         │
│                │  [ + Nouvelle publication ]                             │
│                │                                                         │
│                │  Mes élèves                     [ Voir tous ]           │
│                │  ────────────────────────────────────────────────────  │
│                │  Emma MARTIN  ·  Chloé DUPONT  ·  Lucas BERNARD  +19   │
│                │                                                         │
└────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 14 — Nouvelle publication (Enseignant)

```
┌────────────────────────────────────────────────────────────┐
│  📣 Nouvelle publication — CE1-A                   [  ✕ ] │
│  ──────────────────────────────────────────────────────── │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │  <Écrivez votre message pour les parents...>       │   │
│  │                                                    │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Pièces jointes                                            │
│  ┌─────────────────────────────────────────────────┐      │
│  │  📎 Ajouter un fichier  (PDF, image, audio, vidéo)│     │
│  └─────────────────────────────────────────────────┘      │
│                                                            │
│  Options                                                   │
│  [x] Autoriser les commentaires des parents                │
│  [ ] Notification push aux parents                         │
│                                                            │
│  [ Annuler ]                          [ Publier ]          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 15 — Bibliothèque de documents (Enseignant)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📂 Documents — CE1-A                              [ + Ajouter ]        │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  🔍 [ Rechercher un document...          ]                               │
│                                                                          │
│  📁 Français             📁 Mathématiques         📁 Arts & Musique     │
│  ──────────────────      ──────────────────       ──────────────────    │
│  📄 Lecture_sem18.pdf    📄 Calcul_mental.pdf      🎵 Chanson_mai.mp3   │
│  🖼️  Alphabet_images.png  📄 Geom_formes.pdf       🖼️  Dessin_guide.jpg  │
│  📄 Dictée_mots.pdf                                                      │
│                                                                          │
│  📁 Sorties & Événements                                                 │
│  ──────────────────────────────────────────────                         │
│  📄 Autorisation_musee_avril.pdf        Ajouté le 18/04 — Mme Dupont    │
│  📄 Programme_fete_ecole.pdf            Ajouté le 10/04 — Direction     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 16 — Accueil parent (mobile-first)

```
  ┌─────────────────────────────┐
  │  🏫 SchoolarD         🔔 2  │
  │  CE1-A  —  Emma MARTIN      │
  ├─────────────────────────────┤
  │                             │
  │  📣 Devoirs — sem. 28 avril │
  │  Mme Dupont · il y a 2h     │
  │  ─────────────────────────  │
  │  Lecture pages 34 à 36.     │
  │  Calcul mental fiche n°12.  │
  │                             │
  │  📎 Fiche_calcul_12.pdf     │
  │                             │
  │  💬 Commenter               │
  │                             │
  ├─────────────────────────────┤
  │                             │
  │  📣 Sortie musée — autoris. │
  │  Mme Dupont · il y a 5j     │
  │  ─────────────────────────  │
  │  Merci de retourner le bon  │
  │  signé avant le 25 avril.   │
  │                             │
  │  📎 Autorisation_musee.pdf  │
  │                             │
  │  💬 4 commentaires  ▼       │
  │                             │
  ├─────────────────────────────┤
  │  🏠      📂      🔔      👤 │
  └─────────────────────────────┘
```

> **Navigation bas de page** : Accueil · Documents · Notifications · Profil enfant

---

## 17 — Documents — vue parent (mobile)

```
  ┌─────────────────────────────┐
  │  ← Documents   CE1-A        │
  ├─────────────────────────────┤
  │                             │
  │  📁 Français                │
  │  ─────────────────────────  │
  │  📄 Lecture_sem18.pdf       │
  │     Ajouté le 22/04    ↓   │
  │                             │
  │  📄 Dictée_mots.pdf         │
  │     Ajouté le 15/04    ↓   │
  │                             │
  │  📁 Mathématiques           │
  │  ─────────────────────────  │
  │  📄 Calcul_mental.pdf       │
  │     Ajouté le 22/04    ↓   │
  │                             │
  │  📁 Arts & Musique          │
  │  ─────────────────────────  │
  │  🎵 Chanson_mai.mp3         │
  │     Ajouté le 20/04    ▶   │
  │                             │
  │  📁 Sorties & Événements    │
  │  ─────────────────────────  │
  │  📄 Autorisation_musee.pdf  │
  │     Ajouté le 18/04    ↓   │
  │                             │
  ├─────────────────────────────┤
  │  🏠      📂      🔔      👤 │
  └─────────────────────────────┘
```

---

## Notes transversales sur l'UI

### Responsive
- **Mobile** (< 768px) : navigation en barre basse, contenu pleine largeur, sidebar masquée
- **Tablette** (768–1024px) : sidebar rétractable, grille 2 colonnes
- **Desktop** (> 1024px) : sidebar fixe, grille 3+ colonnes

### Codes couleur (à définir en design)
- `● Actif` → vert
- `⏸ Suspendu` → orange
- `⚠️` → jaune / orange
- `❌ Erreur` → rouge
- Rôle Admin → interface sobre, ton professionnel
- Rôle Parent → interface épurée, accent chaleureux

### Accessibilité
- Tous les boutons d'action ont un label explicite (pas d'icône seule)
- Contrastes WCAG 2.1 AA sur texte et boutons
- Navigation clavier complète
