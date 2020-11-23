import { EntityType, Player } from 'org.bukkit.entity';
import { PrepareAnvilEvent } from 'org.bukkit.event.inventory';

// TODO: Allow renaming on keys, handcuffs and locks

// Don't allow renaming of already named items
registerEvent(PrepareAnvilEvent, (event) => {
  const inventory = event.inventory;
  if (inventory.firstItem?.itemMeta.hasDisplayName) {
    // TODO: Add checks for non-italic texts
    event.result = null;

    // Notify the player
    const viewer = event.viewers.get(0);
    if (viewer.type !== EntityType.PLAYER) return;
    (viewer as Player).sendActionBar('Et voi nimetä tätä esinettä uudelleen');
  }
});
