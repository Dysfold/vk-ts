import { LivingEntity } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';

const SLOW = new PotionEffect(PotionEffectType.SLOW, 4 * 20, 2);

// Custom fall damage
function fallDamage(old: number) {
  return Math.ceil(old * old * 0.3);
}

registerEvent(EntityDamageEvent, (event) => {
  if (event.cause.toString() !== 'FALL') return;
  if (!(event.entity instanceof LivingEntity)) return;

  event.entity.addPotionEffect(SLOW);

  event.damage = fallDamage(event.damage);
});
