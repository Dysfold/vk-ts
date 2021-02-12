import { Material, Particle, Sound, Location } from 'org.bukkit';
import {
  PlayerAttemptPickupItemEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import * as yup from 'yup';
import { Item, Player } from 'org.bukkit.entity';
import { giveItem } from '../common/helpers/inventory';
import { isRightClick } from '../common/helpers/click';

const FUZE_TICK_DELAY = 500; // ms
const SMOKE_PARTICLE_COUNT = 400;
const BOMB_VEL_MULTIPLIER = 0.5;

const Bomb = new CustomItem({
  id: 2,
  name: 'Lankapommi',
  type: Material.GOLDEN_HORSE_ARMOR,
  modelId: 2,
  data: {
    lit: yup.boolean(),
    fuzeLeft: yup.number(),
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
  'smokeBomb',
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
    await wait(1000, 'millis');
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

function dropBomb(player: Player, item: ItemStack) {
  const droppedBomb = player.world.dropItem(
    player.location.add(0, 1.4, 0),
    item,
  );
  item.amount--;
  droppedBomb.setInvulnerable(true);
  droppedBomb.velocity = player.eyeLocation.direction.multiply(
    BOMB_VEL_MULTIPLIER,
  );
  player.world.playSound(player.location, Sound.ITEM_FLINTANDSTEEL_USE, 1, 1);
  tickFuzeThenDetonate(droppedBomb);
}

registerEvent(PlayerInteractEvent, (event) => {
  if (!event.item) return;
  if (!isRightClick(event.action)) return;
  if (event.hand !== EquipmentSlot.HAND) return;

  const player = event.player;
  const inv = player.inventory as PlayerInventory;
  const offHand = inv.itemInOffHand;
  const mainHand = inv.itemInMainHand;

  if (offHand.type === Material.FLINT_AND_STEEL) {
    if (Bomb.check(mainHand)) {
      dropBomb(player, mainHand);
    }
  } else if (mainHand.type === Material.FLINT_AND_STEEL) {
    if (Bomb.check(offHand)) {
      dropBomb(player, offHand);
    }
  }
});

registerEvent(PlayerAttemptPickupItemEvent, (event) => {
  const bomb = Bomb.get(event.item.itemStack);
  if (bomb && bomb.lit) event.setCancelled(true);
});
