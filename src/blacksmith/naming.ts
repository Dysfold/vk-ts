import { EntityType, Player } from 'org.bukkit.entity';
import { PrepareAnvilEvent } from 'org.bukkit.event.inventory';
import { ItemStack } from 'org.bukkit.inventory';
import { Handcuffs } from '../combat/handcuffs';
import { Key } from '../locks/key';
import { VkItem } from '../common/items/VkItem';
import { isTranslatable } from '../chat/utils';

// TODO: Allow renaming of locks
/**
 * Check if item naming is allowed for this item.
 * This has priority over blacklist.
 */
function isAllowedItem(item: ItemStack) {
  if (Key.check(item)) return true;
  if (Handcuffs.check(item)) return true;
  return false;
}

/**
 * Check if item naming is not allowed for this item.
 * Whitelist has priority over blacklist.
 */
function isBlackListed(item: ItemStack) {
  return item.type === VkItem.MONEY;
}

function canBeRenamed(item: ItemStack) {
  // Whitelisted items can always be renamed, blacklisted cannot
  if (isAllowedItem(item)) return true;
  if (isBlackListed(item)) return false;

  // Items with Vanilla name or our custom default name can be renamed
  const name = item.itemMeta.displayName();
  if (!name || isTranslatable(name)) return true;

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
  (viewer as unknown as Player).sendActionBar(
    'Et voi nimetä tätä esinettä uudelleen',
  );
});
