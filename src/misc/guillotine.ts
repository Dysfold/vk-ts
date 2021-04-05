import { ParticleBuilder } from 'com.destroystokyo.paper';
import { translate } from 'craftjs-plugin/chat';
import { Location, Material, Particle, Sound, SoundCategory } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import {
  BlockBreakEvent,
  BlockPistonRetractEvent,
} from 'org.bukkit.event.block';
import { EntityDamageEvent } from 'org.bukkit.event.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';
import { isRightClick } from '../common/helpers/click';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const DEADLY_CHOP_VELOCITY = 0.6; // Approx. > 3 block fall kills always.
const VEL_DAMAGE_MODIFIER = 12; // This is multiplied with y_velocity to get smaller drop damage.
const PLACEMENT_SOUND = Sound.BLOCK_ANVIL_PLACE;
const BREAK_SOUND = Sound.BLOCK_ANVIL_BREAK;
const LAND_SOUND = Sound.BLOCK_ANVIL_LAND;

const cooldowns = new Set<Player>();

const Blade = new CustomItem({
  id: 5,
  name: translate('vk.golden_horn'),
  type: VkItem.UNSTACKABLE,
});

async function dropBlade(armorStand: ArmorStand) {
  if (armorStand.hasGravity()) return; // Has gravity -> Blade already falling.
  armorStand.setGravity(true);
  armorStand.setInvulnerable(true);
  let previousY = armorStand.velocity.y;

  // Blade falling
  for (let i = 0; i < 200; i++) {
    await wait(2, 'ticks');
    const currentY = armorStand.velocity.y;
    if (!armorStand.isValid() || currentY >= previousY) break;
    previousY = currentY;
    chopIfHit(armorStand.location, Math.abs(currentY));
  }

  // Blade hit ground
  armorStand.world.playSound(
    armorStand.location,
    LAND_SOUND,
    SoundCategory.BLOCKS,
    0.6,
    0.8,
  );
  armorStand.setGravity(false);
  armorStand.setInvulnerable(false);
}

async function chopIfHit(location: Location, y_velocity: number) {
  const entities = location.getNearbyEntities(1, 1.2, 1);
  for (const entity of entities) {
    if (entity.type !== EntityType.PLAYER) return;
    const player = (entity as unknown) as Player;

    if (cooldowns.has(player)) return;
    cooldowns.add(player);

    const eyeLocation = player.eyeLocation;
    playChopEffects(eyeLocation);

    // Deal damage
    if (y_velocity >= DEADLY_CHOP_VELOCITY) player.health = 0;
    else player.damage(VEL_DAMAGE_MODIFIER * y_velocity);

    // Drop head if player died
    if (player.isDead()) {
      const head = new ItemStack(Material.PLAYER_HEAD, 1);
      const meta = head.itemMeta as SkullMeta;
      meta.owningPlayer = player;
      head.itemMeta = meta;
      location.world.dropItem(eyeLocation, head);
    }

    await wait(20, 'ticks');
    cooldowns.delete(player);
  }
}

async function playChopEffects(location: Location) {
  new ParticleBuilder(Particle.BLOCK_DUST)
    .location(location.clone().add(0, 0.5, 0))
    .data(Material.REDSTONE_BLOCK.createBlockData())
    .count(20)
    .spawn();
}

registerEvent(BlockPistonRetractEvent, (event) => {
  const blocks = event.blocks;
  for (const block of blocks) {
    const entities = block.location.add(0, 1, 0).getNearbyEntities(1, 1, 1);
    for (const entity of entities) {
      if (entity.type === EntityType.ARMOR_STAND) {
        const armorStand = entity as ArmorStand;
        dropBlade(armorStand);
      }
    }
  }
});

registerEvent(BlockBreakEvent, (event) => {
  const entities = event.block.location.add(0, 1, 0).getNearbyEntities(1, 1, 1);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorStand = entity as ArmorStand;
      dropBlade(armorStand);
    }
  }
});

registerEvent(PlayerInteractEvent, (event) => {
  if (!isRightClick(event.action)) return;
  if (!event.clickedBlock) return;
  if (event.hand !== EquipmentSlot.HAND) return;

  const item = event.player.inventory.itemInMainHand;
  if (!Blade.check(item)) return;
  const player = event.player;
  const block = event.clickedBlock.getRelative(event.blockFace);
  const groundBlock = block.getRelative(BlockFace.DOWN);
  const loc = groundBlock.location.toCenterLocation().add(0, 0.5, 0);

  if (event.clickedBlock.type.isInteractable() && !player.isSneaking()) return;
  if (block.type !== Material.AIR) return;
  if (groundBlock.type === Material.AIR)
    return player.sendActionBar('Et voi asettaa terää ilmaan.');

  // Prevent placing inside armor stands.
  for (const entity of loc.getNearbyEntities(0.5, 0.5, 0.5)) {
    if (entity.type === EntityType.ARMOR_STAND) return;
  }

  loc.world.playSound(loc, PLACEMENT_SOUND, SoundCategory.BLOCKS, 0.6, 0.8);

  // Prepare armor stand facing
  switch (event.player.facing) {
    case BlockFace.SOUTH:
      loc.yaw = 180;
      break;
    case BlockFace.EAST:
      loc.yaw = 90;
      break;
    case BlockFace.WEST:
      loc.yaw = -90;
      break;
    default:
      loc.yaw = 0;
      break;
  }

  // Spawn armor stand out of sight
  const armorStand = event.player.world.spawnEntity(
    new Location(block.world, 0, -1000, 0),
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  // Set armor stand attributes and teleport to location
  armorStand.setSmall(true);
  armorStand.setInvisible(true);
  armorStand.setGravity(false);
  armorStand.setItem(EquipmentSlot.HEAD, item);
  armorStand.addDisabledSlots(EquipmentSlot.HEAD);
  armorStand.addDisabledSlots(EquipmentSlot.CHEST);
  armorStand.addDisabledSlots(EquipmentSlot.LEGS);
  armorStand.addDisabledSlots(EquipmentSlot.FEET);
  armorStand.addDisabledSlots(EquipmentSlot.HAND);
  armorStand.addDisabledSlots(EquipmentSlot.OFF_HAND);
  armorStand.teleport(loc);
});

registerEvent(EntityDamageEvent, (event) => {
  if (event.entityType !== EntityType.ARMOR_STAND) return;
  const armorStand = event.entity as ArmorStand;
  if (!Blade.check(armorStand.getItem(EquipmentSlot.HEAD))) return;
  event.setCancelled(true);
  const loc = armorStand.location;
  loc.world.playSound(loc, BREAK_SOUND, SoundCategory.BLOCKS, 1, 1);
  armorStand.world.dropItem(armorStand.location, Blade.create({}, 1));
  armorStand.remove();
});
