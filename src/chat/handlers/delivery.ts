import { Component } from 'net.kyori.adventure.text';
import { Player } from 'org.bukkit.entity';
import { ChatMessage } from '../pipeline';
import { ChatTheme, getChatTheme } from '../style/theme';
import { sendMessages } from '../system';

/**
 * Creates a chat handler that formats and delivers message to a player.
 * @param formatter Formatter function.
 */
export function deliveryHandler(
  formatter: (msg: ChatMessage, theme: ChatTheme) => Component[],
): (msg: ChatMessage, receiver: Player) => void {
  return (msg: ChatMessage, receiver: Player) => {
    sendMessages(receiver, ...formatter(msg, getChatTheme(receiver)));
  };
}
