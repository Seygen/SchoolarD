Document de spécification complet couvrant :

Contexte : plateforme SaaS multi-établissements pour directeurs et directrices d'écoles primaires
10 modules fonctionnels : import PDF/Excel, composition de classes, fiches élèves, espace classe, partage de documents, notifications push, gestion des accès
Algorithme de répartition des classes : mode automatique, manuel et mixte ; effectif max configurable ; affectation obligatoire d'un enseignant, optionnelle d'un AESH
Suivi élève simplifié : appréciations texte par période, signalements médicaux (PAI), coordonnées — pas de notes chiffrées (non-concurrent de Pronote)
Espace classe façon fil d'actualité : publications, commentaires parents activables/désactivables, partage de fichiers (PDF, images, audio, vidéo) ciblé par classe ou école
Notifications push : grèves, absences enseignant, incidents, ciblage classe ou école entière
5 rôles : Super Admin (plateforme), Admin/Directeur, Enseignant, Parent, Élève (≥ 13 ans avec vérification d'âge RGPD)
Architecture multi-tenant : isolation par school_id sur toutes les tables, ajout d'une école sans déploiement, versioning API
Sécurité & RGPD : HTTPS, bcrypt, CSRF, rate limiting, hébergement UE, droit à l'effacement
3 phases de développement estimées (MVP → Communication → Affinements)
DATABASE_SCHEMA.md
Schéma PostgreSQL complet avec DDL — 21 tables :

Groupe	Tables
Plateforme	super_admins, schools
Utilisateurs	users
Élèves	students, student_contacts, student_medical, student_observations, parent_student_links
Personnel	staff_members
Classes	academic_years, classes, class_enrollments, class_teachers, class_staff
Espace classe	posts, post_attachments, post_comments, document_folders, documents
Infra	notifications, notification_reads, import_jobs, audit_logs
Décisions d'architecture notables :

UUID v4 pour toutes les PKs (pas d'entier auto-incrémenté — prévient la prédictibilité des URLs)
Élèves ≠ comptes utilisateurs : un élève primaire est une entité students sans compte ; les parents sont des users liés via parent_student_links — évite les comptes fictifs pour enfants de 6 ans
FK composites (id, school_id) : l'isolation multi-tenant est garantie au niveau base de données, pas seulement applicatif — un class_enrollment ne peut pas pointer vers un student d'une autre école même par erreur
student_medical table séparée : les données médicales (PAI, allergies, traitements) sont isolées pour un contrôle d'accès renforcé et simplifier les exports RGPD
Soft deletes sur posts, documents et students (deleted_at TIMESTAMPTZ)
JSONB sur audit_logs.metadata et import_jobs.error_details pour flexibilité sans migration
