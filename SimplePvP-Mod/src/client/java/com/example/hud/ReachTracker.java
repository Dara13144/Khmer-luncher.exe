package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;

import java.util.Locale;

public class ReachTracker {
    private static double lastReach = 0.0;
    private static long lastHitTime = 0;
    private static final long FADE_DURATION = 2000; // 2 seconds fade out

    public static void recordHit(double distance) {
        lastReach = distance;
        lastHitTime = System.currentTimeMillis();
    }

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().reachDisplay) return;
        long elapsed = System.currentTimeMillis() - lastHitTime;
        if (elapsed > FADE_DURATION || lastReach <= 0.0) return;

        float alphaRatio = 1.0f - ((float) elapsed / (float) FADE_DURATION);
        int alpha = Math.max(10, Math.min(255, (int) (alphaRatio * 255.0f)));

        int screenWidth = client.getWindow().getScaledWidth();
        int screenHeight = client.getWindow().getScaledHeight();

        // Render slightly below crosshair (or center screen)
        int x = screenWidth / 2;
        int y = screenHeight / 2 + 18;

        String reachText = String.format(Locale.US, "%.2f Blocks", lastReach);
        int textWidth = client.textRenderer.getWidth(reachText);

        int bgColor = (alpha / 2 << 24) | 0x000000;
        int textColor = (alpha << 24) | (NMCModulesConfig.get().parseAccentColor(0x00F0FF) & 0x00FFFFFF);

        context.fill(x - textWidth / 2 - 4, y - 2, x + textWidth / 2 + 4, y + 10, bgColor);
        context.drawText(client.textRenderer, reachText, x - textWidth / 2, y, textColor, true);
    }
}
