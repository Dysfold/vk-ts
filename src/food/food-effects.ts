import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { SuspiciousStewMeta } from 'org.bukkit.inventory.meta';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { chanceOf } from '../common/helpers/math';

// Vanilla effect
export function eatPoisonousPotato(player: Player) {
  if (chanceOf(0.6)) {
    player.addPotionEffect(
      new PotionEffect(PotionEffectType.POISON, 5 * 20, 1, false, false),
    );
  }
}

// Vanilla effect
export function eatRawChicken(player: Player) {
  if (chanceOf(0.3)) {
    player.addPotionEffect(
      new PotionEffect(PotionEffectType.HUNGER, 30 * 20, 1, false, false),
    );
  }
}

// Vanilla effect
export function eatPufferfish(player: Player) {
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.HUNGER, 3 * 20, 3, false, false),
  );
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.POISON, 60 * 20, 2, false, false),
  );
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.CONFUSION, 15 * 20, 1, false, false),
  );
}

// Vanilla effect
export function eatRottenFlesh(player: Player) {
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.HUNGER, 30 * 20, 1, false, false),
  );
}

// Vanilla effect
export function eatSpiderEye(player: Player) {
  player.addPotionEffect(
    new PotionEffect(PotionEffectType.POISON, 4 * 20, 1, false, false),
  );
}

// Vanilla effect
export function eatSuspiciousStew(player: Player, stew?: ItemStack) {
  const meta = stew?.itemMeta as SuspiciousStewMeta;
  for (const effect of meta.customEffects) {
    player.addPotionEffect(effect);
  }
}
