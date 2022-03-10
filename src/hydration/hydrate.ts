import { Material, Particle } from 'org.bukkit';
import { Levelled } from 'org.bukkit.block.data';
import { Player } from 'org.bukkit.entity';
import {
  PlayerInteractEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { LockedHandcuffs } from '../combat/handcuffs';
import { isRightClick } from '../common/helpers/click';
import { checkCauldronEvent } from './bottles';
import {
  getPotionQuality,
  getQualityName,
  getWaterQuality,
  WaterQuality,
} from './water-quality';

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
  const quality = getPotionQuality(item);
  switch (material) {
    case Material.POTION:
      hydrate(player, Hydration.MEDIUM, material, quality);
      break;
    case Material.MELON_SLICE:
      hydrate(player, Hydration.SMALL, material, quality);
      break;
  }
});

// When player drinks from block
const drinkers = new Set<Player>();
registerEvent(PlayerInteractEvent, async (event) => {
  if (!isRightClick(event.action)) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  const player = event.player;
  const material = event.item?.type;

  // Additional check to prevent drinking while holding a bottle
  if (player.inventory.itemInMainHand.type === Material.GLASS_BOTTLE) return;
  if (player.inventory.itemInOffHand.type === Material.GLASS_BOTTLE) return;
  if (player.inventory.itemInMainHand.type === Material.POTION) return;
  if (player.inventory.itemInOffHand.type === Material.POTION) return;

  // Player can drink only with empty hand or with handcuffs
  if (event.item) {
    if (material !== Material.AIR && !LockedHandcuffs.check(event.item)) return;
  }
  if (!isThirsty(player)) return;
  if (drinkers.has(player)) return;

  // Drinking from cauldron
  const block = event.clickedBlock;
  if (block?.type === Material.CAULDRON) {
    const cauldronData = block.blockData as Levelled;
    const waterLevel = cauldronData.level;
    if (waterLevel) {
      if (!checkCauldronEvent(block, player, -1)) return;
      cauldronData.level = waterLevel - 1;
      block.blockData = cauldronData;
    } else {
      // Cauldron was empty
      return;
    }

    drinkers.add(player);
    hydrate(player, Hydration.MEDIUM, Material.CAULDRON, 'NORMAL');
    player.swingMainHand();
    playDrinkingEffects(player);

    await stopDrinking(player, 1);
  }

  // Drinking from water block
  const lineOfSight = event.player.getLineOfSight(null, 4);
  if (!lineOfSight) return;
  for (const block of lineOfSight) {
    if (block.type == Material.WATER) {
      drinkers.add(player);
      const quality = getWaterQuality(event);
      hydrate(player, Hydration.MEDIUM, Material.WATER, quality);
      player.swingMainHand();
      playDrinkingEffects(player);

      await stopDrinking(player, 2);
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

export function playDrinkingEffects(player: Player) {
  player.world.playSound(player.location, 'entity.generic.drink', 1, 1);
  const particleLoc = player.eyeLocation.add(player.location.direction);
  player.spawnParticle(Particle.WATER_SPLASH, particleLoc, 1);
}

export function hydrate(
  player: Player,
  amount: number,
  material: Material,
  quality: WaterQuality,
) {
  const barBefore = player.exp;
  const bar = limit(barBefore + amount);
  player.exp = bar;

  // Send title if the hydration was significant enough
  if (amount > Hydration.SMALL) {
    const drink = getName(material, quality);
    let msg = `${drink} helpottaa janoasi`;
    if (bar >= Hydration.MAX) {
      msg = `${drink} sammuttaa janosi`;
    }
    if (barBefore >= Hydration.MAX) {
      msg = `Janosi oli jo sammutettu`;
    }
    player.sendTitle(' ', msg, 10, 40, 10);
  }
}

function isThirsty(player: Player) {
  return player.exp < Hydration.MAX;
}

function getName(material: Material, quality: WaterQuality) {
  let name = '';
  const qualityName = getQualityName(quality);
  name = quality === 'NORMAL' ? '' : qualityName + ' ';
  switch (material) {
    case Material.POTION:
    case Material.CAULDRON:
    case Material.WATER:
      name += 'vesi';
      break;
    case Material.MELON_SLICE:
      name += 'vesimeloni';
      break;
    default:
      name += 'juoma';
      break;
  }
  return capitalizeFirstLetter(name);
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function limit(x: number) {
  // Limit the exp number between 0 and 0.99 (1 will be new level)
  return Math.min(Hydration.MAX, Math.max(Hydration.MIN, x));
}
