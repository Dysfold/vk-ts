import { Material } from 'org.bukkit';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { PotionMeta } from 'org.bukkit.inventory.meta';
import { PotionData, PotionType } from 'org.bukkit.potion';
import { CustomItem } from '../common/items/CustomItem';

const WATER_POTION_DATA = new PotionData(PotionType.WATER, false, false);

const WineGlass = new CustomItem({
  name: 'Viinilasi',
  id: 1,
  modelId: 1,
  type: Material.POTION,
});
const WineGlassEmpty = new CustomItem({
  name: 'Viinilasi',
  id: 1,
  modelId: 1,
  type: Material.GLASS_BOTTLE,
});

const Mug = new CustomItem({
  name: 'Muki',
  id: 2,
  modelId: 2,
  type: Material.POTION,
});
const MugEmpty = new CustomItem({
  name: 'Muki',
  id: 2,
  modelId: 2,
  type: Material.GLASS_BOTTLE,
});

const Scoop = new CustomItem({
  name: 'Kauha',
  id: 3,
  modelId: 3,
  type: Material.POTION,
});
const ScoopEmpty = new CustomItem({
  name: 'Kauha',
  id: 3,
  modelId: 3,
  type: Material.GLASS_BOTTLE,
});

const BOTTLES = new Map<number, { full: ItemStack; empty: ItemStack }>([
  [1, { full: WineGlass.create(), empty: WineGlassEmpty.create() }],
  [2, { full: Mug.create(), empty: MugEmpty.create() }],
  [3, { full: Scoop.create(), empty: ScoopEmpty.create() }],
]);

export function canBreak(item: ItemStack): boolean {
  const unbreakableCustomBottles = [Mug, MugEmpty, Scoop, ScoopEmpty];
  for (const bottle of unbreakableCustomBottles) {
    if (bottle.check(item)) return false;
  }
  return true;
}

function getFullBottle(modelId: number) {
  return BOTTLES.get(modelId)?.full || new ItemStack(Material.POTION);
}
function getEmptyBottle(modelId: number) {
  return BOTTLES.get(modelId)?.empty || new ItemStack(Material.GLASS_BOTTLE);
}

/*
Replace default bottle filling functionality
and re-implement it so we can define the itemMeta of the bottle.
Needed for custom bottle models (wine glass, mug etc.)
because those items would otherwise become normal bottles without custom model data
*/

// Fill a bottle
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.GLASS_BOTTLE) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default glass bottle
  const a = event.action;
  if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

  // Didn't compile? Could this be used instead of setCancelled?
  //event.setUseItemInHand(Result.DENY)
  event.setCancelled(true);
  let bottleCanFill = false;

  const clickedBlock = event.clickedBlock;
  if (clickedBlock) {
    const blockData = clickedBlock.blockData;
    // Check if the block can be used to fill a bottle
    if (blockData instanceof Waterlogged) {
      bottleCanFill = true;
    }
    // Check if cauldron
    else if (blockData instanceof Levelled) {
      // TODO 1.17: Check if the cauldroin contains water instead of lava :)
      if (blockData.level > 0) {
        bottleCanFill = true;
        // Decrease the level of the cauldron
        blockData.level--;
        clickedBlock.blockData = blockData;
      }
    }
    // If the block on the clicked side was water
    const blockNextTo = clickedBlock.getRelative(event.blockFace);
    if (blockNextTo.type === Material.WATER) {
      bottleCanFill = true;
    }
  } else {
    // Check if players line of sight contains water
    const lineOfSight = event.player.getLineOfSight(null, 4);
    if (!lineOfSight) return;
    for (const block of lineOfSight) {
      if (block.type === Material.WATER) {
        bottleCanFill = true;
      }
    }
  }

  if (bottleCanFill) {
    // Get corresponding customitem
    const modelId = event.item.itemMeta.customModelData;
    const potion = getFullBottle(modelId);
    const meta = potion.itemMeta;

    // Clear weird data from the potion (it would be pink)
    (meta as PotionMeta).setBasePotionData(WATER_POTION_DATA);
    potion.itemMeta = meta;

    event.item.amount--;
    giveItem(event.player, potion, event.hand);
  }
});

// Fill a cauldron
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.POTION) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default glass bottle
  const a = event.action;
  if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

  const block = event.clickedBlock;
  if (block?.type !== Material.CAULDRON) return;
  const levelled = block.blockData as Levelled;
  if (levelled.level === levelled.maximumLevel) return;

  // Player is filling a cauldron with custom bottle
  const modelId = event.item.itemMeta.customModelData;
  const bottle = getEmptyBottle(modelId);

  // Wait 1 millis so we dont fire bottle fill event
  await wait(1, 'millis');

  const inventory = event.player.inventory as PlayerInventory;
  if (event.hand === EquipmentSlot.HAND) {
    inventory.itemInMainHand = bottle;
  } else {
    inventory.itemInOffHand = bottle;
  }
});

// Drink a bottle
registerEvent(PlayerItemConsumeEvent, (event) => {
  if (event.item.type !== Material.POTION) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default bottle

  const modelId = event.item.itemMeta.customModelData;
  const replacement = getEmptyBottle(modelId);

  event.replacement = replacement;
});

function giveItem(player: Player, item: ItemStack, hand: EquipmentSlot | null) {
  if (item.type === Material.AIR) return;
  // Prioritice players current hand
  // OffHand
  if (hand === EquipmentSlot.OFF_HAND) {
    if ((player.inventory as PlayerInventory).itemInOffHand.type.isEmpty()) {
      (player.inventory as PlayerInventory).itemInOffHand = item;
      return;
    }
  }
  // MainHand
  else {
    if ((player.inventory as PlayerInventory).itemInMainHand.type.isEmpty()) {
      (player.inventory as PlayerInventory).itemInMainHand = item;
      return;
    }
  }
  const leftOver = player.inventory.addItem(item);
  if (leftOver.size()) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}
