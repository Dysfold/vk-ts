import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { ArmorStand, Entity, EntityType, Player } from 'org.bukkit.entity';
import {
  EntityDamageByEntityEvent,
  EntityDeathEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { ChunkUnloadEvent } from 'org.bukkit.event.world';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';
import { EulerAngle } from 'org.bukkit.util';
import { CustomItem } from '../common/items/CustomItem';
import { HIDDEN_MATERIAL } from '../misc/heart-of-the-sea';

const Body = new CustomItem({
  id: 1,
  modelId: 1,
  type: HIDDEN_MATERIAL,
});

const BodyFallen = new CustomItem({
  id: 29,
  modelId: 29,
  type: HIDDEN_MATERIAL,
});

const BodyExploded = new CustomItem({
  id: 30,
  modelId: 30,
  type: HIDDEN_MATERIAL,
});

const BodyBurned = new CustomItem({
  id: 31,
  modelId: 31,
  type: HIDDEN_MATERIAL,
});

const BodyWounded = new CustomItem({
  id: 32,
  modelId: 32,
  type: HIDDEN_MATERIAL,
});

const BodyPoisoned = new CustomItem({
  id: 33,
  modelId: 33,
  type: HIDDEN_MATERIAL,
});

const BodyPierced = new CustomItem({
  id: 34,
  modelId: 34,
  type: HIDDEN_MATERIAL,
});

const BODY_NAME = '#BODY';

// prettier-ignore
const BODIES = new Map([
    // Broken legs
    [DamageCause.FALL,                  BodyFallen],

    // In pieces
    [DamageCause.ENTITY_EXPLOSION,      BodyExploded],
    [DamageCause.BLOCK_EXPLOSION,       BodyExploded],
    
    // Burned body
    [DamageCause.FIRE,                  BodyBurned],
    [DamageCause.HOT_FLOOR,             BodyBurned],
    [DamageCause.FIRE_TICK,             BodyBurned],
    [DamageCause.LAVA,                  BodyBurned],
    [DamageCause.LIGHTNING,             BodyBurned],

    // Wounded body
    [DamageCause.ENTITY_ATTACK,         BodyWounded],
    [DamageCause.ENTITY_SWEEP_ATTACK,   BodyWounded],

    // Green body
    [DamageCause.POISON,                BodyPoisoned],

    // Holes in the body
    [DamageCause.PROJECTILE,            BodyPierced]
])

function getBody(cause: DamageCause | undefined) {
  if (!cause) return Body;
  return BODIES.get(cause) || Body;
}

export async function spawnCorpse(event: PlayerDeathEvent) {
  const loc = event.entity.location.subtract(0, 1.4, 0);
  const armorstand = loc.world.spawnEntity(
    loc,
    EntityType.ARMOR_STAND,
    SpawnReason.CUSTOM,
  ) as ArmorStand;
  armorstand.setSilent(true);
  armorstand.setInvisible(true);
  armorstand.setArms(true);
  armorstand.setCustomNameVisible(false);
  armorstand.addDisabledSlots(...EquipmentSlot.values());
  armorstand.customName = BODY_NAME;
  armorstand.setGravity(false);

  // Move the corpse to ground
  const block = loc.block;
  if (block.isPassable()) {
    let i = 0;
    for (i = 0; i < 100; i++) {
      if (!block.getRelative(BlockFace.DOWN, i).isPassable()) break;
    }
    const newLoc = loc.add(0, -i, 0);
    newLoc.y = Math.floor(newLoc.y) - 0.4;
    armorstand.teleport(newLoc);
  }

  // Edit position
  armorstand.headPose = new EulerAngle(4.88, 0, 0);
  armorstand.rightArmPose = new EulerAngle(0, 0, 0);

  const body = getBody(event.entity.lastDamageCause?.cause).create();
  armorstand.setItem(EquipmentSlot.HAND, body);

  const player = event.entity as Player;
  const head = new ItemStack(Material.PLAYER_HEAD);
  const skullMeta = head.itemMeta as SkullMeta;
  skullMeta.owningPlayer = player;
  head.itemMeta = skullMeta;
  armorstand.setItem(EquipmentSlot.HEAD, head);
}

// Remove drops from corpse
registerEvent(EntityDeathEvent, (event) => {
  if (event.entity.type !== EntityType.ARMOR_STAND) return;
  const armorstand = event.entity;
  if (armorstand.customName !== BODY_NAME) return;

  // The armorstand was a corpse
  event.setShouldPlayDeathSound(false);
  event.setCancelled(true);
  event.entity.remove();
});

// Destroy armorstands by clicking
registerEvent(EntityDamageByEntityEvent, (event) => {
  if (!isCorpse(event.entity)) return;
  const armorstand = event.entity as ArmorStand;
  armorstand.world.dropItemNaturally(
    armorstand.eyeLocation,
    new ItemStack(Material.BONE),
  );
  armorstand.remove();
});

// Kill old armorstands when the chunk unloads
const CORPSE_MAX_AGE_HOURS = 24;
const CORPSE_MAX_AGE_TICKS = CORPSE_MAX_AGE_HOURS * 60 * 60 * 20;
registerEvent(ChunkUnloadEvent, async (event) => {
  for (const entity of event.chunk.entities) {
    if (isCorpse(entity)) {
      if (entity.ticksLived > CORPSE_MAX_AGE_TICKS) entity.remove();
    }
  }
});

function isCorpse(entity: Entity) {
  if (entity?.type !== EntityType.ARMOR_STAND) return false;
  const armorstand = entity as ArmorStand;
  if (armorstand.getItem(EquipmentSlot.HEAD).type !== Material.PLAYER_HEAD)
    return false;
  if (armorstand.getItem(EquipmentSlot.HAND).type !== HIDDEN_MATERIAL)
    return false;
  return true;
}
