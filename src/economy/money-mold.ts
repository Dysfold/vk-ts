import { Location, Material } from 'org.bukkit';
import { BlockFace, Dispenser } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action, BlockPistonRetractEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Inventory, ItemStack } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const MoneyMold = new CustomItem({
  name: 'Rahamuotti',
  id: 10,
  modelId: 10,
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

const COIN_A_0_01 = new CustomItem({
  id: 1,
  modelId: 1,
  type: VkItem.MONEY,
});
const COIN_A_0_1 = new CustomItem({
  id: 2,
  modelId: 2,
  type: VkItem.MONEY,
});
const COIN_A_1 = new CustomItem({
  id: 3,
  modelId: 3,
  type: VkItem.MONEY,
});
const COIN_A_10 = new CustomItem({
  id: 4,
  modelId: 4,
  type: VkItem.MONEY,
});
const COIN_A_100 = new CustomItem({
  id: 5,
  modelId: 5,
  type: VkItem.MONEY,
});
const COIN_A_1000 = new CustomItem({
  id: 6,
  modelId: 6,
  type: VkItem.MONEY,
});

const COIN_B_0_01 = new CustomItem({
  id: 7,
  modelId: 7,
  type: VkItem.MONEY,
});
const COIN_B_0_1 = new CustomItem({
  id: 8,
  modelId: 8,
  type: VkItem.MONEY,
});
const COIN_B_1 = new CustomItem({
  id: 9,
  modelId: 9,
  type: VkItem.MONEY,
});
const COIN_B_10 = new CustomItem({
  id: 10,
  modelId: 10,
  type: VkItem.MONEY,
});
const COIN_B_100 = new CustomItem({
  id: 11,
  modelId: 11,
  type: VkItem.MONEY,
});
const COIN_B_1000 = new CustomItem({
  id: 12,
  modelId: 12,
  type: VkItem.MONEY,
});

const COIN_C_0_01 = new CustomItem({
  id: 13,
  modelId: 13,
  type: VkItem.MONEY,
});
const COIN_C_0_1 = new CustomItem({
  id: 14,
  modelId: 14,
  type: VkItem.MONEY,
});
const COIN_C_1 = new CustomItem({
  id: 15,
  modelId: 15,
  type: VkItem.MONEY,
});
const COIN_C_10 = new CustomItem({
  id: 16,
  modelId: 16,
  type: VkItem.MONEY,
});
const COIN_C_100 = new CustomItem({
  id: 17,
  modelId: 17,
  type: VkItem.MONEY,
});
const COIN_C_1000 = new CustomItem({
  id: 18,
  modelId: 18,
  type: VkItem.MONEY,
});

// Infromation about the name of the currency
interface Currency {
  model: number;
  unit: string;
  unitPlural: string;
  subunit: string;
  subunitPlural: string;
}

interface Coin {
  item: ItemStack;
  amount: number;
  value: number;
}

const CURRENCY_ITEMS: { [id: string]: Coin[] } = {
  1: [
    { item: COIN_A_0_01.create(), amount: 10, value: 0.01 },
    { item: COIN_A_0_1.create(), amount: 10, value: 0.1 },
    { item: COIN_A_1.create(), amount: 10, value: 1 },
    { item: COIN_A_10.create(), amount: 10, value: 10 },
    { item: COIN_A_100.create(), amount: 10, value: 100 },
    { item: COIN_A_1000.create(), amount: 10, value: 1000 },
  ],
  2: [
    { item: COIN_B_0_01.create(), amount: 10, value: 0.01 },
    { item: COIN_B_0_1.create(), amount: 10, value: 0.1 },
    { item: COIN_B_1.create(), amount: 10, value: 1 },
    { item: COIN_B_10.create(), amount: 10, value: 10 },
    { item: COIN_B_100.create(), amount: 10, value: 100 },
    { item: COIN_B_1000.create(), amount: 10, value: 1000 },
  ],
  3: [
    { item: COIN_C_0_01.create(), amount: 10, value: 0.01 },
    { item: COIN_C_0_1.create(), amount: 10, value: 0.1 },
    { item: COIN_C_1.create(), amount: 10, value: 1 },
    { item: COIN_C_10.create(), amount: 10, value: 10 },
    { item: COIN_C_100.create(), amount: 10, value: 100 },
    { item: COIN_C_1000.create(), amount: 10, value: 1000 },
  ],
};

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
  const coins = CURRENCY_ITEMS[currency.model];
  for (const coin of coins) {
    const item = coin.item;
    const meta = item.itemMeta;
    const isSubunit = coin.value < 1;

    // Subunits are transformed to integers: 0.1 -> 10
    const value = isSubunit ? coin.value * 100 : coin.value;
    const isPlural = value !== 1;

    // Construct the display name
    let name = '§r' + value + ' ';
    if (isSubunit) {
      if (isPlural) name += currency.subunitPlural;
      else name += currency.subunit;
    } else {
      if (isPlural) name += currency.unitPlural;
      else name += currency.unit;
    }

    meta.displayName = name;
    // prettier-ignore
    const lore = [`§r§6[${currency.unitPlural}, ${currency.subunitPlural}]`];
    meta.lore = lore;

    item.itemMeta = meta;
    item.amount = coin.amount;

    // Drop the item without velocity. 1 tick dealay for the block to move out of the way
    await wait(1, 'ticks');
    const drop = location.world.dropItem(location, item);
    drop.velocity.multiply(0);
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

  const item = MoneyMold.create();
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

    event.player.sendMessage('Tarvitset tätä valuuttaa varten: ' + model);
    for (const item of items) {
      const type = item.type.toString();
      const amount = item.amount;
      // TODO: Chat icons for the material
      event.player.sendMessage(` - ${amount}kpl ${type}`);
    }
  },
);
