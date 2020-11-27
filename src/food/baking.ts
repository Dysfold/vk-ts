import { Material } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Entity, EntityType, Hanging, Item } from 'org.bukkit.entity';
import { Action, BlockBreakEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';

const Bowl = new CustomBlock({
  type: Material.DEAD_TUBE_CORAL_FAN,
});

const INGREDIENT_PICKUP_DELAY = 5; // Seconds

// Dough models for bowl
const DOUGH_BREAD = new CustomItem({
  type: Material.HEART_OF_THE_SEA,
  id: 16,
  modelId: 16,
});
const DOUGH_BREAD_RISEN = new CustomItem({
  type: Material.HEART_OF_THE_SEA,
  id: 17,
  modelId: 17,
});
const DOUGH_PUMPKIN_PIE = new CustomItem({
  type: Material.HEART_OF_THE_SEA,
  id: 19,
  modelId: 19,
});
const DOUGH_COOKIE = new CustomItem({
  type: Material.HEART_OF_THE_SEA,
  id: 18,
  modelId: 18,
});

// Dough items for furnace
const DOUGH_BREAD_ITEM = new CustomItem({
  type: Material.SHULKER_SHELL,
  id: 6,
  modelId: 6,
  name: 'Leipätaikina',
});
const DOUGH_COOKIE_ITEM = new CustomItem({
  type: Material.SHULKER_SHELL,
  id: 7,
  modelId: 7,
  name: 'Keksitaikina',
});
const DOUGH_PUMPKIN_PIE_ITEM = new CustomItem({
  type: Material.SHULKER_SHELL,
  id: 8,
  modelId: 8,
  name: 'Kurpitsapiirakkataikina',
});

const RESIPES = [
  {
    dough: DOUGH_BREAD,
    doughRisen: DOUGH_BREAD_RISEN,
    result: DOUGH_BREAD_ITEM.create(),
    ingredients: [
      Material.PHANTOM_MEMBRANE,
      Material.NETHER_WART,
      Material.POTION,
    ],
    risingTime: 5,
  },
  {
    dough: DOUGH_PUMPKIN_PIE,
    doughRisen: DOUGH_PUMPKIN_PIE,
    result: DOUGH_PUMPKIN_PIE_ITEM.create(),
    ingredients: [
      Material.PUMPKIN,
      Material.SUGAR,
      Material.POTION,
      Material.EGG,
    ],
  },
  {
    dough: DOUGH_COOKIE,
    doughRisen: DOUGH_COOKIE,
    result: DOUGH_COOKIE_ITEM.create(),
    ingredients: [
      Material.PHANTOM_MEMBRANE,
      Material.SUGAR,
      Material.COCOA_BEANS,
      Material.POTION,
    ],
  },
];

const risingDoughs = new Map<Entity, { seconds: number; risen: ItemStack }>([]);

// List all possible ingredients
const INGREDIENTS = new Set<number>();
for (const recipe of RESIPES) {
  for (const ingredient of recipe.ingredients)
    INGREDIENTS.add(ingredient.ordinal());
}

// Rise doughs
setInterval(() => {
  risingDoughs.forEach(({ seconds, risen }, frame) => {
    if (!frame) risingDoughs.delete(frame);
    else if (seconds > 0) {
      risingDoughs.set(frame, { seconds: --seconds, risen: risen });
    } else {
      (frame as any).item = risen;
      risingDoughs.delete(frame);
    }
  });
}, 1000);

// Check if there was itemframe on top of the bowl
Bowl.event(
  BlockBreakEvent,
  (event) => event.block,
  async (event) => {
    const itemFrame = getItemFrame(event.block, BlockFace.UP);
    if (itemFrame) {
      const item = itemFrame.item;
      const doughRisen = RESIPES.find((r) => r.doughRisen.check(item));

      if (doughRisen) {
        // Delete the item frame and drop a dough
        dropItem(event.block, doughRisen.result);
        itemFrame.remove();
      } else if (RESIPES.some((r) => r.dough.check(item))) {
        // Delete the item frame, but without a drop
        itemFrame.remove();
      }
    }
  },
);

// Right click a bowl to add ingredients or to bake
Bowl.event(
  PlayerInteractEvent,
  (event) => event.clickedBlock,
  async (event) => {
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    if (event.hand !== EquipmentSlot.HAND) return;

    const inventory = event.player.inventory as PlayerInventory;
    const item = event.item;
    const bowl = event.clickedBlock;

    if (!bowl) return;

    // Check if there is free space above the bowl
    const blockUp = bowl.getRelative(BlockFace.UP);
    if (!blockUp.isEmpty()) return;

    const frame = getItemFrame(bowl, BlockFace.UP);
    if (frame) {
      // There was already a dough in the bowl
      const frameItem = frame.item;
      if (!(frameItem instanceof ItemStack)) return;

      for (const recipe of RESIPES) {
        if (recipe.doughRisen.check(frameItem)) {
          // Dough has risen and can be picked
          dropItem(bowl, recipe.result);
          frame.remove();
        }
      }
      return;
    }
    if (!item) {
      if (!inventory.itemInOffHand.type.isEmpty()) return;
      // Both hands are empty
      bake(bowl);
      return;
    }
    if (!INGREDIENTS.has(item.type.ordinal())) return;
    // Clicked with ingredient item
    event.setCancelled(true);

    const drop = item.clone() as ItemStack;
    drop.amount = 1;
    item.amount--;
    dropIngredient(bowl, drop);
  },
);

const ZERO_VECTOR = new Vector();
function dropIngredient(block: Block, item: ItemStack) {
  const drop = dropItem(block, item);
  drop.pickupDelay = INGREDIENT_PICKUP_DELAY * 20; // Ticks
}

function dropItem(block: Block, item: ItemStack) {
  const loc = block.location.add(0.5, 0.1, 0.5);
  const drop = loc.world.dropItem(loc, item);
  drop.velocity = ZERO_VECTOR;
  return drop;
}

const GLASS_BOTTLE = new ItemStack(Material.GLASS_BOTTLE);
function bake(block: Block) {
  const center = block.location.add(0.5, 0.1, 0.5);
  const entities = block.world.getNearbyEntities(center, 0.3, 0.3, 0.3);
  const drops: ItemStack[] = [];
  const types: Material[] = [];
  for (const entity of entities) {
    if (!(entity instanceof Item)) continue;
    const itemStack = entity.itemStack;
    if (!INGREDIENTS.has(itemStack.type.ordinal())) continue;
    drops.push(entity.itemStack);
    types.push(entity.itemStack.type);
  }
  if (!drops.length) return;
  for (const recipe of RESIPES) {
    // Check if the recipe contains the incredients
    if (types.every((i) => recipe.ingredients.includes(i))) {
      drops.forEach((drop) => {
        if (drop.type === Material.POTION) dropItem(block, GLASS_BOTTLE);
        drop.amount--;
      });
      const frame = summonItemFrame(block, BlockFace.UP, recipe.dough.create());
      if (recipe.risingTime && recipe.doughRisen) {
        risingDoughs.set(frame, {
          seconds: recipe.risingTime,
          risen: recipe.doughRisen.create(),
        });
      }
      break;
    }
  }
}

// TODO: Common api for item frames?qq
function summonItemFrame(block: Block, face: BlockFace, item: ItemStack) {
  const loc = block.getRelative(face).location;
  const frame = block.world.spawnEntity(loc, EntityType.ITEM_FRAME) as any; // ItemFrame type didn't exist
  frame.facingDirection = face;
  frame.visible = false;
  frame.item = item;
  return frame;
}

function getItemFrame(block: Block, face: BlockFace) {
  const loc = block.getRelative(face).location.add(0.5, 0, 0.5);
  const entities = block.world.getNearbyEntities(loc, 0.5, 0.5, 0.5);
  for (const entity of entities) {
    if (entity.type !== EntityType.ITEM_FRAME) continue;
    const frame = entity as Hanging;
    const hangedBlock = entity.location.block.getRelative(frame.attachedFace);
    if (hangedBlock.location.equals(block.location)) {
      return entity as any; // ItemFrame type didn't exist;
    }
  }
  return undefined;
}
