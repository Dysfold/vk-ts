import { Material, Particle, Sound } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Chicken, Cow, EntityType, LivingEntity, Pig } from 'org.bukkit.entity';
import { EntityBreedEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';

const animalsWithCustomBreeding: EntityType[] = [
  EntityType.COW,
  EntityType.PIG,
  EntityType.CHICKEN,
];

const BREED_WATER_LEVEL = 1; // Max 3
const BREED_COMPOST_LEVEL = 4; // Max 8

const SEED_BOWL = Material.DEAD_BRAIN_CORAL_FAN;
const EMPTY_SEED_BOWL = Material.DEAD_TUBE_CORAL_FAN;

function hasFoodSource(entity: LivingEntity): boolean {
  const blocksNearEntity = blocksInRadiusOfEntity(entity, 2);

  for (const block of blocksNearEntity) {
    if (entity instanceof Chicken) {
      if (block.type === SEED_BOWL) {
        block.setType(EMPTY_SEED_BOWL);
        const data = block.blockData;
        if (data instanceof Waterlogged) data.setWaterlogged(false);
        block.setBlockData(data);
        playFeedingEffects(block, Material.WHEAT_SEEDS);
        return true;
      }
    } else if (entity instanceof Cow) {
      if (block.type === Material.HAY_BLOCK) {
        block.setType(Material.AIR);
        playFeedingEffects(block, Material.HAY_BLOCK);
        return true;
      }
    } else if (entity instanceof Pig) {
      if (block.type === Material.COMPOSTER) {
        const composterData = block.blockData as Levelled;
        if (composterData.level >= BREED_COMPOST_LEVEL) {
          composterData.setLevel(composterData.level - BREED_COMPOST_LEVEL);
          block.setBlockData(composterData);
          playFeedingEffects(block, Material.COMPOSTER);
          return true;
        }
      }
    }
  }

  return false;
}

function hasWaterSource(entity: LivingEntity): boolean {
  const blocksNearEntity = blocksInRadiusOfEntity(entity, 2);
  for (const block of blocksNearEntity) {
    if (block.type === Material.CAULDRON) {
      const cauldronData = block.blockData as Levelled;
      if (cauldronData.level >= BREED_WATER_LEVEL) {
        cauldronData.setLevel(cauldronData.level - BREED_WATER_LEVEL);
        block.setBlockData(cauldronData);
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

  for (let i = 0; i < 4; i++) {
    location.world.playSound(location, Sound.ITEM_BUCKET_EMPTY, 0.5, 1);
    location.world.spawnParticle(
      Particle.WATER_SPLASH,
      location,
      5,
      0,
      0,
      0,
      0.1,
    );
  }
}

registerEvent(EntityBreedEvent, (event) => {
  if (!animalsWithCustomBreeding.includes(event.entityType)) return;

  const baby = event.entity as LivingEntity;
  const mother = event.mother as LivingEntity;

  if (!hasFoodSource(mother) || !hasWaterSource(mother)) baby.remove();
});
