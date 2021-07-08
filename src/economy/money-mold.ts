import { text, translate } from 'craftjs-plugin/chat';
import { Location, Material } from 'org.bukkit';
import { BlockFace, Dispenser } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPistonRetractEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import * as yup from 'yup';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { Currency, getCurrencyTranslation } from './currency';
import { addTranslation, t } from '../common/localization/localization';
import { sendMessages } from '../chat/system';
import { getPlainText, removeDecorations } from '../chat/utils';
import { Component } from 'net.kyori.adventure.text';
import { TextDecoration } from 'net.kyori.adventure.text.format';

const MoneyMold = new CustomItem({
  name: translate('vk.money_mold'),
  id: 10,
  type: VkItem.MISC,
  data: {
    currency: yup.number().required(),
  },
});

// Block pushed by piston
const PRESS_BLOCK = Material.IRON_BLOCK;
const MATERIAL_CONTAINER = Material.DROPPER;

// Config for coins materials. Number is the id of the currency
const RAW_MATERIALS = new Map<Currency, ItemStack[]>([
  [
    Currency.CLASSIC_GOLD,
    [
      new ItemStack(Material.GOLD_INGOT, 10),
      new ItemStack(Material.COPPER_INGOT, 10),
    ],
  ],
  [
    Currency.SILVER,
    [
      new ItemStack(Material.IRON_INGOT, 10),
      new ItemStack(Material.COPPER_INGOT, 10),
    ],
  ],
  [
    Currency.GREEN_PAPER,
    [
      new ItemStack(Material.PAPER, 10),
      new ItemStack(Material.INK_SAC, 10),
      new ItemStack(Material.COPPER_INGOT, 10),
    ],
  ],
]);
const CURRENCY_MODELS = Array.from(RAW_MATERIALS.keys());

interface Coin {
  item: CustomItem<{}>;
  amount: number;
  value: number;
}

const VALUES_IN_CURRENCY = [0.01, 0.1, 1, 10, 100, 1000];
export const CURRENCY_ITEMS = new Map<Currency, Coin[]>();

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
function makeCoinItem(currencyModel: number, value: number) {
  const modelId = getCoinModelId(currencyModel, value);
  if (modelId === undefined) return undefined;
  const customItem = new CustomItem({
    id: modelId,
    type: VkItem.MONEY,
  });
  return customItem;
}

/**
 * Generate list of Coin items that belong to same texture group
 * @param currencyModel Model of the currency (from 0 to 2(currently))
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

const MODEL_ID_TO_CURRENCY = new Map<number, Currency>();
CURRENCY_ITEMS.forEach((items, id) =>
  items.forEach((coin) =>
    MODEL_ID_TO_CURRENCY.set(coin.item.create({}).itemMeta.customModelData, id),
  ),
);
export function coinModelIdToCurrencyId(modelId: number) {
  return MODEL_ID_TO_CURRENCY.get(modelId);
}

registerEvent(BlockPistonRetractEvent, (event) => {
  if (event.direction !== BlockFace.DOWN) return;
  if (event.block.getRelative(BlockFace.DOWN, 2).type !== PRESS_BLOCK) return;
  const dropperBlock = event.block.getRelative(BlockFace.DOWN, 3);
  if (dropperBlock.type !== MATERIAL_CONTAINER) return;

  const dropper = dropperBlock.state as Dispenser;
  const inventory = dropper.inventory;
  const items = inventory.contents;
  if (!items) return;

  const mold = getMoneyMold(items);
  if (!mold) return;

  // Properties of the currency are stored in the lore of the money mold
  const lore = mold.itemMeta.lore();
  if (lore?.length !== 1) return;

  const model = Number(getPlainText(lore[0]));
  if (isNaN(model)) return;
  const currency = model as Currency;

  const materials = RAW_MATERIALS.get(currency);
  if (!materials) return;
  if (!removeMaterials(inventory, materials)) return;

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
  const coins = CURRENCY_ITEMS.get(currency);
  if (!coins) return;
  await wait(2, 'ticks');
  for (const coin of coins) {
    const item = coin.item.create({}, coin.amount);
    const meta = item.itemMeta;
    meta.displayName(getCoinDisplayName(coin, currency));
    item.itemMeta = meta;

    // Drop the item without velocity.
    const drop = location.world.dropItem(location, item);
    drop.velocity = drop.velocity.multiply(0.3);
    drop.velocity.y = 0.3;
  }
}

export function getCoinDisplayName(coin: Coin, currency: Currency): Component {
  const isSubunit = coin.value < 1;

  // Subunits are transformed to integers: 0.1 -> 10
  const value = isSubunit ? coin.value * 100 : coin.value;
  const isPlural = value !== 1;

  const valueString = '' + value;

  const translations = getCurrencyTranslation(currency);

  // Construct the display name
  // components.push(text(ChatColor.RESET + '' + value + ' '));

  let translation = '';
  if (isSubunit) {
    if (isPlural) translation = translations.subunitPlural;
    else translation = translations.subunit;
  } else {
    if (isPlural) translation = translations.unitPlural;
    else translation = translations.unit;
  }

  const component = removeDecorations(
    translate(translation, valueString),
    TextDecoration.ITALIC,
  );
  return component;
}

// Admin command for creating money molds
registerCommand(['rahamuotti', 'moneymold'], (sender, label, args) => {
  if (!sender.isOp()) return;
  if (!(sender instanceof Player)) return;
  const player = sender as Player;

  if (args.length !== 1) {
    player.sendMessage('/rahamuotti <malli>');
    player.sendMessage('Esim: /rahamuotti 2');
    return;
  }

  const model = Number(args[0]);
  if (isNaN(model)) return;

  const item = MoneyMold.create({ currency: model });
  const meta = item.itemMeta;
  meta.lore([text('' + model)]);
  item.itemMeta = meta;

  player.inventory.addItem(item);
});

// Notify the player about the raw materials required for the currency
MoneyMold.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event, data) => {
    const a = event.action;
    if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

    const model = data.currency as Currency;
    const items = RAW_MATERIALS.get(model);
    if (!items) return;

    event.player.sendMessage(t(event.player, 'money_mold.you_need'));
    for (const item of items) {
      const type = item.type.translationKey;
      const amount = item.amount;
      sendMessages(
        event.player,
        text(' - '),
        translate(type),
        text(t(event.player, 'money_mold.n_pieces', amount)),
      );
    }
  },
);

addTranslation('money_mold.you_need', {
  fi_fi: 'Tarvitset tätä valuuttaa varten:',
  en_us: 'To make this currency, you need:',
});

addTranslation('money_mold.n_pieces', {
  fi_fi: ' (%s kappaletta)',
  en_us: ' (%s pieces)',
});
