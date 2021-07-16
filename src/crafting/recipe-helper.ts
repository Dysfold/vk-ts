import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { InventoryType } from 'org.bukkit.event.inventory';
import {
  BlastingRecipe,
  FurnaceRecipe,
  ItemStack,
  Recipe,
  ShapedRecipe,
  ShapelessRecipe,
  SmokingRecipe,
} from 'org.bukkit.inventory';
import { getPlainText } from '../chat/utils';
import { createGUI } from '../common/gui/gui';
import { getItemNameAsComponent } from '../common/helpers/items';
import {
  fetchLangJson,
  translationKeyToVkKey,
} from '../common/localization/respack-lang';

const iterator = Bukkit.server.recipeIterator();

const RECIPES = new Map<string, Recipe>();

function getLastPart(str: string) {
  return str.split('.').pop() ?? str;
}

async function getRecipes() {
  await fetchLangJson();
  while (iterator.hasNext()) {
    const recipe = iterator.next();
    const itemNameAsComponent = getItemNameAsComponent(recipe.result);
    const nameKey = getPlainText(itemNameAsComponent);
    const vkKey = translationKeyToVkKey(nameKey);

    const key = getLastPart(vkKey || nameKey);
    RECIPES.set(key, recipe);
  }
}
getRecipes();

registerCommand(
  ['recipe', 'resepti'],
  (sender, _label, args) => {
    if (args.length < 1) return;
    if (!(sender instanceof Player)) return;
    const recipeResultName = args[0];
    const recipe = RECIPES.get(recipeResultName);

    if (recipe !== undefined) {
      displayRecipeGUI(sender, recipe);
    }
    //   const customItem = NAME_TO_CUSTOM_ITEM.get(customItemName);
    //   if (customItem == undefined) return;
    //   giveItem(sender, customItem.create({ source: 'custom-give' }));
  },
  {
    completer: (_sender, _alias, args) => {
      return Array.from(RECIPES.keys());
    },
    executableBy: 'players',
    description: '/recipes <name>',
  },
);

type AnyFurnaceRecipe = FurnaceRecipe | BlastingRecipe | SmokingRecipe;

function isFurnaceRecipe(recipe: Recipe): recipe is AnyFurnaceRecipe {
  return (
    recipe instanceof FurnaceRecipe ||
    recipe instanceof BlastingRecipe ||
    recipe instanceof SmokingRecipe
  );
}

function displayRecipeGUI(to: Player, recipe: Recipe) {
  if (recipe instanceof ShapedRecipe) {
    displayShapedRecipeGUI(to, recipe);
    return;
  }
  if (recipe instanceof ShapelessRecipe) {
    displayShapelessRecipeGUI(to, recipe);
    return;
  }
  if (isFurnaceRecipe(recipe)) {
    displayFurnaceRecipeGUI(to, recipe);
    return;
  }
}

function displayShapedRecipeGUI(to: Player, recipe: ShapedRecipe) {
  const ingredientMap = recipe.ingredientMap;
  const shape = recipe.getShape();

  const width = shape[0].length;

  const symbols = shape.join('').split('');
  const getIndex = (symbol: string) => {
    const idx = symbols.indexOf(symbol);
    const idxInRow = idx % width;
    const row = Math.floor(idx / width);
    const index = 3 * row + idxInRow + 1;
    return index;
  };

  const itemStructure = new Map<number, ItemStack>();

  for (const entry of ingredientMap.entrySet()) {
    const { key: symbol, value: item } = entry;
    if (item == null) continue;
    const index = getIndex(symbol);
    if (index == -1) continue;

    itemStructure.set(index, item);
  }

  itemStructure.set(0, recipe.result);

  createGUI(to, itemStructure, InventoryType.WORKBENCH);
}

function displayShapelessRecipeGUI(to: Player, recipe: ShapelessRecipe) {
  const ingredientMap = recipe.ingredientList;

  const itemStructure = new Map<number, ItemStack>();

  for (const [index, item] of ingredientMap.entries()) {
    itemStructure.set(index + 1, item);
  }

  itemStructure.set(0, recipe.result);

  createGUI(to, itemStructure, InventoryType.WORKBENCH);
}

function displayFurnaceRecipeGUI(to: Player, recipe: AnyFurnaceRecipe) {
  const itemStructure = new Map<number, ItemStack>([
    [0, recipe.input],
    [2, recipe.result],
  ]);
  createGUI(to, itemStructure, InventoryType.FURNACE);
}
