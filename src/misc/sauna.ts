import { Material, Particle, Sound } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';

const SAUNA_STONES = Material.COBBLESTONE_SLAB;
const GLASS_BOTTLE = new ItemStack(Material.GLASS_BOTTLE);

registerEvent(PlayerInteractEvent, (event) => {
  if (event.clickedBlock?.type !== SAUNA_STONES) return;
  if (event.item?.type !== Material.POTION) return;
  if (event.action !== Action.LEFT_CLICK_BLOCK) return;
  event.setCancelled(true);

  // Remove water from the item
  const replacement = GLASS_BOTTLE;
  if (event.item.itemMeta.hasCustomModelData()) {
    const meta = replacement.itemMeta;
    meta.customModelData = event.item.itemMeta.customModelData;
    replacement.itemMeta = meta;
  }
  if (event.hand === EquipmentSlot.HAND) {
    (event.player.inventory as PlayerInventory).itemInMainHand = replacement;
  } else {
    (event.player.inventory as PlayerInventory).itemInOffHand = replacement;
  }

  playSaunaEffects(event.clickedBlock);
});

function playSaunaEffects(block: Block) {
  const location = block.location.add(0.5, 1, 0.5);
  block.world.playSound(location, Sound.BLOCK_FIRE_EXTINGUISH, 1, 1);
  for (let i = 0; i < 5; i++)
    block.world.spawnParticle(Particle.CLOUD, location, 0);
}
