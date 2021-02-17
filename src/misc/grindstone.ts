import { Material, Particle } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const GRINDSTONE_EFFIENCY = 0.1;
const GRINDSTONE_DURATION = 1; // Seconds
const HAND_GRINDSTONE_EFFIENCY = 0.03;
const HAND_GRINDSTONE_DURATION = 1; // Seconds

const grindstoneUsers = new Set<Player>();

const TOOLS = new Set([
  Material.IRON_PICKAXE,
  Material.IRON_AXE,
  Material.IRON_SHOVEL,
  VkItem.SWORD,
  VkItem.TOOL,
  Material.SHEARS,
  // TODO: Add more tools
]);

export const HandGrindstone = new CustomItem({
  id: 1,
  name: 'Hiomakivi',
  type: VkItem.MISC,
  modelId: 1,
});

HandGrindstone.event(
  PlayerInteractEvent,
  (event) => (event.player.inventory as PlayerInventory).itemInOffHand,
  async (event) => {
    if (
      event.action !== Action.RIGHT_CLICK_AIR &&
      event.action !== Action.RIGHT_CLICK_BLOCK
    ) {
      return;
    }

    const tool = event.item;
    const player = event.player;
    if (!tool) return;
    if (!canBeGrinded(tool, player)) return;

    grindstoneUsers.add(player);
    repairTool(tool, HAND_GRINDSTONE_EFFIENCY);
    player.swingOffHand();
    player.playSound(player.location, 'block.grindstone.use', 1, 2);
    await wait(HAND_GRINDSTONE_DURATION, 'seconds');
    grindstoneUsers.delete(player);
  },
);

registerEvent(PlayerInteractEvent, async (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.hand !== EquipmentSlot.HAND) return;
  const block = event.clickedBlock;
  if (!block || block.type !== Material.GRINDSTONE) return;

  event.setCancelled(true);

  const item = event.item;
  const player = event.player;

  if (!item) return;
  if (!canBeGrinded(item, player)) return;

  grindstoneUsers.add(player);
  repairTool(item, GRINDSTONE_EFFIENCY);
  playGrindstoneEffects(block, player);
  await wait(GRINDSTONE_DURATION, 'seconds');
  grindstoneUsers.delete(player);
});

function playGrindstoneEffects(block: Block, player: Player) {
  const location = block.location;
  player.spawnParticle(
    Particle.CLOUD,
    location.add(0.5, 0.8, 0.5),
    5,
    0.2,
    0.2,
    0.2,
    0,
  );
  block.world.playSound(location, 'block.grindstone.use', 1, 1);
}

function repairTool(item: ItemStack, effiency: number) {
  const amount = Math.floor(item.type.maxDurability * effiency);
  item.durability = item.durability - amount;
}

function canBeGrinded(item: ItemStack, player: Player) {
  // Check if the tool can be grinded
  if (item.durability === 0) return false;
  if (grindstoneUsers.has(player)) return false;

  if (!TOOLS.has(item.type)) {
    player.sendActionBar('Tätä esinettä ei voi hioa');
    return false;
  }

  return true;
}
