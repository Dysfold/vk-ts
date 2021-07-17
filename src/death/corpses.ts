import { color, text } from 'craftjs-plugin/chat';
import { NamedTextColor } from 'net.kyori.adventure.text.format';
import { Bukkit, Location, Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Waterlogged } from 'org.bukkit.block.data';
import { ArmorStand, Entity, EntityType, Player } from 'org.bukkit.entity';
import {
  EntityDamageByEntityEvent,
  PlayerDeathEvent,
} from 'org.bukkit.event.entity';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { DamageCause } from 'org.bukkit.event.entity.EntityDamageEvent';
import { PlayerInteractAtEntityEvent } from 'org.bukkit.event.player';
import { ChunkUnloadEvent } from 'org.bukkit.event.world';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';
import { EulerAngle } from 'org.bukkit.util';
import * as yup from 'yup';
import { dataType } from '../common/datas/holder';
import { dataView } from '../common/datas/view';
import { chanceOf, minMax } from '../common/helpers/math';
import { CustomItem } from '../common/items/CustomItem';
import { VkMaterial } from '../common/items/VkMaterial';
import { addTranslation, t } from '../common/localization/localization';
import { HIDDEN_MATERIAL, makeItemHidden } from '../misc/hidden-items';

const CorpseData = dataType('corpse-data', {
  deathTime: yup.number(),
});

const Body = new CustomItem({
  id: 1,
  type: HIDDEN_MATERIAL,
});

const BodyFallen = new CustomItem({
  id: 29,
  type: HIDDEN_MATERIAL,
});

const BodyExploded = new CustomItem({
  id: 30,
  type: HIDDEN_MATERIAL,
});

const BodyBurned = new CustomItem({
  id: 31,
  type: HIDDEN_MATERIAL,
});

const BodyWounded = new CustomItem({
  id: 32,
  type: HIDDEN_MATERIAL,
});

const BodyPoisoned = new CustomItem({
  id: 33,
  type: HIDDEN_MATERIAL,
});

const BodyPierced = new CustomItem({
  id: 34,
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
  setCorpseDeathTime(armorstand);
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

  const body = getBody(event.entity.lastDamageCause?.cause).create({});

  const player = event.entity as Player;
  const head = new ItemStack(Material.PLAYER_HEAD);
  const skullMeta = head.itemMeta as SkullMeta;
  skullMeta.owningPlayer = player;
  head.itemMeta = skullMeta;

  // Set "body" and head items and make them not drop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const equipment = armorstand.equipment!;
  equipment.itemInMainHand = makeItemHidden(body);
  equipment.helmet = makeItemHidden(head);

  spawnBlood(armorstand.eyeLocation);
}

// TODO: Remove this and use spawnBlood function from misc/bleeding, when implemented
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
        block.type = VkMaterial.BLOOD;
        const data = block.blockData as Waterlogged;
        data.setWaterlogged(false);
        block.blockData = data;
      }
    }
  }
}

// Drop bones when corpses are destroyed
registerEvent(EntityDamageByEntityEvent, (event) => {
  if (!isCorpse(event.entity)) return;
  const armorstand = event.entity as ArmorStand;
  armorstand.world.dropItemNaturally(
    armorstand.eyeLocation,
    new ItemStack(Material.BONE),
  );
});

// Kill old armorstands when the chunk unloads
const CORPSE_MAX_AGE_HOURS = 24;
const CORPSE_MAX_AGE_MILLIS = CORPSE_MAX_AGE_HOURS * 60 * 60 * 1000;
registerEvent(ChunkUnloadEvent, async (event) => {
  for (const entity of event.chunk.entities) {
    if (isCorpse(entity)) {
      tryDespawnCorpse(entity);
    }
  }
});

// Remove old corpses (Some chunks might never unload so this is the only way to despawn)
// We dont need to despawn those armorstands that often, so long delay is ok
const DESPAWN_INTERVAL_HOURS = 3;
setInterval(() => {
  checkAllCorpsesForDespawning();
}, DESPAWN_INTERVAL_HOURS * 60 * 60 * 1000);

function checkAllCorpsesForDespawning() {
  for (const world of Bukkit.server.worlds) {
    for (const entity of world.getEntitiesByClass(ArmorStand)) {
      if (isCorpse(entity as Entity)) {
        tryDespawnCorpse(entity as ArmorStand);
      }
    }
  }
}

function tryDespawnCorpse(corpse: ArmorStand) {
  const age = getCorpseAgeMillis(corpse);
  if (age === undefined) {
    corpse.remove();
  } else if (age > CORPSE_MAX_AGE_MILLIS) {
    corpse.remove();
  }
}

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
  const ageMillis = getCorpseAgeMillis(event.rightClicked);
  if (!ageMillis) return;
  const hours = Math.round(ageMillis / 1000 / 60 / 60);
  const player = event.player;

  // TODO: Make the information more abstract
  if (!hours) {
    sendCorpseInfo(player, t(player, 'corpses.died_recently'));
  } else {
    sendCorpseInfo(player, t(player, 'corpses.died_hours_ago', hours));
  }
});

function sendCorpseInfo(player: Player, msg: string) {
  player.sendActionBar(color(NamedTextColor.YELLOW, text(msg)));
}

function getCorpseAgeMillis(armorstand: ArmorStand) {
  const { deathTime } = dataView(CorpseData, armorstand);
  if (deathTime == undefined) return;
  return new Date().getTime() - deathTime;
}

function setCorpseDeathTime(armorstand: ArmorStand) {
  const view = dataView(CorpseData, armorstand);
  view.deathTime = new Date().getTime();
}

// Despawn old armodstands on refresh
checkAllCorpsesForDespawning();

addTranslation('corpses.died_recently', {
  fi_fi: 'Tämä henkilö on kuollut äskettäin',
  en_us: 'This person has died recently',
});

addTranslation('corpses.died_hours_ago', {
  fi_fi: 'Ruumis näyttää maanneen tässä noin %s tuntia',
  en_us: 'This corpse has been lying here about %s hours',
});
