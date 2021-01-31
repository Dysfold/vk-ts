import { Player } from 'org.bukkit.entity';
import { ChatChannel } from './channel';

export enum PipelineStage {
  CREATED = 0,
  COMMON_GLOBAL = 1,
  CHANNEL_GLOBAL = 2,
  COMMON_LOCAL = 3,
  CHANNEL_LOCAL = 4,
}

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
   * Where this message currently is in the chat pipeline.
   */
  stage: PipelineStage;

  /**
   * If this message should be discarded before next pipeline step.
   */
  discard: boolean;

  /**
   * Data to pass between chat handlers.
   */
  private userData: Record<any, any>;

  constructor(sender: Player, channel: ChatChannel, content: string) {
    this.sender = sender;
    this.channel = channel;
    this.content = content;
    this.stage = PipelineStage.CREATED;
    this.discard = false;
    this.userData = {};
  }

  data<T>(type: (props: T) => T): T | undefined {
    return this.userData[type.name];
  }

  setData<T>(type: (props: T) => T, props: T) {
    this.userData[type.name] = type(props);
  }

  /**
   * Transfers this message to another chat channel. Stages that have been
   * fully completed will not be re-executed, but the current stage will be.
   * @param channel Channel to transfer to.
   * @param receiver Optional receiver. When present, local pipelines of new
   * channel are run for only that player instead of all online players.
   */
  transfer(channel: ChatChannel, receiver?: Player) {
    channel.handleMessage(this.shallowClone(), receiver);
    this.discard = true; // Discard on old channel only
  }

  enterStage(stage: PipelineStage): boolean {
    if (this.stage > stage) {
      return false;
    }
    this.stage = stage;
    return true;
  }

  /**
   * Creates a shallow clone of this message.
   */
  shallowClone(): ChatMessage {
    const msg = new ChatMessage(this.sender, this.channel, this.content);
    msg.stage = this.stage;
    msg.discard = this.discard;
    msg.userData = this.userData;
    return msg;
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

  /**
   * Adds a chat handler to this pipeline.
   * @param name Internally used name of the handler.
   * @param priority Priority of handler. Handlers with lowest priority come
   * first within one pipeline,
   * @param callback Function to call with messages.
   */
  addHandler(
    name: string,
    priority: number,
    callback: (msg: ChatMessage) => void,
  ): void {
    this.handlers.push({ name: name, priority: priority, callback: callback });
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
      if (msg.discard) {
        // Execute no more handlers and tell caller not to do so either
        return false;
      }
    }
    return true; // Message was not discarded
  }
}

export class LocalPipeline extends ChatPipeline {
  /**
   * Adds a chat handler to this pipeline.
   * @param name Internally used name of the handler.
   * @param priority Priority of handler. Handlers with lowest priority come
   * first within one pipeline,
   * @param callback Function to call with messages and their receivers.
   */
  addHandler(
    name: string,
    priority: number,
    callback: (msg: ChatMessage, receiver: Player) => void,
  ): void {
    super.addHandler(name, priority, callback as any); // FIXME dirty hack
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
export const LOCAL_PIPELINE = new LocalPipeline();
