import { PlayerJumpEvent } from 'com.destroystokyo.paper.event.player';
import { Location, Material, SoundCategory } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Ageable } from 'org.bukkit.block.data';
import { Player } from 'org.bukkit.entity';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';

// Materials list
const materials = [
  Material.ICE,
  Material.WATER,
  Material.FROSTED_ICE,
  Material.WATER,
];

registerEvent(PlayerJumpEvent, async (event) => {
  if (
    event.player.location.block.getRelative(BlockFace.DOWN).type !==
    Material.ICE
  )
    return;

  const locBlock = event.player.location.block.getRelative(BlockFace.DOWN);
  // 70% chance for the ice not to break
  if (Math.random() <= 0.7) {
    // 70& chance for the ice to play sound when not breaking
    if (Math.random() <= 0.7) {
      event.player.world.playSound(
        locBlock.location,
        'custom.ice_crack_short',
        SoundCategory.BLOCKS,
        1,
        1,
      );
    }
    return;
  }
  // Waiting for the player to be on ground
  await wait(12, 'ticks');
  breakIce(locBlock.location, 4);
});

registerEvent(EntityDamageEvent, (event) => {
  if (!(event.entity instanceof Player)) return;
  if (event.cause !== DamageCause.FALL) return;
  if (
    event.entity.location.block.getRelative(BlockFace.DOWN).type !==
    Material.ICE
  )
    return;

  // Block under player
  const locBlock = event.entity.location.block.getRelative(BlockFace.DOWN);
  breakIce(locBlock.location, 5);
});

function breakIce(location: Location, radius: number) {
  const locBlock = location.block;
  locBlock.world.playSound(
    locBlock.location,
    'custom.ice_crack_long',
    SoundCategory.BLOCKS,
    1,
    1,
  );
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      const block = locBlock.getRelative(x, 0.0, z);
      if (block.type !== Material.ICE) continue;

      // Compare against squared radius to check that point is inside circle
      if (x * x + z * z > radius * radius) continue;
      const material = Math.floor(Math.random() * materials.length);
      block.type = materials[material];

      // If the material from the list is Frosted Ice set the age
      if (materials[material] == Material.FROSTED_ICE) {
        const ageable = block.blockData as Ageable;
        ageable.age = 3;
        block.blockData = ageable;
      }
    }
  }
}
