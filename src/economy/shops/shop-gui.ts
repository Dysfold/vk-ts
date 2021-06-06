import { Bukkit, ChatColor } from 'org.bukkit';
import { Block, Container } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import {
  InventoryClickEvent,
  InventoryCloseEvent,
} from 'org.bukkit.event.inventory';
import { PlayerSwapHandItemsEvent } from 'org.bukkit.event.player';
import { findItemsFromInventory, getBlockBehind, getShopItem } from './helpers';
import { getShop } from './ShopData';
import { getTaxes } from './taxes';
import { getCurrencyTranslation, Currency } from '../currency';
import { t } from '../../common/localization/localization';

const GUI_ICON = '\uE009';

/**
 * Set of players who are using the shop GUI
 * This can be used to prevent inventory actions
 */
const openGUIs = new Set<Player>();

/**
 * Open GUI to display preview of the item in the shop
 * @param player Players who clicked the shop
 * @param chest Container behind the clicked sign (shop container)
 * @param sign The shop sign, where the data was stored
 */
export function openShopGUI(player: Player, sign: Block) {
  const chest = getBlockBehind(sign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;
  const shop = getShop(sign);
  if (!shop) return undefined;
  if (!shop.item) return undefined;
  const item = getShopItem(shop.item);
  if (!item) return;
  let itemPreview = findItemsFromInventory(chest.state.inventory, item)?.[0];
  if (!itemPreview) itemPreview = item;

  const inv = createShopGuiInventory(player, sign);
  if (!inv) return;
  openGUIs.add(player);

  inv.setItem(13, itemPreview.asQuantity(1));

  player.openInventory(inv);
}

/**
 * Create the (empty) inventory to be displayed
 * @param sign The sign of the shop
 */
function createShopGuiInventory(to: Player, sign: Block) {
  const shop = getShop(sign);
  if (!shop) return undefined;

  const price =
    shop.type === 'BUYING'
      ? shop.price - getTaxes(shop.taxRate, shop.price)
      : shop.price;

  const unitNames = getCurrencyTranslation(shop.currency as Currency);

  const unit = price === 1 ? unitNames.unit : unitNames.unitPlural;

  // Add custom characters to the inventory name for GUI
  return Bukkit.createInventory(
    null,
    3 * 9,
    ChatColor.WHITE +
      '\uF808' +
      GUI_ICON +
      '\uF80C' +
      price +
      ' ' +
      t(to, unit),
    // Alternative message to display (needs more space)
    // t(to, 'shop.unit_per_item', t(to, unit)),
  );
}

registerEvent(InventoryCloseEvent, (event) => {
  if (event.player instanceof Player) {
    openGUIs.delete(event.player);
  }
});

/**
 * Prevent all inventory actions when player has shop GUI open
 */
registerEvent(InventoryClickEvent, (event) => {
  if (!(event.whoClicked instanceof Player)) return;
  if (openGUIs.has(event.whoClicked)) event.setCancelled(true);
});
registerEvent(PlayerSwapHandItemsEvent, (event) => {
  if (openGUIs.has(event.player)) {
    // This will look buggy on the client, but still prevents the action
    // In creative mode this will actually "dupe" the item
    event.setCancelled(true);
    event.player.updateInventory();
  }
});
