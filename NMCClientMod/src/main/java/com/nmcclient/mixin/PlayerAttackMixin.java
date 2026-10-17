package com.nmcclient.mixin;

import com.nmcclient.NMCClientMod;
import net.minecraft.client.network.ClientPlayerInteractionManager;
import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ClientPlayerInteractionManager.class)
public class PlayerAttackMixin {
    @Inject(method = "attackEntity", at = @At("HEAD"))
    private void onAttack(PlayerEntity player, Entity target, CallbackInfo ci) {
        if (player != null && target != null) {
            NMCClientMod.lastReachDistance = player.getEyePos().distanceTo(target.getPos());
            NMCClientMod.lastReachTime = System.currentTimeMillis();
            if (target instanceof LivingEntity living) {
                NMCClientMod.targetEntityName = target.getName().getString();
                NMCClientMod.targetEntityHealth = living.getHealth();
            }
        }
    }
}
