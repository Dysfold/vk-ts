import { AnvilDamagedEvent } from 'com.destroystokyo.paper.event.block';
import { Material } from 'org.bukkit';
import { FallingBlock, Player } from 'org.bukkit.entity';
import { EntityChangeBlockEvent } from 'org.bukkit.event.entity';
import { InventoryClickEvent, InventoryType } from 'org.bukkit.event.inventory';
import { BlockPlaceEvent } from 'org.bukkit.event.block';
import { Directional } from 'org.bukkit.block.data';
import { BlockFace } from 'org.bukkit.block';

/**
 * Prevent an anvil breaking in use
 */
registerEvent(AnvilDamagedEvent, (event) => {
  event.setCancelled(true);
});

/**
 * Prevent any falling anvil from breaking
 */
const ANVILS = new Set([
  Material.ANVIL,
  Material.CHIPPED_ANVIL,
  Material.DAMAGED_ANVIL,
]);
registerEvent(EntityChangeBlockEvent, async (event) => {
  if (!(event.entity as FallingBlock)) return;
  if (ANVILS.has((event.entity as FallingBlock).blockData.material)) {
    // This is a hack. Other methods did not prevent every anvil type from breaking,
    // but this seems to fix every issue
    (event.entity as FallingBlock).fallDistance = -10000;
  }
});

/**
 * Rotate fermentation barrel (anvil) 90 degrees,
 * so the model is facing the right direction
 *
 * TODO: Move this to the alcohol folder
 */
const FERMENTATION_BARREL = Material.DAMAGED_ANVIL;
const ROTATION = new Map([
  [BlockFace.EAST, BlockFace.NORTH],
  [BlockFace.NORTH, BlockFace.WEST],
  [BlockFace.WEST, BlockFace.SOUTH],
  [BlockFace.SOUTH, BlockFace.EAST],
]);
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === FERMENTATION_BARREL) {
    const anvilData = event.block.blockData as Directional;
    anvilData.facing = ROTATION.get(anvilData.facing) ?? anvilData.facing;
    event.block.blockData = anvilData;
  }
});

/**
 * Make anvill usage free (no exp required)
 */
registerEvent(InventoryClickEvent, async (event) => {
  const inventory = event.inventory;
  if (inventory.type !== InventoryType.ANVIL) return;
  if (event.slot !== 2) return;
  // Player clicked the result slot of an anvil

  const player = (event.whoClicked as unknown) as Player;
  const levelBefore = player.level;

  // Give the player enought levels for any kind of anvil usage
  player.level = 100;

  // Give player his levels back
  await wait(1, 'millis');
  player.level = levelBefore;

  // Updating the inventory because the item on cursor would be invisible
  // because client didn't realize that using the anvil was possible
  player.updateInventory();
});
