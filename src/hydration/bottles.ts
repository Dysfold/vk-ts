import { replace } from 'lodash';
import { Material } from 'org.bukkit';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Item, Player } from 'org.bukkit.entity';
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

const WATER_POTION_DATA = new PotionData(PotionType.WATER, false, false);

/*
Replace default bottle filling functionality
and re-implement it so we can define the itemMeta of the bottle.
Needed for custom bottle models (wine glass, mug etc.)
because those items would otherwise become normal bottles without custom model data
*/

// Fill a bottle
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.GLASS_BOTTLE) return;
  if (event.item.itemMeta.customModelData === 0) return; // Default glass bottle
  if (
    event.action !== Action.RIGHT_CLICK_AIR &&
    event.action !== Action.RIGHT_CLICK_BLOCK
  )
    return;

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
    const potion = new ItemStack(Material.POTION);
    const meta = potion.itemMeta;
    // Clear weird data from the potion (it would be pink)
    (meta as PotionMeta).setBasePotionData(WATER_POTION_DATA);
    // Set the result match the custommodeldata of the item
    meta.customModelData = event.item.itemMeta.customModelData;
    potion.itemMeta = meta;

    event.item.amount--;
    giveItem(event.player, potion, event.hand);
  }
});

// Drink a bottle
const GLASS_BOTTLE = new ItemStack(Material.GLASS_BOTTLE);
registerEvent(PlayerItemConsumeEvent, (event) => {
  if (event.item.type !== Material.POTION) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default bottle

  const replacement = GLASS_BOTTLE;
  const meta = replacement.itemMeta;
  meta.customModelData = event.item.itemMeta.customModelData;
  replacement.itemMeta = meta;
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
