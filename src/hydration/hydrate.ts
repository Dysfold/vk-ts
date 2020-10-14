import { Float } from 'java.lang';
import { List } from 'java.util';
import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Levelled } from 'org.bukkit.block.data';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';

const Hydration = {
  MAX: 0.99,
  MIN: 0.0,
  HUGE: 0.4,
  MEDIUM: 0.25,
  SMALL: 0.05,
};

// When player drinks (bottles etc)
registerEvent(PlayerItemConsumeEvent, (event) => {
  const item = event.getItem();

  const material = item?.getType();
  const player = event.getPlayer();
  switch (material) {
    case Material.POTION:
      hydrate(player, Hydration.MEDIUM, material);
      break;
    case Material.MELON_SLICE:
      hydrate(player, Hydration.SMALL, material);
      break;
  }
});

// When player drinks from block
const drinkers: Player[] = [];
registerEvent(PlayerInteractEvent, (event) => {
  if (
    (event.action === Action.RIGHT_CLICK_BLOCK ||
      event.action === Action.RIGHT_CLICK_AIR) &&
    event.getHand() === EquipmentSlot.HAND
  ) {
    const player = event.getPlayer();
    const material = player.getItemInHand().getType();

    if (material !== Material.AIR) return;
    if (drinkers.indexOf(player) !== -1) return;

    // Drinking from cauldron
    const block = event.getClickedBlock();
    if (block?.getType() === Material.CAULDRON) {
      const cauldronData: Levelled = block.getBlockData() as Levelled;
      const waterLevel = cauldronData.getLevel();
      if (waterLevel) {
        cauldronData.setLevel(waterLevel - 1);
        block.setBlockData(cauldronData);
      } else {
        // Cauldron was empty
        return;
      }

      drinkers.push(player);
      hydrate(player, Hydration.MEDIUM, Material.CAULDRON);
      playDrinkingSound(player);
      setTimeout(() => {
        stopDrinking(player);
      }, 1000);
    }

    // Drinking from water block
    const lineOfSight: List<Block> | null = event
      .getPlayer()
      .getLineOfSight(null, 4);
    if (!lineOfSight) return;
    for (const block of lineOfSight) {
      if (block.getType() == Material.WATER) {
        drinkers.push(player);
        hydrate(player, Hydration.MEDIUM, Material.WATER);
        playDrinkingSound(player);
        setTimeout(() => {
          stopDrinking(player);
        }, 2000);
        return;
      }
    }
  }
});

const stopDrinking = (player: Player) => {
  const idx = drinkers.indexOf(player);
  if (idx !== -1) {
    drinkers.splice(idx, 1);
    playBurpSound(player);
  }
};

const playBurpSound = (player: Player) => {
  player.world.playSound(player.location, 'entity.player.burp', 1, 1);
};

const playDrinkingSound = (player: Player) => {
  player.world.playSound(player.location, 'entity.generic.drink', 1, 1);
};

const hydrate = (player: Player, amount: number, material: Material) => {
  const barBefore = player.getExp();
  const barAfter = limit(barBefore + amount);
  player.setExp((new Float(barAfter) as unknown) as number);

  // Send title if the hydration was significant enough
  if (amount > Hydration.SMALL) {
    const drink = getName(material);
    let msg = `${drink} helpottaa janoasi`;
    if (barAfter >= Hydration.MAX) {
      msg = `${drink} sammuttaa janosi`;
    }
    if (barBefore >= Hydration.MAX) {
      msg = `Janosi oli jo sammutettu`;
    }
    player.sendTitle('', msg, 10, 40, 10);
  }
};

const getName = (material: Material) => {
  switch (material) {
    case Material.POTION:
    case Material.CAULDRON:
    case Material.WATER:
      return 'Vesi';
    case Material.MELON_SLICE:
      return 'Vesimeloni';
    default:
      return 'Juoma';
  }
};

const limit = (x: number) => {
  // Limit the exp number between 0 and 0.99 (1 will be new level)
  return Math.min(Hydration.MAX, Math.max(Hydration.MIN, x));
};
