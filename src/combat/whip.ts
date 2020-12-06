import { Float } from 'java.lang';
import { Location, Material } from 'org.bukkit';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';

const WHIP_MATERIAL = Material.GHAST_TEAR;
const MAX_WHIP_DISTANCE = 3;

const SLOW = new PotionEffect(PotionEffectType.SLOW, 3 * 20, 2);

registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== WHIP_MATERIAL) return;
  const player = event.player;
  if (player.hasCooldown(WHIP_MATERIAL)) return;
  event.setCancelled(true);

  if (event.hand === EquipmentSlot.HAND) player.swingMainHand();
  else player.swingOffHand();

  player.setCooldown(WHIP_MATERIAL, 12);

  const target = player.getTargetEntity(MAX_WHIP_DISTANCE);
  playWhipSound(player.location);
  if (target instanceof LivingEntity) {
    target.addPotionEffect(SLOW);
    target.damage(0);
  }
});

registerEvent(EntityDamageByEntityEvent, (event) => {
  if (event.damager?.type !== EntityType.PLAYER) return;
  const player = event.damager as Player;
  const inventory = player.inventory as PlayerInventory;
  if (
    inventory.itemInMainHand?.type === WHIP_MATERIAL ||
    inventory.itemInOffHand?.type === WHIP_MATERIAL
  ) {
    if (player.hasCooldown(WHIP_MATERIAL)) return;
    player.setCooldown(WHIP_MATERIAL, 12);
    playWhipSound(event.entity.location);
  }
});

function playWhipSound(location: Location) {
  location.world.playSound(
    location,
    'custom.whip',
    1,
    (new Float(0.8) as unknown) as number,
  );
}
