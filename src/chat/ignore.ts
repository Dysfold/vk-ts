import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../common/datas/holder';
import { ChatChannel } from './channel';
import { errorMessage, statusMessage } from './system';

export function isChannelIgnored(
  player: Player,
  channel: ChatChannel,
): boolean {
  return (
    dataHolder(player).get('chat.ignore.channel.' + channel.id, 'boolean') ??
    false
  );
}

export function setIgnoreChannel(
  player: Player,
  channel: ChatChannel,
  status: boolean,
) {
  if (status) {
    dataHolder(player).set(
      'chat.ignore.channel.' + channel.id,
      'boolean',
      true,
    );
  } else {
    dataHolder(player).delete('chat.ignore.channel.' + channel.id);
  }
}

/**
 * Channels that can be ignored by players.
 */
export const IGNORABLE_CHANNELS = new Set(['global']);

/**
 * Tries to ignore a chat channel, sending messages to the player.
 * @param player Player that requested ignore.
 * @param name Channel name.
 * @param status Ignore status.
 */
export function ignoreChannel(
  player: Player,
  channel: ChatChannel,
  status: boolean,
) {
  // Don't allow leaving channels that are not ignorable
  if (!IGNORABLE_CHANNELS.has(channel.id) && !status) {
    errorMessage(player, `Kanavalta ${channel.names[0]} ei voi poistua`);
  }

  setIgnoreChannel(player, channel, status);
  statusMessage(
    player,
    !status
      ? channel.messages.join ?? `Liityit kanavalle ${channel.names[0]}`
      : channel.messages.leave ?? `Poistuit kanavalta ${channel.names[0]}`,
  );
}

// TODO player ignore support
