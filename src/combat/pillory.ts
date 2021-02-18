import { PlayerJumpEvent } from 'com.destroystokyo.paper.event.player';
import { Bukkit, Location } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Fence, Slab } from 'org.bukkit.block.data.type';
import { Type } from 'org.bukkit.block.data.type.Slab';
import { Player } from 'org.bukkit.entity';
import { Action, BlockBreakEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent, PlayerJoinEvent } from 'org.bukkit.event.player';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { isHandcuffed, stopDragging } from './handcuffs';

/**
 * The pillory is a device made of a wooden framework erected on a post,
 * with holes for securing the head and hands,
 * formerly used for punishment by public humiliation.
 *  - Wikipedia
 *
 * The pillory in VK is defined as wooden slab on top of fence,
 * and a handcuffed player can be locked into it
 */

// Interval for pillory effects and interval check
const INTERVAL = 5 * 20; // Ticks
const SLOW = new PotionEffect(PotionEffectType.SLOW, INTERVAL, 255);
const JUMP = new PotionEffect(PotionEffectType.JUMP, INTERVAL, -1);
const SLOW_DIGGING = new PotionEffect(
  PotionEffectType.SLOW_DIGGING,
  INTERVAL,
  1,
);

// All online pilloried players in the world
const pillories = new Map<Player, Block>();

/**
 * Lock player to a pillory
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (!isPillory(event.clickedBlock)) return;
  const pilloried = getNearestHandcuffedPlayer(event.player.location);
  if (!pilloried) return;

  const pillory = event.clickedBlock;
  pilloried.sendActionBar('Olet jumissa häpeäpaalussa');
  setPlayerToPillory(pilloried, pillory);
});

function setPlayerToPillory(player: Player, pillory: Block) {
  const direction = player.location.direction;
  const destination = pillory.location.toCenterLocation().add(0, -1.5, 0);
  destination.direction = direction;
  player.teleport(destination);
  pillories.set(player, pillory);
  player.addPotionEffect(SLOW);
  player.addPotionEffect(JUMP);
  player.addPotionEffect(SLOW_DIGGING);
  // If the player was dragged around
  stopDragging(player);
}

/**
 * Free the player from a pillory
 */
registerEvent(BlockBreakEvent, (event) => {
  if (!event.block) return;

  if (
    isPillory(event.block.getRelative(BlockFace.UP)) ||
    isPillory(event.block)
  ) {
    const players = event.block.world.getNearbyPlayers(
      event.block.location.toCenterLocation(),
      0.5,
    );
    for (const player of players) {
      pillories.delete(player);
    }
  }
});

/**
 * Prevent pillored players from jumping
 */
registerEvent(PlayerJumpEvent, (event) => {
  const pillory = pillories.get(event.player);
  if (pillory) {
    setPlayerToPillory(event.player, pillory);
  }
});

/**
 * Delete players from the pillorylist, if they are offline or outside the pillory
 */
setInterval(() => {
  pillories.forEach((pillory, player) => {
    if (!player.isOnline()) {
      pillories.delete(player);
    } else if (!isPillory(pillory.world.getBlockAt(pillory.location))) {
      // The pillory has been removed
      pillories.delete(player);
    } else {
      // The player is still in the pillory
      setPlayerToPillory(player, pillory);
    }
  });
}, INTERVAL * 50);

/**
 * Set player to pillory, if he joins inside one
 */
registerEvent(PlayerJoinEvent, (event) => {
  const player = event.player;
  if (isHandcuffed(player)) {
    if (isPillory(player.eyeLocation.block)) {
      player.sendActionBar('Olet jumissa häpeäpaalussa');

      setPlayerToPillory(player, player.eyeLocation.block);
    }
  }
});

/**
 * If there is any pilloried players when plugin starts -> add them to the list
 */
for (const player of Bukkit.server.onlinePlayers) {
  const block = player.eyeLocation.block;
  if (isPillory(block)) {
    setPlayerToPillory(player, block);
  }
}

/**********************
 * Helpers
 **********************/

function isPillory(block: Block | null): block is Block {
  if (!block) return false;
  if (!(block.blockData instanceof Slab)) return false;
  if ((block.blockData as Slab).type !== Type.BOTTOM) return false;
  const blockBelow = block.getRelative(BlockFace.DOWN);
  if (!(blockBelow.blockData instanceof Fence)) return false;
  return true;
}

function getNearestHandcuffedPlayer(location: Location) {
  const players = location.world.getNearbyPlayers(location, 3);
  for (const player of players) {
    if (isHandcuffed(player)) {
      return player;
    }
  }
  return;
}
