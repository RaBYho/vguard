/**
 * Tests de Sécurité - Validation, Assainissement & Défense contre le Dépassement de Capacité
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Charger les modules compilés
const {
  LIMITS,
  stripControlChars,
  sanitizeSingleLine,
  sanitizePassword,
  sanitizeMultiline,
  validateAndSanitizeUrl,
  validateAndSanitizeTotpSecret,
  validateMasterPassword,
  sanitizeSearchQuery,
} = require('../dist/shared/validation');

const { VaultManager } = require('../dist/main/vault/vault-manager');
const { generatePassword, evaluateStrength } = require('../dist/main/crypto/password-generator');

async function runSecurityTests() {
  console.log('\n🛡️  Démarrage des tests de sécurité et robustesse des formulaires...\n');

  // -------------------------------------------------------------
  // TEST 1 : Protection contre les octets nuls et caractères de contrôle
  // -------------------------------------------------------------
  console.log('1. Test de suppression des octets nuls et caractères de contrôle...');
  const maliciousInput = 'Compte\0Secret\x00\x08Admin\x1F\x7F';
  const cleanedSingle = sanitizeSingleLine(maliciousInput, 100);
  assert.strictEqual(cleanedSingle, 'CompteSecretAdmin', 'Les octets nuls et caractères de contrôle doivent être éradiqués');

  const notesWithNewlines = 'Ligne 1\nLigne 2\r\n\tTabulation\0Malicieux\x07';
  const cleanedNotes = sanitizeMultiline(notesWithNewlines, 5000);
  assert.strictEqual(cleanedNotes, 'Ligne 1\nLigne 2\r\n\tTabulationMalicieux', 'Les retours à la ligne doivent être préservés mais pas les octets nuls');
  console.log('   ✅ Octets nuls et caractères de contrôle neutralisés avec succès !');

  // -------------------------------------------------------------
  // TEST 2 : Bornage des longueurs (Protection Buffer Overflow / Bombing)
  // -------------------------------------------------------------
  console.log('2. Test de bornage strict des longueurs (Anti-Payload Bombing)...');
  const hugeString = 'A'.repeat(500000); // 500 Ko de payload
  const cappedTitle = sanitizeSingleLine(hugeString, LIMITS.TITLE_MAX);
  assert.strictEqual(cappedTitle.length, LIMITS.TITLE_MAX, `Le titre doit être tronqué à ${LIMITS.TITLE_MAX} caractères`);

  const cappedNotes = sanitizeMultiline(hugeString, LIMITS.NOTES_MAX);
  assert.strictEqual(cappedNotes.length, LIMITS.NOTES_MAX, `Les notes doivent être tronquées à ${LIMITS.NOTES_MAX} caractères`);

  const cappedPassword = sanitizePassword(hugeString, LIMITS.PASSWORD_MAX);
  assert.strictEqual(cappedPassword.length, LIMITS.PASSWORD_MAX, `Le mot de passe doit être tronqué à ${LIMITS.PASSWORD_MAX} caractères`);
  console.log('   ✅ Bornage mémoire et limitation de taille validés !');

  // -------------------------------------------------------------
  // TEST 3 : Validation du Mot de Passe Maître
  // -------------------------------------------------------------
  console.log('3. Test de validation du Mot de Passe Maître...');
  assert.strictEqual(validateMasterPassword('1234567', true).valid, false, 'Doit rejeter un mot de passe < 8 caractères');
  assert.strictEqual(validateMasterPassword('A'.repeat(129), true).valid, false, 'Doit rejeter un mot de passe > 128 caractères');
  assert.strictEqual(validateMasterPassword('Secret\0Inject', true).valid, false, 'Doit rejeter un mot de passe contenant un octet nul');
  assert.strictEqual(validateMasterPassword('MonSuperMotDePasse123!', true).valid, true, 'Doit accepter un mot de passe valide');
  console.log('   ✅ Validation robuste du mot de passe maître validée !');

  // -------------------------------------------------------------
  // TEST 4 : Protection contre les URLs malveillantes (XSS / Schemes dangereux)
  // -------------------------------------------------------------
  console.log('4. Test de sécurité sur les URLs (Anti-XSS / Anti-Protocol Injection)...');
  const dangerousUrls = [
    'javascript:alert(1)',
    'javascript:/*--></title></style></textarea>*/<script>alert(1)</script>',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox("hacked")',
    'file:///etc/passwd',
    'blob:https://example.com/uuid',
    'about:blank',
  ];

  for (const dangerous of dangerousUrls) {
    const res = validateAndSanitizeUrl(dangerous);
    assert.strictEqual(res.valid, false, `L'URL dangereuse "${dangerous}" doit être rejetée !`);
  }

  // URLs légitimes
  const validUrl1 = validateAndSanitizeUrl('https://github.com/login');
  assert.strictEqual(validUrl1.valid, true);
  assert.strictEqual(validUrl1.url, 'https://github.com/login');

  const validUrl2 = validateAndSanitizeUrl('gitlab.com');
  assert.strictEqual(validUrl2.valid, true);
  assert.strictEqual(validUrl2.url, 'https://gitlab.com');
  console.log('   ✅ Protocoles dangereux rejetés et URLs légitimes normalisées !');

  // -------------------------------------------------------------
  // TEST 5 : Validation des Clés Secrètes TOTP (RFC 4648 Base32)
  // -------------------------------------------------------------
  console.log('5. Test de validation des Clés Secrètes TOTP Base32...');
  const validSecret = validateAndSanitizeTotpSecret('JBSW Y3DP-EHPK 3PXP');
  assert.strictEqual(validSecret.valid, true);
  assert.strictEqual(validSecret.secret, 'JBSWY3DPEHPK3PXP', 'Doit normaliser et retirer espaces/tirets');

  assert.strictEqual(validateAndSanitizeTotpSecret('JBSW').valid, false, 'Trop court');
  assert.strictEqual(validateAndSanitizeTotpSecret('A'.repeat(150)).valid, false, 'Trop long');
  assert.strictEqual(validateAndSanitizeTotpSecret('JBSWY89!@#').valid, false, 'Caractères non Base32');
  console.log('   ✅ Validation et assainissement RFC 4648 Base32 validés !');

  // -------------------------------------------------------------
  // TEST 6 : Intégration VaultManager - Défense en profondeur
  // -------------------------------------------------------------
  console.log('6. Test de sécurité au sein du VaultManager...');
  const testDir = path.join(__dirname, '.tmp_sec_test');
  const testVaultFile = path.join(testDir, 'sec_vault.vguard');
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });

  const vm = new VaultManager(testVaultFile);
  await vm.create('PasswordMaître123!');

  // Tenter d'injecter une URL dangereuse directement dans addEntry
  let urlRejected = false;
  try {
    await vm.addEntry({
      type: 'password',
      title: 'Hacker Test',
      username: 'admin',
      password: 'SecretPassword123!',
      url: 'javascript:alert(document.cookie)',
      categoryId: '',
      favorite: false,
    });
  } catch (e) {
    urlRejected = true;
  }
  assert.strictEqual(urlRejected, true, 'VaultManager doit rejeter une URL javascript:');

  // Tenter d'injecter un secret TOTP invalide
  let totpRejected = false;
  try {
    await vm.addEntry({
      type: 'totp',
      title: 'Malicious 2FA',
      issuer: 'EvilCorp',
      account: 'root',
      secret: 'INVALID_CHARACTERS_!@#$',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      categoryId: '',
      favorite: false,
    });
  } catch (e) {
    totpRejected = true;
  }
  assert.strictEqual(totpRejected, true, 'VaultManager doit rejeter un secret TOTP avec caractères invalides');

  // Vérifier la sanitisation automatique des octets nuls et longueurs excessives
  const added = await vm.addEntry({
    type: 'password',
    title: 'Compte\0Banque' + 'X'.repeat(200), // Titre avec null byte et > 100 chars
    username: 'user\0test',
    password: 'ExactPasswordWithSpaces   ',
    url: 'https://banque.fr',
    notes: 'Note\0Secrète',
    categoryId: '',
    favorite: false,
  });

  assert.strictEqual(added.title.includes('\0'), false, 'Le titre ne doit pas contenir de null byte');
  assert.strictEqual(added.title.length <= LIMITS.TITLE_MAX, true, 'Le titre doit respecter la limite max');
  assert.strictEqual((added).username, 'usertest', 'Username assaini');
  assert.strictEqual(added.notes, 'NoteSecrète', 'Notes assainies');

  // Test de saturation du générateur de mot de passe
  const generatedHuge = generatePassword({
    length: 9999999, // Requête démesurée
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  assert.strictEqual(generatedHuge.length, 256, 'Le générateur de mot de passe doit borner à 256 caractères max');

  // Nettoyage
  vm.lock();
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });

  console.log('   ✅ VaultManager protège intégralement toutes les entrées et paramètres !');

  console.log('\n🎉 TOUS LES TESTS DE SÉCURITÉ ET PROTECTION DES FORMULAIRES ONT RÉUSSI !\n');
}

runSecurityTests().catch((err) => {
  console.error('❌ Échec des tests de sécurité :', err);
  process.exit(1);
});
