import { Bukkit, Sound } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { isMoltenMetal } from './blacksmith';

// Check if player is holding molten metal
setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    const inventory = player.inventory;

    // Mainhand
    if (isMoltenMetal(inventory.itemInMainHand)) {
      playerBurnHand(player, inventory.itemInMainHand);
    }
    // Offhand
    else if (isMoltenMetal(inventory.itemInOffHand)) {
      playerBurnHand(player, inventory.itemInOffHand);
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
    0.6,
    1,
  );
}
