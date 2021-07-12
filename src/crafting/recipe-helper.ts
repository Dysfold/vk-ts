import { text } from 'craftjs-plugin/chat';
import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { ComplexRecipe, Recipe, ShapedRecipe } from 'org.bukkit.inventory';
import { sendMessages } from '../chat/system';
import { getPlainText } from '../chat/utils';
import { getItemNameAsComponent } from '../common/helpers/items';
import { shapedRecipe } from './utilities/shaped-recipe';

const iterator = Bukkit.server.recipeIterator();

// const RECIPES: Recipe[] = [];
const RECIPES = new Map<string, Recipe>();

while (iterator.hasNext()) {
  const recipe = iterator.next();
  const itemName = getItemNameAsComponent(recipe.result);
  const nameKey = getPlainText(itemName);
  console.log(itemName);
  RECIPES.set(nameKey, recipe);
}

console.log('Recipes: ' + RECIPES.size);

registerCommand(
  ['recipe', 'resepti'],
  (sender, _label, args) => {
    if (args.length < 1) return;
    if (!(sender instanceof Player)) return;
    const recipeResultName = args[0];
    const recipe = RECIPES.get(recipeResultName);
    displayRecipeGUI(sender, recipe);
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

function displayRecipeGUI(to: Player, recipe?: Recipe) {
  if (!recipe) return;
  if (recipe instanceof ShapedRecipe) {
    const ingredientMap = recipe.ingredientMap;
    const shape = recipe.getShape();
    console.log(JSON.stringify(shape));
    console.log(JSON.stringify(ingredientMap));
    console.log(ingredientMap);
    for (const row of shape) {
      to.sendMessage(text(row));
    }

    for (const entry of ingredientMap.entrySet()) {
      const { key: symbol, value: item } = entry;
      if (item == null) continue;
      sendMessages(to, text(`${symbol} = `), getItemNameAsComponent(item));
    }

    // const symbols = shape.join('').split('');
    // for (const symbol of symbols) {
    //   console.log(symbol);
    //   const item = ingredientMap.get(symbol);

    //   if (item)
    //     sendMessages(to, text(`${symbol} = `), getItemNameAsComponent(item));
    // }
  }
}
