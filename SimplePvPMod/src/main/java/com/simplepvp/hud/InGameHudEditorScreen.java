package com.simplepvp.hud;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.text.Text;

public class InGameHudEditorScreen extends Screen {
    private final NMCModulesConfig config;
    private String draggedElementId = null;

    public InGameHudEditorScreen(NMCModulesConfig config) {
        super(Text.literal("Khmer Launcher HUD Editor"));
        this.config = config != null ? config : NMCModulesConfig.get();
        ensureElementsPopulated();
    }

    private void ensureElementsPopulated() {
        if (config.elements == null) {
            config.elements = new java.util.HashMap<>();
        }
        if (!config.elements.containsKey("pingFps")) config.elements.put("pingFps", new NMCModulesConfig.HudElement(config.pingFps, 88, 4, 1.0));
        if (!config.elements.containsKey("targetHealth")) config.elements.put("targetHealth", new NMCModulesConfig.HudElement(config.targetHealth, 50, 20, 1.0));
        if (!config.elements.containsKey("keystrokes")) config.elements.put("keystrokes", new NMCModulesConfig.HudElement(config.keystrokesBps, 8, 65, 1.0));
        if (!config.elements.containsKey("armorDurability")) config.elements.put("armorDurability", new NMCModulesConfig.HudElement(config.armorDurability, 90, 70, 1.0));
        if (!config.elements.containsKey("reachDisplay")) config.elements.put("reachDisplay", new NMCModulesConfig.HudElement(config.reachDisplay, 50, 75, 1.0));
        if (!config.elements.containsKey("coordinates")) config.elements.put("coordinates", new NMCModulesConfig.HudElement(config.coordinates, 4, 4, 1.0));
        if (!config.elements.containsKey("crosshairCps")) config.elements.put("crosshairCps", new NMCModulesConfig.HudElement(config.crosshairCps, 50, 52, 1.0));
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        this.renderBackground(context, mouseX, mouseY, delta);
        
        context.drawCenteredTextWithShadow(
            this.textRenderer,
            "Khmer Launcher - Drag modules to reposition (Press ESC to save & exit)",
            this.width / 2,
            12,
            0x10B981
        );

        int accentColorInt = config.parseAccentColor(0xFF10B981);

        config.elements.forEach((id, element) -> {
            if (element.enabled) {
                int screenX = (int) ((element.x / 100.0) * this.width);
                int screenY = (int) ((element.y / 100.0) * this.height);
                
                context.drawBorder(screenX - 2, screenY - 2, 84, 22, accentColorInt);
                context.drawText(this.textRenderer, id, screenX + 2, screenY + 6, 0xFFFFFFFF, true);
            }
        });

        super.render(context, mouseX, mouseY, delta);
    }

    @Override
    public boolean mouseClicked(double mouseX, double mouseY, int button) {
        config.elements.forEach((id, element) -> {
            int screenX = (int) ((element.x / 100.0) * this.width);
            int screenY = (int) ((element.y / 100.0) * this.height);
            if (mouseX >= screenX - 2 && mouseX <= screenX + 84 && mouseY >= screenY - 2 && mouseY <= screenY + 22) {
                draggedElementId = id;
            }
        });
        return super.mouseClicked(mouseX, mouseY, button);
    }

    @Override
    public boolean mouseDragged(double mouseX, double mouseY, int button, double deltaX, double deltaY) {
        if (draggedElementId != null && config.elements.containsKey(draggedElementId)) {
            NMCModulesConfig.HudElement el = config.elements.get(draggedElementId);
            el.x = Math.max(2.0, Math.min(90.0, (mouseX / (double) this.width) * 100.0));
            el.y = Math.max(2.0, Math.min(90.0, (mouseY / (double) this.height) * 100.0));
        }
        return super.mouseDragged(mouseX, mouseY, button, deltaX, deltaY);
    }

    @Override
    public boolean mouseReleased(double mouseX, double mouseY, int button) {
        draggedElementId = null;
        config.save();
        return super.mouseReleased(mouseX, mouseY, button);
    }

    @Override
    public void close() {
        config.save();
        super.close();
    }
}
