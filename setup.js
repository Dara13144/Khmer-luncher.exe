// setup.js - Run this file with: node setup.js
const fs = require('fs');
const path = require('path');

const projectFiles = {
  // 1. package.json
  'package.json': JSON.stringify({
    name: "pvp-client-launcher",
    version: "1.0.0",
    description: "Production Custom Minecraft Launcher",
    main: "main.js",
    scripts: {
      start: "electron .",
      build: "electron-builder --win"
    },
    dependencies: {
      "minecraft-launcher-core": "^3.18.2"
    },
    devDependencies: {
      "electron": "^30.5.1",
      "electron-builder": "^24.13.3"
    },
    build: {
      appId: "com.pvpclient.launcher",
      productName: "PvPClientLauncher",
      directories: {
        output: "dist"
      },
      win: {
        target: ["nsis", "portable"]
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true
      }
    }
  }, null, 2),

  // 2. main.js (Electron Main Process)
  'main.js': `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Client, Authenticator } = require('minecraft-launcher-core');

let mainWindow;
const launcher = new Client();
const mcPath = path.join(process.env.APPDATA, '.minecraft');

// Auto-detect Java 21 for Minecraft 1.21.1
function findJava() {
  try {
    const p = execSync('where java', { encoding: 'utf-8' }).trim().split('\\r\\n')[0];
    if (p && fs.existsSync(p)) return p;
  } catch (e) {}

  const jreBase = path.join(mcPath, 'jre');
  if (fs.existsSync(jreBase)) {
    const findIn = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          const cand = path.join(full, 'bin', 'java.exe');
          if (fs.existsSync(cand)) return cand;
          const nest = findIn(full);
          if (nest) return nest;
        }
      }
      return null;
    };
    const f = findIn(jreBase);
    if (f) return f;
  }
  return undefined;
}

// Auto-detect Fabric 1.21.1
function getFabric() {
  const vDir = path.join(mcPath, 'versions');
  if (!fs.existsSync(vDir)) return null;
  const installed = fs.readdirSync(vDir);
  return installed.find(v => v.toLowerCase().includes('fabric-loader') && v.includes('1.21.1')) || null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window-close', () => mainWindow.close());
ipcMain.on('window-minimize', () => mainWindow.minimize());

ipcMain.on('launch-game', (event, { username, ram }) => {
  const javaPath = findJava();
  const fabricVer = getFabric();

  const opts = {
    clientPackage: null,
    authorization: Authenticator.getAuth(username || "ProGamer"),
    root: mcPath,
    javaPath: javaPath,
    version: {
      number: "1.21.1",
      type: "release",
      ...(fabricVer ? { custom: fabricVer } : {})
    },
    memory: {
      max: \`\${ram}G\`,
      min: "2G"
    }
  };

  mainWindow.webContents.send('status-update', { 
    message: \`Checking assets & dependencies (\${fabricVer ? 'Fabric' : 'Vanilla'})...\`, 
    progress: 15 
  });

  launcher.launch(opts);

  launcher.on('progress', (e) => {
    let percent = e.total > 0 ? Math.round((e.task / e.total) * 100) : 50;
    mainWindow.webContents.send('status-update', {
      message: \`Downloading (\${e.type}): \${percent}%\`,
      progress: percent
    });
  });

  launcher.on('data', () => {
    mainWindow.webContents.send('status-update', { message: 'Game is running!', progress: 100 });
  });

  launcher.on('close', () => {
    mainWindow.webContents.send('game-closed');
  });
});
`,

  // 3. preload.js
  'preload.js': `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  launchGame: (data) => ipcRenderer.send('launch-game', data),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, val) => callback(val)),
  onGameClosed: (callback) => ipcRenderer.on('game-closed', () => callback())
});
`,

  // 4. src/index.html
  'src/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Minecraft PvP Client Launcher</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="titlebar">
    <span class="brand">⚡ CUSTOM PVP CLIENT 1.21.1</span>
    <div class="controls">
      <button id="min-btn">−</button>
      <button id="close-btn">×</button>
    </div>
  </div>

  <div class="content">
    <div class="hero">
      <h1>PvP Client Edition</h1>
      <p>High Performance Minecraft 1.21.1 Loader</p>
    </div>

    <div class="card">
      <div class="field">
        <label>Player Username:</label>
        <input type="text" id="username" value="PlayerOne">
      </div>

      <div class="field">
        <label>RAM Allocation:</label>
        <select id="ram">
          <option value="4">4 GB</option>
          <option value="6" selected>6 GB</option>
          <option value="8">8 GB</option>
        </select>
      </div>

      <button id="launch-btn" class="launch-btn">PLAY GAME</button>
    </div>

    <div class="status-box">
      <span id="status-text">Ready to launch</span>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
`,

  // 5. src/style.css
  'src/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}

body {
  background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
  color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.titlebar {
  height: 38px;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  -webkit-app-region: drag;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #38bdf8;
}

.controls {
  -webkit-app-region: no-drag;
}

.controls button {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  padding: 4px 10px;
  cursor: pointer;
  transition: 0.15s;
}

.controls button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

#close-btn:hover {
  background: #ef4444;
}

.content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.hero h1 {
  font-size: 24px;
  color: #fff;
}

.hero p {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 4px;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  padding: 24px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.field label {
  font-size: 13px;
  color: #cbd5e1;
}

.field input, .field select {
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
}

.field input:focus, .field select:focus {
  border-color: #38bdf8;
}

.launch-btn {
  padding: 0 28px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  height: 44px;
  transition: 0.2s;
}

.launch-btn:hover {
  filter: brightness(1.1);
}

.status-box {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#status-text {
  font-size: 12px;
  color: #94a3b8;
}

.progress-bar {
  height: 6px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: #38bdf8;
  transition: width 0.2s ease;
}
`,

  // 6. src/renderer.js
  'src/renderer.js': `const closeBtn = document.getElementById('close-btn');
const minBtn = document.getElementById('min-btn');
const launchBtn = document.getElementById('launch-btn');
const usernameInput = document.getElementById('username');
const ramSelect = document.getElementById('ram');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');

closeBtn.addEventListener('click', () => window.api.closeWindow());
minBtn.addEventListener('click', () => window.api.minimizeWindow());

launchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const ram = ramSelect.value;

  if (!username) {
    alert("Please enter a username!");
    return;
  }

  launchBtn.disabled = true;
  launchBtn.innerText = "LAUNCHING...";
  statusText.innerText = "Initializing client...";

  window.api.launchGame({ username, ram });
});

window.api.onStatusUpdate((data) => {
  statusText.innerText = data.message;
  progressFill.style.width = \`\${data.progress}%\`;
});

window.api.onGameClosed(() => {
  launchBtn.disabled = false;
  launchBtn.innerText = "PLAY GAME";
  statusText.innerText = "Game terminated.";
  progressFill.style.width = "0%";
});
`
};

// Generate files
Object.entries(projectFiles).forEach(([filePath, content]) => {
  const absolutePath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Created: ${filePath}`);
});

console.log('\\nDone! All launcher files created successfully.');
