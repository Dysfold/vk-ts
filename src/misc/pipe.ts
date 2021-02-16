import { Material, Particle, Sound, SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';
import { Damageable, ItemMeta } from 'org.bukkit.inventory.meta';
import { CustomItem } from '../common/items/CustomItem';

export const DriedTobacco = new CustomItem({
  id: 11,
  modelId: 11,
  type: Material.SHULKER_SHELL,
  name: 'Kuivattu tupakka',
});

export const Pipe = new CustomItem({
  id: 24,
  modelId: 24,
  type: Material.LEATHER_BOOTS,
  name: 'Piippu',
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
    const a = event.action;
    if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

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

function useFlintAndSteel(player: Player, item: ItemStack) {
  const meta = (item.itemMeta as unknown) as Damageable;
  meta.damage++;
  item.itemMeta = (meta as unknown) as ItemMeta;

  // Check if the tools breaks. 64 -> broken item
  if (meta.damage >= 64) {
    item.amount = 0;
    player.world.playSound(
      player.location,
      Sound.ENTITY_ITEM_BREAK,
      SoundCategory.PLAYERS,
      1,
      1,
    );
  }
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
  const meta = item.itemMeta;
  const lore = meta.lore;
  if (!lore) return 0;
  // Parse the percentage from the lore
  const line = lore[0];
  const percentage = parseLore(line);
  return Number(percentage) || 0;
}

function changeTobaccoLevel(item: ItemStack, amount: number) {
  const meta = item.itemMeta;
  const lore = meta.lore;
  let percentage = 0;
  if (lore) {
    // Parse the percentage from the lore
    const line = lore[0];
    percentage = Number(parseLore(line)) || 0;
  }
  // Add the amount, but limit the number to 0-100
  percentage = Math.max(Math.min(percentage + amount, 100), 0);

  const newLore = [createLore(percentage)];
  meta.lore = newLore;
  item.itemMeta = meta;
}

function parseLore(str: string) {
  // Lore looks like this "§r§7100%", so we take the string between "7" and "%"
  return str.substring(str.indexOf('7') + 1, str.indexOf('%'));
}

function createLore(number: number) {
  return '§r§7' + number + '%';
}

setInterval(() => {
  smokers.forEach((player) => {
    const pipe = (player.inventory as PlayerInventory).helmet;
    if (!pipe || !Pipe.check(pipe)) {
      smokers.delete(player);
      return;
    } else {
      playSmokeParticles(player);
      const level = getTobaccoLevel(pipe);
      if (level >= TOBACCO_LEVEL_CHANGE) {
        changeTobaccoLevel(pipe, -TOBACCO_LEVEL_CHANGE);
      } else {
        smokers.delete(player);
      }
    }
  });
}, INTERVAL);

function playSmokeParticles(player: Player) {
  const location = player.location;
  location.y += 1.8; // Offset to eye height

  // Smoke particles relative to players direction -> to the pipe
  const offset = player.location.direction.multiply(0.7);
  offset.rotateAroundY(-0.4);

  location.add(offset);
  player.world.spawnParticle(Particle.SMOKE_LARGE, location, 0, 0, 0.03, 0);
}
