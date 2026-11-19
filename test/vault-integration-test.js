const { VaultManager } = require('../dist/main/vault/vault-manager');
const fs = require('fs/promises');
const path = require('path');
const assert = require('assert');

async function testVaultIntegration() {
  console.log('🚀 Démarrage du test d\'intégration complet du VaultManager...\n');

  // Nettoyer d'anciens fichiers de test temporaires
  const testDir = path.resolve(process.cwd(), '.vguard_test_data');
  await fs.rm(testDir, { recursive: true, force: true });
  await fs.mkdir(testDir, { recursive: true });

  const testVaultFile = path.join(testDir, 'vault.vguard');
  const vault = new VaultManager(testVaultFile);

  // 1. Initialement, aucun coffre n'existe
  const existsInitially = await vault.exists();
  assert.strictEqual(existsInitially, false, 'Le coffre ne doit pas exister avant création');
  assert.strictEqual(vault.isLocked(), true, 'Le coffre doit être verrouillé initialement');
  console.log('1. ✅ État initial vérifié (coffre absent et verrouillé)');

  // 2. Création du coffre avec mot de passe maître
  const masterPw = 'MonMotDePasseMaitreTresSolide2026!';
  await vault.create(masterPw);
  assert.strictEqual(await vault.exists(), true, 'Le coffre doit exister après création');
  assert.strictEqual(vault.isLocked(), false, 'Le coffre doit être déverrouillé immédiatement après création');
  console.log('2. ✅ Création et déverrouillage initial réussis');

  // 3. Ajout d'une entrée de mot de passe
  const pwdEntry = await vault.addEntry({
    type: 'password',
    title: 'Compte GitHub Pro',
    username: 'hoby-dev',
    password: 'GithuB#Password99!',
    email: 'hoby@example.com',
    url: 'https://github.com/login',
    categoryId: '',
    favorite: true,
    notes: 'Clé SSH également configurée',
  });
  assert.strictEqual(pwdEntry.title, 'Compte GitHub Pro');
  assert.strictEqual(pwdEntry.favorite, true);
  console.log('3. ✅ Entrée mot de passe ajoutée avec succès (id:', pwdEntry.id, ')');

  // 4. Ajout d'un compte 2FA / TOTP
  const totpEntry = await vault.addEntry({
    type: 'totp',
    title: 'GitHub 2FA',
    issuer: 'GitHub',
    account: 'hoby-dev',
    secret: 'JBSWY3DPEHPK3PXP', // Base32 test secret
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    categoryId: '',
    favorite: true,
  });
  assert.strictEqual(totpEntry.issuer, 'GitHub');
  console.log('4. ✅ Compte 2FA / TOTP ajouté avec succès (id:', totpEntry.id, ')');

  // 5. Génération du code TOTP en temps réel
  const codeResult = vault.generateTOTPCode(totpEntry.id);
  assert.strictEqual(codeResult.code.length, 6, 'Code à 6 chiffres');
  assert.ok(codeResult.remainingSeconds >= 1 && codeResult.remainingSeconds <= 30);
  console.log(`5. ✅ Code TOTP généré en direct: [${codeResult.code}] (${codeResult.remainingSeconds}s restantes)`);

  // 6. Test d'exportation
  const jsonExport = vault.exportVault('json');
  const parsedExport = JSON.parse(jsonExport);
  assert.strictEqual(parsedExport.entries.length, 2, 'L\'export JSON doit contenir les 2 entrées');
  const csvExport = vault.exportVault('csv');
  assert.ok(csvExport.includes('Compte GitHub Pro'), 'L\'export CSV doit contenir le titre de l\'entrée');
  console.log('6. ✅ Exportation JSON et CSV validée');

  // 7. Verrouillage du coffre
  vault.lock();
  assert.strictEqual(vault.isLocked(), true, 'Le coffre doit être verrouillé');
  let accessBlocked = false;
  try {
    await vault.addEntry({ type: 'password', title: 'Test' });
  } catch {
    accessBlocked = true;
  }
  assert.ok(accessBlocked, 'L\'accès aux données doit être strictement bloqué quand le coffre est verrouillé');
  console.log('7. ✅ Verrouillage et protection de mémoire confirmés');

  // 8. Déverrouillage avec mauvais mot de passe
  let wrongPwFailed = false;
  try {
    await vault.unlock('MauvaisMotDePasse!');
  } catch (err) {
    wrongPwFailed = true;
    assert.strictEqual(err.message, 'Mot de passe maître incorrect.');
  }
  assert.ok(wrongPwFailed, 'Le déverrouillage avec un mauvais mot de passe doit être rejeté');
  console.log('8. ✅ Rejet d\'un mot de passe incorrect validé');

  // 9. Déverrouillage avec le bon mot de passe maître
  const restoredData = await vault.unlock(masterPw);
  assert.strictEqual(restoredData.entries.length, 2, 'Toutes les entrées doivent être restaurées fidèlement');
  console.log('9. ✅ Déverrouillage et intégrité des données confirmés');

  // 10. Modification du mot de passe maître
  const newMasterPw = 'NouveauMotDePasseMaitreEncorePlusSolide2026!';
  await vault.changeMasterPassword(masterPw, newMasterPw);
  vault.lock();
  const unlockedWithNewPw = await vault.unlock(newMasterPw);
  assert.strictEqual(unlockedWithNewPw.entries.length, 2);
  console.log('10. ✅ Changement de mot de passe maître et re-chiffrement du vault validés');

  // Nettoyage
  vault.lock();
  await fs.rm(testDir, { recursive: true, force: true });

  console.log('\n🏆 INTÉGRATION COMPLÈTE VALIDÉE À 100% SANS AUCUNE ANOMALIE !\n');
  process.exit(0);
}

testVaultIntegration().catch((e) => {
  console.error('❌ Échec du test d\'intégration:', e);
  process.exit(1);
});
