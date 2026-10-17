package com.khmerlauncher.pvp;

import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.RenderTickCounter;

public class KhmerTournamentHudRenderer implements HudRenderCallback {

    @Override
    public void onHudRender(DrawContext context, RenderTickCounter tickCounter) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null || client.options.hudHidden) return;

        HudConfig config = HudConfig.getInstance(); // Reads khmer_tournament_hud.json
        int screenW = client.getWindow().getScaledWidth();
        int screenH = client.getWindow().getScaledHeight();

        // 1. Render Ping & FPS Counter
        if (config.modules.containsKey("pingFps") && config.modules.get("pingFps").enabled) {
            int x = (int) ((config.modules.get("pingFps").x / 100.0) * screenW);
            int y = (int) ((config.modules.get("pingFps").y / 100.0) * screenH);
            int fps = client.getCurrentFps();
            context.drawText(client.textRenderer, fps + " FPS | 38 ms", x, y, 0x00F5FF, true);
        }

        // 2. Render Reach Display
        if (config.modules.containsKey("reachDisplay") && config.modules.get("reachDisplay").enabled) {
            int x = (int) ((config.modules.get("reachDisplay").x / 100.0) * screenW);
            int y = (int) ((config.modules.get("reachDisplay").y / 100.0) * screenH);
            context.drawText(client.textRenderer, "[2.87 Blocks]", x, y, 0x00F5FF, true);
        }

        // 3. Render Crosshair CPS
        if (config.modules.containsKey("crosshairCps") && config.modules.get("crosshairCps").enabled) {
            int x = (int) ((config.modules.get("crosshairCps").x / 100.0) * screenW);
            int y = (int) ((config.modules.get("crosshairCps").y / 100.0) * screenH);
            context.drawText(client.textRenderer, "12 | 8 CPS", x, y, 0x00F5FF, true);
        }
    }
}
