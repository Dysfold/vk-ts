import { Material } from 'org.bukkit';
import {
  DoughApplePie,
  DoughBerryPie,
  DoughCheesePie,
  DoughChickenPie,
  DoughChocolatePie,
  DoughCreamPie,
  DoughFishPie,
  DoughMeatPie,
  DoughPotatoPie,
  DoughPumpkinPie,
} from '../../../food/baking/dough-items';
import {
  ApplePie,
  BerryPie,
  CaramelApple,
  Cheese,
  CheesePie,
  ChickenPie,
  Chocolate,
  ChocolatePie,
  CoffeeBeans,
  CreamPie,
  FishPie,
  FreshCoffeeBeans,
  FriedEgg,
  MeatPie,
  PotatoPie,
} from '../../../food/custom-foods';
import { furnaceRecipe } from '../../utilities/furnace-recipe';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

shapedRecipe({
  key: 'cheese',
  shape: ['MMM', 'MMM', 'MMM'],
  ingredients: {
    M: Material.MILK_BUCKET,
  },
  result: Cheese.create({}),
});

// Meatballs

furnaceRecipe({
  key: 'fried_egg',
  input: Material.EGG,
  result: FriedEgg.create({}),
  seconds: 30,
  furnaces: ['smoker', 'furnace'],
});

shapelessRecipe({
  key: 'chocolate',
  ingredients: [
    Material.MILK_BUCKET,
    Material.COCOA_BEANS,
    Material.COCOA_BEANS,
    Material.COCOA_BEANS,
    Material.COCOA_BEANS,
    Material.SUGAR,
    Material.SUGAR,
    Material.SUGAR,
  ],
  result: Chocolate.create({}),
});

furnaceRecipe({
  key: 'pumpkin_pie',
  input: DoughPumpkinPie.create({}),
  result: Material.PUMPKIN_PIE,
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'berry_pie',
  input: DoughBerryPie.create({}),
  result: BerryPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'potato_pie',
  input: DoughPotatoPie.create({}),
  result: PotatoPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'fish_pie',
  input: DoughFishPie.create({}),
  result: FishPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'apple_pie',
  input: DoughApplePie.create({}),
  result: ApplePie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'chocolate_pie',
  input: DoughChocolatePie.create({}),
  result: ChocolatePie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'meat_pie',
  input: DoughMeatPie.create({}),
  result: MeatPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'chicken_pie',
  input: DoughChickenPie.create({}),
  result: ChickenPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'cream_pie',
  input: DoughCreamPie.create({}),
  result: CreamPie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

furnaceRecipe({
  key: 'cheese_pie',
  input: DoughCheesePie.create({}),
  result: CheesePie.create({}),
  seconds: 20,
  furnaces: ['smoker', 'furnace'],
});

shapelessRecipe({
  key: 'caramel_apple',
  ingredients: [Material.SUGAR, Material.HONEY_BOTTLE, Material.APPLE],
  result: CaramelApple.create({}),
});

furnaceRecipe({
  key: 'coffee_beans',
  input: FreshCoffeeBeans.create({}),
  result: CoffeeBeans.create({}),
  seconds: 30,
  furnaces: ['smoker', 'furnace'],
});
