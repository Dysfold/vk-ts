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
    if (isSwimming(player)) {
      const weight = getWeight(player);
      Bukkit.broadcastMessage('W ' + weight);
    }
  }
}, 2000);

function getWeight(swimmer: Player) {
  const items = swimmer.inventory.size;
  const armorWeight = swimmer.inventory.armorContents.length * 64;
  Bukkit.broadcastMessage('Items ' + items);
  Bukkit.broadcastMessage('Armor ' + armorWeight);
  return items + armorWeight;
}

function isSwimming(player: Player) {
  return player.isInWater() && !player.isOnGround();
}
