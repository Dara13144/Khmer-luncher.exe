package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;

import java.util.Locale;

public class KeystrokesOverlay {

    private static final int BG_COLOR = 0x80000000;
    private static final int TEXT_COLOR = 0xFFFFFFFF;
    private static final int PRESSED_TEXT = 0xFF000000;

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().keystrokesBps) return;
        if (client.options.hudHidden || client.player == null) return;

        int startX = 10;
        int startY = 10;
        int keySize = 22;
        int gap = 2;

        int accentColor = NMCModulesConfig.get().parseAccentColor(0x00F0FF);
        int pressedBg = (0x90 << 24) | (accentColor & 0x00FFFFFF);

        // Row 1: [W]
        boolean wPressed = client.options.forwardKey.isPressed();
        drawKeyBox(context, client, startX + keySize + gap, startY, keySize, keySize, "W", wPressed, pressedBg);

        // Row 2: [A] [S] [D]
        int row2Y = startY + keySize + gap;
        boolean aPressed = client.options.leftKey.isPressed();
        boolean sPressed = client.options.backKey.isPressed();
        boolean dPressed = client.options.rightKey.isPressed();

        drawKeyBox(context, client, startX, row2Y, keySize, keySize, "A", aPressed, pressedBg);
        drawKeyBox(context, client, startX + keySize + gap, row2Y, keySize, keySize, "S", sPressed, pressedBg);
        drawKeyBox(context, client, startX + (keySize + gap) * 2, row2Y, keySize, keySize, "D", dPressed, pressedBg);

        // Row 3: [LMB] [RMB] (with CPS)
        int row3Y = row2Y + keySize + gap;
        int mouseKeyWidth = (keySize * 3 + gap * 2 - gap) / 2;
        boolean lmbPressed = client.options.attackKey.isPressed();
        boolean rmbPressed = client.options.useKey.isPressed();

        String lmbText = "LMB " + CpsTracker.getLeftCps();
        String rmbText = "RMB " + CpsTracker.getRightCps();

        drawKeyBox(context, client, startX, row3Y, mouseKeyWidth, keySize, lmbText, lmbPressed, pressedBg);
        drawKeyBox(context, client, startX + mouseKeyWidth + gap, row3Y, mouseKeyWidth, keySize, rmbText, rmbPressed, pressedBg);

        // Row 4: [SPACE]
        int row4Y = row3Y + keySize + gap;
        int totalWidth = keySize * 3 + gap * 2;
        int spaceHeight = 12;
        boolean spacePressed = client.options.jumpKey.isPressed();

        drawKeyBox(context, client, startX, row4Y, totalWidth, spaceHeight, "—", spacePressed, pressedBg);

        // Row 5: Speedometer (BPS)
        int row5Y = row4Y + spaceHeight + gap;
        double dx = client.player.getX() - client.player.prevX;
        double dz = client.player.getZ() - client.player.prevZ;
        double bps = Math.sqrt(dx * dx + dz * dz) * 20.0;
        String bpsText = String.format(Locale.US, "%.2f BPS", bps);

        context.fill(startX, row5Y, startX + totalWidth, row5Y + 14, BG_COLOR);
        int textWidth = client.textRenderer.getWidth(bpsText);
        context.drawText(client.textRenderer, bpsText, startX + (totalWidth - textWidth) / 2, row5Y + 3, accentColor, true);
    }

    private static void drawKeyBox(DrawContext context, MinecraftClient client, int x, int y, int width, int height, String label, boolean pressed, int pressedBg) {
        int bg = pressed ? pressedBg : BG_COLOR;
        int textCol = pressed ? PRESSED_TEXT : TEXT_COLOR;

        context.fill(x, y, x + width, y + height, bg);

        int textWidth = client.textRenderer.getWidth(label);
        int textX = x + (width - textWidth) / 2;
        int textY = y + (height - 8) / 2;

        context.drawText(client.textRenderer, label, textX, textY, textCol, !pressed);
    }
}
