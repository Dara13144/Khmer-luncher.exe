package com.khmerlauncher.pvp;

import com.simplepvp.hud.InGameHudEditorScreen;
import com.simplepvp.hud.NMCModulesConfig;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public class KhmerPvPClient implements ClientModInitializer {
    public static KeyBinding openEditorKey;

    @Override
    public void onInitializeClient() {
        // Register In-Game Editor Keybind (Right Shift)
        openEditorKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
            "key.khmerlauncher.open_editor",
            InputUtil.Type.KEYSYM,
            GLFW.GLFW_KEY_RIGHT_SHIFT,
            "category.khmerlauncher.pvp"
        ));

        // Listen for Right Shift keypress to open draggable HUD editor
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (openEditorKey.wasPressed()) {
                client.setScreen(new InGameHudEditorScreen(NMCModulesConfig.get()));
            }
        });
    }
}
