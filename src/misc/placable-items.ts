import { GameMode, Location, Material } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { spawnHolderArmorStand } from '../common/entities/armor-stand';
import { giveItem } from '../common/helpers/inventory';
import { VkMaterial } from '../common/items/VkMaterial';

/**
 * Allow specific items to be placed on the table as decorations.
 * Items like: bottles, bowls, books
 */

const PLACABLE_MATERIALS = new Set([
  Material.GLASS_BOTTLE,
  Material.POTION,
  Material.BOOK,
  Material.WRITABLE_BOOK,
  Material.WRITTEN_BOOK,

  Material.BOWL,
  Material.BEETROOT_SOUP,
  Material.SUSPICIOUS_STEW,
  Material.MUSHROOM_STEW,
  Material.RABBIT_STEW,
]);

const TABLES = new Set([
  Material.OAK_PLANKS,
  Material.SPRUCE_PLANKS,
  Material.BIRCH_PLANKS,
  Material.JUNGLE_PLANKS,
  VkMaterial.WILLOW_PLANKS,
  Material.DARK_OAK_PLANKS,

  Material.OAK_SLAB,
  Material.SPRUCE_SLAB,
  Material.BIRCH_SLAB,
  Material.JUNGLE_SLAB,
  VkMaterial.WILLOW_SLAB,
  Material.DARK_OAK_SLAB,

  Material.WARPED_SLAB,

  Material.OAK_STAIRS,
  Material.SPRUCE_STAIRS,
  Material.BIRCH_STAIRS,
  Material.JUNGLE_STAIRS,
  VkMaterial.WILLOW_STAIRS,
  Material.DARK_OAK_STAIRS,
]);

/**
 * Check if the item can be placed on the ground
 */
function isPlacableItem(item: ItemStack | null): item is ItemStack {
  if (!item) return false;
  return PLACABLE_MATERIALS.has(item.type);
}

/**
 * Check if items can be placed on this block
 */
function isValidSurface(block: Block | null): block is Block {
  if (!block) return false;
  return TABLES.has(block.type);
}

/**
 * Place item on the ground
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.blockFace !== BlockFace.UP) return;
  if (!isValidSurface(event.clickedBlock)) return;
  if (!isPlacableItem(event.item)) return;

  const location = getClickedLocation(event.player);
  if (!location) return;
  if (!isValidSurface(location.block.getRelative(BlockFace.DOWN))) return;

  event.setCancelled(true);

  if (containsTooManyItems(location)) {
    warnTooManyItems(event.player);
    return;
  }

  spawnHolderArmorStand(location, event.item);
  if (event.player.gameMode !== GameMode.CREATIVE) event.item.amount--;
});

/**
 * Gets the exact clicked position
 * @param player Player who clicked
 */
function getClickedLocation(player: Player) {
  const raytrace = player.rayTraceBlocks(4);
  if (!raytrace) return;
  // Additional check for the material
  const position = raytrace.hitPosition;
  return position.toLocation(
    player.world,
    player.location.yaw,
    player.location.pitch,
  );
}

const RADIUS = 0.5;
const MAX_ITEMS_IN_RADIUS = 2;
/**
 * Checks if the location has too many (armorstand) items on the ground
 * @param location Clicked location
 */
function containsTooManyItems(location: Location) {
  let items = 0;
  const entities = location.getNearbyEntities(RADIUS, RADIUS, RADIUS);
  for (const entity of entities) {
    if (!(entity instanceof ArmorStand)) continue;
    if (entity.isVisible()) continue;
    const item = entity.getItem(EquipmentSlot.HEAD);
    if (isPlacableItem(item)) {
      items++;
    }
    if (items >= MAX_ITEMS_IN_RADIUS) {
      return true;
    }
  }
  return false;
}

function warnTooManyItems(player: Player) {
  player.sendActionBar('§cTähän ei mahdu uutta esinettä');
}

/**
 * Pick up the item
 */
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  if (
    !event.player.inventory.itemInMainHand.type.isEmpty() &&
    !event.player.inventory.itemInMainHand.type.isEmpty()
  )
    return;
  if (event.rightClicked.type !== EntityType.ARMOR_STAND) return;
  let armorStand = event.rightClicked as ArmorStand;
  if (!armorStand.isInvisible()) return;
  if (!armorStand.isValid()) return;

  // Check if the player actually clicked close enough
  // This makes the picking up more realistic
  const location = getClickedLocation(event.player);
  if (!location) return;
  const entities = location.getNearbyEntities(0.15, 0.15, 0.15);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      armorStand = entity as ArmorStand;
      break;
    }
  }
  const distance = location.distance(armorStand.location);
  if (distance > 0.3) return;

  const item = armorStand.getItem(EquipmentSlot.HEAD);
  if (!isPlacableItem(item)) return;
  giveItem(event.player, item, event.hand);
  armorStand.remove();
});
