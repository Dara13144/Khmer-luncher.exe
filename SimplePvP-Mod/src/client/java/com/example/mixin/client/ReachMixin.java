package com.example.mixin.client;

import com.example.hud.OpponentHealthTracker;
import com.example.hud.ReachTracker;
import net.minecraft.client.network.ClientPlayerInteractionManager;
import net.minecraft.entity.Entity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.math.Vec3d;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ClientPlayerInteractionManager.class)
public class ReachMixin {

    @Inject(method = "attackEntity", at = @At("HEAD"))
    private void onAttackEntity(PlayerEntity player, Entity target, CallbackInfo ci) {
        if (player != null && target != null) {
            Vec3d eyePos = player.getEyePos();
            Vec3d closestPoint = target.getBoundingBox().clamp(eyePos);
            double dist = eyePos.distanceTo(closestPoint);
            ReachTracker.recordHit(dist);
            OpponentHealthTracker.recordTarget(target);
        }
    }
}
