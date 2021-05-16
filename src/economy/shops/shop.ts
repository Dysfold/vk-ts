import { color, text, tooltip, translate } from 'craftjs-plugin/chat';
import { UUID } from 'java.util';
import { TranslatableComponent } from 'net.md_5.bungee.api.chat';
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
import { Currency, getShopCurrency } from '../currency';
import { getInventoryBalance, giveMoney, takeMoneyFrom } from '../money';
import { findItemsFromInventory, getBlockBehind, getShopItem } from './helpers';
import { openShopGUI } from './shop-gui';
import { getShop } from './ShopData';
import { distanceBetween } from '../../common/helpers/locations';
import { errorMessage } from '../../chat/system';
import { getTaxes, sendTaxes } from './taxes';

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
  const unit =
    view.price === 1
      ? view.currency.unitPlural.slice(0, -1)
      : view.currency.unitPlural;
  const itemName = getItemName(item);
  const taxCollector = view.taxCollector
    ? Bukkit.server.getOfflinePlayer(UUID.fromString(view.taxCollector))
    : undefined;

  p.sendMessage(text('\n\n\n'));
  p.sendMessage(color('#FFAA00', text('----------Kauppa-arkku----------')));

  p.sendMessage(
    color(
      '#FFFF99',
      translate(view.type === 'SELLING' ? 'vk.selling' : 'vk.buying'),
    ),
  );

  if (itemName instanceof TranslatableComponent) {
    p.sendMessage(color('#FFAA00', itemName));
  } else {
    p.sendMessage(
      color('#FFAA00', text(ChatColor.ITALIC + '"' + itemName.text + '"')),
    );
  }
  p.sendMessage(
    color(
      '#FFFF99',
      text(
        `Hinta: ${ChatColor.GOLD}${view.price}${ChatColor.RESET} ${unit} / kpl`,
      ),
    ),
  );

  if (view.tax) {
    p.sendMessage(
      color(
        '#FFFF99',
        tooltip(
          text(
            `Verottaja: ${
              taxCollector?.name || 'Tuntematon'
            } \nVeroton hinta: ${view.price - getTaxes(view.tax, view.price)}`,
          ),
          text(`Arvonlisävero: ${ChatColor.GOLD}${view.tax}%`),
        ),
      ),
    );
    p.sendMessage(
      color(
        '#FFFF99',
        text(
          `Veroton hinta: ${ChatColor.GOLD}${
            view.price - getTaxes(view.tax, view.price)
          }${ChatColor.RESET} ${unit} / kpl`,
        ),
      ),
    );
  }
  if (view.type === 'SELLING') {
    const amount = countItemsInShop(chest, item);
    p.sendMessage(
      color(
        '#FFFF99',
        text(
          `Kaupassa on ${ChatColor.GOLD}${amount}${ChatColor.RESET} tuotetta jäljellä.`,
        ),
      ),
    );
  }
  if (view.type === 'BUYING') {
    const amount = countEmptyStacks(chest);
    if (amount) {
      p.sendMessage(
        color(
          '#FFFF99',
          text(
            `Kaupassa on tilaa ainakin ${ChatColor.GOLD}${amount}${ChatColor.RESET} stackille.`,
          ),
        ),
      );
    } else {
      p.sendMessage(color('#FFFF99', text(`Kaupan tila on lopussa.`)));
    }
  }
  p.sendMessage(color('#FFAA00', text('--------------------------------')));
  const action = view.type == 'SELLING' ? 'ostaa' : 'myydä';
  p.sendMessage(
    color('#FFFF99', text('Montako tuotetta haluat ' + action + '?')),
  );
  activeCustomers.set(p, { sign: sign, startTime: new Date() });
}

function countEmptyStacks(chest: Container) {
  return chest.inventory.contents.reduce(
    (total, i) => total + (i === null ? 1 : 0),
    0,
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
    errorMessage(player, 'Kaupankäynti keskeytetty.');
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
  const currency = getShopCurrency(view.currency);
  if (!shopItem || !currency) return;

  const amount = Number.parseInt(msg.content);
  if (isNaN(amount) || amount <= 0) {
    p.sendMessage(ChatColor.RED + 'Viallinen kappalemäärä');
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
      p.sendMessage(ChatColor.RED + 'Kaupassa ei tarpeeksi tilaa');
      return;
    }
    result = sell(
      p,
      shopItem,
      amount,
      view.price,
      currency,
      chest.state,
      view.tax,
    );
  }

  // Check if player can buy items from "SELLING" chest
  if (view.type === 'SELLING') {
    const itemsInShop = countItemsInShop(chest.state, shopItem);
    if (itemsInShop < amount) {
      p.sendMessage(ChatColor.RED + 'Kaupassa ei tarpeeksi tuotetta');
      return;
    }
    result = buy(
      p,
      shopItem,
      amount,
      view.price,
      currency,
      chest.state,
      view.tax,
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

function sell(
  player: Player,
  shopItem: ItemStack,
  amount: number,
  productPrice: number,
  currency: Currency,
  chest: Container,
  taxRate: number,
): TransactionResult | undefined {
  const moneyInShop = getInventoryBalance(chest.inventory, currency);
  const price = productPrice * amount;
  if (moneyInShop < price) {
    player.sendMessage(ChatColor.RED + 'Kaupassa ei ole tarpeeksi rahaa!');
    return undefined;
  }

  const tax = getTaxes(taxRate, price);
  takeMoneyFrom(chest.inventory, price, currency);
  giveMoney(player.inventory, price - tax, currency);

  const allProducts = findItemsFromInventory(player.inventory, shopItem);
  const items: ItemStack[] = [];

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
  return { taxAmount: tax };
}

function buy(
  player: Player,
  shopItem: ItemStack,
  amount: number,
  productPrice: number,
  currency: Currency,
  chest: Container,
  taxRate: number,
): TransactionResult | undefined {
  const price = amount * productPrice;
  const balance = getInventoryBalance(player.inventory, currency);
  if (price > balance) {
    player.sendMessage(ChatColor.RED + 'Sinulla ei ole tarpeeksi rahaa!');
    return undefined;
  }

  const tax = getTaxes(taxRate, price);
  takeMoneyFrom(player.inventory, price, currency);
  giveMoney(chest.inventory, price - tax, currency);

  const allProducts = findItemsFromInventory(chest.inventory, shopItem);

  const items: ItemStack[] = [];

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
