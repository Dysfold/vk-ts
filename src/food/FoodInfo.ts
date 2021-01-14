import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';

const BOWL = new ItemStack(Material.BOWL);

// prettier-ignore
export const FoodInfo = new Map<Material, { foodPoints: number; saturation: number; result?: ItemStack }>([
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
  //[Material.POISONOUS_POTATO, { foodPoints: 2,   saturation: 1.2    }], // TODO: Effects 
  [Material.POTATO,           { foodPoints: 1,   saturation: 0.6    }],
  //[Material.PUFFERFISH,       { foodPoints: 1,   saturation: 0.2    }], // TODO: Effects
  [Material.PUMPKIN_PIE,      { foodPoints: 8,   saturation: 4.8    }],
  [Material.RABBIT_STEW,      { foodPoints: 10,  saturation: 12,    result: BOWL  }],
  [Material.BEEF,             { foodPoints: 3,   saturation: 1.8    }],
  [Material.CHICKEN,          { foodPoints: 2,   saturation: 1.2    }],
  [Material.COD,              { foodPoints: 2,   saturation: 0.4    }],
  [Material.MUTTON,           { foodPoints: 2,   saturation: 1.2    }],
  [Material.PORKCHOP,         { foodPoints: 3,   saturation: 1.8    }],
  [Material.RABBIT,           { foodPoints: 3,   saturation: 1.8    }],
  [Material.SALMON,           { foodPoints: 2,   saturation: 0.4    }],
  //[Material.ROTTEN_FLESH,     { foodPoints: 4,   saturation: 0.8    }], // TODO: Effects
  //[Material.SPIDER_EYE,       { foodPoints: 2,   saturation: 3.2    }], // TODO: Effects
  [Material.COOKED_BEEF,      { foodPoints: 8,   saturation: 12.8   }],
  //[Material.SUSPICIOUS_STEW,  { foodPoints: 6,   saturation: 7.2    }], // TODO: Effects
  [Material.SWEET_BERRIES,    { foodPoints: 2,   saturation: 0.4    }],
  [Material.TROPICAL_FISH,    { foodPoints: 1,   saturation: 0.2    }],
]);
