const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { Client } = require('minecraft-launcher-core');
const msmc = require('msmc');

let mainWindow;
const launcher = new Client();
let activeAuth = null;
const mcPath = path.join(process.env.APPDATA, '.minecraft');

const sessionPath = path.join(app.getPath('userData'), 'ms_session.json');
const getModsDir = () => {
  const dir = path.join(mcPath, 'mods');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// ==========================================
// Settings Manager (RAM, Java, Custom JVM)
// ==========================================
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const DEFAULT_SETTINGS = {
  ramMin: '2G',
  ramMax: '4G',
  javaPath: '',
  gameDir: mcPath,
  jvmArgs: '-XX:+UseG1GC -Dsun.rmi.dgc.server.gcInterval=2147483646 -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M'
};

function loadSettingsData() {
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsData(data) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

// Auto-detect Java 21 without printing warnings
function findJavaExecutable() {
  const settings = loadSettingsData();
  if (settings.javaPath && fs.existsSync(settings.javaPath)) {
    return settings.javaPath;
  }

  // Check known .minecraft/jre paths first
  const knownJre21W = path.join(mcPath, 'jre', 'OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9', 'bin', 'javaw.exe');
  if (fs.existsSync(knownJre21W)) return knownJre21W;
  const knownJre21 = path.join(mcPath, 'jre', 'OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9', 'bin', 'java.exe');
  if (fs.existsSync(knownJre21)) return knownJre21;

  const jreBase = path.join(mcPath, 'jre');
  if (fs.existsSync(jreBase)) {
    const findInDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const javaw = path.join(fullPath, 'bin', 'javaw.exe');
            if (fs.existsSync(javaw)) return javaw;
            const candidate = path.join(fullPath, 'bin', 'java.exe');
            if (fs.existsSync(candidate)) return candidate;
            const nested = findInDir(fullPath);
            if (nested) return nested;
          }
        }
      } catch (e) {}
      return null;
    };
    const found = findInDir(jreBase);
    if (found) return found;
  }

  try {
    const pathJavaw = execSync('where javaw', { 
      encoding: 'utf-8', 
      stdio: ['ignore', 'pipe', 'ignore'] 
    }).trim().split('\r\n')[0];
    if (pathJavaw && fs.existsSync(pathJavaw)) return pathJavaw;
  } catch (e) {}

  try {
    const pathJava = execSync('where java', { 
      encoding: 'utf-8', 
      stdio: ['ignore', 'pipe', 'ignore'] 
    }).trim().split('\r\n')[0];
    if (pathJava && fs.existsSync(pathJava)) return pathJava;
  } catch (e) {}

  const standardPaths = [
    'C:\\Program Files\\Java',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\Zulu'
  ];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) {
      try {
        const items = fs.readdirSync(p);
        for (const item of items) {
          const candW = path.join(p, item, 'bin', 'javaw.exe');
          if (fs.existsSync(candW)) return candW;
          const candidate = path.join(p, item, 'bin', 'java.exe');
          if (fs.existsSync(candidate)) return candidate;
        }
      } catch (e) {}
    }
  }

  return undefined;
}

// Auto-detect Fabric Loader in .minecraft/versions
function getFabricVersion(targetMcVersion) {
  const versionsDir = path.join(mcPath, 'versions');
  if (!fs.existsSync(versionsDir)) return null;

  const installed = fs.readdirSync(versionsDir);
  const fabric = installed.find(v => v.toLowerCase().includes('fabric-loader') && v.includes(targetMcVersion));
  return fabric || null;
}

// Automatically prepare/install Fabric Loader 1.21.1 if missing
async function ensureFabricInstalled(targetMcVersion = '1.21.1') {
  const existing = getFabricVersion(targetMcVersion);
  const versionsDir = path.join(mcPath, 'versions');
  if (existing && fs.existsSync(path.join(versionsDir, existing, `${existing}.json`))) {
    return existing;
  }

  try {
    if (mainWindow) {
      mainWindow.webContents.send('status-update', { message: 'Setting up Fabric Loader 1.21.1 automatically...', progress: 15 });
    }
    const metaRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${targetMcVersion}`, {
      headers: { 'User-Agent': 'DYNASTORE-Launcher/1.2.0' }
    });
    if (!metaRes.ok) throw new Error('Could not query Fabric Meta API');
    const loaders = await metaRes.json();
    const loaderVer = (loaders[0] && loaders[0].loader && loaders[0].loader.version) || '0.16.10';

    const profileRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${targetMcVersion}/${loaderVer}/profile/json`, {
      headers: { 'User-Agent': 'DYNASTORE-Launcher/1.2.0' }
    });
    if (!profileRes.ok) throw new Error('Could not download Fabric profile specification');
    const profileJson = await profileRes.json();

    const targetDir = path.join(mcPath, 'versions', profileJson.id);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, `${profileJson.id}.json`), JSON.stringify(profileJson, null, 2), 'utf8');
    return profileJson.id;
  } catch (err) {
    console.error('Fabric auto-install error:', err);
    return null;
  }
}

// Clean up .temp.jar files in mods directory
function cleanModsDirectory() {
  const modsDir = getModsDir();
  let recovered = 0;
  try {
    const files = fs.readdirSync(modsDir);
    for (const file of files) {
      if (file.endsWith('.temp.jar')) {
        const cleanName = file.replace('.temp.jar', '.jar');
        const fullOld = path.join(modsDir, file);
        const fullNew = path.join(modsDir, cleanName);
        if (!fs.existsSync(fullNew)) {
          fs.renameSync(fullOld, fullNew);
          recovered++;
        } else {
          try { fs.unlinkSync(fullOld); } catch (e) {}
        }
      }
    }
  } catch (e) {}
  return recovered;
}

function createWindow() {
  const iconPath = fs.existsSync(path.join(__dirname, 'src', 'assets', 'dynastore_logo.png'))
    ? path.join(__dirname, 'src', 'assets', 'dynastore_logo.png')
    : path.join(__dirname, 'src', 'assets', 'nmc_logo.png');

  mainWindow = new BrowserWindow({
    width: 1040,
    height: 620,
    minWidth: 920,
    minHeight: 560,
    frame: false,
    title: 'DYNASTORE Launcher - Minecraft 1.21.1 | PvP Edition',
    icon: iconPath,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// ==========================================
// Auto-Updater (GitHub Releases)
// ==========================================
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function initAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdates().catch(err => {
    console.error('AutoUpdater check error:', err);
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-message', {
        status: 'available',
        version: info.version,
        text: `រកឃើញ Version ថ្មី (${info.version})! កំពុងទាញយក...`
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', percent);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-message', {
        status: 'downloaded',
        version: info.version,
        text: `Version ${info.version} បានទាញយករួចរាល់!`
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater Error:', err);
  });
}

ipcMain.on('restart-to-update', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-close', () => mainWindow && mainWindow.close());
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('open-external', (e, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  }
});

// Mod Manager APIs
ipcMain.handle('get-mods-list', async () => {
  const modsDir = getModsDir();
  try {
    const files = fs.readdirSync(modsDir);
    return files
      .filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
      .map(file => {
        const isEnabled = file.endsWith('.jar');
        const stat = fs.statSync(path.join(modsDir, file));
        const lower = file.toLowerCase();
        const isBuiltIn = lower.startsWith('simplepvp');
        const isFabricApi = lower.startsWith('fabric-api');
        return {
          filename: file,
          name: file.replace('.jar.disabled', '').replace('.jar', ''),
          enabled: isEnabled,
          sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
          isBuiltIn,
          isFabricApi,
          isCustom: !isBuiltIn && !isFabricApi
        };
      });
  } catch {
    return [];
  }
});

ipcMain.handle('toggle-mod', async (event, filename) => {
  const modsDir = getModsDir();
  const oldPath = path.join(modsDir, filename);
  let newFilename = filename.endsWith('.jar') ? filename + '.disabled' : filename.replace('.disabled', '');
  try {
    fs.renameSync(oldPath, path.join(modsDir, newFilename));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-mod', async (event, filename) => {
  const filePath = path.join(getModsDir(), filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.on('open-mods-folder', () => shell.openPath(getModsDir()));

ipcMain.on('show-item-in-folder', (event, filename) => {
  const full = path.join(getModsDir(), filename);
  if (fs.existsSync(full)) {
    shell.showItemInFolder(full);
  } else {
    shell.openPath(getModsDir());
  }
});

ipcMain.handle('reinject-client-mod', async () => {
  const modsDir = getModsDir();
  const possibleSources = [
    path.join(__dirname, 'bundled_mods', 'SimplePvP-1.21.1-1.0.0.jar'),
    path.join(__dirname, 'SimplePvPMod', 'build', 'libs', 'SimplePvP-1.21.1-1.0.0.jar'),
    path.join(__dirname, 'SimplePvP-Mod', 'build', 'libs', 'simplepvp-1.0.0.jar')
  ];
  for (const src of possibleSources) {
    if (fs.existsSync(src)) {
      const dest = path.join(modsDir, 'SimplePvP-1.21.1-1.0.0.jar');
      try {
        fs.copyFileSync(src, dest);
        return { success: true, filename: 'SimplePvP-1.21.1-1.0.0.jar' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
  return { success: false, error: 'Built-in client mod JAR not found in bundled_mods.' };
});

ipcMain.handle('install-fabric-api', async () => {
  try {
    const modsDir = getModsDir();
    const vRes = await fetch('https://api.modrinth.com/v2/project/fabric-api/version?game_versions=%5B%221.21.1%22%5D&loaders=%5B%22fabric%22%5D', {
      headers: { 'User-Agent': MODRINTH_UA }
    });
    if (!vRes.ok) throw new Error('Failed to query Fabric API from Modrinth');
    const versions = await vRes.json();
    if (!Array.isArray(versions) || versions.length === 0) throw new Error('No 1.21.1 Fabric API found');
    const primaryFile = versions[0].files.find(f => f.primary) || versions[0].files[0];
    const destPath = path.join(modsDir, primaryFile.filename);
    
    const fileRes = await fetch(primaryFile.url, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.statusText}`);
    
    const fileStream = fs.createWriteStream(destPath);
    const reader = fileRes.body.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
      received += value.length;
    }
    fileStream.end();
    return { success: true, filename: primaryFile.filename, sizeMb: (received / (1024 * 1024)).toFixed(2) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-and-install-mod', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Custom Mod JARs (.jar)',
    filters: [{ name: 'Minecraft Mods', extensions: ['jar'] }],
    properties: ['openFile', 'multiSelections']
  });

  if (result.canceled || result.filePaths.length === 0) return { success: false, count: 0 };
  const modsDir = getModsDir();
  let count = 0;
  const installedNames = [];
  for (const src of result.filePaths) {
    const base = path.basename(src);
    fs.copyFileSync(src, path.join(modsDir, base));
    installedNames.push(base);
    count++;
  }
  return { success: true, count, installedNames };
});

ipcMain.handle('select-custom-background', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Custom Wallpaper Image',
    filters: [{ name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) return { success: false };
  const src = result.filePaths[0];
  const destDir = path.join(app.getPath('userData'), 'backgrounds');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const ext = path.extname(src);
  const dest = path.join(destDir, `custom_bg_${Date.now()}${ext}`);
  fs.copyFileSync(src, dest);
  return { success: true, filePath: dest.replace(/\\/g, '/') };
});

// ==========================================
// Settings & System Customization IPC
// ==========================================
ipcMain.handle('get-settings', async () => {
  const settings = loadSettingsData();
  const detectedJava = findJavaExecutable();
  return { ...settings, detectedJava: detectedJava || 'Auto-Detect (Not Found)' };
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  const current = loadSettingsData();
  const merged = { ...current, ...newSettings };
  const ok = saveSettingsData(merged);
  return { success: ok, settings: merged };
});

ipcMain.handle('select-java-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Java Executable (javaw.exe or java.exe)',
    filters: [{ name: 'Java Executable', extensions: ['exe'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false };
  return { success: true, filePath: result.filePaths[0] };
});

ipcMain.handle('select-game-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Minecraft Directory',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false };
  return { success: true, dirPath: result.filePaths[0] };
});

ipcMain.handle('clean-mods', async () => {
  const recovered = cleanModsDirectory();
  return { success: true, recovered };
});

ipcMain.handle('select-custom-skin', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Minecraft Skin (.png)',
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false };
  const src = result.filePaths[0];
  const skinsDir = path.join(app.getPath('userData'), 'skins');
  if (!fs.existsSync(skinsDir)) fs.mkdirSync(skinsDir, { recursive: true });
  const destName = `custom_skin_${Date.now()}.png`;
  const destPath = path.join(skinsDir, destName);
  fs.copyFileSync(src, destPath);

  // Update active account
  const data = loadAccountsData();
  const curActive = data.accounts.find(a => a.id === (data.activeId || data.activeAccountId));
  const skinUrl = `file:///${destPath.replace(/\\/g, '/')}`;
  if (curActive) {
    curActive.skin = skinUrl;
    curActive.avatar = skinUrl;
    saveAccountsData(data);
  }

  return { success: true, filePath: destPath.replace(/\\/g, '/'), skinUrl };
});

ipcMain.handle('apply-skin-to-account', async (event, { skinUrl, avatarUrl, username }) => {
  const data = loadAccountsData();
  const curActive = data.accounts.find(a => a.id === (data.activeId || data.activeAccountId));
  if (!curActive) return { success: false, error: 'No active account selected' };

  if (skinUrl) curActive.skin = skinUrl;
  if (avatarUrl) curActive.avatar = avatarUrl;
  if (username) {
    curActive.skin = `https://minotar.net/armor/body/${username}/200.png`;
    curActive.avatar = `https://minotar.net/avatar/${username}/40`;
  }
  saveAccountsData(data);
  return { success: true, account: curActive };
});



// ==========================================
// Modrinth Marketplace Client & Installer
// ==========================================
const getResourcePacksDir = () => {
  const dir = path.join(mcPath, 'resourcepacks');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const MODRINTH_UA = 'NMC-Launcher/1.0.0 (contact@nmchosting.com)';

ipcMain.handle('search-modrinth', async (event, { query = '', projectType = 'all', sort = 'downloads', offset = 0, limit = 20 }) => {
  try {
    const facets = [['versions:1.21.1']];
    if (projectType === 'mod') {
      facets.push(['categories:fabric'], ['project_type:mod']);
    } else if (projectType === 'resourcepack') {
      facets.push(['project_type:resourcepack']);
    }

    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${encodeURIComponent(JSON.stringify(facets))}&index=${encodeURIComponent(sort)}&offset=${offset}&limit=${limit}`;

    const res = await fetch(url, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!res.ok) throw new Error(`Modrinth API error: ${res.statusText}`);
    const data = await res.json();

    // Check local installed status
    const modsDir = getModsDir();
    const rpDir = getResourcePacksDir();
    const installedModFiles = fs.existsSync(modsDir) ? fs.readdirSync(modsDir).map(f => f.toLowerCase()) : [];
    const installedRpFiles = fs.existsSync(rpDir) ? fs.readdirSync(rpDir).map(f => f.toLowerCase()) : [];

    const hits = (data.hits || []).map(hit => {
      const slugLower = (hit.slug || '').toLowerCase();
      const titleLower = (hit.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const isRp = hit.project_type === 'resourcepack';
      const checkList = isRp ? installedRpFiles : installedModFiles;

      const isInstalled = checkList.some(file => {
        const cleanFile = file.replace(/[^a-z0-9]/g, '');
        return cleanFile.includes(slugLower) || (titleLower.length > 3 && cleanFile.includes(titleLower));
      });

      return {
        ...hit,
        isInstalled
      };
    });

    return {
      success: true,
      hits,
      totalHits: data.total_hits || 0,
      offset: data.offset || 0,
      limit: data.limit || limit
    };
  } catch (err) {
    return { success: false, error: err.message, hits: [], totalHits: 0 };
  }
});

ipcMain.on('open-packs-folder', () => shell.openPath(getResourcePacksDir()));

ipcMain.handle('install-modrinth-project', async (event, { projectId, slug, projectType }) => {
  try {
    const targetId = projectId || slug;
    const isRp = projectType === 'resourcepack';
    let versionUrl = `https://api.modrinth.com/v2/project/${targetId}/version?game_versions=${encodeURIComponent(JSON.stringify(['1.21.1']))}`;
    if (!isRp) {
      versionUrl += `&loaders=${encodeURIComponent(JSON.stringify(['fabric']))}`;
    }

    const vRes = await fetch(versionUrl, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!vRes.ok) throw new Error(`Could not fetch versions: ${vRes.statusText}`);
    const versions = await vRes.json();

    if (!Array.isArray(versions) || versions.length === 0) {
      throw new Error('No 1.21.1 Fabric compatible release found for this item.');
    }

    const latest = versions[0];
    const primaryFile = latest.files.find(f => f.primary) || latest.files[0];
    if (!primaryFile || !primaryFile.url) {
      throw new Error('No downloadable file attached to this release.');
    }

    const targetDir = isRp ? getResourcePacksDir() : getModsDir();
    const destPath = path.join(targetDir, primaryFile.filename);

    // Stream download with progress
    const fileRes = await fetch(primaryFile.url, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.statusText}`);

    const contentLength = Number(fileRes.headers.get('content-length')) || primaryFile.size || 0;
    const fileStream = fs.createWriteStream(destPath);
    const reader = fileRes.body.getReader();
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
      received += value.length;
      if (contentLength > 0 && mainWindow) {
        const pct = Math.round((received / contentLength) * 100);
        mainWindow.webContents.send('download-progress', {
          projectId,
          progress: pct,
          filename: primaryFile.filename
        });
      }
    }
    fileStream.end();

    return {
      success: true,
      filename: primaryFile.filename,
      projectType,
      sizeMb: (received / (1024 * 1024)).toFixed(2)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('resolve-and-install-url', async (event, inputUrl) => {
  try {
    if (!inputUrl || !inputUrl.trim()) throw new Error('Please enter a valid Modrinth URL or project name.');
    const trimmed = inputUrl.trim();
    const match = trimmed.match(/modrinth\.com\/(mod|resourcepack|shader)\/([a-zA-Z0-9_\-]+)/i);
    let slug = match ? match[2] : trimmed.replace(/https?:\/\/[^\/]+\//, '').replace(/[^a-zA-Z0-9_\-]/g, '');
    let projectType = match ? match[1] : null;

    if (!projectType) {
      const pRes = await fetch(`https://api.modrinth.com/v2/project/${slug}`, { headers: { 'User-Agent': MODRINTH_UA } });
      if (!pRes.ok) throw new Error(`Could not find project "${slug}" on Modrinth.`);
      const pData = await pRes.json();
      projectType = pData.project_type;
      slug = pData.id;
    }

    const isRp = projectType === 'resourcepack';
    let versionUrl = `https://api.modrinth.com/v2/project/${slug}/version?game_versions=${encodeURIComponent(JSON.stringify(['1.21.1']))}`;
    if (!isRp) {
      versionUrl += `&loaders=${encodeURIComponent(JSON.stringify(['fabric']))}`;
    }

    const vRes = await fetch(versionUrl, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!vRes.ok) throw new Error(`Could not find 1.21.1 versions for ${slug}`);
    const versions = await vRes.json();
    if (!Array.isArray(versions) || versions.length === 0) {
      throw new Error(`No 1.21.1 Fabric compatible release found for ${slug}`);
    }

    const latest = versions[0];
    const primaryFile = latest.files.find(f => f.primary) || latest.files[0];
    if (!primaryFile || !primaryFile.url) {
      throw new Error('No downloadable file found in this release.');
    }

    const targetDir = isRp ? getResourcePacksDir() : getModsDir();
    const destPath = path.join(targetDir, primaryFile.filename);

    const fileRes = await fetch(primaryFile.url, { headers: { 'User-Agent': MODRINTH_UA } });
    if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.statusText}`);

    const fileStream = fs.createWriteStream(destPath);
    const reader = fileRes.body.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
      received += value.length;
    }
    fileStream.end();

    return {
      success: true,
      filename: primaryFile.filename,
      projectType: isRp ? 'Resource Pack' : 'Mod',
      sizeMb: (received / (1024 * 1024)).toFixed(2)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('handle-dropped-files', async (event, filePaths) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return { success: false, modsAdded: 0, packsAdded: 0 };
  const modsDir = getModsDir();
  const rpDir = getResourcePacksDir();
  let modsAdded = 0;
  let packsAdded = 0;

  for (const src of filePaths) {
    if (!fs.existsSync(src)) continue;
    const ext = path.extname(src).toLowerCase();
    const basename = path.basename(src);

    if (ext === '.jar') {
      fs.copyFileSync(src, path.join(modsDir, basename));
      modsAdded++;
    } else if (ext === '.zip') {
      fs.copyFileSync(src, path.join(rpDir, basename));
      packsAdded++;
    }
  }

  return { success: true, modsAdded, packsAdded };
});

// ==========================================
// NMC PvP Modules Configuration Sync
// ==========================================
const pvpConfigPath = path.join(mcPath, 'nmc_pvp_modules.json');

const DEFAULT_PVP_CONFIG = {
  reachDisplay: true,
  targetHealth: true,
  pingFps: true,
  keystrokesBps: true,
  armorDurability: true,
  armorDurabilityNumbers: true,
  coordinates: true,
  crosshairCps: true,
  customTag: "[NMC-PRO]",
  tagColor: "#00e5ff",
  accentColor: '#00f0ff'
};

async function readPvpConfig() {
  try {
    if (!fs.existsSync(pvpConfigPath)) {
      fs.writeFileSync(pvpConfigPath, JSON.stringify(DEFAULT_PVP_CONFIG, null, 2), 'utf8');
      return DEFAULT_PVP_CONFIG;
    }
    const data = JSON.parse(fs.readFileSync(pvpConfigPath, 'utf8'));
    return { ...DEFAULT_PVP_CONFIG, ...data };
  } catch (err) {
    return DEFAULT_PVP_CONFIG;
  }
}

async function writePvpConfig(newConfig) {
  try {
    const merged = { ...DEFAULT_PVP_CONFIG, ...newConfig };
    if (!fs.existsSync(mcPath)) fs.mkdirSync(mcPath, { recursive: true });
    fs.writeFileSync(pvpConfigPath, JSON.stringify(merged, null, 2), 'utf8');
    return { success: true, config: merged };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

ipcMain.handle('get-pvp-config', readPvpConfig);
ipcMain.handle('get-hud-config', readPvpConfig);
ipcMain.handle('save-pvp-config', (e, cfg) => writePvpConfig(cfg));
ipcMain.handle('save-hud-config', (e, cfg) => writePvpConfig(cfg));

// ==========================================
// Multi-Account Storage & Management
// ==========================================
const accountsPath = path.join(app.getPath('userData'), 'accounts.json');

function loadAccountsData() {
  if (!fs.existsSync(accountsPath)) {
    return { activeAccountId: null, accounts: [] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    if (!Array.isArray(data.accounts)) data.accounts = [];
    return data;
  } catch (e) {
    return { activeAccountId: null, accounts: [] };
  }
}

function saveAccountsData(data) {
  try {
    fs.writeFileSync(accountsPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save accounts.json:', e);
  }
}

function generateOfflineUUID(username) {
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + username).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; // version 3
  hash[8] = (hash[8] & 0x3f) | 0x80; // IETF variant
  const hex = hash.toString('hex');
  return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`;
}

async function getAuthForAccount(account) {
  if (!account) return null;
  if (account.type === 'offline') {
    return {
      access_token: '0',
      client_token: '0',
      uuid: account.uuid,
      name: account.name,
      user_properties: '{}'
    };
  } else if (account.type === 'microsoft') {
    try {
      if (account.savedSession) {
        const authManager = new msmc.Auth();
        const xbox = await authManager.refresh(account.savedSession);
        const mc = await xbox.getMinecraft();
        account.mclcAuth = mc.mclc();
        account.savedSession = xbox.save();

        const data = loadAccountsData();
        const idx = data.accounts.findIndex(a => a.id === account.id);
        if (idx !== -1) {
          data.accounts[idx] = account;
          saveAccountsData(data);
        }
        return account.mclcAuth;
      }
    } catch (e) {
      if (account.mclcAuth) return account.mclcAuth;
      throw new Error('Microsoft session expired. Please log in again.');
    }
    if (account.mclcAuth) return account.mclcAuth;
  }
  return null;
}

function sanitizeAccounts(data) {
  const activeId = data.activeId || data.activeAccountId || (data.accounts && data.accounts.length > 0 ? data.accounts[0].id : null);
  const sanitized = (data.accounts || []).map(a => {
    const uname = a.username || a.name;
    const skinUrl = a.skin || a.avatar || `https://minotar.net/avatar/${uname}/40`;
    return {
      id: a.id,
      type: a.type,
      name: uname,
      username: uname,
      uuid: a.uuid,
      skin: skinUrl,
      avatar: skinUrl
    };
  });
  return {
    activeId: activeId,
    activeAccountId: activeId,
    accounts: sanitized
  };
}

// Multi-Account IPC Handlers
ipcMain.handle('get-accounts', async () => {
  const data = loadAccountsData();
  return sanitizeAccounts(data);
});
ipcMain.handle('get-all-accounts', async () => {
  const data = loadAccountsData();
  return sanitizeAccounts(data);
});

ipcMain.handle('set-active-account', async (event, accountId) => {
  const data = loadAccountsData();
  const exists = data.accounts.find(a => a.id === accountId);
  if (!exists) return { success: false, error: 'Account not found' };
  data.activeId = accountId;
  data.activeAccountId = accountId;
  saveAccountsData(data);
  return { success: true, activeAccount: exists, activeId: accountId };
});

async function createOfflineAccountImpl(rawUsername) {
  const username = (rawUsername || '').trim();
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return { success: false, error: 'ឈ្មោះត្រូវមានចន្លោះពី 3 ទៅ 16 តួអក្សរ (អក្សរ លេខ និង _ ប៉ុណ្ណោះ)!' };
  }

  const data = loadAccountsData();
  const existing = data.accounts.find(a => (a.username || a.name).toLowerCase() === username.toLowerCase());
  if (existing) {
    data.activeId = existing.id;
    data.activeAccountId = existing.id;
    saveAccountsData(data);
    return { success: true, account: existing, alreadyExisted: true };
  }

  const uuid = generateOfflineUUID(username);
  const account = {
    id: 'offline_' + username.toLowerCase(),
    type: 'offline',
    name: username,
    username: username,
    uuid: uuid,
    skin: `https://minotar.net/avatar/${username}/40`,
    avatar: `https://minotar.net/avatar/${username}/40`
  };

  data.accounts.push(account);
  data.activeId = account.id;
  data.activeAccountId = account.id;
  saveAccountsData(data);

  return { success: true, account };
}

ipcMain.handle('add-offline-account', async (event, rawUsername) => createOfflineAccountImpl(rawUsername));
ipcMain.handle('create-offline-account', async (event, rawUsername) => createOfflineAccountImpl(rawUsername));

async function loginMicrosoftImpl() {
  try {
    const authManager = new msmc.Auth("select_account");
    const xboxManager = await authManager.launch("electron");
    const mc = await xboxManager.getMinecraft();
    const mclcAuth = mc.mclc();
    
    const newAccount = {
      id: mc.profile.id,
      type: 'microsoft',
      name: mc.profile.name,
      username: mc.profile.name,
      uuid: mc.profile.id,
      avatar: `https://minotar.net/avatar/${mc.profile.name}/40`,
      skin: `https://minotar.net/avatar/${mc.profile.name}/40`,
      savedSession: xboxManager.save(),
      refreshToken: xboxManager.save().refresh_token,
      mclcAuth: mclcAuth,
      authData: mclcAuth
    };

    const data = loadAccountsData();
    const existingIdx = data.accounts.findIndex(a => a.id === newAccount.id || (a.username || a.name).toLowerCase() === newAccount.name.toLowerCase());
    if (existingIdx !== -1) {
      data.accounts[existingIdx] = newAccount;
    } else {
      data.accounts.push(newAccount);
    }
    data.activeId = newAccount.id;
    data.activeAccountId = newAccount.id;
    saveAccountsData(data);

    return { 
      success: true, 
      account: {
        id: newAccount.id,
        type: newAccount.type,
        name: newAccount.name,
        username: newAccount.username,
        uuid: newAccount.uuid,
        avatar: newAccount.avatar,
        skin: newAccount.skin
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

ipcMain.handle('login-microsoft', loginMicrosoftImpl);
ipcMain.handle('login-microsoft-account', loginMicrosoftImpl);

ipcMain.handle('delete-account', async (event, accountId) => {
  const data = loadAccountsData();
  data.accounts = data.accounts.filter(a => a.id !== accountId);
  const curActive = data.activeId || data.activeAccountId;
  if (curActive === accountId) {
    data.activeId = data.accounts.length > 0 ? data.accounts[0].id : null;
    data.activeAccountId = data.activeId;
  }
  saveAccountsData(data);
  return { success: true, activeId: data.activeId, ...sanitizeAccounts(data) };
});

// Legacy backwards-compatibility handlers
ipcMain.handle('check-saved-login', async () => {
  const data = loadAccountsData();
  const active = data.accounts.find(a => a.id === data.activeAccountId);
  if (active) return { name: active.name, type: active.type, avatar: active.avatar };
  return null;
});

ipcMain.handle('logout-account', async () => {
  const data = loadAccountsData();
  if (data.activeAccountId) {
    data.accounts = data.accounts.filter(a => a.id !== data.activeAccountId);
    data.activeAccountId = data.accounts.length > 0 ? data.accounts[0].id : null;
    saveAccountsData(data);
  }
  return true;
});

// Sync Mod JAR to .minecraft/mods
function injectMod(targetMcPath) {
  const modsPath = path.join(targetMcPath, 'mods');
  if (!fs.existsSync(modsPath)) fs.mkdirSync(modsPath, { recursive: true });
  
  const possibleSources = [
    path.join(__dirname, 'bundled_mods', 'SimplePvP-1.21.1-1.0.0.jar'),
    path.join(__dirname, 'SimplePvPMod', 'build', 'libs', 'SimplePvP-1.21.1-1.0.0.jar'),
    path.join(__dirname, 'SimplePvP-Mod', 'build', 'libs', 'simplepvp-1.0.0.jar')
  ];
  for (const src of possibleSources) {
    if (fs.existsSync(src)) {
      const dest = path.join(modsPath, 'SimplePvP-1.21.1-1.0.0.jar');
      try {
        if (!fs.existsSync(dest) || fs.statSync(src).size !== fs.statSync(dest).size) {
          fs.copyFileSync(src, dest);
        }
      } catch (e) {}
      break;
    }
  }
}

ipcMain.on('launch-game', async (event, { version }) => {
  const data = loadAccountsData();
  const activeAccount = data.accounts.find(a => a.id === (data.activeId || data.activeAccountId));

  if (!activeAccount) {
    mainWindow.webContents.send('status-update', { message: 'Please select or add an account first!', progress: 0 });
    mainWindow.webContents.send('game-closed');
    return;
  }

  let auth;
  try {
    mainWindow.webContents.send('status-update', { message: `Authenticating ${activeAccount.name}...`, progress: 10 });
    auth = await getAuthForAccount(activeAccount);
  } catch (err) {
    mainWindow.webContents.send('status-update', { message: `Authentication error: ${err.message}`, progress: 0 });
    mainWindow.webContents.send('game-closed');
    return;
  }

  const settings = loadSettingsData();
  const rootDir = settings.gameDir && fs.existsSync(settings.gameDir) ? settings.gameDir : mcPath;

  // Clean corrupted/temp mods and inject client mod
  cleanModsDirectory();
  injectMod(rootDir);

  // Sync PvP configs
  try {
    const cfg = await readPvpConfig();
    const dynaPath = path.join(rootDir, 'dynastore_pvp_modules.json');
    fs.writeFileSync(dynaPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {}

  const rawVer = version || "1.21.1";
  const isFabric = rawVer.toLowerCase().includes('fabric');
  const targetVersion = isFabric ? "1.21.1" : rawVer.split(' ')[0];

  let fabricVersion = null;
  if (isFabric) {
    mainWindow.webContents.send('status-update', { message: 'Verifying Fabric 1.21.1 installation...', progress: 15 });
    fabricVersion = await ensureFabricInstalled("1.21.1");
  }

  const javaPath = findJavaExecutable();
  if (!javaPath) {
    mainWindow.webContents.send('status-update', { 
      message: 'Java 21 executable not found! Please configure in Settings > Java.', 
      progress: 0 
    });
    mainWindow.webContents.send('game-closed');
    return;
  }

  const customJvm = (settings.jvmArgs || '').trim().split(/\s+/).filter(Boolean);

  const opts = {
    clientPackage: null,
    authorization: auth,
    root: rootDir,
    javaPath: javaPath,
    version: {
      number: targetVersion,
      type: "release",
      ...(fabricVersion ? { custom: fabricVersion } : {})
    },
    memory: { 
      max: settings.ramMax || "4G", 
      min: settings.ramMin || "2G" 
    },
    ...(customJvm.length > 0 ? { customArgs: customJvm } : {})
  };

  const modeText = fabricVersion ? `Fabric (${fabricVersion})` : `Minecraft ${targetVersion}`;
  const accountInfo = activeAccount.type === 'offline' ? `[Offline: ${activeAccount.name}]` : `[Microsoft: ${activeAccount.name}]`;
  mainWindow.webContents.send('status-update', { message: `Launching ${modeText} as ${accountInfo}...`, progress: 25 });

  try {
    launcher.launch(opts);
  } catch (err) {
    console.error('Launch sync error:', err);
    mainWindow.webContents.send('status-update', { message: `Launch error: ${err.message}`, progress: 0 });
    mainWindow.webContents.send('game-closed');
    return;
  }

  launcher.removeAllListeners('progress');
  launcher.removeAllListeners('data');
  launcher.removeAllListeners('close');
  launcher.removeAllListeners('debug');

  launcher.on('debug', (e) => {
    console.log('[MCLC Debug]', e);
  });

  launcher.on('progress', (e) => {
    let pct = e.total > 0 ? Math.round((e.task / e.total) * 100) : 50;
    mainWindow.webContents.send('status-update', {
      message: `Downloading (${e.type}): ${pct}%`,
      progress: pct
    });
  });

  launcher.on('data', () => {
    mainWindow.webContents.send('status-update', { message: `Minecraft is running (${activeAccount.name})!`, progress: 100 });
  });

  launcher.on('close', (code) => {
    console.log('[MCLC Close] Process closed with code:', code);
    if (code !== 0 && code !== null) {
      mainWindow.webContents.send('status-update', { 
        message: `Minecraft exited (code ${code}). If it crashed, verify Java 21 or mod compatibility.`, 
        progress: 0 
      });
    }
    mainWindow.webContents.send('game-closed');
  });
});


