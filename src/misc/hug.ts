import { PlayerToggleSneakEvent } from 'org.bukkit.event.player';
import { Particle } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';

const HUG_COOLDOWN = 1250; // milliseconds
const hugCooldowns = new Set<Player>();

registerEvent(PlayerToggleSneakEvent, async (event) => {
    if(!event.isSneaking()) return;
    if(hugCooldowns.has(event.player)) return;
    const location = event.player.location.add(event.player.location.direction.multiply(0.7));
    for(let player of location.getNearbyPlayers(0.5)) {
        if(player == event.player) continue;
        if(!player.isSneaking()) continue;
        hugCooldowns.add(player);
        event.player.sendMessage(`§fHalaat pelaajaa §7${player.name} §4❤`);
        player.sendMessage(`§fPelaaja §7${event.player.name} §fhalaa sinua §4❤`)
        event.player.world.spawnParticle(Particle.HEART, event.player.eyeLocation.add(0,0.5,0), 1)
        player.world.spawnParticle(Particle.HEART, player.eyeLocation.add(0,0.5,0), 1)
        for(let nearbyPlayer of event.player.location.getNearbyPlayers(10)) {
            if(nearbyPlayer == event.player || nearbyPlayer == player) continue;
            nearbyPlayer.sendMessage(`§7${event.player.name} §fhalaa pelaajaa §7${player.name} §4❤`)
        }
        await wait(HUG_COOLDOWN, 'millis');
        hugCooldowns.delete(player);
        break;
    }

})

