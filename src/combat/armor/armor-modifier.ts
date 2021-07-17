import { PlayerArmorChangeEvent } from 'com.destroystokyo.paper.event.player';
import { SlotType } from 'com.destroystokyo.paper.event.player.PlayerArmorChangeEvent';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { PrepareItemCraftEvent } from 'org.bukkit.event.inventory';
import { isArmor, modifyArmor } from './armor-config';

// Change armor values of the armor when dropped / spawned
registerEvent(ItemSpawnEvent, (event) => {
  const item = event.entity.itemStack;
  if (item && isArmor(item.type)) {
    event.entity.itemStack = modifyArmor(item);
  }
});

// Change armor values of the armor when crafted
registerEvent(PrepareItemCraftEvent, (event) => {
  const item = event.inventory.result;
  if (item && isArmor(item.type)) {
    event.inventory.result = modifyArmor(item);
  }
});

// Change armor values of the armor when equiped
registerEvent(PlayerArmorChangeEvent, (event) => {
  const newItem = event.newItem;
  if (newItem && isArmor(newItem.type)) {
    const modifiedArmor = modifyArmor(newItem);

    const inv = event.player.inventory;
    switch (event.slotType) {
      case SlotType.HEAD:
        if (inv.helmet) inv.helmet.itemMeta = modifiedArmor.itemMeta;
        break;
      case SlotType.CHEST:
        if (inv.chestplate) inv.chestplate.itemMeta = modifiedArmor.itemMeta;
        break;
      case SlotType.LEGS:
        if (inv.leggings) inv.leggings.itemMeta = modifiedArmor.itemMeta;
        break;
      case SlotType.FEET:
        if (inv.boots) inv.boots.itemMeta = modifiedArmor.itemMeta;
        break;
    }
  }
});
