import { LivingEntity } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';

const slow = new PotionEffect(PotionEffectType.SLOW, 4 * 20, 2);

registerEvent(EntityDamageEvent, (event) => {
  if (event.cause.toString() !== 'FALL') return;
  const entity = event.getEntity() as LivingEntity;
  entity?.addPotionEffect(slow);
});
