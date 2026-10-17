package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;

public class PvPHudRenderer {

    public static void render(DrawContext context, MinecraftClient client) {
        if (client.player == null || client.options.hudHidden) return;

        // 1. Keystrokes & Speedometer (BPS)
        KeystrokesOverlay.render(context, client);

        // 2. Armor & Weapon Status with Numerical Durability
        ArmorStatusOverlay.render(context, client);

        // 3. Real-time Ping Latency & FPS Counter
        PingFpsOverlay.render(context, client);

        // 4. Coordinates & Compass Direction HUD
        CoordinatesOverlay.render(context, client);

        // 5. Reach Distance on Hit with Fade-Out Animation
        ReachTracker.render(context, client);

        // 6. Target / Opponent Health Indicator & HP Bar
        OpponentHealthTracker.render(context, client);

        // 7. Crosshair CPS Combat Analytics
        CrosshairCpsOverlay.render(context, client);
    }
}
