import { BaseComponent } from 'net.md_5.bungee.api.chat';
import { Player } from 'org.bukkit.entity';
import { ChatMessage } from '../pipeline';
import { ChatTheme, getChatTheme } from '../style/theme';

/**
 * Creates a chat handler that formats and delivers message to a player.
 * @param formatter Formatter function.
 */
export function deliveryHandler(
  formatter: (msg: ChatMessage, theme: ChatTheme) => BaseComponent[],
): (msg: ChatMessage, receiver: Player) => void {
  return (msg: ChatMessage, receiver: Player) => {
    receiver.sendMessage(...formatter(msg, getChatTheme(receiver)));
  };
}
