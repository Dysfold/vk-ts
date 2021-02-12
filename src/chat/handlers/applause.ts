import { clap } from '../../misc/applause';
import { ChatMessage } from '../pipeline';

/**
 * Alternative interface for clapping hands.
 */
export function detectApplause(msg: ChatMessage) {
  if (msg.content.includes('*taptap*') || msg.content.includes('*tap tap*')) {
    clap(msg.sender, 5);
  } else if (msg.content.includes('*tap*')) {
    clap(msg.sender, 1);
  }
}
