import { Material, Particle, Sound } from 'org.bukkit';
import { Arrow, EntityType, Player } from 'org.bukkit.entity';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';

const BREAK_VELOCITY = 2.0; // If below 0.5 -> May cause multiple blocks breaking when arrow falls down

registerEvent(ProjectileHitEvent, (event) => {
  if (!(event.entity instanceof Arrow)) return;

  const arrow = event.entity as Arrow;
  const block = event.hitBlock;

  if (!block) return;

  // Call BlockBreakEvent for grief prevention
  if (!(arrow.shooter instanceof Player)) return;
  const blockBreakEvent = new BlockBreakEvent(block, arrow.shooter);
  server.pluginManager.callEvent(blockBreakEvent);
  if (blockBreakEvent.isCancelled()) return;

  // Break glass blocks and panes if arrow exceeds BREAK_VELOCITY
  if (block.type.toString().includes('GLASS')) {
    if (arrow.velocity.length() <= BREAK_VELOCITY) return;
    // Play break effects
    const data = block.blockData;
    block.world.playSound(block.location, Sound.BLOCK_GLASS_BREAK, 1, 1);
    block.world.spawnParticle(
      Particle.BLOCK_DUST,
      block.location.add(0.5, 0.5, 0.5),
      30,
      data,
    );
    block.type = Material.AIR;
    // Replace arrow to prevent client side visual glitches
    const newArrow = block.world.spawnEntity(
      block.location.add(0.5, 0.5, 0.5),
      EntityType.ARROW,
    ) as Arrow;
    newArrow.pickupStatus = arrow.pickupStatus;
    arrow.remove();
  }
});
