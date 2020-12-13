import { CustomItem } from '../common/items/CustomItem';
import { Material } from 'org.bukkit';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Action } from 'org.bukkit.event.block';
import { PlayerInventory } from 'org.bukkit.inventory';
import { List } from 'java.util';

const DriedTobacco = new CustomItem({
  id: 12,
  modelId: 12,
  type: Material.SHULKER_SHELL,
  name: 'Kuivattu tupakka',
});

const Pipe = new CustomItem({
  id: 24,
  modelId: 24,
  type: Material.DIAMOND_HOE,
  name: 'Piippu',
});

Pipe.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    const a = event.action;
    if (a !== Action.LEFT_CLICK_AIR && a !== Action.LEFT_CLICK_BLOCK) return;

    const player = event.player;
    const inventory = player.inventory as PlayerInventory;
    const offHand = inventory.itemInOffHand;

    if (!DriedTobacco.check(offHand)) return;

    offHand.amount--;

    const pipe = event.item;
    if (!pipe) return;
    const meta = pipe.itemMeta;
    let lore = meta.lore;

    // Test
    // prettier-ignore
    lore = (['§r§7Rivi 1', '§r§7Rivi 2', '§r§7Rivi 3'] as unknown) as List<string>;

    meta.lore = lore;
    pipe.itemMeta = meta;
  },
);
