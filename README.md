<div align="center">
  <img src="https://files.catbox.moe/7euvhs.jpg" alt="NOX FREE MINI BOT" width="180">

  # NOX FREE MINI BOT

  [![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)](https://github.com/Nox-Primeee/NOXFREEMINIBOT/releases)
  [![Licence](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-green?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
  [![Baileys](https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
  [![Guide Heroku Node.js](https://img.shields.io/badge/Heroku-Node.js%20guide-79589F?style=for-the-badge&logo=heroku&logoColor=white)](https://devcenter.heroku.com/articles/deploying-nodejs)

  <p><strong>Bot WhatsApp multi-appareils en Node.js, avec jumelage par code et sessions persistées dans MongoDB.</strong></p>
</div>

## À propos

NOX FREE MINI BOT est un bot WhatsApp multi-appareils basé sur [Baileys](https://github.com/WhiskeySockets/Baileys). Le projet comprend une page web de jumelage, une API Express et un stockage MongoDB pour les sessions et les données associées.

### Fonctions principales

- Jumelage d’un compte WhatsApp à l’aide d’un code depuis la page web du bot.
- Restauration des sessions enregistrées dans MongoDB après redémarrage.
- Commandes d’information et d’état, dont `menu`, `ping`, `alive` et `info`.
- Outils médias et téléchargement, stickers, informations de profil et utilitaires.
- Outils de groupe et de modération, notamment anti-lien et actions d’administration.
- Personnalisation du nom, du pied de page et de certains messages du bot.

> Les commandes disponibles évoluent avec les plugins du dépôt. Consulte `menu` dans WhatsApp pour afficher le menu courant.

## Liens rapides

| Ressource | Lien |
| --- | --- |
| Code source | [GitHub — NOXFREEMINIBOT](https://github.com/Nox-Primeee/NOXFREEMINIBOT) |
| Dépendance WhatsApp | [Baileys — WhiskeySockets](https://github.com/WhiskeySockets/Baileys) |
| Environnement Node.js 24 | [Télécharger Node.js](https://nodejs.org/) |
| Base de données | [Créer/configurer MongoDB Atlas](https://www.mongodb.com/atlas) |
| Guide Heroku | [Déployer une application Node.js](https://devcenter.heroku.com/articles/deploying-nodejs) |
| Configuration Heroku | [Référence du manifeste `app.json`](https://devcenter.heroku.com/articles/app-json-schema) |

Après le déploiement, ouvre l’URL publique de ton service pour accéder à la page de jumelage. L’endpoint `/ping` permet de vérifier que le serveur répond.

## Prérequis

- Node.js **24.x** et npm (version précisée dans `package.json`).
- Une base MongoDB accessible depuis l’hébergement, par exemple MongoDB Atlas.
- Un hébergement ou serveur Node.js qui peut exécuter `npm start` et fournir la variable d’environnement `PORT` si nécessaire.
- Un compte WhatsApp à jumeler. Le jumelage doit être effectué par son propriétaire.

## Installation locale

```bash
git clone https://github.com/Nox-Primeee/NOXFREEMINIBOT.git
cd NOXFREEMINIBOT
npm install
cp .env.example .env
```

Modifie ensuite `.env` localement et renseigne au minimum `MONGODB_URI`. Ne colle pas une vraie URI de base de données dans le README, les issues ou les journaux et ne commite jamais `.env`.

```env
MONGODB_URI=
BOT_NAME="NOX FREE MINI BOT"
OWNER_NAME="NOX"
```

Lance le serveur :

```bash
npm start
```

Par défaut, le serveur écoute sur le port `8000`; la plupart des hébergeurs fournissent leur propre valeur via `PORT`.

## Configuration

Définis les variables dans le fichier `.env` en local ou dans le gestionnaire de variables/secrets de ton hébergeur. **Ne publie aucune valeur privée**.

| Variable | Requise | Utilité |
| --- | --- | --- |
| `MONGODB_URI` | Oui | URI de connexion à MongoDB. Le bot refuse de démarrer si elle est absente ou vide. |
| `BOT_NAME` | Non | Nom affiché par le bot et la page de jumelage. Défaut : `NOX FREE MINI BOT`. |
| `OWNER_NAME` | Non | Libellé du propriétaire affiché dans certaines informations. Défaut : `NOX`. |
| `OWNER_NUMBER` | Non, recommandé | Numéro WhatsApp du propriétaire au format international, pour les fonctions réservées au propriétaire. Configure-le dans les secrets de l’hébergement; aucune valeur personnelle n’est incluse ici. |
| `WORK_TYPE` | Non | Mode de fonctionnement : `public`, `private`, `group` ou `inbox`. Défaut : `public`. |
| `GROUP_INVITE_CODE` | Non | Code utilisé par la fonction d’auto-jonction à un groupe. La source contient aussi une valeur de repli : vérifie les réglages privés avant déploiement. Ne publie jamais ce code. |
| `BOT_FOOTER` | Non | Texte de pied de page des réponses. |
| `AUTO_STATUS_MSG` | Non | Texte associé au traitement automatique des statuts. |
| `ALIVE_IMG` | Non | URL de l’image utilisée par la commande d’état. |
| `LIVE_MSG` | Non | Texte de statut affiché par le bot. |
| `MENU_IMAGE_URL` | Non | URL de l’image du menu. |
| `DESCRIPTION` | Non | Courte description affichée dans le menu. |
| `REPO_URL` | Non | Lien affiché par la commande `repo`; tu peux le régler vers ce dépôt. |
| `PORT` | Fournie par l’hébergeur | Port HTTP d’écoute; valeur locale par défaut : `8000`. |
| `NODE_ENV` | Non | Peut être réglée sur `production` sur l’hébergement pour adapter le niveau de journalisation. |

Le préfixe de commande configuré dans le code est actuellement `.` (par exemple `.menu`). Le champ `PREFIX` présent dans le manifeste `app.json` n’est pas lu par la configuration d’exécution actuelle.

## Déploiement

Le dépôt contient un manifeste `app.json` et le script de démarrage `npm start`. **Attention :** le manifeste sélectionne le mode Heroku `container`, mais le dépôt ne contient pas de `Dockerfile`; le déploiement Heroku direct n’est donc pas documenté comme prêt à l’emploi ici. Il faudra valider/corriger la stratégie de build dans une modification distincte avant d’utiliser Heroku. Cette mise à jour reste limitée à la documentation et ne modifie ni le bot ni son manifeste.

Pour toute plateforme choisie, vérifie qu’elle prend en charge **Node.js 24.x**, lance `npm start`, fournit `PORT` et permet de définir les variables d’environnement requises — en particulier `MONGODB_URI` — dans son espace de secrets avant le démarrage.

Pour un autre hébergeur Node.js :

1. Crée un service depuis le dépôt GitHub.
2. Utilise `npm install` comme commande d’installation et `npm start` comme commande de démarrage.
3. Ajoute `MONGODB_URI` dans les variables secrètes du service; ajoute les variables optionnelles utiles à ton instance.
4. Déploie, puis ouvre l’URL publique pour accéder à la page de jumelage.

## Jumeler WhatsApp

1. Ouvre l’URL publique de ton bot dans un navigateur.
2. Saisis le numéro WhatsApp avec l’indicatif international demandé par la page et démarre le jumelage.
3. Sur le téléphone concerné, ouvre WhatsApp → **Appareils connectés** → **Connecter un appareil** → option de connexion avec un numéro de téléphone.
4. Saisis le code de jumelage affiché par la page.
5. Une fois connecté, envoie `.menu` au bot pour consulter les commandes.

Le code de jumelage et la session donnent accès au compte WhatsApp concerné : ne les partage pas et ne les publie pas.

## Vérification et dépannage

- Vérifie l’état du serveur avec `https://<URL-DE-TON-SERVICE>/ping`.
- Si le serveur ne démarre pas, vérifie que `MONGODB_URI` est renseignée et que la base autorise la connexion depuis l’hébergement.
- Si la page fonctionne mais qu’aucun code n’est généré, vérifie le numéro au format international, l’accès réseau du serveur et les journaux du déploiement.
- Après un redémarrage, vérifie l’accès à MongoDB : les données de session y sont restaurées.

## Sécurité

- Garde `.env`, `MONGODB_URI`, les identifiants d’administration, les codes de jumelage et les invitations WhatsApp hors du dépôt et des captures d’écran publiques.
- Donne au compte MongoDB uniquement les permissions nécessaires et limite l’accès réseau selon les possibilités de ton hébergeur.
- Ne déploie le bot que sur un compte et un numéro WhatsApp que tu es autorisé à gérer.
- Les fonctions de groupe/modération peuvent agir sur les groupes où le bot a les droits correspondants : configure et utilise-les avec le consentement des administrateurs concernés.

## Liens du développeur

[![Telegram](https://img.shields.io/badge/Telegram-@noxprimeeeinc-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/nox_chh)
[![Instagram](https://img.shields.io/badge/Instagram-@noxprimeeeinc-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/noxprimeeeinc)
[![Twitter/X](https://img.shields.io/badge/Twitter-@noxprimeeeinc-000000?style=for-the-badge&logo=x&logoColor=white)](https://twitter.com/noxprimeeeinc)
[![YouTube](https://img.shields.io/badge/YouTube-@noxprimeeeinc-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.com/@noxprimeeeinc)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbDIn9u47Xe6gf8JxP3c)
[![GitHub](https://img.shields.io/badge/GitHub-Nox--Primeee-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nox-Primeee)

---

<div align="center">
  <sub>© 2026 NOX PRIMEEE — NOX FREE MINI BOT</sub>
</div>
