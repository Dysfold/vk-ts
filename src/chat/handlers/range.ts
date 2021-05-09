import { Location } from 'org.bukkit';
import { ArmorStand, Player } from 'org.bukkit.entity';
import { SpeakerStaff } from '../items';
import { ChatMessage } from '../pipeline';
import { IsMention } from './mention';
import { distanceBetween } from '../../common/helpers/locations';

interface Range {
  /**
   * Range from which the message can be heard without scrambling.
   */
  clear: number;

  /**
   * Maximum range the message can be head from.
   */
  max: number;

  /**
   * Minimum and maximum scramble factors are used to decide how many
   * characters should be scrambled in the chat message. Scales linearly in
   * ranges between clear and max.
   */
  scramble: [number, number];
}

interface RangeOptions {
  /**
   * Normal range, used by default.
   */
  normal: Range;

  /**
   * Range for messages that contain one or more exclamation marks.
   */
  shout?: Range;

  /**
   * Range for messages sent when sitting. Overrides shouting.
   */
  sitting?: Range;

  /**
   * Range when speaker staff is used. Overrides sitting and shouting.
   */
  speaker?: Range;
}

/**
 * Range check results.
 */
export const RangeCheck = (props: {
  /**
   * The effective range between sender and receiver.
   */
  range: number;

  /**
   * Scramble factor based on channel settings and range.
   */
  scrambleFactor: number;
}) => props;

/**
 * Creates a range check handler that can be used in a local pipeline.
 * This does not actually discard or scramble any messages - that is left
 * for message formatters.
 * @param options Range options.
 */
export function rangeCheckHandler(
  options: RangeOptions,
): (msg: ChatMessage, receiver: Player) => void {
  return (msg: ChatMessage, receiver: Player) => {
    const sender = msg.sender;
    let opts;
    if (SpeakerStaff.check(sender.inventory.itemInMainHand)) {
      opts = options.speaker ?? options.normal;
    } else if (sender.vehicle instanceof ArmorStand) {
      opts = options.sitting ?? options.normal;
    } else if (msg.content.includes('!')) {
      opts = options.shout ?? options.normal;
    } else {
      opts = options.normal;
    }

    const range = distanceBetween(receiver.location, sender.location);
    const visible = range <= opts.max;
    if (visible) {
      const result = {
        range,
        scrambleFactor: computeScramble(opts, range),
      };
      msg.setData(RangeCheck, result);

      // Eliminate mentions if the message is scrambled
      if (result.scrambleFactor > 0) {
        msg.setData(IsMention, 'scramble-prevents');
      }
    } else {
      msg.discard = true; // Not visible
    }
  };
}

function computeScramble(opts: Range, range: number) {
  if (range <= opts.clear) {
    return 0; // Don't scramble at all
  } else if (range > opts.max) {
    return 1; // Scramble all, but the message should not be even visible...
  }

  // Scale scramble factor linearly from given minimum to maximum
  const mod = (range - opts.clear) / (opts.max - opts.clear);
  return mod * opts.scramble[1] + (1 - mod) * opts.scramble[0];
}
