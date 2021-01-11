import { ThrownEggHatchEvent } from 'com.destroystokyo.paper.event.entity';

registerEvent(ThrownEggHatchEvent, (event) => {
  event.setHatching(false);
});
