import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';

// Helper to locate .minecraft directory
export const getMinecraftDir = (): string => {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', '.minecraft');
  } else if (process.platform === 'darwin') {
    return path.join(process.env.HOME || '', 'Library', 'Application Support', 'minecraft');
  }
  return path.join(process.env.HOME || '', '.minecraft');
};

const mcDir = getMinecraftDir();
const CAPE_DIR = path.join(mcDir, 'khmer_cape');
const ACTIVE_CAPE_PNG = path.join(CAPE_DIR, 'active_cape.png');
const CAPE_CONFIG_JSON = path.join(mcDir, 'config', 'khmer_cape.json');
const HUD_CONFIG_PATH = path.join(mcDir, 'config', 'khmer_pvp_hud.json');
const TOURNAMENT_HUD_PATH = path.join(mcDir, 'config', 'khmer_tournament_hud.json');

// Ensure directories exist
function ensureCapeDirectories() {
  if (!fs.existsSync(CAPE_DIR)) {
    fs.mkdirSync(CAPE_DIR, { recursive: true });
  }
  const configDir = path.dirname(CAPE_CONFIG_JSON);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// Window Management
let mainWindow: BrowserWindow | null = null;

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 900,
    minHeight: 560,
    frame: false,
    title: 'KHMER LAUNCHER | PvP Edition',
    backgroundColor: '#0a0c10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
}

// IPC Handlers: Cape Management
ipcMain.handle('save-local-cape', async (_event, { username, presetId, base64Data }) => {
  try {
    ensureCapeDirectories();
    const targetPath = path.join(mcDir, 'capes', `${(username || 'player').toLowerCase()}.png`);
    const capesFolder = path.dirname(targetPath);
    if (!fs.existsSync(capesFolder)) fs.mkdirSync(capesFolder, { recursive: true });

    if (base64Data) {
      const clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(targetPath, Buffer.from(clean, 'base64'));
      fs.writeFileSync(ACTIVE_CAPE_PNG, Buffer.from(clean, 'base64'));
    }

    const config = { username, presetId, active: true, updatedAt: Date.now() };
    fs.writeFileSync(CAPE_CONFIG_JSON, JSON.stringify(config, null, 2), 'utf-8');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// IPC Handlers: HUD Config
ipcMain.handle('get-hud-config', async () => {
  try {
    if (fs.existsSync(TOURNAMENT_HUD_PATH)) {
      return JSON.parse(fs.readFileSync(TOURNAMENT_HUD_PATH, 'utf-8'));
    }
    if (fs.existsSync(HUD_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(HUD_CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {}
  return null;
});

ipcMain.handle('save-hud-config', async (_event, config) => {
  try {
    if (!fs.existsSync(path.dirname(TOURNAMENT_HUD_PATH))) {
      fs.mkdirSync(path.dirname(TOURNAMENT_HUD_PATH), { recursive: true });
    }
    fs.writeFileSync(TOURNAMENT_HUD_PATH, JSON.stringify(config, null, 2), 'utf-8');
    fs.writeFileSync(HUD_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
