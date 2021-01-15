import { Bukkit, GameRule } from 'org.bukkit';

const REGENERATION_INTERVAL = 30; // Seconds
// If treshold is 15, player will not regenerate if he has more than 5 food points missing (or "2.5" points)
const FOOD_LEVEL_TRESHOLD = 15;
const Regeneration = {
  default: 1,
  sleeping: 3,
};

// We assume that first world is the default world
Bukkit.server.worlds[0].setGameRule(GameRule.NATURAL_REGENERATION, false);

// Regenerate health
setInterval(() => {
  for (const player of Bukkit.server.onlinePlayers) {
    if (player.health >= player.maxHealth) continue;
    if (player.foodLevel < FOOD_LEVEL_TRESHOLD) continue;

    player.foodLevel -= 1;
    if (player.isSleeping()) {
      const newHealth = player.health + Regeneration.sleeping;
      player.health = Math.min(player.maxHealth, newHealth);
    } else {
      const newHealth = player.health + Regeneration.default;
      player.health = Math.min(player.maxHealth, newHealth);
    }
  }
}, REGENERATION_INTERVAL * 1000);
