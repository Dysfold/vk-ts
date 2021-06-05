import { Player } from 'org.bukkit.entity';
import * as yup from 'yup';
import { dataType } from '../../common/datas/holder';
import { dataView, deleteView } from '../../common/datas/view';

const LikeCooldownData = dataType('playerLikeCooldownData', {
  previousTime: yup.number().notRequired(),
});

const LOKE_COOLDOWN_HOURS = 12;

/**
 * Get how much player has cooldown left (in milliseconds)
 * @param player Player who is using the like command
 */
export function getLikeCooldown(player: Player) {
  const previousTime = getPreviousTime(player);
  if (previousTime == undefined) return undefined;

  const remaining = getRemainingCooldownMs(previousTime);

  // Cooldown has expired. Clear the data
  if (remaining <= 0) {
    deleteView(LikeCooldownData, player);
    return undefined;
  }

  return remaining;
}

export function startLikeCooldown(player: Player) {
  const view = dataView(LikeCooldownData, player);
  view.previousTime = new Date().getTime();
}

const LIKE_COOLDOWN_MS = 1000 * 60 * 60 * LOKE_COOLDOWN_HOURS;
function getRemainingCooldownMs(previousTime: number) {
  return LIKE_COOLDOWN_MS - (new Date().getTime() - previousTime);
}

function getPreviousTime(player: Player) {
  const view = dataView(LikeCooldownData, player);
  return view.previousTime;
}
