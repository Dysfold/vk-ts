import { Material, Particle } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Item, ItemFrame } from 'org.bukkit.entity';
import { Action, BlockBreakEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import {
  getItemFrame,
  spawnHiddenItemFrame,
} from '../../common/entities/item-frame';
import { CustomItem } from '../../common/items/CustomItem';
import { getEmptyBottle } from '../../hydration/bottles';
import { Bowl } from '../Bowl';

const INGREDIENT_PICKUP_DELAY = 5; // Seconds

const BAKING_RECIPES: BackingRecipe[] = [];

interface BackingRecipe {
  /**
   * Custom item to be displayed when unrisen dough is in a bowl
   */
  dough: CustomItem<any>;

  /**
   * Custom item to be displayed when risen dough is in a bowl.
   * If the dough does not the be risen, this can be same as dough
   */
  doughRisen: CustomItem<any>;

  /**
   * Dough item (baking result)
   */
  result: ItemStack;

  /**
   * List of items to be used in the baking recipe
   */
  ingredients: Material[];

  /**
   * How many seconds the dough needs to rise
   */
  risingTime?: number;
}

const risingDoughs = new Map<ItemFrame, { seconds: number; risen: ItemStack }>(
  [],
);

// List all possible ingredients
const INGREDIENTS = new Set<Material>();

export function bakingRecipe(recipe: BackingRecipe) {
  BAKING_RECIPES.push(recipe);
  recipe.ingredients.forEach((item) => {
    INGREDIENTS.add(item);
  });
}

// Rise doughs
setInterval(() => {
  risingDoughs.forEach(({ seconds, risen }, frame) => {
    if (!frame) risingDoughs.delete(frame);
    else if (seconds > 0) {
      risingDoughs.set(frame, { seconds: --seconds, risen: risen });
    } else {
      frame.setItem(risen, false); // false = no sound
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
      const doughRisen = BAKING_RECIPES.find((r) => r.doughRisen.check(item));

      if (doughRisen) {
        // Delete the item frame and drop a dough
        dropItem(event.block, doughRisen.result);
        itemFrame.remove();
      } else if (BAKING_RECIPES.some((r) => r.dough.check(item))) {
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

    const frame = getItemFrame(bowl.getRelative(BlockFace.DOWN), BlockFace.UP);
    if (frame) {
      // There was already a dough in the bowl
      const frameItem = frame.item;
      if (!(frameItem instanceof ItemStack)) return;

      for (const recipe of BAKING_RECIPES) {
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

    if (!INGREDIENTS.has(item.type)) return;
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

function bake(block: Block) {
  const center = block.location.add(0.5, 0.1, 0.5);
  const entities = block.world.getNearbyEntities(center, 0.3, 0.3, 0.3);
  const drops: ItemStack[] = [];
  const types: Material[] = [];
  for (const entity of entities) {
    if (!(entity instanceof Item)) continue;
    const itemStack = entity.itemStack;
    if (!INGREDIENTS.has(itemStack.type)) continue;
    drops.push(entity.itemStack);
    types.push(entity.itemStack.type);
  }
  if (!drops.length) return;
  for (const recipe of BAKING_RECIPES) {
    // Check if the recipe contains the incredients
    if (types.every((i) => recipe.ingredients.includes(i))) {
      drops.forEach((drop) => {
        if (drop.type === Material.POTION) {
          const empty = getEmptyBottle(drop);
          dropItem(block, empty);
        }
        drop.amount--;
      });
      const frame = spawnHiddenItemFrame(
        block.getRelative(BlockFace.DOWN),
        BlockFace.UP,
        recipe.dough.create({}),
      );
      if (!frame) return;
      if (recipe.risingTime && recipe.doughRisen) {
        risingDoughs.set(frame, {
          seconds: recipe.risingTime,
          risen: recipe.doughRisen.create({}),
        });
      }
      break;
    }
  }
  block.world.spawnParticle(
    Particle.CLOUD,
    block.location.add(0.5, 0.3, 0.5),
    5,
    0.2,
    0.2,
    0.2,
    0,
  );
}
