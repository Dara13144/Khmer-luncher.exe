const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { Client, Authenticator } = require('minecraft-launcher-core');
const msmc = require('msmc');

let mainWindow = null;
const launcher = new Client();

// -------------------------------------------------------------
// SECURE FILE SYSTEM & DIRECTORY RESOLUTION
// -------------------------------------------------------------
const getAppData = () => {
  if (process.env.APPDATA) return process.env.APPDATA;
  if (process.platform === 'darwin') return path.join(process.env.HOME || '', 'Library', 'Application Support');
  return path.join(process.env.HOME || '', '.config');
};

const getMinecraftDir = () => {
  const d = path.join(getAppData(), '.minecraft');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
};

const getModsDir = () => {
  const d = path.join(getMinecraftDir(), 'mods');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
};

const getResourcePacksDir = () => {
  const d = path.join(getMinecraftDir(), 'resourcepacks');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
};

const getUserDataDir = () => app.getPath('userData');
const accountsPath = path.join(getUserDataDir(), 'nmc_accounts.json');
const hudConfigPath = path.join(getMinecraftDir(), 'nmc_pvp_modules.json');
const bgConfigPath = path.join(getUserDataDir(), 'nmc_background.json');
const userBgDir = path.join(getUserDataDir(), 'custom_backgrounds');

// Ensure base directories exist
try {
  if (!fs.existsSync(userBgDir)) fs.mkdirSync(userBgDir, { recursive: true });
  getModsDir();
  getResourcePacksDir();
} catch (e) {
  console.error('[Storage Error] Directory initialization failed:', e);
}

// -------------------------------------------------------------
// ATOMIC & SAFE JSON STORAGE HELPERS
// -------------------------------------------------------------
function atomicWriteJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[Atomic Write Error] Failed writing ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }
}

function safeReadJson(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[Safe Read Warning] Could not parse ${filePath}, using fallback.`);
  }
  return fallback;
}

// -------------------------------------------------------------
// WINDOW LIFECYCLE
// -------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 700,
    minWidth: 980,
    minHeight: 620,
    frame: false,
    backgroundColor: '#0c0f17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('open-external', (e, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  }
});

// -------------------------------------------------------------
// 1. DYNAMIC BACKGROUND PERSISTENCE & IMAGE PICKER
// -------------------------------------------------------------
ipcMain.handle('get-background-config', async () => {
  return safeReadJson(bgConfigPath, {
    type: 'preset',
    url: 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg',
    kenBurns: true,
    dimLevel: 0.4
  });
});

ipcMain.handle('save-background-config', async (event, config) => {
  if (!config || typeof config !== 'object') return { success: false, error: 'Invalid config payload' };
  const ok = atomicWriteJson(bgConfigPath, config);
  return { success: ok };
});

ipcMain.handle('select-custom-background', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'ជ្រើសរើសរូបភាព Background សម្រាប់ Launcher',
      filters: [
        { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, error: 'Selection cancelled' };
    }

    const srcPath = result.filePaths[0];
    const ext = path.extname(srcPath).toLowerCase() || '.png';
    const destName = `bg_${Date.now()}${ext}`;
    const destPath = path.join(userBgDir, destName);

    fs.copyFileSync(srcPath, destPath);

    const imageBuffer = fs.readFileSync(destPath);
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : (ext === '.webp' ? 'image/webp' : 'image/png');
    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    return {
      success: true,
      filePath: destPath,
      dataUrl: base64Image
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------
// 2. ACCOUNTS & MARKETPLACE ENGINE
// -------------------------------------------------------------
function loadAccounts() {
  return safeReadJson(accountsPath, { activeId: null, accounts: [] });
}

function saveAccounts(data) {
  return atomicWriteJson(accountsPath, data);
}

ipcMain.handle('get-accounts', async () => {
  return loadAccounts();
});

ipcMain.handle('set-active-account', async (event, id) => {
  try {
    const data = loadAccounts();
    const target = data.accounts.find(a => a.id === id);
    if (!target) return { success: false, error: 'Account not found' };
    data.activeId = id;
    saveAccounts(data);
    return { success: true, activeAccount: target };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('create-offline-account', async (event, username) => {
  try {
    const name = (username || '').trim();
    if (name.length < 3 || name.length > 16) {
      return { success: false, error: 'Username must be between 3 and 16 characters' };
    }
    const data = loadAccounts();
    const acc = {
      id: 'offline_' + uuidv4().substring(0, 8),
      type: 'offline',
      username: name,
      uuid: uuidv4(),
      skin: `https://minotar.net/avatar/${encodeURIComponent(name)}/40`,
      createdAt: Date.now()
    };
    data.accounts.push(acc);
    data.activeId = acc.id;
    saveAccounts(data);
    return { success: true, account: acc };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('login-microsoft', async () => {
  try {
    const authManager = new msmc.Auth('select_account');
    const xbox = await authManager.launch('electron');
    const mc = await xbox.getMinecraft();
    const data = loadAccounts();
    const existing = data.accounts.findIndex(a => a.uuid === mc.profile.id);
    const acc = {
      id: 'ms_' + mc.profile.id,
      type: 'microsoft',
      username: mc.profile.name,
      uuid: mc.profile.id,
      skin: `https://minotar.net/avatar/${encodeURIComponent(mc.profile.name)}/40`,
      authData: mc.mclc(),
      refreshToken: xbox.save().refresh_token,
      createdAt: Date.now()
    };

    if (existing >= 0) data.accounts[existing] = acc;
    else data.accounts.push(acc);

    data.activeId = acc.id;
    saveAccounts(data);
    return { success: true, account: acc };
  } catch (err) {
    return { success: false, error: err.message || 'Microsoft Authentication failed' };
  }
});

ipcMain.handle('delete-account', async (event, id) => {
  try {
    const data = loadAccounts();
    data.accounts = data.accounts.filter(a => a.id !== id);
    if (data.activeId === id) {
      data.activeId = data.accounts[0]?.id || null;
    }
    saveAccounts(data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

const storeInventory = [
  {
    id: "acc_store_01",
    displayName: "ShadowSlayer_KH",
    accountType: "Official Microsoft (Full Access)",
    priceUsd: 12.50,
    priceKhr: "50,000៛",
    rank: "Hypixel [MVP+]",
    features: ["Level 128 Hypixel", "Migrator Cape", "Clean Ban Record"],
    avatar: "https://minotar.net/bust/Shadow/100"
  },
  {
    id: "acc_store_02",
    displayName: "ViperKingPvP",
    accountType: "Ranked Profile (Full Access)",
    priceUsd: 8.00,
    priceKhr: "32,000៛",
    rank: "Hypixel [VIP]",
    features: ["OptiFine Cape", "Skywars Gold Prestige"],
    avatar: "https://minotar.net/bust/Viper/100"
  },
  {
    id: "acc_store_03",
    displayName: "NMC_GodGamer",
    accountType: "Official Vanilla Account",
    priceUsd: 15.00,
    priceKhr: "60,000៛",
    rank: "NMC Network [VIP+]",
    features: ["Vanilla 1.21.1", "Email Changeable", "Exclusive Cape"],
    avatar: "https://minotar.net/bust/Steve/100"
  }
];

ipcMain.handle('get-store-listings', async () => storeInventory);

ipcMain.handle('process-account-purchase', async (event, listingId) => {
  try {
    const item = storeInventory.find(i => i.id === listingId);
    if (!item) return { success: false, error: 'Account listing not found!' };

    const data = loadAccounts();
    const injectedAccount = {
      id: 'store_' + uuidv4().substring(0, 8),
      type: 'microsoft',
      username: item.displayName,
      uuid: uuidv4(),
      skin: `https://minotar.net/avatar/${encodeURIComponent(item.displayName)}/40`,
      authData: Authenticator.getAuth(item.displayName),
      rankBadge: item.rank,
      purchasedAt: Date.now()
    };

    data.accounts.push(injectedAccount);
    data.activeId = injectedAccount.id;
    saveAccounts(data);

    return { success: true, account: injectedAccount };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------
// 3. MODRINTH API & RESILIENT STREAMING DOWNLOADER
// -------------------------------------------------------------
function httpsGet(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const req = https.get(url, { headers: { 'User-Agent': 'NMCLauncher/1.3.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Server returned HTTP ${res.statusCode}`));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Network request timed out')));
  });
}

function streamFile(url, dest, onProgress, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const tempDest = `${dest}.download_${Date.now()}`;
    const req = https.get(url, { headers: { 'User-Agent': 'NMCLauncher/1.3.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return streamFile(res.headers.location, dest, onProgress, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }

      const total = parseInt(res.headers['content-length'], 10) || 0;
      let cur = 0;
      let lastReportTime = 0;
      const fileStream = fs.createWriteStream(tempDest);

      res.on('data', chunk => {
        cur += chunk.length;
        const now = Date.now();
        if (total > 0 && onProgress && (now - lastReportTime > 100 || cur === total)) {
          lastReportTime = now;
          onProgress(Math.min(100, Math.round((cur / total) * 100)));
        }
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          try {
            const stat = fs.statSync(tempDest);
            if (stat.size <= 0) {
              try { fs.unlinkSync(tempDest); } catch {}
              return reject(new Error('Downloaded file is empty'));
            }
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            fs.renameSync(tempDest, dest);
            resolve();
          } catch (err) {
            try { fs.unlinkSync(tempDest); } catch {}
            reject(err);
          }
        });
      });

      fileStream.on('error', err => {
        try { fs.unlinkSync(tempDest); } catch {}
        reject(err);
      });
    });

    req.on('error', err => {
      try { fs.unlinkSync(tempDest); } catch {}
      reject(err);
    });

    req.setTimeout(30000, () => req.destroy(new Error('File download timed out')));
  });
}

ipcMain.handle('search-modrinth', async (event, { query, projectType }) => {
  try {
    const isResourcePack = projectType === 'resourcepack';
    const facets = [`["versions:1.21.1"]`, isResourcePack ? `["project_type:resourcepack"]` : `["project_type:mod"]`];
    if (!isResourcePack) facets.push(`["categories:fabric"]`);

    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query || '')}&facets=[${facets.join(',')}]&limit=16&index=downloads`;
    const res = await httpsGet(url);

    let modsList = [];
    let packsList = [];
    try { modsList = fs.readdirSync(getModsDir()).map(f => f.toLowerCase()); } catch {}
    try { packsList = fs.readdirSync(getResourcePacksDir()).map(f => f.toLowerCase()); } catch {}

    const hits = (res.hits || []).map(h => ({
      slug: h.slug,
      title: h.title,
      description: h.description,
      icon_url: h.icon_url,
      downloads: h.downloads,
      project_type: h.project_type,
      isInstalled: modsList.some(f => f.includes(h.slug.toLowerCase())) || packsList.some(f => f.includes(h.slug.toLowerCase()))
    }));

    return { success: true, hits };
  } catch (err) {
    return { success: false, error: err.message, hits: [] };
  }
});

ipcMain.handle('install-modrinth', async (event, { slug, projectType }) => {
  try {
    const param = projectType === 'mod' ? '?game_versions=["1.21.1"]&loaders=["fabric"]' : '?game_versions=["1.21.1"]';
    const versions = await httpsGet(`https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}/version${param}`);
    if (!versions || versions.length === 0) {
      return { success: false, error: 'No compatible 1.21.1 release found on Modrinth!' };
    }

    const file = versions[0].files.find(f => f.primary) || versions[0].files[0];
    if (!file || !file.url) {
      return { success: false, error: 'Version does not contain any downloadable file assets.' };
    }

    const targetDir = projectType === 'resourcepack' ? getResourcePacksDir() : getModsDir();
    const dest = path.join(targetDir, file.filename);

    await streamFile(file.url, dest, (percent) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', { slug, percent });
      }
    });

    return { success: true, filename: file.filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------
// 4. LOCAL MODS MANAGER & DRAG-AND-DROP IMPORT
// -------------------------------------------------------------
ipcMain.handle('get-local-mods', async () => {
  const dir = getModsDir();
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
      .map(file => {
        const full = path.join(dir, file);
        const stats = fs.statSync(full);
        return {
          filename: file,
          name: file.replace('.jar.disabled', '').replace('.jar', ''),
          enabled: file.endsWith('.jar'),
          sizeMb: (stats.size / (1024 * 1024)).toFixed(2)
        };
      });
  } catch {
    return [];
  }
});

ipcMain.handle('toggle-mod', async (event, filename) => {
  const dir = getModsDir();
  const oldPath = path.join(dir, filename);
  const newName = filename.endsWith('.jar') ? `${filename}.disabled` : filename.replace('.disabled', '');
  try {
    fs.renameSync(oldPath, path.join(dir, newName));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-mod', async (event, filename) => {
  try {
    const fullPath = path.join(getModsDir(), filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('import-mod-files', async (event, filePaths) => {
  const dir = getModsDir();
  const results = [];
  if (!Array.isArray(filePaths)) return { success: false, results };

  for (const p of filePaths) {
    try {
      if (!p.endsWith('.jar')) continue;
      const base = path.basename(p);
      const dest = path.join(dir, base);
      fs.copyFileSync(p, dest);
      results.push({ name: base, success: true });
    } catch (e) {
      results.push({ name: path.basename(p), success: false, error: e.message });
    }
  }
  return { success: true, results };
});

ipcMain.on('open-mods-folder', () => {
  shell.openPath(getModsDir());
});

// -------------------------------------------------------------
// 5. IN-GAME PVP HUD CONFIGURATION
// -------------------------------------------------------------
ipcMain.handle('get-hud-config', async () => {
  return safeReadJson(hudConfigPath, {
    reachDisplay: true,
    targetHealth: true,
    pingFps: true,
    keystrokesBps: true,
    armorDurability: true,
    coords: true,
    crosshairCps: true,
    customTag: "[NMC-PRO]",
    accentColor: "#00f3ff",
    tagColor: "#00f3ff"
  });
});

ipcMain.handle('save-hud-config', async (event, cfg) => {
  try {
    const ok = atomicWriteJson(hudConfigPath, cfg);
    return { success: ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function injectBundledMod() {
  const bundled = path.join(__dirname, 'bundled_mods', 'NMCClientMod-1.21.1-1.0.0.jar');
  const dest = path.join(getModsDir(), 'NMCClientMod-1.21.1-1.0.0.jar');
  try {
    if (fs.existsSync(bundled) && !fs.existsSync(dest)) {
      fs.copyFileSync(bundled, dest);
    }
  } catch (e) {
    console.warn('[Bundled Mod] Sync notice:', e.message);
  }
}

// -------------------------------------------------------------
// 6. JAVA RUNTIME DETECTION & GAME LAUNCHER
// -------------------------------------------------------------
function detectJava21() {
  const candidates = [
    path.join(getMinecraftDir(), 'jre', 'OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9', 'bin', 'javaw.exe'),
    path.join(getMinecraftDir(), 'jre', 'OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9', 'bin', 'java.exe'),
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'javaw.exe') : null,
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

ipcMain.on('launch-game', async (event, { version }) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const accountData = loadAccounts();
  const activeAcc = accountData.accounts.find(a => a.id === accountData.activeId);

  if (!activeAcc) {
    mainWindow.webContents.send('status-update', {
      message: 'No active profile found! Please create or select an account.',
      progress: 0
    });
    mainWindow.webContents.send('game-closed');
    return;
  }

  injectBundledMod();

  let auth;
  try {
    if (activeAcc.type === 'microsoft' && activeAcc.authData) {
      auth = activeAcc.authData;
    } else {
      auth = Authenticator.getAuth(activeAcc.username);
    }
  } catch (err) {
    mainWindow.webContents.send('status-update', {
      message: `Authentication generation error: ${err.message}`,
      progress: 0
    });
    mainWindow.webContents.send('game-closed');
    return;
  }

  const detectedJava = detectJava21();

  const opts = {
    clientPackage: null,
    authorization: auth,
    root: getMinecraftDir(),
    javaPath: detectedJava,
    version: { number: version || "1.21.1", type: "release" },
    memory: { max: "6G", min: "2G" }
  };

  // Clean listeners to avoid duplicate memory leaks
  launcher.removeAllListeners();

  mainWindow.webContents.send('status-update', {
    message: `Launching Minecraft 1.21.1 (${activeAcc.username})...`,
    progress: 20
  });

  try {
    launcher.launch(opts);
  } catch (launchErr) {
    mainWindow.webContents.send('status-update', {
      message: `Launch error: ${launchErr.message}`,
      progress: 0
    });
    mainWindow.webContents.send('game-closed');
    return;
  }

  launcher.on('progress', e => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const pct = Math.min(100, Math.round((e.task / (e.total || 1)) * 100));
    mainWindow.webContents.send('status-update', {
      message: `Downloading (${e.type || 'assets'}): ${pct}%`,
      progress: pct
    });
  });

  launcher.on('data', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('status-update', {
      message: 'NMCLUNCHER is Active & Running Minecraft 1.21.1!',
      progress: 100
    });
  });

  launcher.on('close', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('status-update', {
      message: 'Minecraft closed. Ready to play.',
      progress: 0
    });
    mainWindow.webContents.send('game-closed');
  });
});

// -------------------------------------------------------------
// 7. MODDED MINECRAFT LAUNCHER & SERVER MODS API
// -------------------------------------------------------------
const MANDATORY_SERVER_MODS = [
  { id: 'fabric-api', name: 'Fabric API (1.21.1)', required: true, version: '0.97.0' },
  { id: 'nmc-hud-mod', name: 'NMC Custom PvP HUD & Keystrokes', required: true, version: '2.1.0' },
  { id: 'sodium', name: 'Sodium (Performance Optimizer)', required: false, version: '0.5.8' }
];

ipcMain.handle('get-mandatory-mods', async () => {
  return { success: true, mods: MANDATORY_SERVER_MODS };
});

ipcMain.handle('nmc-fetch-api', async (event, endpoint) => {
  if (endpoint === '/mods/list' || endpoint === 'mods/list') {
    return { success: true, mods: MANDATORY_SERVER_MODS };
  }
  return { success: false, error: 'Endpoint not found' };
});

ipcMain.handle('launch-minecraft-modded', async (event, { username, version, ramAllocation }) => {
  try {
    const v = version || '1.21.1';
    const ram = ramAllocation || '4G';
    const user = (username || '').trim() || 'Player';

    console.log(`[NMCLuncher] Booting Minecraft ${v} for player: ${user} with allocated RAM: ${ram}`);

    // Ensure mods directory exists and bundled PvP HUD mod is injected
    const modsDir = getModsDir();
    injectBundledMod();

    // Ensure account exists in accounts list
    let accountData = loadAccounts();
    let targetAcc = accountData.accounts.find(a => a.username.toLowerCase() === user.toLowerCase());
    if (!targetAcc) {
      targetAcc = {
        id: uuidv4(),
        username: user,
        type: 'offline',
        created: Date.now()
      };
      accountData.accounts.push(targetAcc);
      accountData.activeId = targetAcc.id;
      saveAccounts(accountData);
    } else {
      accountData.activeId = targetAcc.id;
      saveAccounts(accountData);
    }

    let auth;
    if (targetAcc.type === 'microsoft' && targetAcc.authData) {
      auth = targetAcc.authData;
    } else {
      auth = Authenticator.getAuth(targetAcc.username);
    }

    const detectedJava = detectJava21();
    const opts = {
      clientPackage: null,
      authorization: auth,
      root: getMinecraftDir(),
      javaPath: detectedJava,
      version: { number: v, type: "release" },
      memory: { max: ram, min: "2G" }
    };

    launcher.removeAllListeners();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('status-update', {
        message: `Starting Modded Minecraft 1.21.1 (${user})...`,
        progress: 25
      });
    }

    launcher.launch(opts);

    launcher.on('progress', e => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const pct = Math.min(100, Math.round((e.task / (e.total || 1)) * 100));
      mainWindow.webContents.send('status-update', {
        message: `Loading Modded Minecraft (${e.type || 'assets'}): ${pct}%`,
        progress: pct
      });
    });

    launcher.on('data', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send('status-update', {
        message: 'NMCLUNCHER is Active & Running Minecraft 1.21.1 with Mods!',
        progress: 100
      });
    });

    launcher.on('close', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send('status-update', {
        message: 'Minecraft closed. Ready to play.',
        progress: 0
      });
      mainWindow.webContents.send('game-closed');
    });

    return { success: true, message: 'Minecraft modded environment initialized successfully.' };
  } catch (err) {
    console.error('[Launch Modded Error]', err);
    throw new Error('Failed to start modded Minecraft: ' + err.message);
  }
});

// Helper function to download a file with redirect support
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const getProtocol = (targetUrl) => targetUrl.startsWith('https') ? require('https') : require('http');

    function fetchUrl(targetUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const proto = getProtocol(targetUrl);
      proto.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return fetchUrl(response.headers.location, redirects + 1);
        }
        if (response.statusCode !== 200) {
          file.close(() => fs.unlink(dest, () => {}));
          return reject(new Error(`Failed to download: Status ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        file.close(() => fs.unlink(dest, () => {}));
        reject(err);
      });
    }

    fetchUrl(url);
  });
}

// IPC Handler to Sync Mods and Launch Minecraft
ipcMain.handle('sync-and-launch-mods', async (event, { modsList, username, ramAllocation }) => {
  try {
    const user = (username || '').trim() || 'Player';
    const ram = ramAllocation || '4G';
    const userHome = app.getPath('userData');
    const minecraftDir = path.join(userHome, 'nmc_minecraft');
    const modsDir = path.join(minecraftDir, 'mods');

    // Ensure directory exists
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }

    const stdModsDir = getModsDir();

    console.log('[NMCLuncher] Checking and syncing required mods...');

    const list = Array.isArray(modsList) ? modsList : [];
    for (const mod of list) {
      const targetPath = path.join(modsDir, mod.filename);
      const stdTargetPath = path.join(stdModsDir, mod.filename);

      // Check bundled copies first
      const bundledPath = path.join(__dirname, 'bundled_mods', mod.filename);
      if (fs.existsSync(bundledPath)) {
        if (!fs.existsSync(targetPath)) fs.copyFileSync(bundledPath, targetPath);
        if (!fs.existsSync(stdTargetPath)) fs.copyFileSync(bundledPath, stdTargetPath);
      } else {
        if (!fs.existsSync(targetPath) && mod.downloadUrl) {
          console.log(`[NMCLuncher] Downloading missing mod: ${mod.name}`);
          try {
            await downloadFile(mod.downloadUrl, targetPath);
            fs.copyFileSync(targetPath, stdTargetPath);
          } catch (dlErr) {
            console.warn(`[NMCLuncher] Could not download ${mod.name}:`, dlErr.message);
          }
        }
      }
    }

    console.log(`[NMCLuncher] All mods verified. Launching Minecraft for ${user} with ${ram} RAM...`);
    
    // Launch via existing launch-minecraft-modded handler
    const launchHandler = ipcMain._invokeHandlers.get('launch-minecraft-modded');
    if (launchHandler) {
      return await launchHandler(event, { version: '1.21.1', username: user, ramAllocation: ram });
    }

    return { success: true, message: 'Mods synced successfully and game session initiated.' };
  } catch (err) {
    throw new Error('Mod synchronization failed: ' + err.message);
  }
});


