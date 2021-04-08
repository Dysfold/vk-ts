import { ParticleBuilder } from 'com.destroystokyo.paper';
import { translate } from 'craftjs-plugin/chat';
import { Location, Material, Particle, Sound, SoundCategory } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import {
  ArmorStand,
  Entity,
  EntityType,
  LivingEntity,
  Player,
} from 'org.bukkit.entity';
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

const cooldowns = new Set<Entity>();
const drops = new Map<string, ItemStack>();

const Blade = new CustomItem({
  id: 5,
  name: translate('vk.golden_horn'),
  type: VkItem.UNSTACKABLE,
});

// DECLARE HEAD DROPS HERE ( for other entities than player)
addDrop(EntityType.ZOMBIE, new ItemStack(Material.ZOMBIE_HEAD, 1));
addDrop(EntityType.CREEPER, new ItemStack(Material.CREEPER_HEAD, 1));
addDrop(EntityType.CREEPER, new ItemStack(Material.CREEPER_HEAD, 1));
addDrop(EntityType.SKELETON, new ItemStack(Material.SKELETON_SKULL, 1));
addDrop(
  EntityType.WITHER_SKELETON,
  new ItemStack(Material.WITHER_SKELETON_SKULL, 1),
);

function addDrop(entityType: EntityType, drop: ItemStack) {
  if (drops.has(entityType.toString())) return;
  drops.set(entityType.toString(), drop);
}

async function dropBlade(armorStand: ArmorStand) {
  if (armorStand.hasGravity()) return; // Has gravity -> Blade already falling.
  // Begin drop
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
    if (!(entity instanceof LivingEntity)) return;
    if (entity instanceof ArmorStand) return;
    // Set cooldown
    if (cooldowns.has(entity)) return;
    cooldowns.add(entity);

    // Wait for better timing
    await wait(4, 'ticks');

    // Deal damage
    if (y_velocity >= DEADLY_CHOP_VELOCITY) entity.health = 0;
    else entity.damage(VEL_DAMAGE_MODIFIER * y_velocity);

    // Play effects
    const eyeLocation = entity.eyeLocation;
    playChopEffects(eyeLocation);

    // Drop head
    if (entity.isDead()) dropHead(entity, eyeLocation);

    // Delete cooldown
    await wait(20, 'ticks');
    cooldowns.delete(entity);
  }
}

function dropHead(entity: Entity, loc: Location) {
  let drop: ItemStack | undefined;

  // Get drop from entity
  const key = entity.type.toString();
  if (drops.has(key)) drop = drops.get(key);

  // Get player head drop
  if (entity instanceof Player) {
    const player = entity as Player;
    drop = new ItemStack(Material.PLAYER_HEAD, 1);
    const meta = drop.itemMeta as SkullMeta;
    meta.owningPlayer = player;
    drop.itemMeta = meta;
  }
  if (drop) loc.world.dropItem(loc, drop);
}

async function playChopEffects(location: Location) {
  new ParticleBuilder(Particle.BLOCK_DUST)
    .location(location.clone().add(0, 0.5, 0))
    .data(Material.REDSTONE_BLOCK.createBlockData())
    .count(20)
    .spawn();
}

// Drop blade on piston retract
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

// Drop blade on block break
registerEvent(BlockBreakEvent, (event) => {
  const entities = event.block.location.add(0, 1, 0).getNearbyEntities(1, 1, 1);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorStand = entity as ArmorStand;
      dropBlade(armorStand);
    }
  }
});

// Place blade on block
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

  // Prevent placing inside entities
  const entities = loc.getNearbyEntities(0.5, 0.5, 0.5);
  if (!entities.isEmpty()) return;

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

  item.amount--;
});

// Destroy blade
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
