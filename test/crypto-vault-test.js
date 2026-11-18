const { deriveKey, computeVerifier } = require('../dist/main/crypto/key-derivation');
const { encryptData, decryptData } = require('../dist/main/crypto/vault-crypto');
const { generatePassword, evaluateStrength } = require('../dist/main/crypto/password-generator');
const { generateCode, parseUri, verifyCode } = require('../dist/main/totp/totp-engine');
const assert = require('assert');

async function runTests() {
  console.log('🧪 Début des tests cryptographiques et TOTP...\n');

  // 1. Test Dérivation de clé Argon2id
  console.log('1. Test Argon2id KDF...');
  const password = 'SuperSecretMasterPassword123!';
  const { key, salt } = await deriveKey(password);
  assert.strictEqual(key.length, 32, 'La clé dérivée doit faire 32 octets (256 bits)');
  assert.strictEqual(salt.length, 16, 'Le salt doit faire 16 octets');

  const verifier = computeVerifier(key);
  assert.strictEqual(verifier.length, 64, 'Le verifier SHA-256 doit faire 64 caractères hex');

  // Vérifier qu'un mauvais mot de passe donne une clé différente
  const badKey = (await deriveKey('WrongPassword123!', salt)).key;
  assert.notStrictEqual(computeVerifier(badKey), verifier, 'Un mot de passe différent doit générer un verifier différent');
  console.log('   ✅ Argon2id KDF validé !');

  // 2. Test Chiffrement/Déchiffrement AES-256-GCM
  console.log('\n2. Test AES-256-GCM Authenticated Encryption...');
  const secretData = JSON.stringify({ secret: 'coffre-fort-donnees-confidentielles', timestamp: Date.now() });
  const payload = encryptData(secretData, key);

  assert.strictEqual(payload.iv.length, 24, 'IV doit faire 12 octets (24 hex)');
  assert.strictEqual(payload.tag.length, 32, 'Tag GCM doit faire 16 octets (32 hex)');

  const decrypted = decryptData(payload, key);
  assert.strictEqual(decrypted, secretData, 'Les données déchiffrées doivent être identiques');

  // Test altération de données (intégrité GCM)
  let tamperDetected = false;
  try {
    const tamperedPayload = { ...payload, data: payload.data.slice(0, -2) + '00' };
    decryptData(tamperedPayload, key);
  } catch {
    tamperDetected = true;
  }
  assert.ok(tamperDetected, 'Toute altération du ciphertext doit être détectée par le tag GCM');
  console.log('   ✅ Chiffrement et intégrité AES-256-GCM validés !');

  // 3. Test Générateur de Mots de Passe
  console.log('\n3. Test Générateur de Mots de Passe & Entropie...');
  const pwd = generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  assert.strictEqual(pwd.length, 20, 'Le mot de passe doit mesurer 20 caractères');
  const evaluation = evaluateStrength(pwd);
  assert.ok(evaluation.score >= 3, 'Un mot de passe aléatoire de 20 caractères doit être robuste');
  console.log(`   Généré : "${pwd}" (Entropie: ${evaluation.entropy} bits, Force: ${evaluation.label})`);
  console.log('   ✅ Générateur de mot de passe validé !');

  // 4. Test Moteur TOTP
  console.log('\n4. Test Moteur TOTP & QR Code parser...');
  const sampleUri = 'otpauth://totp/GitHub:hoby-dev?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA1&digits=6&period=30';
  const parsed = parseUri(sampleUri);

  assert.strictEqual(parsed.issuer, 'GitHub');
  assert.strictEqual(parsed.account, 'hoby-dev');
  assert.strictEqual(parsed.digits, 6);
  assert.strictEqual(parsed.period, 30);

  const totpResult = generateCode({
    id: 'test-1',
    type: 'totp',
    title: parsed.title,
    categoryId: '1',
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    issuer: parsed.issuer,
    account: parsed.account,
    secret: parsed.secret,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
  });

  assert.strictEqual(totpResult.code.length, 6, 'Le code doit contenir 6 chiffres');
  assert.ok(/^\d+$/.test(totpResult.code), 'Le code ne doit contenir que des chiffres');
  assert.ok(totpResult.remainingSeconds >= 1 && totpResult.remainingSeconds <= 30);

  const isValid = verifyCode({
    id: 'test-1',
    type: 'totp',
    title: parsed.title,
    categoryId: '1',
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    issuer: parsed.issuer,
    account: parsed.account,
    secret: parsed.secret,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
  }, totpResult.code);

  assert.ok(isValid, 'Le code TOTP auto-généré doit être validé avec succès');
  console.log(`   Code TOTP généré pour GitHub: ${totpResult.code} (${totpResult.remainingSeconds}s restantes)`);
  console.log('   ✅ Moteur TOTP et validation RFC 6238 validés !');

  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !\n');
}

runTests().catch((err) => {
  console.error('❌ Échec des tests:', err);
  process.exit(1);
});
