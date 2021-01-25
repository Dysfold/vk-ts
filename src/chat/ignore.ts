import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../common/datas/holder';
import { ChatChannel } from './channel';

export function isChannelIgnored(
  player: Player,
  channel: ChatChannel,
): boolean {
  return (
    dataHolder(player).get('chat.ignore.channel.' + channel.name, 'boolean') ??
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
      'chat.ignore.channel' + channel.name,
      'boolean',
      true,
    );
  } else {
    dataHolder(player).delete('chat.ignore.channel' + channel.name);
  }
}

// TODO player ignore support
