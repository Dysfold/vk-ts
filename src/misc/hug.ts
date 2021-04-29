import { GameMode, Particle } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerToggleSneakEvent } from 'org.bukkit.event.player';

const MESSAGE_RADIUS = 10;
const HUG_COOLDOWN = 1.25; // seconds
const hugCooldowns = new Set<Player>();

registerEvent(PlayerToggleSneakEvent, async (event) => {
  if (!canHug(event.player)) return;
  if (!event.isSneaking()) return;

  const target = event.player.getTargetEntity(2);
  if (!(target instanceof Player)) return;
  if (!canHug(target)) return;

  // Check if other player is looking at the hugger
  const otherTarget = target.getTargetEntity(3);
  if (!(otherTarget instanceof Player)) return;
  if (otherTarget !== event.player) return;

  hug(event.player, target);
});

async function hug(from: Player, to: Player) {
  hugCooldowns.add(to);

  // Particles
  from.world.spawnParticle(Particle.HEART, from.eyeLocation.add(0, 0.5, 0), 1);
  to.world.spawnParticle(Particle.HEART, to.eyeLocation.add(0, 0.5, 0), 1);

  // Messages
  from.sendMessage(`§fHalaat pelaajaa §7${to.name} §4❤`);
  to.sendMessage(`§fPelaaja §7${from.name} §fhalaa sinua §4❤`);
  for (const nearbyPlayer of from.location.getNearbyPlayers(MESSAGE_RADIUS)) {
    if (nearbyPlayer == from || nearbyPlayer == to) continue;
    nearbyPlayer.sendMessage(
      `§7${from.name} §fhalaa pelaajaa §7${to.name} §4❤`,
    );
  }

  await wait(HUG_COOLDOWN, 'seconds');
  hugCooldowns.delete(to);
}

function canHug(player: Player) {
  if (hugCooldowns.has(player)) return false;
  if (!player.isSneaking()) return false;
  if (!player.isOnGround()) return false;
  if (player.gameMode === GameMode.SPECTATOR) return false;
  return true;
}
