package com.simplepvp.hud;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

public class KhmerSystemMenuScreen extends Screen {
    private final NMCModulesConfig config;

    public KhmerSystemMenuScreen(NMCModulesConfig config) {
        super(Text.literal("KHMER LAUNCHER — Client System Menu"));
        this.config = config != null ? config : NMCModulesConfig.get();
    }

    @Override
    protected void init() {
        super.init();
        int centerX = this.width / 2;
        int startY = 48;
        int btnWidth = 190;
        int btnHeight = 20;

        // Button 1: Open Draggable HUD Canvas Editor
        this.addDrawableChild(ButtonWidget.builder(
            Text.literal("🎯 Edit HUD Layout & Drag Canvas").formatted(Formatting.AQUA, Formatting.BOLD),
            button -> {
                if (this.client != null) {
                    this.client.setScreen(new InGameHudEditorScreen(this.config));
                }
            }
        ).dimensions(centerX - 100, startY, 200, 22).build());

        // Left Column: Combat Modules
        int col1X = centerX - 205;
        int col2X = centerX + 5;
        int rowY = startY + 30;

        // Target Health
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Target Health", config.targetHealth),
            button -> {
                config.targetHealth = !config.targetHealth;
                if (config.elements.containsKey("targetHealth")) {
                    config.elements.get("targetHealth").enabled = config.targetHealth;
                }
                config.save();
                button.setMessage(getModuleToggleText("Target Health", config.targetHealth));
            }
        ).dimensions(col1X, rowY, btnWidth, btnHeight).build());

        // Reach Display
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Reach Display", config.reachDisplay),
            button -> {
                config.reachDisplay = !config.reachDisplay;
                if (config.elements.containsKey("reachDisplay")) {
                    config.elements.get("reachDisplay").enabled = config.reachDisplay;
                }
                config.save();
                button.setMessage(getModuleToggleText("Reach Display", config.reachDisplay));
            }
        ).dimensions(col2X, rowY, btnWidth, btnHeight).build());

        rowY += 24;

        // Ping & FPS Counter
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Ping & FPS Counter", config.pingFps),
            button -> {
                config.pingFps = !config.pingFps;
                if (config.elements.containsKey("pingFps")) {
                    config.elements.get("pingFps").enabled = config.pingFps;
                }
                config.save();
                button.setMessage(getModuleToggleText("Ping & FPS Counter", config.pingFps));
            }
        ).dimensions(col1X, rowY, btnWidth, btnHeight).build());

        // Crosshair CPS
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Crosshair CPS", config.crosshairCps),
            button -> {
                config.crosshairCps = !config.crosshairCps;
                if (config.elements.containsKey("crosshairCps")) {
                    config.elements.get("crosshairCps").enabled = config.crosshairCps;
                }
                config.save();
                button.setMessage(getModuleToggleText("Crosshair CPS", config.crosshairCps));
            }
        ).dimensions(col2X, rowY, btnWidth, btnHeight).build());

        rowY += 24;

        // Keystrokes & Speedometer
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Keystrokes (WASD+CPS)", config.keystrokesBps),
            button -> {
                config.keystrokesBps = !config.keystrokesBps;
                if (config.elements.containsKey("keystrokes")) {
                    config.elements.get("keystrokes").enabled = config.keystrokesBps;
                }
                config.save();
                button.setMessage(getModuleToggleText("Keystrokes (WASD+CPS)", config.keystrokesBps));
            }
        ).dimensions(col1X, rowY, btnWidth, btnHeight).build());

        // Armor Durability
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Armor & Durability", config.armorDurability),
            button -> {
                config.armorDurability = !config.armorDurability;
                if (config.elements.containsKey("armorDurability")) {
                    config.elements.get("armorDurability").enabled = config.armorDurability;
                }
                config.save();
                button.setMessage(getModuleToggleText("Armor & Durability", config.armorDurability));
            }
        ).dimensions(col2X, rowY, btnWidth, btnHeight).build());

        rowY += 24;

        // Coordinates & Direction
        this.addDrawableChild(ButtonWidget.builder(
            getModuleToggleText("Coordinates & Compass", config.coordinates),
            button -> {
                config.coordinates = !config.coordinates;
                if (config.elements.containsKey("coordinates")) {
                    config.elements.get("coordinates").enabled = config.coordinates;
                }
                config.save();
                button.setMessage(getModuleToggleText("Coordinates & Compass", config.coordinates));
            }
        ).dimensions(col1X, rowY, btnWidth, btnHeight).build());

        // Cycle Accent Color
        this.addDrawableChild(ButtonWidget.builder(
            Text.literal("🎨 Cycle Accent Color: " + config.accentColor).formatted(Formatting.YELLOW),
            button -> {
                cycleAccentColor();
                config.save();
                button.setMessage(Text.literal("🎨 Cycle Accent Color: " + config.accentColor).formatted(Formatting.YELLOW));
            }
        ).dimensions(col2X, rowY, btnWidth, btnHeight).build());

        // Bottom Controls
        int bottomY = this.height - 36;

        this.addDrawableChild(ButtonWidget.builder(
            Text.literal("⚡ Community Discord").formatted(Formatting.BLUE),
            button -> {
                if (this.client != null) {
                    net.minecraft.util.Util.getOperatingSystem().open("https://discord.gg/KhmerLauncher");
                }
            }
        ).dimensions(centerX - 195, bottomY, 125, 20).build());

        this.addDrawableChild(ButtonWidget.builder(
            Text.literal("✈ Telegram Group").formatted(Formatting.AQUA),
            button -> {
                if (this.client != null) {
                    net.minecraft.util.Util.getOperatingSystem().open("https://t.me/+Gzx1VlNQa3Q0YTJl");
                }
            }
        ).dimensions(centerX - 60, bottomY, 120, 20).build());

        this.addDrawableChild(ButtonWidget.builder(
            Text.literal("✔ Return to Game").formatted(Formatting.GREEN, Formatting.BOLD),
            button -> this.close()
        ).dimensions(centerX + 70, bottomY, 125, 20).build());
    }

    private Text getModuleToggleText(String name, boolean enabled) {
        if (enabled) {
            return Text.literal(name + ": ").append(Text.literal("ON").formatted(Formatting.GREEN, Formatting.BOLD));
        } else {
            return Text.literal(name + ": ").append(Text.literal("OFF").formatted(Formatting.RED));
        }
    }

    private void cycleAccentColor() {
        String[] colors = new String[] { "#10B981", "#00F5FF", "#A855F7", "#F43F5E", "#FBBF24", "#22C55E" };
        int idx = 0;
        for (int i = 0; i < colors.length; i++) {
            if (colors[i].equalsIgnoreCase(config.accentColor)) {
                idx = (i + 1) % colors.length;
                break;
            }
        }
        config.accentColor = colors[idx];
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        this.renderBackground(context, mouseX, mouseY, delta);

        int centerX = this.width / 2;

        // Title Header
        context.drawCenteredTextWithShadow(
            this.textRenderer,
            "⚡ KHMER LAUNCHER — PvP CLIENT SYSTEM MENU ⚡",
            centerX,
            12,
            0x10B981
        );

        context.drawCenteredTextWithShadow(
            this.textRenderer,
            "Press Right Shift in-game anytime to open this menu | Auto-syncs with .minecraft/config/khmer_pvp_hud.json",
            centerX,
            26,
            0xAAAAAA
        );

        super.render(context, mouseX, mouseY, delta);
    }

    @Override
    public void close() {
        config.save();
        super.close();
    }
}
