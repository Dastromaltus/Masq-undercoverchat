# Unified Creator View
**Unified Creator View** est une application web personnelle de *creator analytics* qui centralise les statistiques de plusieurs plateformes de création de contenu : Instagram, YouTube et TikTok.
Elle permet de suivre l’évolution de son audience, l’engagement, les vues et les performances des publications depuis une interface unique, moderne et responsive.
<img width="1401" height="900" alt="image" src="https://github.com/user-attachments/assets/2ae19410-a5e0-424d-a942-c2694733d381" />


## Fonctionnalités

- Tableau de bord unifié pour Instagram, YouTube et TikTok
- Suivi des abonnés, vues, interactions et croissance sur 30 jours
- Graphique d’évolution de l’audience avec filtres 7 jours, 30 jours, 90 jours et 1 an
- Tableau des publications avec plateforme, date, vues et interactions
- Historique des synchronisations et gestion des paramètres
- Interface SaaS sombre par défaut, avec thème clair disponible
- Design responsive adapté au mobile et à l’ordinateur

## Stack technique

- **Frontend** : React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend / Base de données** : Supabase
- **Architecture** : composants réutilisables, migrations SQL, types TypeScript
- **Sécurité** : Row Level Security (RLS), accès limité aux données de chaque utilisateur authentifié

## Approche des données

L’application est conçue pour distinguer clairement les données de démonstration des données réelles. Aucune statistique n’est présentée comme authentique sans synchronisation effective avec une plateforme.

Les intégrations OAuth ne sont pas encore implémentées, et aucune clé secrète n’est stockée dans le frontend.

## Live demo

👉 [Unified Creator View](https://unified-creator-view.lovable.app)
