import { color, text } from 'craftjs-plugin/chat';
import { Player } from 'org.bukkit.entity';
import { getChatTheme } from './style/theme';

export function statusMessage(player: Player, msg: string) {
  if (msg != '') {
    const theme = getChatTheme(player);
    player.sendMessage(color(theme.system.status, text(msg)));
  }
}

export function errorMessage(player: Player, msg: string) {
  if (msg != '') {
    const theme = getChatTheme(player);
    player.sendMessage(color(theme.system.error, text(msg)));
  }
}
