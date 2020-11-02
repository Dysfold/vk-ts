import { Material, TreeSpecies } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Boat, EntityType, Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent, PlayerJoinEvent } from 'org.bukkit.event.player';
import { VehicleEnterEvent } from 'org.bukkit.event.vehicle';
import { ItemStack } from 'org.bukkit.inventory';

const boaters = new Set<Player>();

const BOAT_ITEMS = new Map<TreeSpecies, ItemStack>([
  [TreeSpecies.GENERIC, new ItemStack(Material.OAK_BOAT)],
  [TreeSpecies.REDWOOD, new ItemStack(Material.SPRUCE_BOAT)],
  [TreeSpecies.BIRCH, new ItemStack(Material.BIRCH_BOAT)],
  [TreeSpecies.JUNGLE, new ItemStack(Material.JUNGLE_BOAT)],
  [TreeSpecies.DARK_OAK, new ItemStack(Material.DARK_OAK_BOAT)],
  [TreeSpecies.ACACIA, new ItemStack(Material.ACACIA_BOAT)],
]);
const DEFAULT_BOAT = new ItemStack(Material.OAK_BOAT);

// How often players riding on boats are checked (in seconds)
const BOAT_INTERVAL = 10;

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;

  if (!event.item?.type.toString().includes('_BOAT')) return;

  const block = event.clickedBlock;
  if (!block) return;

  const relative = block.getRelative(event.blockFace);
  if (block.type === Material.WATER || relative.type === Material.WATER) return;

  event.setCancelled(true);
});

// Don't allow players to enter vehicles on land
registerEvent(VehicleEnterEvent, (event) => {
  if (event.vehicle.type !== EntityType.BOAT) return;
  if (event.entered.type === EntityType.PLAYER) {
    boaters.add(event.entered as Player);
    removeIfOnLand(event.vehicle as Boat);
  }
});

registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (player.vehicle?.type === EntityType.BOAT) {
    boaters.add(player);
  }
});

// VechicleMoveEvent is called multiple times each second
// -> Use interval for checking boaters to reduce lag
setInterval(() => {
  boaters.forEach((boater) => {
    if (!boater.isOnline()) {
      boaters.delete(boater);
    } else if (boater.vehicle?.type !== EntityType.BOAT) {
      boaters.delete(boater);
    } else {
      removeIfOnLand(boater.vehicle as Boat);
    }
  });
}, BOAT_INTERVAL * 1000);

function removeIfOnLand(boat: Boat) {
  const block = boat.location.add(0, -0.2, 0).block;
  const blockType = block.type;

  if (blockType === Material.WATER) return;
  if (block.getRelative(BlockFace.UP).type === Material.WATER) return;
  if (
    blockType === Material.AIR &&
    block.getRelative(BlockFace.DOWN).type === Material.WATER
  ) {
    return;
  }

  boat.remove();
  boat.world.dropItemNaturally(
    boat.location,
    BOAT_ITEMS.get(boat.woodType) || DEFAULT_BOAT,
  );
  return;
}
