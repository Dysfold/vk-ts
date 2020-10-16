import { Material } from 'org.bukkit';
import { EntityType, LivingEntity } from 'org.bukkit.entity';
import {
  EntityCombustEvent,
  EntitySpawnEvent,
  EntityTargetEvent,
} from 'org.bukkit.event.entity';

const EAGLE_SPAWN_CHANGE = 0.02;
const EAGLE_SPAWN_HEIGHT = 120;
const EAGLE_SOUND_CHANGE = 0.2;

registerEvent(EntityCombustEvent, (event) => {
  if (event.entity.type === EntityType.PHANTOM) {
    event.setCancelled(true);
  }
});

// We want eagles to spawn above water, so we can use the squid spawn event
registerEvent(EntitySpawnEvent, (event) => {
  const entity = event.entity;
  if (entity.type === EntityType.SQUID) {
    if (Math.random() < EAGLE_SPAWN_CHANGE) {
      const location = entity.location;
      location.y = EAGLE_SPAWN_HEIGHT;
      if (location.block.type === Material.AIR) {
        location.world.spawnEntity(location, EntityType.PHANTOM);
      }
    }
  }
});

// Don't allow natural spawning of phantoms (eagles)
registerEvent(EntitySpawnEvent, (event) => {
  if (event.entity.type === EntityType.PHANTOM) {
    const reason = event.entity.entitySpawnReason.toString();
    // TODO: Replace strings with SpawnReason.CUSTOM ...
    if (reason !== 'CUSTOM' && reason !== 'SPAWNER_EGG') {
      event.setCancelled(true);
    }
  }
});

// Eagles will be passive mobs
// but they will become agressive when damaged
registerEvent(EntityTargetEvent, (event) => {
  const attacker = event.entity;

  if (
    attacker.getType() === EntityType.PHANTOM &&
    event.target?.getType() === EntityType.PLAYER
  ) {
    const eagle = attacker as LivingEntity;

    if (eagle.health === eagle.maxHealth) {
      event.setCancelled(true);
    }

    // More eagle sounds!!
    if (Math.random() < EAGLE_SOUND_CHANGE) {
      eagle.world.playSound(
        eagle.getLocation(),
        'minecraft:entity.phantom.death',
        3,
        1,
      );
    }
  }
});
