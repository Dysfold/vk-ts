import { Door } from 'org.bukkit.block.data.type';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

registerEvent(PlayerInteractEvent, (event) => {
  const block = event.clickedBlock;
  if (!block) return;
  if (!(block.blockData instanceof Door)) return;
  if (event.player.isSneaking()) return;

  // Custom sound names with vanilla sound files (sounds.json)
  const sound = (block.blockData as Door).isOpen()
    ? 'non-silent.wooden_door.close'
    : 'non-silent.wooden_door.open';

  block.world.playSound(block.location, sound, 1, 1);
});
