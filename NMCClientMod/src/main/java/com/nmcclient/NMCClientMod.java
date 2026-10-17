package com.nmcclient;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.PlayerListEntry;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.item.ItemStack;
import net.minecraft.util.math.Vec3d;
import java.util.LinkedList;

public class NMCClientMod implements ClientModInitializer {
    public static final LinkedList<Long> leftClicks = new LinkedList<>();
    public static final LinkedList<Long> rightClicks = new LinkedList<>();
    public static double lastReachDistance = 0.0;
    public static long lastReachTime = 0;
    public static String targetEntityName = "";
    public static float targetEntityHealth = 0.0f;

    @Override
    public void onInitializeClient() {
        NMCConfig.load();

        HudRenderCallback.EVENT.register((DrawContext context, RenderTickCounter tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player == null || client.options.hudHidden) return;

            long now = System.currentTimeMillis();
            while (!leftClicks.isEmpty() && now - leftClicks.peek() > 1000) leftClicks.remove();
            while (!rightClicks.isEmpty() && now - rightClicks.peek() > 1000) rightClicks.remove();

            // 1. [240 FPS] & [162 ms] Counter
            if (NMCConfig.pingFps) {
                int fps = client.getCurrentFps();
                int latency = 0;
                if (client.getNetworkHandler() != null) {
                    PlayerListEntry entry = client.getNetworkHandler().getPlayerListEntry(client.player.getUuid());
                    if (entry != null) latency = entry.getLatency();
                }
                context.drawText(client.textRenderer, "[" + fps + " FPS]", 10, 10, 0xFFFFFF, true);
                context.drawText(client.textRenderer, "[" + latency + " ms]", 10, 22, 0x38BDF8, true);
            }

            // 2. Reach Display & Target Health
            if (NMCConfig.reachDisplay && (now - lastReachTime < 2500) && lastReachDistance > 0) {
                String reachStr = String.format("[%.2f Blocks]", lastReachDistance);
                int screenW = client.getWindow().getScaledWidth();
                int screenH = client.getWindow().getScaledHeight();
                context.drawText(client.textRenderer, reachStr, (screenW / 2) - (client.textRenderer.getWidth(reachStr) / 2), (screenH / 2) + 14, NMCConfig.accentColor, true);

                if (NMCConfig.targetHealth && !targetEntityName.isEmpty()) {
                    String targetStr = targetEntityName + " " + (int) targetEntityHealth + " ❤";
                    context.drawText(client.textRenderer, targetStr, (screenW / 2) - (client.textRenderer.getWidth(targetStr) / 2), (screenH / 2) - 22, 0xFF5555, true);
                }
            }

            // 3. Keystrokes & Speedometer (BPS)
            if (NMCConfig.keystrokesBps) {
                int startX = client.getWindow().getScaledWidth() - 74;
                renderKey(context, client, client.options.forwardKey, "W", startX + 22, 10);
                renderKey(context, client, client.options.leftKey, "A", startX, 32);
                renderKey(context, client, client.options.backKey, "S", startX + 22, 32);
                renderKey(context, client, client.options.rightKey, "D", startX + 44, 32);

                renderButton(context, client, !leftClicks.isEmpty(), "LMB " + leftClicks.size(), startX, 54, 31);
                renderButton(context, client, !rightClicks.isEmpty(), "RMB " + rightClicks.size(), startX + 33, 54, 32);

                Vec3d vel = client.player.getVelocity();
                double bps = Math.sqrt(vel.x * vel.x + vel.z * vel.z) * 20.0;
                String bpsStr = String.format("%.2f BPS", bps);
                context.drawText(client.textRenderer, bpsStr, startX + 10, 80, NMCConfig.accentColor, true);
            }

            // 4. Armor Durability Status
            if (NMCConfig.armorDurability) {
                int screenH = client.getWindow().getScaledHeight();
                int screenW = client.getWindow().getScaledWidth();
                int armorY = screenH - 95;
                int armorX = screenW - 75;

                for (ItemStack item : client.player.getArmorItems()) {
                    if (!item.isEmpty()) {
                        context.drawItem(item, armorX, armorY);
                        int dur = item.getMaxDamage() - item.getDamage();
                        context.drawText(client.textRenderer, String.valueOf(dur), armorX + 22, armorY + 4, 0xFFFFFF, true);
                        armorY += 18;
                    }
                }
            }

            // 5. Coordinates & Cardinal Direction
            if (NMCConfig.coords) {
                int x = (int) Math.floor(client.player.getX());
                int y = (int) Math.floor(client.player.getY());
                int z = (int) Math.floor(client.player.getZ());
                String dir = client.player.getHorizontalFacing().asString().toUpperCase().substring(0, 1);
                String coordsStr = "(" + x + ", " + y + ", " + z + ") " + dir;
                context.drawText(client.textRenderer, coordsStr, 10, 36, NMCConfig.accentColor, true);
            }

            // 6. Crosshair CPS Combat Analytics
            if (NMCConfig.crosshairCps) {
                String cpsStr = leftClicks.size() + " | " + rightClicks.size() + " CPS";
                int screenW = client.getWindow().getScaledWidth();
                int screenH = client.getWindow().getScaledHeight();
                context.drawText(client.textRenderer, cpsStr, (screenW / 2) - (client.textRenderer.getWidth(cpsStr) / 2), (screenH / 2) + 26, NMCConfig.accentColor, true);
            }
        });
    }

    private void renderKey(DrawContext ctx, MinecraftClient mc, KeyBinding k, String label, int x, int y) {
        boolean p = k.isPressed();
        int activeColor = 0x90000000 | (NMCConfig.accentColor & 0xFFFFFF);
        ctx.fill(x, y, x + 20, y + 20, p ? activeColor : 0x60000000);
        int w = mc.textRenderer.getWidth(label);
        ctx.drawText(mc.textRenderer, label, x + (20 - w) / 2, y + 6, p ? 0x000000 : 0xFFFFFF, false);
    }

    private void renderButton(DrawContext ctx, MinecraftClient mc, boolean active, String label, int x, int y, int width) {
        int activeColor = 0x90000000 | (NMCConfig.accentColor & 0xFFFFFF);
        ctx.fill(x, y, x + width, y + 18, active ? activeColor : 0x60000000);
        int w = mc.textRenderer.getWidth(label);
        ctx.drawText(mc.textRenderer, label, x + (width - w) / 2, y + 5, active ? 0x000000 : 0xFFFFFF, false);
    }
}
