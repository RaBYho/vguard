#!/usr/bin/env node

const net = require('net');
const path = require('path');
const os = require('os');
const fs = require('fs');

function getSocketPath() {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\vguard-${process.env.USERNAME || 'user'}`;
  }
  return path.join(os.tmpdir(), `vguard-${process.env.USER || 'user'}.sock`);
}

function sendMessage(msg) {
  const jsonStr = JSON.stringify(msg);
  const buffer = Buffer.from(jsonStr, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);

  process.stdout.write(header);
  process.stdout.write(buffer);
}

function queryVGuardApp(requestPayload) {
  const socketPath = getSocketPath();

  if (process.platform !== 'win32' && !fs.existsSync(socketPath)) {
    sendMessage({
      status: 'app_not_running',
      message: "L'application VGuard n'est pas ouverte. Veuillez lancer VGuard pour activer le remplissage.",
    });
    return;
  }

  const client = net.createConnection(socketPath, () => {
    client.write(JSON.stringify(requestPayload) + '\n');
  });

  let dataBuffer = '';

  client.on('data', (chunk) => {
    dataBuffer += chunk.toString('utf8');
    if (dataBuffer.includes('\n')) {
      const line = dataBuffer.split('\n')[0];
      try {
        const response = JSON.parse(line);
        sendMessage(response);
      } catch (e) {
        sendMessage({ status: 'error', message: 'Réponse corrompue de VGuard' });
      }
      client.end();
    }
  });

  client.on('error', (err) => {
    sendMessage({
      status: 'app_not_running',
      message: "Impossible de joindre VGuard. Assurez-vous que l'application est démarrée.",
    });
  });
}

// ================= GESTION DES MESSAGES DEPUIS CHROME (STDIN) =================

let inputBuffer = Buffer.alloc(0);

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);

    while (inputBuffer.length >= 4) {
      const messageLength = inputBuffer.readUInt32LE(0);

      // Si le message complet n'a pas encore été reçu, on attend
      if (inputBuffer.length < 4 + messageLength) {
        break;
      }

      const messageContent = inputBuffer.subarray(4, 4 + messageLength).toString('utf8');
      inputBuffer = inputBuffer.subarray(4 + messageLength);

      try {
        const request = JSON.parse(messageContent);
        queryVGuardApp(request);
      } catch (err) {
        sendMessage({ status: 'error', message: 'Message Chrome invalide' });
      }
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});
