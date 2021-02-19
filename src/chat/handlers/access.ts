import { LOCAL_PIPELINE } from '../pipeline';
import { isHeardInWorld } from '../worlds';

// Discard messages that the receiver does not have permission to hear
LOCAL_PIPELINE.addHandler('receivePermission', -2, (msg, receiver) => {
  if (
    msg.channel.permission &&
    !receiver.hasPermission(msg.channel.permission)
  ) {
    msg.discard = true;
  }
});

// Discard messages that cannot be heard in receiver's world
LOCAL_PIPELINE.addHandler('worldCheck', -1, (msg, receiver) => {
  if (!isHeardInWorld(msg, receiver.world)) {
    msg.discard = true;
  }
});
