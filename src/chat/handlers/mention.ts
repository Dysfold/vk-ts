import { Player } from 'org.bukkit.entity';
import { getChatOption } from '../options';
import { LOCAL_PIPELINE } from '../pipeline';

export const IsMention = (props: string) => props;

// Play mention sound and mark as mention for formatting
LOCAL_PIPELINE.addHandler('mentionPlayer', 999, (msg, receiver) => {
  if (msg.sender == receiver) return; // No self-mentions
  if (msg.content.includes(receiver.name)) {
    playMentionSound(receiver);
    msg.setData(IsMention, getChatOption(receiver, 'mentionStyle')); // Save for formatter
  }
});

function playMentionSound(player: Player) {
  const option = getChatOption(player, 'mentionSound');
  if (option == 'default') {
    player.playSound(player.location, 'entity.experience_orb.pickup', 0.9, 1);
  } else if (option == 'bell') {
    player.playSound(player.location, 'block.note_block.bell', 12, 1.414214); // C
  } // silent: don't play a sound
}
