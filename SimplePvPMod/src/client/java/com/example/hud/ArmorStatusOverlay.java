package com.example.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.item.ItemStack;

import java.util.ArrayList;
import java.util.List;

public class ArmorStatusOverlay {

    public static void render(DrawContext context, MinecraftClient client) {
        if (!NMCModulesConfig.get().armorDurability && !NMCModulesConfig.get().armorDurabilityNumbers) return;
        if (client.player == null || client.options.hudHidden) return;

        int startX = 10;
        int startY = 135; // Positioned below Keystrokes + BPS

        List<ItemStack> itemsToRender = new ArrayList<>();

        // Helmet (3) to Boots (0)
        for (int i = 3; i >= 0; i--) {
            ItemStack stack = client.player.getInventory().getArmorStack(i);
            if (!stack.isEmpty()) {
                itemsToRender.add(stack);
            }
        }

        // Main Hand (Weapon/Tool)
        ItemStack mainHand = client.player.getMainHandStack();
        if (!mainHand.isEmpty()) {
            itemsToRender.add(mainHand);
        }

        for (ItemStack item : itemsToRender) {
            context.fill(startX, startY - 1, startX + 72, startY + 17, 0x70000000);

            context.drawItem(item, startX + 2, startY);

            if (item.isDamageable()) {
                int max = item.getMaxDamage();
                int damage = item.getDamage();
                int remaining = Math.max(0, max - damage);
                float ratio = (float) remaining / (float) max;

                int textColor = 0xFF55FF55; // Green
                if (ratio <= 0.25f) {
                    textColor = 0xFFFF5555; // Red
                } else if (ratio <= 0.50f) {
                    textColor = 0xFFFFFF55; // Yellow
                }

                String durText = String.valueOf(remaining);
                context.drawText(client.textRenderer, durText, startX + 22, startY + 4, textColor, true);
            } else {
                context.drawText(client.textRenderer, "∞", startX + 24, startY + 4, 0xFFFFFFFF, true);
            }

            startY += 19;
        }
    }
}
