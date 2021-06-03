import { Biome, BlockFace } from 'org.bukkit.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { PotionMeta } from 'org.bukkit.inventory.meta';
import { PotionData, PotionType } from 'org.bukkit.potion';

export type WaterQuality = 'CLEAR' | 'DIRTY' | 'SALTY' | 'NORMAL';

const WATER_POTION_DATAS = new Map<WaterQuality, PotionData>([
  ['CLEAR', new PotionData(PotionType.MUNDANE)],
  ['DIRTY', new PotionData(PotionType.THICK)],
  ['SALTY', new PotionData(PotionType.AWKWARD)],
  ['NORMAL', new PotionData(PotionType.WATER)],
]);
const POTION_TYPE_QUALITIES = new Map<PotionType, WaterQuality>([
  [PotionType.MUNDANE, 'CLEAR'],
  [PotionType.THICK, 'DIRTY'],
  [PotionType.AWKWARD, 'SALTY'],
  [PotionType.WATER, 'NORMAL'],
]);
const DEFAULT = new PotionData(PotionType.WATER);

// prettier-ignore
const BIOME_QUALITIES = new Map<Biome, WaterQuality>([
  [Biome.OCEAN,                 'SALTY'],
  [Biome.DEEP_OCEAN,            'SALTY'],
  [Biome.COLD_OCEAN,            'SALTY'],
  [Biome.DEEP_COLD_OCEAN,       'SALTY'],
  [Biome.FROZEN_OCEAN,          'SALTY'],
  [Biome.DEEP_FROZEN_OCEAN,     'SALTY'],
  [Biome.LUKEWARM_OCEAN,        'SALTY'],
  [Biome.DEEP_LUKEWARM_OCEAN,   'SALTY'],
  [Biome.WARM_OCEAN,            'SALTY'],
  [Biome.DEEP_WARM_OCEAN,       'SALTY'],

  [Biome.SNOWY_MOUNTAINS,       'CLEAR'],
  [Biome.MOUNTAINS,             'CLEAR'],
]);

// Minimum height for clear water quality in specific biomes, such as Mountains
const CLEAR_WATER_HEIGHT = 110;

const DIRECTIONS = [
  BlockFace.NORTH,
  BlockFace.EAST,
  BlockFace.SOUTH,
  BlockFace.WEST,
];

const QUALITY_NAMES = new Map<WaterQuality, string>([
  ['SALTY', 'suolainen'],
  ['DIRTY', 'likainen'],
  ['NORMAL', 'normaali'],
  ['CLEAR', 'kirkas'],
]);
export function getQualityName(quality: WaterQuality) {
  return QUALITY_NAMES.get(quality) || 'normaali';
}

export function canFillCauldron(item: ItemStack) {
  const meta = item.itemMeta;
  if (!(meta instanceof PotionMeta)) return false;
  const type = meta.basePotionData.type;
  const quality = POTION_TYPE_QUALITIES.get(type);
  return quality === 'CLEAR' || quality === 'NORMAL';
}

export function getPotionData(quality: WaterQuality) {
  return WATER_POTION_DATAS.get(quality) || DEFAULT;
}

export function getWaterQuality(event: PlayerInteractEvent) {
  const block =
    event.clickedBlock ||
    event.player.getTargetBlock(6) ||
    event.player.location.block;

  let quality = BIOME_QUALITIES.get(block.biome);

  // Get nearby blocks and check for biomes,
  // because the block might not be in the ocean biome,
  // but can still be visually part of the ocean
  if (!quality) {
    for (const direction of DIRECTIONS) {
      const relative = block.getRelative(direction, 8);
      quality = BIOME_QUALITIES.get(relative.biome);
      if (quality) break;
    }
  }
  // Additional check if the clear water is on top of the mountains
  if (quality === 'CLEAR' && block.y < CLEAR_WATER_HEIGHT) quality = 'DIRTY';

  // Defaul fallback for water quality
  if (!quality) quality = 'DIRTY';

  return quality;
}

export function getPotionQuality(item: ItemStack): WaterQuality {
  const meta = item.itemMeta;
  if (!(meta instanceof PotionMeta)) return 'NORMAL';
  const type = meta.basePotionData.type;
  const quality = POTION_TYPE_QUALITIES.get(type);
  return quality || 'NORMAL';
}
