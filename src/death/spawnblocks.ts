import { Location, Material } from 'org.bukkit';
import { BlockBreakEvent, BlockPlaceEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import { DatabaseEntry } from '../common/datas/database';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import { VkMaterial } from '../common/items/VkMaterial';
import { addTranslation, t } from '../common/localization/localization';
import { locationToObj, objToLocation } from './helpers';

const spawnBlockDatabaseEntry = new DatabaseEntry('spawns', 'spawnblocks-key');
const spawnBlockData = dataType('spawnBlockData', {
  blocks: yup.array(
    yup
      .object({
        x: yup.number().required(),
        y: yup.number().required(),
        z: yup.number().required(),
        worldId: yup.string().required(),
      })
      .required(),
  ),
});

const view = dataView(spawnBlockData, spawnBlockDatabaseEntry);
log.info('[Spawnblocks] Spawnblocks found ' + (view.blocks?.length || 0));

registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type !== VkMaterial.SPAWN_BLOCK) return;
  const locObj = locationToObj(event.block.location);
  if (!view.blocks) {
    view.blocks = [locObj];
  } else {
    view.blocks.push(locObj);
  }
  const subTitle = t(event.player, 'spawnblock.created');
  event.player.sendTitle(' ', subTitle, 10, 40, 20);
});

registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type !== VkMaterial.SPAWN_BLOCK) return;
  if (event.isCancelled()) return;
  if (!deleteSpawnBlockAt(event.block.location)) return;

  const subTitle = t(event.player, 'spawnblock.removed');
  event.player.sendTitle(' ', subTitle, 10, 40, 20);
});

export function getNearestSpawnBlock(from: Location) {
  if (!view.blocks) return;
  if (view.blocks.length < 1) return;
  const nearest = [];
  let shortestDistance = 99999999;

  for (const objLoc of view.blocks) {
    const loc = objToLocation(objLoc);
    const distance = loc.distance(from);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest.unshift(loc);
    }
  }

  for (const location of nearest) {
    if (location.block.type === VkMaterial.SPAWN_BLOCK) return location.block;
  }
}

function deleteSpawnBlockAt(location: Location) {
  const locObj = locationToObj(location);
  if (!view.blocks) return false;
  let idx = -1;
  for (const spawnBlock of view.blocks) {
    idx++;
    if (spawnBlock.x !== locObj.x) continue;
    if (spawnBlock.y !== locObj.y) continue;
    if (spawnBlock.z !== locObj.z) continue;
    if (spawnBlock.worldId !== locObj.worldId) continue;
    break;
  }
  if (idx < 0) return false;
  view.blocks.splice(idx, 1);
  return true;
}

// Prevent placing of the ender eyes
registerEvent(PlayerInteractEvent, (event) => {
  if (event.clickedBlock?.type !== VkMaterial.SPAWN_BLOCK) return;
  if (event.item?.type === Material.ENDER_EYE) event.setCancelled(true);
});

addTranslation('spawnblock.created', {
  fi_fi: 'Spawn luotu!',
  en_us: 'Spawn created!',
});

addTranslation('spawnblock.removed', {
  fi_fi: 'Spawn poistettu!',
  en_us: 'Spawn removed!',
});
