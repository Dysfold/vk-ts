import { style } from 'craftjs-plugin/chat';
import { CHAT_CHANNELS } from '../channel';
import { isChannelIgnored } from '../ignore';
import { LOCAL_PIPELINE } from '../pipeline';
import {
  formatChannel,
  formatMessage,
  formatProfession,
  formatSender,
} from '../style/format';
import { detectApplause } from './applause';
import { deliveryHandler } from './delivery';
import { playChatSound, showChatBubble } from './effect';
import { rangeCheckHandler } from './range';

const IgnoreResult = (props: {
  /**
   * If the channel is ignored.
   */
  channelIgnored: boolean;

  /**
   * If the sender is ignored.
   */
  senderIgnored: boolean;
}) => props;

/**
 * Mark messages from channels that players have ignored with
 * /ch leave <channel>.
 */
LOCAL_PIPELINE.addHandler('markIgnored', 0, (msg, receiver) => {
  msg.setData(IgnoreResult, {
    channelIgnored: isChannelIgnored(receiver, msg.channel),
    senderIgnored: false, // TODO implement
  });
});

/**
 * Deliver only messages that have not been discarded earlier.
 */
const DELIVER_PRIORITY = 9999;

CHAT_CHANNELS.global.global.addHandler('chatBubble', 9999, showChatBubble);
CHAT_CHANNELS.global.global.addHandler('chatSound', 9999, playChatSound);
CHAT_CHANNELS.global.global.addHandler('applause', 9999, detectApplause);

/**
 * For players who have ignored global, transfer messages to local channel.
 * If the receiver is out of range, they won't see/hear anything.
 */
CHAT_CHANNELS.global.local.addHandler('leakToLocal', 0, (msg, receiver) => {
  if (msg.data(IgnoreResult)?.channelIgnored) {
    msg.transfer(CHAT_CHANNELS.local, receiver);
  }
});

// Global channel

CHAT_CHANNELS.global.local.addHandler(
  'deliverMessage',
  DELIVER_PRIORITY,
  deliveryHandler((msg, theme) => [
    ...formatProfession(msg.sender, theme),
    formatSender(msg, theme),
    formatMessage(msg, theme),
  ]),
);

// Local channel

CHAT_CHANNELS.local.global.addHandler('chatBubble', 9999, showChatBubble);
CHAT_CHANNELS.local.global.addHandler('chatSound', 9999, playChatSound);
CHAT_CHANNELS.local.global.addHandler('applause', 9999, detectApplause);

CHAT_CHANNELS.local.local.addHandler(
  'rangeCheck',
  0,
  rangeCheckHandler({
    normal: { clear: 25, max: 32, scramble: [0, 0.7] },
    shout: { clear: 30, max: 36, scramble: [0, 0.7] },
    sitting: { clear: 15, max: 20, scramble: [0, 0.7] },
    speaker: { clear: 100, max: 120, scramble: [0, 0.6] },
  }),
);

CHAT_CHANNELS.local.local.addHandler(
  'deliverMessage',
  DELIVER_PRIORITY,
  deliveryHandler((msg, theme) => [
    ...formatChannel('Paikallinen', theme),
    ...formatProfession(msg.sender, theme),
    formatSender(msg, theme),
    formatMessage(msg, theme),
  ]),
);

// Whisper channel
CHAT_CHANNELS.whisper.local.addHandler(
  'rangeCheck',
  0,
  rangeCheckHandler({
    normal: { clear: 4, max: 6, scramble: [0, 0.8] },
    sitting: { clear: 2, max: 3, scramble: [0, 0.8] },
  }),
);

CHAT_CHANNELS.whisper.local.addHandler(
  'deliverMessage',
  DELIVER_PRIORITY,
  deliveryHandler((msg, theme) => [
    ...formatChannel('Kuiskaus', theme),
    formatSender(msg, theme),
    style('italic', formatMessage(msg, theme)),
  ]),
);

// Channel of the dead (Tuonela)
CHAT_CHANNELS.tuonela.local.addHandler(
  'deliverMessage',
  DELIVER_PRIORITY,
  deliveryHandler((msg, theme) => [
    ...formatChannel('Tuonela', theme),
    formatSender(msg, theme),
    formatMessage(msg, theme),
  ]),
);
