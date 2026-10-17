// -------------------------------------------------------------
// WINDOW CONTROLS
// -------------------------------------------------------------
document.getElementById('btn-min').addEventListener('click', () => window.api.minimize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

// -------------------------------------------------------------
// ZERO-DEPENDENCY WEB AUDIO SYNTHESIZER
// -------------------------------------------------------------
let soundEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'hover') {
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (type === 'menu_open') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.15);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.16); // G5
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    }
  } catch (e) {
    console.warn('Web Audio error:', e);
  }
}

function attachButtonSounds() {
  document.querySelectorAll('button').forEach(btn => {
    if (!btn.dataset.soundBound) {
      btn.dataset.soundBound = 'true';
      btn.addEventListener('mouseenter', () => playSound('hover'));
      btn.addEventListener('click', () => playSound('click'));
    }
  });
}

// -------------------------------------------------------------
// SYSTEM MENU LOGIC & KEYBOARD SHORTCUTS (ESC)
// -------------------------------------------------------------
const btnSystemMenu = document.getElementById('btn-system-menu');
const sysMenuBackdrop = document.getElementById('system-menu-backdrop');
const btnSysMenuClose = document.getElementById('btn-sys-menu-close');

function openSystemMenu() {
  playSound('menu_open');
  sysMenuBackdrop.classList.add('show');
}

function closeSystemMenu() {
  playSound('click');
  sysMenuBackdrop.classList.remove('show');
}

btnSystemMenu.addEventListener('click', openSystemMenu);
btnSysMenuClose.addEventListener('click', closeSystemMenu);

sysMenuBackdrop.addEventListener('click', (e) => {
  if (e.target === sysMenuBackdrop) closeSystemMenu();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const bgModal = document.getElementById('bg-customizer-modal');
    const checkoutModal = document.getElementById('checkout-modal');

    if (checkoutModal && checkoutModal.classList.contains('show')) {
      checkoutModal.classList.remove('show');
      return;
    }
    if (bgModal && bgModal.classList.contains('show')) {
      bgModal.classList.remove('show');
      return;
    }
    if (sysMenuBackdrop.classList.contains('show')) closeSystemMenu();
    else openSystemMenu();
  }
});

// System Menu Actions
document.getElementById('sys-btn-open-mc').addEventListener('click', () => {
  window.api.openModsFolder();
  closeSystemMenu();
});

document.getElementById('sys-btn-clear-cache').addEventListener('click', () => {
  alert('Client cache and temporary session logs cleared successfully!');
  closeSystemMenu();
});

const sysSoundIcon = document.getElementById('sys-sound-icon');
const sysSoundStatus = document.getElementById('sys-sound-status');
document.getElementById('sys-btn-toggle-sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  sysSoundIcon.innerText = soundEnabled ? '🔊' : '🔇';
  sysSoundStatus.innerText = soundEnabled ? 'Status: Enabled' : 'Status: Muted';
});

document.getElementById('sys-btn-check-updates').addEventListener('click', () => {
  alert('You are running the latest version: NMCLUNCHER v1.3.0 (Fabric 1.21.1)');
  closeSystemMenu();
});

document.getElementById('sys-btn-quit').addEventListener('click', () => {
  window.api.close();
});

// -------------------------------------------------------------
// TAB NAVIGATION
// -------------------------------------------------------------
const tabs = document.querySelectorAll('.nav-tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');

    const targetId = `tab-${tab.getAttribute('data-tab')}`;
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');

    const tabName = tab.getAttribute('data-tab');
    if (tabName === 'store') renderStoreListings();
    if (tabName === 'accounts') renderAccountsList();
    if (tabName === 'mods') renderLocalMods();
    if (tabName === 'mod-manager') renderModManagerStatus();
    if (tabName === 'hud') renderHudConfig();
    if (tabName === 'modrinth') triggerModrinthSearch();
  });
});

// -------------------------------------------------------------
// PROFILE & MULTI-ACCOUNT MANAGEMENT
// -------------------------------------------------------------
const navPlayerName = document.getElementById('nav-player-name');
const navAccountType = document.getElementById('nav-account-type');
const navAvatar = document.getElementById('nav-avatar');
const footerUsername = document.getElementById('footer-username');
const btnPlay = document.getElementById('btn-play');
let cachedAccounts = { activeId: null, accounts: [] };

async function syncProfile() {
  try {
    cachedAccounts = await window.api.getAccounts();
    const active = (cachedAccounts.accounts || []).find(a => a.id === cachedAccounts.activeId);

    if (active) {
      navPlayerName.innerText = active.username;
      navAccountType.innerText = active.type.toUpperCase();
      navAvatar.src = active.skin || `https://minotar.net/avatar/${encodeURIComponent(active.username)}/32`;
      footerUsername.innerText = `Playing as: ${active.username}`;
      btnPlay.classList.remove('disabled');
      btnPlay.title = `Launch Minecraft 1.21.1 as ${active.username}`;
    } else {
      navPlayerName.innerText = "No Account";
      navAccountType.innerText = "NONE";
      navAvatar.src = "https://minotar.net/avatar/MHF_Steve/32";
      footerUsername.innerText = "Select or create profile to play";
      btnPlay.classList.add('disabled');
      btnPlay.title = "Please log in or select an account first!";
    }
  } catch (err) {
    console.error('Error syncing profile:', err);
  }
}

// Top Profile Widget Shortcut
document.getElementById('top-profile-card').addEventListener('click', () => {
  const accTab = document.querySelector('.nav-tab[data-tab="accounts"]');
  if (accTab) accTab.click();
});

// Accounts Manager Tab
const accountsCardsGrid = document.getElementById('accounts-cards-grid');
async function renderAccountsList() {
  await syncProfile();
  accountsCardsGrid.innerHTML = '';

  if (!cachedAccounts.accounts || cachedAccounts.accounts.length === 0) {
    accountsCardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #94a3b8; background: #090c12; border-radius: 8px;">
        <p style="font-size: 14px; margin-bottom: 8px;">No accounts configured yet.</p>
        <small>Click "Login Microsoft" or "Add Offline Account" above to start playing!</small>
      </div>
    `;
    return;
  }

  cachedAccounts.accounts.forEach(acc => {
    const isAct = acc.id === cachedAccounts.activeId;
    const card = document.createElement('div');
    card.className = 'acc-store-card';
    card.innerHTML = `
      <div class="acc-card-top">
        <img src="${acc.skin}" alt="Avatar">
        <div>
          <strong style="color: #fff; font-size: 14px;">${acc.username}</strong>
          <span class="rank-tag" style="display: block; font-size: 10px;">${acc.type.toUpperCase()}${acc.rankBadge ? ` • ${acc.rankBadge}` : ''}</span>
        </div>
      </div>
      <div class="acc-price-row">
        ${!isAct
          ? `<button class="btn-cyan btn-sel-acc" data-id="${acc.id}">Select Profile</button>`
          : '<span style="color:#2ebd59; font-weight:bold; font-size: 13px;">● Active Profile</span>'
        }
        <button class="btn-secondary btn-del-acc" data-id="${acc.id}" title="Delete Profile">🗑️</button>
      </div>
    `;
    accountsCardsGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-sel-acc').forEach(b => {
    b.addEventListener('click', async e => {
      const id = e.currentTarget.getAttribute('data-id');
      await window.api.setActiveAccount(id);
      await syncProfile();
      renderAccountsList();
    });
  });

  document.querySelectorAll('.btn-del-acc').forEach(b => {
    b.addEventListener('click', async e => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this profile?')) {
        await window.api.deleteAccount(id);
        await syncProfile();
        renderAccountsList();
      }
    });
  });

  attachButtonSounds();
}

document.getElementById('btn-add-ms').addEventListener('click', async () => {
  const btn = document.getElementById('btn-add-ms');
  btn.disabled = true;
  btn.innerText = 'Connecting to Microsoft...';
  const res = await window.api.loginMicrosoft();
  btn.disabled = false;
  btn.innerText = 'Login Microsoft ⚡';

  if (res.success) {
    await syncProfile();
    renderAccountsList();
    playSound('success');
  } else if (res.error) {
    alert(`Microsoft Login Error: ${res.error}`);
  }
});

document.getElementById('btn-add-offline').addEventListener('click', async () => {
  const name = prompt('Enter desired offline player name (3-16 chars):');
  if (name && name.trim()) {
    const res = await window.api.createOfflineAccount(name.trim());
    if (res.success) {
      await syncProfile();
      renderAccountsList();
      playSound('success');
    } else {
      alert(`Error: ${res.error}`);
    }
  }
});

// -------------------------------------------------------------
// ACCOUNT MARKETPLACE & KHQR CHECKOUT
// -------------------------------------------------------------
const storeGrid = document.getElementById('store-grid');
const checkoutModal = document.getElementById('checkout-modal');
const btnCloseCheckout = document.getElementById('btn-close-checkout');
const btnSimulatePaid = document.getElementById('btn-simulate-paid');
let activeCheckoutId = null;

async function renderStoreListings() {
  const items = await window.api.getStoreListings();
  storeGrid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'acc-store-card';
    card.innerHTML = `
      <div class="acc-card-top">
        <img src="${item.avatar}" alt="Avatar">
        <div class="acc-card-info">
          <strong>${item.displayName}</strong>
          <span class="rank-tag">${item.rank}</span>
        </div>
      </div>
      <ul class="acc-features">
        ${item.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <div class="acc-price-row">
        <span class="price-cyan">${item.priceKhr} (${item.priceUsd}$)</span>
        <button class="btn-cyan btn-buy-store" data-id="${item.id}" data-name="${item.displayName}" data-price="${item.priceKhr}">BUY NOW ⚡</button>
      </div>
    `;
    storeGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-buy-store').forEach(b => {
    b.addEventListener('click', e => {
      activeCheckoutId = e.currentTarget.getAttribute('data-id');
      document.getElementById('checkout-acc-name').innerText = e.currentTarget.getAttribute('data-name');
      document.getElementById('checkout-acc-price').innerText = e.currentTarget.getAttribute('data-price');
      checkoutModal.classList.add('show');
    });
  });

  attachButtonSounds();
}

btnCloseCheckout.addEventListener('click', () => checkoutModal.classList.remove('show'));

btnSimulatePaid.addEventListener('click', async () => {
  if (!activeCheckoutId) return;
  btnSimulatePaid.disabled = true;
  btnSimulatePaid.innerText = 'Verifying KHQR Payment...';

  const res = await window.api.processPurchase(activeCheckoutId);
  btnSimulatePaid.disabled = false;
  btnSimulatePaid.innerText = 'Verify & Auto-Inject Account ⚡';

  if (res.success) {
    checkoutModal.classList.remove('show');
    playSound('success');
    alert(`✓ Payment Verified! Account [${res.account.username}] has been successfully injected into your launcher profiles.`);
    await syncProfile();
    renderAccountsList();
  } else {
    alert(`Purchase Failed: ${res.error}`);
  }
});

// -------------------------------------------------------------
// MODRINTH API v2 BROWSER & 1-CLICK INSTALLER
// -------------------------------------------------------------
const modrinthSearchInput = document.getElementById('modrinth-search');
const btnModrinthQuery = document.getElementById('btn-modrinth-query');
const modrinthGrid = document.getElementById('modrinth-grid');
let activeProjectType = 'mod';

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeProjectType = btn.getAttribute('data-type');
    triggerModrinthSearch();
  });
});

async function triggerModrinthSearch() {
  const query = modrinthSearchInput.value.trim();
  modrinthGrid.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #94a3b8;">
      <p style="font-size: 15px;">🔍 Querying Modrinth API v2 for 1.21.1 ${activeProjectType === 'mod' ? 'Fabric Mods' : 'Resource Packs'}...</p>
    </div>
  `;

  const res = await window.api.searchModrinth({ query, projectType: activeProjectType });
  modrinthGrid.innerHTML = '';

  if (!res.success || !res.hits || res.hits.length === 0) {
    modrinthGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #94a3b8;">
        <p>No matching packages found on Modrinth for Minecraft 1.21.1.</p>
      </div>
    `;
    return;
  }

  res.hits.forEach(hit => {
    const card = document.createElement('div');
    card.className = 'modrinth-card';
    card.id = `mod-card-${hit.slug}`;
    const iconSrc = hit.icon_url || 'https://minotar.net/avatar/MHF_Steve/48';

    card.innerHTML = `
      <div class="modrinth-top">
        <img class="modrinth-icon" src="${iconSrc}" alt="Icon" onerror="this.src='https://minotar.net/avatar/MHF_Steve/48'">
        <div class="modrinth-info">
          <div class="modrinth-title">${hit.title}</div>
          <div class="modrinth-downloads">⬇ ${(hit.downloads || 0).toLocaleString()} downloads</div>
        </div>
      </div>
      <div class="modrinth-desc">${hit.description || 'No description provided.'}</div>
      <div class="modrinth-action-row">
        <span style="font-size: 10px; color: #64748b; font-weight: 700;">1.21.1 FABRIC</span>
        <button class="btn-install-mod ${hit.isInstalled ? 'installed' : ''}" data-slug="${hit.slug}" data-type="${hit.project_type}">
          ${hit.isInstalled ? '✓ Installed' : 'Install ⚡'}
        </button>
      </div>
      <div class="card-progress-bar" id="prog-${hit.slug}"></div>
    `;
    modrinthGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-install-mod').forEach(btn => {
    if (!btn.classList.contains('installed')) {
      btn.addEventListener('click', async e => {
        const slug = e.currentTarget.getAttribute('data-slug');
        const pType = e.currentTarget.getAttribute('data-type');
        e.currentTarget.disabled = true;
        e.currentTarget.innerText = 'Downloading...';

        const installRes = await window.api.installModrinth({ slug, projectType: pType });
        if (installRes.success) {
          e.currentTarget.classList.add('installed');
          e.currentTarget.innerText = '✓ Installed';
          playSound('success');
          renderLocalMods();
        } else {
          e.currentTarget.disabled = false;
          e.currentTarget.innerText = 'Install ⚡';
          alert(`Download failed: ${installRes.error}`);
        }
      });
    }
  });

  attachButtonSounds();
}

btnModrinthQuery.addEventListener('click', triggerModrinthSearch);
modrinthSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') triggerModrinthSearch();
});

// Live Download Progress Listener
window.api.onDownloadProgress(({ slug, percent }) => {
  const bar = document.getElementById(`prog-${slug}`);
  if (bar) {
    bar.style.width = `${percent}%`;
    if (percent >= 100) {
      setTimeout(() => { bar.style.width = '0%'; }, 1500);
    }
  }
});

// -------------------------------------------------------------
// LOCAL MODS MANAGER & DRAG-AND-DROP ENGINE
// -------------------------------------------------------------
const localModsBody = document.getElementById('local-mods-body');
const modsTableWrapper = document.querySelector('.mods-table-wrapper');

async function renderLocalMods() {
  localModsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">Scanning .minecraft/mods directory...</td></tr>';
  const mods = await window.api.getLocalMods();
  localModsBody.innerHTML = '';

  if (!mods || mods.length === 0) {
    localModsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 25px; color: #64748b;">No mods installed yet. Drag & Drop .jar files here or install from Modrinth Store!</td></tr>';
    return;
  }

  mods.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <label class="switch">
          <input type="checkbox" class="mod-tog" data-fn="${m.filename}" ${m.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
      <td><strong>${m.name}</strong></td>
      <td><span style="color: #94a3b8;">${m.sizeMb} MB</span></td>
      <td style="text-align: center;"><button class="btn-secondary btn-del-mod" data-fn="${m.filename}">Delete</button></td>
    `;
    localModsBody.appendChild(tr);
  });

  document.querySelectorAll('.mod-tog').forEach(b => {
    b.addEventListener('change', async e => {
      await window.api.toggleMod(e.currentTarget.getAttribute('data-fn'));
      renderLocalMods();
    });
  });

  document.querySelectorAll('.btn-del-mod').forEach(b => {
    b.addEventListener('click', async e => {
      const fn = e.currentTarget.getAttribute('data-fn');
      if (confirm(`Delete mod "${fn}" from disk?`)) {
        await window.api.deleteMod(fn);
        renderLocalMods();
      }
    });
  });

  attachButtonSounds();
}

document.getElementById('btn-open-mods-folder').addEventListener('click', () => window.api.openModsFolder());

// Drag-and-Drop Implementation
if (modsTableWrapper) {
  modsTableWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    modsTableWrapper.classList.add('drag-over');
  });

  modsTableWrapper.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    modsTableWrapper.classList.remove('drag-over');
  });

  modsTableWrapper.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    modsTableWrapper.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files || []);
    const jarPaths = files.map(f => f.path).filter(p => p && p.endsWith('.jar'));

    if (jarPaths.length > 0) {
      const res = await window.api.importModFiles(jarPaths);
      if (res.success) {
        playSound('success');
        renderLocalMods();
      }
    }
  });
}

// -------------------------------------------------------------
// MINECRAFT 1.21.1 & MOD-MANAGEMENT SYSTEM
// -------------------------------------------------------------
async function renderModManagerStatus() {
  const usernameInput = document.getElementById('mc-mod-username');
  if (usernameInput && !usernameInput.value && navPlayerName) {
    const currentName = navPlayerName.innerText.trim();
    if (currentName && currentName !== 'No Account' && currentName !== 'គ្មានគណនី') {
      usernameInput.value = currentName;
    }
  }

  const container = document.getElementById('mods-list-container');
  if (!container) return;

  try {
    const api = window.nmcAPI || window.api;
    let res = null;
    if (api && api.fetchAPI) {
      res = await api.fetchAPI('/mods/list');
    } else if (api && api.getMandatoryMods) {
      res = await api.getMandatoryMods();
    }

    if (res && res.mods && res.mods.length > 0) {
      container.innerHTML = '';
      res.mods.forEach(m => {
        const item = document.createElement('div');
        item.style.padding = '10px';
        item.style.background = '#090c12';
        item.style.borderRadius = '6px';
        item.style.border = '1px solid #1f2937';
        item.innerHTML = `<span style="color: #00ff88; font-weight: 600;">🟢 ${m.name}</span> <span style="color: #94a3b8; font-size: 11px;">(v${m.version}) — ${m.required ? 'Installed & Mandatory' : 'Ready'}</span>`;
        container.appendChild(item);
      });
    }
  } catch (e) {
    console.warn('Could not refresh server mods list:', e);
  }
}

// Launch Modded Minecraft 1.21.1 Action Handler
const launchModdedBtn = document.getElementById('launch-modded-mc-btn');
if (launchModdedBtn) {
  launchModdedBtn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('mc-mod-username');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const ramAllocation = document.getElementById('mc-ram') ? document.getElementById('mc-ram').value : '4G';
    const btn = launchModdedBtn;

    if (!username) {
      alert('Please enter your Minecraft username before launching!');
      return;
    }

    btn.innerText = "កំពុងផ្ទុកម៉ូដ និងបើកហ្គេម... (LAUNCHING)";
    btn.disabled = true;

    try {
      const api = window.nmcAPI || window.api;
      if (api && api.fetchAPI) {
        await api.fetchAPI('/mods/list');
      }
      
      // Trigger Electron main process game spawn wrapper
      const launchRes = await (api && api.invokeMinecraftLaunch
        ? api.invokeMinecraftLaunch({ username, version: '1.21.1', ramAllocation })
        : (api && api.launch ? api.launch({ version: '1.21.1' }) : { success: false, error: 'No launch API' }));

      if (launchRes && launchRes.success) {
        playSound('success');
        alert('Minecraft 1.21.1 launched successfully with all mods loaded!');
      }
    } catch (err) {
      alert('Error launching modded Minecraft: ' + err.message);
    } finally {
      setTimeout(() => {
        btn.innerText = "LAUNCH 1.21.1 (លេងហ្គេម)";
        btn.disabled = false;
      }, 3000);
    }
  });
}

// Load dynamic mod list on startup
async function loadServerMods() {
  const container = document.getElementById('dynamic-mods-list');
  if (!container) return;

  try {
    const api = window.nmcAPI || window.api;
    let res = null;
    if (api && api.fetchAPI) {
      res = await api.fetchAPI('/mods/list');
    } else if (api && api.getMandatoryMods) {
      res = await api.getMandatoryMods();
    }
    
    const mods = res && res.data && res.data.mods ? res.data.mods : (res && res.mods ? res.mods : null);
    if (mods && mods.length > 0) {
      window.cachedServerMods = mods;
      container.innerHTML = mods.map(mod => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #090c12; border-radius: 6px; border: 1px solid #1f2937;">
          <span>📦 <b>${mod.name}</b> <small style="color:#888;">(${mod.filename})</small></span>
          <span style="color: #00ff88; font-weight: 600;">✓ Ready to Sync</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color: #e50914;">Failed to load mod repository manifest.</p>';
    }
  } catch (e) {
    container.innerHTML = '<p style="color: #e50914;">Failed to connect to mod repository.</p>';
  }
}
window.loadServerMods = loadServerMods;

// Sync Mods & Launch Minecraft Action
const syncLaunchBtn = document.getElementById('sync-launch-btn');
if (syncLaunchBtn) {
  syncLaunchBtn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('mc-mod-username');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const ramAllocation = document.getElementById('mc-ram') ? document.getElementById('mc-ram').value : '4G';
    const btn = syncLaunchBtn;

    if (!username) {
      alert('Please enter your Minecraft username first!');
      return;
    }

    if (!window.cachedServerMods) {
      await loadServerMods();
      if (!window.cachedServerMods) {
        alert('Mod manifest not loaded yet. Please wait.');
        return;
      }
    }

    btn.innerText = "កំពុងពិនិត្យ និងទាញយកម៉ូដ... (SYNCING MODS)";
    btn.disabled = true;

    try {
      const api = window.nmcAPI || window.api;
      const result = await api.invokeSyncAndLaunch({
        modsList: window.cachedServerMods,
        username,
        ramAllocation
      });

      if (result && result.success) {
        playSound('success');
        alert('All mods synchronized successfully! Minecraft is starting...');
      }
    } catch (err) {
      alert('Error during mod synchronization: ' + err.message);
    } finally {
      setTimeout(() => {
        btn.innerText = "SYNCHRONIZE MODS & LAUNCH (ធ្វើបច្ចុប្បន្នភាព និងលេង)";
        btn.disabled = false;
      }, 3000);
    }
  });
}


// Update setLanguage function to include Minecraft mods tab
function setLanguage(lang) {
  const navMods = document.getElementById('nav-mods');
  const txtModTitle = document.getElementById('txt-mod-title');
  if (lang === 'km') {
    if (navMods) navMods.innerText = "Minecraft & Mods (គ្រប់គ្រងម៉ូដ)";
    if (txtModTitle) txtModTitle.innerText = "NMC Minecraft 1.21.1 និងប្រព័ន្ធគ្រប់គ្រងម៉ូដ";
  } else {
    if (navMods) navMods.innerText = "Minecraft & Mods";
    if (txtModTitle) txtModTitle.innerText = "NMC Minecraft 1.21.1 & Mod Manager";
  }
}
window.setLanguage = setLanguage;

// -------------------------------------------------------------
// IN-GAME PVP HUD CONFIGURATION
// -------------------------------------------------------------
let currentAccentColor = '#00f3ff';

function setAccentColor(colorHex) {
  if (!colorHex) return;
  currentAccentColor = colorHex;
  document.documentElement.style.setProperty('--hud-accent', colorHex);
  
  const tagColorPreview = document.getElementById('tag-color-preview');
  if (tagColorPreview) tagColorPreview.style.background = colorHex;

  // Highlight active dot
  document.querySelectorAll('.color-dot').forEach(dot => {
    const dotColor = dot.getAttribute('data-color') || '';
    if (dotColor.toLowerCase() === colorHex.toLowerCase() || dot.classList.contains(colorHex)) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  localStorage.setItem('nmc_hud_accent', colorHex);
}

// Attach click listeners to color dots
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', (e) => {
    const col = e.currentTarget.getAttribute('data-color');
    if (col) {
      setAccentColor(col);
      playSound('click');
    }
  });
});

async function renderHudConfig() {
  try {
    const cfg = await window.api.getHudConfig() || {};
    const reachEl = document.getElementById('toggle-reach');
    const targetHpEl = document.getElementById('toggle-target-hp');
    const fpsPingEl = document.getElementById('toggle-fps-ping');
    const keystrokesEl = document.getElementById('toggle-keystrokes');
    const durabilityEl = document.getElementById('toggle-durability');
    const coordsEl = document.getElementById('toggle-coords');
    const crosshairCpsEl = document.getElementById('toggle-crosshair-cps');
    const rankTagEl = document.getElementById('custom-rank-tag');

    if (reachEl) reachEl.checked = cfg.reachDisplay !== false;
    if (targetHpEl) targetHpEl.checked = cfg.targetHealth !== false;
    if (fpsPingEl) fpsPingEl.checked = cfg.pingFps !== false;
    if (keystrokesEl) keystrokesEl.checked = cfg.keystrokesBps !== false;
    if (durabilityEl) durabilityEl.checked = cfg.armorDurability !== false;
    if (coordsEl) coordsEl.checked = cfg.coords !== false;
    if (crosshairCpsEl) crosshairCpsEl.checked = cfg.crosshairCps !== false;
    if (rankTagEl) rankTagEl.value = cfg.customTag || '[NMC-PRO]';

    const savedAccent = cfg.accentColor || localStorage.getItem('nmc_hud_accent') || '#00f3ff';
    setAccentColor(savedAccent);
  } catch (err) {
    console.error('Error loading HUD config:', err);
  }
}

async function saveHudSettings() {
  const reachEl = document.getElementById('toggle-reach');
  const targetHpEl = document.getElementById('toggle-target-hp');
  const fpsPingEl = document.getElementById('toggle-fps-ping');
  const keystrokesEl = document.getElementById('toggle-keystrokes');
  const durabilityEl = document.getElementById('toggle-durability');
  const coordsEl = document.getElementById('toggle-coords');
  const crosshairCpsEl = document.getElementById('toggle-crosshair-cps');
  const rankTagEl = document.getElementById('custom-rank-tag');

  const payload = {
    reachDisplay: reachEl ? reachEl.checked : true,
    targetHealth: targetHpEl ? targetHpEl.checked : true,
    pingFps: fpsPingEl ? fpsPingEl.checked : true,
    keystrokesBps: keystrokesEl ? keystrokesEl.checked : true,
    armorDurability: durabilityEl ? durabilityEl.checked : true,
    coords: coordsEl ? coordsEl.checked : true,
    crosshairCps: crosshairCpsEl ? crosshairCpsEl.checked : true,
    customTag: rankTagEl ? rankTagEl.value.trim() || '[NMC-PRO]' : '[NMC-PRO]',
    tagColor: currentAccentColor,
    accentColor: currentAccentColor
  };

  try {
    const res = await window.api.saveHudConfig(payload);
    if (res && res.success) {
      playSound('success');
      alert('✓ In-Game PvP HUD settings saved and synced to Minecraft (.minecraft/nmc_pvp_modules.json)!');
    } else {
      alert(`Failed saving config: ${res ? res.error : 'Unknown error'}`);
    }
  } catch (err) {
    alert(`Error saving HUD settings: ${err.message}`);
  }
}

async function resetHudSettings() {
  setAccentColor('#00f3ff');
  const toggles = [
    'toggle-reach', 'toggle-target-hp', 'toggle-fps-ping',
    'toggle-keystrokes', 'toggle-durability', 'toggle-coords', 'toggle-crosshair-cps'
  ];
  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });

  const rankTagEl = document.getElementById('custom-rank-tag');
  if (rankTagEl) rankTagEl.value = '[NMC-PRO]';

  const defaultPayload = {
    reachDisplay: true,
    targetHealth: true,
    pingFps: true,
    keystrokesBps: true,
    armorDurability: true,
    coords: true,
    crosshairCps: true,
    customTag: '[NMC-PRO]',
    tagColor: '#00f3ff',
    accentColor: '#00f3ff'
  };

  await window.api.saveHudConfig(defaultPayload);
  localStorage.setItem('nmc_hud_accent', '#00f3ff');
  playSound('success');
  alert('ℹ️ PvP HUD Settings successfully reset to defaults!');
}

const btnSaveHud = document.getElementById('btn-save-hud');
if (btnSaveHud) btnSaveHud.addEventListener('click', saveHudSettings);

const btnResetHud = document.getElementById('btn-reset-hud');
if (btnResetHud) btnResetHud.addEventListener('click', resetHudSettings);


// -------------------------------------------------------------
// DYNAMIC BACKGROUND CUSTOMIZER
// -------------------------------------------------------------
const heroArtwork = document.getElementById('hero-artwork');
const bgDimOverlay = document.getElementById('bg-dim-overlay');
const btnOpenBgModal = document.getElementById('btn-open-bg-modal');
const bgCustomizerModal = document.getElementById('bg-customizer-modal');
const btnCloseBgModal = document.getElementById('btn-close-bg-modal');
const btnBrowseBg = document.getElementById('btn-browse-bg');
const btnSaveBg = document.getElementById('btn-save-bg');
const toggleKenBurns = document.getElementById('toggle-ken-burns');
const rangeBgDim = document.getElementById('range-bg-dim');
const presetItems = document.querySelectorAll('.preset-item');

let currentBgConfig = {
  type: 'preset',
  url: 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg',
  kenBurns: true,
  dimLevel: 0.4
};

function applyBackgroundSettings(cfg) {
  if (!cfg || !heroArtwork) return;
  heroArtwork.style.backgroundImage = `url("${cfg.url}")`;

  if (cfg.kenBurns) heroArtwork.classList.add('ken-burns');
  else heroArtwork.classList.remove('ken-burns');

  if (bgDimOverlay) {
    bgDimOverlay.style.background = `rgba(12, 15, 23, ${cfg.dimLevel !== undefined ? cfg.dimLevel : 0.4})`;
  }

  if (toggleKenBurns) toggleKenBurns.checked = !!cfg.kenBurns;
  if (rangeBgDim) rangeBgDim.value = cfg.dimLevel !== undefined ? cfg.dimLevel : 0.4;

  presetItems.forEach(item => {
    if (item.getAttribute('data-url') === cfg.url) item.classList.add('active');
    else item.classList.remove('active');
  });
}

window.api.getBackgroundConfig().then(cfg => {
  if (cfg) {
    currentBgConfig = cfg;
    applyBackgroundSettings(currentBgConfig);
  }
});

btnOpenBgModal.addEventListener('click', () => bgCustomizerModal.classList.add('show'));
btnCloseBgModal.addEventListener('click', () => bgCustomizerModal.classList.remove('show'));

bgCustomizerModal.addEventListener('click', (e) => {
  if (e.target === bgCustomizerModal) bgCustomizerModal.classList.remove('show');
});

presetItems.forEach(item => {
  item.addEventListener('click', () => {
    presetItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentBgConfig.type = 'preset';
    currentBgConfig.url = item.getAttribute('data-url');
    applyBackgroundSettings(currentBgConfig);
  });
});

btnBrowseBg.addEventListener('click', async () => {
  const res = await window.api.selectCustomBackground();
  if (res.success && res.dataUrl) {
    presetItems.forEach(i => i.classList.remove('active'));
    currentBgConfig.type = 'custom';
    currentBgConfig.url = res.dataUrl;
    applyBackgroundSettings(currentBgConfig);
  }
});

toggleKenBurns.addEventListener('change', () => {
  currentBgConfig.kenBurns = toggleKenBurns.checked;
  applyBackgroundSettings(currentBgConfig);
});

rangeBgDim.addEventListener('input', () => {
  currentBgConfig.dimLevel = parseFloat(rangeBgDim.value);
  applyBackgroundSettings(currentBgConfig);
});

btnSaveBg.addEventListener('click', async () => {
  const res = await window.api.saveBackgroundConfig(currentBgConfig);
  if (res.success) {
    bgCustomizerModal.classList.remove('show');
    playSound('success');
    alert('✓ Wallpaper configuration saved persistently!');
  } else {
    alert(`Error saving background: ${res.error}`);
  }
});

// -------------------------------------------------------------
// GAME LAUNCHING & STATUS ORCHESTRATION
// -------------------------------------------------------------
const statusOverlay = document.getElementById('status-overlay');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');

btnPlay.addEventListener('click', () => {
  if (btnPlay.classList.contains('disabled')) {
    alert('Please select or create an account first in the "Accounts Manager 👤" tab!');
    const accTab = document.querySelector('.nav-tab[data-tab="accounts"]');
    if (accTab) accTab.click();
    return;
  }

  btnPlay.disabled = true;
  statusOverlay.classList.add('show');
  statusText.innerText = "Initializing Minecraft 1.21.1 Environment...";
  progressFill.style.width = "10%";

  window.api.launch({ version: "1.21.1" });
});

window.api.onStatus(data => {
  if (statusText) statusText.innerText = data.message || 'Processing...';
  if (progressFill && data.progress !== undefined) {
    progressFill.style.width = `${data.progress}%`;
  }
});

window.api.onClosed(() => {
  btnPlay.disabled = false;
  statusOverlay.classList.remove('show');
  if (progressFill) progressFill.style.width = "0%";
});

// Version dropdown toggle
const dropdownToggle = document.getElementById('dropdown-toggle');
const versionMenu = document.getElementById('version-menu');
dropdownToggle.addEventListener('click', () => versionMenu.classList.toggle('show'));

// Initialize on boot
syncProfile();
renderHudConfig();
renderModManagerStatus();
loadServerMods();
attachButtonSounds();



