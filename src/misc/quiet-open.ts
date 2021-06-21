import { Door, Gate, TrapDoor } from 'org.bukkit.block.data.type';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Saw } from './saw';
import { Material } from 'org.bukkit';
import { EventPriority } from 'org.bukkit.event';

registerEvent(
  PlayerInteractEvent,
  (event) => {
    const block = event.clickedBlock;
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    if (!block) return;
    if (event.player.isSneaking()) return;
    if (event.isCancelled()) return;
    const blockData = block.blockData;
    let sound = '';

    // Wooden doors
    if (blockData instanceof Door) {
      if (block.type === Material.IRON_DOOR) return;
      sound = blockData.isOpen()
        ? 'non-silent.wooden_door.close'
        : 'non-silent.wooden_door.open';
    }

    // Fence gates
    else if (blockData instanceof Gate) {
      if (Saw.check(block)) return;
      sound = blockData.isOpen()
        ? 'non-silent.fence_gate.close'
        : 'non-silent.fence_gate.open';
    }

    // Fence gates
    else if (blockData instanceof TrapDoor) {
      sound = blockData.isOpen()
        ? 'non-silent.wooden_trapdoor.close'
        : 'non-silent.wooden_trapdoor.open';
    }

    if (sound) block.world.playSound(block.location, sound, 1, 1);
  },
  {
    // Priority is HIGH, because we need other events to fire first,
    // so we can check if this gets cancelled.
    // Example: Player places a lock on door -> event cancelled -> no sound
    priority: EventPriority.HIGH,
  },
);
