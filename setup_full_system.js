// setup_full_system.js - Automated System Generator
const fs = require('fs');
const path = require('path');

const files = {
  // ---------------------------------------------------------
  // 1. ROOT BUILD SCRIPT
  // ---------------------------------------------------------
  'build_all.bat': `@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   MINECRAFT 1.21.1 OFFICIAL CLIENT + PVP MOD BUILDER
echo ========================================================

:: Auto-detect Java 21 from .minecraft
if exist "%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\\bin\\java.exe" (
    set "JAVA_HOME=%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "PATH=!JAVA_HOME!\\bin;!PATH!"
)

echo [1/3] Compiling Fabric 1.21.1 Java PvP Mod...
cd SimplePvPMod
call gradlew.bat build 2>nul || call gradle build 2>nul
if %errorlevel% neq 0 (
    echo [Note] If gradle wrapper is not present, compile with JDK 21 installed.
)
cd ..

echo [2/3] Bundling compiled Mod into Launcher assets...
if not exist "PvPLauncher\\bundled_mods" mkdir "PvPLauncher\\bundled_mods"
if exist "SimplePvPMod\\build\\libs\\SimplePvP-1.21.1-1.0.0.jar" (
    copy /Y "SimplePvPMod\\build\\libs\\SimplePvP-1.21.1-1.0.0.jar" "PvPLauncher\\bundled_mods\\"
    echo [OK] Bundled SimplePvP-1.21.1-1.0.0.jar
)

echo [3/3] Installing Launcher dependencies and compiling .exe...
cd PvPLauncher
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Launcher executable!
    pause
    exit /b %errorlevel%
)
cd ..

echo ========================================================
echo [SUCCESS] Complete Client Ready!
echo Location: PvPLauncher\\dist\\
echo ========================================================
pause
`,

  // ---------------------------------------------------------
  // 2. FABRIC 1.21.1 JAVA PVP MOD
  // ---------------------------------------------------------
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
    description: "In-Game CPS, WASD Keystrokes, and Armor Status for 1.21.1",
    authors: ["Developer"],
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

            // 2. Keystrokes HUD
            renderKey(context, client, client.options.forwardKey, "W", 32, 26);
            renderKey(context, client, client.options.leftKey, "A", 10, 48);
            renderKey(context, client, client.options.backKey, "S", 32, 48);
            renderKey(context, client, client.options.rightKey, "D", 54, 48);

            // 3. Armor Durability Status
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

    private void renderKey(DrawContext context, MinecraftClient client, KeyBinding key, String label, int x, int y) {
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
import net.minecraft.client.Mouse;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Mouse.class)
public class MouseMixin {
    @Inject(method = "onMouseButton", at = @At("HEAD"))
    private void onMouseClick(long window, int button, int action, int mods, CallbackInfo ci) {
        if (button == 0 && action == 1) {
            SimplePvPClient.registerClick();
        }
    }
}
`,

  // ---------------------------------------------------------
  // 3. ELECTRON OFFICIAL LAUNCHER
  // ---------------------------------------------------------
  'PvPLauncher/package.json': JSON.stringify({
    name: "minecraft-official-launcher",
    version: "1.21.1",
    description: "Minecraft Official Style Client Launcher with MS Auth",
    main: "main.js",
    scripts: {
      start: "electron .",
      build: "electron-builder --win"
    },
    dependencies: {
      "minecraft-launcher-core": "^3.18.2",
      "msmc": "^4.1.0"
    },
    devDependencies: {
      "electron": "^30.5.1",
      "electron-builder": "^24.13.3"
    },
    build: {
      appId: "com.mojang.minecraftlauncher",
      productName: "Minecraft-Official-Launcher",
      directories: {
        output: "dist"
      },
      win: {
        target: ["nsis", "portable"]
      }
    }
  }, null, 2),

  'PvPLauncher/main.js': `const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Client } = require('minecraft-launcher-core');
const msmc = require('msmc');

let mainWindow;
const launcher = new Client();
let activeAuth = null;
const mcPath = path.join(process.env.APPDATA, '.minecraft');

const sessionPath = path.join(app.getPath('userData'), 'ms_session.json');

// Auto-detect Java 21 without printing 'INFO: Could not find files'
function findJavaExecutable() {
  try {
    const pathJava = execSync('where java', { 
      encoding: 'utf-8', 
      stdio: ['ignore', 'pipe', 'ignore'] 
    }).trim().split('\\r\\n')[0];
    if (pathJava && fs.existsSync(pathJava)) return pathJava;
  } catch (e) {}

  const jreBase = path.join(mcPath, 'jre');
  if (fs.existsSync(jreBase)) {
    const findInDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const candidate = path.join(fullPath, 'bin', 'java.exe');
          if (fs.existsSync(candidate)) return candidate;
          const nested = findInDir(fullPath);
          if (nested) return nested;
        }
      }
      return null;
    };
    const found = findInDir(jreBase);
    if (found) return found;
  }

  const standardPaths = [
    'C:\\\\Program Files\\\\Java',
    'C:\\\\Program Files\\\\Eclipse Adoptium',
    'C:\\\\Program Files\\\\Microsoft'
  ];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) {
      const items = fs.readdirSync(p);
      for (const item of items) {
        const candidate = path.join(p, item, 'bin', 'java.exe');
        if (fs.existsSync(candidate)) return candidate;
      }
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 900,
    minHeight: 550,
    frame: false,
    backgroundColor: '#1b1b1b',
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
ipcMain.on('open-external', (e, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  }
});

// Auto Check Saved Login
ipcMain.handle('check-saved-login', async () => {
  if (!fs.existsSync(sessionPath)) return null;
  try {
    const raw = fs.readFileSync(sessionPath, 'utf8');
    const saved = JSON.parse(raw);
    const authManager = new msmc.Auth();
    const xbox = await authManager.refresh(saved);
    const mc = await xbox.getMinecraft();
    activeAuth = mc.mclc();
    return { name: mc.profile.name, uuid: mc.profile.id };
  } catch (err) {
    try { if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath); } catch (e) {}
    return null;
  }
});

// Microsoft OAuth Login
ipcMain.handle('login-microsoft', async () => {
  try {
    const authManager = new msmc.Auth("select_account");
    const xboxManager = await authManager.launch("electron");
    const mc = await xboxManager.getMinecraft();
    fs.writeFileSync(sessionPath, JSON.stringify(xboxManager.save()), 'utf8');
    activeAuth = mc.mclc();
    return { success: true, profile: { name: mc.profile.name, uuid: mc.profile.id } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Logout
ipcMain.handle('logout-account', async () => {
  activeAuth = null;
  if (fs.existsSync(sessionPath)) {
    try { fs.unlinkSync(sessionPath); } catch (e) {}
  }
  return true;
});

// Sync Mod JAR to .minecraft/mods
function injectMod(mcPath) {
  const modsPath = path.join(mcPath, 'mods');
  if (!fs.existsSync(modsPath)) fs.mkdirSync(modsPath, { recursive: true });
  
  const srcMod = path.join(__dirname, 'bundled_mods', 'SimplePvP-1.21.1-1.0.0.jar');
  const destMod = path.join(modsPath, 'SimplePvP-1.21.1-1.0.0.jar');
  if (fs.existsSync(srcMod) && !fs.existsSync(destMod)) {
    fs.copyFileSync(srcMod, destMod);
  }
}

// Launch Minecraft
ipcMain.on('launch-game', (event, { version }) => {
  if (!activeAuth) {
    mainWindow.webContents.send('status-update', { message: 'Please Login with your Paid Microsoft Account!', progress: 0 });
    return;
  }

  injectMod(mcPath);

  const rawVer = version || "1.21.1";
  const targetVersion = rawVer.includes('fabric') ? "1.21.1" : rawVer.split(' ')[0];
  const javaPath = findJavaExecutable();
  const fabricVersion = (rawVer.includes('fabric') || rawVer.includes('Fabric')) ? getFabricVersion("1.21.1") : null;

  const opts = {
    clientPackage: null,
    authorization: activeAuth,
    root: mcPath,
    javaPath: javaPath,
    version: {
      number: targetVersion,
      type: "release",
      ...(fabricVersion ? { custom: fabricVersion } : {})
    },
    memory: {
      max: "4G",
      min: "2G"
    }
  };

  const modeText = fabricVersion ? \`Fabric (\${fabricVersion})\` : \`Minecraft \${targetVersion}\`;
  mainWindow.webContents.send('status-update', { message: \`Downloading game libraries & resources (\${modeText})...\`, progress: 20 });
  launcher.launch(opts);

  launcher.on('progress', (e) => {
    let pct = e.total > 0 ? Math.round((e.task / e.total) * 100) : 50;
    mainWindow.webContents.send('status-update', {
      message: \`Fetching assets (\${e.type}): \${pct}%\`,
      progress: pct
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
  close: () => ipcRenderer.send('window-close'),
  minimize: () => ipcRenderer.send('window-minimize'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  checkSavedLogin: () => ipcRenderer.invoke('check-saved-login'),
  loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
  logoutAccount: () => ipcRenderer.invoke('logout-account'),
  launch: (data) => ipcRenderer.send('launch-game', data),
  onStatus: (callback) => ipcRenderer.on('status-update', (e, val) => callback(val)),
  onClosed: (callback) => ipcRenderer.on('game-closed', () => callback())
});
`,

  'PvPLauncher/src/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Minecraft Launcher</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="launcher-header">
    <div class="edition-title">MINECRAFT: JAVA EDITION</div>
    <div class="window-controls">
      <button id="btn-min" class="win-btn">−</button>
      <button id="btn-close" class="win-btn">×</button>
    </div>
  </header>

  <div class="nav-bar">
    <div class="nav-links">
      <button class="nav-tab active" data-tab="play">Play</button>
      <button class="nav-tab" data-tab="installations">Installations</button>
      <button class="nav-tab" data-tab="skins">Skins</button>
      <button class="nav-tab" data-tab="patchnotes">Patch Notes</button>
    </div>

    <div class="account-profile-nav">
      <img id="nav-avatar" src="https://minotar.net/avatar/MHF_Steve/28" alt="Skin">
      <span id="nav-player-name">Not Logged In</span>
      <button id="btn-login-ms" class="ms-btn">Login Microsoft</button>
      <button id="btn-logout" class="logout-btn" style="display: none;">Logout</button>
    </div>
  </div>

  <main class="viewport">
    <section id="tab-play" class="tab-content active">
      <div class="hero-artwork">
        <div class="mc-logo">
          <img src="https://launchercontent.mojang.com/v2/logos/minecraft_java.png" onerror="this.style.display='none'; document.getElementById('alt-logo').style.display='block';" alt="Logo">
          <h1 id="alt-logo" class="fallback-logo">MINECRAFT<span>JAVA EDITION</span></h1>
        </div>

        <div class="promo-banner">
          <span>Give the gift of Minecraft and play together with your friends!</span>
          <button class="btn-gift" id="btn-gift">GIFT 🎁</button>
        </div>
      </div>

      <div class="launch-footer">
        <div class="video-preview-btn">
          <button id="btn-trailer" title="Watch Trailer">▶</button>
        </div>

        <div class="version-selector-container">
          <div class="version-dropdown-box" id="dropdown-toggle">
            <img class="grass-icon" src="https://cdn-icons-png.flaticon.com/512/356/356725.png" alt="Grass">
            <div class="version-meta">
              <span class="v-title" id="selected-title">Latest release</span>
              <span class="v-number" id="selected-ver">1.21.1</span>
            </div>
            <span class="v-arrow">▼</span>
          </div>

          <div class="version-menu" id="version-menu">
            <div class="v-option selected" data-title="Latest release" data-ver="1.21.1">
              <img class="grass-icon" src="https://cdn-icons-png.flaticon.com/512/356/356725.png" alt="Grass">
              <div>
                <strong>Latest release</strong>
                <small>1.21.1 (Multiplayer Online)</small>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-minecraft-play" id="btn-play">PLAY</button>

        <div class="account-tag">
          <span id="footer-username">Login Required</span>
        </div>
      </div>
    </section>

    <section id="tab-installations" class="tab-content">
      <div class="tab-inner">
        <h2>Installations</h2>
        <div class="install-row">
          <img src="https://cdn-icons-png.flaticon.com/512/356/356725.png" class="grass-icon" alt="icon">
          <div class="install-details">
            <strong>Latest release (1.21.1)</strong>
            <span>Fabric Mod Injection Active</span>
          </div>
        </div>
      </div>
    </section>

    <section id="tab-skins" class="tab-content">
      <div class="tab-inner">
        <h2>Character Appearance</h2>
        <div class="skin-card">
          <img id="skin-preview" src="https://minotar.net/bust/Steve/100" alt="Skin">
          <strong id="skin-name">Steve</strong>
        </div>
      </div>
    </section>

    <section id="tab-patchnotes" class="tab-content">
      <div class="tab-inner">
        <h2>Minecraft 1.21.1: Tricky Trials</h2>
        <p>Official Tricky Trials release including Crafter blocks, Breeze mob, and Trial Chambers.</p>
      </div>
    </section>
  </main>

  <div class="status-overlay" id="status-overlay">
    <div class="status-box">
      <div id="status-text">Ready</div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" id="progress-fill"></div></div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
`,

  'PvPLauncher/src/style.css': `@import url('https://fonts.cdnfonts.com/css/minecraft-4');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background: #181818;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.launcher-header {
  height: 32px;
  background: #111111;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: drag;
  border-bottom: 1px solid #242424;
}

.edition-title { font-size: 11px; font-weight: 700; color: #a0a0a0; letter-spacing: 0.5px; }
.window-controls { -webkit-app-region: no-drag; }
.win-btn { background: none; border: none; color: #888; font-size: 16px; padding: 0 10px; height: 32px; cursor: pointer; }
.win-btn:hover { background: #333; color: #fff; }
#btn-close:hover { background: #d32f2f; }

.nav-bar {
  height: 48px;
  background: #1e1e1e;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #2b2b2b;
}

.nav-links { display: flex; gap: 18px; }
.nav-tab {
  background: none;
  border: none;
  color: #c0c0c0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 13px 4px;
  position: relative;
}
.nav-tab:hover, .nav-tab.active { color: #fff; }
.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #2ebd59;
}

.account-profile-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #121212;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #2d2d2d;
}
.account-profile-nav img { width: 24px; height: 24px; border-radius: 3px; }
#nav-player-name { font-size: 12px; font-weight: 700; color: #ddd; }
.ms-btn {
  background: #0284c7;
  border: none;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
}
.ms-btn:hover { background: #0369a1; }
.logout-btn {
  background: #333;
  border: none;
  color: #ff6b6b;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.viewport { flex: 1; position: relative; overflow: hidden; }
.tab-content { display: none; width: 100%; height: 100%; }
.tab-content.active { display: flex; flex-direction: column; }

.hero-artwork {
  flex: 1;
  position: relative;
  background: url('https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg') center/cover no-repeat;
  background-color: #2b1f1d;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
}

.mc-logo { margin-top: 10px; }
.mc-logo img { max-width: 340px; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7)); }
.fallback-logo { font-family: 'Minecraft', sans-serif; font-size: 38px; text-shadow: 3px 3px 0 #000; text-align: center; }
.fallback-logo span { display: block; font-size: 14px; color: #ffaa00; }

.promo-banner {
  position: absolute;
  right: 25px;
  bottom: 25px;
  background: #14b866;
  color: #052e16;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid #22c55e;
}
.btn-gift { background: #1e1e1e; color: #fff; border: 1px solid #333; padding: 6px 12px; font-weight: bold; cursor: pointer; }

.launch-footer {
  height: 90px;
  background: #202020;
  border-top: 2px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  position: relative;
}

.video-preview-btn button {
  width: 44px;
  height: 44px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.version-selector-container { position: relative; min-width: 220px; }
.version-dropdown-box {
  background: #181818;
  border: 2px solid #a855f7;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.grass-icon { width: 28px; height: 28px; image-rendering: pixelated; }
.version-meta { display: flex; flex-direction: column; }
.v-title { font-size: 13px; font-weight: 700; }
.v-number { font-size: 11px; color: #888; }
.v-arrow { margin-left: auto; font-size: 10px; color: #888; }

.version-menu {
  display: none;
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 100%;
  background: #1b1b1b;
  border: 1px solid #333;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.6);
  z-index: 50;
}
.version-menu.show { display: flex; flex-direction: column; }
.v-option { padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.v-option:hover { background: #2ebd59; }

.btn-minecraft-play {
  background: #2ebd59;
  border: none;
  border-bottom: 4px solid #1e823c;
  color: #fff;
  font-family: 'Minecraft', sans-serif;
  font-size: 24px;
  letter-spacing: 2px;
  padding: 12px 65px;
  cursor: pointer;
  text-shadow: 2px 2px 0 #1b6330;
}
.btn-minecraft-play:hover { filter: brightness(1.1); }
.btn-minecraft-play:active { transform: translateY(2px); border-bottom-width: 2px; }
.btn-minecraft-play:disabled { background: #555; border-bottom-color: #333; text-shadow: none; cursor: not-allowed; }

.account-tag { font-weight: 700; font-size: 13px; color: #ddd; }

.tab-inner { padding: 30px; display: flex; flex-direction: column; gap: 16px; }
.install-row { background: #242424; padding: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid #333; }
.install-details { flex: 1; display: flex; flex-direction: column; }
.skin-card { background: #242424; padding: 16px; display: inline-flex; flex-direction: column; align-items: center; gap: 10px; width: 140px; border: 1px solid #333; }

.status-overlay {
  display: none;
  position: absolute;
  bottom: 90px;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 25px;
}
.status-overlay.show { display: block; }
.status-box { display: flex; flex-direction: column; gap: 6px; }
#status-text { font-size: 12px; color: #2ebd59; font-weight: 600; }
.progress-bar-bg { height: 6px; background: #333; border-radius: 3px; overflow: hidden; }
.progress-bar-fill { width: 0%; height: 100%; background: #2ebd59; transition: width 0.2s ease; }
`,

  'PvPLauncher/src/renderer.js': `document.getElementById('btn-min').addEventListener('click', () => window.api.minimize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

const tabs = document.querySelectorAll('.nav-tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById(\`tab-\${tab.getAttribute('data-tab')}\`);
    if (target) target.classList.add('active');
  });
});

const dropdownToggle = document.getElementById('dropdown-toggle');
const versionMenu = document.getElementById('version-menu');
const selectedTitle = document.getElementById('selected-title');
const selectedVer = document.getElementById('selected-ver');
let activeVersion = "1.21.1";

dropdownToggle.addEventListener('click', () => versionMenu.classList.toggle('show'));

document.querySelectorAll('.v-option').forEach(option => {
  option.addEventListener('click', () => {
    activeVersion = option.getAttribute('data-ver');
    selectedTitle.innerText = option.getAttribute('data-title');
    selectedVer.innerText = activeVersion;
    versionMenu.classList.remove('show');
  });
});

window.addEventListener('click', (e) => {
  if (!dropdownToggle.contains(e.target) && !versionMenu.contains(e.target)) {
    versionMenu.classList.remove('show');
  }
});

const navPlayerName = document.getElementById('nav-player-name');
const footerUsername = document.getElementById('footer-username');
const navAvatar = document.getElementById('nav-avatar');
const skinPreview = document.getElementById('skin-preview');
const skinName = document.getElementById('skin-name');
const btnLoginMs = document.getElementById('btn-login-ms');
const btnLogout = document.getElementById('btn-logout');
const btnPlay = document.getElementById('btn-play');
const statusOverlay = document.getElementById('status-overlay');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');

let isLoggedIn = false;

function setLoggedInUI(username) {
  isLoggedIn = true;
  navPlayerName.innerText = username;
  footerUsername.innerText = username;
  navAvatar.src = \`https://minotar.net/avatar/\${username}/28\`;
  skinPreview.src = \`https://minotar.net/bust/\${username}/100\`;
  skinName.innerText = username;
  btnLoginMs.style.display = 'none';
  btnLogout.style.display = 'inline-block';
  btnPlay.disabled = false;
}

function setLoggedOutUI() {
  isLoggedIn = false;
  navPlayerName.innerText = "Not Logged In";
  footerUsername.innerText = "Login Required";
  navAvatar.src = "https://minotar.net/avatar/MHF_Steve/28";
  skinPreview.src = "https://minotar.net/bust/Steve/100";
  skinName.innerText = "Steve";
  btnLoginMs.style.display = 'inline-block';
  btnLogout.style.display = 'none';
}

window.api.checkSavedLogin().then(account => {
  if (account) setLoggedInUI(account.name);
  else setLoggedOutUI();
});

btnLoginMs.addEventListener('click', async () => {
  statusOverlay.classList.add('show');
  statusText.innerText = "Opening Microsoft Login window...";
  const res = await window.api.loginMicrosoft();
  if (res.success) {
    setLoggedInUI(res.profile.name);
    statusText.innerText = "Authentication successful!";
    setTimeout(() => statusOverlay.classList.remove('show'), 1500);
  } else {
    alert("Login failed: " + res.error);
    statusOverlay.classList.remove('show');
  }
});

btnLogout.addEventListener('click', async () => {
  await window.api.logoutAccount();
  setLoggedOutUI();
});

btnPlay.addEventListener('click', () => {
  if (!isLoggedIn) {
    alert("Please login with a paid Minecraft Microsoft Account!");
    return;
  }
  btnPlay.disabled = true;
  btnPlay.innerText = "LAUNCHING...";
  statusOverlay.classList.add('show');
  statusText.innerText = \`Preparing Minecraft \${activeVersion}...\`;
  window.api.launch({ version: activeVersion });
});

document.getElementById('btn-trailer').addEventListener('click', () => {
  window.api.openExternal('https://www.youtube.com/watch?v=0k5L9oA-7_0');
});

document.getElementById('btn-gift').addEventListener('click', () => {
  window.api.openExternal('https://www.minecraft.net/en-us/store/minecraft-deluxe-collection-pc');
});

window.api.onStatus((data) => {
  statusText.innerText = data.message;
  progressFill.style.width = \`\${data.progress}%\`;
});

window.api.onClosed(() => {
  btnPlay.disabled = false;
  btnPlay.innerText = "PLAY";
  statusOverlay.classList.remove('show');
  progressFill.style.width = "0%";
});
`
};

// Generate files recursively
console.log("Generating complete client infrastructure...");
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`[+] Created: ${relPath}`);
});

console.log("\n=======================================================");
console.log("ALL FILES CREATED SUCCESSFULLY!");
console.log("Next step: Run `build_all.bat` to compile both the mod and launcher.");
console.log("=======================================================");
