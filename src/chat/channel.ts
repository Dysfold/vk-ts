import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerChatEvent } from 'org.bukkit.event.player';
import { dataHolder } from '../common/datas/holder';
import { setIgnoreChannel } from './ignore';
import {
  ChatMessage,
  ChatPipeline,
  GLOBAL_PIPELINE,
  LocalPipeline,
  LOCAL_PIPELINE,
} from './pipeline';

export class ChatChannel {
  /**
   * Channel name for internal usage. Not visible to players.
   */
  readonly name: string;

  /**
   * Pipeline that messages to this channel pass through once.
   */
  readonly global: ChatPipeline;

  /**
   * Pipeline that messages to this channel pass through once per every online
   * player.
   */
  readonly local: LocalPipeline;

  constructor(name: string) {
    this.name = name;
    this.global = new ChatPipeline();
    this.local = new LocalPipeline();
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
      msg.discard = false; // Clear potential discard status from previous player
      if (!LOCAL_PIPELINE.handleMessage(msg, player)) {
        continue; // Discarded
      }
      if (!this.local.handleMessage(msg, player)) {
        continue;
      }
    }
  }
}

/**
 * All chat channels players can talk on.
 * Channels that are only used internally don't have to be added here.
 */
export const CHAT_CHANNELS = {
  whisper: new ChatChannel('whisper'),
  local: new ChatChannel('local'),
  global: new ChatChannel('global'),
};

/**
 * Default chat channel for new players.
 */
const DEFAULT_CHANNEL = CHAT_CHANNELS.local;

function getChatChannel(id: string | null) {
  return (
    (CHAT_CHANNELS as Record<string, ChatChannel>)[
      id ?? DEFAULT_CHANNEL.name
    ] ?? DEFAULT_CHANNEL
  );
}

/**
 * Player-facing chat channel names. These should be NEVER saved internally.
 */
const CHANNEL_NAMES: Record<string, ChatChannel> = {
  // Whisper
  whisper: CHAT_CHANNELS.whisper,
  w: CHAT_CHANNELS.whisper,
  kuiskaa: CHAT_CHANNELS.whisper,

  // Local
  local: CHAT_CHANNELS.local,
  l: CHAT_CHANNELS.local,
  // TODO Finnish name

  // Global
  global: CHAT_CHANNELS.global,
  g: CHAT_CHANNELS.global,
  // TODO Finnish name
};

/**
 * Gets the channel where messages sent by given player should go by default.
 * The player can usually change this by prefixing their message with channel
 * tags or commands.
 * @param player Sender.
 */
function getDefaultChannel(player: Player): ChatChannel {
  return getChatChannel(dataHolder(player).get('chat.channel', 'string'));
}

/**
 * Sets the channel where given players' messages go by default.
 * @param player Player.
 * @param channel Chat channel.
 */
function setDefaultChannel(player: Player, channel: ChatChannel) {
  dataHolder(player).set('chat.channel', 'string', channel.name);
}

// Redirect incoming chat messages to our chat system
registerEvent(PlayerChatEvent, (event) => {
  // Figure out where the message should go
  const channel =
    parseChannelTag(event.message) ?? getDefaultChannel(event.player);

  // Our chat system handles it from this point
  channel.sendMessage(event.player, event.message);
  event.setCancelled(true);
});

/**
 * Attempts to parse a channel tag (e.g. @l, @glocal) from start of message.
 * @param msg Chat message.
 */
function parseChannelTag(msg: string): ChatChannel | undefined {
  const trimmed = msg.trimStart();
  if (trimmed.startsWith('@')) {
    const tagEnd = trimmed.indexOf(' ');
    if (tagEnd != -1) {
      return CHANNEL_NAMES[trimmed.substring(1, tagEnd)];
    }
  }
  return undefined;
}

// Command to change and join/leave channels
registerCommand(
  ['ch', 'channel', 'kanava'],
  (sender, args) => {
    const player = (sender as unknown) as Player;
    if (args.length == 1) {
      // One argument: change default channel
      changeChannel(player, args[0]);
    } else if (args.length == 2) {
      const [action, name] = args;
      const channel = CHANNEL_NAMES[name];
      if (!channel) {
        player.sendMessage(`Kanavaa ${channel} ei ole olemassa`);
        return; // No usage needed, we printed our own error
      }

      // Join (unignore) or leave (ignore) a channel
      if (action == 'join' || action == 'liity') {
        setIgnoreChannel(player, channel, false);
      } else if (action == 'leave' || action == 'poistu') {
        setIgnoreChannel(player, channel, true);
      } else {
        return false;
      }
    } else {
      return false; // Show usage
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.chat.use',
    usage: '/ch <kanava> tai /ch <liity|poistu> <kanava>',
  },
);

function changeChannel(player: Player, name: string) {
  const channel = CHANNEL_NAMES[name];
  if (!channel) {
    player.sendMessage(`Kanavaa ${channel} ei ole olemassa`);
  } else {
    setDefaultChannel(player, channel);
  }
}

// Generate commands for all channel aliases
for (const [name, channel] of Object.entries(CHANNEL_NAMES)) {
  registerCommand(
    name,
    (sender) => {
      setDefaultChannel((sender as unknown) as Player, channel);
    },
    {
      executableBy: 'players',
      permission: 'vk.chat.use',
    },
  );
}
