package com.simplepvp.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;

public class CrosshairCpsOverlay {

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().crosshairCps) return;
        if (client.options.hudHidden) return;

        int leftCps = CpsTracker.getLeftCps();
        int rightCps = CpsTracker.getRightCps();
        if (leftCps == 0 && rightCps == 0) return;

        int screenWidth = client.getWindow().getScaledWidth();
        int screenHeight = client.getWindow().getScaledHeight();

        String cpsText = leftCps + " | " + rightCps + " CPS";
        int textWidth = client.textRenderer.getWidth(cpsText);

        int x = (screenWidth - textWidth) / 2;
        int y = screenHeight / 2 - 16;

        context.fill(x - 3, y - 2, x + textWidth + 3, y + 9, 0x60000000);
        context.drawText(client.textRenderer, cpsText, x, y, 0xFFFFFFFF, true);
    }
}
