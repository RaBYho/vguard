# 🛡️ VGuard v1.0.0 — Official Initial Release

We are proud to announce the **first official release of VGuard (v1.0.0)**, an open-source, zero-knowledge, offline-first password manager and RFC 6238-compliant 2FA authenticator suite.

---

## 🌟 Highlights & Key Features

### 🔐 Zero-Knowledge Encrypted Vault
- **Robust Key Derivation:** Powered by `Argon2id` (64 MB memory, 3 iterations, 4 parallel threads) designed to resist GPU/ASIC brute-force attacks.
- **Authenticated Encryption:** Military-grade `AES-256-GCM` with a unique 96-bit random initialization vector (IV) per entry and 128-bit authentication tags ensuring total tamper detection.
- **Strict RAM Zeroization:** Master keys and decrypted plaintext buffers are actively zeroized in memory (`Buffer.fill(0)`) upon vault locking.
- **Configurable Auto-Lock:** Automatic locking after inactivity (1, 5, 15, 30 min) and on system lock.
- **Self-Clearing Clipboard:** Clears copied passwords from the system clipboard after 30 seconds to protect against clipboard snoopers.

### ⏱️ RFC 6238 TOTP Authenticator & QR Scanner
- **Live Circular Countdowns:** Real-time visual progress timers with urgent amber and pulsing red alerts when expiration is under 5 seconds.
- **Webcam & Image QR Scanner:** Scan TOTP setup QR codes directly via your camera (with instant hardware shutdown on close for physical privacy) or by dropping a local image file.
- **Customizable Cryptographic Specs:** Full support for custom hashing algorithms (SHA-1, SHA-256, SHA-512), 6 or 8 digits, and 30s or 60s periods.

### 🧩 Chromium Browser Extension (Manifest V3)
- **1-Click Smart Form Auto-Fill:** Detects login fields and injects matching credentials securely.
- **Single-Page Application (SPA) Support:** Fires synthetic DOM events compatible with React, Vue, Angular, and Svelte forms.
- **Native Messaging Bridge:** Standard I/O communication over a local Unix domain socket (`/tmp/vguard-$USER.sock`, mode `0600`) with **zero exposed HTTP/TCP ports**.

### 🎨 Google Stitch Obsidian Design System
- **Dual Strict Themes:** Cyber Obsidian Dark Mode (`#09090B`) and FinTech Clean Light Mode (`#F4F4F6`).
- **60fps Fluid Transitions:** Smooth 240ms deceleration curves on tab changes and modal dialogs with full WCAG 2.2 `prefers-reduced-motion` support.
- **Dedicated Delete Confirmation Modal:** Designed with ambient rose warning halos and detailed item previews.
- **Toast Notifications:** Instant feedback for credential creation, updates, and clipboard copy operations.
- **Clean Error Handling:** User-friendly messages without technical IPC error stack traces.

---

## 📦 Downloads & Verification

| Asset | Platform / Environment | Description |
| :--- | :--- | :--- |
| **`VGuard-1.0.0.AppImage`** | Linux (x64) | Standalone executable Linux package (Ubuntu, Debian, Fedora, Arch) |
| **`vguard-1.0.0.tar.gz`** | Linux (x64) | Portable tarball archive |
| **`vguard-extension-v1.0.0.zip`** | Chrome / Brave / Edge / Chromium | Manifest V3 Browser Extension (Unpacked) |

---

## 🚀 Quick Verification & Test Suite
Every release is strictly validated against our end-to-end cryptographic and IPC test suites:
- ✅ Argon2id KDF verification
- ✅ AES-256-GCM authenticated cipher & integrity tests
- ✅ Cryptographic PRNG password generator entropy evaluation
- ✅ RFC 6238 TOTP code generation & validation
- ✅ VaultManager full lifecycle & import/export test
- ✅ Chrome Native Messaging Host IPC protocol test
