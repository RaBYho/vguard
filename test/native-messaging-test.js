const { spawn } = require('child_process');
const { VaultManager } = require('../dist/main/vault/vault-manager');
const { VGuardIPCServer } = require('../dist/main/ipc-server');
const path = require('path');
const fs = require('fs/promises');
const assert = require('assert');

async function testNativeMessaging() {
  console.log('🧪 Démarrage du test Native Messaging Host...\n');

  const testDir = path.resolve(process.cwd(), '.vguard_test_ipc');
  await fs.rm(testDir, { recursive: true, force: true });
  await fs.mkdir(testDir, { recursive: true });

  const vault = new VaultManager(path.join(testDir, 'vault.vguard'));
  const masterPw = 'PasswordForIpcTest123!';
  await vault.create(masterPw);

  // Ajouter un compte de test pour github.com
  await vault.addEntry({
    type: 'password',
    title: 'GitHub',
    username: 'hoby-native-test',
    password: 'SecureGitHubPassword#2026',
    url: 'https://github.com/login',
    categoryId: '',
    favorite: true,
  });

  // Démarrer le serveur IPC
  const ipcServer = new VGuardIPCServer(vault);
  ipcServer.start();
  console.log('1. ✅ Serveur IPC local démarré');

  // Lancer le script vguard-host.js comme le ferait Chrome
  const hostScript = path.resolve(__dirname, '../src/native-host/vguard-host.js');
  const child = spawn('node', [hostScript]);

  function sendChromeMessage(obj) {
    const jsonStr = JSON.stringify(obj);
    const buf = Buffer.from(jsonStr, 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(buf.length, 0);
    child.stdin.write(header);
    child.stdin.write(buf);
  }

  function readChromeMessage() {
    return new Promise((resolve) => {
      let buffer = Buffer.alloc(0);

      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        if (buffer.length >= 4) {
          const len = buffer.readUInt32LE(0);
          if (buffer.length >= 4 + len) {
            const dataStr = buffer.subarray(4, 4 + len).toString('utf8');
            child.stdout.removeListener('data', onData);
            resolve(JSON.parse(dataStr));
          }
        }
      };

      child.stdout.on('data', onData);
    });
  }

  // Test 1: PING
  sendChromeMessage({ action: 'PING' });
  const pingRes = await readChromeMessage();
  assert.strictEqual(pingRes.status, 'ok');
  assert.strictEqual(pingRes.type, 'PONG');
  console.log('2. ✅ Test PING réussi via Native Host stdio');

  // Test 2: STATUS
  sendChromeMessage({ action: 'STATUS' });
  const statusRes = await readChromeMessage();
  assert.strictEqual(statusRes.status, 'ok');
  assert.strictEqual(statusRes.isLocked, false);
  console.log('3. ✅ Test STATUS réussi (VGuard déverrouillé)');

  // Test 3: GET_LOGINS_FOR_URL (github.com)
  sendChromeMessage({ action: 'GET_LOGINS_FOR_URL', domain: 'github.com' });
  const loginsRes = await readChromeMessage();
  assert.strictEqual(loginsRes.status, 'ok');
  assert.strictEqual(loginsRes.logins.length, 1);
  assert.strictEqual(loginsRes.logins[0].username, 'hoby-native-test');
  assert.strictEqual(loginsRes.logins[0].password, 'SecureGitHubPassword#2026');
  console.log('4. ✅ Test GET_LOGINS_FOR_URL réussi (1 compte retourné pour github.com)');

  // Test 4: GENERATE_PASSWORD
  sendChromeMessage({ action: 'GENERATE_PASSWORD' });
  const genRes = await readChromeMessage();
  assert.strictEqual(genRes.status, 'ok');
  assert.strictEqual(genRes.password.length, 18);
  console.log(`5. ✅ Test GENERATE_PASSWORD réussi (Généré : "${genRes.password}")`);

  // Nettoyage
  child.kill();
  ipcServer.stop();
  await fs.rm(testDir, { recursive: true, force: true });

  console.log('\n🎉 TOUS LES TESTS NATIVE MESSAGING PASSÉS AVEC SUCCÈS !\n');
}

testNativeMessaging().catch((err) => {
  console.error('❌ Échec test Native Messaging:', err);
  process.exit(1);
});
