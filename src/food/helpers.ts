import { Player } from 'org.bukkit.entity';

export function addFoodPoints(player: Player, foodPoints: number) {
  const maxFoodLevel = 20;
  player.foodLevel = Math.min(player.foodLevel + foodPoints, maxFoodLevel);
}

export function addSaturation(player: Player, saturation: number) {
  const maxSaturation = Math.min(player.foodLevel, 20); // Max saturation is always equal to players foodlevel
  player.saturation = Math.min(player.saturation + saturation, maxSaturation);
}
