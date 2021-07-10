import { text, translate } from 'craftjs-plugin/chat';
import { Bukkit, Location, Material, SoundCategory } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Entity, Player } from 'org.bukkit.entity';
import { Action, CauldronLevelChangeEvent } from 'org.bukkit.event.block';
import { ChangeReason } from 'org.bukkit.event.block.CauldronLevelChangeEvent';
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
import { isRightClick } from '../common/helpers/click';
import { giveItem } from '../common/helpers/inventory';
import { centerOf } from '../common/helpers/locations';
import { CustomItem } from '../common/items/CustomItem';
import { addTranslation, t } from '../common/localization/localization';
import {
  canFillCauldron,
  getPotionData,
  getWaterQuality,
  WaterQuality,
} from './water-quality';

export const WineGlass = new CustomItem({
  name: translate('vk.wine_glass'),
  id: 1,
  type: Material.POTION,
});

export const WineGlassEmpty = new CustomItem({
  name: translate('vk.wine_glass'),
  id: 1,
  type: Material.GLASS_BOTTLE,
});

export const Mug = new CustomItem({
  name: translate('vk.mug'),
  id: 2,
  type: Material.POTION,
});

export const MugEmpty = new CustomItem({
  name: translate('vk.mug'),
  id: 2,
  type: Material.GLASS_BOTTLE,
});

export const Scoop = new CustomItem({
  name: translate('vk.scoop'),
  id: 3,
  type: Material.POTION,
});

export const ScoopEmpty = new CustomItem({
  name: translate('vk.scoop'),
  id: 3,
  type: Material.GLASS_BOTTLE,
});

export const GlassMug = new CustomItem({
  name: translate('vk.glass_mug'),
  id: 4,
  type: Material.POTION,
});

export const GlassMugEmpty = new CustomItem({
  name: translate('vk.glass_mug'),
  id: 4,
  type: Material.GLASS_BOTTLE,
});

// prettier-ignore
const BOTTLES = new Map<number, { full: ItemStack; empty: ItemStack }>([
  [1, { full: WineGlass.create({}),   empty: WineGlassEmpty.create({}) }],
  [2, { full: Mug.create({}),         empty: MugEmpty.create({}) }],
  [3, { full: Scoop.create({}),       empty: ScoopEmpty.create({}) }],
  [4, { full: GlassMug.create({}),    empty: GlassMugEmpty.create({}) }],
]);

export function canBreak(item: ItemStack): boolean {
  const unbreakableCustomBottles = [Mug, MugEmpty, Scoop, ScoopEmpty];
  for (const bottle of unbreakableCustomBottles) {
    if (bottle.check(item)) return false;
  }
  return true;
}

export function getFullBottle(item: ItemStack) {
  const modelId = item?.itemMeta.hasCustomModelData()
    ? item?.itemMeta.customModelData
    : 0;

  return BOTTLES.get(modelId)?.full || new ItemStack(Material.POTION);
}

export function getEmptyBottle(item?: ItemStack) {
  const modelId = item?.itemMeta.hasCustomModelData()
    ? item?.itemMeta.customModelData
    : 0;

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
  if (!isRightClick(event.action)) return;

  event.setCancelled(true);
  let bottleCanFill = false;
  let waterQuality: WaterQuality | undefined = undefined;

  let clickedBlock = event.clickedBlock;
  if (clickedBlock) {
    const blockData = clickedBlock.blockData;
    // Check if the block can be used to fill a bottle
    if (blockData instanceof Waterlogged) {
      bottleCanFill = blockData.isWaterlogged();
    }
    // Check if cauldron
    else if (blockData instanceof Levelled) {
      // TODO 1.17: Check if the cauldroin contains water instead of lava :)
      if (blockData.level > 0) {
        bottleCanFill = true;

        // Call cauldron level change event because the level changes
        if (!checkCauldronEvent(clickedBlock, event.player, -1)) return;

        // Decrease the level of the cauldron
        changeCauldronLevel(clickedBlock, -1);

        // Cauldrons provide normal water
        waterQuality = 'NORMAL';
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
        clickedBlock = block;
        bottleCanFill = true;
        break;
      }
    }
  }
  if (!clickedBlock) return;

  if (bottleCanFill) {
    // Get corresponding customitem
    const potion = getFullBottle(event.item);
    const meta = potion.itemMeta;
    meta.displayName(null);

    // Clear weird data from the potion (it would be pink)
    if (!waterQuality) {
      waterQuality = getWaterQuality(event);
    }

    const potionData = getPotionData(waterQuality);
    (meta as PotionMeta).basePotionData = potionData;
    potion.itemMeta = meta;

    event.item.amount--;
    giveItem(event.player, potion, event.hand);

    playBottleFillSound(centerOf(clickedBlock));
  }
});

// Fill a cauldron
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.POTION) return;
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;

  const block = event.clickedBlock;
  if (!block) return;
  const type = block.type;
  if (type !== Material.CAULDRON && type !== Material.WATER_CAULDRON) return;

  if (isCauldronFull(block)) return;

  event.setCancelled(true);

  const player = event.player;
  if (!canFillCauldron(event.item)) {
    player.sendActionBar(
      text(t(player, 'bottles.wrong_water_to_fill_cauldron')),
    );
    return;
  }

  // Call cauldron level change event because the level changes
  if (!checkCauldronEvent(block, player, 1)) return;

  // Fill the cauldron
  changeCauldronLevel(block, +1);

  // Player is filling a cauldron with custom bottle
  const bottle = getEmptyBottle(event.item);

  playBottleEmptySound(centerOf(block));

  // Wait 1 millis so we dont fire bottle fill event
  await wait(1, 'millis');

  const inventory = player.inventory as PlayerInventory;
  if (event.hand === EquipmentSlot.HAND) {
    inventory.itemInMainHand = bottle;
  } else {
    inventory.itemInOffHand = bottle;
  }
});

function changeCauldronLevel(block: Block, change: -1 | 1) {
  const data = block.blockData;
  if (data instanceof Levelled) {
    const newLevel = Math.min(data.level + change, data.maximumLevel);

    if (newLevel == 0) {
      block.type = Material.CAULDRON;
    } else {
      data.level = newLevel;
      block.blockData = data;
    }
    return;
  }

  if (change > 0) {
    block.blockData = Material.WATER_CAULDRON.createBlockData();
    (block.blockData as Levelled).level = 1;
  }
}

function isCauldronFull(block: Block) {
  const blockData = block.blockData;
  if (blockData instanceof Levelled) {
    if (blockData.level === blockData.maximumLevel) return true;
  }
  return false;
}

// Drink a bottle
registerEvent(PlayerItemConsumeEvent, (event) => {
  if (event.item.type !== Material.POTION) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default bottle

  const replacement = getEmptyBottle(event.item);

  event.replacement = replacement;
});

/**
 * Calls CauldonLevelChangeEvent.
 * @param block The cauldron
 * @param player Who clicked
 * @param change How much the level did change? -1 or +1
 * @returns True if the event did not get canceled, false otherwise.
 */
export function checkCauldronEvent(
  block: Block,
  player: Player,
  change: -1 | 1,
) {
  const data = block.blockData;
  if (!(data instanceof Levelled)) {
    return true; // Can't call event, not a cauldron
  }
  const reason =
    change === 1 ? ChangeReason.BOTTLE_EMPTY : ChangeReason.BOTTLE_FILL;

  // Apply water level change to block state
  let state = block.state;
  const newLevel = data.level + change;
  if (newLevel == 0) {
    block.type = Material.CAULDRON;
    state = block.state;
  } else {
    data.level += change; // Change level
    state.blockData = data; // Apply to state of cauldron
  }

  const cauldronEvent = new CauldronLevelChangeEvent(
    block,
    player as unknown as Entity,
    reason,
    state,
  );
  Bukkit.server.pluginManager.callEvent(cauldronEvent);
  return !cauldronEvent.isCancelled();
}

function playBottleFillSound(loc: Location) {
  loc.world.playSound(
    loc,
    'minecraft:item.bottle.fill',
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

function playBottleEmptySound(loc: Location) {
  loc.world.playSound(
    loc,
    'minecraft:item.bottle.empty',
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

addTranslation('bottles.wrong_water_to_fill_cauldron', {
  fi_fi: 'Voit täyttää padan vain tavallisella tai kirkkaalla vedellä',
  en_us: 'You can only fill the cauldron with  or normal or clear water',
});
