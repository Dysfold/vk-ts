import { translate, text } from 'craftjs-plugin/chat';
import { Location, Material } from 'org.bukkit';
import { BlockFace, Dispenser } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPistonRetractEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { CustomItem, CUSTOM_DATA_KEY } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import * as yup from 'yup';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
const MoneyMold = new CustomItem({
  name: translate('vk.money_mold'),
  id: 10,
  type: VkItem.MISC,
});

// Block pushed by piston
const PRESS_BLOCK = Material.IRON_BLOCK;
const MATERIAL_CONTAINER = Material.DROPPER;

// Placeholder for copper material (1.17)
const COPPER_MATERIAL = Material.BRICK;

// Config for coins materials. Number is the id of the currency
const RAW_MATERIALS: { [id: string]: ItemStack[] } = {
  1: [
    new ItemStack(Material.GOLD_INGOT, 10),
    new ItemStack(COPPER_MATERIAL, 10),
  ],
  2: [
    new ItemStack(Material.IRON_INGOT, 10),
    new ItemStack(COPPER_MATERIAL, 10),
  ],
  3: [
    new ItemStack(Material.PAPER, 10),
    new ItemStack(Material.INK_SAC, 10),
    new ItemStack(COPPER_MATERIAL, 10),
  ],
};

const COIN_DATA = {
  unit: yup.string().required(),
  subUnit: yup.string().required(),
};

const COIN_A_0_01 = new CustomItem({
  id: 1,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_A_0_1 = new CustomItem({
  id: 2,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_A_1 = new CustomItem({
  id: 3,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_A_10 = new CustomItem({
  id: 4,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_A_100 = new CustomItem({
  id: 5,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_A_1000 = new CustomItem({
  id: 6,
  type: VkItem.MONEY,
  data: COIN_DATA,
});

const COIN_B_0_01 = new CustomItem({
  id: 7,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_B_0_1 = new CustomItem({
  id: 8,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_B_1 = new CustomItem({
  id: 9,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_B_10 = new CustomItem({
  id: 10,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_B_100 = new CustomItem({
  id: 11,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_B_1000 = new CustomItem({
  id: 12,
  type: VkItem.MONEY,
  data: COIN_DATA,
});

const COIN_C_0_01 = new CustomItem({
  id: 13,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_C_0_1 = new CustomItem({
  id: 14,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_C_1 = new CustomItem({
  id: 15,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_C_10 = new CustomItem({
  id: 16,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_C_100 = new CustomItem({
  id: 17,
  type: VkItem.MONEY,
  data: COIN_DATA,
});
const COIN_C_1000 = new CustomItem({
  id: 18,
  type: VkItem.MONEY,
  data: COIN_DATA,
});

// Infromation about the name of the currency
export interface Currency {
  model: number;
  unit: string;
  unitPlural: string;
  subunit: string;
  subunitPlural: string;
}

interface Coin {
  item: CustomItem<any>;
  amount: number;
  value: number;
}

export function getCoinData(item: ItemStack) {
  if (!isMoney(item)) return undefined;
  const DATA_TYPE = dataType(CUSTOM_DATA_KEY, COIN_DATA);
  return dataView(DATA_TYPE, item);
}

function isMoney(item: ItemStack) {
  if (item.type !== VkItem.MONEY) return false;
  return item.itemMeta.hasCustomModelData();
}

const CURRENCY_ITEMS = new Map<number, Coin[]>([
  [
    1,
    [
      { item: COIN_A_0_01, amount: 10, value: 0.01 },
      { item: COIN_A_0_1, amount: 10, value: 0.1 },
      { item: COIN_A_1, amount: 10, value: 1 },
      { item: COIN_A_10, amount: 10, value: 10 },
      { item: COIN_A_100, amount: 10, value: 100 },
      { item: COIN_A_1000, amount: 10, value: 1000 },
    ],
  ],
  [
    2,
    [
      { item: COIN_B_0_01, amount: 10, value: 0.01 },
      { item: COIN_B_0_1, amount: 10, value: 0.1 },
      { item: COIN_B_1, amount: 10, value: 1 },
      { item: COIN_B_10, amount: 10, value: 10 },
      { item: COIN_B_100, amount: 10, value: 100 },
      { item: COIN_B_1000, amount: 10, value: 1000 },
    ],
  ],
  [
    3,
    [
      { item: COIN_C_0_01, amount: 10, value: 0.01 },
      { item: COIN_C_0_1, amount: 10, value: 0.1 },
      { item: COIN_C_1, amount: 10, value: 1 },
      { item: COIN_C_10, amount: 10, value: 10 },
      { item: COIN_C_100, amount: 10, value: 100 },
      { item: COIN_C_1000, amount: 10, value: 1000 },
    ],
  ],
]);

const MODEL_ID_TO_CURRENCY_ID = new Map<number, number>();
CURRENCY_ITEMS.forEach((items, id) =>
  items.forEach((coin) =>
    MODEL_ID_TO_CURRENCY_ID.set(
      coin.item.create({}).itemMeta.customModelData,
      id,
    ),
  ),
);
export function coinModelIdToCurrencyId(modelId: number) {
  return MODEL_ID_TO_CURRENCY_ID.get(modelId);
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

  const materials = RAW_MATERIALS[model];
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

    // prettier-ignore
    // const lore = [`§r§6[${currency.unitPlural}, ${currency.subunitPlural}]`];
    // meta.lore = lore;

    item.itemMeta = meta;

    // Drop the item without velocity.
    const drop = location.world.dropItem(location, item);
    drop.velocity = drop.velocity.multiply(0.3);
    drop.velocity.y = 0.3;
  }
}

function getCoinDisplayName(coin: Coin, currency: Currency) {
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
    const items = RAW_MATERIALS[model];

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
