package com.simplepvp.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.PlayerListEntry;

public class PingFpsOverlay {

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().pingFps) return;
        if (client.player == null) return;

        int screenWidth = client.getWindow().getScaledWidth();

        int fps = client.getCurrentFps();
        int ping = 0;
        if (client.getNetworkHandler() != null) {
            PlayerListEntry entry = client.getNetworkHandler().getPlayerListEntry(client.player.getUuid());
            if (entry != null) {
                ping = entry.getLatency();
            }
        }

        String fpsStr = fps + " FPS";
        String pingStr = ping + " ms";

        int accentColor = NMCModulesConfig.get().parseAccentColor(0x00F0FF);
        int fpsWidth = client.textRenderer.getWidth(fpsStr);
        int pingWidth = client.textRenderer.getWidth(pingStr);

        int totalWidth = fpsWidth + pingWidth + 24;
        int x = screenWidth - totalWidth - 10;
        int y = 10;
        int height = 18;

        // Draw translucent dark background box
        context.fill(x, y, x + totalWidth, y + height, 0x80000000);

        // Draw FPS Pill
        context.drawText(client.textRenderer, fpsStr, x + 6, y + 5, accentColor, true);

        // Separator
        context.fill(x + fpsWidth + 12, y + 4, x + fpsWidth + 13, y + height - 4, 0x60FFFFFF);

        // Draw Ping Pill
        int pingColor = ping <= 80 ? 0xFF22C55E : (ping <= 160 ? 0xFFEAB308 : 0xFFEF4444);
        context.drawText(client.textRenderer, pingStr, x + fpsWidth + 18, y + 5, pingColor, true);
    }
}
