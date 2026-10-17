package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.util.math.Direction;

import java.util.Locale;

public class CoordinatesOverlay {

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().coordinates) return;
        if (client.player == null || client.options.hudHidden) return;

        int x = (int) Math.floor(client.player.getX());
        int y = (int) Math.floor(client.player.getY());
        int z = (int) Math.floor(client.player.getZ());

        Direction facing = client.player.getHorizontalFacing();
        String dir = facing.asString().substring(0, 1).toUpperCase(Locale.ROOT);

        String coordText = String.format(Locale.US, "(%d, %d, %d) %s", x, y, z, dir);

        int screenHeight = client.getWindow().getScaledHeight();
        int posX = 10;
        int posY = screenHeight - 20;

        int textWidth = client.textRenderer.getWidth(coordText);
        context.fill(posX - 2, posY - 2, posX + textWidth + 6, posY + 11, 0x80000000);

        int accentColor = NMCModulesConfig.get().parseAccentColor(0x00F0FF);
        context.drawText(client.textRenderer, coordText, posX + 2, posY, accentColor, true);
    }
}
