import { Bukkit, GameMode, Sound, SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { isMoltenMetal } from './blacksmith';

// Check if player is holding molten metal and then burn the hand
setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    if (isImmuneToHandBurn(player)) continue;

    const { itemInMainHand, itemInOffHand } = player.inventory;

    // Mainhand
    if (isMoltenMetal(itemInMainHand)) {
      playerBurnHand(player, itemInMainHand);
    }
    // Offhand
    else if (isMoltenMetal(itemInOffHand)) {
      playerBurnHand(player, itemInOffHand);
    }
  }
}, 2000);

function playerBurnHand(player: Player, item: ItemStack) {
  player.damage(1);
  player.fireTicks = 10;

  const dropLocation = player.location;
  const offset = player.location.direction;
  offset.y = 0;
  dropLocation.add(offset);
  const drop = player.world.dropItemNaturally(dropLocation, item);

  drop.pickupDelay = 40;
  item.amount = 0;

  player.world.playSound(
    player.location,
    Sound.ENTITY_PLAYER_HURT_ON_FIRE,
    SoundCategory.PLAYERS,
    0.6,
    1,
  );
}

/**
 * Check if player is immune to burning his hand (creative)
 * @param player Player to be checked
 * @returns True or false
 */
function isImmuneToHandBurn(player: Player) {
  return player.gameMode == GameMode.CREATIVE;
}
