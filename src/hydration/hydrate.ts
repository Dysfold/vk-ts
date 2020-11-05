import { Float } from 'java.lang';
import { Material } from 'org.bukkit';
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
  const item = event.item;

  const material = item?.type;
  const player = event.player;
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
const drinkers = new Set<Player>();
registerEvent(PlayerInteractEvent, async (event) => {
  if (
    (event.action === Action.RIGHT_CLICK_BLOCK ||
      event.action === Action.RIGHT_CLICK_AIR) &&
    event.hand === EquipmentSlot.HAND
  ) {
    const player = event.player;
    const material = event.item?.type;

    if (material && material !== Material.AIR) return;
    if (drinkers.has(player)) return;

    // Drinking from cauldron
    const block = event.clickedBlock;
    if (block?.type === Material.CAULDRON) {
      const cauldronData = block.blockData as Levelled;
      const waterLevel = cauldronData.level;
      if (waterLevel) {
        cauldronData.setLevel(waterLevel - 1);
        block.setBlockData(cauldronData);
      } else {
        // Cauldron was empty
        return;
      }

      drinkers.add(player);
      hydrate(player, Hydration.MEDIUM, Material.CAULDRON);
      playDrinkingSound(player);

      await stopDrinking(player, 1);
    }

    // Drinking from water block
    const lineOfSight = event.player.getLineOfSight(null, 4);
    if (!lineOfSight) return;
    for (const block of lineOfSight) {
      if (block.type == Material.WATER) {
        drinkers.add(player);
        hydrate(player, Hydration.MEDIUM, Material.WATER);
        playDrinkingSound(player);
        await stopDrinking(player, 2);
      }
    }
  }
});

async function stopDrinking(player: Player, time: number) {
  await wait(time, 'seconds');
  drinkers.delete(player);
  playBurpSound(player);
}

function playBurpSound(player: Player) {
  player.world.playSound(player.location, 'entity.player.burp', 1, 1);
}

export function playDrinkingSound(player: Player) {
  player.world.playSound(player.location, 'entity.generic.drink', 1, 1);
}

export function hydrate(player: Player, amount: number, material: Material) {
  const barBefore = player.exp;
  const bar = limit(barBefore + amount);
  player.exp = (new Float(bar) as unknown) as number;

  // Send title if the hydration was significant enough
  if (amount > Hydration.SMALL) {
    const drink = getName(material);
    let msg = `${drink} helpottaa janoasi`;
    if (bar >= Hydration.MAX) {
      msg = `${drink} sammuttaa janosi`;
    }
    if (barBefore >= Hydration.MAX) {
      msg = `Janosi oli jo sammutettu`;
    }
    player.sendTitle('', msg, 10, 40, 10);
  }
}

function getName(material: Material) {
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
}

function limit(x: number) {
  // Limit the exp number between 0 and 0.99 (1 will be new level)
  return Math.min(Hydration.MAX, Math.max(Hydration.MIN, x));
}
