import { translate } from 'craftjs-plugin/chat';
import { Location, Material, Particle, Sound } from 'org.bukkit';
import { Dispenser } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { EntityType, Item, Player } from 'org.bukkit.entity';
import { BlockDispenseEvent } from 'org.bukkit.event.block';
import { EntityCombustEvent } from 'org.bukkit.event.entity';
import {
  PlayerAttemptPickupItemEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import * as yup from 'yup';
import { isRightClick } from '../common/helpers/click';
import { giveItem } from '../common/helpers/inventory';
import { useFlintAndSteel } from '../common/helpers/items';
import { CustomItem } from '../common/items/CustomItem';

const FUZE_TICK_DELAY = 500; // ms
const SMOKE_PARTICLE_COUNT = 400;
const SMOKE_SPAWN_DELAY = 1000; // ms
const BOMB_VEL_MULTIPLIER = 0.5;

const Bomb = new CustomItem({
  id: 2,
  name: translate('vk.bomb'),
  type: Material.GOLDEN_HORSE_ARMOR,
  data: {
    lit: yup.boolean(),
    fuzeLeft: yup.number().required(),
    isSmokeBomb: yup.boolean(),
  },
});

// ########## COMMANDS - DEVELOPMENT ONLY #############
registerCommand(
  'bomb',
  (sender) => {
    if (!(sender instanceof Player)) return;
    const player = sender as Player;
    const bomb = Bomb.create({ lit: false, fuzeLeft: 10, isSmokeBomb: false });
    giveItem(player, bomb, player.mainHand);
  },
  {
    executableBy: 'players',
  },
);

registerCommand(
  'smokebomb',
  (sender) => {
    if (!(sender instanceof Player)) return;
    const player = sender as Player;
    const bomb = Bomb.create({ lit: false, fuzeLeft: 10, isSmokeBomb: true });
    giveItem(player, bomb, player.mainHand);
  },
  {
    executableBy: 'players',
  },
);
// ######################################################

function playFuzeEffects(droppedBomb: Item) {
  droppedBomb.world.playSound(
    droppedBomb.location,
    Sound.ENTITY_CREEPER_PRIMED,
    1,
    1,
  );
  droppedBomb.world.spawnParticle(
    Particle.CAMPFIRE_COSY_SMOKE,
    droppedBomb.location.add(0, 1, 0),
    1,
    0,
    0,
    0,
    0,
  );
}

async function deploySmoke(loc: Location) {
  for (let i = 0; i < 5; i++) {
    loc.world.spawnParticle(
      Particle.CAMPFIRE_SIGNAL_SMOKE,
      loc,
      SMOKE_PARTICLE_COUNT,
      0.8,
      0.8,
      0.8,
      0,
    );
    await wait(SMOKE_SPAWN_DELAY, 'millis');
  }
}

async function detonateBomb(droppedBomb: Item) {
  const { x, y, z } = droppedBomb.location;
  const bomb = Bomb.get(droppedBomb.itemStack);
  if (bomb && bomb.isSmokeBomb) {
    // Detonate Smoke bomb
    droppedBomb.world.playSound(
      droppedBomb.location,
      Sound.BLOCK_LAVA_EXTINGUISH,
      1,
      1,
    );
    deploySmoke(droppedBomb.location.add(0, 1, 0));
  } else {
    // Detonate Normal bomb
    droppedBomb.world.createExplosion(x, y, z, 2, false, false);
  }
  droppedBomb.remove();
}

async function tickFuzeThenDetonate(droppedBomb: Item) {
  const bomb = Bomb.get(droppedBomb.itemStack);
  if (!bomb) {
    droppedBomb.remove();
    return;
  }
  bomb.lit = true;
  while (bomb.fuzeLeft > 0 && droppedBomb.isValid()) {
    await wait(FUZE_TICK_DELAY, 'millis');
    bomb.fuzeLeft--;
    playFuzeEffects(droppedBomb);
  }
  detonateBomb(droppedBomb);
}

function dropBomb(loc: Location, vel: Vector, item: ItemStack) {
  const droppedBomb = loc.world.dropItem(loc, item);
  item.amount--;
  droppedBomb.setInvulnerable(true);
  droppedBomb.velocity = vel;
  loc.world.playSound(loc, Sound.ITEM_FLINTANDSTEEL_USE, 1, 1);
  tickFuzeThenDetonate(droppedBomb);
}

// Player throw bomb event
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.item) return;
  if (!isRightClick(event.action)) return;
  if (event.hand !== EquipmentSlot.HAND) return;

  const player = event.player;
  const inv = player.inventory as PlayerInventory;
  const offHand = inv.itemInOffHand;
  const mainHand = inv.itemInMainHand;
  const eyeDir = player.eyeLocation.direction;
  const dropLoc = player.location.add(0, 1.2, 0);

  if (offHand.type === Material.FLINT_AND_STEEL) {
    if (Bomb.check(mainHand)) {
      player.swingMainHand();
      useFlintAndSteel(player, offHand);
      dropBomb(dropLoc, eyeDir.multiply(BOMB_VEL_MULTIPLIER), mainHand);
    }
  } else if (mainHand.type === Material.FLINT_AND_STEEL) {
    if (Bomb.check(offHand)) {
      player.swingOffHand();
      useFlintAndSteel(player, mainHand);
      dropBomb(dropLoc, eyeDir.multiply(BOMB_VEL_MULTIPLIER), offHand);
    }
  }
});

// Bomb dispense event
registerEvent(BlockDispenseEvent, async (event) => {
  const item = event.item;
  if (!Bomb.check(item)) return;
  event.setCancelled(true);
  const vel = event.velocity;
  const dispenser = event.block.state as Dispenser;
  const blockdata = event.block.blockData as Directional;
  const dispenseLoc = event.block.location
    .toCenterLocation()
    .add(blockdata.facing.direction);
  await wait(1, 'ticks');
  dispenser.inventory.removeItem(item);
  dropBomb(dispenseLoc, vel, item);
});

// Prevent picking up lit bombs
registerEvent(PlayerAttemptPickupItemEvent, (event) => {
  const bomb = Bomb.get(event.item.itemStack);
  if (bomb && bomb.lit) event.setCancelled(true);
});

registerEvent(EntityCombustEvent, (event) => {
  if (event.entityType !== EntityType.DROPPED_ITEM) return;
  const item = event.entity as Item;
  const bomb = Bomb.get(item.itemStack);
  if (bomb && bomb.lit) {
    item.remove(); // This will detonate the bomb
  }
});
