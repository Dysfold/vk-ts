import { Bukkit, GameMode } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { minMax } from '../common/helpers/math';

// Min weight to start drowning (with minimum force)
// 1 full row of blocks is ~4600
// Full inventory of blocks is ~18000
const MIN_WEIGHT = 7000;
// Weight for maximum drowning force
const MAX_WEIGHT = 13000;

const drowningPlayers = new Map<Player, number>();

// Find all players who should drown
setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    if (isSwimming(player)) {
      const weight = getWeight(player);
      // Add player to list of players who should drown
      if (weight > MIN_WEIGHT) {
        drowningPlayers.set(player, weight);
        player.sendActionBar('§cEt jaksa uida');
      }
    }
  }
}, 2000);

// Apply drowning force to all players who should drown
// This is in separate interval, because this needs to apply more frequently (smoother)
setInterval(() => {
  drowningPlayers.forEach((weight, player) => {
    if (!isSwimming(player)) drowningPlayers.delete(player);
    else if (!player.isOnline()) drowningPlayers.delete(player);
    else drown(player, weight);
  });
}, 300);

// Weight for each armor piece player is using
const WORN_ARMOR_WEIGHT = 64;
// Weight normal items in inventory
const ITEM_WEIGHT = 6;
// Weight blocks items in inventory
const BLOCK_WEIGHT = 8;

/**
 * Calculate the weight of the inventory/player
 */
function getWeight(swimmer: Player) {
  let weight = 0;
  swimmer.inventory.contents.forEach((item) => (weight += getItemWeight(item)));
  swimmer.inventory.armorContents.filter(
    (item) => (weight += item ? WORN_ARMOR_WEIGHT : 0),
  );
  swimmer.sendMessage('...' + weight);
  return weight;
}

/**
 * Check if player is swimming. The animation is not required
 * @param player Player to be checked
 */
function isSwimming(player: Player) {
  if (player.gameMode === GameMode.CREATIVE) return false;
  if (player.gameMode === GameMode.SPECTATOR) return false;
  return player.isInWater() && !player.isOnGround();
}

/**
 * Get the weight of an itemstack
 * @param item Item in the inventory
 */
function getItemWeight(item: ItemStack | null) {
  if (!item) return 0;
  const n = item.amount;
  return item.type.isBlock() ? n * BLOCK_WEIGHT : n * ITEM_WEIGHT;
}

/**
 * Apply drowning force once
 * @param player Player to be drowned
 * @param weight Weight of the inventory
 */
function drown(player: Player, weight: number) {
  const scale = minMax(weight, MIN_WEIGHT, MAX_WEIGHT);
  const velocity = player.velocity;
  velocity.y -= scale * scale;
  player.velocity = velocity;
}
