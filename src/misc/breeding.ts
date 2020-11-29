import { Material, Particle, Sound } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Chicken, Cow, EntityType, LivingEntity, Pig } from 'org.bukkit.entity';
import { EntityBreedEvent } from 'org.bukkit.event.entity';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';

const ANIMALS_WITH_CUSTOM_BREEDING: EntityType[] = [
  EntityType.COW,
  EntityType.PIG,
  EntityType.CHICKEN,
];

const BREED_WATER_LEVEL = 1; // Max 3
const BREED_COMPOST_LEVEL = 4; // Max 8
const BOWL_SEED_AMOUNT = 4;

const SEED_BOWL = Material.DEAD_BRAIN_CORAL_FAN;
const EMPTY_SEED_BOWL = Material.DEAD_TUBE_CORAL_FAN;

// Returns true if successfull
function consumeFood(entity: LivingEntity): boolean {
  const blocksNearEntity = blocksInRadiusOfEntity(entity, 2);

  for (const block of blocksNearEntity) {
    if (entity instanceof Chicken) {
      if (block.type === SEED_BOWL) {
        block.type = EMPTY_SEED_BOWL;
        const data = block.blockData;
        if (data instanceof Waterlogged) data.setWaterlogged(false);
        block.blockData = data;
        playFeedingEffects(block, Material.WHEAT_SEEDS);
        return true;
      }
    } else if (entity instanceof Cow) {
      if (block.type === Material.HAY_BLOCK) {
        block.type = Material.AIR;
        playFeedingEffects(block, Material.HAY_BLOCK);
        return true;
      }
    } else if (entity instanceof Pig) {
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

  return false;
}

// Returns true if successfull
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
  return false;
}

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

registerEvent(EntityBreedEvent, (event) => {
  if (!ANIMALS_WITH_CUSTOM_BREEDING.includes(event.entityType)) return;

  const baby = event.entity as LivingEntity;
  const mother = event.mother as LivingEntity;

  const isFed = consumeFood(mother);
  const isHydrated = consumeWater(mother);

  if (!isFed || !isHydrated) baby.remove();
});

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
