import { Location, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import { ArmorStand, Entity, EntityType, Player } from 'org.bukkit.entity';
import {
  EntityDamageByEntityEvent,
  EntityDeathEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { PlayerInteractAtEntityEvent } from 'org.bukkit.event.player';
import { ChunkUnloadEvent } from 'org.bukkit.event.world';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';
import { EulerAngle } from 'org.bukkit.util';
import { chanceOf, minMax } from '../common/helpers/math';
import { CustomItem } from '../common/items/CustomItem';
import { HIDDEN_MATERIAL } from '../misc/hidden-items';

const BLOOD_MATERIAL = Material.DEAD_BUBBLE_CORAL_FAN;

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
    [DamageCause.MAGIC,                 BodyPoisoned],

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
  armorstand.customName = '' + new Date().getTime(); // Used to calculate the actual age of the corpse
  armorstand.setGravity(false);

  // Move the corpse to ground
  const block = loc.block.getRelative(BlockFace.UP);
  if (block.isPassable()) {
    let i = 0;
    for (i = 0; i < 100; i++) {
      if (!block.getRelative(BlockFace.DOWN, i).isPassable()) break;
    }
    const newLoc = loc.add(0, -i, 0);
    newLoc.y = Math.floor(newLoc.y) + 0.6;
    armorstand.teleport(newLoc);
  }

  // Edit position
  armorstand.headPose = new EulerAngle(4.88, 0, 0);
  armorstand.rightArmPose = new EulerAngle(0.01, 0.01, 0.01);

  const body = getBody(event.entity.lastDamageCause?.cause).create();
  armorstand.setItem(EquipmentSlot.HAND, body);

  const player = event.entity as Player;
  const head = new ItemStack(Material.PLAYER_HEAD);
  const skullMeta = head.itemMeta as SkullMeta;
  skullMeta.owningPlayer = player;
  head.itemMeta = skullMeta;
  armorstand.setItem(EquipmentSlot.HEAD, head);

  spawnBlood(armorstand.eyeLocation);
}

function spawnBlood(location: Location) {
  const center = location.block;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        const block = center.getRelative(dx, dy, dz);
        if (block.type !== Material.AIR) continue;
        if (!block.getRelative(BlockFace.DOWN).type.isOccluding()) continue;

        const distance = block.location.toCenterLocation().distance(location);
        const bloodChance = 1 - minMax(distance, 1, 3);
        if (!chanceOf(bloodChance)) continue;

        // Place the blood block
        block.type = BLOOD_MATERIAL;
        const data = block.blockData as Waterlogged;
        data.setWaterlogged(false);
        block.blockData = data;
      }
    }
  }
}

// Remove drops from corpse
registerEvent(EntityDeathEvent, (event) => {
  if (!isCorpse(event.entity)) return;

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
const CORPSE_MAX_AGE_MILLIS = CORPSE_MAX_AGE_HOURS * 60 * 60 * 1000;
registerEvent(ChunkUnloadEvent, async (event) => {
  for (const entity of event.chunk.entities) {
    if (isCorpse(entity)) {
      const age = getCorpseAge(entity);
      if (age === undefined) {
        entity.remove();
      } else if (age > CORPSE_MAX_AGE_MILLIS) {
        entity.remove();
      }
    }
  }
});

function isCorpse(entity: Entity): entity is ArmorStand {
  if (entity?.type !== EntityType.ARMOR_STAND) return false;
  const armorstand = entity as ArmorStand;
  if (armorstand.getItem(EquipmentSlot.HEAD).type !== Material.PLAYER_HEAD)
    return false;
  if (armorstand.getItem(EquipmentSlot.HAND).type !== HIDDEN_MATERIAL)
    return false;
  return true;
}

// TODO: Add more and better information about the corpse
// Display information about the corpse to the player
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  if (!isCorpse(event.rightClicked)) return;
  const age = getCorpseAge(event.rightClicked);
  if (!age) return;
  const hours = Math.floor(age / 1000 / 60 / 60);

  // TODO: Make the information more abstract
  if (!hours) {
    event.player.sendActionBar('Tämä henkilö on kuollut äskettäin');
  } else {
    event.player.sendActionBar(
      `Ruumis näyttää maanneen tässä jo noin ${hours} tuntia`,
    );
  }
});

function getCorpseAge(armorstand: ArmorStand) {
  if (!armorstand.customName) return undefined;
  const spawnTime = Number.parseInt(armorstand.customName);
  if (isNaN(spawnTime)) return undefined;
  return new Date().getTime() - spawnTime;
}
