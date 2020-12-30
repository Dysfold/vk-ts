import { AnvilDamagedEvent } from 'com.destroystokyo.paper.event.block';
import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { EntityChangeBlockEvent } from 'org.bukkit.event.entity';
import { InventoryClickEvent, InventoryType } from 'org.bukkit.event.inventory';

registerEvent(AnvilDamagedEvent, (event) => {
  event.setCancelled(true);
});

registerEvent(EntityChangeBlockEvent, async (event) => {
  if (
    event.to === Material.CHIPPED_ANVIL ||
    event.to === Material.DAMAGED_ANVIL
  ) {
    await wait(1, 'millis'); // Wait 1 millis for the anvil to become a block
    event.block.type = Material.ANVIL;
  }
});

registerEvent(InventoryClickEvent, async (event) => {
  const inventory = event.inventory;
  if (inventory.type !== InventoryType.ANVIL) return;
  if (event.slot !== 2) return;
  // Player clicked the result slot of an anvil

  const player = (event.whoClicked as unknown) as Player;
  const levelBefore = player.level;

  // Give the player enought levels for any kind of anvil usage
  player.level = 100;

  // Give player his levels back
  await wait(1, 'millis');
  player.level = levelBefore;

  // Updating the inventory because the item on cursor would be invisible
  // because client didn't realize that using the anvil was possible
  player.updateInventory();
});
