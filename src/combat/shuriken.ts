import { translate } from 'craftjs-plugin/chat';
import { Sound, SoundCategory } from 'org.bukkit';
import { Attribute } from 'org.bukkit.attribute';
import { Damageable, EntityType, Player, Snowball } from 'org.bukkit.entity';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import { Vector } from 'org.bukkit.util';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const HIT_DAMAGE = 5;
const VEL_MULTIPLIER = 0.4;
const PICKUP_DELAY = 80; // ticks
const ZERO_VECTOR = new Vector();
const HIT_SOUND = Sound.BLOCK_STONE_HIT;

export const Shuriken = new CustomItem({
  id: 1,
  name: translate('vk.shuriken'),
  type: VkItem.THROWABLE,
});

registerEvent(ProjectileHitEvent, (event) => {
  if (event.entity.type !== EntityType.SNOWBALL) return;
  const snowball = event.entity as Snowball;
  const item = snowball.item;
  if (!Shuriken.check(item)) return;

  let armorMultiplier = 1; // Percentage of base damage. Reduced by armor points * 0.04.

  // Push and damage entity who got hit
  if (event.hitEntity) {
    // Get armor modifier from player
    if (event.hitEntity.type === EntityType.PLAYER) {
      const player = (event.hitEntity as unknown) as Player;
      const armor = player.getAttribute(Attribute.GENERIC_ARMOR)?.value;
      if (armor) armorMultiplier -= armor * 0.04;
    }
    // Damage entity
    const damagee = event.hitEntity as Damageable;
    damagee.damage(HIT_DAMAGE * armorMultiplier);
    const pushVel = new Vector(snowball.velocity.x, 0.5, snowball.velocity.z);
    damagee.velocity = damagee.velocity.add(pushVel.multiply(VEL_MULTIPLIER));
  }

  const drop = event.entity.world.dropItem(
    event.entity.location,
    snowball.item,
  );

  drop.velocity = ZERO_VECTOR;
  drop.pickupDelay = PICKUP_DELAY;
  drop.world.playSound(drop.location, HIT_SOUND, SoundCategory.PLAYERS, 0.5, 1);
});
