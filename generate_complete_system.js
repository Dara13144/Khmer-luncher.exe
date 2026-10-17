// generate_complete_system.js
// Run: node generate_complete_system.js
const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // ROOT BUILD AUTOMATION
  // ==========================================
  'build_all.bat': `@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo     FULL MINECRAFT CLIENT AUTO-BUILD PIPELINE
echo =======================================================

:: 0. Auto-detect Java 21 from .minecraft
if exist "%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\\bin\\java.exe" (
    set "JAVA_HOME=%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "PATH=!JAVA_HOME!\\bin;!PATH!"
)

:: 1. Compile Java Mod
echo [1/3] Compiling Fabric 1.21.1 Java PvP Mod...
cd SimplePvPMod
call gradlew build 2>nul || call gradle build 2>nul
if %errorlevel% neq 0 (
    echo [Note] If gradle wrapper is not present, compile with JDK 21 installed.
)
cd ..

:: 2. Stage Built Mod
echo [2/3] Staging mod JAR inside Launcher workspace...
if not exist "PvPLauncher\\bundled_mods" (
    mkdir "PvPLauncher\\bundled_mods"
)
if exist "SimplePvPMod\\build\\libs\\SimplePvP-1.21.1-1.0.0.jar" (
    copy /Y "SimplePvPMod\\build\\libs\\SimplePvP-1.21.1-1.0.0.jar" "PvPLauncher\\bundled_mods\\"
    echo [OK] Staged SimplePvP-1.21.1-1.0.0.jar
)

:: 3. Bundle Electron Launcher
echo [3/3] Installing NPM packages and compiling .exe...
cd PvPLauncher
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Electron packaging failed.
    pause
    exit /b %errorlevel%
)
cd ..

echo =======================================================
echo [SUCCESS] Build sequence finished.
echo Output location: PvPLauncher\\dist\\PvPClientLauncher Setup 1.0.0.exe
echo =======================================================
pause
`,

  // ==========================================
  // FABRIC 1.21.1 MOD FILES
  // ==========================================
  'SimplePvPMod/settings.gradle': `pluginManagement {
    repositories {
        maven { url = "https://maven.fabricmc.net/" }
        gradlePluginPortal()
    }
}
rootProject.name = 'SimplePvPMod'
`,

  'SimplePvPMod/build.gradle': `plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}

version = "1.0.0"
group = "com.pvpclient"

base {
    archivesName = "SimplePvP-1.21.1"
}

repositories {
    mavenCentral()
    maven { url = "https://maven.fabricmc.net/" }
}

dependencies {
    minecraft "com.mojang:minecraft:1.21.1"
    mappings "net.fabricmc:yarn:1.21.1+build.3:v2"
    modImplementation "net.fabricmc:fabric-loader:0.16.5"
    modImplementation "net.fabricmc.fabric-api:fabric-api:0.104.0+1.21.1"
}

processResources {
    inputs.property "version", project.version
    filesMatching("fabric.mod.json") {
        expand "version": project.version
    }
}

tasks.withType(JavaCompile).configureEach {
    it.options.release = 21
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
`,

  'SimplePvPMod/gradle/wrapper/gradle-wrapper.properties': `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,

  'SimplePvPMod/src/main/resources/fabric.mod.json': JSON.stringify({
    schemaVersion: 1,
    id: "simplepvp",
    version: "${version}",
    name: "Simple PvP Mod",
    description: "HUD overlay displaying CPS, Keystrokes, and Armor Status for 1.21.1",
    authors: ["System"],
    license: "MIT",
    environment: "client",
    entrypoints: {
      client: [
        "com.pvpclient.SimplePvPClient"
      ]
    },
    mixins: [
      "simplepvp.mixins.json"
    ],
    depends: {
      fabricloader: ">=0.16.0",
      minecraft: "~1.21.1",
      java: ">=21",
      "fabric-api": "*"
    }
  }, null, 2),

  'SimplePvPMod/src/main/resources/simplepvp.mixins.json': JSON.stringify({
    required: true,
    minVersion: "0.8",
    package: "com.pvpclient.mixin",
    compatibilityLevel: "JAVA_21",
    client: [
      "MouseMixin"
    ],
    injectors: {
      defaultRequire: 1
    }
  }, null, 2),

  'SimplePvPMod/src/main/java/com/pvpclient/SimplePvPClient.java': `package com.pvpclient;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.item.ItemStack;

import java.util.LinkedList;

public class SimplePvPClient implements ClientModInitializer {
    public static final LinkedList<Long> leftClicks = new LinkedList<>();

    @Override
    public void onInitializeClient() {
        HudRenderCallback.EVENT.register((DrawContext context, RenderTickCounter tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player == null || client.options.hudHidden) return;

            long currentTime = System.currentTimeMillis();
            while (!leftClicks.isEmpty() && currentTime - leftClicks.peek() > 1000) {
                leftClicks.remove();
            }

            // 1. CPS Tracker
            context.drawText(client.textRenderer, "CPS: " + leftClicks.size(), 10, 10, 0x00FF66, true);

            // 2. Keystroke Boxes (WASD)
            renderKeyBox(context, client, client.options.forwardKey, "W", 32, 26);
            renderKeyBox(context, client, client.options.leftKey, "A", 10, 48);
            renderKeyBox(context, client, client.options.backKey, "S", 32, 48);
            renderKeyBox(context, client, client.options.rightKey, "D", 54, 48);

            // 3. Armor Durability HUD
            int armorY = 75;
            for (ItemStack item : client.player.getArmorItems()) {
                if (!item.isEmpty()) {
                    context.drawItem(item, 10, armorY);
                    if (item.isDamageable()) {
                        int durability = item.getMaxDamage() - item.getDamage();
                        context.drawText(client.textRenderer, String.valueOf(durability), 32, armorY + 4, 0xFFFFFF, true);
                    }
                    armorY += 18;
                }
            }
        });
    }

    private void renderKeyBox(DrawContext context, MinecraftClient client, KeyBinding key, String label, int x, int y) {
        boolean pressed = key.isPressed();
        int bgColor = pressed ? 0x90FFFFFF : 0x60000000;
        int txtColor = pressed ? 0x000000 : 0xFFFFFF;

        context.fill(x, y, x + 20, y + 20, bgColor);
        int textWidth = client.textRenderer.getWidth(label);
        context.drawText(client.textRenderer, label, x + (20 - textWidth) / 2, y + 6, txtColor, false);
    }

    public static void registerClick() {
        leftClicks.add(System.currentTimeMillis());
    }
}
`,

  'SimplePvPMod/src/main/java/com/pvpclient/mixin/MouseMixin.java': `package com.pvpclient.mixin;

import com.pvpclient.SimplePvPClient;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.Mouse;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Mouse.class)
public class MouseMixin {
    @Inject(method = "onMouseButton", at = @At("HEAD"))
    private void onMouseClick(long window, int button, int action, int mods, CallbackInfo ci) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (button == 0 && action == 1 && client.currentScreen == null) {
            SimplePvPClient.registerClick();
        }
    }
}
`,

  // ==========================================
  // ELECTRON CUSTOM LAUNCHER FILES
  // ==========================================
  'PvPLauncher/package.json': JSON.stringify({
    name: "pvp-client-launcher",
    version: "1.0.0",
    main: "main.js",
    scripts: {
      start: "electron .",
      build: "electron-builder --win"
    },
    dependencies: {
      "minecraft-launcher-core": "^3.18.2",
      msmc: "^4.0.1"
    },
    devDependencies: {
      electron: "^30.5.1",
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

  'PvPLauncher/main.js': `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const { Client } = require('minecraft-launcher-core');
const msmc = require('msmc');

let mainWindow;
const launcher = new Client();
let authPayload = null;
const mcPath = path.join(process.env.APPDATA, '.minecraft');

// Auto-detect Java 21
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
    backgroundColor: '#0b0f19',
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

ipcMain.on('window-close', () => mainWindow && mainWindow.close());
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());

ipcMain.handle('ms-login', async () => {
  try {
    const authManager = new msmc.Auth("select_account");
    const xboxManager = await authManager.launch("electron");
    const token = await xboxManager.getMinecraft();
    authPayload = token.mclc();
    return { success: true, profile: token.profile };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

async function ensureMods() {
  const modsDir = path.join(mcPath, 'mods');
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
  }

  const localMod = path.join(__dirname, 'bundled_mods', 'SimplePvP-1.21.1-1.0.0.jar');
  const targetMod = path.join(modsDir, 'SimplePvP-1.21.1-1.0.0.jar');
  if (fs.existsSync(localMod)) {
    fs.copyFileSync(localMod, targetMod);
  }
}

ipcMain.on('launch-game', async (event, { ram }) => {
  mainWindow.webContents.send('status-update', { message: 'Checking mod files...', progress: 10 });
  await ensureMods();

  const javaPath = findJava();
  const fabricVer = getFabric();

  const authorization = authPayload || {
    access_token: "offline",
    client_token: "offline",
    uuid: "12345678-1234-1234-1234-123456789abc",
    name: "PvP_Player",
    user_properties: "{}"
  };

  const opts = {
    clientPackage: null,
    authorization: authorization,
    root: mcPath,
    javaPath: javaPath,
    version: {
      number: "1.21.1",
      type: "release",
      ...(fabricVer ? { custom: fabricVer } : {})
    },
    memory: {
      max: \`\${ram || 4}G\`,
      min: "2G"
    }
  };

  const modeName = fabricVer ? \`Fabric (\${fabricVer})\` : "Vanilla 1.21.1";
  mainWindow.webContents.send('status-update', { message: \`Fetching assets (\${modeName})...\`, progress: 30 });
  
  launcher.launch(opts);

  launcher.on('progress', (e) => {
    let percent = e.total > 0 ? Math.round((e.task / e.total) * 100) : 50;
    mainWindow.webContents.send('status-update', {
      message: \`Downloading: \${percent}%\`,
      progress: percent
    });
  });

  launcher.on('data', () => {
    mainWindow.webContents.send('status-update', { message: 'Minecraft is running!', progress: 100 });
  });

  launcher.on('close', () => {
    mainWindow.webContents.send('game-closed');
  });
});
`,

  'PvPLauncher/preload.js': `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  msLogin: () => ipcRenderer.invoke('ms-login'),
  launchGame: (data) => ipcRenderer.send('launch-game', data),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, val) => callback(val)),
  onGameClosed: (callback) => ipcRenderer.on('game-closed', () => callback())
});
`,

  'PvPLauncher/src/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PvP Client Launcher</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="titlebar">
    <div class="brand">⚡ PVP CLIENT 1.21.1</div>
    <div class="window-controls">
      <button id="min-btn">−</button>
      <button id="close-btn">×</button>
    </div>
  </div>

  <div class="main-body">
    <div class="profile-card">
      <img id="player-avatar" src="https://minotar.net/avatar/MHF_Steve/64" alt="Skin">
      <div>
        <h2 id="player-name">Offline Mode</h2>
        <button id="btn-login" class="login-btn">Login with Microsoft</button>
      </div>
    </div>

    <div class="settings-panel">
      <div class="field">
        <label>Memory (RAM):</label>
        <select id="ram-select">
          <option value="4">4 GB</option>
          <option value="6" selected>6 GB</option>
          <option value="8">8 GB</option>
        </select>
      </div>
      <button id="btn-play" class="play-btn">PLAY 1.21.1</button>
    </div>

    <div class="status-box">
      <div id="status-label">Ready</div>
      <div class="bar-bg"><div id="bar-fill"></div></div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
`,

  'PvPLauncher/src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; font-family: Segoe UI, sans-serif; user-select: none; }
body { background: #0b0f19; color: #fff; height: 100vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #1e293b; border-radius: 8px; }
.titlebar { height: 36px; background: #0f172a; display: flex; justify-content: space-between; align-items: center; padding: 0 12px; -webkit-app-region: drag; }
.brand { font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; }
.window-controls { -webkit-app-region: no-drag; }
.window-controls button { background: none; border: none; color: #94a3b8; font-size: 16px; padding: 4px 10px; cursor: pointer; }
.window-controls button:hover { background: #334155; color: #fff; }
#close-btn:hover { background: #ef4444; }

.main-body { padding: 30px; display: flex; flex-direction: column; gap: 20px; flex: 1; }
.profile-card { background: #1e293b; padding: 16px; border-radius: 8px; display: flex; align-items: center; gap: 16px; }
.profile-card img { border-radius: 6px; width: 50px; height: 50px; }
.profile-card h2 { font-size: 18px; margin-bottom: 4px; }
.login-btn { background: #0284c7; border: none; color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600; }
.login-btn:hover { background: #0369a1; }

.settings-panel { display: flex; gap: 16px; align-items: flex-end; margin-top: auto; }
.field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.field label { font-size: 12px; color: #94a3b8; }
.field select { padding: 10px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 6px; }

.play-btn { background: #10b981; border: none; color: #fff; font-weight: bold; padding: 0 32px; height: 42px; border-radius: 6px; cursor: pointer; font-size: 15px; }
.play-btn:hover { background: #059669; }

.status-box { display: flex; flex-direction: column; gap: 6px; }
#status-label { font-size: 12px; color: #94a3b8; }
.bar-bg { height: 6px; background: #1e293b; border-radius: 4px; overflow: hidden; }
#bar-fill { width: 0%; height: 100%; background: #38bdf8; transition: width 0.2s; }
`,

  'PvPLauncher/src/renderer.js': `const closeBtn = document.getElementById('close-btn');
const minBtn = document.getElementById('min-btn');
const loginBtn = document.getElementById('btn-login');
const playBtn = document.getElementById('btn-play');
const playerName = document.getElementById('player-name');
const playerAvatar = document.getElementById('player-avatar');
const ramSelect = document.getElementById('ram-select');
const statusLabel = document.getElementById('status-label');
const barFill = document.getElementById('bar-fill');

closeBtn.onclick = () => window.api.closeWindow();
minBtn.onclick = () => window.api.minimizeWindow();

loginBtn.onclick = async () => {
  statusLabel.innerText = "Opening Microsoft Login window...";
  const res = await window.api.msLogin();
  if (res.success) {
    playerName.innerText = res.profile.name;
    playerAvatar.src = \`https://minotar.net/avatar/\${res.profile.name}/64\`;
    loginBtn.innerText = "Logged In";
    loginBtn.disabled = true;
    statusLabel.innerText = "Authentication successful.";
  } else {
    statusLabel.innerText = "Login failed: " + res.error;
  }
};

playBtn.onclick = () => {
  playBtn.disabled = true;
  playBtn.innerText = "RUNNING...";
  window.api.launchGame({ ram: ramSelect.value });
};

window.api.onStatusUpdate((d) => {
  statusLabel.innerText = d.message;
  barFill.style.width = \`\${d.progress}%\`;
});

window.api.onGameClosed(() => {
  playBtn.disabled = false;
  playBtn.innerText = "PLAY 1.21.1";
  statusLabel.innerText = "Game terminated.";
  barFill.style.width = "0%";
});
`
};

// Generate all files
Object.entries(files).forEach(([filePath, content]) => {
  const absolutePath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Generated: ${filePath}`);
});

console.log('\\n[SUCCESS] Entire system generated successfully!');
