package com.simplepvp;

import com.simplepvp.hud.NMCModulesConfig;
import com.simplepvp.hud.PvPHudRenderer;
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
    public static net.minecraft.client.option.KeyBinding openEditorKey;

    @Override
    public void onInitializeClient() {
        // Initialize and load configuration from .minecraft/config/khmer_pvp_hud.json
        NMCModulesConfig.checkReload();

        // Register In-Game Editor Keybind (Right Shift)
        openEditorKey = net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper.registerKeyBinding(
            new net.minecraft.client.option.KeyBinding(
                "key.khmerlauncher.open_editor",
                net.minecraft.client.util.InputUtil.Type.KEYSYM,
                org.lwjgl.glfw.GLFW.GLFW_KEY_RIGHT_SHIFT,
                "category.khmerlauncher.pvp"
            )
        );

        // Check keypress to open in-game Client System Menu (Right Shift)
        net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (openEditorKey.wasPressed()) {
                client.setScreen(new KhmerSystemMenuScreen(NMCModulesConfig.get()));
            }
        });

        // Register Master PvP HUD Renderer
        HudRenderCallback.EVENT.register((DrawContext context, RenderTickCounter tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            PvPHudRenderer.render(context, client);
        });

        // Register in-game /menu, /khmer, /hud, /discord, /telegram commands
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> {
            dispatcher.register(ClientCommandManager.literal("menu")
                .executes(context -> {
                    MinecraftClient client = context.getSource().getClient();
                    client.send(() -> client.setScreen(new KhmerSystemMenuScreen(NMCModulesConfig.get())));
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("khmer")
                .executes(context -> {
                    MinecraftClient client = context.getSource().getClient();
                    client.send(() -> client.setScreen(new KhmerSystemMenuScreen(NMCModulesConfig.get())));
                    return 1;
                })
            );
            dispatcher.register(ClientCommandManager.literal("hud")
                .executes(context -> {
                    MinecraftClient client = context.getSource().getClient();
                    client.send(() -> client.setScreen(new InGameHudEditorScreen(NMCModulesConfig.get())));
                    return 1;
                })
            );
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

