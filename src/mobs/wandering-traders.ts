import { Material } from 'org.bukkit';
import { WanderingTrader } from 'org.bukkit.entity';
import { EntitySpawnEvent } from 'org.bukkit.event.entity';
import { ItemStack, MerchantRecipe } from 'org.bukkit.inventory';
import { RandomTable } from '../common/datas/RandomTable';

const MIN_TRADES = 2; // Minimum amount of trades on a wandering trader
const MAX_TRADES = 7; // Maximum amount of trades on a wandering trader

const trades = new RandomTable<MerchantRecipe>([
  {
    value: recipeFrom(
      1, // Max uses
      new ItemStack(Material.YELLOW_WOOL, 1), // Result
      new ItemStack(Material.GOLD_INGOT, 4), // Ingredient 1
    ),
    probability: 1,
  },
  {
    value: recipeFrom(
      5, // Max uses
      new ItemStack(Material.BLACK_WOOL, 1), // Result
      new ItemStack(Material.GOLD_INGOT, 3), // Ingredient 1
      new ItemStack(Material.GOLD_NUGGET, 1), // Ingredient 2
    ),
    probability: 2,
  },
]);

/**
 * Creates a MerchantRecipe from given items.
 * @param result Result of recipe.
 * @param ingredient1 First ingredient of recipe.
 * @param ingredient2 Second ingredient of recipe (optional).
 * @param maxUses Amount of allowed trades.
 * @returns MerchantRecipe for given items.
 */
function recipeFrom(
  maxUses: number,
  result: ItemStack,
  ingredient1: ItemStack,
  ingredient2?: ItemStack,
) {
  const recipe = new MerchantRecipe(result, 0, maxUses, false);
  recipe.ingredients = ingredient2 ? [ingredient1, ingredient2] : [ingredient1];
  return recipe;
}

registerEvent(EntitySpawnEvent, (event) => {
  if (!(event.entity instanceof WanderingTrader)) return;
  const trader = event.entity as WanderingTrader;
  const tradeAmount = Math.floor(
    Math.random() * (MAX_TRADES + 1 - MIN_TRADES) + MIN_TRADES,
  );
  const recipes = trades.randomEntries(tradeAmount, true);
  trader.recipes = recipes ? recipes : [];
});
