import { color, text, tooltip } from 'craftjs-plugin/chat';
import { Player } from 'org.bukkit.entity';
import { chanceOf } from '../../common/helpers/math';
import { IsMention } from '../handlers/mention';
import { RangeCheck } from '../handlers/range';
import { ChatMessage } from '../pipeline';
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
    color(name.normal, tooltip(text('Testaa palvelinta'), text('Testaaja'))),
    color(brackets, text('] ')),
  ];
}

export function formatSender(msg: ChatMessage, theme: ChatTheme) {
  // Alternative mention format support
  const nameColor =
    msg.data(IsMention) == 'alternative'
      ? theme.playerName.mention
      : theme.playerName.normal;
  return color(nameColor, text(msg.sender.name + ': '));
}

const SCRAMBLE_CHARS = [',', '.', "'", ' '];

export function formatMessage(msg: ChatMessage, theme: ChatTheme) {
  const range = msg.data(RangeCheck);
  let content;
  if (range) {
    const scramble = range.scrambleFactor;
    content = '';
    for (const c of msg.content) {
      if (chanceOf(scramble)) {
        // TODO looks weird, should this be improved?
        content +=
          SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      } else {
        content += c;
      }
    }
  } else {
    content = msg.content;
  }
  const msgColor =
    msg.data(IsMention) == 'default'
      ? theme.message.mention
      : theme.message.normal;
  return color(msgColor, text(content));
}
