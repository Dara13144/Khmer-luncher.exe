package com.nmcclient.mixin;

import com.nmcclient.NMCClientMod;
import net.minecraft.client.Mouse;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Mouse.class)
public class MouseMixin {
    @Inject(method = "onMouseButton", at = @At("HEAD"))
    private void onMouse(long win, int btn, int action, int mods, CallbackInfo ci) {
        if (action == 1) {
            long now = System.currentTimeMillis();
            if (btn == 0) NMCClientMod.leftClicks.add(now);
            if (btn == 1) NMCClientMod.rightClicks.add(now);
        }
    }
}
