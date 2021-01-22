import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import {
  ChatMessage,
  ChatPipeline,
  GLOBAL_PIPELINE,
  LOCAL_PIPELINE,
} from './pipeline';

export class ChatChannel {
  /**
   * Channel name for internal usage. Not visible to players.
   */
  private name: string;

  /**
   * Pipeline that messages to this channel pass through once.
   */
  readonly global: ChatPipeline;

  /**
   * Pipeline that messages to this channel pass through once per every online
   * player.
   */
  readonly local: ChatPipeline;

  constructor(name: string) {
    this.name = name;
    this.global = new ChatPipeline();
    this.local = new ChatPipeline();
  }

  /**
   * Sends a message from player to this channel.
   * @param sender Sender of the message.
   * @param msg The message.
   */
  sendMessage(sender: Player, msg: string) {
    this.handleMessage(new ChatMessage(sender, this, msg));
  }

  /**
   * Passes a message through all chat handlers for this channel.
   * @param msg Message to handle.
   */
  private handleMessage(msg: ChatMessage) {
    // Global pipelines are executed at most once per message
    // Discarding (probably) prevents anyone from seeing the message
    if (!GLOBAL_PIPELINE.handleMessage(msg)) {
      return; // Discarded
    }
    if (!this.global.handleMessage(msg)) {
      return; // Discarded
    }

    // Local pipelines are executed once per online player
    // Discarding is used to control who can see the message
    for (const player of Bukkit.onlinePlayers) {
      if (!LOCAL_PIPELINE.handleMessage(msg, player)) {
        continue; // Discarded
      }
      if (!this.local.handleMessage(msg, player)) {
        continue;
      }
    }
  }
}
