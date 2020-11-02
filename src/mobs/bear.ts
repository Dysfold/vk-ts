import { Animals, EntityType } from 'org.bukkit.entity';
import { EntitySpawnEvent } from 'org.bukkit.event.entity';

const BEAR_TYPE = EntityType.POLAR_BEAR;
const BEAR_SPAWN_CHANGE = 0.2;
const BABY_BEAR_AMOUNT = 3;

registerEvent(EntitySpawnEvent, (event) => {
  const entity = event.entity;
  if (entity.type !== EntityType.FOX) return;
  if (!(entity as Animals).isAdult()) return;
  if (Math.random() > BEAR_SPAWN_CHANGE) return;

  const location = event.location;

  // Spawn mama bear
  location.world.spawnEntity(location, BEAR_TYPE);

  // Spawn 1-3 baby bears
  for (let i = 0; i < Math.random() * BABY_BEAR_AMOUNT; i++) {
    (location.world.spawnEntity(location, BEAR_TYPE) as Animals).setBaby();
  }
});
