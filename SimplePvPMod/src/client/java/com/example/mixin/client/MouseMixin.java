package com.example.mixin.client;

import com.example.hud.CpsTracker;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.Mouse;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Mouse.class)
public class MouseMixin {

    @Inject(method = "onMouseButton", at = @At("HEAD"))
    private void onMouseClick(long window, int button, int action, int mods, CallbackInfo ci) {
        MinecraftClient client = MinecraftClient.getInstance();

        // ត្រួតពិនិត្យតែពេលចុច (action == 1 / GLFW_PRESS) និងមិនស្ថិតក្នុង Screen Menu
        if (action == 1 && client.currentScreen == null) {
            if (button == 0) {
                // Left Click
                CpsTracker.registerLeftClick();
            } else if (button == 1) {
                // Right Click
                CpsTracker.registerRightClick();
            }
        }
    }
}
