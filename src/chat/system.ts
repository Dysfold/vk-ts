import { color, component, text } from 'craftjs-plugin/chat';
import { Audience } from 'net.kyori.adventure.audience';
import { Component } from 'net.kyori.adventure.text';
import { Player } from 'org.bukkit.entity';
import { getChatTheme } from './style/theme';

export function sendMessages(
  target: Audience,
  ...messages: (Component | string)[]
) {
  // Merge components to one, then send it
  // This imitates how old Bungeecord sendMessages() used to work
  target.sendMessage(
    component(
      ...messages.map((msg) => (typeof msg == 'string' ? text(msg) : msg)),
    ),
  );
}

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
