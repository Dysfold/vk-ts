import { Material, Sound, Location, Particle } from 'org.bukkit';
import { EntityType, LivingEntity, Player } from 'org.bukkit.entity';
import { BlockBreakEvent } from 'org.bukkit.event.block';
import {
  EntityDamageByEntityEvent,
  EntityDeathEvent,
  EntityPickupItemEvent,
  EntityRegainHealthEvent,
  ItemDespawnEvent,
} from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { PotionEffect, PotionEffectType } from 'org.bukkit.potion';
import { Vector } from 'org.bukkit.util';
import { CustomItem } from '../common/items/CustomItem';
import { LootDrop, generateLoot } from '../common/items/drops';
import { VkItem } from '../common/items/VkItem';

const MIN_BODY_HITS = 3;
const MAX_BODY_HITS = 6;
const CORPSE_NAME = 'Dinnerbone';

const slaughterableAnimals = new Map<string, Array<LootDrop<undefined>>>();
const slaughterTools = new Set([VkItem.SWORD, Material.IRON_AXE]);
const slaugtherSound = Sound.BLOCK_SLIME_BLOCK_STEP;

const Namehider = new CustomItem({
  id: 15,
  name: 'Namehider',
  type: Material.HEART_OF_THE_SEA,
  modelId: 15,
});

const nameHiderItem = Namehider.create();

addSlaughterableAnimal(EntityType.COW, [
  { item: Material.LEATHER, rarity: 0.3, count: 1 },
  { item: Material.BEEF, rarity: 0.5, count: 1 },
  { item: Material.BONE, rarity: 0.2, count: 1 },
]);

addSlaughterableAnimal(EntityType.PIG, [
  { item: Material.PORKCHOP, rarity: 0.5, count: 1 },
  { item: Material.BONE, rarity: 0.2, count: 1 },
]);

addSlaughterableAnimal(EntityType.CHICKEN, [
  { item: Material.CHICKEN, rarity: 0.6, count: 1 },
  { item: Material.FEATHER, rarity: 0.8, count: 1 },
]);

/**
 * Applies new animal to slaughterable map if it isn't already a key
 * @param entityType Animal which will be slaughterable
 * @param drops Animal drops
 */
function addSlaughterableAnimal(
  entityType: EntityType,
  drops: LootDrop<any>[],
) {
  if (slaughterableAnimals.has(entityType.toString())) return;
  slaughterableAnimals.set(entityType.toString(), drops);
}

/**
 * Returns list of animal drops based on entity type after each
 * hit on animal corpse.
 * @param entityType EntityType to determine drops
 */
function getAnimalDrops(entityType: EntityType): ItemStack[] {
  let drops: ItemStack[] = [];
  const dropsFromMap = slaughterableAnimals.get(entityType.toString());
  if (dropsFromMap) drops = generateLoot(undefined, dropsFromMap);
  return drops;
}

/**
 * Turns LivingEntity into animal corpse
 * @param entity LivingEntity which will be turned into animal corpse
 */
function createAnimalCorpse(entity: LivingEntity) {
  entity.setAI(false);
  entity.customName = CORPSE_NAME;
  entity.setSilent(true);
  // Add dropped item as passenger to hide nametag
  if (entity.passenger === null) {
    const nameHider = entity.world.dropItemNaturally(
      entity.location,
      nameHiderItem,
    );
    nameHider.setCanMobPickup(false);
    nameHider.pickupDelay = 1000000;
    entity.passenger = nameHider;
  }
  // Set animal health to match hit amount
  const hitsToRemove = randomInt(
    MIN_BODY_HITS <= entity.maxHealth ? MIN_BODY_HITS : entity.maxHealth,
    MAX_BODY_HITS <= entity.maxHealth ? MAX_BODY_HITS : entity.maxHealth,
  );
  entity.health = hitsToRemove;
  dropBodyUntilOnGround(entity);
}

/**
 * Drops animal loot after each hit
 * @param entity Animal corpse
 */
function handleDrops(entity: LivingEntity) {
  const drops = getAnimalDrops(entity.type);
  for (const item of drops) {
    entity.world.dropItemNaturally(entity.location, item);
  }
}

/**
 * Adds downwards velocity to entity until it hits the ground.
 * @param entity Entity to be dropped to the ground
 */
async function dropBodyUntilOnGround(entity: LivingEntity) {
  let previousY = entity.location.y;
  let firstLoop = true;
  entity.setAI(true);
  while (
    entity.health > 0 &&
    (firstLoop ? true : entity.location.y < previousY)
  ) {
    //console.log('FALL LOOP x1'); <-- UNCOMMENT for loop checks
    firstLoop = false;
    previousY = entity.location.y;
    // Adding velocity for smoother falling (Chicken fall slowly without)
    const pos: Vector = entity.location.toVector();
    const target: Vector = entity.location.add(0, -8, 0).toVector();
    const vel: Vector = target.subtract(pos);
    entity.velocity = vel.normalize();
    await wait(100, 'millis');
  }
  entity.setAI(false);
}

/**
 * Plays slaughter sound and particle effects
 * @param location Effect location
 */
function playSlaughterEffects(location: Location) {
  location.world.playSound(location, slaugtherSound, 0.5, 1);
  const blockData = Material.REDSTONE_BLOCK.createBlockData();
  location.world.spawnParticle(
    Particle.BLOCK_DUST,
    location.add(0, 0.5, 0),
    30,
    blockData,
  );
}

/**
 * Returns random integer between min and max limits
 * @param min Bottom limit
 * @param max Top limit
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Clear normal drops and remove body when slaughterable animal dies
registerEvent(EntityDeathEvent, (event) => {
  if (!slaughterableAnimals.has(event.entity.type.toString())) return;

  event.drops.length = 0;
  event.entity.customName = '';
  if (event.entity.passenger) event.entity.passenger.remove();
});

// Prevent animal bodies from healing
registerEvent(EntityRegainHealthEvent, (event) => {
  if (
    slaughterableAnimals.has(event.entity.type.toString()) &&
    event.entity.customName === CORPSE_NAME
  ) {
    event.setCancelled(true);
  }
});

// Drop animal corpse to the ground if blocks are broken below
registerEvent(BlockBreakEvent, (event) => {
  const location = event.block.location;
  for (const entity of location.add(0, 1, 0).getNearbyLivingEntities(1)) {
    if (
      slaughterableAnimals.has(String(entity.type)) &&
      entity.customName === CORPSE_NAME
    ) {
      // Prevent small movement before function call with slowness effect
      const slow = new PotionEffect(
        PotionEffectType.SLOW,
        100,
        1000,
        false,
        false,
      );
      entity.addPotionEffect(slow);
      setTimeout(() => {
        dropBodyUntilOnGround(entity);
      }, 50);
    }
  }
});

registerEvent(EntityDamageByEntityEvent, (event) => {
  if (!(event.damager instanceof Player)) return;
  if (!slaughterableAnimals.has(event.entity.type.toString())) return;

  const entity = event.entity as LivingEntity;
  const player = event.damager as Player;

  if (entity.health <= event.damage && entity.customName !== CORPSE_NAME) {
    event.damage = 0;
    createAnimalCorpse(entity);
  } else if (entity.customName === CORPSE_NAME) {
    event.damage = 1;
    if (slaughterTools.has(player.itemInHand.type)) handleDrops(entity);
    playSlaughterEffects(entity.location);
  }
});

// Prevent pickup of nameHiders riding entity
registerEvent(EntityPickupItemEvent, (event) => {
  if (event.item.itemStack.type === nameHiderItem.type && event.item.vehicle) {
    event.setCancelled(true);
    event.item.pickupDelay = 1000000;
  }
});

// Remove animal corpse on namehider despawn
registerEvent(ItemDespawnEvent, (event) => {
  if (!(event.entity instanceof ItemStack)) return;
  const itemStack = event.entity as ItemStack;
  if (itemStack.type == nameHiderItem.type && event.entity.vehicle)
    event.entity.vehicle.remove();
});
