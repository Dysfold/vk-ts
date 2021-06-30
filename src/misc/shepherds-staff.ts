import { translate } from 'craftjs-plugin/chat';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { PlayerInteractEntityEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const FORCE = 0.5;
const MAX_FORCE_UPWARDS = 0.2;

const cooldowns = new Set<Player>();

const ShepherdsStaff = new CustomItem({
  id: 4,
  type: VkItem.TOOL,
  name: translate('vk.shepherd_staff'),
});

ShepherdsStaff.event(
  PlayerInteractEntityEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInMainHand,
  async (event) => {
    const clicked = event.rightClicked;
    if (!clicked) return;
    if (event.hand !== EquipmentSlot.HAND) return;

    const player = event.player;
    if (!(clicked instanceof LivingEntity)) return;
    const target = clicked as LivingEntity;
    if (target.type === EntityType.PLAYER) {
      if ((target as unknown as Player).isSneaking()) return;
    }
    if (cooldowns.has(player)) return;

    // Start pulling
    cooldowns.add(player);
    const velocity = target.velocity;
    const direction = player.location.direction.multiply(FORCE);
    velocity.subtract(direction);
    velocity.y = Math.min(velocity.y, MAX_FORCE_UPWARDS);
    target.velocity = velocity;
    player.swingMainHand();

    await wait(1, 'seconds');
    cooldowns.delete(player);
  },
);
