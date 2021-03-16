import { Material, SoundCategory } from 'org.bukkit';
import { EntityType, Player } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { Pliers } from '../blacksmith/blacksmith';
import { isHandcuffed } from '../combat/handcuffs';
import { CustomItem } from '../common/items/CustomItem';
import { EquipmentSlot } from 'org.bukkit.inventory';

const Tooth = new CustomItem({
  id: 18,
  modelId: 18,
  type: Material.SHULKER_SHELL,
  name: 'vk.tooth',
});

const COOLDOWN_DELAY = 60; // Seconds
const cooldowns = new Set<Player>();

Pliers.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInMainHand,
  async (event) => {
    if (event.hand !== EquipmentSlot.HAND) return;
    if (event.rightClicked.type !== EntityType.PLAYER) return;
    const victim = (event.rightClicked as unknown) as Player;
    if (!isHandcuffed(victim)) return;
    if (cooldowns.has(victim)) {
      event.player.sendActionBar('Et onnistu irroittamaan muita hampaita');
      return;
    }

    // Start removing the tooth >:)
    cooldowns.add(victim);
    victim.damage(2);
    const tooth = victim.world.dropItemNaturally(
      victim.location.add(0, 1, 0),
      Tooth.create({}),
    );
    const velocity = victim.location.direction;
    velocity.y = 0;
    tooth.velocity = velocity.normalize().multiply(0.3);
    tooth.pickupDelay = 40;

    victim.world.playSound(
      victim.location,
      'custom.scream',
      SoundCategory.PLAYERS,
      2,
      1,
    );
    shakeBody(victim);
    await wait(COOLDOWN_DELAY, 'seconds');
    cooldowns.delete(victim);
  },
);

const PITCHES = [-40, -80, -35, -85, -20, -80];
async function shakeBody(player: Player) {
  for (const pitch of PITCHES) {
    const tiltedHead = player.location;
    tiltedHead.pitch = pitch;
    player.teleport(tiltedHead);
    await wait(0.15, 'seconds');
  }
}
