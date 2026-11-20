#!/usr/bin/env python3
"""
VGuard Native Messaging Host (Python)
Compatible avec Linux, macOS, Windows et les environnements sandboxtés (Snap, Flatpak).
Communique avec VGuard via TCP (127.0.0.1:48485) ou socket Unix local.
"""

import sys
import json
import struct
import socket
import os

TCP_PORT = 48485

def get_socket_path():
    if sys.platform == 'win32':
        username = os.environ.get('USERNAME', 'user')
        return f'\\\\.\\pipe\\vguard-{username}'
    username = os.environ.get('USER', 'user')
    return os.path.join(os.environ.get('TMPDIR', '/tmp'), f'vguard-{username}.sock')

def send_message(msg):
    raw = json.dumps(msg).encode('utf-8')
    header = struct.pack('<I', len(raw))
    sys.stdout.buffer.write(header + raw)
    sys.stdout.buffer.flush()

def query_vguard_app(request_payload):
    connected = False
    sock = None

    # 1. Essayer TCP sur 127.0.0.1 (fonctionne dans tous les contextes, y compris Snap/Flatpak)
    try:
        sock = socket.create_connection(('127.0.0.1', TCP_PORT), timeout=2.0)
        connected = True
    except Exception:
        pass

    # 2. Si échec TCP, tenter socket Unix local
    if not connected and sys.platform != 'win32':
        sock_path = get_socket_path()
        if os.path.exists(sock_path):
            try:
                sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                sock.settimeout(2.0)
                sock.connect(sock_path)
                connected = True
            except Exception:
                sock = None

    if not connected or sock is None:
        send_message({
            'status': 'app_not_running',
            'message': "L'application VGuard n'est pas ouverte. Veuillez lancer VGuard pour activer le remplissage.",
        })
        return

    try:
        req_line = json.dumps(request_payload).encode('utf-8') + b'\n'
        sock.sendall(req_line)

        buf = b''
        while b'\n' not in buf:
            chunk = sock.recv(4096)
            if not chunk:
                break
            buf += chunk

        sock.close()
        line = buf.split(b'\n')[0]
        if line:
            resp = json.loads(line.decode('utf-8'))
            send_message(resp)
        else:
            send_message({'status': 'error', 'message': 'Réponse vide de VGuard'})
    except Exception as e:
        send_message({'status': 'error', 'message': f'Erreur communication VGuard: {e}'})

def main():
    while True:
        raw_len = sys.stdin.buffer.read(4)
        if not raw_len or len(raw_len) < 4:
            break
        msg_len = struct.unpack('<I', raw_len)[0]
        msg_bytes = sys.stdin.buffer.read(msg_len)
        if len(msg_bytes) < msg_len:
            break
        try:
            req = json.loads(msg_bytes.decode('utf-8'))
            query_vguard_app(req)
        except Exception:
            send_message({'status': 'error', 'message': 'Message Chrome invalide'})

if __name__ == '__main__':
    main()
