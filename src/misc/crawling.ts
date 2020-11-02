import { BlockFace } from 'org.bukkit.block';
import { PlayerToggleSneakEvent } from 'org.bukkit.event.player';

registerEvent(PlayerToggleSneakEvent, async (event) => {
  const player = event.player;
  if (player.isSneaking()) return;

  const loc = player.location;
  const facing = player.facing;

  // "gap" is the block where the player is trying to crawl
  // and "top" is the block on top of the gap
  const gap = loc.block.getRelative(facing);
  const top = gap.getRelative(BlockFace.UP);

  if (!gap.isPassable()) return;
  if (top.isPassable()) return;

  // Teleport player in to the gap, which will make the player to crawl
  // Telporting the player just 0.000001 blocks forwards will be enough
  player.teleport(loc.add(facing.direction.multiply(0.000001)));

  // Teleport player backwards the same amount to prevent the possibility of getting stuck
  // TODO: Check if the locaton of the player is slightly on the left or right and check if there is another non-passable block
  await wait(10, 'ticks');
  player.teleport(
    player.location.subtract(facing.direction.multiply(0.000001)),
  );
});
