package com.simplepvp.hud;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.minecraft.client.MinecraftClient;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;

public class NMCModulesConfig {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static NMCModulesConfig INSTANCE = new NMCModulesConfig();
    private static long lastCheckTime = 0;
    private static long lastModified = 0;

    public boolean reachDisplay = true;
    public boolean targetHealth = true;
    public boolean pingFps = true;
    public boolean keystrokesBps = true;
    public boolean armorDurability = true;
    public boolean armorDurabilityNumbers = true;
    public boolean coordinates = true;
    public boolean crosshairCps = true;
    public String customTag = "[NMC-PRO]";
    public String tagColor = "#00e5ff";
    public String accentColor = "#00f0ff";

    public static class HudElement {
        public boolean enabled = true;
        public double x = 50.0;
        public double y = 50.0;
        public double scale = 1.0;

        public HudElement() {}
        public HudElement(boolean enabled, double x, double y, double scale) {
            this.enabled = enabled;
            this.x = x;
            this.y = y;
            this.scale = scale;
        }
    }

    public static class ModulesHolder {
        public Boolean reachDisplay;
        public Boolean targetHealth;
        public Boolean pingFps;
        public Boolean keystrokes;
        public Boolean keystrokesBps;
        public Boolean armorDurability;
        public Boolean coordinates;
        public Boolean crosshairCps;
    }
    public ModulesHolder modules;
    public String playerTag;
    public java.util.Map<String, HudElement> elements = new java.util.HashMap<>();

    public void save() {
        try {
            MinecraftClient client = MinecraftClient.getInstance();
            File runDir = client.runDirectory != null ? client.runDirectory : new File(".");
            File cfgDir = new File(runDir, "config");
            if (!cfgDir.exists()) cfgDir.mkdirs();

            File tournamentFile = new File(cfgDir, "khmer_tournament_hud.json");
            try (FileWriter writer = new FileWriter(tournamentFile)) {
                GSON.toJson(this, writer);
            }
            File khmerFile = new File(cfgDir, "khmer_pvp_hud.json");
            try (FileWriter writer = new FileWriter(khmerFile)) {
                GSON.toJson(this, writer);
            }
            lastModified = tournamentFile.lastModified();
        } catch (Exception ignored) {
        }
    }

    public int getElementPixelX(String id, int defaultPixel, int screenWidth) {
        if (elements != null && elements.containsKey(id)) {
            HudElement el = elements.get(id);
            return (int) Math.round((el.x / 100.0) * screenWidth);
        }
        return defaultPixel;
    }

    public int getElementPixelY(String id, int defaultPixel, int screenHeight) {
        if (elements != null && elements.containsKey(id)) {
            HudElement el = elements.get(id);
            return (int) Math.round((el.y / 100.0) * screenHeight);
        }
        return defaultPixel;
    }

    public static NMCModulesConfig get() {
        long now = System.currentTimeMillis();
        if (now - lastCheckTime > 1000) {
            lastCheckTime = now;
            checkReload();
        }
        return INSTANCE;
    }

    private static File getConfigFile() {
        MinecraftClient client = MinecraftClient.getInstance();
        File runDir = client.runDirectory != null ? client.runDirectory : new File(".");
        File tournamentFile = new File(new File(runDir, "config"), "khmer_tournament_hud.json");
        if (tournamentFile.exists()) {
            return tournamentFile;
        }
        File khmerFile = new File(new File(runDir, "config"), "khmer_pvp_hud.json");
        if (khmerFile.exists()) {
            return khmerFile;
        }
        File standardFile = new File(new File(runDir, "config"), "pvphud.json");
        if (standardFile.exists()) {
            return standardFile;
        }
        return new File(runDir, "nmc_pvp_modules.json");
    }

    public static void checkReload() {
        try {
            File file = getConfigFile();
            if (!file.exists()) {
                saveDefaults(file);
                return;
            }
            long modified = file.lastModified();
            if (modified != lastModified) {
                lastModified = modified;
                try (FileReader reader = new FileReader(file)) {
                    NMCModulesConfig loaded = GSON.fromJson(reader, NMCModulesConfig.class);
                    if (loaded != null) {
                        if (loaded.modules != null) {
                            if (loaded.modules.reachDisplay != null) loaded.reachDisplay = loaded.modules.reachDisplay;
                            if (loaded.modules.targetHealth != null) loaded.targetHealth = loaded.modules.targetHealth;
                            if (loaded.modules.pingFps != null) loaded.pingFps = loaded.modules.pingFps;
                            if (loaded.modules.keystrokes != null) loaded.keystrokesBps = loaded.modules.keystrokes;
                            if (loaded.modules.keystrokesBps != null) loaded.keystrokesBps = loaded.modules.keystrokesBps;
                            if (loaded.modules.armorDurability != null) loaded.armorDurability = loaded.modules.armorDurability;
                            if (loaded.modules.coordinates != null) loaded.coordinates = loaded.modules.coordinates;
                            if (loaded.modules.crosshairCps != null) loaded.crosshairCps = loaded.modules.crosshairCps;
                        }
                        if (loaded.elements != null && !loaded.elements.isEmpty()) {
                            if (loaded.elements.containsKey("reachDisplay")) loaded.reachDisplay = loaded.elements.get("reachDisplay").enabled;
                            if (loaded.elements.containsKey("targetHealth")) loaded.targetHealth = loaded.elements.get("targetHealth").enabled;
                            if (loaded.elements.containsKey("pingFps")) loaded.pingFps = loaded.elements.get("pingFps").enabled;
                            if (loaded.elements.containsKey("keystrokes")) loaded.keystrokesBps = loaded.elements.get("keystrokes").enabled;
                            if (loaded.elements.containsKey("armorDurability")) loaded.armorDurability = loaded.elements.get("armorDurability").enabled;
                            if (loaded.elements.containsKey("coordinates")) loaded.coordinates = loaded.elements.get("coordinates").enabled;
                            if (loaded.elements.containsKey("crosshairCps")) loaded.crosshairCps = loaded.elements.get("crosshairCps").enabled;
                        }
                        if (loaded.playerTag != null && !loaded.playerTag.isEmpty()) {
                            loaded.customTag = loaded.playerTag;
                        }
                        INSTANCE = loaded;
                    }
                }
            }
        } catch (Exception e) {
            // Keep default config if reading fails
        }
    }

    private static void saveDefaults(File file) {
        try {
            try (FileWriter writer = new FileWriter(file)) {
                GSON.toJson(INSTANCE, writer);
            }
            lastModified = file.lastModified();
        } catch (Exception ignored) {
        }
    }

    public int parseAccentColor(int defaultColor) {
        if (accentColor == null || accentColor.isEmpty()) return defaultColor;
        try {
            String hex = accentColor.replace("#", "");
            if (hex.length() == 6) {
                return 0xFF000000 | Integer.parseInt(hex, 16);
            } else if (hex.length() == 8) {
                return (int) Long.parseLong(hex, 16);
            }
        } catch (Exception ignored) {
        }
        return defaultColor;
    }
}
