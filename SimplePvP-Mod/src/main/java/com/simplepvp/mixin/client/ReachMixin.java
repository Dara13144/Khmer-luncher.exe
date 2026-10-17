package com.simplepvp.mixin.client;

import com.simplepvp.hud.OpponentHealthTracker;
import com.simplepvp.hud.ReachTracker;
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
            net.minecraft.util.math.Box box = target.getBoundingBox();
            double cx = Math.max(box.minX, Math.min(eyePos.x, box.maxX));
            double cy = Math.max(box.minY, Math.min(eyePos.y, box.maxY));
            double cz = Math.max(box.minZ, Math.min(eyePos.z, box.maxZ));
            Vec3d closestPoint = new Vec3d(cx, cy, cz);
            double dist = eyePos.distanceTo(closestPoint);
            ReachTracker.recordHit(dist);
            OpponentHealthTracker.recordTarget(target);
        }
    }
}
