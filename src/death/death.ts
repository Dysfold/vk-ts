import { PlayerPostRespawnEvent } from 'com.destroystokyo.paper.event.player';
import { Material } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import { PlayerDeathEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { PlayerRespawnEvent } from 'org.bukkit.event.player';
import { dataHolder } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import { spawnCorpse } from './corpses';
import { DeathData } from './DeathData';
import { locationToObj } from './helpers';
import {
  getTuonelaSpawnLocation,
  startTuonela,
  TUONELA_WORLD,
} from './tuonela';

const DURATIONS = {
  default: 10,
  monster: 20,
  player: 60,
};

function getTuonelaDuration(event: PlayerDeathEvent) {
  // Player killed
  if (event.entity.killer) return DURATIONS.player;

  const causeEvent = event.entity.lastDamageCause;
  if (!causeEvent) return DURATIONS.default;

  // Monster killed
  if (causeEvent.cause === DamageCause.ENTITY_ATTACK) {
    return DURATIONS.monster;
  }

  // Creeper killed
  if (causeEvent.cause === DamageCause.ENTITY_EXPLOSION) {
    return DURATIONS.monster;
  }

  // Projectile killed
  if (causeEvent.cause === DamageCause.PROJECTILE) {
    return DURATIONS.monster;
  }

  return DURATIONS.default;
}

// Save players death location and set the Tuonela duration
registerEvent(PlayerDeathEvent, async (event) => {
  if (event.entityType !== EntityType.PLAYER) return;
  event.deathMessage = null;
  if (event.entity.world === TUONELA_WORLD) {
    event.setCancelled(true);
    return;
  }
  const player = event.entity;
  const view = dataView(DeathData, dataHolder(player));

  // Set the desired Tuonela time in minutes
  const tuonelaDuration = getTuonelaDuration(event);

  // Save the data
  view.deathLocation = locationToObj(player.location);
  view.respawnTime = Math.floor(new Date().getTime() + tuonelaDuration * 60000);

  const prisonBed = getPrisonBed(player);
  if (prisonBed) {
    view.isPrisoner = true;
    view.deathLocation = locationToObj(prisonBed.location.toCenterLocation());
  }

  spawnCorpse(event);
});

registerEvent(PlayerRespawnEvent, (event) => {
  event.respawnLocation = getTuonelaSpawnLocation();
});

registerEvent(PlayerPostRespawnEvent, (event) => {
  startTuonela(event.player);
});

const PRISON_BED = Material.LIGHT_GRAY_BED;
function getPrisonBed(player: Player) {
  const radius = 5;
  const source = player.location.block;

  for (let dx = -radius; dx < radius; dx++) {
    for (let dz = -radius; dz < radius; dz++) {
      for (let dy = -1; dy < 2; dy++) {
        const block = source.getRelative(dx, dy, dz);
        if (block.type === PRISON_BED) {
          return block;
        }
      }
    }
  }
}
