import { DyeColor, Location, Material, SoundCategory } from 'org.bukkit';
import { Levelled } from 'org.bukkit.block.data';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import * as yup from 'yup';
import {
  Action,
  BlockBreakEvent,
  BlockFromToEvent,
  BlockPlaceEvent,
  CauldronLevelChangeEvent,
} from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { ScoopEmpty } from '../hydration/bottles';
import { Class } from 'java.lang';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { Block, BlockFace } from 'org.bukkit.block';
import { locationToObj, objToLocation } from '../death/helpers';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { LeatherArmorMeta } from 'org.bukkit.inventory.meta';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { VkItem } from '../common/items/VkItem';
import { EventPriority } from 'org.bukkit.event';
import { Campfire } from 'org.bukkit.block.data.type';
import { BlockDestroyEvent } from 'com.destroystokyo.paper.event.block';

/**
 * Ingredient schema
 */
export const IngredientSchema = yup.object({
  /**
   * Material name
   */
  name: yup.string().required(),

  /**
   * Material modelId for custom items
   */
  modelId: yup.number().optional(),

  /**
   * Date when the ingredient was added
   */
  date: yup.number().required(),

  /**
   * Temperature when the ingredient was added
   */
  temp: yup.number().required(),
});

/**
 * Brew in a itemframe
 */
export const Brew = new CustomItem({
  id: 1000,
  type: VkItem.COLORABLE,
  modelId: 1000,
  data: {
    ingredients: yup.array(IngredientSchema.required()).default([]).required(),

    /**
     * Location of the owning cauldron
     */
    cauldron: yup
      .object({
        x: yup.number().required(),
        y: yup.number().required(),
        z: yup.number().required(),
        worldId: yup.string().required(),
      })
      .required(),

    /**
     * Date when the brew was created
     */
    date: yup.number().required(),

    /**
     * Current heat source information.
     * Mainly used only to calculate water temperature
     */
    heatSource: yup
      .object({
        /**
         * Current state of the heat source.
         * Indicates is the brew heating up or cooling down
         */
        exists: yup.boolean().optional(),

        /**
         * Time since the heat source had changed.
         */
        since: yup.number().required(),

        /**
         * Temperature at the time the heat source changed.
         */
        temp: yup.number().required(),
      })
      .required(),
  },
});

/**
 * Brew schema for containers.
 * Other features depending on boiling might find this useful
 * @see BrewBucket for example
 */
export const BrewContainerSchema = {
  ingredients: yup.array(IngredientSchema.required()).required(),

  /**
   * Date when the brew was put into this container
   */
  date: yup.number().required(),

  /**
   * Date when the brew was created
   */
  brewDate: yup.number().required(),

  /**
   * Brew temperature when put into this container
   */
  temp: yup.number().required(),
};

/**
 * Create BrewContainerSchema from Brew
 * @example BrewBucket.create(createBrewContainer(brew))
 */
export function createBrewContainer(brew: any) {
  return {
    ingredients: brew.ingredients,
    date: Date.now(),
    brewDate: brew.date,
    temp: calculateBrewTemp(brew),
  };
}

/**
 * Brew in a bucket
 */
export const BrewBucket = new CustomItem({
  id: 1,
  type: VkItem.COLORABLE,
  modelId: 1,
  name: 'Sotkua', // ? Probably should change this to something else
  data: {
    ...BrewContainerSchema,
  },
});

/**
 * Define ingredient.
 * Each ingredient can have multiple nested ingredients for each modelId
 */
export type Ingredient = {
  [x in string | number]: Ingredient | IngredientProperties;
};

/**
 * Define properties for ingredient
 */
export type IngredientProperties = {
  /**
   * Ingredient effect on brew color
   */
  color?: DyeColor;

  /**
   * Short description about the ingredient
   */
  description?: string;

  /**
   * The highest temperature the ingredient can withstand
   */
  tempMax?: number;
};

/**
 * Static list of valid ingredients and their properties.
 */
export const INGREDIENTS: Ingredient = {
  APPLE: { color: DyeColor.RED, description: 'hedelmiä' },
  PORKCHOP: { color: DyeColor.PINK, description: 'lihaa' },
  COD: { color: DyeColor.PINK, description: 'kalaa' },
  SALMON: { color: DyeColor.PINK, description: 'kalaa' },
  TROPICAL_FISH: { color: DyeColor.PINK, description: 'kalaa' },
  PUFFERFISH: { color: DyeColor.PINK, description: 'myrkkyä' },
  MELON_SLICE: { color: DyeColor.RED, description: 'sokeria' },
  BEEF: { color: DyeColor.RED, description: 'lihaa' },
  CHICKEN: { color: DyeColor.PINK, description: 'lihaa' },
  CARROT: { color: DyeColor.ORANGE, description: 'juureksia' },
  COCOA_BEANS: { color: DyeColor.BROWN, description: 'kaakaota' },
  POTATO: { color: DyeColor.YELLOW, description: 'juureksia' },
  RABBIT: { color: DyeColor.RED, description: 'lihaa' },
  MUTTON: { color: DyeColor.RED, description: 'lihaa' },
  SWEET_BERRIES: { color: DyeColor.RED, description: 'marjoja' },
  HONEYCOMB: { color: DyeColor.YELLOW, description: 'hunajaa' },
  BROWN_MUSHROOM: { color: DyeColor.BROWN, description: 'sieniä' },
  RED_MUSHROOM: { color: DyeColor.BROWN, description: 'myrkkyä' },
  SUGAR_CANE: { color: DyeColor.BROWN, description: 'sokeria' },
  EGG: { description: 'kananmunia' },
  SUGAR: { color: DyeColor.WHITE, description: 'sokeria' },
  NETHER_WART: {
    color: DyeColor.WHITE,
    description: 'hiivaa',
    tempMax: 50.0,
  },
  TWISTING_VINES: {
    color: DyeColor.GREEN,
    description: 'yrttejä',
  },
  WHEAT: { color: DyeColor.YELLOW, description: 'viljaa' },
  POISONOUS_POTATO: {
    1: {
      color: DyeColor.YELLOW,
      description: 'juustoa',
    },
    2: {
      color: DyeColor.BROWN,
      description: 'lihaa',
    },
    5: {
      color: DyeColor.YELLOW,
      description: 'sokeria',
    },
    6: {
      color: DyeColor.RED,
      description: 'lihaa',
    },
    8: {
      color: DyeColor.BROWN,
      description: 'kaakaota',
    },
    19: {
      color: DyeColor.RED,
      description: 'hedelmiä',
    },
    20: {
      color: DyeColor.RED,
      description: 'marjoja',
    },
    21: {
      color: DyeColor.LIME,
      description: 'hedelmiä',
    },
    23: {
      color: DyeColor.PINK,
      description: 'lihaa',
    },
    26: {
      color: DyeColor.BLUE,
      description: 'marjoja',
    },
    28: {
      color: DyeColor.BROWN,
      description: 'kahvia',
    },
  },
};

/**
 * Retrieve ingredient properties for material
 * @param name material name
 * @param modelId for nested ingredients
 */
export function getIngredientProperties(
  name: string,
  modelId?: number,
): IngredientProperties | undefined {
  if (modelId /* && Object.values(VkItem).includes(Material.valueOf(name)) */) {
    return (INGREDIENTS[name] as Ingredient)[modelId];
  }

  return INGREDIENTS[name];
}

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
 * Create new brew itemframe at given location
 * @param location must be the location of a cauldron
 */
function spawnBrewItem(location: Location) {
  // Return if the face is obstructed
  if (!getItemFramesAt(location).isEmpty()) return;

  // Spawn new itemframe
  const itemFrame = location.world.spawnEntity(
    location,
    EntityType.ITEM_FRAME,
    SpawnReason.CUSTOM,
    {
      accept(itemFrame: ItemFrame) {
        itemFrame.setFacingDirection(BlockFace.UP, true);
        itemFrame.setVisible(false);
        itemFrame.setInvulnerable(true);
        itemFrame.setSilent(true);
        itemFrame.setFixed(true);
      },
    },
  ) as ItemFrame;

  // Create new brew item
  const itemFrameItem = Brew.create({
    cauldron: locationToObj(location.subtract(0.0, 1.0, 0.0)),
    date: Date.now(),
    heatSource: {
      exists: true,
      since: Date.now(),
      temp: 20.0, // ? Could biome temperature be used here to get initial ambient temperature?
    },
  });

  // Set default color
  const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
  meta.color = DyeColor.BLUE.color;
  itemFrameItem.itemMeta = meta;

  itemFrame.setItem(itemFrameItem, false);
}

/**
 * Search and retrieve the first found brew itemframe
 * @param location
 */
export function getBrewItemFrame(location: Location): ItemFrame | undefined {
  for (const itemFrame of getItemFramesAt(location)) {
    if (Brew.check(itemFrame.item)) return itemFrame;
  }

  return;
}

/**
 * Search and destroy itemframes containing a brew item
 * @param location
 */
function removeBrewItem(location: Location) {
  // Check all detected frames
  for (const entity of getItemFramesAt(location)) {
    if (Brew.check((entity as ItemFrame).item)) entity.remove();
  }
}

/**
 * Check if the given block is a valid heat source
 * @param validateData set to false to ignore blockData
 */
function isValidHeatSource(block: Block, validateData?: boolean): boolean {
  return (
    (block.type === Material.CAMPFIRE &&
      (validateData ?? true ? (block.blockData as Campfire).isLit() : true)) ||
    (block.type === Material.FIRE &&
      block.getRelative(BlockFace.DOWN).type === Material.NETHERRACK)
  );
}

/**
 * Get the expected location of a cauldron relative to given block.
 * Returns -1 if block is not used as a part of a heat source
 */
function getCauldronOffset(block: Block): number {
  switch (block.type) {
    case Material.CAULDRON:
      return 0;
    case Material.NETHERRACK:
      return 2;
    case Material.FIRE:
    case Material.CAMPFIRE:
      return 1;
    default:
      return -1;
  }
}

/**
 * Check if the block is a valid brew station
 * @param validateData set to false to ignore blockData
 */
export function isValidBrewStation(
  block: Block,
  validateData?: boolean,
): boolean {
  return (
    (block.type === Material.CAULDRON && (validateData ?? true)
      ? (block.blockData as Levelled).level >= 3
      : true) &&
    isValidHeatSource(block.getRelative(BlockFace.DOWN), validateData)
  );
}

/**
 * Newton's Law of Cooling. Was used to calculate the time of death, but works fine in here too!
 * Result is in one decimal precision.
 * @param time in seconds
 */
export function calculateTemp(
  from: number,
  to: number,
  time: number,
  constant: number,
): number {
  return (
    Math.round((to + (from - to) * Math.pow(Math.E, constant * time)) * 10.0) /
    10.0
  );
}

/**
 * Water temperature as the function of time
 * @param time in seconds
 */
export function calculateWaterTemp(
  from: number,
  to: number,
  time: number,
): number {
  return calculateTemp(from, to, time, -0.035);
}

/**
 * Calculates the current temperature of a brew
 */
function calculateBrewTemp(brew: any): number {
  return calculateWaterTemp(
    brew.heatSource.temp,
    brew.heatSource.exists ? 100.0 : 20.0,
    (Date.now() - brew.heatSource.since) / 1000.0,
  );
}

/**
 * Update brew heat source information
 */
function setBrewHeatSource(brewItemFrame: ItemFrame, exists: boolean) {
  const brewItem = brewItemFrame.item;

  const brew = Brew.get(brewItem);

  if (!brew) return;

  // Calculate temperature at the time of the heat source state changed
  const temp = calculateBrewTemp(brew);

  brew.heatSource = {
    exists,
    since: Date.now(),
    temp,
  };

  brewItemFrame.setItem(brewItem, false);
}

/**
 * Validates player interaction with itemframe that contains a brew item.
 */
registerEvent(
  PlayerInteractEntityEvent,
  (event) => {
    const itemFrame = event.rightClicked as ItemFrame;

    // Validate entity
    if (!itemFrame) return;

    const itemFrameItem = itemFrame.item;

    // Validate item
    if (!itemFrameItem) return;

    // Validate custom item
    // Prevents player from interacting with a entity that is marked for removal
    if (Brew.check(itemFrameItem)) event.setCancelled(itemFrame.isDead());
  },
  {
    priority: EventPriority.LOWEST, // listen in lowest priority so that this event is fired first
  },
);

/**
 * Handle player interaction with a brew
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Return if cancelled by the validation event
    if (event.isCancelled()) return;

    // Check if main hand
    if (event.hand !== EquipmentSlot.HAND) return;

    const item = event.player.inventory.itemInMainHand;

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    const brew = Brew.get(itemFrameItem);

    if (!brew || !brew.ingredients) return;

    const waterTemp = calculateBrewTemp(brew);

    // Describe ingredients if clicked with a empty scoop
    if (ScoopEmpty.check(item)) {
      let description = '';

      // Describe water temperature
      if (waterTemp < 25) {
        description = 'Vesi on haaleaa';
      } else if (waterTemp > 24 && waterTemp < 41) {
        description = 'Vesi on lämmintä';
      } else if (waterTemp > 40 && waterTemp < 96) {
        description = 'Vesi on kuumaa';
      } else if (waterTemp > 95) {
        description = 'Vesi on kiehuvaa';
      }

      event.player.world.playSound(
        itemFrame.location,
        'item.bucket.fill_fish',
        SoundCategory.PLAYERS,
        1.0,
        1.0,
      );

      // If no ingredients
      if (brew.ingredients.length < 1) {
        event.player.sendMessage(description);
        return;
      }

      // Generate descriptions from the ingredients
      const descriptions = brew.ingredients
        .map(
          (ingredient) =>
            getIngredientProperties(ingredient.name, ingredient.modelId)
              ?.description,
        )
        .filter((ingredient, index, self) => self.indexOf(ingredient) == index);

      // Join descriptions into one string and replace the last delimiter with 'ja'
      description +=
        ' ja siinä vaikuttaisi olevan ' +
        descriptions.join(', ').replace(/,([^,]*)$/, ' ja$1');

      event.player.sendMessage(description);

      return;
    }

    // Retrieve ingredient properties
    const properties = getIngredientProperties(
      item.type.toString(),
      item.itemMeta.hasCustomModelData()
        ? item.itemMeta.customModelData
        : undefined,
    );

    // Return if not a valid ingredient
    // Somehow a custom item with modelId 0 is not undefined even though has no own data. Probably a TS feature because it has nested data.
    // Prevented by just checking if it has one of the ingredient properties
    if (!properties || !properties.description) return;

    // Limit ingredient amount
    if (brew.ingredients.length >= 18) {
      event.player.sendMessage('Pata on täysi');
      return;
    }

    // Add ingredient to brew
    brew.ingredients.push({
      name: item.type.toString(),
      modelId: item.itemMeta.hasCustomModelData()
        ? item.itemMeta.customModelData
        : undefined,
      date: Date.now(),
      temp: waterTemp,
    });

    // Update brew color
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
    // event.player.world.playSound(
    //   itemFrame.location,
    //   Sound.ENTITY_ITEM_PICKUP,
    //   0.2,
    //   Math.random(),
    // );

    // Splash sound effect
    event.player.world.playSound(
      itemFrame.location,
      'entity.generic.splash',
      SoundCategory.PLAYERS,
      0.5,
      1.0,
    );
  },
);

/**
 * By default, puts the brew into a bucket.
 * Can be cancelled by some other feature for custom behaviour.
 * Possible cases could be custom foods, drinks, potions etc...
 */
registerEvent(
  PlayerInteractEntityEvent,
  (event) => {
    // Check that the clicked itemframe contains a brew item
    if (!Brew.check((event.rightClicked as ItemFrame).item)) return;

    // Return if cancelled by the validator or some other feature
    if (event.isCancelled()) return;

    // Check that player clicked with main hand
    if (event.hand !== EquipmentSlot.HAND) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    // Check that the item in main hand is a empty bucket
    if (itemInMainHand.type !== Material.BUCKET) return;

    // No need to check entity type because it is already handled by the lower priority event
    const itemFrame = event.rightClicked as ItemFrame;

    const brew = Brew.get(itemFrame.item);

    // Make type checker happy
    if (!brew || !brew.ingredients) return;

    let brewBucketItem;

    // Create new bucket from brew. If brew has no ingredients, create a water bucket instead
    if (brew.ingredients.length > 0) {
      // Copy ingredients from brew to brew bucket
      brewBucketItem = BrewBucket.create(createBrewContainer(brew));

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

    event.player.world.playSound(
      cauldron.location,
      'item.bucket.fill',
      SoundCategory.PLAYERS,
      1.0,
      1.0,
    );
  },
  {
    priority: EventPriority.HIGH, // listen in high priority so the event is called last
  },
);

/**
 * Create new brew station or update the state of existing one
 */
registerEvent(BlockPlaceEvent, (event) => {
  const offset = getCauldronOffset(event.block);

  if (offset < 0) return;

  const location = event.block.location.add(0.0, offset, 0.0);

  if (location.block.type !== Material.CAULDRON) return;

  const itemFrameLocation = location.clone().add(0.0, 1.0, 0.0);

  const brewItemFrame = getBrewItemFrame(itemFrameLocation);

  if (isValidBrewStation(location.block)) {
    if (brewItemFrame) {
      // Existing brew station is now valid
      setBrewHeatSource(brewItemFrame, true);
    } else {
      // New brew station was created
      spawnBrewItem(itemFrameLocation);
    }
  } else if (brewItemFrame) {
    // Existing brew station lost heat source
    setBrewHeatSource(brewItemFrame, false);
  }
});

/**
 * Removes brew itemframes if a cauldron is broken.
 * Update heat source information if heat source is broken
 */
registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type === Material.CAULDRON) {
    removeBrewItem(event.block.location.add(0.0, 1.0, 0.0));
    return;
  }

  const offset = getCauldronOffset(event.block);

  if (offset < 0) return;

  const location = event.block.location.add(0.0, offset, 0.0);

  if (location.block.type !== Material.CAULDRON) return;

  const itemFrameLocation = location.clone().add(0.0, 1.0, 0.0);

  const brewItemFrame = getBrewItemFrame(itemFrameLocation);

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

/**
 * Detect if a fire is destroyed by breaking the block under it
 */
registerEvent(BlockDestroyEvent, (event) => {
  if (event.block.type !== Material.FIRE) return;

  const location = event.block.location.add(0.0, 1.0, 0.0);

  if (!isValidBrewStation(location.block)) return;

  const brewItemFrame = getBrewItemFrame(location.add(0.0, 1.0, 0.0));

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

/**
 * Update heat source information if other block destroys fire
 */
registerEvent(BlockFromToEvent, (event) => {
  if (!isValidBrewStation(event.toBlock.getRelative(BlockFace.UP))) return;

  const brewItemFrame = getBrewItemFrame(
    event.toBlock.getRelative(BlockFace.UP, 2).location,
  );

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

/**
 * Spawn new brew if a cauldron with existing heat source is filled with water.
 * Prevent player from adding or removing water
 */
registerEvent(CauldronLevelChangeEvent, (event) => {
  const brewItemFrame = getBrewItemFrame(
    event.block.location.add(0.0, 1.0, 0.0),
  );

  // Prevent adding or removing water
  if (brewItemFrame) {
    event.setCancelled(true);
    return;
  }

  // Check if cauldron matches the criteria for a new brew station
  if (
    event.newLevel < 3 ||
    event.block.type !== Material.CAULDRON ||
    !isValidHeatSource(event.block.getRelative(BlockFace.DOWN))
  )
    return;

  // Spawn new brew
  spawnBrewItem(event.block.location.add(0.0, 1.0, 0.0));
});

/**
 * Update heat source information if a campfire is about to get waterlogged
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (
    event.action !== Action.RIGHT_CLICK_BLOCK ||
    event.clickedBlock?.type !== Material.CAMPFIRE
  )
    return;

  if (!event.item || event.item.type !== Material.WATER_BUCKET) return;

  if (!isValidBrewStation(event.clickedBlock.getRelative(BlockFace.UP))) return;

  const brewItemFrame = getBrewItemFrame(
    event.clickedBlock.getRelative(BlockFace.UP, 2).location,
  );

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

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
