import { color, text } from 'craftjs-plugin/chat';
import { Player } from 'org.bukkit.entity';
import { ChatTheme } from './theme';

export function formatChannel(channel: string, theme: ChatTheme) {
  const { parentheses, name } = theme.channel;
  return [
    color(parentheses, text('(')),
    color(name, text(channel)),
    color(parentheses, text(') ')),
  ];
}

export function formatProfession(player: Player, theme: ChatTheme) {
  const { brackets, name } = theme.profession;
  return [
    color(brackets, text('[')),
    color(name.normal, text('Testaaja')),
    color(brackets, text('] ')),
  ];
}

export function formatSender(player: Player, theme: ChatTheme) {
  return color(theme.playerName, text(player.name + ': '));
}

export function formatMessage(msg: string, theme: ChatTheme) {
  return color(theme.message.normal, text(msg));
}
