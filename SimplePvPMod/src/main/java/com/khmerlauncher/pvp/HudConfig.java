package com.khmerlauncher.pvp;

import com.google.gson.Gson;
import net.minecraft.client.MinecraftClient;

import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

public class HudConfig {
    private static HudConfig INSTANCE = new HudConfig();
    private static long lastCheck = 0;

    public String accentColor = "#10B981";
    public String playerTag = "NMC";
    public String tagColor = "#008080";

    public static class ModuleEntry {
        public boolean enabled = true;
        public double x = 50.0;
        public double y = 50.0;
        public double scale = 1.0;

        public ModuleEntry() {}
        public ModuleEntry(boolean enabled, double x, double y) {
            this.enabled = enabled;
            this.x = x;
            this.y = y;
        }
    }

    public Map<String, ModuleEntry> modules = new HashMap<>();

    public HudConfig() {
        modules.put("reachDisplay", new ModuleEntry(true, 50, 78));
        modules.put("targetHealth", new ModuleEntry(true, 50, 16));
        modules.put("pingFps", new ModuleEntry(true, 86, 4));
        modules.put("keystrokes", new ModuleEntry(true, 6, 64));
        modules.put("armorDurability", new ModuleEntry(true, 88, 68));
        modules.put("coordinates", new ModuleEntry(false, 4, 4));
        modules.put("crosshairCps", new ModuleEntry(true, 49, 50));
    }

    public static HudConfig getInstance() {
        long now = System.currentTimeMillis();
        if (now - lastCheck > 1000) {
            lastCheck = now;
            reload();
        }
        return INSTANCE;
    }

    private static void reload() {
        try {
            MinecraftClient client = MinecraftClient.getInstance();
            File runDir = client.runDirectory != null ? client.runDirectory : new File(".");
            File file = new File(new File(runDir, "config"), "khmer_tournament_hud.json");
            if (!file.exists()) {
                file = new File(new File(runDir, "config"), "khmer_pvp_hud.json");
            }
            if (file.exists()) {
                try (FileReader reader = new FileReader(file)) {
                    HudConfig loaded = new Gson().fromJson(reader, HudConfig.class);
                    if (loaded != null && loaded.modules != null) {
                        INSTANCE = loaded;
                    }
                }
            }
        } catch (Exception ignored) {}
    }
}
