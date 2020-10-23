import { Material, Particle } from 'org.bukkit';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { Action, BlockBreakEvent } from 'org.bukkit.event.block';
import { EntityInteractEvent } from 'org.bukkit.event.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';

const BEARTRAP_MATERIAL = Material.WARPED_PRESSURE_PLATE;
const ESCAPE_CHANCE = 0.3;

const SLOW = new PotionEffect(PotionEffectType.SLOW, 36000, 10);
const JUMP = new PotionEffect(PotionEffectType.JUMP, 36000, -7);
const SLOW_DIGGING = new PotionEffect(PotionEffectType.SLOW_DIGGING, 36000, 1);

// Mob steps on bear trap
registerEvent(EntityInteractEvent, (event) => {
  if (event.block.type !== BEARTRAP_MATERIAL) return;
  const entity = event.entity;
  if (!entity.type.isAlive()) return;

  const mob = entity as LivingEntity;
  mob.damage(2);
  mob.addPotionEffect(SLOW);
  mob.addPotionEffect(JUMP);
});

// Player steps on bear trap
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.PHYSICAL) return;

  const block = event.clickedBlock;
  if (!block) return;
  if (block.type !== BEARTRAP_MATERIAL) return;

  const player = event.player;
  player.damage(5);
  player.addPotionEffect(SLOW);
  player.addPotionEffect(JUMP);
  player.addPotionEffect(SLOW_DIGGING);
  player.spawnParticle(Particle.FLASH, player.location, 10);
});

registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type !== BEARTRAP_MATERIAL) return;
  const breaker = event.player;

  const centerOfTrap = event.block.location.add(0.5, 0.5, 0.5);
  const entities = breaker.world.getNearbyEntities(centerOfTrap, 1, 1, 1);

  if (isTrapped(breaker)) {
    // If player has SLOW_DIGGING, he probably is trapped
    if (Math.random() > ESCAPE_CHANCE) {
      event.setCancelled(true);
      breaker.damage(2);
      breaker.sendActionBar('Karhunrauta napsahtaa uudelleen kiinni');
      return;
    }
  }

  for (const entity of entities) {
    if (entity instanceof LivingEntity) {
      const victim = entity as LivingEntity;

      // Victim exits the trap
      victim.removePotionEffect(PotionEffectType.SLOW);
      victim.removePotionEffect(PotionEffectType.JUMP);
      victim.removePotionEffect(PotionEffectType.SLOW_DIGGING);
      if (victim.type === EntityType.PLAYER) {
        (victim as Player).sendActionBar('Vapaudut karhunraudasta');
      }
    }
  }
});

function isTrapped(player: Player) {
  return (
    player.hasPotionEffect(PotionEffectType.SLOW) &&
    player.hasPotionEffect(PotionEffectType.SLOW_DIGGING) &&
    player.hasPotionEffect(PotionEffectType.SLOW)
  );
}
