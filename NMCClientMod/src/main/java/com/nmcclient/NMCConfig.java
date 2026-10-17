package com.nmcclient;

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
    public static boolean coords = true;
    public static boolean crosshairCps = true;
    public static String customTag = "[NMC-PRO]";
    public static int tagColor = 0x00F3FF;
    public static int accentColor = 0x00F3FF;

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
                if (obj.has("coords")) coords = obj.get("coords").getAsBoolean();
                if (obj.has("crosshairCps")) crosshairCps = obj.get("crosshairCps").getAsBoolean();
                if (obj.has("customTag")) customTag = obj.get("customTag").getAsString();
                if (obj.has("tagColor")) tagColor = Integer.parseInt(obj.get("tagColor").getAsString().replace("#", ""), 16);
                if (obj.has("accentColor")) accentColor = Integer.parseInt(obj.get("accentColor").getAsString().replace("#", ""), 16);
            }
        } catch (Exception ignored) {}
    }
}
