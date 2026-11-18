#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// ID fixe de l'extension dérivé de la clé publique RSA
const EXTENSION_ID = 'pmakabljfmgbaiibhgggijgjccinjogb';
const HOST_NAME = 'com.vguard.autofill';

const hostScriptPath = path.resolve(__dirname, '../src/native-host/vguard-host.sh');

const manifestContent = {
  name: HOST_NAME,
  description: 'VGuard Password Manager Native Messaging Host',
  path: hostScriptPath,
  type: 'stdio',
  allowed_origins: [
    `chrome-extension://${EXTENSION_ID}/`,
  ],
};

const home = os.homedir();
const targetDirs = [
  path.join(home, '.config', 'google-chrome', 'NativeMessagingHosts'),
  path.join(home, '.config', 'chromium', 'NativeMessagingHosts'),
  path.join(home, '.config', 'BraveSoftware', 'Brave-Browser', 'NativeMessagingHosts'),
  path.join(home, '.config', 'microsoft-edge', 'NativeMessagingHosts'),
];

console.log('📦 Enregistrement de l\'hôte Native Messaging pour VGuard...');
console.log(`Chemin de l'exécutable : ${hostScriptPath}`);
console.log(`ID Extension autorisé : ${EXTENSION_ID}\n`);

let installedCount = 0;

for (const dir of targetDirs) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const targetFile = path.join(dir, `${HOST_NAME}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(manifestContent, null, 2), { mode: 0o644 });
    console.log(`✅ Installé dans : ${targetFile}`);
    installedCount++;
  } catch (err) {
    // Si le dossier n'est pas accessible ou absent
  }
}

if (installedCount > 0) {
  console.log(`\n🎉 Hôte Native Messaging configuré avec succès pour ${installedCount} navigateur(s) !`);
} else {
  console.warn('⚠️ Aucun répertoire de navigateur trouvé.');
}
