import { color, component, text } from 'craftjs-plugin/chat';
import { Audience } from 'net.kyori.adventure.audience';
import { Component } from 'net.kyori.adventure.text';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { defaultChatTheme, getChatTheme } from './style/theme';

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

export function statusMessage(receiver: Player, msg: string) {
  if (msg != '') {
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.status, text(msg)));
  }
}

export function errorMessage(receiver: CommandSender | Player, msg: string) {
  if (msg != '') {
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.error, text(msg)));
  }
}

export function successMessage(receiver: CommandSender | Player, msg: string) {
  if (msg != '') {
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.success, text(msg)));
  }
}
