import { BlockFace } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
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

  // We might need to check if there is gap on the left or on the right side of the gap block
  // For example if player is between 2 blocks, then we need to check 2 blocks in front of him
  const overlap = getOverlappingFace(player);
  if (overlap) {
    const overlapBlock = gap.getRelative(overlap);
    if (!overlapBlock.isPassable()) return;
  }

  // Teleport player in to the gap, which will make the player to crawl
  // Telporting the player just 0.000001 blocks forwards will be enough
  player.teleport(loc.add(facing.direction.multiply(0.000001)));
});

/**
 * Check if player is not in the center of the block, but on the right or the left side.
 * -> There might be additional blockface we need to check before crawling.
 * Returns undefined if it is okay to check only one block
 */
function getOverlappingFace(player: Player) {
  const loc = player.location;
  const facing = player.facing;

  switch (facing) {
    case BlockFace.SOUTH:
    case BlockFace.NORTH:
      const x = Math.abs(loc.x % 1);
      if (x > 0.7) return BlockFace.EAST;
      if (x < 0.3) return BlockFace.WEST;
    case BlockFace.WEST:
    case BlockFace.EAST:
      const z = Math.abs(loc.z % 1);
      if (z > 0.7) return BlockFace.NORTH;
      if (z < 0.3) return BlockFace.SOUTH;
  }
  return undefined;
}
