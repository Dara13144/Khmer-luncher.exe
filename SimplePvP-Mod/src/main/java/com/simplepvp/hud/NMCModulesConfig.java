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
