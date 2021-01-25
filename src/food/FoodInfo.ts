import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ItemStack } from 'org.bukkit.inventory';
import {
  eatPoisonousPotato,
  eatPufferfish,
  eatRawChicken,
  eatRottenFlesh,
  eatSpiderEye,
  eatSuspiciousStew,
} from './food-effects';

const BOWL = new ItemStack(Material.BOWL);

// prettier-ignore
export const FoodInfo = new Map<Material, { foodPoints: number; saturation: number; result?: ItemStack; effect?: (player: Player, item?: ItemStack) => void}>([
  [Material.APPLE,            { foodPoints: 4,   saturation: 2.4    }],
  [Material.BAKED_POTATO,     { foodPoints: 5,   saturation: 6      }],
  [Material.BEETROOT,         { foodPoints: 1,   saturation: 1.2    }],
  [Material.BEETROOT_SOUP,    { foodPoints: 6,   saturation: 7.2,   result: BOWL    }],
  [Material.BREAD,            { foodPoints: 5,   saturation: 6      }],
  [Material.CARROT,           { foodPoints: 3,   saturation: 3.6    }],
  [Material.CHORUS_FRUIT,     { foodPoints: 4,   saturation: 2.4    }],
  [Material.COOKED_CHICKEN,   { foodPoints: 6,   saturation: 7.2    }],
  [Material.COOKED_COD,       { foodPoints: 5,   saturation: 6      }],
  [Material.COOKED_MUTTON,    { foodPoints: 6,   saturation: 9.6    }],
  [Material.COOKED_PORKCHOP,  { foodPoints: 8,   saturation: 12.8   }],
  [Material.COOKED_RABBIT,    { foodPoints: 5,   saturation: 6      }],
  [Material.COOKED_SALMON,    { foodPoints: 6,   saturation: 9.6    }],
  [Material.COOKIE,           { foodPoints: 2,   saturation: 0.4    }],
  [Material.DRIED_KELP,       { foodPoints: 1,   saturation: 0.6    }],
  [Material.GOLDEN_CARROT,    { foodPoints: 6,   saturation: 14.4   }],
  [Material.HONEY_BOTTLE,     { foodPoints: 6,   saturation: 1.2,   result: BOWL    }],
  [Material.MELON_SLICE,      { foodPoints: 2,   saturation: 1.2    }],
  [Material.MUSHROOM_STEW,    { foodPoints: 6,   saturation: 7.2,   result: BOWL    }],
  [Material.POISONOUS_POTATO, { foodPoints: 2,   saturation: 1.2,   effect: eatPoisonousPotato    }], 
  [Material.POTATO,           { foodPoints: 1,   saturation: 0.6    }],
  [Material.PUFFERFISH,       { foodPoints: 1,   saturation: 0.2,   effect: eatPufferfish }],
  [Material.PUMPKIN_PIE,      { foodPoints: 8,   saturation: 4.8    }],
  [Material.RABBIT_STEW,      { foodPoints: 10,  saturation: 12,    result: BOWL  }],
  [Material.BEEF,             { foodPoints: 3,   saturation: 1.8    }],
  [Material.CHICKEN,          { foodPoints: 2,   saturation: 1.2,   effect: eatRawChicken    }],
  [Material.COD,              { foodPoints: 2,   saturation: 0.4    }],
  [Material.MUTTON,           { foodPoints: 2,   saturation: 1.2    }],
  [Material.PORKCHOP,         { foodPoints: 3,   saturation: 1.8    }],
  [Material.RABBIT,           { foodPoints: 3,   saturation: 1.8    }],
  [Material.SALMON,           { foodPoints: 2,   saturation: 0.4    }],
  [Material.ROTTEN_FLESH,     { foodPoints: 4,   saturation: 0.8,   effect: eatRottenFlesh    }],
  [Material.SPIDER_EYE,       { foodPoints: 2,   saturation: 3.2,   effect: eatSpiderEye    }],
  [Material.COOKED_BEEF,      { foodPoints: 8,   saturation: 12.8   }],
  [Material.SUSPICIOUS_STEW,  { foodPoints: 6,   saturation: 7.2,   result: BOWL, effect: eatSuspiciousStew    }],
  [Material.SWEET_BERRIES,    { foodPoints: 2,   saturation: 0.4    }],
  [Material.TROPICAL_FISH,    { foodPoints: 1,   saturation: 0.2    }],
]);

// prettier-ignore
export const CustomFoodInfo = new Map<number, { foodPoints: number; saturation: number; result?: ItemStack }>([
  [1,   { foodPoints: 4,   saturation: 2.4    }], // Cheese
  [2,   { foodPoints: 5,   saturation: 6      }], // Meatballs
  [3,   { foodPoints: 3,   saturation: 4      }], // Fried egg
  [4,   { foodPoints: 6,   saturation: 6      }], // Mashed potatoes
  [5,   { foodPoints: 1,   saturation: 0.9    }], // Banana
  [6,   { foodPoints: 9,   saturation: 12,    result: new ItemStack(Material.BONE) }], // Ham
  [7,   { foodPoints: 2,   saturation: 0.4    }], // Chockolate cookie
  [8,   { foodPoints: 1,   saturation: 0.2    }], // Chockolate
  [9,   { foodPoints: 1,   saturation: 1.2    }], // Ginger
  [10,  { foodPoints: 8,   saturation: 4.8    }], // Berry pie
  [11,  { foodPoints: 8,   saturation: 4.8    }], // Potato pie
  [12,  { foodPoints: 8,   saturation: 6      }], // Fish pie
  [13,  { foodPoints: 8,   saturation: 4.8    }], // Apple pie
  [14,  { foodPoints: 8,   saturation: 4.8    }], // Chocolate pie
  [15,  { foodPoints: 8,   saturation: 6      }], // Meat pie
  [16,  { foodPoints: 8,   saturation: 4.8    }], // Chicken pie
  [17,  { foodPoints: 8,   saturation: 5      }], // Cream pie 
  [18,  { foodPoints: 8,   saturation: 4.8    }], // Cheese pie
]);
