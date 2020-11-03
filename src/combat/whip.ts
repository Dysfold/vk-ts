import { Material } from 'org.bukkit';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { PlayerInventory } from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { CustomItem } from '../common/items/CustomItem';

const Whip = new CustomItem({
  id: 3,
  name: 'Ruoska',
  type: Material.IRON_HOE,
  modelId: 3,
});

const SLOW = new PotionEffect(PotionEffectType.SLOW, 3 * 20, 2);

Whip.event(
  EntityDamageByEntityEvent,
  (event) =>
    ((event.damager as Player)?.inventory as PlayerInventory).itemInMainHand,
  async (event) => {
    if (event.damager.type !== EntityType.PLAYER) return;
    if (!(event.entity instanceof LivingEntity)) return;
    event.entity.addPotionEffect(SLOW);
    // TODO: Sounds
  },
);
