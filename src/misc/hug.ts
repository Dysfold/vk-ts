import { GameMode, Particle, Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerToggleSneakEvent } from 'org.bukkit.event.player';

const MESSAGE_RADIUS = 10;
const HUG_COOLDOWN = 1.25; // seconds
const hugCooldowns = new Set<Player>();

registerEvent(PlayerToggleSneakEvent, async (event) => {
  if (!canHug(event.player)) return;
  if (!event.isSneaking()) return;
  Bukkit.broadcastMessage('0');

  const target = event.player.getTargetEntity(2);
  if (!(target instanceof Player)) return;
  if (!canHug(target)) return;
  Bukkit.broadcastMessage('1');

  // Check if other player is looking at the hugger
  Bukkit.broadcastMessage('2');
  const otherTarget = target.getTargetEntity(3);
  Bukkit.broadcastMessage('3');
  Bukkit.broadcastMessage('...' + otherTarget);

  if (!(otherTarget instanceof Player)) return;
  Bukkit.broadcastMessage('4');
  if (otherTarget !== event.player) return;
  Bukkit.broadcastMessage('5');

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
  // if (!player.isSneaking()) return false;
  if (!player.isOnGround()) return false;
  if (player.gameMode === GameMode.SPECTATOR) return false;
  return true;
}
