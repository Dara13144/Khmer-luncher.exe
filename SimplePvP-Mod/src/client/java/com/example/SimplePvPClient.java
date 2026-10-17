package com.example;

import com.example.hud.NMCModulesConfig;
import com.example.hud.PvPHudRenderer;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.HoverEvent;
import net.minecraft.text.MutableText;
import net.minecraft.text.Style;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

public class SimplePvPClient implements ClientModInitializer {
    public static final String DISCORD_URL = "https://discord.gg/ZnHuvUqpn";
    public static final String TELEGRAM_URL = "https://t.me/+Gzx1VlNQa3Q0YTJl";

    @Override
    public void onInitializeClient() {
        // Initialize and load configuration from .minecraft/nmc_pvp_modules.json
        NMCModulesConfig.checkReload();

        // Register Master PvP HUD Renderer
        HudRenderCallback.EVENT.register((DrawContext context, RenderTickCounter tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            PvPHudRenderer.render(context, client);
        });

        // Register in-game /discord, /telegram, /tg, /dyna, /dynastore and /nmc commands
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> {
            dispatcher.register(ClientCommandManager.literal("discord")
                .executes(context -> {
                    sendDiscordInvite(context.getSource().getClient());
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("telegram")
                .executes(context -> {
                    sendTelegramInvite(context.getSource().getClient());
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("tg")
                .executes(context -> {
                    sendTelegramInvite(context.getSource().getClient());
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("dyna")
                .executes(context -> {
                    sendDiscordInvite(context.getSource().getClient());
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("dynastore")
                .executes(context -> {
                    sendDiscordInvite(context.getSource().getClient());
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("nmc")
                .executes(context -> {
                    sendDiscordInvite(context.getSource().getClient());
                    return 1;
                })
            );
        });
    }

    private static void sendDiscordInvite(MinecraftClient client) {
        if (client.player == null) return;
        MutableText header = Text.literal("⚡ [DYNASTORE CLIENT] ").formatted(Formatting.RED, Formatting.BOLD);
        MutableText info = Text.literal("Official Discord Community: ").formatted(Formatting.WHITE);
        MutableText link = Text.literal(DISCORD_URL)
            .setStyle(Style.EMPTY
                .withColor(Formatting.YELLOW)
                .withUnderline(true)
                .withClickEvent(new ClickEvent(ClickEvent.Action.OPEN_URL, DISCORD_URL))
                .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("Click to open DYNASTORE Discord!")))
            );
        client.player.sendMessage(header.append(info).append(link), false);
    }

    private static void sendTelegramInvite(MinecraftClient client) {
        if (client.player == null) return;
        MutableText header = Text.literal("⚡ [DYNASTORE CLIENT] ").formatted(Formatting.AQUA, Formatting.BOLD);
        MutableText info = Text.literal("Official Telegram Group: ").formatted(Formatting.WHITE);
        MutableText link = Text.literal(TELEGRAM_URL)
            .setStyle(Style.EMPTY
                .withColor(Formatting.AQUA)
                .withUnderline(true)
                .withClickEvent(new ClickEvent(ClickEvent.Action.OPEN_URL, TELEGRAM_URL))
                .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("Click to join DYNASTORE Telegram Group!")))
            );
        client.player.sendMessage(header.append(info).append(link), false);
    }
}

