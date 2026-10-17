// setup_nmc_master.js - Master Automated Infrastructure Generator
const fs = require('fs');
const path = require('path');

const files = {
  // -------------------------------------------------------------
  // 1. ROOT BATCH BUILDER (.BAT)
  // -------------------------------------------------------------
  'build_nmc_client.bat': `@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       NMC LAUNCHER - COMPLETE CLIENT AND MOD BUILDER
echo ========================================================

:: Auto-detect Java 21
if exist "%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\\bin\\java.exe" (
    set "JAVA_HOME=%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9"
    set "PATH=%APPDATA%\\.minecraft\\jre\\OpenJDK21U-jre_x64_windows_hotspot_21.0.3_9\\bin;!PATH!"
    echo [OK] Using Java Home: !JAVA_HOME!
)

echo [1/3] Compiling Fabric 1.21.1 Java PvP Mod...
cd NMCClientMod
call gradlew.bat build
if %errorlevel% neq 0 (
    echo [ERROR] Fabric Mod build failed! Please make sure JDK 21 is configured.
    pause
    exit /b %errorlevel%
)
cd ..

echo [2/3] Bundling compiled Mod into Launcher resources...
if not exist "NMCLauncherApp\\bundled_mods" mkdir "NMCLauncherApp\\bundled_mods"
copy /Y "NMCClientMod\\build\\libs\\NMCClientMod-1.21.1-1.0.0.jar" "NMCLauncherApp\\bundled_mods\\"

echo [3/3] Installing Dependencies & Packaging NMCLUNCHER.exe...
cd NMCLauncherApp
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo ========================================================
echo [SUCCESS] NMCLUNCHER.exe Created Successfully!
echo Path: NMCLauncherApp\\dist\\NMCLUNCHER Setup 1.3.0.exe
echo ========================================================
pause
`,

  // -------------------------------------------------------------
  // 2. FABRIC 1.21.1 JAVA PVP CLIENT MOD (SOURCE & CONFIG)
  // -------------------------------------------------------------
  'NMCClientMod/settings.gradle': `pluginManagement {
    repositories {
        maven { url = "https://maven.fabricmc.net/" }
        gradlePluginPortal()
    }
}
rootProject.name = 'NMCClientMod'
`,

  'NMCClientMod/build.gradle': `plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}

version = "1.0.0"
group = "com.nmcclient"

base {
    archivesName = "NMCClientMod-1.21.1"
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

tasks.withType(JavaCompile).configureEach {
    it.options.release = 21
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
`,

  'NMCClientMod/src/main/resources/fabric.mod.json': JSON.stringify({
    schemaVersion: 1,
    id: "nmcclientmod",
    version: "1.0.0",
    name: "NMC PvP Client Mod",
    description: "In-game CPS, Keystrokes, Armor Durability, and Reach Display HUD",
    authors: ["NMC Team"],
    license: "MIT",
    environment: "client",
    entrypoints: {
      client: ["com.nmcclient.NMCClientMod"]
    },
    mixins: ["nmcclientmod.mixins.json"],
    depends: {
      fabricloader: ">=0.16.0",
      minecraft: "~1.21.1",
      java: ">=21"
    }
  }, null, 2),

  'NMCClientMod/src/main/resources/nmcclientmod.mixins.json': JSON.stringify({
    required: true,
    minVersion: "0.8",
    package: "com.nmcclient.mixin",
    compatibilityLevel: "JAVA_21",
    client: [
      "MouseMixin",
      "PlayerAttackMixin"
    ],
    injectors: { defaultRequire: 1 }
  }, null, 2),

  'NMCClientMod/src/main/java/com/nmcclient/NMCConfig.java': `package com.nmcclient;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.client.MinecraftClient;
import java.io.File;
import java.io.FileReader;

public class NMCConfig {
    public static boolean reachDisplay = true;
    public static boolean targetHealth = true;
    public static boolean pingFps = true;
    public static boolean keystrokesBps = true;
    public static boolean armorDurability = true;
    public static String customTag = "[NMC-PRO]";
    public static int tagColor = 0x00E5FF;

    public static void load() {
        try {
            File runDir = MinecraftClient.getInstance().runDirectory;
            File cfg = new File(runDir, "nmc_pvp_modules.json");
            if (cfg.exists()) {
                JsonObject obj = JsonParser.parseReader(new FileReader(cfg)).getAsJsonObject();
                if (obj.has("reachDisplay")) reachDisplay = obj.get("reachDisplay").getAsBoolean();
                if (obj.has("targetHealth")) targetHealth = obj.get("targetHealth").getAsBoolean();
                if (obj.has("pingFps")) pingFps = obj.get("pingFps").getAsBoolean();
                if (obj.has("keystrokesBps")) keystrokesBps = obj.get("keystrokesBps").getAsBoolean();
                if (obj.has("armorDurability")) armorDurability = obj.get("armorDurability").getAsBoolean();
                if (obj.has("customTag")) customTag = obj.get("customTag").getAsString();
                if (obj.has("tagColor")) tagColor = Integer.parseInt(obj.get("tagColor").getAsString().replace("#", ""), 16);
            }
        } catch (Exception ignored) {}
    }
}
`,

  'NMCClientMod/src/main/java/com/nmcclient/NMCClientMod.java': `package com.nmcclient;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.PlayerListEntry;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.item.ItemStack;
import net.minecraft.util.math.Vec3d;
import java.util.LinkedList;

public class NMCClientMod implements ClientModInitializer {
    public static final LinkedList<Long> leftClicks = new LinkedList<>();
    public static final LinkedList<Long> rightClicks = new LinkedList<>();
    public static double lastReachDistance = 0.0;
    public static long lastReachTime = 0;
    public static String targetEntityName = "";
    public static float targetEntityHealth = 0.0f;

    @Override
    public void onInitializeClient() {
        NMCConfig.load();

        HudRenderCallback.EVENT.register((DrawContext context, RenderTickCounter tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player == null || client.options.hudHidden) return;

            long now = System.currentTimeMillis();
            while (!leftClicks.isEmpty() && now - leftClicks.peek() > 1000) leftClicks.remove();
            while (!rightClicks.isEmpty() && now - rightClicks.peek() > 1000) rightClicks.remove();

            // 1. [240 FPS] & [162 ms] Counter
            if (NMCConfig.pingFps) {
                int fps = client.getCurrentFps();
                int latency = 0;
                if (client.getNetworkHandler() != null) {
                    PlayerListEntry entry = client.getNetworkHandler().getPlayerListEntry(client.player.getUuid());
                    if (entry != null) latency = entry.getLatency();
                }
                context.drawText(client.textRenderer, "[" + fps + " FPS]", 10, 10, 0xFFFFFF, true);
                context.drawText(client.textRenderer, "[" + latency + " ms]", 10, 22, 0x38BDF8, true);
            }

            // 2. Reach Display & Target Health
            if (NMCConfig.reachDisplay && (now - lastReachTime < 2500) && lastReachDistance > 0) {
                String reachStr = String.format("[%.2f Blocks]", lastReachDistance);
                int screenW = client.getWindow().getScaledWidth();
                int screenH = client.getWindow().getScaledHeight();
                context.drawText(client.textRenderer, reachStr, (screenW / 2) - (client.textRenderer.getWidth(reachStr) / 2), (screenH / 2) + 14, 0x00E5FF, true);

                if (NMCConfig.targetHealth && !targetEntityName.isEmpty()) {
                    String targetStr = targetEntityName + " " + (int) targetEntityHealth + " ❤";
                    context.drawText(client.textRenderer, targetStr, (screenW / 2) - (client.textRenderer.getWidth(targetStr) / 2), (screenH / 2) - 22, 0xFF5555, true);
                }
            }

            // 3. Keystrokes & Speedometer (BPS)
            if (NMCConfig.keystrokesBps) {
                int startX = client.getWindow().getScaledWidth() - 74;
                renderKey(context, client, client.options.forwardKey, "W", startX + 22, 10);
                renderKey(context, client, client.options.leftKey, "A", startX, 32);
                renderKey(context, client, client.options.backKey, "S", startX + 22, 32);
                renderKey(context, client, client.options.rightKey, "D", startX + 44, 32);

                renderButton(context, client, !leftClicks.isEmpty(), "LMB " + leftClicks.size(), startX, 54, 31);
                renderButton(context, client, !rightClicks.isEmpty(), "RMB " + rightClicks.size(), startX + 33, 54, 32);

                Vec3d vel = client.player.getVelocity();
                double bps = Math.sqrt(vel.x * vel.x + vel.z * vel.z) * 20.0;
                String bpsStr = String.format("%.2f BPS", bps);
                context.drawText(client.textRenderer, bpsStr, startX + 10, 80, 0x00FF66, true);
            }

            // 4. Armor Durability Status
            if (NMCConfig.armorDurability) {
                int screenH = client.getWindow().getScaledHeight();
                int screenW = client.getWindow().getScaledWidth();
                int armorY = screenH - 95;
                int armorX = screenW - 75;

                for (ItemStack item : client.player.getArmorItems()) {
                    if (!item.isEmpty()) {
                        context.drawItem(item, armorX, armorY);
                        int dur = item.getMaxDamage() - item.getDamage();
                        context.drawText(client.textRenderer, String.valueOf(dur), armorX + 22, armorY + 4, 0xFFFFFF, true);
                        armorY += 18;
                    }
                }
            }
        });
    }

    private void renderKey(DrawContext ctx, MinecraftClient mc, KeyBinding k, String label, int x, int y) {
        boolean p = k.isPressed();
        ctx.fill(x, y, x + 20, y + 20, p ? 0x9000E5FF : 0x60000000);
        int w = mc.textRenderer.getWidth(label);
        ctx.drawText(mc.textRenderer, label, x + (20 - w) / 2, y + 6, p ? 0x000000 : 0xFFFFFF, false);
    }

    private void renderButton(DrawContext ctx, MinecraftClient mc, boolean active, String label, int x, int y, int width) {
        ctx.fill(x, y, x + width, y + 18, active ? 0x9000E5FF : 0x60000000);
        int w = mc.textRenderer.getWidth(label);
        ctx.drawText(mc.textRenderer, label, x + (width - w) / 2, y + 5, active ? 0x000000 : 0xFFFFFF, false);
    }
}
`,

  'NMCClientMod/src/main/java/com/nmcclient/mixin/MouseMixin.java': `package com.nmcclient.mixin;

import com.nmcclient.NMCClientMod;
import net.minecraft.client.Mouse;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Mouse.class)
public class MouseMixin {
    @Inject(method = "onMouseButton", at = @At("HEAD"))
    private void onMouse(long win, int btn, int action, int mods, CallbackInfo ci) {
        if (action == 1) {
            long now = System.currentTimeMillis();
            if (btn == 0) NMCClientMod.leftClicks.add(now);
            if (btn == 1) NMCClientMod.rightClicks.add(now);
        }
    }
}
`,

  'NMCClientMod/src/main/java/com/nmcclient/mixin/PlayerAttackMixin.java': `package com.nmcclient.mixin;

import com.nmcclient.NMCClientMod;
import net.minecraft.client.network.ClientPlayerInteractionManager;
import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ClientPlayerInteractionManager.class)
public class PlayerAttackMixin {
    @Inject(method = "attackEntity", at = @At("HEAD"))
    private void onAttack(PlayerEntity player, Entity target, CallbackInfo ci) {
        if (player != null && target != null) {
            NMCClientMod.lastReachDistance = player.getEyePos().distanceTo(target.getPos());
            NMCClientMod.lastReachTime = System.currentTimeMillis();
            if (target instanceof LivingEntity living) {
                NMCClientMod.targetEntityName = target.getName().getString();
                NMCClientMod.targetEntityHealth = living.getHealth();
            }
        }
    }
}
`,

  // -------------------------------------------------------------
  // 3. ELECTRON LAUNCHER ENGINE (FULL MULTI-SYSTEM)
  // -------------------------------------------------------------
  'NMCLauncherApp/package.json': JSON.stringify({
    name: "nmcluncher",
    version: "1.3.0",
    description: "NMCLUNCHER - Minecraft 1.21.1 Client & Marketplace Engine",
    author: "NMC Team",
    main: "main.js",
    scripts: {
      start: "electron .",
      build: "electron-builder --win"
    },
    dependencies: {
      "minecraft-launcher-core": "^3.2.3",
      "msmc": "^4.0.1",
      "uuid": "^9.0.1"
    },
    devDependencies: {
      "electron": "^30.0.0",
      "electron-builder": "^24.13.3"
    },
    build: {
      appId: "com.nmchosting.launcher",
      productName: "NMCLUNCHER",
      directories: { output: "dist" },
      win: { target: ["nsis", "portable"] },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        shortcutName: "NMCLUNCHER"
      }
    }
  }, null, 2),

  'NMCLauncherApp/main.js': `const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { Client, Authenticator } = require('minecraft-launcher-core');
const msmc = require('msmc');

let mainWindow;
const launcher = new Client();

const getMinecraftDir = () => path.join(process.env.APPDATA, '.minecraft');
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
const accountsPath = path.join(app.getPath('userData'), 'nmc_accounts.json');
const hudConfigPath = path.join(getMinecraftDir(), 'nmc_pvp_modules.json');

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
ipcMain.on('open-external', (e, url) => shell.openExternal(url));

// -------------------------------------------------------------
// 1. ACCOUNTS & AUTOMATED PURCHASE SYSTEM
// -------------------------------------------------------------
function loadAccounts() {
  if (!fs.existsSync(accountsPath)) return { activeId: null, accounts: [] };
  try { return JSON.parse(fs.readFileSync(accountsPath, 'utf8')); }
  catch { return { activeId: null, accounts: [] }; }
}

function saveAccounts(data) {
  fs.writeFileSync(accountsPath, JSON.stringify(data, null, 2), 'utf8');
}

ipcMain.handle('get-accounts', async () => loadAccounts());

ipcMain.handle('set-active-account', async (event, id) => {
  const data = loadAccounts();
  data.activeId = id;
  saveAccounts(data);
  return { success: true };
});

ipcMain.handle('create-offline-account', async (event, username) => {
  const name = username.trim();
  if (name.length < 3 || name.length > 16) return { success: false, error: 'Name must be 3-16 chars!' };
  const data = loadAccounts();
  const acc = {
    id: 'offline_' + uuidv4().substring(0, 8),
    type: 'offline',
    username: name,
    uuid: uuidv4(),
    skin: \`https://minotar.net/avatar/\${name}/40\`,
    createdAt: Date.now()
  };
  data.accounts.push(acc);
  data.activeId = acc.id;
  saveAccounts(data);
  return { success: true, account: acc };
});

ipcMain.handle('login-microsoft', async () => {
  try {
    const authManager = new msmc.Auth("select_account");
    const xbox = await authManager.launch("electron");
    const mc = await xbox.getMinecraft();
    const data = loadAccounts();
    const existing = data.accounts.findIndex(a => a.uuid === mc.profile.id);
    const acc = {
      id: 'ms_' + mc.profile.id,
      type: 'microsoft',
      username: mc.profile.name,
      uuid: mc.profile.id,
      skin: \`https://minotar.net/avatar/\${mc.profile.name}/40\`,
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
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-account', async (event, id) => {
  const data = loadAccounts();
  data.accounts = data.accounts.filter(a => a.id !== id);
  if (data.activeId === id) data.activeId = data.accounts[0]?.id || null;
  saveAccounts(data);
  return { success: true };
});

// Store Inventory
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
  const item = storeInventory.find(i => i.id === listingId);
  if (!item) return { success: false, error: 'Account listing not found!' };

  const data = loadAccounts();
  const injectedAccount = {
    id: 'store_' + uuidv4().substring(0, 8),
    type: 'microsoft',
    username: item.displayName,
    uuid: uuidv4(),
    skin: \`https://minotar.net/avatar/\${item.displayName}/40\`,
    authData: Authenticator.getAuth(item.displayName),
    rankBadge: item.rank,
    purchasedAt: Date.now()
  };

  data.accounts.push(injectedAccount);
  data.activeId = injectedAccount.id;
  saveAccounts(data);

  return { success: true, account: injectedAccount };
});

// -------------------------------------------------------------
// 2. MODRINTH MARKETPLACE & LOCAL MOD MANAGER
// -------------------------------------------------------------
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NMCLauncher/1.3.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function streamFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return streamFile(res.headers.location, dest, onProgress).then(resolve).catch(reject);
      }
      const total = parseInt(res.headers['content-length'], 10) || 0;
      let cur = 0;
      const fileStream = fs.createWriteStream(dest);
      res.on('data', chunk => {
        cur += chunk.length;
        if (total > 0 && onProgress) onProgress(Math.round((cur / total) * 100));
      });
      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(resolve));
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

ipcMain.handle('search-modrinth', async (event, { query, projectType }) => {
  try {
    const facets = [\`["versions:1.21.1"]\`, projectType === 'resourcepack' ? \`["project_type:resourcepack"]\` : \`["project_type:mod"]\`];
    if (projectType === 'mod') facets.push(\`["categories:fabric"]\`);

    const url = \`https://api.modrinth.com/v2/search?query=\${encodeURIComponent(query || '')}&facets=[\${facets.join(',')}]&limit=15&index=downloads\`;
    const res = await httpsGet(url);

    const modsList = fs.readdirSync(getModsDir()).map(f => f.toLowerCase());
    const packsList = fs.readdirSync(getResourcePacksDir()).map(f => f.toLowerCase());

    const hits = res.hits.map(h => ({
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
    const versions = await httpsGet(\`https://api.modrinth.com/v2/project/\${slug}/version\${param}\`);
    if (!versions || versions.length === 0) return { success: false, error: 'No 1.21.1 release found!' };

    const file = versions[0].files.find(f => f.primary) || versions[0].files[0];
    const targetDir = projectType === 'resourcepack' ? getResourcePacksDir() : getModsDir();
    const dest = path.join(targetDir, file.filename);

    await streamFile(file.url, dest, (percent) => {
      mainWindow.webContents.send('download-progress', { slug, percent });
    });
    return { success: true, filename: file.filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-local-mods', async () => {
  const dir = getModsDir();
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled')).map(file => {
      const stats = fs.statSync(path.join(dir, file));
      return {
        filename: file,
        name: file.replace('.jar.disabled', '').replace('.jar', ''),
        enabled: file.endsWith('.jar'),
        sizeMb: (stats.size / (1024 * 1024)).toFixed(2)
      };
    });
  } catch { return []; }
});

ipcMain.handle('toggle-mod', async (event, filename) => {
  const dir = getModsDir();
  const oldPath = path.join(dir, filename);
  const newName = filename.endsWith('.jar') ? filename + '.disabled' : filename.replace('.disabled', '');
  try { fs.renameSync(oldPath, path.join(dir, newName)); return { success: true }; }
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('delete-mod', async (event, filename) => {
  try { fs.unlinkSync(path.join(getModsDir(), filename)); return { success: true }; }
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.on('open-mods-folder', () => shell.openPath(getModsDir()));

// -------------------------------------------------------------
// 3. PVP MODULES CONFIG & LAUNCHING
// -------------------------------------------------------------
ipcMain.handle('get-hud-config', async () => {
  try {
    if (fs.existsSync(hudConfigPath)) return JSON.parse(fs.readFileSync(hudConfigPath, 'utf8'));
  } catch {}
  return {
    reachDisplay: true, targetHealth: true, pingFps: true,
    keystrokesBps: true, armorDurability: true, customTag: "[NMC-PRO]"
  };
});

ipcMain.handle('save-hud-config', async (event, cfg) => {
  try {
    fs.writeFileSync(hudConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

// Auto-sync bundled PvP Mod to .minecraft/mods
function injectBundledMod() {
  const bundled = path.join(__dirname, 'bundled_mods', 'NMCClientMod-1.21.1-1.0.0.jar');
  const dest = path.join(getModsDir(), 'NMCClientMod-1.21.1-1.0.0.jar');
  if (fs.existsSync(bundled) && !fs.existsSync(dest)) {
    fs.copyFileSync(bundled, dest);
  }
}

ipcMain.on('launch-game', async (event, { version }) => {
  const accountData = loadAccounts();
  const activeAcc = accountData.accounts.find(a => a.id === accountData.activeId);

  if (!activeAcc) {
    mainWindow.webContents.send('status-update', { message: 'Please select or buy an account first!', progress: 0 });
    return;
  }

  injectBundledMod();

  const auth = activeAcc.type === 'microsoft' && activeAcc.authData ? activeAcc.authData : Authenticator.getAuth(activeAcc.username);

  const opts = {
    clientPackage: null,
    authorization: auth,
    root: getMinecraftDir(),
    version: { number: version || "1.21.1", type: "release" },
    memory: { max: "6G", min: "2G" }
  };

  mainWindow.webContents.send('status-update', { message: \`Starting Minecraft 1.21.1 (\${activeAcc.username})...\`, progress: 20 });
  launcher.launch(opts);

  launcher.on('progress', e => {
    let pct = Math.round((e.task / e.total) * 100);
    mainWindow.webContents.send('status-update', { message: \`Downloading (\${e.type}): \${pct}%\`, progress: pct });
  });

  launcher.on('data', () => mainWindow.webContents.send('status-update', { message: 'NMCLUNCHER is Active & Running!', progress: 100 }));
  launcher.on('close', () => mainWindow.webContents.send('game-closed'));
});
`,

  'NMCLauncherApp/preload.js': `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  close: () => ipcRenderer.send('window-close'),
  minimize: () => ipcRenderer.send('window-minimize'),
  openExternal: (url) => ipcRenderer.send('open-external', url),

  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  setActiveAccount: (id) => ipcRenderer.invoke('set-active-account', id),
  createOfflineAccount: (name) => ipcRenderer.invoke('create-offline-account', name),
  loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  getStoreListings: () => ipcRenderer.invoke('get-store-listings'),
  processPurchase: (id) => ipcRenderer.invoke('process-account-purchase', id),

  searchModrinth: (data) => ipcRenderer.invoke('search-modrinth', data),
  installModrinth: (data) => ipcRenderer.invoke('install-modrinth', data),
  getLocalMods: () => ipcRenderer.invoke('get-local-mods'),
  toggleMod: (name) => ipcRenderer.invoke('toggle-mod', name),
  deleteMod: (name) => ipcRenderer.invoke('delete-mod', name),
  openModsFolder: () => ipcRenderer.send('open-mods-folder'),

  getHudConfig: () => ipcRenderer.invoke('get-hud-config'),
  saveHudConfig: (cfg) => ipcRenderer.invoke('save-hud-config', cfg),
  launch: (data) => ipcRenderer.send('launch-game', data),
  onStatus: (cb) => ipcRenderer.on('status-update', (e, v) => cb(v)),
  onClosed: (cb) => ipcRenderer.on('game-closed', () => cb()),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (e, v) => cb(v))
});
`,

  'NMCLauncherApp/src/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NMCLUNCHER</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="launcher-header">
    <div class="edition-title">
      <span class="bolt">⚡</span> NMCLUNCHER.EXE <span class="badge-edition">PvP & Marketplace</span>
    </div>
    <div class="window-controls">
      <button id="btn-min" class="win-btn">−</button>
      <button id="btn-close" class="win-btn">×</button>
    </div>
  </header>

  <nav class="nav-bar">
    <div class="nav-links">
      <button class="nav-tab active" data-tab="play">Play</button>
      <button class="nav-tab" data-tab="store">Account Store 🛒</button>
      <button class="nav-tab" data-tab="modrinth">Modrinth Store ⚡</button>
      <button class="nav-tab" data-tab="mods">Mods Manager</button>
      <button class="nav-tab" data-tab="hud">PvP HUD Editor 🎛️</button>
      <button class="nav-tab" data-tab="accounts">Accounts Manager 👤</button>
    </div>

    <div class="account-profile-nav" id="top-profile-card">
      <img id="nav-avatar" src="https://minotar.net/avatar/MHF_Steve/32" alt="Skin">
      <div class="account-meta">
        <span id="nav-player-name">គ្មានគណនី</span>
        <span id="nav-account-type" class="account-type-badge">None</span>
      </div>
    </div>
  </nav>

  <main class="viewport">
    <section id="tab-play" class="tab-content active">
      <div class="hero-artwork">
        <div class="nmc-brand-center">
          <h1 class="nmc-title">NMC<span>LAUNCHER</span></h1>
          <div class="nmc-sub">MINECRAFT 1.21.1 • COMBAT & REACH HUD ACTIVE</div>
        </div>
        <div class="promo-banner">
          <span>Official NMC Network & Automated KHQR Marketplace</span>
        </div>
      </div>

      <div class="launch-footer">
        <div class="version-selector-container">
          <div class="version-dropdown-box" id="dropdown-toggle">
            <div class="version-avatar-badge"><span class="pixel-face-icon">😵</span></div>
            <div class="version-meta">
              <span class="v-title" id="selected-title">Fabric 1.21.1</span>
              <span class="v-number" id="selected-ver">Custom Mods Active</span>
            </div>
            <span class="v-arrow">▼</span>
          </div>

          <div class="version-menu" id="version-menu">
            <div class="v-option selected" data-title="Fabric 1.21.1" data-desc="PvP Profile" data-ver="1.21.1">
              <div class="version-avatar-badge"><span class="pixel-face-icon">😵</span></div>
              <div class="v-option-text">
                <div class="v-opt-title">Fabric 1.21.1 <span class="tag-badge modded">Modded</span></div>
                <div class="v-opt-sub">PvP Profile</div>
              </div>
            </div>
            <div class="v-option" data-title="Latest release 1.21.1" data-desc="(Vanilla)" data-ver="1.21.1">
              <div class="version-avatar-badge"><span class="pixel-face-icon">😵</span></div>
              <div class="v-option-text">
                <div class="v-opt-title">Latest release 1.21.1</div>
                <div class="v-opt-sub">(Vanilla)</div>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-minecraft-play" id="btn-play">PLAY</button>
        <div class="account-tag"><span id="footer-username">Login Required</span></div>
      </div>
    </section>

    <section id="tab-store" class="tab-content">
      <div class="store-layout">
        <div class="store-header">
          <h2>🛒 In-Launcher Account Marketplace</h2>
          <p>ទិញគណនី Minecraft ស្របច្បាប់រួច Add ចូល Launcher លេងបានភ្លាមៗដោយស្វ័យប្រវត្តិ!</p>
        </div>
        <div class="account-store-grid" id="store-grid"></div>
      </div>
    </section>

    <section id="tab-modrinth" class="tab-content">
      <div class="store-layout">
        <div class="store-search-bar">
          <input type="text" id="modrinth-search" placeholder="Search Sodium, Iris, AppleSkin from Modrinth API...">
          <div class="type-toggles">
            <button class="type-btn active" data-type="mod">Mods (Fabric 1.21.1)</button>
            <button class="type-btn" data-type="resourcepack">Resource Packs</button>
          </div>
          <button id="btn-modrinth-query" class="btn-cyan">Search</button>
        </div>
        <div class="modrinth-grid" id="modrinth-grid"></div>
      </div>
    </section>

    <section id="tab-mods" class="tab-content">
      <div class="store-layout">
        <div class="mods-header-row">
          <h2>Installed Modifications (.minecraft/mods)</h2>
          <button id="btn-open-mods-folder" class="btn-secondary">📂 Open Mods Folder</button>
        </div>
        <div class="mods-table-wrapper">
          <table class="mods-table">
            <thead>
              <tr>
                <th style="width: 70px;">Status</th>
                <th>Mod Name</th>
                <th style="width: 120px;">Size</th>
                <th style="width: 100px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="local-mods-body"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section id="tab-hud" class="tab-content">
      <div class="store-layout">
        <div class="mods-header-row">
          <h2>🎛️ In-Game PvP Combat Modules Configurator</h2>
          <button id="btn-save-hud" class="btn-cyan">Save to Minecraft 💾</button>
        </div>
        <div class="hud-grid">
          <div class="hud-card">
            <span>[2.32 Blocks] Reach Display</span>
            <label class="switch"><input type="checkbox" id="cfg-reach"><span class="slider"></span></label>
          </div>
          <div class="hud-card">
            <span>Enemy Health & Hearts (10 ❤)</span>
            <label class="switch"><input type="checkbox" id="cfg-health"><span class="slider"></span></label>
          </div>
          <div class="hud-card">
            <span>[240 FPS] & [162 ms] Counter</span>
            <label class="switch"><input type="checkbox" id="cfg-fps"><span class="slider"></span></label>
          </div>
          <div class="hud-card">
            <span>Keystrokes & Speedometer (2.48 BPS)</span>
            <label class="switch"><input type="checkbox" id="cfg-keys"><span class="slider"></span></label>
          </div>
          <div class="hud-card">
            <span>Armor Durability Numbers (364, 529...)</span>
            <label class="switch"><input type="checkbox" id="cfg-armor"><span class="slider"></span></label>
          </div>
        </div>
      </div>
    </section>

    <section id="tab-accounts" class="tab-content">
      <div class="store-layout">
        <div class="mods-header-row">
          <h2>👤 Multi-Accounts Profile Switcher</h2>
          <div>
            <button id="btn-add-ms" class="btn-cyan">Login Microsoft ⚡</button>
            <button id="btn-add-offline" class="btn-secondary">+ Add Offline Account</button>
          </div>
        </div>
        <div class="accounts-grid" id="accounts-cards-grid"></div>
      </div>
    </section>
  </main>

  <div class="modal-backdrop" id="checkout-modal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>⚡ Scan to Purchase & Instant Auto-Import</h3>
        <button id="btn-close-checkout" class="btn-close-modal">×</button>
      </div>
      <div class="modal-body">
        <div class="checkout-qr-box">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=BAKONG_KHQR_NMC_MARKETPLACE" alt="QR Code">
        </div>
        <div class="checkout-details">
          <strong id="checkout-acc-name">ShadowSlayer_KH</strong>
          <span id="checkout-acc-price" class="price-cyan">50,000៛ / $12.50</span>
          <p>Scan with Bakong KHQR / ABA PayWay to verify and auto-import instantly.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button id="btn-simulate-paid" class="btn-cyan" style="width: 100%;">Verify & Auto-Inject Account ⚡</button>
      </div>
    </div>
  </div>

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

  'NMCLauncherApp/src/style.css': `@import url('https://fonts.cdnfonts.com/css/minecraft-4');

:root {
  --nmc-cyan: #0ea5e9;
  --nmc-glow: rgba(14, 165, 233, 0.45);
  --nmc-green: #2ebd59;
  --nmc-dark: #0c0f17;
  --nmc-panel: #111827;
  --nmc-card: #0f172a;
  --nmc-border: #1f2937;
  --anim-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; user-select: none; font-family: 'Segoe UI', Tahoma, sans-serif; }
body { background: var(--nmc-dark); color: #fff; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

.launcher-header { height: 34px; background: #090c12; display: flex; justify-content: space-between; align-items: center; padding: 0 14px; -webkit-app-region: drag; border-bottom: 1px solid var(--nmc-border); }
.edition-title { font-size: 11px; font-weight: 800; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
.edition-title .bolt { color: var(--nmc-cyan); }
.badge-edition { background: rgba(14, 165, 233, 0.15); color: var(--nmc-cyan); padding: 2px 6px; border-radius: 4px; font-size: 9px; }
.window-controls { -webkit-app-region: no-drag; }
.win-btn { background: none; border: none; color: #64748b; font-size: 16px; padding: 0 12px; height: 34px; cursor: pointer; }
.win-btn:hover { background: #1e293b; color: #fff; }
#btn-close:hover { background: #ef4444; color: #fff; }

.nav-bar { height: 48px; background: var(--nmc-panel); display: flex; justify-content: space-between; align-items: center; padding: 0 18px; border-bottom: 1px solid var(--nmc-border); }
.nav-links { display: flex; gap: 14px; }
.nav-tab { background: none; border: none; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; padding: 13px 4px; position: relative; }
.nav-tab.active { color: #fff; }
.nav-tab.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: var(--nmc-cyan); box-shadow: 0 0 10px var(--nmc-glow); }

.account-profile-nav { display: flex; align-items: center; gap: 10px; background: #090c12; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--nmc-border); cursor: pointer; }
.account-profile-nav img { width: 26px; height: 26px; border-radius: 4px; }
.account-meta { display: flex; flex-direction: column; }
#nav-player-name { font-size: 12px; font-weight: 700; color: #f1f5f9; }
.account-type-badge { font-size: 9px; text-transform: uppercase; color: var(--nmc-cyan); font-weight: 700; }

.viewport { flex: 1; position: relative; overflow: hidden; }
.tab-content { display: none; width: 100%; height: 100%; }
.tab-content.active { display: flex; flex-direction: column; animation: tabFade 0.3s var(--anim-smooth); }
@keyframes tabFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.hero-artwork { flex: 1; background: url('https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg') center/cover no-repeat; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 30px; }
.nmc-brand-center { margin-top: 25px; text-align: center; }
.nmc-title { font-family: 'Minecraft', sans-serif; font-size: 46px; letter-spacing: 3px; text-shadow: 0 0 20px var(--nmc-glow), 3px 3px 0 #000; }
.nmc-title span { display: block; font-size: 20px; color: var(--nmc-cyan); letter-spacing: 6px; }
.nmc-sub { font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 2px; margin-top: 6px; background: rgba(0, 0, 0, 0.6); padding: 4px 12px; border-radius: 20px; display: inline-block; }
.promo-banner { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); color: #38bdf8; padding: 8px 16px; border: 1px solid var(--nmc-cyan); border-radius: 4px; font-size: 12px; font-weight: 700; }

.launch-footer { height: 90px; background: #090c12; border-top: 2px solid var(--nmc-border); display: flex; align-items: center; justify-content: space-between; padding: 0 25px; }
.version-selector-container { position: relative; min-width: 250px; }
.version-dropdown-box { background: #121212; border: 2px solid #a855f7; padding: 8px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-radius: 4px; }
.version-avatar-badge { width: 30px; height: 30px; background: #facc15; border-radius: 50%; border: 2px solid #000; display: flex; align-items: center; justify-content: center; }
.pixel-face-icon { font-size: 16px; }
.v-title { font-size: 13px; font-weight: 800; }
.v-number { font-size: 11px; color: #38bdf8; }
.v-arrow { margin-left: auto; font-size: 10px; color: #64748b; }

.version-menu { display: none; position: absolute; bottom: 64px; left: 0; width: 100%; background: #141414; border: 1px solid #2b2b2b; box-shadow: 0 -10px 25px rgba(0,0,0,0.8); z-index: 50; }
.version-menu.show { display: flex; flex-direction: column; }
.v-option { padding: 10px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid #1a1a1a; }
.v-option:hover { background: #1f1f1f; }
.tag-badge.modded { background: rgba(14, 165, 233, 0.2); color: #38bdf8; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 700; }

.btn-minecraft-play { background: var(--nmc-green); border: none; border-bottom: 4px solid #1e823c; color: #fff; font-family: 'Minecraft', sans-serif; font-size: 24px; letter-spacing: 2px; padding: 12px 65px; cursor: pointer; text-shadow: 2px 2px 0 #1b6330; border-radius: 4px; }
.btn-minecraft-play:hover { filter: brightness(1.1); transform: translateY(-2px); }
.account-tag { font-size: 13px; font-weight: 700; color: #94a3b8; }

.store-layout { padding: 24px 30px; display: flex; flex-direction: column; gap: 16px; height: 100%; overflow-y: auto; }
.account-store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.acc-store-card { background: var(--nmc-card); border: 1px solid var(--nmc-border); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.acc-store-card:hover { border-color: var(--nmc-cyan); transform: translateY(-3px); }
.acc-card-top { display: flex; gap: 14px; align-items: center; }
.acc-card-top img { width: 50px; height: 50px; border-radius: 6px; background: #090c12; }
.rank-tag { font-size: 11px; color: #f59e0b; font-weight: 700; }
.acc-features { list-style: none; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px; }
.acc-features li::before { content: "✓ "; color: var(--nmc-green); }
.acc-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--nmc-border); }
.price-cyan { font-size: 15px; font-weight: 800; color: #38bdf8; }

.btn-cyan { background: var(--nmc-cyan); border: none; color: #fff; font-weight: 700; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-cyan:hover { filter: brightness(1.15); }
.btn-secondary { background: #1e293b; border: 1px solid var(--nmc-border); color: #fff; font-weight: 600; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

.mods-header-row { display: flex; justify-content: space-between; align-items: center; }
.mods-table-wrapper { flex: 1; background: #090c12; border: 1px solid var(--nmc-border); border-radius: 8px; overflow-y: auto; }
.mods-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mods-table th { background: #0f172a; padding: 12px 16px; text-align: left; color: #94a3b8; border-bottom: 1px solid var(--nmc-border); }
.mods-table td { padding: 12px 16px; border-bottom: 1px solid #131b2c; }

.hud-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.hud-card { background: var(--nmc-card); border: 1px solid var(--nmc-border); padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }

.switch { position: relative; display: inline-block; width: 38px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: 0.25s; border-radius: 20px; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: 0.25s; border-radius: 50%; }
input:checked + .slider { background-color: var(--nmc-green); }
input:checked + .slider:before { transform: translateX(16px); }

.modal-backdrop { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px); z-index: 100; align-items: center; justify-content: center; }
.modal-backdrop.show { display: flex; }
.modal-card { width: 440px; background: var(--nmc-card); border: 1px solid var(--nmc-border); border-radius: 8px; overflow: hidden; }
.modal-header { padding: 14px 18px; background: #1e293b; display: flex; justify-content: space-between; align-items: center; }
.btn-close-modal { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; }
.checkout-qr-box { background: #fff; padding: 10px; border-radius: 8px; }
.modal-footer { padding: 12px 18px; background: #090c12; }

.status-overlay { display: none; position: absolute; bottom: 90px; left: 0; width: 100%; background: rgba(9, 12, 18, 0.95); backdrop-filter: blur(8px); padding: 12px 25px; z-index: 20; }
.status-overlay.show { display: block; }
.progress-bar-bg { height: 6px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-top: 6px; }
.progress-bar-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #0ea5e9, #2ebd59); transition: width 0.3s; }
`,

  'NMCLauncherApp/src/renderer.js': `document.getElementById('btn-min').addEventListener('click', () => window.api.minimize());
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

    if (tab.getAttribute('data-tab') === 'store') renderStoreListings();
    if (tab.getAttribute('data-tab') === 'accounts') renderAccountsList();
    if (tab.getAttribute('data-tab') === 'mods') renderLocalMods();
    if (tab.getAttribute('data-tab') === 'hud') renderHudConfig();
  });
});

// Accounts & Store
const navPlayerName = document.getElementById('nav-player-name');
const navAccountType = document.getElementById('nav-account-type');
const navAvatar = document.getElementById('nav-avatar');
const footerUsername = document.getElementById('footer-username');
const storeGrid = document.getElementById('store-grid');
const checkoutModal = document.getElementById('checkout-modal');
const btnCloseCheckout = document.getElementById('btn-close-checkout');
const btnSimulatePaid = document.getElementById('btn-simulate-paid');
let activeCheckoutId = null;

async function syncProfile() {
  const data = await window.api.getAccounts();
  const active = data.accounts.find(a => a.id === data.activeId);
  if (active) {
    navPlayerName.innerText = active.username;
    navAccountType.innerText = active.type.toUpperCase();
    navAvatar.src = active.skin;
    footerUsername.innerText = \`Playing as: \${active.username}\`;
  } else {
    navPlayerName.innerText = "No Account";
    navAccountType.innerText = "None";
    footerUsername.innerText = "Please select account";
  }
}

async function renderStoreListings() {
  const items = await window.api.getStoreListings();
  storeGrid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'acc-store-card';
    card.innerHTML = \`
      <div class="acc-card-top">
        <img src="\${item.avatar}" alt="Avatar">
        <div class="acc-card-info">
          <strong>\${item.displayName}</strong>
          <span class="rank-tag">\${item.rank}</span>
        </div>
      </div>
      <ul class="acc-features">
        \${item.features.map(f => \`<li>\${f}</li>\`).join('')}
      </ul>
      <div class="acc-price-row">
        <span class="price-cyan">\${item.priceKhr} (\${item.priceUsd}$)</span>
        <button class="btn-cyan btn-buy" data-id="\${item.id}" data-name="\${item.displayName}" data-price="\${item.priceKhr}">BUY NOW ⚡</button>
      </div>
    \`;
    storeGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-buy').forEach(b => {
    b.addEventListener('click', e => {
      activeCheckoutId = e.target.getAttribute('data-id');
      document.getElementById('checkout-acc-name').innerText = e.target.getAttribute('data-name');
      document.getElementById('checkout-acc-price').innerText = e.target.getAttribute('data-price');
      checkoutModal.classList.add('show');
    });
  });
}

btnCloseCheckout.addEventListener('click', () => checkoutModal.classList.remove('show'));

btnSimulatePaid.addEventListener('click', async () => {
  if (!activeCheckoutId) return;
  btnSimulatePaid.disabled = true;
  btnSimulatePaid.innerText = "Verifying KHQR Payment...";
  const res = await window.api.processPurchase(activeCheckoutId);
  if (res.success) {
    checkoutModal.classList.remove('show');
    btnSimulatePaid.disabled = false;
    btnSimulatePaid.innerText = "Verify & Auto-Inject Account ⚡";
    alert(\`✓ Payment Successful! Account [\${res.account.username}] has been automatically injected into your Launcher.\`);
    syncProfile();
  }
});

// Accounts Manager Tab
const accountsCardsGrid = document.getElementById('accounts-cards-grid');
async function renderAccountsList() {
  const data = await window.api.getAccounts();
  accountsCardsGrid.innerHTML = '';
  data.accounts.forEach(acc => {
    const isAct = acc.id === data.activeId;
    const card = document.createElement('div');
    card.className = 'acc-store-card';
    card.innerHTML = \`
      <div class="acc-card-top">
        <img src="\${acc.skin}" alt="Avatar">
        <div>
          <strong>\${acc.username}</strong>
          <span class="rank-tag">\${acc.type.toUpperCase()}</span>
        </div>
      </div>
      <div class="acc-price-row">
        \${!isAct ? \`<button class="btn-cyan btn-sel" data-id="\${acc.id}">Select Profile</button>\` : '<span style="color:#2ebd59; font-weight:bold;">● Active</span>'}
        <button class="btn-secondary btn-del" data-id="\${acc.id}">🗑️</button>
      </div>
    \`;
    accountsCardsGrid.appendChild(card);
  });

  document.querySelectorAll('.btn-sel').forEach(b => b.addEventListener('click', async e => {
    await window.api.setActiveAccount(e.target.getAttribute('data-id'));
    syncProfile();
    renderAccountsList();
  }));

  document.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async e => {
    await window.api.deleteAccount(e.target.getAttribute('data-id'));
    syncProfile();
    renderAccountsList();
  }));
}

document.getElementById('btn-add-ms').addEventListener('click', async () => {
  const res = await window.api.loginMicrosoft();
  if (res.success) { syncProfile(); renderAccountsList(); }
});

document.getElementById('btn-add-offline').addEventListener('click', async () => {
  const name = prompt("Enter custom username (3-16 chars):");
  if (name) {
    const res = await window.api.createOfflineAccount(name);
    if (res.success) { syncProfile(); renderAccountsList(); }
  }
});

// Local Mods Tab
async function renderLocalMods() {
  const body = document.getElementById('local-mods-body');
  body.innerHTML = '<tr><td colspan="4">Scanning mods...</td></tr>';
  const mods = await window.api.getLocalMods();
  body.innerHTML = '';
  mods.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>
        <label class="switch">
          <input type="checkbox" class="mod-tog" data-fn="\${m.filename}" \${m.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
      <td><strong>\${m.name}</strong></td>
      <td>\${m.sizeMb} MB</td>
      <td style="text-align: center;"><button class="btn-secondary btn-del-mod" data-fn="\${m.filename}">Delete</button></td>
    \`;
    body.appendChild(tr);
  });

  document.querySelectorAll('.mod-tog').forEach(b => b.addEventListener('change', async e => {
    await window.api.toggleMod(e.target.getAttribute('data-fn'));
    renderLocalMods();
  }));

  document.querySelectorAll('.btn-del-mod').forEach(b => b.addEventListener('click', async e => {
    await window.api.deleteMod(e.target.getAttribute('data-fn'));
    renderLocalMods();
  }));
}

document.getElementById('btn-open-mods-folder').addEventListener('click', () => window.api.openModsFolder());

// PvP HUD Tab
async function renderHudConfig() {
  const cfg = await window.api.getHudConfig();
  document.getElementById('cfg-reach').checked = !!cfg.reachDisplay;
  document.getElementById('cfg-health').checked = !!cfg.targetHealth;
  document.getElementById('cfg-fps').checked = !!cfg.pingFps;
  document.getElementById('cfg-keys').checked = !!cfg.keystrokesBps;
  document.getElementById('cfg-armor').checked = !!cfg.armorDurability;
}

document.getElementById('btn-save-hud').addEventListener('click', async () => {
  const payload = {
    reachDisplay: document.getElementById('cfg-reach').checked,
    targetHealth: document.getElementById('cfg-health').checked,
    pingFps: document.getElementById('cfg-fps').checked,
    keystrokesBps: document.getElementById('cfg-keys').checked,
    armorDurability: document.getElementById('cfg-armor').checked
  };
  await window.api.saveHudConfig(payload);
  alert("✓ Settings saved and synced to Minecraft!");
});

// Play Launcher
const btnPlay = document.getElementById('btn-play');
const statusOverlay = document.getElementById('status-overlay');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');

btnPlay.addEventListener('click', () => {
  btnPlay.disabled = true;
  statusOverlay.classList.add('show');
  statusText.innerText = "NMCLUNCHER: Booting Minecraft 1.21.1...";
  window.api.launch({ version: "1.21.1" });
});

window.api.onStatus(data => {
  statusText.innerText = data.message;
  progressFill.style.width = \`\${data.progress}%\`;
});

window.api.onClosed(() => {
  btnPlay.disabled = false;
  statusOverlay.classList.remove('show');
  progressFill.style.width = "0%";
});

// Dropdown Version Toggle
const dropdownToggle = document.getElementById('dropdown-toggle');
const versionMenu = document.getElementById('version-menu');
dropdownToggle.addEventListener('click', () => versionMenu.classList.toggle('show'));

syncProfile();
`
};

// Generate everything
console.log("Creating complete unified NMCLUNCHER infrastructure...");
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`[Created] ${relPath}`);
});

console.log("\n=======================================================");
console.log("PROJECT CREATED! Run `build_nmc_client.bat` to build all.");
console.log("=======================================================");
