import { Location, Material, Sound } from 'org.bukkit';
import { Levelled } from 'org.bukkit.block.data';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import * as yup from 'yup';
import {
  BlockBreakEvent,
  BlockPlaceEvent,
  CauldronLevelChangeEvent,
} from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { ScoopEmpty } from '../hydration/bottles';
import { Class } from 'java.lang';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { BlockFace } from 'org.bukkit.block';
import { locationToObj, objToLocation } from '../death/helpers';

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
  type: Material.LEATHER_HORSE_ARMOR,
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
  type: Material.LEATHER_HORSE_ARMOR,
  modelId: 1,
  name: 'Liejua',
  data: {
    ingredients: yup.array().of(yup.string().required()).optional(),
  },
});

// List of allowed ingredients. Must be a valid Minecraft material and in upper case
const INGREDIENTS = new Set([
  'APPLE',
  'POTATO',
  'CARROT',
  'MELON_SLICE',
  'SWEET_BERRIES',
  'SUGAR',
  'SUGAR_CANE',
  'NETHER_WART',
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
 *
 * ? When itemframe is spawned, it first tries to face wrong block (for example the wall next to it). A client-side thing?
 *
 * @param location must be the location of a cauldron
 */
function spawnBrewItemAt(location: Location) {
  // Return if the face is obstructed
  if (!getItemFramesAt(location).isEmpty()) return;

  // Spawn new item frame
  const itemFrame = location.world.spawnEntity(
    location,
    EntityType.ITEM_FRAME,
  ) as ItemFrame;

  // Should automatically face up but make sure
  itemFrame.setFacingDirection(BlockFace.UP, true);

  // Hide
  itemFrame.setVisible(false);

  // Disable damage excluding creative players
  itemFrame.setInvulnerable(true);

  // Disable interaction with the environment
  itemFrame.setFixed(true);

  // Create brew
  itemFrame.setItem(
    Brew.create({
      cauldron: locationToObj(location.subtract(0.0, 1.0, 0.0)), // location of the owning cauldron
    }),
    false,
  );
}

/**
 * Attempt to retrieve a existing brew itemstack at given location
 * @param location
 */
export function getBrewItemAt(location: Location) {
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
 * TOOD: More sources of heat?
 * @param location
 */
function hasHeatSource(location: Location) {
  return (
    location.subtract(0.0, 1.0, 0.0).block.type == Material.FIRE &&
    location.subtract(0.0, 1.0, 0.0).block.type == Material.NETHERRACK
  );
}

/**
 * Add ingredients to a brew
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Cancel item rotation
    event.setCancelled(true);

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    const brew = Brew.get(itemFrameItem);

    // Make type checker happy
    if (!brew || !brew.ingredients) return;

    const item = event.player.inventory.itemInMainHand;

    if (item.type == Material.AIR) return;

    // List ingredients if clicked with a empty scoop
    if (ScoopEmpty.check(item)) {
      event.player.sendMessage(`Ingredients: ${brew.ingredients.toString()}`);
      return;
    }

    // Check if item is a valid ingredient
    if (!INGREDIENTS.has(item.type.toString())) return;

    // Add ingredient to brew
    brew.ingredients.push(item.type.toString());

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
    if (event.hand != EquipmentSlot.HAND) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    if (itemInMainHand.type != Material.BUCKET) return;

    const brew = Brew.get((event.rightClicked as ItemFrame).item);

    // Make type checker happy
    if (!brew) return;

    // Create new BrewBucket from Brew by copying the ingredients
    const brewBucketItem = BrewBucket.create({
      ingredients: brew.ingredients,
    });

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
 *
 * ! Due to a bug in hydration/bottles, water can be added or removed from the cauldron with glass bottles
 * ! Same thing with drinking water from the cauldron
 * ! Both actions should check if cancelled (to prevent drinking from boiling cauldron)
 */
registerEvent(CauldronLevelChangeEvent, (event) => {
  const brewItem = getBrewItemAt(event.block.location.add(0.0, 1.0, 0.0));

  // Don't allow cauldron level to change if it has a brew on it
  if (brewItem) event.setCancelled(true);

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
//  * Prevent brew from being bottled
//  *
//  * EDIT: nvm cancelled events still pass to other handlers
//  *
//  * ! This event handler is only for temporary use
//  * ! Due to a bug in hydration/bottles, CauldronLevelChangeEvent is not fired (when bottling) and thus cannot be cancelled there
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
