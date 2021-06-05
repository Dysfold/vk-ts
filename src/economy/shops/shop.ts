import { color, text, tooltip, translate } from 'craftjs-plugin/chat';
import { UUID } from 'java.util';
import { TranslatableComponent, TextComponent } from 'net.md_5.bungee.api.chat';
import {
  Bukkit,
  ChatColor,
  Location,
  Material,
  SoundCategory,
} from 'org.bukkit';
import { Block, Chest, Container } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action as BlockAction } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { ChatMessage, GLOBAL_PIPELINE } from '../../chat/pipeline';
import { addItemTo, giveItem } from '../../common/helpers/inventory';
import { getItemName } from '../../common/helpers/items';
import { Currency, getCurrencyNames } from '../currency';
import { getInventoryBalance, giveMoney, takeMoneyFrom } from '../money';
import { findItemsFromInventory, getBlockBehind, getShopItem } from './helpers';
import { openShopGUI } from './shop-gui';
import { getShop } from './ShopData';
import { distanceBetween } from '../../common/helpers/locations';
import { errorMessage } from '../../chat/system';
import { getTaxes, sendTaxes } from './taxes';
import { round } from '../../common/helpers/math';
import { t, getTranslator } from '../../common/localization/localization';

const YELLOW = '#FFFF99';
const GOLD = '#FFAA00';
const GREEN = '#55FF55';
const yellow = (msg: string) => color(YELLOW, text(msg));
const gold = (msg: string) => color(GOLD, text(msg));
const green = (msg: string) => color(GREEN, text(msg));

/**
 * Display shop info to customer
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== BlockAction.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  if (!event.clickedBlock) return;
  const sign = event.clickedBlock;
  const view = getShop(sign);

  if (!view) return;
  if (!view.type) return;

  if (event.player.isSneaking()) {
    if (event.isBlockInHand()) return;
    openShopGUI(event.player, sign);
  }
  displayShopInfo(event.player, sign);
});

function displayShopInfo(p: Player, sign: Block) {
  const view = getShop(sign);
  if (!view) return;
  const item = getShopItem(view.item);
  const chestBlock = getBlockBehind(sign);
  if (!(chestBlock?.state instanceof Chest)) return;
  const chest = chestBlock.state;
  if (!item) return;
  const taxes = getTaxes(view.taxRate, view.price);
  const taxFreePrice = view.price - taxes;

  const currency = view.currency as Currency;
  const unitNames = getCurrencyNames(currency)?.plainText;
  if (!unitNames) return;

  const unit = view.price == 1 ? unitNames.unit : unitNames.unitPlural;
  const taxFreeUnit = taxFreePrice == 1 ? unitNames.unit : unitNames.unitPlural;

  const itemName = getItemName(item);
  const taxCollector = view.taxCollector
    ? Bukkit.server.getOfflinePlayer(UUID.fromString(view.taxCollector))
    : undefined;

  const shopTypeTranslationKey =
    view.type === 'SELLING' ? 'shops.selling' : 'shops.buying';

  const tr = getTranslator(p);

  p.sendMessage(text('\n\n\n'));
  p.sendMessage(gold(tr('shops.title')));
  p.sendMessage(yellow(tr(shopTypeTranslationKey)));
  displayShopItemName(p, itemName);
  p.sendMessage(
    yellow(`${tr('shops.price')}: `),
    gold(`${round(view.price)} `),
    yellow(tr('shops.unit_per_item', unit)),
  );

  // Tax info
  if (view.taxRate) {
    const taxCollectorName = taxCollector?.name ?? tr('shops.unknown');
    p.sendMessage(
      tooltip(
        text(tr('shops.tax_tooltip', taxCollectorName, taxes)),
        yellow(`${tr('shops.VAT')}: ${ChatColor.GOLD}${view.taxRate}%`),
      ),
    );
    p.sendMessage(
      yellow(tr('shops.tax_free_price', taxFreePrice, taxFreeUnit)),
    );
  }

  if (view.type === 'SELLING') {
    const amount = countItemsInShop(chest, item);
    p.sendMessage(yellow(tr('shops.items_left', amount)));
    p.sendMessage(gold(tr('shops.footer')));
    p.sendMessage(yellow('shops.how_many_to_buy'));
  }

  if (view.type === 'BUYING') {
    const amount = countEmptyStacks(chest);
    if (amount) {
      p.sendMessage(yellow(tr('shops.space_left', amount)));
    } else {
      p.sendMessage(yellow(tr('shops.space_low')));
    }
    p.sendMessage(gold(tr('shops.footer')));
    p.sendMessage(yellow('shops.how_many_to_buy'));
  }

  activeCustomers.set(p, { sign: sign, startTime: new Date() });
}

function displayShopItemName(
  p: Player,
  itemName: TranslatableComponent | TextComponent,
) {
  if (itemName instanceof TranslatableComponent) {
    p.sendMessage(color('#FFAA00', itemName));
  } else {
    p.sendMessage(
      color('#FFAA00', text(ChatColor.ITALIC + '"' + itemName.text + '"')),
    );
  }
}

function countEmptyStacks(chest: Container) {
  return (
    chest.inventory.contents?.reduce(
      (total, i) => total + (i === null ? 1 : 0),
      0,
    ) ?? 0
  );
}

function countItemsInShop(chest: Container, item: ItemStack) {
  const items = findItemsFromInventory(chest.inventory, item);
  return items.reduce((total, i) => total + i.amount, 0);
}

const activeCustomers = new Map<Player, { sign: Block; startTime: Date }>();

/**
 * Stop shop transaction if player has moved far away or is idle
 */
const TIMEOUT_MS = 1000 * 10;
const MAX_DISTANCE = 5;
setInterval(() => {
  activeCustomers.forEach((data, player) => {
    const t0 = data.startTime.getTime();
    const t1 = new Date().getTime();
    if (t1 - t0 > TIMEOUT_MS) {
      stopTransaction(player);
      return;
    }
    const locA = player.location;
    const locB = data.sign.location;
    if (distanceBetween(locA, locB) > MAX_DISTANCE) {
      stopTransaction(player);
      return;
    }
  });
}, 2000);

function stopTransaction(player: Player) {
  if (activeCustomers.has(player)) {
    errorMessage(player, t(player, 'shops.transaction_cancelled'));
  }
  activeCustomers.delete(player);
}

interface TransactionResult {
  taxAmount: number;
}

function handleMessage(msg: ChatMessage) {
  const shopSign = activeCustomers.get(msg.sender)?.sign;
  if (!shopSign) return;

  const p = msg.sender;

  const chest = getBlockBehind(shopSign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;
  const view = getShop(shopSign);
  if (!view) return;
  const shopItem = getShopItem(view.item);
  const currency = view.currency as Currency;
  if (!shopItem || currency == undefined) return;

  const amount = Number.parseInt(msg.content);
  if (isNaN(amount) || amount <= 0) {
    errorMessage(p, t(p, 'shops.invalid_amount'));
    return;
  }

  let result: TransactionResult | undefined;

  // Check if player can sell items to the "BUYING" chest
  if (view.type === 'BUYING') {
    const emptyStacks = countEmptyStacks(chest.state);
    const material = Material.getMaterial(view.item.material);
    if (!material) return;
    const stackSize = material?.maxStackSize;
    const maxAmount = stackSize * emptyStacks;
    if (amount > maxAmount) {
      errorMessage(p, t(p, 'shops.not_enought_space'));
      return;
    }
    result = sellToShop(
      p,
      shopItem,
      amount,
      view.price,
      currency,
      chest.state,
      view.taxRate,
    );
  }

  // Check if player can buy items from "SELLING" chest
  if (view.type === 'SELLING') {
    const itemsInShop = countItemsInShop(chest.state, shopItem);
    if (itemsInShop < amount) {
      errorMessage(p, t(p, 'shops.not_enought_items'));
      return;
    }
    result = buyFromShop(
      p,
      shopItem,
      amount,
      view.price,
      currency,
      chest.state,
      view.taxRate,
    );
  }

  if (!result) return;

  playShopSound(chest.location.add(0.5, 1, 0.5));

  // Handle taxes
  if (view.taxCollector) {
    const collector = Bukkit.getOfflinePlayer(
      UUID.fromString(view.taxCollector),
    );
    sendTaxes(collector, result.taxAmount, currency);
  }
}

function sellToShop(
  player: Player,
  shopItem: ItemStack,
  howMany: number,
  productPrice: number,
  currency: Currency,
  chest: Container,
  taxRate: number,
): TransactionResult | undefined {
  const moneyInShop = getInventoryBalance(chest.inventory, currency);
  const price = productPrice * howMany;
  if (moneyInShop < price) {
    errorMessage(player, t(player, 'shops.not_enought_money'));
    return undefined;
  }

  const unitNames = getCurrencyNames(currency)?.plainText;
  if (!unitNames) return;

  const tax = getTaxes(taxRate, price);
  const success = takeMoneyFrom(chest.inventory, price, currency);
  if (!success) return;
  giveMoney(player.inventory, price - tax, currency);

  const allProducts = findItemsFromInventory(player.inventory, shopItem);
  const items: ItemStack[] = [];

  let amount = howMany;
  for (const product of allProducts) {
    if (amount <= 0) break;
    const amountToRemove = Math.min(product.amount, amount);
    amount -= amountToRemove;
    items.push(product.clone().asQuantity(amountToRemove));
    product.amount -= amountToRemove;
  }

  items.forEach((item) => {
    addItemTo(chest.inventory, item);
  });

  const unit = price - tax == 1 ? unitNames.unit : unitNames.unitPlural;
  player.sendMessage(
    green(t(player, 'shops.you_sold', howMany, price - tax, unit)),
  );

  return { taxAmount: tax };
}

function buyFromShop(
  player: Player,
  shopItem: ItemStack,
  howMany: number,
  productPrice: number,
  currency: Currency,
  chest: Container,
  taxRate: number,
): TransactionResult | undefined {
  const price = howMany * productPrice;
  const balance = getInventoryBalance(player.inventory, currency);
  if (price > balance) {
    errorMessage(player, t(player, 'shops.you_no_enought_money'));
    return undefined;
  }
  const unitNames = getCurrencyNames(currency)?.plainText;
  if (!unitNames) return;

  const tax = getTaxes(taxRate, price);

  const success = takeMoneyFrom(player.inventory, price, currency);
  if (!success) return;

  giveMoney(chest.inventory, price - tax, currency);

  const allProducts = findItemsFromInventory(chest.inventory, shopItem);

  const items: ItemStack[] = [];

  let amount = howMany;
  for (const product of allProducts) {
    if (amount <= 0) break;
    const amountToRemove = Math.min(product.amount, amount);
    amount -= amountToRemove;
    items.push(product.clone().asQuantity(amountToRemove));
    product.amount -= amountToRemove;
  }
  items.forEach((item) => {
    giveItem(player, item, player.mainHand);
  });

  const unit = price == 1 ? unitNames.unit : unitNames.unitPlural;
  player.sendMessage(
    color(
      '#55FF55',
      text(t(player, 'shops.you_bought', howMany, round(price, 4), unit)),
    ),
  );
  return { taxAmount: tax };
}

function detectShopTransaction(msg: ChatMessage) {
  if (!activeCustomers.has(msg.sender)) return;
  msg.discard = true;
  handleMessage(msg);
  activeCustomers.delete(msg.sender);
}

function playShopSound(location: Location) {
  location.world.playSound(
    location,
    'minecraft:custom.cashregister',
    SoundCategory.BLOCKS,
    0.8,
    0.9,
  );
}

GLOBAL_PIPELINE.addHandler('detectShopTransaction', -1, detectShopTransaction);
