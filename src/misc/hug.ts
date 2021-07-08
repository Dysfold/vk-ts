import { color } from 'craftjs-plugin/chat';
import { NamedTextColor } from 'net.kyori.adventure.text.format';
import { GameMode, Particle } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { PlayerToggleSneakEvent } from 'org.bukkit.event.player';
import { sendMessages } from '../chat/system';
import { addTranslation, t } from '../common/localization/localization';

const MESSAGE_RADIUS = 10;
const HUG_COOLDOWN = 1.25; // seconds
const HUG_DISTANCE = 2;
const hugCooldowns = new Set<Player>();

registerEvent(PlayerToggleSneakEvent, async (event) => {
  if (!canHug(event.player)) return;
  if (!event.isSneaking()) return;

  const target = event.player.getTargetEntity(HUG_DISTANCE);
  if (!(target instanceof Player)) return;
  if (!canHug(target)) return;

  // Check if other player is looking at the hugger
  const otherTarget = target.getTargetEntity(HUG_DISTANCE);

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
  sendMessages(from, ...hugMsg(t(from, 'hug.you_hugged_someone', to.name)));
  sendMessages(to, ...hugMsg(t(to, 'hug.someone_hugged_you', from.name)));
  for (const nearbyPlayer of from.location.getNearbyPlayers(MESSAGE_RADIUS)) {
    if (nearbyPlayer == from || nearbyPlayer == to) continue;
    sendMessages(
      nearbyPlayer,
      ...hugMsg(
        t(nearbyPlayer, 'hug.someone_hugged_someone', from.name, to.name),
      ),
    );
  }

  await wait(HUG_COOLDOWN, 'seconds');
  hugCooldowns.delete(to);
}

function canHug(player: Player) {
  if (hugCooldowns.has(player)) return false;
  if (!player.isOnGround()) return false;
  if (player.gameMode === GameMode.SPECTATOR) return false;
  return true;
}

/***************
 * MESSAGES
 ***************/

addTranslation('hug.you_hugged_someone', {
  fi_fi: 'Halaat pelaajaa %s',
  en_us: 'You hugged %s',
});

addTranslation('hug.someone_hugged_you', {
  fi_fi: 'Pelaaja %s halaa sinua',
  en_us: 'Player %s hugged you',
});

addTranslation('hug.someone_hugged_someone', {
  fi_fi: 'Pelaaja %s halaa pelaajaa %s',
  en_us: 'Player %s hugged player %s',
});

const hugMsg = (text: string) => {
  const textMsg = color(NamedTextColor.YELLOW, text);
  const heart = color(NamedTextColor.RED, ' ❤');
  return [textMsg, heart];
};
