import { Color, DyeColor, Location, Material, Sound } from 'org.bukkit';
import { Levelled } from 'org.bukkit.block.data';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import {
  BlockBreakEvent,
  BlockPlaceEvent,
  CauldronLevelChangeEvent,
} from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { ScoopEmpty } from '../hydration/bottles';
import { Class } from 'java.lang';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { BlockFace } from 'org.bukkit.block';
import { locationToObj, objToLocation } from '../death/helpers';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { LeatherArmorMeta } from 'org.bukkit.inventory.meta';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { VkItem } from '../common/items/VkItem';

/**
 * Define ingredient schema
 */
const IngredientSchema = yup
  .object({
    name: yup.string().required(), // name of the ingredient material
    perished: yup.boolean().optional(), // some ingredients might get ruined by the heat
  })
  .required();

/**
 * Brew in a cauldron
 */
export const Brew = new CustomItem({
  id: 1000,
  type: VkItem.COLORABLE,
  modelId: 1000,
  data: {
    ingredients: yup.array().of(IngredientSchema.required()).default([]),
    cauldron: yup
      .object({
        x: yup.number().required(),
        y: yup.number().required(),
        z: yup.number().required(),
        worldId: yup.string().required(),
      })
      .required(),
  },
});

/**
 * Brew in a bucket
 */
export const BrewBucket = new CustomItem({
  id: 1,
  type: VkItem.COLORABLE,
  modelId: 1,
  name: 'Seos',
  data: {
    ingredients: yup.array().of(IngredientSchema.required()).required(),
  },
});

/**
 * Define ingredient
 */
type Ingredient = {
  [key: string]: IngredientProperties;
};

/**
 * Define properties for ingredient
 */
type IngredientProperties = {
  color?: DyeColor; // ingredient effect on the brew color
  description?: string; // short description about the ingredient
  soluble?: boolean; // ingredient is easily soluble and doesn't require heat
  heatDestroy?: boolean; // ingredient cannot withstand heat
};

/**
 * List of valid ingredients and their properties
 */
const INGREDIENTS: Ingredient = {
  APPLE: { color: DyeColor.RED, description: 'hedelmiä' },
  PORKCHOP: { color: DyeColor.PINK, description: 'kalaa' },
  COD: { color: DyeColor.PINK, description: 'kalaa' },
  SALMON: { color: DyeColor.PINK, description: 'kalaa' },
  TROPICAL_FISH: { color: DyeColor.PINK, description: 'kalaa' },
  PUFFERFISH: { color: DyeColor.PINK, description: 'myrkkyä' },
  MELON_SLICE: { color: DyeColor.RED, description: 'sokeria', soluble: true },
  BEEF: { color: DyeColor.RED, description: 'lihaa' },
  CHICKEN: { color: DyeColor.PINK, description: 'lihaa' },
  CARROT: { color: DyeColor.ORANGE, description: 'juureksia' },
  COCOA_BEANS: { color: DyeColor.BROWN, description: 'kahvia' },
  POTATO: { color: DyeColor.YELLOW, description: 'juureksia' },
  RABBIT: { color: DyeColor.RED, description: 'lihaa' },
  MUTTON: { color: DyeColor.RED, description: 'lihaa' },
  SWEET_BERRIES: { color: DyeColor.RED, description: 'marjoja' },
  HONEYCOMB: { color: DyeColor.YELLOW, description: 'hunajaa' },
  BROWN_MUSHROOM: { color: DyeColor.BROWN, description: 'sieniä' },
  RED_MUSHROOM: { color: DyeColor.BROWN, description: 'myrkkyä' },
  SUGAR_CANE: { color: DyeColor.BROWN, description: 'sokeria' },
  EGG: { description: 'kananmunia' },
  SUGAR: { color: DyeColor.WHITE, description: 'sokeria', soluble: true },
  NETHER_WART: {
    color: DyeColor.WHITE,
    description: 'hiivaa',
    soluble: true,
    heatDestroy: true,
  },
  TWISTING_VINES: {
    color: DyeColor.GREEN,
    description: 'yrttejä',
    soluble: true,
  },
  WHEAT: { color: DyeColor.YELLOW, description: 'viljaa' },
};

/**
 * Return a list of items frames at given location
 * @param location
 */
function getItemFramesAt(location: Location) {
  return location.getNearbyEntitiesByType(
    Class.forName('org.bukkit.entity.ItemFrame'),
    0.5,
  );
}

/**
 * Create new brew at given block
 * @param location must be the location of a cauldron
 */
function spawnBrewItemAt(location: Location) {
  // Return if the face is obstructed
  if (!getItemFramesAt(location).isEmpty()) return;

  // Spawn new itemframe
  const itemFrame = location.world.spawnEntity(
    location,
    EntityType.ITEM_FRAME,
    SpawnReason.CUSTOM,
    {
      accept(itemFrame: ItemFrame) {
        // Face upwards
        itemFrame.setFacingDirection(BlockFace.UP, true);

        // Prevent all damage except from creative players
        itemFrame.setInvulnerable(true);

        // Disable interaction with the environment
        itemFrame.setFixed(true);

        //itemFrame.itemDropChance = 0;

        // Prevent item from being dropped
        itemFrame.setSilent(true);

        // Set invisible
        itemFrame.setVisible(false);
      },
    },
  ) as ItemFrame;

  // Create Brew item
  const itemFrameItem = Brew.create({
    cauldron: locationToObj(location.subtract(0.0, 1.0, 0.0)), // location of the owning cauldron
  });

  // Set default color
  const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
  meta.color = DyeColor.BLUE.color;
  itemFrameItem.itemMeta = meta;

  itemFrame.setItem(itemFrameItem, false);
}

/**
 * Attempt to retrieve a existing brew itemstack at given location
 * @param location
 */
export function getBrewItemAt(location: Location): ItemStack | undefined {
  // Return the first detected brew item
  for (const entity of getItemFramesAt(location)) {
    const itemFrame = entity as ItemFrame;
    if (Brew.check(itemFrame.item)) return itemFrame.item;
  }

  return;
}

/**
 * Search and destroy itemframes containing a brew item
 * @param location
 */
function removeBrewItemFrom(location: Location) {
  // Check all detected frames
  for (const entity of getItemFramesAt(location)) {
    if (Brew.check((entity as ItemFrame).item)) entity.remove();
  }
}

/**
 * Check that location has a valid heat source
 * @param location expected to be the location of a cauldron
 */
function hasHeatSource(location: Location) {
  return (
    location.subtract(0.0, 1.0, 0.0).block.type === Material.CAMPFIRE ||
    (location.block.type === Material.FIRE &&
      location.subtract(0.0, 1.0, 0.0).block.type === Material.NETHERRACK)
  );
}

/**
 * Handle player interaction with a brew cauldron
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Stop item from rotating
    event.setCancelled(true);

    // Check if main hand
    if (event.hand != EquipmentSlot.HAND) return;

    const item = event.player.inventory.itemInMainHand;

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    // List ingredients if clicked with a empty scoop
    if (ScoopEmpty.check(item)) {
      const ingredients = Brew.get(itemFrameItem)?.ingredients;

      if (!ingredients || ingredients.length < 1) {
        event.player.sendMessage('Padassa on pelkkää vettä');
        return;
      }

      // Generate descriptions from the ingredients
      const descriptions = [
        ...new Set(
          ingredients
            .filter((value) => {
              return INGREDIENTS[value.name].description;
            })
            .map((value) => {
              return INGREDIENTS[value.name].description;
            }),
        ),
      ];

      // Generate list and replace the last delimeter with 'ja'
      const description = descriptions.join(', ').replace(/,([^,]*)$/, ' ja$1');

      event.player.sendMessage(`Seoksessa vaikuttaisi olevan ${description}`);

      event.player.playSound(
        itemFrame.location,
        Sound.ITEM_BUCKET_FILL_FISH,
        1.0,
        1.0,
      );

      return;
    }

    const properties = INGREDIENTS[item.type.toString()];

    // If not a ingredient
    if (!properties) return;

    const brew = Brew.get(itemFrameItem);

    // If not a valid brew (should never happen, but makes typechecker happy)
    if (!brew || !brew.ingredients) return;

    // Is the cauldron on top of a heat source
    const isWaterBoiling = hasHeatSource(objToLocation(brew.cauldron));

    // Return if the ingredient is not easily soluble and the water is not boiling
    if (!properties.soluble && !isWaterBoiling) return;

    // Cap ingredient amount
    if (brew.ingredients.length >= 24) {
      event.player.sendMessage('Pata on täysi');
      return;
    }

    // Add ingredient to brew
    brew.ingredients.push({
      name: item.type.toString(),
      perished: properties.heatDestroy && isWaterBoiling, // set ingredient perished if it gets destroyed by the heat and the cauldron is on stove
    });

    // Update color
    if (properties && properties.color) {
      const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
      meta.color = properties.color.color.mixColors(meta.color);
      itemFrameItem.itemMeta = meta;
    }

    // Update item frame item after modify
    itemFrame.setItem(itemFrameItem, false);

    // Remove item from player
    item.amount -= 1;

    // Alternative sound effect
    // event.player.playSound(
    //   itemFrame.location,
    //   Sound.ENTITY_ITEM_PICKUP,
    //   0.2,
    //   Math.random(),
    // );

    // Splash sound effect
    event.player.playSound(
      itemFrame.location,
      Sound.ENTITY_GENERIC_SPLASH,
      0.5,
      1.0,
    );
  },
);

/**
 * (Fallback) Prevent brew item from spawning
 */
Brew.event(
  ItemSpawnEvent,
  (event) => event.entity.itemStack,
  async (event) => {
    event.setCancelled(true);
  },
);

/**
 * Put brew into a bucket
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Check that player clicked with main hand
    if (event.hand != EquipmentSlot.HAND) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    // Check that the item in main hand is a empty bucket
    if (itemInMainHand.type != Material.BUCKET) return;

    const itemFrame = event.rightClicked as ItemFrame;

    // Dead is the same thing as removed. Prevents creating duplicate buckets from one cauldron (macro usage)
    if (itemFrame.isDead()) return;

    const brew = Brew.get(itemFrame.item);

    // Make type checker happy
    if (!brew || !brew.ingredients) return;

    let brewBucketItem;

    // Create new bucket from brew. If brew has no ingredients, create a water bucket instead
    if (brew.ingredients.length > 0) {
      // Copy ingredients from brew to bucket
      brewBucketItem = BrewBucket.create({
        ingredients: brew.ingredients,
      });

      // Set color
      const meta = brewBucketItem.itemMeta as LeatherArmorMeta;
      meta.color = (itemFrame.item.itemMeta as LeatherArmorMeta).color;
      brewBucketItem.itemMeta = meta;
    } else {
      brewBucketItem = new ItemStack(Material.WATER_BUCKET);
    }

    // Set owning cauldron empty
    const cauldron = objToLocation(brew.cauldron).block;
    const data = cauldron.blockData as Levelled;
    data.level = 0.0;
    cauldron.setBlockData(data, true);

    // Remove brew item
    event.rightClicked.remove();

    // Remove bucket
    itemInMainHand.amount -= 1;

    // Add new bucket
    event.player.inventory.addItem(brewBucketItem);

    // Play sound
    event.player.playSound(cauldron.location, Sound.ITEM_BUCKET_FILL, 1.0, 1.0);
  },
);

/**
 * Spawn brew on a full cauldron if a fire is lit under it
 */
registerEvent(BlockPlaceEvent, (event) => {
  const block = event.block.getRelative(BlockFace.UP);

  // Check if the block above is a cauldron
  if (block.type != Material.CAULDRON) return;

  // Check if cauldron has a heat source
  if (!hasHeatSource(block.location)) return;

  const data = block.blockData as Levelled;

  // Check that the cauldron is full
  if (data.level < data.maximumLevel) return;

  spawnBrewItemAt(block.location.add(0.0, 1.0, 0.0));
});

/**
 * Spawn a brew on cauldron if it's being filled with water and already has a heat source
 */
registerEvent(CauldronLevelChangeEvent, (event) => {
  const brewItem = getBrewItemAt(event.block.location.add(0.0, 1.0, 0.0));

  // Prevent adding or removing water
  if (brewItem) {
    event.setCancelled(true);
    return;
  }

  // Spawn brew only if cauldron's being filled to max
  if (event.newLevel < 3.0) return;

  // Check if there's a heat source under cauldron
  if (!hasHeatSource(event.block.location)) return;

  // Spawn new brew
  spawnBrewItemAt(event.block.location.add(0.0, 1.0, 0.0));
});

/**
 * When a cauldron is broken, search and remove any itemframes containing a brew item
 */
registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type != Material.CAULDRON) return;

  removeBrewItemFrom(event.block.location.add(0.0, 1.0, 0.0));
});

// /**
//  * Represents a cauldron that is used for boiling or mixing ingredients
//  */
// const Cauldron = new CustomBlock({
//   type: Material.CAULDRON,
//   data: {
//     ingredients: yup
//       .array()
//       .of(
//         yup.object().shape({
//           name: yup.string().required(),
//         }),
//       )
//       .default([]),
//   },
// });

// /*
//  * Custom Event System?
//  *
//  * Brew.event(BrewIngredientEvent, (event) => event.brewItemStack, async (event) => { event.player.sendMessage(`You put ${event.ingredient.name()} into the brew`) })
//  */

// /**
//  * Called when player adds ingredients to a brew
//  */
// export class BrewIngredientEvent extends Event {
//   player: Player;
//   brewItemStack: ItemStack;
//   brew: CustomItem<never>;
//   ingredient: Material;

//   constructor(
//     player: Player,
//     brewItemStack: ItemStack,
//     brew: CustomItem<never>,
//     ingredient: Material,
//   ) {
//     super();
//     this.player = player;
//     this.brewItemStack = brewItemStack;
//     this.brew = brew;
//     this.ingredient = ingredient;
//   }
// }

// /**
//  * Prevent brew item removal from the itemframe
//  */
// Brew.event(
//   EntityDamageByEntityEvent,
//   (event) => (event.entity as ItemFrame).item,
//   async (event) => {
//     event.setCancelled(true);
//   },
// );

// /**
//  * Prevent obstructed brew itemframe from breaking
//  */
// Brew.event(
//   HangingBreakEvent,
//   (event) => (event.entity as ItemFrame).item,
//   async (event) => {
//     log.info('ItemFrame wanted to break');
//     event.setCancelled(true);
//   },
// );

// /**
//  * Attempt to prevent brew from being bottled
//  */
// registerEvent(
//   PlayerInteractEvent,
//   (event) => {
//     if (
//       !event.clickedBlock ||
//       event.clickedBlock.type != Material.CAULDRON ||
//       !event.item ||
//       event.item.type != Material.GLASS_BOTTLE ||
//       event.action != Action.RIGHT_CLICK_BLOCK
//     )
//       return;

//     const brewItem = getBrewItemAt(
//       event.clickedBlock.location.add(0.0, 1.0, 0.0),
//     );

//     if (!brewItem) return;

//     event.player.sendMessage('Event cancelled');

//     event.setCancelled(true);
//   },
//   {
//     priority: EventPriority.HIGHEST,
//   },
// );

// /**
//  * Add dropped items to cauldron
//  */
// registerEvent(PlayerDropItemEvent, (event) => {
//   // Only track items that are listed as ingredients
//   //if (!INGREDIENTS.has(event.itemDrop)) return;

//   const DELAY = 250;

//   let time = 0;

//   const handle = setInterval(() => {
//     // Either location.block or getRelative(down)
//     const block = event.itemDrop.location.block;

//     if (block.type == Material.CAULDRON) {
//       const data = block.blockData as Levelled;

//       // Cauldron needs to be full
//       if (data.level == data.maximumLevel) {
//         event.itemDrop.setCanPlayerPickup(false);
//         event.itemDrop.setCanMobPickup(false);
//         event.itemDrop.teleport(block.location);

//         event.player.playSound(
//           block.location,
//           Sound.ENTITY_GENERIC_SPLASH,
//           0.5,
//           1.0,
//         );
//       }

//       clearInterval(handle);
//     }

//     // Failsafe to stop timer if landing is not detected
//     if (time > 10) {
//       clearInterval(handle);
//     }

//     time += DELAY / 1000;
//   }, DELAY);
// });
