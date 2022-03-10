import { Material } from 'org.bukkit';
import {
  DoughApplePie,
  DoughBerryPie,
  DoughCheesePie,
  DoughChickenPie,
  DoughChocolatePie,
  DoughCreamPie,
  DoughEmptyPie,
  DoughFishPie,
  DoughMeatPie,
  DoughPotatoPie,
  DoughPumpkinPie,
} from '../../../food/baking/dough-items';
import { Cheese, Chocolate } from '../../../food/custom-foods';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

shapelessRecipe({
  key: 'dough_pumpkin_pie',
  ingredients: [DoughEmptyPie.create({}), Material.PUMPKIN],
  result: DoughPumpkinPie.create({}),
});

shapelessRecipe({
  key: 'dough_berry_pie',
  ingredients: [
    DoughEmptyPie.create({}),
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
    Material.SWEET_BERRIES,
  ],
  result: DoughBerryPie.create({}),
});

shapelessRecipe({
  key: 'dough_potato_pie',
  ingredients: [DoughEmptyPie.create({}), Material.BAKED_POTATO],
  result: DoughPotatoPie.create({}),
});

shapelessRecipe({
  key: 'dough_fish_pie',
  ingredients: [DoughEmptyPie.create({}), Material.COOKED_SALMON],
  result: DoughFishPie.create({}),
});

shapelessRecipe({
  key: 'dough_apple_pie',
  ingredients: [DoughEmptyPie.create({}), Material.APPLE],
  result: DoughApplePie.create({}),
});

shapelessRecipe({
  key: 'dough_chocolate_pie',
  ingredients: [DoughEmptyPie.create({}), Chocolate.create({})],
  result: DoughChocolatePie.create({}),
});

shapelessRecipe({
  key: 'dough_meat_pie',
  ingredients: [DoughEmptyPie.create({}), Material.COOKED_BEEF],
  result: DoughMeatPie.create({}),
});

shapelessRecipe({
  key: 'dough_chicken_pie',
  ingredients: [DoughEmptyPie.create({}), Material.COOKED_CHICKEN],
  result: DoughChickenPie.create({}),
});

shapelessRecipe({
  key: 'dough_cream_pie',
  ingredients: [DoughEmptyPie.create({}), Material.MILK_BUCKET],
  result: DoughCreamPie.create({}),
});

shapelessRecipe({
  key: 'dough_cheese_pie',
  ingredients: [DoughEmptyPie.create({}), Cheese.create({})],
  result: DoughCheesePie.create({}),
});
