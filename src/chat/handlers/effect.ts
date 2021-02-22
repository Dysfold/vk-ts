import { Particle, SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { getChatOption } from '../options';
import { ChatMessage } from '../pipeline';

/**
 * Shows a chat bubble above sender's head.
 */
export function showChatBubble(msg: ChatMessage) {
  msg.sender.world.spawnParticle(
    Particle.VILLAGER_ANGRY,
    msg.sender.location.add(0, 1.6, 0),
    1,
    0,
    0,
    0,
  );
}

interface ChatSounds {
  normal: string[];
  question: string[];
}

const CHAT_SOUNDS: Record<string, ChatSounds> = {
  default: {
    normal: ['minecraft:entity.villager.yes', 'minecraft:entity.villager.no'],
    question: ['minecraft:entity.villager.trade'],
  },

  trader: {
    normal: ['minecraft:entity.wandering_trader.ambient'],
    question: ['minecraft:entity.wandering_trader.trade'],
  },

  pillager: {
    normal: ['entity.pillager.ambient'],
    question: ['entity.pillager.ambient'],
  },
};

function getChatSounds(player: Player) {
  return CHAT_SOUNDS[getChatOption(player, 'voice')];
}

function getVoicePitch(player: Player) {
  const name = getChatOption(player, 'pitch');
  if (name == 'low') {
    return 0.96;
  } else if (name == 'high') {
    return 1.05;
  } else {
    return 1;
  }
}

/**
 * Plays a sound at message sender.
 */
export function playChatSound(msg: ChatMessage) {
  // Determine available sounds
  const voice = getChatSounds(msg.sender);
  const question = msg.content.trimEnd().endsWith('?');
  const sounds = question ? voice.question : voice.normal;

  // Select sound randomly
  const sound = sounds[Math.floor(Math.random() * sounds.length)];
  msg.sender.world.playSound(
    msg.sender.location,
    sound,
    SoundCategory.PLAYERS,
    1,
    getVoicePitch(msg.sender),
  );
}
