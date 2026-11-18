# 🛡️ VGuard — Gestionnaire de Mots de Passe & 2FA (TOTP)

**VGuard** est une suite de sécurité moderne et ultra-sécurisée comprenant :
1. Une **application desktop** conçue avec **Electron**, **React 19**, **TypeScript** et **Tailwind CSS**.
2. Une **extension navigateur Chrome (Manifest V3)** avec communication locale sécurisée (**Native Messaging**) pour l'**auto-remplissage des formulaires** et l'injection des codes 2FA.

---

## 🔒 Architecture de Sécurité (Zero-Knowledge)

- **Dérivation de clé (KDF)** : `Argon2id` (64 MB de mémoire vive, 3 itérations, 4 threads en parallèle) résistant aux attaques GPU/ASIC.
- **Chiffrement du coffre** : `AES-256-GCM` (Galois/Counter Mode) avec IV aléatoire de 96 bits unique pour chaque écriture et tag d'authentification de 128 bits empêchant toute altération de données.
- **Communication Extension ↔ Desktop** : Protocole officiel **Chrome Native Messaging** via `stdin`/`stdout` connecté à un socket local Unix (`/tmp/vguard-$USER.sock`, permissions `0600`). **Zéro port réseau ouvert**, aucun serveur HTTP exposé.
- **Isolation des processus** : Le Renderer React est cloisonné (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`).
- **Effacement de la mémoire** : La clé maître est écrasée en mémoire vive (`Buffer.fill(0)`) dès le verrouillage.
- **Auto-verrouillage** : Verrouillage automatique configurable après inactivité (1, 5, 15, 30 min).
- **Presse-papier sécurisé** : Nettoyage automatique du presse-papier après 30 secondes pour éviter les fuites.

---

## 🚀 Fonctionnalités Clés

### 🔑 Gestionnaire Desktop
- Stockage chiffré des identifiants (Titre, Nom d'utilisateur, Email, Mot de passe, URL, Catégorie, Notes).
- Copie en 1 clic de l'identifiant et du mot de passe avec masque de sécurité.
- Affichage/masquage dynamique du mot de passe.
- Système de favoris et catégorisation (Personnel, Travail, Finance, Réseaux sociaux).
- Recherche instantanée multi-champs.
- Authentificateur 2FA (TOTP) conforme RFC 6238 avec jauge circulaire temps réel et alerte rouge (< 5s).
- Scanner de QR Code temps réel via webcam ou image locale.
- Exportation JSON / CSV et Importation.

### 🧩 Extension Navigateur (Phase 2)
- **Auto-remplissage intelligent** : Détecte les formulaires de connexion et injecte les identifiants en 1 clic via le badge VGuard.
- **Compatible SPA** : Déclenche les événements natifs DOM (`input`, `change`) compatibles React, Vue et Angular.
- **Support 2FA / OTP** : Remplit ou copie instantanément le code TOTP correspondant au domaine actif.
- **Proposition d'enregistrement** : Propose d'ajouter un nouveau mot de passe au coffre lors de la soumission d'un formulaire.
- **Popup VGuard** : Interface rapide dans le navigateur avec recherche, comptes du domaine actif et générateur instantané de mot de passe.

---

## 🛠️ Démarrage Rapide

### Prérequis
- **Node.js** v20+ ou v22+
- **npm** v10+
- Un navigateur basé sur Chromium (**Google Chrome**, **Brave**, **Edge**, **Chromium**)

### Installation des dépendances
```bash
cd 2FA_Manager
npm install
```

### Lancer la suite de tests automatisés (Crypto + Vault + Native Messaging)
```bash
npm test
```

### Lancer l'application Desktop
```bash
npm run dev
```

---

## 🧩 Installer l'Extension Chrome

### 1. Enregistrer l'hôte Native Messaging sur votre système (à faire une fois)
```bash
npm run setup:extension
```
Cette commande configure automatiquement les fichiers de liaison dans `~/.config/google-chrome/NativeMessagingHosts/` (ainsi que pour Brave, Chromium et Edge).

### 2. Compiler l'extension
```bash
npm run build:extension
```

### 3. Charger l'extension dans votre navigateur
1. Ouvrez votre navigateur et rendez-vous sur `chrome://extensions/` (ou `brave://extensions/`).
2. Activez le **Mode développeur** (interrupteur en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée**.
4. Sélectionnez le dossier :
   ```text
   /home/hoby/Documents/Projet-dev/App/2FA_Manager/dist/extension
   ```
5. L'icône VGuard apparaît dans votre barre d'extensions !
