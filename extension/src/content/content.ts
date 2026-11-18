// Content Script pour l'auto-remplissage VGuard

const SHIELD_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="M9 12l2 2 4-4" stroke="#10B981"/>
</svg>
`;

/**
 * Définit la valeur d'un champ d'input de manière compatible avec React, Vue et Angular
 */
function setNativeInputValue(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Recherche les champs de connexion sur la page
 */
function findLoginFields() {
  const passwordInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'))
    .filter((el) => el.offsetParent !== null && !el.disabled && !el.readOnly);

  const fields: Array<{ usernameInput: HTMLInputElement | null; passwordInput: HTMLInputElement }> = [];

  for (const pwInput of passwordInputs) {
    let usernameInput: HTMLInputElement | null = null;
    const form = pwInput.form;

    if (form) {
      // Chercher dans le même formulaire
      const candidates = Array.from(
        form.querySelectorAll<HTMLInputElement>(
          'input[type="text"], input[type="email"], input[autocomplete="username"], input[autocomplete="email"], input:not([type])'
        )
      ).filter((el) => el.offsetParent !== null && el !== pwInput && !el.disabled);

      // Prendre le candidat le plus proche au-dessus du mot de passe
      usernameInput = candidates[candidates.length - 1] || null;
    } else {
      // Formulaire sans balise form parente : chercher le champ précédent dans le DOM
      const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
      const pwIndex = allInputs.indexOf(pwInput);
      for (let i = pwIndex - 1; i >= 0; i--) {
        const inp = allInputs[i];
        if (
          inp.offsetParent !== null &&
          (inp.type === 'text' || inp.type === 'email' || !inp.type) &&
          !inp.disabled
        ) {
          usernameInput = inp;
          break;
        }
      }
    }

    fields.push({ usernameInput, passwordInput: pwInput });
  }

  return fields;
}

/**
 * Recherche les champs 2FA (codes TOTP)
 */
function findOTPFields(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[autocomplete="one-time-code"], input[name*="otp" i], input[name*="2fa" i], input[name*="token" i], input[id*="otp" i], input[id*="2fa" i], input[placeholder*="code" i]'
    )
  ).filter((el) => el.offsetParent !== null && el.type !== 'hidden' && el.type !== 'password');
}

let activeDropdown: HTMLElement | null = null;

function removeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
}

/**
 * Affiche la liste des identifiants correspondants sous le champ
 */
function showLoginsDropdown(
  anchorElement: HTMLInputElement,
  logins: any[],
  onSelect: (login: any) => void
) {
  removeDropdown();

  const rect = anchorElement.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'vguard-dropdown';
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;

  const header = document.createElement('div');
  header.className = 'vguard-dropdown-header';
  header.innerHTML = `<span>VGuard Identifiants (${logins.length})</span><span style="font-size: 10px; color: #71717A;">ESC pour fermer</span>`;
  dropdown.appendChild(header);

  for (const login of logins) {
    const item = document.createElement('div');
    item.className = 'vguard-dropdown-item';

    let totpBadge = '';
    if (login.totpCode) {
      totpBadge = `<span class="vguard-item-totp">⚡ 2FA: ${login.totpCode} (${login.totpRemaining}s)</span>`;
    }

    item.innerHTML = `
      <div class="vguard-item-title">${login.title || 'Compte'}</div>
      <div class="vguard-item-user">${login.username || 'Identifiant masqué'}</div>
      ${totpBadge}
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(login);
      removeDropdown();
    });

    dropdown.appendChild(item);
  }

  document.body.appendChild(dropdown);
  activeDropdown = dropdown;

  // Fermer au clic extérieur ou ESC
  const closeListener = (e: MouseEvent) => {
    if (!dropdown.contains(e.target as Node) && e.target !== anchorElement) {
      removeDropdown();
      document.removeEventListener('click', closeListener);
    }
  };
  document.addEventListener('click', closeListener);
}

/**
 * Injecte l'icône VGuard sur les champs
 */
function attachBadgesToFields() {
  const pairs = findLoginFields();

  for (const pair of pairs) {
    const targetInput = pair.usernameInput || pair.passwordInput;
    if (!targetInput || targetInput.dataset.vguardAttached) continue;

    targetInput.dataset.vguardAttached = 'true';

    // Rendre le conteneur relatif pour positionner le badge
    const parent = targetInput.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = 'vguard-field-badge';
    badge.innerHTML = SHIELD_SVG;
    badge.title = 'Remplir avec VGuard';

    badge.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      chrome.runtime.sendMessage(
        { action: 'GET_LOGINS_FOR_URL', domain: window.location.hostname },
        (res) => {
          if (res?.status === 'ok' && res.logins?.length > 0) {
            if (res.logins.length === 1) {
              // Remplissage automatique direct s'il n'y a qu'un seul compte
              fillPair(pair, res.logins[0]);
            } else {
              showLoginsDropdown(targetInput, res.logins, (chosen) => fillPair(pair, chosen));
            }
          } else if (res?.status === 'locked') {
            alert('VGuard est verrouillé. Veuillez déverrouiller votre coffre-fort.');
          } else {
            alert(`Aucun identifiant VGuard trouvé pour "${window.location.hostname}".`);
          }
        }
      );
    });

    if (parent) {
      parent.appendChild(badge);
    }
  }

  // Traiter les champs 2FA / OTP
  const otpFields = findOTPFields();
  for (const otpInput of otpFields) {
    if (otpInput.dataset.vguardAttached) continue;
    otpInput.dataset.vguardAttached = 'true';

    const parent = otpInput.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = 'vguard-field-badge';
    badge.innerHTML = SHIELD_SVG;
    badge.title = 'Remplir le code 2FA VGuard';

    badge.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      chrome.runtime.sendMessage(
        { action: 'GET_LOGINS_FOR_URL', domain: window.location.hostname },
        (res) => {
          if (res?.status === 'ok' && res.logins?.length > 0) {
            const loginWithTotp = res.logins.find((l: any) => l.totpCode);
            if (loginWithTotp?.totpCode) {
              setNativeInputValue(otpInput, loginWithTotp.totpCode);
            } else {
              alert('Aucun code 2FA associé à ce compte dans VGuard.');
            }
          }
        }
      );
    });

    if (parent) {
      parent.appendChild(badge);
    }
  }
}

function fillPair(
  pair: { usernameInput: HTMLInputElement | null; passwordInput: HTMLInputElement },
  login: any
) {
  if (pair.usernameInput && login.username) {
    setNativeInputValue(pair.usernameInput, login.username);
  }
  if (pair.passwordInput && login.password) {
    setNativeInputValue(pair.passwordInput, login.password);
  }

  // Si un code TOTP est disponible, le copier dans le presse-papier pour confort
  if (login.totpCode) {
    navigator.clipboard?.writeText(login.totpCode).catch(() => {});
  }
}

// Remplissage déclenché depuis la popup de l'extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_CREDENTIALS') {
    const pairs = findLoginFields();
    if (pairs.length > 0) {
      fillPair(pairs[0], request);
      sendResponse({ status: 'ok' });
    } else {
      sendResponse({ status: 'no_fields_found' });
    }
  }
});

// Écoute de l'enregistrement lors de la saisie et soumission de formulaire
let lastTypedCredentials: { username: string; password: string } | null = null;

function setupCredentialTracking() {
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'password' && target.value) {
      const form = target.form;
      let username = '';
      if (form) {
        const userInput = form.querySelector<HTMLInputElement>(
          'input[type="text"], input[type="email"], input[autocomplete*="user"], input[autocomplete*="email"]'
        );
        username = userInput?.value || '';
      } else {
        const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
        const idx = allInputs.indexOf(target);
        for (let i = idx - 1; i >= 0; i--) {
          if (allInputs[i].type === 'text' || allInputs[i].type === 'email') {
            username = allInputs[i].value;
            break;
          }
        }
      }
      lastTypedCredentials = { username, password: target.value };
    }
  });

  // Détection lors de la soumission de formulaire classique
  document.addEventListener('submit', () => {
    handlePotentialLogin();
  });

  // Détection lors du clic sur un bouton de validation / connexion (SPAs)
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button, input[type="submit"], [role="button"]');
    if (!target) return;

    const text = (target.textContent || (target as HTMLInputElement).value || '').toLowerCase();
    const isLoginButton =
      target.getAttribute('type') === 'submit' ||
      /connexion|connecter|login|sign in|s'inscrire|sign up|valider|continuer|continue|submit|register/.test(
        text
      );

    if (isLoginButton) {
      setTimeout(handlePotentialLogin, 300);
    }
  });

  // Détection sur appui de la touche Enter dans un champ mot de passe
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      if (target.type === 'password') {
        setTimeout(handlePotentialLogin, 300);
      }
    }
  });
}

function handlePotentialLogin() {
  if (!lastTypedCredentials || !lastTypedCredentials.password || lastTypedCredentials.password.length < 6) {
    return;
  }

  const { username, password } = lastTypedCredentials;
  const domain = window.location.hostname;

  chrome.runtime.sendMessage(
    {
      action: 'CHECK_CREDENTIALS_EXIST',
      domain,
      username,
      password,
    },
    (res) => {
      if (res?.status === 'identical') {
        // Déjà enregistré avec le même mot de passe : rien à faire !
        return;
      }

      if (res?.status === 'update_needed') {
        showSaveOrUpdateBanner(username, password, true, res.entryId);
      } else if (res?.status === 'new') {
        showSaveOrUpdateBanner(username, password, false);
      }
    }
  );
}

function showSaveOrUpdateBanner(
  username: string,
  password: string,
  isUpdate: boolean,
  updateEntryId?: string
) {
  if (document.getElementById('vguard-save-banner')) return;

  const domain = window.location.hostname;
  const banner = document.createElement('div');
  banner.id = 'vguard-save-banner';
  banner.className = 'vguard-save-banner';

  let maskedPassword = '•'.repeat(Math.min(password.length, 12));
  let isRevealed = false;

  banner.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:20px;height:20px;">${SHIELD_SVG}</div>
        <strong style="font-size:13px; color:#FAFAFA;">
          ${isUpdate ? 'Mettre à jour dans VGuard ?' : 'Enregistrer dans VGuard ?'}
        </strong>
      </div>
      <button id="vguard-banner-close" style="background:none; border:none; color:#71717A; cursor:pointer; font-size:14px; padding:0 4px;">✕</button>
    </div>

    <div style="font-size:11px; color:#A1A1AA; margin-top:2px;">
      ${
        isUpdate
          ? `Mettre à jour le mot de passe pour <strong>${domain}</strong> ?`
          : `Enregistrer cet identifiant pour <strong>${domain}</strong> ?`
      }
    </div>

    <div style="background:#18181B; border:1px solid #27272A; border-radius:10px; padding:8px 10px; margin-top:4px; font-size:11px; display:flex; flex-direction:column; gap:4px;">
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#71717A;">Identifiant :</span>
        <span style="color:#FAFAFA; font-family:monospace; font-weight:600;">${username || '(Non spécifié)'}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#71717A;">Mot de passe :</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <span id="vguard-banner-pwd" style="color:#06B6D4; font-family:monospace;">${maskedPassword}</span>
          <button id="vguard-banner-toggle-pwd" style="background:none; border:none; color:#71717A; cursor:pointer; font-size:11px;" title="Afficher/Masquer">👁️</button>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:8px;">
      <button id="vguard-save-no" style="flex:1; padding:7px; background:#27272A; border:none; border-radius:10px; color:#D4D4D8; font-size:11px; cursor:pointer; font-weight:500;">
        Ignorer
      </button>
      <button id="vguard-save-yes" style="flex:1; padding:7px; background:#06B6D4; border:none; border-radius:10px; color:#FFFFFF; font-size:11px; font-weight:600; cursor:pointer;">
        ${isUpdate ? 'Mettre à jour' : 'Enregistrer'}
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  // Basculeur d'affichage mot de passe
  const pwdEl = banner.querySelector('#vguard-banner-pwd');
  banner.querySelector('#vguard-banner-toggle-pwd')?.addEventListener('click', () => {
    isRevealed = !isRevealed;
    if (pwdEl) pwdEl.textContent = isRevealed ? password : maskedPassword;
  });

  const closeBanner = () => {
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(20px)';
    banner.style.transition = 'all 0.2s ease-in';
    setTimeout(() => banner.remove(), 200);
  };

  banner.querySelector('#vguard-banner-close')?.addEventListener('click', closeBanner);
  banner.querySelector('#vguard-save-no')?.addEventListener('click', closeBanner);

  banner.querySelector('#vguard-save-yes')?.addEventListener('click', () => {
    chrome.runtime.sendMessage(
      {
        action: 'SAVE_CREDENTIALS',
        title: domain,
        username,
        password,
        url: window.location.href,
        updateEntryId,
      },
      (res) => {
        banner.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; color:#10B981; padding:4px 0;">
            <span style="font-size:16px;">✓</span>
            <strong style="font-size:12px;">Identifiant ${isUpdate ? 'mis à jour' : 'enregistré'} avec succès !</strong>
          </div>
        `;
        setTimeout(closeBanner, 2000);
      }
    );
  });

  // Disparaît automatiquement après 25 secondes
  setTimeout(() => {
    if (document.body.contains(banner)) closeBanner();
  }, 25000);
}

// Initialisation et observation dynamique du DOM
attachBadgesToFields();
setupCredentialTracking();

const observer = new MutationObserver(() => {
  attachBadgesToFields();
});
observer.observe(document.body, { childList: true, subtree: true });
