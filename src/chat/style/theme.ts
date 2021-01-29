import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../../common/datas/holder';

/**
 * Chat themes contain most colors used by Valtakausi for chat messages.
 * In addition to giving players the choice about color themes, they help
 * ensure consistency of colors used by Valtakausi chat systems.
 *
 * All colors are in web-style RGB format, i.e. #RRGGBB. Alpha channel is not
 * supported by Minecraft.
 */
export interface ChatTheme {
  /**
   * Not a color, but name of this chat theme.
   */
  name: string;

  /**
   * Chat channel name color. Not shown in global.
   */
  channel: {
    name: string;
    parentheses: string;
  };

  /**
   * Profession name color. Not shown in whisper channel.
   */
  profession: {
    /**
     * Colors of actual name differ for "normal" players, nation leaders and
     * server admins.
     */
    name: {
      normal: string;
      leader: string;
      admin: string;
    };
    brackets: string;
  };

  /**
   * Player name (and including ':') color.
   */
  playerName: string;

  /**
   * Base color of the chat message content.
   */
  message: {
    normal: string;

    /**
     * Messages that mention the receiver are hightlighted.
     */
    mention: string;
  };
}

export const CHAT_THEMES: Record<string, ChatTheme> = {
  default: {
    name: 'Valtakausi',
    channel: { name: '#AAAAAA', parentheses: '#555555' },
    profession: {
      name: { normal: '#FFFFFF', leader: '#FFAA00', admin: '#55FFFF' },
      brackets: '#555555',
    },
    playerName: '#AAAAAA',
    message: {
      normal: '#FFFFFF',
      mention: '#FFFF55',
    },
  },
};

export function getChatTheme(player: Player): ChatTheme {
  return CHAT_THEMES[
    dataHolder(player).get('chat.theme', 'string') ?? 'default'
  ];
}

// TODO add theme change support
