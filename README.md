# Whisper Mask Chat

Crée une application web mobile-first appelée « Masq », disponible en français et en anglais.

OBJECTIF

Masq permet :
- De recevoir des messages dont l’identité de l’expéditeur n’est pas affichée au destinataire.
- De partager des questions, réponses et résultats de sondages dans les stories Instagram.
- De créer des sondages avec votes individuels masqués.
- De participer à des canaux privés sous pseudonyme.
- De demander à un expéditeur de révéler volontairement son profil.

Construis un MVP fonctionnel, pas seulement une landing page. Les fonctionnalités réellement implémentées doivent fonctionner avec des données persistantes. Identifie clairement les fonctionnalités qui nécessitent une intégration ou une configuration supplémentaire.

1. DESIGN ET EXPÉRIENCE UTILISATEUR

Créer une interface :
- Mobile-first, responsive et accessible.
- Moderne, sobre et sociale.
- Avec un thème sombre, des accents violets et des cartes arrondies.
- Avec des états de chargement, des états vides et des messages d’erreur utiles.
- Avec une navigation mobile : Accueil, Messages, Sondages, Canaux, Profil.
- Avec un sélecteur FR/EN et tous les textes regroupés dans des fichiers de traduction.

Ne pas afficher de statistiques commerciales, témoignages ou utilisateurs fictifs comme s’ils étaient réels.

2. POSITIONNEMENT ET CONFIDENTIALITÉ

Utiliser la promesse :
« Pose tes questions librement. Partage les réponses. Révèle ton profil uniquement quand tu le décides. »

Ne jamais promettre un anonymat absolu si la plateforme conserve des données permettant de relier un message à un compte.

Afficher clairement :
« Votre identité n’est pas affichée aux autres utilisateurs. La plateforme traite certaines données pour fournir le service et prévenir les abus. »

Lancement réservé aux personnes de 18 ans et plus :
- Ajouter une déclaration d’âge à l’inscription.
- Ne pas présenter cette déclaration comme une vérification d’identité ou d’âge fiable.
- Prévoir une architecture permettant d’ajouter ultérieurement un service de vérification adapté.
- Ne pas collecter de pièce d’identité dans le MVP.

3. AUTHENTIFICATION ET PROFILS

Utiliser Supabase pour l’authentification et la base de données, si disponible dans le projet.

Prévoir :
- Inscription et connexion par email.
- Vérification de l’email.
- Réinitialisation du mot de passe.
- Déconnexion.
- Profil avec pseudo, avatar facultatif, bio et lien Instagram facultatif.
- Paramètres de confidentialité.
- Export et suppression du compte.
- Pseudo public unique et URL publique du type /u/pseudo.

Ne pas rendre public l’email, l’identifiant interne du compte ni les données techniques.

L’authentification doit être requise pour envoyer des messages, voter et participer aux canaux dans le MVP. Expliquer que le compte de l’expéditeur reste masqué au destinataire.

4. BOÎTE DE MESSAGES

Chaque utilisateur dispose :
- D’un lien personnel partageable.
- D’une question d’accueil personnalisable.
- D’une boîte de réception privée.
- D’un bouton permettant de suspendre la réception.

Fonctions :
- Envoyer un message texte.
- Lire, archiver et supprimer un message.
- Filtrer : nouveaux, archivés, en attente de modération.
- Répondre à un message.
- Préparer une carte de partage à partir du message et de la réponse.
- Signaler un message.
- Bloquer l’auteur sans révéler son identité.
- Appliquer une limite de longueur et des quotas configurables.

Ne pas autoriser les pièces jointes dans le MVP.

À l’envoi, proposer deux modes :

A. « Identité masquée, sans demande de révélation »
Le destinataire ne peut pas demander à voir le profil pour ce message.

B. « Identité masquée, avec révélation possible »
L’expéditeur accepte de recevoir une demande de présentation, mais son profil reste caché tant qu’il n’a pas accepté cette demande.

Le mode A doit être sélectionné par défaut.

5. RÉVÉLATION CONSENTIE DU PROFIL

Implémenter un workflow explicite :

1. Le destinataire clique sur « Demander une présentation ».
2. Vérifier côté serveur que le message autorise les demandes.
3. L’expéditeur reçoit une demande.
4. Il accepte ou refuse.
5. En cas d’acceptation, montrer un aperçu des champs qu’il s’apprête à partager.
6. Révéler uniquement les champs sélectionnés et approuvés, uniquement au destinataire concerné.

Champs possibles :
- Pseudo Masq.
- Avatar.
- Bio.
- Lien Instagram volontairement renseigné.

Ne jamais :
- Déduire un compte Instagram.
- Afficher une identité civile.
- Révéler une adresse email, une adresse IP ou une localisation.
- Révéler un profil sur la seule base d’un paiement.
- Donner des indices d’identité sans consentement.

Limiter les demandes répétées et permettre de les désactiver.

Prévoir une révocation de l’accès futur au profil partagé. Expliquer qu’elle ne peut pas effacer une information déjà vue ou capturée par le destinataire.

6. SONDAGES

Permettre de :
- Créer une question.
- Ajouter de 2 à 6 réponses.
- Choisir vote unique ou choix multiples.
- Définir une date de fermeture.
- Choisir quand les résultats deviennent visibles.
- Partager un lien.
- Voir les résultats agrégés.
- Générer une carte partageable des résultats.

Stocker les votes de manière sécurisée :
- Les participants et le créateur ne doivent pas accéder aux identités des votants.
- Empêcher plusieurs bulletins pour un même compte et un même sondage.
- Pour le choix multiple, stocker plusieurs choix dans un seul bulletin.
- Ne pas présenter ce mécanisme comme une garantie « une personne réelle = un vote ».

Ne pas proposer de révélation payante de l’identité des votants.

7. CANAUX PRIVÉS

Créer des canaux :
- Accessibles sur invitation.
- Sans annuaire public dans le MVP.
- Avec nom, description et règles.
- Avec pseudonyme stable propre à chaque canal.
- Avec rôles : propriétaire, modérateur, membre.
- Avec messages texte en temps réel.
- Avec mode lent, signalement, exclusion et fermeture.

Le pseudonyme de canal ne doit pas afficher automatiquement le profil global.

Utiliser des liens d’invitation expirables et révocables.
Vérifier l’appartenance au canal côté serveur avant tout accès aux messages.
Ne pas inclure de messages privés entre membres dans cette première version.

8. PARTAGE INSTAGRAM

Créer un studio de cartes :
- Format story 1080 × 1920.
- Question seule.
- Message et réponse.
- Résultats de sondage.
- Plusieurs modèles visuels.
- Aperçu avant export.
- Téléchargement PNG.
- Copie du lien.
- Partage via les possibilités du navigateur lorsque disponibles.

Ajouter une aide :
« Téléchargez la carte, ajoutez-la à votre story Instagram, puis ajoutez votre lien. »

Ne pas prétendre publier automatiquement dans Instagram.
Ne pas demander les identifiants Instagram.
Ne pas présenter une intégration native comme fonctionnelle si elle n’est pas implémentée.

Avant export, avertir l’utilisateur si le texte peut contenir des informations personnelles. Permettre de masquer ou modifier ces informations sur la carte sans modifier le message original.

9. ABONNEMENTS

Créer une page de tarification FR/EN avec les offres suivantes :

Gratuit :
- Messages avec quotas.
- Sondages simples.
- Partage avec la marque Masq.
- Blocage, signalement, confidentialité et suppression gratuits.

Plus — 4,99 €/mois :
- Personnalisation des cartes.
- Classement avancé des messages.
- Quotas supérieurs.
- Demandes de présentation pour les messages compatibles, toujours avec accord de l’expéditeur.

Creator — 12,99 €/mois :
- Statistiques agrégées.
- Sondages avancés.
- Exports.
- Outils supplémentaires de gestion de communauté.

Community — 29,99 €/mois :
- Plusieurs administrateurs.
- Plusieurs canaux privés.
- Quotas supérieurs.

Les quotas doivent être configurables sans modifier le code.

Pour Stripe :
- Utiliser le mode test uniquement.
- Si Stripe n’est pas configuré, désactiver le paiement et afficher clairement cet état.
- Ne pas afficher un faux paiement réussi.
- Créer les sessions de paiement côté serveur.
- Vérifier la signature des webhooks.
- Rendre les traitements idempotents.
- Mettre à jour les droits premium uniquement après confirmation serveur.
- Prévoir un portail de gestion et résiliation de l’abonnement.
- Afficher clairement le montant, la devise et la fréquence de renouvellement.
- Ne pas activer de paiement réel sans configuration et validation supplémentaires.

Aucune fonction essentielle de sécurité ne doit être payante.

10. MODÉRATION ET PRÉVENTION DES ABUS

Prévoir :
- Signalement d’un message ou d’un membre.
- Blocage de l’auteur sans divulgation d’identité.
- Limitation des envois et des demandes de révélation côté serveur.
- Protection contre les envois automatisés.
- Statuts de contenu : publié, en attente, masqué, supprimé.
- File de traitement des signalements.
- Historique des décisions de modération.

Une éventuelle modération IA doit être encapsulée dans un service indépendant :
- Clé API uniquement côté serveur.
- Envoi du minimum de données nécessaire.
- Possibilité de revue humaine.
- Pas de promesse de détection parfaite.
- Si aucun fournisseur n’est configuré, indiquer que la modération IA n’est pas active.
- Prévoir des règles simples et une modération humaine sans prétendre qu’elles remplacent un système complet.

Ne jamais générer de faux messages présentés comme provenant de vrais utilisateurs.

11. BACK-OFFICE

Créer un espace administrateur protégé avec :
- Signalements.
- Contenus en attente.
- Suspensions et exclusions.
- Gestion des quotas.
- Statistiques agrégées.
- Suivi technique des abonnements.
- Journal des actions administratives.

Séparer les rôles d’utilisateur, de modérateur de canal et d’administrateur plateforme.

Les modérateurs de canal ne doivent pas avoir accès aux identités globales des participants.

Ne pas afficher systématiquement l’identité des expéditeurs aux administrateurs. Prévoir un accès restreint, justifié et journalisé lorsque nécessaire pour traiter un abus.

Les rôles privilégiés doivent être attribués uniquement par un mécanisme sécurisé côté serveur.

12. MODÈLE DE DONNÉES ET SÉCURITÉ

Prévoir les tables nécessaires, notamment :
- profiles
- inbox_settings
- messages
- message_sender_links
- message_replies
- reveal_requests
- reveal_grants
- polls
- poll_options
- poll_ballots
- poll_choices
- channels
- channel_members
- channel_messages
- invitations
- blocks
- reports
- moderation_actions
- subscriptions
- notifications
- audit_logs

Point critique :
La relation entre un message et son expéditeur ne doit jamais être envoyée au navigateur du destinataire avant une révélation autorisée.

Stocker cette relation séparément et protéger son accès.
Utiliser des vues ou endpoints qui ne retournent que les champs autorisés.
Ne pas compter sur le masquage d’un élément dans l’interface pour protéger une identité.

Implémenter :
- Row Level Security sur toutes les tables exposées.
- Contrôles d’autorisation côté serveur.
- Validation des entrées.
- Protection contre les contenus HTML ou scripts injectés.
- Gestion sécurisée des secrets.
- Contrôles d’accès aux fichiers.
- Liens d’invitation stockés sous forme sécurisée.
- Politique de conservation documentée et configurable.
- Absence de contenu privé dans les logs techniques ordinaires.

Aucune clé service-role ni clé secrète Stripe ou IA ne doit être exposée au client.

13. PAGES

Créer :
- Landing page.
- Connexion et inscription.
- Tableau de bord.
- Profil public et formulaire d’envoi.
- Boîte de réception.
- Détail d’un message.
- Demandes de présentation.
- Création et consultation de sondage.
- Liste et détail des canaux.
- Studio de partage.
- Tarification.
- Paramètres.
- Sécurité et confidentialité.
- Aide et signalement.
- Back-office.

Préparer des pages de mentions légales, confidentialité et conditions d’utilisation comme brouillons clairement signalés « à faire valider ». Ne pas inventer d’entreprise, d’adresse légale ni affirmer que l’application est conforme ou certifiée.

14. ORDRE DE CONSTRUCTION

Construire progressivement :

Phase 1 :
Authentification, profils, messages, protection de l’identité, blocage et signalement.

Phase 2 :
Sondages et cartes de partage.

Phase 3 :
Demandes de présentation consenties et abonnements en mode test.

Phase 4 :
Canaux privés et back-office complet.

Ne pas sacrifier les contrôles de sécurité pour ajouter plus de fonctionnalités.

15. TESTS D’ACCEPTATION

Vérifier notamment :
- Un destinataire ne peut pas retrouver l’expéditeur dans les réponses API, les abonnements temps réel ou les fichiers exportés.
- Un abonné payant ne peut pas révéler un profil sans accord.
- Un utilisateur ne peut pas lire la boîte privée d’un autre.
- Un non-membre ne peut pas lire un canal.
- Un membre ne peut pas s’attribuer un rôle supérieur.
- Les votes individuels ne sont pas accessibles au créateur.
- Les limites d’envoi sont appliquées côté serveur.
- Un webhook non signé ne modifie aucun abonnement.
- Les contenus privés ne sont pas indexables publiquement.
- Les liens publics n’affichent pas accidentellement les réponses reçues.

Si un test ne peut pas être exécuté, le signaler au lieu d’affirmer qu’il a réussi.

LIVRABLE

À la fin de chaque phase :
- Résumer ce qui fonctionne.
- Lister les intégrations non configurées.
- Indiquer les limites de sécurité et de modération.
- Fournir les étapes de test.
- Séparer clairement les données de démonstration des données réelles.

Commence par proposer brièvement l’architecture, puis implémente la phase 1.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://whisper-mask-chat.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a4bb32ba-6624-41d3-b412-22bd033a9319).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
