import { Color, DyeColor, Location, Material, SoundCategory } from 'org.bukkit';
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
import { LeatherArmorMeta } from 'org.bukkit.inventory.meta';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { VkItem } from '../common/items/VkItem';
import { EventPriority } from 'org.bukkit.event';
import { Campfire } from 'org.bukkit.block.data.type';
import { BlockDestroyEvent } from 'com.destroystokyo.paper.event.block';
import { Data } from '../common/datas/yup-utils';
import { spawnHiddenItemFrame } from '../common/entities/item-frame';
import { text } from 'craftjs-plugin/chat';

/**
 * Ingredient schema definition
 */
export const IngredientSchema = yup.object({
  /**
   * Material name
   */
  name: yup.string().required(),

  /**
   * Custom item id
   */
  modelId: yup.number().optional(),

  /**
   * Date when the ingredient was added to a brew
   */
  date: yup.number().required(),

  /**
   * Brew temperature when the ingredient was added
   */
  temp: yup.number().required(),
});

/**
 * Brew schema definition
 */
export const BrewSchema = {
  /**
   * Brew ingredients
   */
  ingredients: yup.array(IngredientSchema.required()).default([]).required(),

  /**
   * Creation date
   */
  date: yup.number().required(),

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
   * Current heat source information
   */
  heatSource: yup
    .object({
      /**
       * Current state of the heat source
       */
      active: yup.boolean().optional(),

      /**
       * Time since the heat source state had changed
       */
      since: yup.number().required(),

      /**
       * Temperature at the time the heat source state changed
       */
      temp: yup.number().required(),
    })
    .required(),
};

/**
 * The brew on a cauldron
 */
export const Brew = new CustomItem({
  id: 1000,
  type: VkItem.COLORABLE,
  data: {
    ...BrewSchema,
  },
});

/**
 * General purpose brew schema definition for containers
 */
export const BrewContainerSchema = {
  /**
   * Brew ingredients
   */
  ingredients: yup.array(IngredientSchema.required()).required(),

  /**
   * Date when the brew was put into container
   */
  date: yup.number().required(),

  /**
   * Date when the brew was created
   */
  brewCreationDate: yup.number().required(),

  /**
   * Brew temperature when put into this container
   */
  brewTemp: yup.number().required(),
};

/**
 * Brew in a bucket
 */
export const BrewBucket = new CustomItem({
  id: 1,
  type: VkItem.COLORABLE,
  name: text('Seosämpäri'),
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
  SUGAR: { description: 'sokeria' },
  NETHER_WART: {
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
    9: {
      color: DyeColor.YELLOW,
      description: 'inkivääriä',
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
 * Water temperature stages
 */
export enum WaterTemp {
  LUKEWARM = 25,
  WARM = 45,
  HOT = 90,
  BOILING = 100,
}

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
function spawnBrewItemFrame(location: Location) {
  // Return if the face is obstructed
  if (!getItemFramesAt(location).isEmpty()) return;

  // Create new brew item
  const itemFrameItem = Brew.create({
    ingredients: [],
    date: Date.now(),
    cauldron: locationToObj(location.subtract(0.0, 1.0, 0.0)),
    heatSource: {
      active: true,
      since: Date.now(),
      temp: 20.0, // ? Could biome temperature be used here to get initial ambient temperature?
    },
  });

  // Set default color
  const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
  meta.color = DyeColor.BLUE.color;
  itemFrameItem.itemMeta = meta;

  // Create item frame
  return spawnHiddenItemFrame(location.block, BlockFace.UP, itemFrameItem);
}

/**
 * Search and retrieve the first found brew itemframe
 * @param location
 */
function getBrewItemFrame(location: Location): ItemFrame | undefined {
  for (const itemFrame of getItemFramesAt(location)) {
    if (Brew.check(itemFrame.item)) return itemFrame;
  }

  return;
}

/**
 * Search and destroy itemframes containing a brew item
 * @param location
 */
function removeBrewItemFrame(location: Location) {
  // Check all detected frames
  for (const entity of getItemFramesAt(location)) {
    if (Brew.check((entity as ItemFrame).item)) entity.remove();
  }
}

/**
 * Check if the given block is a valid heat source
 * @param validate set to false to ignore blockData
 */
function isValidHeatSource(block: Block, validate?: boolean): boolean {
  return (
    (block.type === Material.CAMPFIRE &&
      (validate ?? true ? (block.blockData as Campfire).isLit() : true)) ||
    (block.type === Material.FIRE &&
      block.getRelative(BlockFace.DOWN).type === Material.NETHERRACK)
  );
}

/**
 * Get the expected location of a cauldron relative to given block.
 * Returns -1 if block is not a part of a heat source
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
 * @param validate set to false to ignore blockData
 */
function isValidBrewStation(block: Block, validate?: boolean): boolean {
  return (
    (block.type === Material.CAULDRON && (validate ?? true)
      ? (block.blockData as Levelled).level >= 3
      : true) && isValidHeatSource(block.getRelative(BlockFace.DOWN), validate)
  );
}

/**
 * Newton's Law of Cooling. Was used to calculate the time of death, but works fine in here too!
 * Result is in one decimal precision.
 * @param time in seconds
 */
function calculateNewtonianWaterTemp(
  from: number,
  to: number,
  time: number,
): number {
  return (
    Math.round((to + (from - to) * Math.pow(Math.E, -0.035 * time)) * 10.0) /
    10.0
  );
}

/**
 * Calculates the current temperature of a brew
 */
function calculateBrewTemp(brew: Data<typeof BrewSchema>): number {
  return calculateNewtonianWaterTemp(
    brew.heatSource.temp,
    brew.heatSource.active ? 100.0 : 20.0,
    (Date.now() - brew.heatSource.since) / 1000.0,
  );
}

/**
 * Update brew heat source information
 */
function setBrewHeatSource(brewItemFrame: ItemFrame, active: boolean) {
  const brewItem = brewItemFrame.item;

  const brew = Brew.get(brewItem);

  if (!brew) return;

  // Calculate temperature at the time of the heat source state changed
  const temp = calculateBrewTemp(brew);

  brew.heatSource = {
    active,
    since: Date.now(),
    temp,
  };

  brewItemFrame.setItem(brewItem, false);
}

/**
 * Validate playr interaction with a brew item frame
 */
function validatePlayerBrewInteraction(event: PlayerInteractEntityEvent) {
  if (event.rightClicked.type !== EntityType.ITEM_FRAME) return;

  const itemFrame = event.rightClicked as ItemFrame;

  if (Brew.check(itemFrame.item))
    return event.hand === EquipmentSlot.HAND && !itemFrame.isDead();

  return;
}

// function colorDistance(st: Color, nd: Color) {
//   return Math.sqrt(
//     (nd.red - st.red) ** 2 +
//       (nd.green - st.green) ** 2 +
//       (nd.blue - st.blue) ** 2,
//   );
// }

// function colorDistancePercentage(st: Color, nd: Color) {
//   return colorDistance(st, nd) / Math.sqrt(255 ** 2 + 255 ** 2 + 255 ** 2);
// }

/**
 * Handle player interaction with a brew
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    if (!validatePlayerBrewInteraction(event)) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    if (itemInMainHand.type === Material.AIR) return;

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    const brew = Brew.get(itemFrameItem);

    if (!brew || !brew.ingredients) return;

    const waterTemp = calculateBrewTemp(brew);

    // Describe ingredients if clicked with a empty scoop
    if (ScoopEmpty.check(itemInMainHand)) {
      let description = '';

      // Describe water temperature
      if (waterTemp < WaterTemp.LUKEWARM) {
        description = 'Vesi on haaleaa';
      } else if (waterTemp < WaterTemp.WARM) {
        description = 'Vesi on lämmintä';
      } else if (waterTemp < WaterTemp.HOT) {
        description = 'Vesi on kuumaa';
      } else {
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
      itemInMainHand.type.toString(),
      itemInMainHand.itemMeta.hasCustomModelData()
        ? itemInMainHand.itemMeta.customModelData
        : undefined,
    );

    // Return if not a valid ingredient
    // Also check one of the properties for undefined since a custom item with modelId 0 is not undefined even if it has no own data (probably a TS feature)
    if (!properties || !properties.description) return;

    // Limit ingredient amount
    if (brew.ingredients.length >= 24) {
      event.player.sendMessage('Pata on täysi');
      return;
    }

    // Some ingredients might not withstand too high temperatures and are destroyed immediately
    if (!properties.tempMax || waterTemp < properties.tempMax) {
      // Add ingredient to brew
      brew.ingredients.push({
        name: itemInMainHand.type.toString(),
        modelId: itemInMainHand.itemMeta.hasCustomModelData()
          ? itemInMainHand.itemMeta.customModelData
          : undefined,
        date: Date.now(),
        temp: waterTemp,
      });
    } else {
      event.player.world.playSound(
        itemFrame.location,
        'block.fire.extinguish',
        SoundCategory.PLAYERS,
        0.5,
        1.0,
      );
    }

    // Update brew color
    if (properties && properties.color) {
      const meta = itemFrameItem.itemMeta as LeatherArmorMeta;

      // Specify what percentage of the final color should come from the current color
      const w = 0.75;

      // Blend ingredient color with brew color
      const blend = Color.fromRGB(
        (w * meta.color.red + (1 - w) * properties.color.color.red) | 0,
        (w * meta.color.green + (1 - w) * properties.color.color.green) | 0,
        (w * meta.color.blue + (1 - w) * properties.color.color.blue) | 0,
      );

      meta.color = blend;

      // const distance = colorDistancePercentage(meta.color, blend);

      // log.info(distance);

      // if (distance > 0.05) {
      //   meta.color = blend;
      // }

      itemFrameItem.itemMeta = meta;
    }

    // Update item frame item after modify
    itemFrame.setItem(itemFrameItem, false);

    // Remove item from player
    itemInMainHand.amount -= 1;

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
    if (event.isCancelled() || !validatePlayerBrewInteraction(event)) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    if (itemInMainHand.type !== Material.BUCKET) return;

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    const brew = Brew.get(itemFrameItem);

    if (!brew || !brew.ingredients) return;

    let brewBucketItem;

    // Create new bucket from brew. If brew has no ingredients, create a water bucket instead
    if (brew.ingredients.length > 0) {
      // Copy ingredients from brew to brew bucket
      brewBucketItem = BrewBucket.create({
        ingredients: brew.ingredients,
        date: Date.now(),
        brewCreationDate: brew.date,
        brewTemp: calculateBrewTemp(brew),
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

    event.player.world.playSound(
      cauldron.location,
      'item.bucket.fill',
      SoundCategory.PLAYERS,
      1.0,
      1.0,
    );
  },
  {
    priority: EventPriority.HIGH, // event is called last to let either validation cancel it or some other feature override it
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
      spawnBrewItemFrame(itemFrameLocation);
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
    removeBrewItemFrame(event.block.location.add(0.0, 1.0, 0.0));
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
  spawnBrewItemFrame(event.block.location.add(0.0, 1.0, 0.0));
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
 * Fallback to prevent brew item from spawning
 */
Brew.event(
  ItemSpawnEvent,
  (event) => event.entity.itemStack,
  async (event) => {
    event.setCancelled(true);
  },
);
