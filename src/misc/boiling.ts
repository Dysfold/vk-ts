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

/**
 * Represents the liquid on a cauldron
 */
export const Brew = new CustomItem({
  id: 1000,
  type: Material.LEATHER_HORSE_ARMOR, // TODO: change to VkItem
  modelId: 1000,
  data: {
    ingredients: yup.array().of(yup.string().required()).default([]),
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
 * Represents a brew on a bucket
 */
export const BrewBucket = new CustomItem({
  id: 1,
  type: Material.LEATHER_HORSE_ARMOR, // TODO: VkItem
  modelId: 1,
  name: 'Liejua',
  data: {
    ingredients: yup.array().of(yup.string().required()).optional(),
  },
});

// enum Ingredient {
//   'APPLE' = Color.RED.asRGB(),
//   'BREAD' = Color.RED.asRGB(),
//   'PORKCHOP' = Color.RED.asRGB(),
//   'COD' = Color.RED.asRGB(),
//   'SALMON' = Color.RED.asRGB(),
//   'TROPICAL_FISH' = Color.RED.asRGB(),
//   'PUFFERFISH' = Color.RED.asRGB(),
//   'COOKIE' = Color.RED.asRGB(),
//   'MELON_SLICE' = Color.RED.asRGB(),
//   'BEEF' = Color.RED.asRGB(),
//   'CHICKEN' = Color.RED.asRGB(),
//   'CARROT' = Color.RED.asRGB(),
//   'POTATO' = Color.RED.asRGB(),
//   'RABBIT' = Color.RED.asRGB(),
//   'MUTTON' = Color.RED.asRGB(),
//   'SWEET_BERRIES' = Color.RED.asRGB(),
//   'HONEYCOMB' = Color.RED.asRGB(),
//   'BROWN_MUSHROOM' = Color.RED.asRGB(),
//   'RED_MUSHROOM' = Color.RED.asRGB(),
//   'SUGAR_CANE' = Color.RED.asRGB(),
//   'EGG' = Color.RED.asRGB(),
//   'SUGAR' = Color.RED.asRGB(),
//   'NETHER_WART' = Color.RED.asRGB(),
//   'TWISTING_VINES' = Color.RED.asRGB(),
// }

// Define all valid ingredients and effect on brew color
// TODO: Add custom foods
const INGREDIENTS = new Map<Material, Color | undefined>([
  [Material.APPLE, Color.RED],
  [Material.MELON_SLICE, Color.RED],
  [Material.SWEET_BERRIES, Color.RED],
  [Material.HONEYCOMB, Color.YELLOW],
  [Material.SUGAR_CANE, DyeColor.BROWN.color],
  [Material.SUGAR, Color.WHITE],
  [Material.NETHER_WART, Color.WHITE],
  [Material.TWISTING_VINES, Color.GREEN],
]);

/**
 * Return a list of items frames at given location
 * @param location
 */
function getItemFramesAt(location: Location) {
  return location.getNearbyEntitiesByType(
    Class.forName('org.bukkit.entity.ItemFrame'),
    1.0,
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

        // Prevent all damage (except from creative players) to the itemframe
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
    location.subtract(0.0, 1.0, 0.0).block.type == Material.CAMPFIRE ||
    (location.block.type == Material.FIRE &&
      location.subtract(0.0, 1.0, 0.0).block.type == Material.NETHERRACK)
  );
}

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

/**
 * Add ingredients to a brew
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
      event.player.sendMessage(
        `${Brew.get(itemFrameItem)?.ingredients?.toString()}`,
      );
      return;
    }

    // // Check if item is a valid ingredient
    // if (!(item.type.toString() in Ingredient)) return;

    // const color = Color.fromRGB(
    //   Ingredient[item.type.name() as keyof typeof Ingredient],
    // );

    // Check if the item is a valid ingredient
    if (!INGREDIENTS.has(item.type)) return;

    const brew = Brew.get(itemFrameItem);

    if (!brew || !brew.ingredients) return;

    // Cap ingredient amount
    if (brew.ingredients.length >= 24) {
      event.player.sendMessage('Pata on täysi');
      return;
    }

    // Add ingredient to brew
    brew.ingredients.push(item.type.toString());

    const color = INGREDIENTS.get(item.type);

    // Update color
    if (color) {
      const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
      //? Don't understand how color mixing works, but does a decent job
      meta.color = Color.WHITE.mixColors(meta.color, color);
      itemFrameItem.itemMeta = meta;
    }

    // Update brew color
    // const itemMeta = itemFrameItem.itemMeta as LeatherArmorMeta;
    // const color = Ingredient[item.type.toString() as keyof typeof Ingredient];

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
 * Prevent brew item from spawning
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
    if (!brew) return;

    // Create new BrewBucket from Brew by copying the ingredients
    const brewBucketItem = BrewBucket.create({
      ingredients: brew.ingredients,
    });

    // Set color
    const meta = brewBucketItem.itemMeta as LeatherArmorMeta;
    meta.color = (itemFrame.item.itemMeta as LeatherArmorMeta).color;
    brewBucketItem.itemMeta = meta;

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

  // Brew can only spawn if cauldron's full
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
