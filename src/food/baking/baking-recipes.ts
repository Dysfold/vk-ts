import { Material } from 'org.bukkit';
import { VkMaterial } from '../../common/items/VkMaterial';
import { bakingRecipe } from './baking';
import { DoughBread, DoughCookie, DoughEmptyPie } from './dough-items';
import {
  DoughBreadInBowl,
  DoughBreadRisenInBowl,
  DoughCookieInBowl,
  DoughPieInBowl,
} from './in-bowl-items';

// Bread
bakingRecipe({
  dough: DoughBreadInBowl,
  doughRisen: DoughBreadRisenInBowl,
  result: DoughBread.create({}),
  ingredients: [VkMaterial.FLOUR, Material.NETHER_WART, Material.POTION],
  risingTime: 5,
});

// Empty pie
bakingRecipe({
  dough: DoughPieInBowl,
  doughRisen: DoughPieInBowl,
  result: DoughEmptyPie.create({}),
  ingredients: [
    VkMaterial.FLOUR,
    Material.SUGAR,
    Material.POTION,
    Material.EGG,
  ],
});

// Cookie
bakingRecipe({
  dough: DoughCookieInBowl,
  doughRisen: DoughCookieInBowl,
  result: DoughCookie.create({}),
  ingredients: [
    VkMaterial.FLOUR,
    Material.SUGAR,
    Material.COCOA_BEANS,
    Material.POTION,
  ],
});
