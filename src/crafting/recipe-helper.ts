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
import { translationKeyToVkMaterialAlias } from '../common/localization/respack-lang';

const iterator = Bukkit.server.recipeIterator();

const RECIPES = new Map<string, Recipe[]>();

/**
 * Parse unnesessary namespaces and other prefixes from the translation key
 * @param str Translation key for the item. For example block.minecraft.oak_sign
 * @returns Last string after "." for example "oak_sign"
 */
export function getLastPart(str: string) {
  return str.split('.').pop() ?? str;
}

async function getRecipes() {
  while (iterator.hasNext()) {
    const recipe = iterator.next();
    const itemNameAsComponent = getItemNameAsComponent(recipe.result);
    const nameKey = getPlainText(itemNameAsComponent);
    const vkKey = translationKeyToVkMaterialAlias(nameKey);

    const key = getLastPart(vkKey || nameKey);

    const recipeList = RECIPES.get(key) ?? [];
    recipeList.push(recipe);
    RECIPES.set(key, recipeList);
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

    const recipeIndex = (Number.parseInt(args?.[1]) || 1) - 1;

    if (recipe !== undefined) {
      displayRecipeGUI(sender, recipe[recipeIndex]);
      if (recipe.length > 1) {
        sender.sendMessage(
          `Useita reseptejä löytyi (${recipe.length} kpl). Katso muut /resepti ${args[0]} <numero 1-${recipe.length}> `,
        );
      }
    }
    //   const customItem = NAME_TO_CUSTOM_ITEM.get(customItemName);
    //   if (customItem == undefined) return;
    //   giveItem(sender, customItem.create({ source: 'custom-give' }));
  },
  {
    completer: (_label, _alias, args) => {
      if (args.length == 1) return Array.from(RECIPES.keys());
      return [];
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
