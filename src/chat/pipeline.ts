import { Player } from 'org.bukkit.entity';
import { ChatChannel } from './channel';

export class ChatMessage {
  /**
   * Who sent the message.
   */
  readonly sender: Player;

  /**
   * Channel the message was sent on.
   */
  readonly channel: ChatChannel;

  /**
   * The chat message written by player.
   */
  readonly content: string;

  /**
   * If this message should be discarded before next pipeline step.
   */
  private requestDiscard: boolean;

  /**
   * Data to pass between chat handlers.
   */
  private userData: Record<any, any>;

  constructor(sender: Player, channel: ChatChannel, content: string) {
    this.sender = sender;
    this.channel = channel;
    this.content = content;
    this.requestDiscard = false;
    this.userData = {};
  }

  data<T>(type: new (...args: T[]) => T): T {
    const value = this.userData[type.name];
    if (!value) {
      throw new Error(`missing ChatMessage data of type ${type.name}`);
    }
    return value;
  }

  addData(data: { new (...args: any[]): any }) {
    this.userData[data.constructor.name] = data;
  }

  discard(): void {
    this.requestDiscard = true;
  }

  isDiscarded(): boolean {
    return this.requestDiscard;
  }
}

type MessageHandler = (msg: ChatMessage, receiver?: Player) => void;

interface ChatHandler {
  name: string;
  priority: number;
  callback: MessageHandler;
}

/**
 * A pipeline that messages pass through.
 */
export class ChatPipeline {
  /**
   * Pipeline entries that contain chat handlers and metadata we need.
   */
  private handlers: ChatHandler[];

  /**
   * If this pipeline needs sorting before it can be used.
   */
  private dirty: boolean;

  constructor() {
    this.handlers = [];
    this.dirty = false; // Empty, nothing to sort
  }

  addHandler(handler: ChatHandler): void {
    this.handlers.push(handler);
    this.dirty = true; // Sort before use
  }

  /**
   * Sort by priority, smallest wins.
   */
  private sortHandlers() {
    this.handlers.sort((a, b) => a.priority - b.priority);
    this.dirty = false; // Now sorted by priority
  }

  /**
   * Pass a message through this pipeline.
   * @param msg The message.
   * @param receiver Receiver. This is only set for local pipelines.
   * @returns True if the message was discarded, false otherwise.
   */
  handleMessage(msg: ChatMessage, receiver?: Player): boolean {
    if (this.dirty) {
      this.sortHandlers();
    }
    for (const handler of this.handlers) {
      handler.callback(msg, receiver);
      if (msg.isDiscarded()) {
        // Execute no more handlers and tell caller not to do so either
        return false;
      }
    }
    return true; // Message was not discarded
  }
}

/**
 * Pipeline that is executed once per message for all chat channels.
 */
export const GLOBAL_PIPELINE = new ChatPipeline();

/**
 * Pipeline that is executed once per message per player, for all chat
 * channels.
 */
export const LOCAL_PIPELINE = new ChatPipeline();
