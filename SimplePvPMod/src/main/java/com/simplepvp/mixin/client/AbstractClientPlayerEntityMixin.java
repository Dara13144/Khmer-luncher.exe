package com.simplepvp.mixin.client;

import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.util.Identifier;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.texture.NativeImage;
import net.minecraft.client.texture.NativeImageBackedTexture;

@Mixin(AbstractClientPlayerEntity.class)
public abstract class AbstractClientPlayerEntityMixin {

    private static final Map<String, Identifier> CUSTOM_CAPES_CACHE = new HashMap<>();

    @Inject(method = "getCapeTexture", at = @At("HEAD"), cancellable = true)
    private void injectKhmerCape(CallbackInfoReturnable<Identifier> cir) {
        AbstractClientPlayerEntity player = (AbstractClientPlayerEntity) (Object) this;
        String playerName = player.getNameForScoreboard().toLowerCase();

        // 1. Check if the cape texture is already loaded into RAM
        if (CUSTOM_CAPES_CACHE.containsKey(playerName)) {
            Identifier cached = CUSTOM_CAPES_CACHE.get(playerName);
            if (cached != null) {
                cir.setReturnValue(cached);
                return;
            }
        }

        // 2. Check local offline cape file (.minecraft/capes/{playerName}.png)
        MinecraftClient mc = MinecraftClient.getInstance();
        File runDir = mc.runDirectory != null ? mc.runDirectory : new File(".");
        File localCape = new File(new File(runDir, "capes"), playerName + ".png");
        if (localCape.exists()) {
            try (InputStream stream = new FileInputStream(localCape)) {
                NativeImage image = NativeImage.read(stream);
                Identifier textureId = Identifier.of("khmerlauncher", "capes/" + playerName);
                mc.execute(() -> {
                    mc.getTextureManager().registerTexture(textureId, new NativeImageBackedTexture(image));
                    CUSTOM_CAPES_CACHE.put(playerName, textureId);
                });
                cir.setReturnValue(textureId);
                return;
            } catch (Exception ignored) {}
        }

        // 3. Fetch asynchronously from the central Khmer Launcher Cape Server
        CUSTOM_CAPES_CACHE.put(playerName, null); // Prevent spamming duplicate requests
        new Thread(() -> {
            try {
                URL url = new URL("https://api.khmerlauncher.site/api/cape/" + playerName + ".png");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(2500);
                connection.setReadTimeout(2500);

                if (connection.getResponseCode() == 200) {
                    try (InputStream stream = connection.getInputStream()) {
                        NativeImage image = NativeImage.read(stream);
                        Identifier textureId = Identifier.of("khmerlauncher", "capes/" + playerName);

                        MinecraftClient.getInstance().execute(() -> {
                            MinecraftClient.getInstance().getTextureManager().registerTexture(
                                textureId,
                                new NativeImageBackedTexture(image)
                            );
                            CUSTOM_CAPES_CACHE.put(playerName, textureId);
                        });
                    }
                }
            } catch (Exception ignored) {
                // Player does not have a custom cape equipped
            }
        }).start();
    }
}
