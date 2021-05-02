import { color, text, translate, tooltip } from 'craftjs-plugin/chat';
import { TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { ChatColor, Bukkit } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action as BlockAction } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { getItemName } from '../../common/helpers/items';
import { getShopItem } from './helpers';
import { openShopGUI } from './shop-gui';
import { getShop } from './ShopData';
import { UUID } from 'java.util';

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
  const item = getShopItem(
    view.item.material,
    view.item.modelId,
    view.item.name,
    view.item.translationKey,
  );
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
    p.sendMessage(color('#FFD700', itemName));
  } else {
    p.sendMessage(
      color('#FFD700', text(ChatColor.ITALIC + '"' + itemName.text + '"')),
    );
  }
  p.sendMessage(color('#FFFF99', text(`Hinta: ${view.price} ${unit} / kpl`)));
  if (view.tax)
    p.sendMessage(
      color(
        '#FFFF99',
        tooltip(
          text(`Verottaja: ${taxCollector?.name || 'Tuntematon'}`),
          text(`Vero: `),
          color('#FFD700', text(`[${view.tax}%]`)),
        ),
      ),
    );

  p.sendMessage(color('#FFAA00', text('--------------------------------')));
  const action = view.type == 'SELLING' ? 'ostaa' : 'myydä';
  p.sendMessage(
    color('#FFFF99', text('Montako tuotetta haluat ' + action + '?')),
  );
}
