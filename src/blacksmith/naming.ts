import { TranslatableComponent } from 'net.md_5.bungee.api.chat';
import { EntityType, Player } from 'org.bukkit.entity';
import { PrepareAnvilEvent } from 'org.bukkit.event.inventory';
import { ItemStack } from 'org.bukkit.inventory';
import { Handcuffs } from '../combat/handcuffs';
import { Key } from '../locks/key';
import { VkItem } from '../common/items/VkItem';

// TODO: Allow renaming of locks
function isAllowedItem(item: ItemStack) {
  if (Key.check(item)) return true;
  if (Handcuffs.check(item)) return true;
  return false;
}

function isBlackListed(item: ItemStack) {
  return item.type === VkItem.MONEY;
}

function canBeRenamed(item: ItemStack) {
  if (isAllowedItem(item)) return true;
  if (isBlackListed(item)) return false;
  if (!item.itemMeta.hasDisplayName()) return true;

  const components = item.itemMeta.displayNameComponent;
  for (const component of components) {
    // Check if the name is the original name
    if (component instanceof TranslatableComponent) {
      return true;
    }
  }
  return false;
}

// Don't allow renaming of already named items
registerEvent(PrepareAnvilEvent, (event) => {
  const item = event.inventory.firstItem;
  if (!item) return;
  if (canBeRenamed(item)) return;

  // Prevent renaming
  event.result = null;

  // Notify the player
  const viewer = event.viewers[0];
  if (viewer.type !== EntityType.PLAYER) return;
  ((viewer as unknown) as Player).sendActionBar(
    'Et voi nimetä tätä esinettä uudelleen',
  );
});
