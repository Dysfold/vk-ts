import { Material, Sound, SoundCategory } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { Player } from 'org.bukkit.entity';

const GoldenHorn = new CustomItem({
  id: 5,
  name: 'Kultainen torvi',
  type: Material.SHULKER_SHELL,
  modelId: 5,
});

const hornUsers = new Set<Player>();

GoldenHorn.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.action !== Action.RIGHT_CLICK_AIR) return;
    const player = event.player;
    if (hornUsers.has(player)) return;
    hornUsers.add(player);

    if (event.hand === EquipmentSlot.HAND) {
      player.swingMainHand();
    } else {
      player.swingOffHand();
    }

    player.world.playSound(
      player.location,
      Sound.EVENT_RAID_HORN,
      SoundCategory.PLAYERS,
      100,
      1,
    );
    await wait(3, 'seconds');
    hornUsers.delete(player);
  },
);
