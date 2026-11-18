#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Compilation de l\'extension Chrome VGuard (Manifest V3)...');

const rootDir = path.resolve(__dirname, '..');
const distExtDir = path.join(rootDir, 'dist/extension');

// S'assurer que le dossier dist/extension existe
fs.mkdirSync(distExtDir, { recursive: true });

// 1. Build Vite
try {
  execSync('npx vite build --config vite.config.extension.mts', {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (e) {
  console.error('❌ Échec de la compilation Vite pour l\'extension');
  process.exit(1);
}

// 2. Copier manifest.json
fs.copyFileSync(
  path.join(rootDir, 'extension/manifest.json'),
  path.join(distExtDir, 'manifest.json')
);

// 3. Copier content.css
fs.copyFileSync(
  path.join(rootDir, 'extension/src/content/content.css'),
  path.join(distExtDir, 'content.css')
);

// 4. Copier les icônes
const iconsSrc = path.join(rootDir, 'extension/icons');
const iconsDest = path.join(distExtDir, 'icons');
fs.mkdirSync(iconsDest, { recursive: true });

for (const file of fs.readdirSync(iconsSrc)) {
  fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDest, file));
}

console.log('\n✨ Extension compilée avec succès dans : dist/extension/');
console.log('👉 Pour l\'installer dans Chrome / Brave / Edge :');
console.log('   1. Ouvrez chrome://extensions/');
console.log('   2. Activez le "Mode développeur" (en haut à droite)');
console.log('   3. Cliquez sur "Charger l\'extension non empaquetée"');
console.log(`   4. Sélectionnez le dossier : ${distExtDir}\n`);
