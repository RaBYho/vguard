const HOST_NAME = 'com.vguard.autofill';

/**
 * Envoie une requête native au processus VGuard via Chrome Native Messaging
 */
async function sendToNativeHost(payload: any): Promise<any> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(HOST_NAME, payload, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[VGuard SW] Erreur Native Host:', chrome.runtime.lastError.message);
          resolve({
            status: 'app_not_running',
            message: "Impossible de communiquer avec VGuard. Assurez-vous que l'application VGuard est lancée.",
          });
        } else {
          resolve(response || { status: 'error', message: 'Aucune réponse reçue' });
        }
      });
    } catch (e: any) {
      resolve({
        status: 'error',
        message: e.message,
      });
    }
  });
}

// Mise en cache des identifiants par domaine pour accélérer l'accès
const domainCache = new Map<string, any>();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const action = request.action || request.type;

  (async () => {
    switch (action) {
      case 'CHECK_STATUS': {
        const res = await sendToNativeHost({ action: 'STATUS' });
        sendResponse(res);
        break;
      }

      case 'GET_LOGINS_FOR_URL': {
        const url = request.url || sender.tab?.url || '';
        const domain = request.domain || '';

        const res = await sendToNativeHost({
          action: 'GET_LOGINS_FOR_URL',
          url,
          domain,
        });

        if (res.status === 'ok' && res.logins) {
          domainCache.set(res.domain || domain, res.logins);
        }
        sendResponse(res);
        break;
      }

      case 'GET_ALL_LOGINS': {
        const res = await sendToNativeHost({ action: 'GET_ALL_LOGINS' });
        sendResponse(res);
        break;
      }

      case 'GET_TOTP': {
        const res = await sendToNativeHost({
          action: 'GET_TOTP',
          entryId: request.entryId,
        });
        sendResponse(res);
        break;
      }

      case 'CHECK_CREDENTIALS_EXIST': {
        const res = await sendToNativeHost({
          action: 'CHECK_CREDENTIALS_EXIST',
          domain: request.domain,
          username: request.username,
          password: request.password,
        });
        sendResponse(res);
        break;
      }

      case 'SAVE_CREDENTIALS': {
        const res = await sendToNativeHost({
          action: 'SAVE_CREDENTIALS',
          title: request.title,
          username: request.username,
          password: request.password,
          url: request.url,
          updateEntryId: request.updateEntryId,
        });
        sendResponse(res);
        break;
      }

      case 'GENERATE_PASSWORD': {
        const res = await sendToNativeHost({
          action: 'GENERATE_PASSWORD',
          options: request.options,
        });
        sendResponse(res);
        break;
      }

      case 'TRIGGER_FILL_TAB': {
        // Déclenché par la popup pour forcer le remplissage dans l'onglet actif
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'FILL_CREDENTIALS',
            username: request.username,
            password: request.password,
            totpCode: request.totpCode,
          });
          sendResponse({ status: 'ok' });
        } else {
          sendResponse({ status: 'error', message: 'Aucun onglet actif' });
        }
        break;
      }

      default:
        sendResponse({ status: 'unknown_action' });
    }
  })();

  return true; // Asynchrone
});

// Met à jour le badge de l'icône de l'extension avec le nombre d'identifiants trouvés
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const parsed = new URL(tab.url);
      const res = await sendToNativeHost({
        action: 'GET_LOGINS_FOR_URL',
        url: tab.url,
        domain: parsed.hostname,
      });

      if (res.status === 'ok' && res.logins && res.logins.length > 0) {
        chrome.action.setBadgeText({ tabId, text: String(res.logins.length) });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#06B6D4' });
      } else {
        chrome.action.setBadgeText({ tabId, text: '' });
      }
    } catch {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});
