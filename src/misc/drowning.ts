import { Bukkit } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import { EntityToggleSwimEvent } from 'org.bukkit.event.entity';

registerEvent(EntityToggleSwimEvent, (event) => {
  if (event.entityType !== EntityType.PLAYER) return;
  const swimmer = (event.entity as unknown) as Player;

  swimmer.sendMessage('JU');
});

setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    if (player.isSwimming()) {
      continue;
    }
  }
}, 2000);

function getWeight(swimmer: Player) {
  const items = swimmer.inventory.contents.length;
  Bukkit.server.broadcastMessage('ITEMS ' + items);
}
