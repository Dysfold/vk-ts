import { Material } from 'org.bukkit';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { PlayerInventory } from 'org.bukkit.inventory';

// Player is damaged if player breaks glass or cactus with hand
registerEvent(BlockBreakEvent, (event) => {
  const type = event.block?.type;
  if (!type.toString().includes('GLASS') && type !== Material.CACTUS) return;

  const itemInHand = (event.player.inventory as PlayerInventory).itemInMainHand;

  if (itemInHand.type !== Material.AIR) return;
  event.player.damage(2);
});
