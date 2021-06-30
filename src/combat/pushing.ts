import { Material } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { Vector } from 'org.bukkit.util';
import { isHandcuffed } from './handcuffs';

const cooldowns = new Set<Player>();
const MAX_DISTANCE = 1.6;

registerEvent(PlayerInteractEntityEvent, async (event) => {
  const clicked = event.rightClicked;
  if (!clicked) return;
  if (clicked.type !== EntityType.PLAYER) return;

  const pusher = event.player;
  const target = clicked as unknown as Player;
  if (pusher.itemInHand.type !== Material.AIR) return;
  if (target.isSneaking()) return;
  if (pusher.isSneaking()) return;
  if (!isHandcuffed(target)) return; // Handcuffed players can be dragged, not pushed
  if (cooldowns.has(pusher)) return;
  const distance = pusher.location.distance(clicked.location);
  if (distance > MAX_DISTANCE) return;
  // Start pushing
  cooldowns.add(pusher);
  const power = pusher.isSprinting() ? 0.6 : 0.3;
  const velocity = target.velocity;
  const direction = pusher.location.direction.multiply(power);
  velocity.add(direction).add(new Vector(0, 0.3, 0));
  velocity.y = Math.max(velocity.y, 0.3);
  target.velocity = velocity;

  await wait(1, 'seconds');
  cooldowns.delete(pusher);
});
