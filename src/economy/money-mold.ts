import { text, translate } from 'craftjs-plugin/chat';
import { Location, Material, Bukkit } from 'org.bukkit';
import { BlockFace, Dispenser } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPistonRetractEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import { CustomItem, CUSTOM_DATA_KEY } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { Currency, CurrencyModel, isCurrencyModel } from './currency';

const MoneyMold = new CustomItem({
  name: translate('vk.money_mold'),
  id: 10,
  type: VkItem.MISC,
});

// Block pushed by piston
const PRESS_BLOCK = Material.IRON_BLOCK;
const MATERIAL_CONTAINER = Material.DROPPER;

// Placeholder for copper material (1.17)
const COPPER_MATERIAL = Material.BRICK; //Material.COPPER_INGOT

// Config for coins materials. Number is the id of the currency
const RAW_MATERIALS = new Map<CurrencyModel, ItemStack[]>([
  [
    CurrencyModel.GOLDEN,
    [
      new ItemStack(Material.GOLD_INGOT, 10),
      new ItemStack(COPPER_MATERIAL, 10),
    ],
  ],
  [
    CurrencyModel.SILVER,
    [
      new ItemStack(Material.IRON_INGOT, 10),
      new ItemStack(COPPER_MATERIAL, 10),
    ],
  ],
  [
    CurrencyModel.PAPER,
    [
      new ItemStack(Material.PAPER, 10),
      new ItemStack(Material.INK_SAC, 10),
      new ItemStack(COPPER_MATERIAL, 10),
    ],
  ],
]);
const CURRENCY_MODELS = Array.from(RAW_MATERIALS.keys());

/**
 * Data for coin custom item
 */
const COIN_DATA = {
  unit: yup.string().notRequired(),
  subUnit: yup.string().notRequired(),
};

interface Coin {
  item: CustomItem<typeof COIN_DATA>;
  amount: number;
  value: number;
}

export function getCoinData(item: ItemStack) {
  if (!isMoney(item)) return undefined;
  const DATA_TYPE = dataType(CUSTOM_DATA_KEY, COIN_DATA);
  const view = dataView(DATA_TYPE, item);
  if (!view.subUnit || !view.unit) return undefined;
  return view;
}

function isMoney(item: ItemStack) {
  if (item.type !== VkItem.MONEY) return false;
  if (!item.itemMeta.hasCustomModelData()) return false;
  const DATA_TYPE = dataType(CUSTOM_DATA_KEY, COIN_DATA);
  const view = dataView(DATA_TYPE, item);
  if (!view.unit || !view.subUnit) return false;
  return true;
}

const VALUES_IN_CURRENCY = [0.01, 0.1, 1, 10, 100, 1000];
export const CURRENCY_ITEMS = new Map<CurrencyModel, Coin[]>();

/**
 * Generate custom model data (or model id) for the custom item
 * @param currencyModel Model of the currency (from 1 to 3(?))
 * @param value Value of the coin. From 0.01 to 1000
 */
function getCoinModelId(currencyModel: number, value: number) {
  const index = VALUES_IN_CURRENCY.indexOf(value);
  if (index == -1) return undefined;
  return currencyModel * 10 + 1 + index;
}

/**
 * Create new custom item for the coin
 * @param currencyModel Model of the currency (from 1 to 3(?))
 * @param value Value of the coin. From 0.01 to 1000
 */
export function makeCoinItem(currencyModel: number, value: number) {
  const modelId = getCoinModelId(currencyModel, value);
  if (modelId === undefined) return undefined;
  const customItem = new CustomItem({
    id: modelId,
    type: VkItem.MONEY,
    data: COIN_DATA,
  });
  return customItem;
}

/**
 * Generate list of Coin items that belong to same texture group
 * @param currencyModel Model of the currency (from 1 to 3(?))
 */
function generateCoins(currencyModel: number) {
  const coins: Coin[] = [];
  for (const value of VALUES_IN_CURRENCY) {
    const customItem = makeCoinItem(currencyModel, value);
    if (!customItem) break;
    const coin: Coin = {
      item: customItem,
      amount: 10,
      value: value,
    };
    coins.push(coin);
  }
  return coins;
}

CURRENCY_MODELS.forEach((currencyModel) => {
  const coins = generateCoins(currencyModel);
  CURRENCY_ITEMS.set(currencyModel, coins);
});

const MODEL_ID_TO_CURRENCY_MODEL = new Map<number, CurrencyModel>();
CURRENCY_ITEMS.forEach((items, id) =>
  items.forEach((coin) =>
    MODEL_ID_TO_CURRENCY_MODEL.set(
      coin.item.create({}).itemMeta.customModelData,
      id,
    ),
  ),
);
export function coinModelIdToCurrencyId(modelId: number) {
  return MODEL_ID_TO_CURRENCY_MODEL.get(modelId);
}

registerEvent(BlockPistonRetractEvent, (event) => {
  if (event.direction !== BlockFace.DOWN) return;
  if (event.block.getRelative(BlockFace.DOWN, 2).type !== PRESS_BLOCK) return;
  const dropperBlock = event.block.getRelative(BlockFace.DOWN, 3);
  if (dropperBlock.type !== MATERIAL_CONTAINER) return;

  const dropper = dropperBlock.state as Dispenser;
  const inventory = dropper.inventory;
  const items = inventory.contents;

  const mold = getMoneyMold(items);
  if (!mold) return;

  // Properties of the currency are stored in the lore of the money mold
  const lore = mold.itemMeta.lore;
  if (!lore || lore.length !== 5) return;
  const unit = lore[0];
  const unitPlural = lore[1];
  const subunit = lore[2];
  const subunitPlural = lore[3];
  const model = Number(lore[4]);
  if (!unit || !subunit || !model) return;
  if (!isCurrencyModel(model)) return;

  const materials = RAW_MATERIALS.get(model);
  if (!materials) return;
  if (!removeMaterials(inventory, materials)) return;

  const currency: Currency = {
    model,
    unit,
    unitPlural,
    subunit,
    subunitPlural,
  };
  createMoney(dropperBlock.location.add(0.5, 1.1, 0.5), currency);
});

function getMoneyMold(items: ItemStack[]) {
  for (const item of items) {
    if (!item) continue;
    if (MoneyMold.check(item)) return item;
  }
  return undefined;
}

function removeMaterials(inventory: Inventory, items: ItemStack[]) {
  // Check if there is enough materials
  for (const item of items) {
    if (!inventory.contains(item.type, item.amount)) return false;
  }
  // Remove the materials
  inventory.removeItem(...items);
  return true;
}

async function createMoney(location: Location, currency: Currency) {
  const coins = CURRENCY_ITEMS.get(currency.model);
  if (!coins) return;
  await wait(2, 'ticks');
  for (const coin of coins) {
    const item = coin.item.create(
      {
        unit: currency.unitPlural,
        subUnit: currency.subunitPlural,
      },
      coin.amount,
    );
    const meta = item.itemMeta;
    meta.displayName = getCoinDisplayName(coin, currency);
    item.itemMeta = meta;

    // Drop the item without velocity.
    const drop = location.world.dropItem(location, item);
    drop.velocity = drop.velocity.multiply(0.3);
    drop.velocity.y = 0.3;
  }
}

export function getCoinDisplayName(coin: Coin, currency: Currency) {
  const isSubunit = coin.value < 1;

  // Subunits are transformed to integers: 0.1 -> 10
  const value = isSubunit ? coin.value * 100 : coin.value;
  const isPlural = value !== 1;

  // Construct the display name
  const valueString = '§r' + value + ' ';
  if (isSubunit) {
    if (isPlural) return valueString + currency.subunitPlural;
    else return valueString + currency.subunit;
  } else {
    if (isPlural) return valueString + currency.unitPlural;
    else return valueString + currency.unit;
  }
}

// Admin command for creating money molds
registerCommand('rahamuotti', (sender, label, args) => {
  if (!sender.isOp()) return;
  if (!(sender instanceof Player)) return;
  const player = sender as Player;

  if (args.length !== 3) {
    player.sendMessage(
      '/rahamuotti <yksikön monikko> <alayksikön monikko> <malli>',
    );
    player.sendMessage('Esim: /rahamuotti Euroa Senttiä 2');
    return;
  }

  const unitPlural = args[0];
  const subunitPlural = args[1];
  const model = args[2];

  if (!unitPlural || !subunitPlural || !Number(model)) return;

  const item = MoneyMold.create({});
  const meta = item.itemMeta;
  const lore = [
    unitPlural.slice(0, -1),
    unitPlural,
    subunitPlural.slice(0, -1),
    subunitPlural,
    model,
  ];
  meta.lore = lore;
  item.itemMeta = meta;

  player.inventory.addItem(item);
});

// Notify the player about the raw materials required for the currency
MoneyMold.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const a = event.action;
    if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;
    const lore = event.item?.itemMeta.lore;

    if (!lore || lore.length !== 5) return;

    const line = lore[4];
    console.log(line);
    const model = Number(line);
    if (!isCurrencyModel(model)) return;
    const items = RAW_MATERIALS.get(model);
    if (!items) return;

    event.player.sendMessage('Tarvitset tätä valuuttaa varten: ');
    for (const item of items) {
      const type = item.type.translationKey;
      const amount = item.amount;
      // TODO: Chat icons for the material
      event.player.sendMessage(
        ...[text(' - '), translate(type), text(` (${amount}kpl)`)],
      );
    }
  },
);
