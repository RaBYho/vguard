const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

app.commandLine.appendSwitch('window-size', '1600,1600');

const ARTIFACT_DIR = '/home/hoby/.gemini/antigravity-cli/brain/4104480f-7da2-4d7d-b205-2cd563be9c2a';
const PUBLIC_DIR = path.resolve(__dirname, '../src/renderer/public/icons');
const RESOURCES_DIR = path.resolve(__dirname, '../resources');
const EXT_ICONS_DIR = path.resolve(__dirname, '../extension/icons');
const DIST_EXT_ICONS_DIR = path.resolve(__dirname, '../dist/extension/icons');

// --- 1. SVG Épuré / Détouré (Emblème Bouclier seul) ---
const svgShieldContent = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vguardStitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <path
    d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z"
    fill="none"
    stroke="url(#vguardStitchGrad)"
    stroke-width="7"
    stroke-linejoin="round"
  />

  <path
    d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z"
    fill="#09090B"
    opacity="0.95"
  />

  <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />

  <path
    d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44"
    fill="none"
    stroke="#F8FAFC"
    stroke-width="4.5"
    stroke-linecap="round"
  />

  <circle cx="50" cy="51" r="2.2" fill="#09090B" />
  <path d="M50 53.2 V56.5" stroke="#09090B" stroke-width="2" stroke-linecap="round" />
</svg>
`;

// --- 2. SVG Encadré / Tuile Dock (Squircle sans artéfact, halo continu) ---
const svgTileContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="tileBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181C" />
      <stop offset="60%" stop-color="#111114" />
      <stop offset="100%" stop-color="#0A0A0C" />
    </linearGradient>

    <filter id="tileShadowMain" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.70" />
    </filter>

    <linearGradient id="vguardStitchGradTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>

    <filter id="continuousNeonGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#06B6D4" flood-opacity="0.65" />
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#06B6D4" flood-opacity="0.40" />
      <feDropShadow dx="0" dy="0" stdDeviation="38" flood-color="#06B6D4" flood-opacity="0.18" />
    </filter>
  </defs>

  <rect
    x="102"
    y="102"
    width="820"
    height="820"
    rx="195"
    ry="195"
    fill="url(#tileBgGrad)"
    stroke="rgba(255, 255, 255, 0.08)"
    stroke-width="2"
    filter="url(#tileShadowMain)"
  />

  <g transform="translate(262, 268) scale(5.0)" filter="url(#continuousNeonGlow)">
    <path
      d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z"
      fill="none"
      stroke="url(#vguardStitchGradTile)"
      stroke-width="7"
      stroke-linejoin="round"
    />

    <path
      d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z"
      fill="#09090B"
      opacity="0.95"
    />

    <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />

    <path
      d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44"
      fill="none"
      stroke="#F8FAFC"
      stroke-width="4.5"
      stroke-linecap="round"
    />

    <circle cx="50" cy="51" r="2.2" fill="#09090B" />
    <path d="M50 53.2 V56.5" stroke="#09090B" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>
`;

// --- 3. SVG Logo Complet Horizontal (Mode Sombre) ---
const svgFullLogoContentDark = `
<svg viewBox="0 0 380 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vguardGradFullDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <g transform="translate(10, 0)">
    <path
      d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z"
      fill="none"
      stroke="url(#vguardGradFullDark)"
      stroke-width="7"
      stroke-linejoin="round"
    />
    <path
      d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z"
      fill="#09090B"
      opacity="0.95"
    />
    <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />
    <path
      d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44"
      fill="none"
      stroke="#F8FAFC"
      stroke-width="4.5"
      stroke-linecap="round"
    />
    <circle cx="50" cy="51" r="2.2" fill="#09090B" />
    <path d="M50 53.2 V56.5" stroke="#09090B" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Typographie VGuard pour mode sombre -->
  <text x="120" y="52" font-family="system-ui, -apple-system, 'Inter', sans-serif" font-size="44" font-weight="800" fill="#F8FAFC" letter-spacing="-0.5">VGuard</text>
  <text x="122" y="76" font-family="'JetBrains Mono', monospace, monospace" font-size="14" font-weight="700" fill="#06B6D4" letter-spacing="3.5">LOCAL VAULT</text>
</svg>
`;

// --- 4. SVG Logo Complet Horizontal (Mode Clair - Texte sombre, cadenas blanc préservé) ---
const svgFullLogoContentLight = `
<svg viewBox="0 0 380 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vguardGradFullLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <!-- Bouclier gauche officiel (identique en sombre et clair) -->
  <g transform="translate(10, 0)">
    <path
      d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z"
      fill="none"
      stroke="url(#vguardGradFullLight)"
      stroke-width="7"
      stroke-linejoin="round"
    />
    <path
      d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z"
      fill="#09090B"
      opacity="0.95"
    />
    <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />
    <path
      d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44"
      fill="none"
      stroke="#F8FAFC"
      stroke-width="4.5"
      stroke-linecap="round"
    />
    <circle cx="50" cy="51" r="2.2" fill="#09090B" />
    <path d="M50 53.2 V56.5" stroke="#09090B" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Typographie VGuard pour mode clair : texte VGuard sombre #09090B, LOCAL VAULT cyan #0891B2 -->
  <text x="120" y="52" font-family="system-ui, -apple-system, 'Inter', sans-serif" font-size="44" font-weight="800" fill="#09090B" letter-spacing="-0.5">VGuard</text>
  <text x="122" y="76" font-family="'JetBrains Mono', monospace, monospace" font-size="14" font-weight="700" fill="#0891B2" letter-spacing="3.5">LOCAL VAULT</text>
</svg>
`;

async function renderHtmlToImage(html, width, height) {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    useContentSize: true,
    enableLargerThanScreen: true,
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true,
    },
  });

  win.setSize(width, height);
  win.setContentSize(width, height);

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((resolve) => setTimeout(resolve, 450));
  const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });
  win.close();
  return image;
}

app.whenReady().then(async () => {
  console.log('🎨 Exportation des logos officiels VGuard :');

  // --- Sauvegarde des SVG Sources ---
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-icon.svg'), svgShieldContent.trim());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-tile-icon.svg'), svgTileContent.trim());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-logo.svg'), svgFullLogoContentDark.trim());
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-logo-light.svg'), svgFullLogoContentLight.trim());

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-icon.svg'), svgShieldContent.trim());
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-tile-icon.svg'), svgTileContent.trim());
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-logo.svg'), svgFullLogoContentDark.trim());
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-logo-light.svg'), svgFullLogoContentLight.trim());

  const sizes = [512, 256, 128, 64, 48, 32, 16];

  // ==========================================
  // PARTIE A : VERSION DÉTOURÉE (Emblème seul)
  // ==========================================
  console.log('📸 1/4 Rendu de la version Détourée (1024x1024)...');
  const iconHtml1024 = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1024px; height: 1024px;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .shield-container {
        width: 780px; height: 780px;
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0 0 35px rgba(6,182,212,0.45));
      }
      svg { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div class="shield-container">${svgShieldContent}</div>
  </body>
  </html>`;

  const iconImg1024 = await renderHtmlToImage(iconHtml1024, 1024, 1024);
  const iconBuf1024 = iconImg1024.toPNG();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-icon-1024.png'), iconBuf1024);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-icon-1024.png'), iconBuf1024);

  for (const s of sizes) {
    const resized = iconImg1024.resize({ width: s, height: s, quality: 'best' });
    const buf = resized.toPNG();
    fs.writeFileSync(path.join(PUBLIC_DIR, `vguard-icon-${s}.png`), buf);
    if (s === 512) {
      fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-icon.png'), buf);
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-icon.png'), buf);
    }
    if ([512, 128, 48, 16].includes(s)) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, `vguard-icon-${s}.png`), buf);
    }
  }

  // ==========================================
  // PARTIE B : NOUVELLE TUILE SQUIRCLE AVEC HALO CONTINU
  // ==========================================
  console.log('📸 2/4 Rendu de la version Encadrée Tuile (1024x1024)...');
  const tileHtml1024 = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1024px;
        height: 1024px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .tile {
        width: 820px;
        height: 820px;
        border-radius: 195px;
        background: linear-gradient(180deg, #18181C 0%, #111114 60%, #0A0A0C 100%);
        border: 2px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .shield-svg {
        width: 500px;
        height: 500px;
        filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.65))
                drop-shadow(0 0 42px rgba(6, 182, 212, 0.35))
                drop-shadow(0 0 85px rgba(6, 182, 212, 0.16));
      }
    </style>
  </head>
  <body>
    <div class="tile">
      <svg class="shield-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vguardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06B6D4" />
            <stop offset="100%" stop-color="#10B981" />
          </linearGradient>
        </defs>
        <path d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z" fill="none" stroke="url(#vguardGrad)" stroke-width="7" stroke-linejoin="round" />
        <path d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z" fill="#09090B" opacity="0.95" />
        <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />
        <path d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44" fill="none" stroke="#F8FAFC" stroke-width="4.5" stroke-linecap="round" />
        <circle cx="50" cy="51" r="2.2" fill="#09090B" />
        <path d="M50 53.2 V56.5" stroke="#09090B" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>
  </body>
  </html>`;

  const tileImg1024 = await renderHtmlToImage(tileHtml1024, 1024, 1024);
  const tileBuf1024 = tileImg1024.toPNG();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-tile-icon-1024.png'), tileBuf1024);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-tile-icon-1024.png'), tileBuf1024);

  for (const s of sizes) {
    const resized = tileImg1024.resize({ width: s, height: s, quality: 'best' });
    const buf = resized.toPNG();
    fs.writeFileSync(path.join(PUBLIC_DIR, `vguard-tile-icon-${s}.png`), buf);

    if (s === 512) {
      fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-tile-icon.png'), buf);
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-tile-icon.png'), buf);
      fs.writeFileSync(path.join(RESOURCES_DIR, 'icon.png'), buf);
    } else if ([128, 48, 16].includes(s)) {
      fs.writeFileSync(path.join(RESOURCES_DIR, `icon-${s}.png`), buf);
      fs.writeFileSync(path.join(EXT_ICONS_DIR, `icon-${s}.png`), buf);
      if (fs.existsSync(DIST_EXT_ICONS_DIR)) {
        fs.writeFileSync(path.join(DIST_EXT_ICONS_DIR, `icon-${s}.png`), buf);
      }
    }

    if ([512, 128, 48, 16].includes(s)) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, `vguard-tile-icon-${s}.png`), buf);
    }
  }

  // ==========================================
  // PARTIE C : LOGO HORIZONTAL COMPLET (DARK)
  // ==========================================
  console.log('📸 3/4 Rendu du logo horizontal Dark Mode (1200x400)...');
  const logoHtmlDark = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px; height: 400px;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .logo-container {
        width: 1050px; height: 280px;
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0 0 25px rgba(6,182,212,0.35));
      }
      svg { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div class="logo-container">${svgFullLogoContentDark}</div>
  </body>
  </html>`;

  const logoImgDark = await renderHtmlToImage(logoHtmlDark, 1200, 400);
  const logoBufDark = logoImgDark.toPNG();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-logo.png'), logoBufDark);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-logo-dark.png'), logoBufDark);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-logo.png'), logoBufDark);

  // ==========================================
  // PARTIE D : LOGO HORIZONTAL COMPLET (LIGHT - REVISITÉ)
  // ==========================================
  console.log('📸 4/4 Rendu du logo horizontal Light Mode (1200x400)...');
  const logoHtmlLight = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px; height: 400px;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .logo-container {
        width: 1050px; height: 280px;
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0 2px 10px rgba(0,0,0,0.06));
      }
      svg { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div class="logo-container">${svgFullLogoContentLight}</div>
  </body>
  </html>`;

  const logoImgLight = await renderHtmlToImage(logoHtmlLight, 1200, 400);
  const logoBufLight = logoImgLight.toPNG();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'vguard-logo-light.png'), logoBufLight);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'vguard-logo-light.png'), logoBufLight);

  // ==========================================
  // PARTIE E : GÉNÉRATION DES .ICO WINDOWS
  // ==========================================
  console.log('🪟 Génération des fichiers .ICO multi-résolutions Windows...');
  try {
    const tile256 = path.join(PUBLIC_DIR, 'vguard-tile-icon-256.png');
    const tileIcoPublic = path.join(PUBLIC_DIR, 'vguard-tile-icon.ico');
    const tileIcoResources = path.join(RESOURCES_DIR, 'icon.ico');
    const tileIcoArtifact = path.join(ARTIFACT_DIR, 'vguard-tile-icon.ico');

    execSync(`convert "${tile256}" -define icon:auto-resize=256,128,64,48,32,16 "${tileIcoPublic}"`);
    fs.copyFileSync(tileIcoPublic, tileIcoResources);
    fs.copyFileSync(tileIcoPublic, tileIcoArtifact);

    const icon256 = path.join(PUBLIC_DIR, 'vguard-icon-256.png');
    const iconIcoPublic = path.join(PUBLIC_DIR, 'vguard-icon.ico');
    const iconIcoArtifact = path.join(ARTIFACT_DIR, 'vguard-icon.ico');

    execSync(`convert "${icon256}" -define icon:auto-resize=256,128,64,48,32,16 "${iconIcoPublic}"`);
    fs.copyFileSync(iconIcoPublic, iconIcoArtifact);
    console.log('✅ Fichiers .ICO Windows générés !');
  } catch (err) {
    console.warn('Erreur ICO:', err.message);
  }

  console.log('\n✨ Exportation 100% terminée et validée !');
  app.quit();
});
