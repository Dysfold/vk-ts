import { translate } from 'craftjs-plugin/chat';
import { Material, Particle, Sound, SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { isRightClick } from '../common/helpers/click';
import { useFlintAndSteel } from '../common/helpers/items';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

export const DriedTobacco = new CustomItem({
  id: 11,
  type: VkItem.MISC,
  name: translate('vk.dried_tobacco'),
});

export const Pipe = new CustomItem({
  id: 24,
  type: VkItem.HAT,
  name: translate('vk.pipe'),
  data: {
    tobaccoLevel: yup.number().default(0),
  },
});

const smokers = new Set<Player>();

// How many percentages the pipe level changes per tobacco item
const PIPE_FILL_LEVEL_CHANGE = 50;

// How much tobacco level changes per interval
const TOBACCO_LEVEL_CHANGE = 0.5;
const INTERVAL = 2000; // millis

Pipe.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (!isRightClick(event.action)) return;

    const player = event.player;
    const inventory = player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;
    const mainHand = inventory.itemInMainHand;
    let tobacco;

    if (DriedTobacco.check(offHand)) {
      tobacco = offHand;
    } else if (DriedTobacco.check(mainHand)) {
      tobacco = mainHand;
    } else {
      return;
    }

    const pipe = event.item;
    if (!pipe) return;

    const percentage = getTobaccoLevel(pipe);
    if (percentage >= 100) return;
    changeTobaccoLevel(pipe, PIPE_FILL_LEVEL_CHANGE);
    tobacco.amount--;
  },
);

// Function for hat script to check if player is trying to fill the pipe
export function equipPipe(player: Player) {
  const inv = player.inventory as PlayerInventory;
  const offHand = inv.itemInOffHand;
  const mainHand = inv.itemInMainHand;
  if (DriedTobacco.check(offHand)) return false;
  if (DriedTobacco.check(mainHand)) return false;

  if (offHand.type === Material.FLINT_AND_STEEL) {
    useFlintAndSteel(player, offHand);
    startSmoking(player);
  } else if (mainHand.type === Material.FLINT_AND_STEEL) {
    useFlintAndSteel(player, mainHand);
    startSmoking(player);
  }
  return true;
}

function startSmoking(player: Player) {
  player.world.playSound(
    player.location,
    Sound.ITEM_FLINTANDSTEEL_USE,
    SoundCategory.PLAYERS,
    1,
    1,
  );
  smokers.add(player);
}

function getTobaccoLevel(item: ItemStack) {
  return Pipe.get(item)?.tobaccoLevel ?? 0;
}

function changeTobaccoLevel(item: ItemStack, amount: number) {
  const data = Pipe.get(item);
  let percentage = data?.tobaccoLevel ?? 0;
  if (!data) return;

  // Add the amount, but limit the number to 0-100
  percentage = Math.max(Math.min(percentage + amount, 100), 0);
  data.tobaccoLevel = percentage;

  const meta = item.itemMeta;
  meta.lore = createLore(percentage);
  item.itemMeta = meta;

  return item;
}

function createLore(number: number) {
  return ['§r§7' + number + '%'];
}

setInterval(() => {
  smokers.forEach((player) => {
    const pipe = player.inventory.helmet;
    if (!isPipe(pipe)) {
      smokers.delete(player);
      return;
    }

    const level = getTobaccoLevel(pipe);
    if (level >= TOBACCO_LEVEL_CHANGE) {
      changeTobaccoLevel(pipe, -TOBACCO_LEVEL_CHANGE);
      playSmokeParticles(player);
      return;
    }

    smokers.delete(player);
  });
}, INTERVAL);

function isPipe(item: ItemStack | null): item is ItemStack {
  return !!item && Pipe.check(item);
}

function playSmokeParticles(player: Player) {
  const location = player.location;
  location.y += 1.8; // Offset to eye height

  // Smoke particles relative to players direction -> to the pipe
  const offset = player.location.direction.multiply(0.7);
  offset.rotateAroundY(-0.4);

  location.add(offset);
  player.world.spawnParticle(Particle.SMOKE_LARGE, location, 0, 0, 0.03, 0);
}
