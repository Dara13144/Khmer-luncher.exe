package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;

import java.util.Locale;

public class OpponentHealthTracker {
    private static LivingEntity lastTarget = null;
    private static long lastTargetTime = 0;
    private static final long DISPLAY_DURATION = 3500; // 3.5 seconds

    public static void recordTarget(Entity entity) {
        if (entity instanceof LivingEntity living) {
            lastTarget = living;
            lastTargetTime = System.currentTimeMillis();
        }
    }

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().targetHealth) return;

        LivingEntity current = null;
        if (client.targetedEntity instanceof LivingEntity living) {
            current = living;
            lastTarget = living;
            lastTargetTime = System.currentTimeMillis();
        } else if (System.currentTimeMillis() - lastTargetTime < DISPLAY_DURATION) {
            current = lastTarget;
        }

        if (current == null || !current.isAlive()) return;

        int screenWidth = client.getWindow().getScaledWidth();
        int width = 120;
        int height = 28;
        int x = (screenWidth - width) / 2;
        int y = 20;

        float health = current.getHealth();
        float maxHealth = current.getMaxHealth();
        if (maxHealth <= 0.0f) maxHealth = 20.0f;
        float ratio = Math.max(0.0f, Math.min(1.0f, health / maxHealth));

        // Background box
        context.fill(x, y, x + width, y + height, 0x90000000);

        // Header: Entity Name + Hearts
        String name = current.getName().getString();
        if (name.length() > 14) name = name.substring(0, 12) + "..";
        int hearts = (int) Math.ceil(health / 2.0f);
        String heartText = String.format(Locale.US, "%d ❤", hearts);

        context.drawText(client.textRenderer, name, x + 6, y + 4, 0xFFFFFFFF, true);
        int heartWidth = client.textRenderer.getWidth(heartText);
        context.drawText(client.textRenderer, heartText, x + width - heartWidth - 6, y + 4, 0xFFFF4B4B, true);

        // Health bar
        int barX = x + 6;
        int barY = y + 16;
        int barWidth = width - 12;
        int barHeight = 6;

        context.fill(barX, barY, barX + barWidth, barY + barHeight, 0xFF333333);
        int fillWidth = (int) (barWidth * ratio);
        int barColor = ratio > 0.5f ? 0xFF22C55E : (ratio > 0.25f ? 0xFFEAB308 : 0xFFEF4444);
        context.fill(barX, barY, barX + fillWidth, barY + barHeight, barColor);
    }
}
