import { Material, Particle } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';

const GRINDSTONE_EFFIENCY = 0.1;
const GRINDSTONE_DURATION = 1; // Seconds

const grindstoneUsers: Player[] = [];

const tools: Material[] = [
  Material.IRON_PICKAXE,
  Material.IRON_AXE,
  Material.IRON_SHOVEL,
  Material.IRON_SWORD,
  Material.IRON_HOE,
  Material.SHEARS,
  // TODO: Add more tools
];

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.getHand() !== EquipmentSlot.HAND) return;
  const block = event.getClickedBlock();
  if (!block || block.getType() !== Material.GRINDSTONE) return;

  event.setCancelled(true);

  const item = event.getItem();
  if (!item || item.getDurability() === 0) return;

  // Check if the tool can be grinded
  const material = item.getType();
  const player = event.getPlayer();
  const toolIdx = tools.indexOf(material, 0);
  if (toolIdx === -1) {
    player.sendActionBar('Tätä esinettä ei voi hioa');
    return;
  }

  // Check if the player is already using a grindstone
  const playerIdx = grindstoneUsers.indexOf(player, 0);
  if (playerIdx > -1) {
    return;
  }

  grindstoneUsers.push(player);
  const amount = Math.floor(material.getMaxDurability() * GRINDSTONE_EFFIENCY);
  item.setDurability(item.getDurability() - amount);

  playGrindstoneEffects(block, player);
  endGrinding(player);
});

const playGrindstoneEffects = (block: Block, player: Player) => {
  const location = block.getLocation();
  player.spawnParticle(
    Particle.CLOUD,
    location.add(0.5, 0.8, 0.5),
    5,
    0.2,
    0.2,
    0.2,
    0,
  );
  block.getWorld().playSound(location, 'block.grindstone.use', 1, 1);
};

const endGrinding = (player: Player) => {
  setTimeout(() => {
    const index = grindstoneUsers.indexOf(player, 0);
    if (index > -1) {
      grindstoneUsers.splice(index, 1);
    }
  }, GRINDSTONE_DURATION * 1000);
};
