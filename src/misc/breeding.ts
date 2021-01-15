import { Material, Particle, Sound } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Animals, EntityType, LivingEntity, Tameable } from 'org.bukkit.entity';
import { EntityBreedEvent } from 'org.bukkit.event.entity';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';

const BREED_WATER_LEVEL = 1; // Max 3
const BREED_COMPOST_LEVEL = 4; // Max 8
const BOWL_SEED_AMOUNT = 4;
const SEED_BOWL = Material.DEAD_BRAIN_CORAL_FAN;
const EMPTY_SEED_BOWL = Material.DEAD_TUBE_CORAL_FAN;

/**
 * Supported food sources
 */
const enum FoodSource {
  HAYBALE,
  SEED_BOWL,
  COMPOST,
}

/**
 * Describes type of needed breeding conditions
 */
interface BreedingConditions {
  foodSource: FoodSource;
  breedItem?: Material;
}

const BREEDABLE_ANIMALS = new Map<EntityType, BreedingConditions>();

//  ADD NEW ANIMALS HERE !!!
addBreedableAnimal(EntityType.COW, FoodSource.HAYBALE);
addBreedableAnimal(EntityType.HORSE, FoodSource.HAYBALE, Material.APPLE);
addBreedableAnimal(EntityType.MULE, FoodSource.HAYBALE, Material.APPLE);
addBreedableAnimal(EntityType.DONKEY, FoodSource.HAYBALE, Material.APPLE);
addBreedableAnimal(EntityType.CHICKEN, FoodSource.SEED_BOWL);
addBreedableAnimal(EntityType.PIG, FoodSource.COMPOST);

/**
 * Adds animal to map if key does't exist
 * @param entityType Animal to be added
 * @param source Foodsource needed for breeding
 * @param breedItem Material used for triggering breeding. Defaults to null -> Use vanilla breeding item
 */
function addBreedableAnimal(
  entityType: EntityType,
  source: FoodSource,
  breedItem?: Material,
) {
  if (BREEDABLE_ANIMALS.has(entityType)) return;
  BREEDABLE_ANIMALS.set(entityType, {
    foodSource: source,
    breedItem: breedItem,
  });
}

/**
 * Consumes FoodSource near entity
 * @param entity Breeding entity
 * @returns True: found and consumed FoodSource
 *          False: couldn't find FoodSource
 */
function consumeFood(entity: LivingEntity): boolean {
  // Return false if setting/getting attributes has failed
  const conditions = BREEDABLE_ANIMALS.get(entity.type);
  if (!conditions) return false;

  const foodSource = conditions.foodSource;

  const blocksNearEntity = blocksInRadiusOfEntity(entity, 2);

  // Find a FoodSource block near entity -> Return true after first found and consumed
  for (const block of blocksNearEntity) {
    if (foodSource === FoodSource.SEED_BOWL) {
      if (block.type === SEED_BOWL) {
        block.type = EMPTY_SEED_BOWL;
        const data = block.blockData;
        if (data instanceof Waterlogged) data.setWaterlogged(false);
        block.blockData = data;
        playFeedingEffects(block, Material.WHEAT_SEEDS);
        return true;
      }
    } else if (foodSource === FoodSource.HAYBALE) {
      if (block.type === Material.HAY_BLOCK) {
        block.type = Material.AIR;
        playFeedingEffects(block, Material.HAY_BLOCK);
        return true;
      }
    } else if (foodSource === FoodSource.COMPOST) {
      if (block.type === Material.COMPOSTER) {
        const composterData = block.blockData as Levelled;
        if (composterData.level >= BREED_COMPOST_LEVEL) {
          composterData.level = composterData.level - BREED_COMPOST_LEVEL;
          block.blockData = composterData;
          playFeedingEffects(block, Material.COMPOSTER);
          return true;
        }
      }
    }
  }
  // No FoodSource found -> Return false
  return false;
}

/**
 * Consumes water from cauldron near entity
 * @param entity Breeding entity
 * @returns True: found and consumed water from cauldorn
 *          False: couldn't find cauldron with water
 */
function consumeWater(entity: LivingEntity): boolean {
  const blocksNearEntity = blocksInRadiusOfEntity(entity, 2);

  for (const block of blocksNearEntity) {
    if (block.type === Material.CAULDRON) {
      const cauldronData = block.blockData as Levelled;
      if (cauldronData.level >= BREED_WATER_LEVEL) {
        cauldronData.level = cauldronData.level - BREED_WATER_LEVEL;
        block.blockData = cauldronData;
        playDrinkingEffects(block);
        return true;
      }
    }
  }
  // Couldn't find cauldron with water -> Return false
  return false;
}

/**
 * Plays feeding particles and sound at location of consumed block
 * @param block Block which was consumed
 * @param material Material for particle generation
 */
async function playFeedingEffects(block: Block, material: Material) {
  const location = block.location.add(0.5, 0.8, 0.5);
  const data = new ItemStack(material, 1);

  for (let i = 0; i < 2; i++) {
    location.world.playSound(location, Sound.ENTITY_GENERIC_EAT, 0.5, 1);
    location.world.spawnParticle(
      Particle.ITEM_CRACK,
      location,
      10,
      0,
      0,
      0,
      0.1,
      data,
    );
    await wait(200, 'millis');
  }
}

/**
 * Plays drinking sound and particles at cauldron
 * @param block Cauldron which was drunk from
 */
function playDrinkingEffects(block: Block) {
  const location = block.location.add(0.5, 0.8, 0.5);

  location.world.playSound(location, Sound.ITEM_BUCKET_EMPTY, 0.5, 1);
  location.world.spawnParticle(
    Particle.WATER_SPLASH,
    location,
    10,
    0,
    0,
    0,
    0.1,
  );
}

/**
 * Gets blocks in square radius of entity
 * @param entity Entity at the center point
 * @param radius Amount of blocks to get in any direction from entity
 */
function blocksInRadiusOfEntity(entity: LivingEntity, radius: number): Block[] {
  const blocks: Block[] = [];
  const loc = entity.location;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        blocks.push(loc.block.getRelative(x, y, z));
      }
    }
  }
  return blocks;
}

/**
 * Breed Event
 * Cancel event if animals aren't near food/water source.
 * Food/water sources will be consumed even if one is not found and breeding is cancelled
 */
registerEvent(EntityBreedEvent, (event) => {
  if (!BREEDABLE_ANIMALS.has(event.entityType)) return;

  const baby = event.entity as LivingEntity;
  const mother = event.mother as LivingEntity;

  const isFed = consumeFood(mother);
  const isHydrated = consumeWater(mother);

  if (!isFed || !isHydrated) baby.remove();
});

/**
 * Seed Bowl Interact Event
 * Fill seed bowl if player is holding enough seeds
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  if (!event.item) return;
  if (event.item.type !== Material.WHEAT_SEEDS) return;
  if (event.clickedBlock.type !== EMPTY_SEED_BOWL) return;
  if (event.item.amount < BOWL_SEED_AMOUNT) return;

  const block = event.clickedBlock;
  const item = event.item;

  block.type = SEED_BOWL;
  const data = block.blockData;
  if (data instanceof Waterlogged) data.setWaterlogged(false);
  block.blockData = data;

  item.amount -= BOWL_SEED_AMOUNT;
});

/**
 * Player Feed Breedable Animal Event
 * If animal is rightclicked with custom breedItem, enter Lovemode,
 * use held item and play breeding effects.
 */
registerEvent(PlayerInteractEntityEvent, (event) => {
  if (!BREEDABLE_ANIMALS.has(event.rightClicked.type)) return;

  const animal = event.rightClicked as Animals;
  const item = event.player.itemInHand;

  // Prevent breeding untamed animals like horses and mules
  if (animal instanceof Tameable) {
    const tameable = animal as Tameable;
    if (!tameable.isTamed()) return;
  }

  // Return if breedItem isn't spesified -> Use vanilla breeding mechanics
  const breedItem = BREEDABLE_ANIMALS.get(animal.type)?.breedItem;
  if (!breedItem) return;

  if (item.type !== breedItem) return;

  // Trigger custom breeding
  if (animal.canBreed() && !animal.isLoveMode()) {
    event.setCancelled(true); // Prevent double item removal
    animal.setLoveModeTicks(600);
    animal.world.playSound(animal.location, Sound.ENTITY_HORSE_EAT, 1, 1);
    animal.world.spawnParticle(
      Particle.HEART,
      animal.location.add(0, 1.2, 0),
      6,
      0.4,
      0.5,
      0.4,
    );
    item.amount--;
  }
});
