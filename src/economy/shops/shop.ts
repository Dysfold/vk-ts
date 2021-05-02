import { Container, Block } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { getBlockBehind } from './make-shop';
import { openShopGUI } from './shop-gui';
import { getShop } from './ShopData';
import { Player } from 'org.bukkit.entity';
import { color, text, tooltip } from 'craftjs-plugin/chat';
import { getItemName } from '../../common/helpers/items';
import { getShopItem } from './helpers';

const line = text('------------------------------------------');

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  if (!event.clickedBlock) return;
  const sign = event.clickedBlock;
  const view = getShop(sign);
  if (!view) return;

  const chest = getBlockBehind(sign);
  if (!chest) return;
  if (!(chest.state instanceof Container)) return;

  openShopGUI(event.player, chest.state, sign);
});

function displayShopInfo(player: Player, sign: Block) {
  const view = getShop(sign);
  if (!view) return;
  const item = getShopItem(
    view.item.material,
    view.item.modelId,
    view.item.name,
  );
  const itemName = getItemName();
  player.sendMessage(color('#FFAA00', line));
  player.sendMessage(
    color(
      '#FFFF55',
      text('Tämä kauppa myy tuotetta '),
      tooltip('Klikkaa nähdäksesi'),
    ),
  );
  player.sendMessage(color('#FFAA00', line));
}
