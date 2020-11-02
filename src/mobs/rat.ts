import { Material } from 'org.bukkit';
import { EntityType, LivingEntity } from 'org.bukkit.entity';
import { BlockGrowEvent } from 'org.bukkit.event.block';
import {
  EntityChangeBlockEvent,
  EntityTargetEvent,
} from 'org.bukkit.event.entity';

const RAT = EntityType.SILVERFISH;
const RAT_ATTACK_CHANCE = 0.08;

const SpawnChance = {
  wheat: 0.001,
};

// Rats will be passive mobs
// but they will become agressive when damaged
registerEvent(EntityTargetEvent, (event) => {
  const attacker = event.entity;

  if (attacker.type === RAT && event.target?.type === EntityType.PLAYER) {
    const rat = attacker as LivingEntity;

    if (rat.health === rat.maxHealth) {
      event.setCancelled(true);
      return;
    }

    if (Math.random() > RAT_ATTACK_CHANCE) {
      event.setCancelled(true);
      return;
    }
  }
});

// Spawn rats on fields
registerEvent(BlockGrowEvent, (event) => {
  const block = event.block;
  if (block.type !== Material.WHEAT) return;
  if (Math.random() < SpawnChance.wheat) {
    block.world.spawnEntity(block.location.add(0.5, 0, 0.5), RAT);
  }
});

registerEvent(EntityChangeBlockEvent, (event) => {
  if (event.entityType === RAT) {
    event.setCancelled(true);
  }
});
