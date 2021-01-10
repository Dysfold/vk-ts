import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { modifyArmor } from './armor-config';
import { Material } from 'org.bukkit';
import { PrepareItemCraftEvent } from 'org.bukkit.event.inventory';

function isArmor(type: Material) {
  const str = type.toString();
  return (
    str.includes('_HELMET') ||
    str.includes('_CHESTPLATE') ||
    str.includes('_LEGGINGS') ||
    str.includes('_BOOTS')
  );
}

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
