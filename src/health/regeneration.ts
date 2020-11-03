import { Boolean } from 'java.lang';
import { GameRule } from 'org.bukkit';

const REGENERATION_INTERVAL = 30; // Seconds
// If treshold is 15, player will not regenerate if he has more than 5 food points missing (or "2.5" points)
const FOOD_LEVEL_TRESHOLD = 15;
const Regeneration = {
  default: 1,
  sleeping: 3,
};

// We assume that first world is the default world
server.worlds
  .get(0)
  .setGameRule(GameRule.NATURAL_REGENERATION, new Boolean(false));

// Regenerate health
setInterval(() => {
  for (const player of server.onlinePlayers) {
    if (player.health >= player.maxHealth) continue;
    if (player.foodLevel < FOOD_LEVEL_TRESHOLD) continue;

    player.foodLevel -= 1;
    if (player.isSleeping()) {
      player.health += Regeneration.sleeping;
    } else {
      player.health += Regeneration.default;
    }
  }
}, REGENERATION_INTERVAL * 1000);
