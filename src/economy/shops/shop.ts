import { color, text, tooltip, translate } from 'craftjs-plugin/chat';
import { UUID } from 'java.util';
import { TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { Bukkit, ChatColor, Material } from 'org.bukkit';
import { Block, Container } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action as BlockAction } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { getItemName } from '../../common/helpers/items';
import { getShopItem, findItemsFromContainer } from './helpers';
import { getBlockBehind } from './make-shop';
import { openShopGUI } from './shop-gui';
import { getShop } from './ShopData';
import { GLOBAL_PIPELINE, ChatMessage } from '../../chat/pipeline';
import { getInventoryBalance, takeMoneyFrom } from '../money';
import { getCurrency } from '../currency';
import { giveItem } from '../../common/helpers/inventory';

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== BlockAction.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  if (!event.clickedBlock) return;
  const sign = event.clickedBlock;
  const view = getShop(sign);

  if (!view) return;
  if (!view.type) return;

  if (event.player.isSneaking()) {
    openShopGUI(event.player, sign);
  }
  displayShopInfo(event.player, sign);
  // openShopGUI(event.player, chest.state, sign);
});

function displayShopInfo(p: Player, sign: Block) {
  const view = getShop(sign);
  if (!view) return;
  const item = getShopItem(view.item);
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
          text(`Verottaja: ${taxCollector?.name || 'Tuntematon'}`),
          text(`Vero: ${ChatColor.GOLD}${view.tax}%`),
        ),
      ),
    );
  }
  if (view.type === 'SELLING') {
    const amount = countItemsInShop(sign) ?? 0;
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
    const amount = countEmptyStacks(sign) ?? 0;
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
  activeCustomers.set(p, sign);
}

function countEmptyStacks(shopSign: Block) {
  const chest = getBlockBehind(shopSign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;
  const view = getShop(shopSign);
  if (!view) return;
  return chest.state.inventory.contents.reduce(
    (total, i) => total + (i === null ? 1 : 0),
    0,
  );
}

function countItemsInShop(shopSign: Block) {
  const chest = getBlockBehind(shopSign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;
  const view = getShop(shopSign);
  if (!view) return;
  const item = getShopItem(view.item);
  if (!item) return;
  const items = findItemsFromContainer(chest.state, item);
  return items.reduce((total, i) => total + i.amount, 0);
}

const activeCustomers = new Map<Player, Block>();

function handleMessage(msg: ChatMessage) {
  const shopSign = activeCustomers.get(msg.sender);
  if (!shopSign) return;

  const p = msg.sender;

  const chest = getBlockBehind(shopSign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;
  const view = getShop(shopSign);
  if (!view) return;

  const amount = Number.parseInt(msg.content);
  if (isNaN(amount) || amount <= 0) {
    p.sendMessage(ChatColor.RED + 'Viallinen kappalemäärä');
    return;
  }

  // Check if player can sell items to the "BUYING" chest
  if (view.type === 'BUYING') {
    const emptyStacks = countEmptyStacks(shopSign) ?? 0;
    const material = Material.getMaterial(view.item.material);
    if (!material) return;
    const stackSize = material?.maxStackSize;
    const maxAmount = stackSize * emptyStacks;
    if (amount > maxAmount) {
      p.sendMessage(ChatColor.RED + 'Kaupassa ei tarpeeksi tilaa');
      return;
    }
  }

  // Check if player can buy items from "SELLING" chest
  if (view.type === 'SELLING') {
    const itemsInShop = countItemsInShop(shopSign) ?? 0;
    if (itemsInShop < amount) {
      p.sendMessage(ChatColor.RED + 'Kaupassa ei tarpeeksi tuotetta');
      return;
    }
  }

  buy(p, amount, shopSign);
}

function buy(player: Player, amount: number, shopSign: Block) {
  const chest = getBlockBehind(shopSign);
  if (!chest) return false;
  if (!(chest.state instanceof Container)) return false;
  const view = getShop(shopSign);
  if (!view) return;

  const currency = getCurrency(
    view.currency.model,
    view.currency.unitPlural,
    view.currency.subunitPlural,
  );
  if (!currency) return;

  const price = amount * view.price;
  const balance = getInventoryBalance(player.inventory, currency);
  if (price > balance) {
    player.sendMessage(ChatColor.RED + 'Sinulla ei ole tarpeeksi rahaa!');
    return false;
  }
  player.sendMessage('Sinulla on rahaa: ' + balance + ' / ' + price);

  const shopItem = getShopItem(view.item);
  if (!shopItem) {
    log.error('ShopItem parsing failed: ', view);
    return false;
  }

  takeMoneyFrom(player, price, currency);
  const allProducts = findItemsFromContainer(chest.state, shopItem);

  const items: ItemStack[] = [];

  let a = amount;
  for (const product of allProducts) {
    if (a <= 0) return;
    const amountToRemove = Math.min(product.amount, a);
    a = amountToRemove;
    items.push(product.clone().asQuantity(amountToRemove));
    product.amount -= amountToRemove;
  }
  items.forEach((item) => {
    giveItem(player, item, player.mainHand);
  });
}

function detectShopTransaction(msg: ChatMessage) {
  if (!activeCustomers.has(msg.sender)) return;
  msg.discard = true;
  handleMessage(msg);
  activeCustomers.delete(msg.sender);
}

GLOBAL_PIPELINE.addHandler('detectShopTransaction', -1, detectShopTransaction);
