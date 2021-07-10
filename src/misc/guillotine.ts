import { ParticleBuilder } from 'com.destroystokyo.paper';
import { translate } from 'craftjs-plugin/chat';
import { Location, Material, Particle, SoundCategory } from 'org.bukkit';
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
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';
import { spawnHolderArmorStand } from '../common/entities/armor-stand';
import { isRightClick } from '../common/helpers/click';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { addTranslation, t } from '../common/localization/localization';

const DEADLY_CHOP_VELOCITY = 0.6; // Approx. > 3 block fall kills always.
const VEL_DAMAGE_MODIFIER = 12; // This is multiplied with y_velocity to get smaller drop damage.

const PLACEMENT_SOUND = 'minecraft:block.anvil.place';
const LAND_SOUND = 'minecraft:block.anvil.land';

const cooldowns = new Set<Entity>();

const Blade = new CustomItem({
  id: 5,
  name: translate('vk.guillotine_blade'),
  type: VkItem.UNSTACKABLE,
});

// prettier-ignore
const HEADS = new Map<EntityType, ItemStack>([
  [EntityType.ZOMBIE, new ItemStack(Material.ZOMBIE_HEAD, 1)],
  [EntityType.CREEPER, new ItemStack(Material.CREEPER_HEAD, 1)],
  [EntityType.CREEPER, new ItemStack(Material.CREEPER_HEAD, 1)],
  [EntityType.SKELETON, new ItemStack(Material.SKELETON_SKULL, 1)],
  [EntityType.WITHER_SKELETON, new ItemStack(Material.WITHER_SKELETON_SKULL, 1)],
]);

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
  const entities = location.getNearbyEntities(1, 1.2, 1); // y 1.2 is required for chained player detection
  await wait(4, 'ticks'); // Wait for blade to be over entity
  for (const entity of entities) {
    if (!(entity instanceof LivingEntity)) return;
    if (entity instanceof ArmorStand) return;
    if (entity.isDead()) return; // Head already dropped etc.
    // Set cooldown
    if (cooldowns.has(entity)) return;
    cooldowns.add(entity);

    // Deal damage
    if (y_velocity >= DEADLY_CHOP_VELOCITY) entity.health = 0;
    else entity.damage(VEL_DAMAGE_MODIFIER * y_velocity);

    // Play effects
    const eyeLocation = entity.eyeLocation;
    playChopEffects(eyeLocation);

    // Drop head
    if (entity.isDead()) dropHead(entity, eyeLocation);

    // Delete cooldown
    cooldowns.delete(entity);
  }
}

function dropHead(entity: Entity, loc: Location) {
  let drop: ItemStack | undefined;

  // Get drop from entity
  if (HEADS.has(entity.type)) drop = HEADS.get(entity.type);

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

/**
 * Check if the entity is guillotine blade (armor stand)
 * @param entity Entity to be checked
 */
function isBlade(entity: Entity): entity is ArmorStand {
  if (!(entity instanceof ArmorStand)) return false;
  const helmet = entity.equipment?.getItem(EquipmentSlot.HEAD);
  if (!helmet) return false;
  return Blade.check(helmet);
}

// Drop blade on piston retract
registerEvent(BlockPistonRetractEvent, (event) => {
  const blocks = event.blocks;
  for (const block of blocks) {
    const entities = block.location
      .add(0.5, 1, 0.5)
      .getNearbyEntities(0.5, 1, 0.5);
    for (const entity of entities) {
      if (isBlade(entity)) {
        dropBlade(entity);
      }
    }
  }
});

// Drop blade on block break
registerEvent(BlockBreakEvent, (event) => {
  const entities = event.block.location
    .add(0.5, 1, 0.5)
    .getNearbyEntities(0.5, 1, 0.5);
  for (const entity of entities) {
    if (isBlade(entity)) {
      dropBlade(entity);
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
    return player.sendActionBar(t(player, 'guillotine.cannot_place_air'));

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

  const stand = spawnHolderArmorStand(loc, item);
  stand.setGravity(false);
  item.amount--;
});

addTranslation('guillotine.cannot_place_air', {
  fi_fi: 'Et voi asettaa terää ilmaan',
  en_us: "You can't place the blade in the air",
});
