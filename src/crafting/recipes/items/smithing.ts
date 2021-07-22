import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import {
  Hammer,
  HotIronBar,
  HotIronBlade,
  HotIronIngot,
  HotIronNugget,
  HotIronPlate,
  HotIronStick,
  Pliers,
} from '../../../blacksmith/blacksmith';
import { makeDamaged } from '../../../blacksmith/damaged-tools';
import {
  GladiusPart,
  GlaivePart,
  HammerPart,
  HandSawPart,
  IronAxePart,
  IronHoePart,
  IronPickaxePart,
  IronShovelPart,
  IronSwordPart,
  JungleKnifePart,
  KatanaPart,
  KnifePart,
  LongswordPart,
  RapierPart,
  SaberPart,
  ScythePart,
  SicklePart,
  SpearPart,
  WarAxePart,
  WarHammerPart,
} from '../../../blacksmith/metal-parts';
import { HeaterShield, RoundShield } from '../../../blacksmith/shields';
import {
  Gladius,
  Glaive,
  JungleKnife,
  Katana,
  Knife,
  Longsword,
  Rapier,
  Saber,
  WalkingStickSword,
} from '../../../blacksmith/swords';
import { Spear, WarAxe, WarHammer } from '../../../blacksmith/tools';
import { Handcuffs } from '../../../combat/handcuffs';
import { Shuriken } from '../../../combat/shuriken';
import { VkMaterial } from '../../../common/items/VkMaterial';
import { Scythe, Sickle } from '../../../farming/harvesting';
import { Key } from '../../../locks/keys/key';
import { createLockItem } from '../../../locks/locks/lock-items';
import { Picklock } from '../../../locks/picking/Lockpick';
import { GuillotineBlade } from '../../../misc/guillotine';
import { HandSaw } from '../../../misc/saw';
import { PLANKS, COBBLESTONE_LIKE } from '../../utilities/choices';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

const HOT_IRON_BAR = HotIronBar.create({});
const HOT_IRON_BLADE = HotIronBlade.create({});
const HOT_IRON_NUGGET = HotIronNugget.create({});
const HOT_IRON_INGOT = HotIronIngot.create({});
const HOT_IRON_PLATE = HotIronPlate.create({});
const HOT_IRON_STICK = HotIronStick.create({});

// Gladius
shapedRecipe({
  key: 'gladius_part',
  shape: ['B ', ' B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: GladiusPart.create({}),
});
shapelessRecipe({
  key: 'gladius',
  ingredients: [GladiusPart.create({}), Material.STICK],
  result: makeDamaged(Gladius.create({})),
});

// Glaive
shapedRecipe({
  key: 'glaive_part',
  shape: [' B', ' B', 'NB'],
  ingredients: {
    N: HOT_IRON_NUGGET,
    B: HOT_IRON_BLADE,
  },
  result: GlaivePart.create({}),
});
shapelessRecipe({
  key: 'glaive',
  ingredients: [GlaivePart.create({}), Material.STICK],
  result: makeDamaged(Glaive.create({})),
});

// Hammer
shapedRecipe({
  key: 'hammer_part',
  shape: ['B'],
  ingredients: {
    B: HOT_IRON_BAR,
  },
  result: HammerPart.create({}),
});
shapelessRecipe({
  key: 'hammer',
  ingredients: [HammerPart.create({}), Material.STICK],
  result: Hammer.create({}),
});

// HandSaw
shapedRecipe({
  key: 'hand_saw_part',
  shape: ['NB', 'NB', 'NB'],
  ingredients: {
    B: HOT_IRON_PLATE,
    N: HOT_IRON_NUGGET,
  },
  result: HandSawPart.create({}),
});
shapelessRecipe({
  key: 'hand_saw',
  ingredients: [HandSawPart.create({}), PLANKS],
  result: HandSaw.create({}),
});

// JungleKnife
shapedRecipe({
  key: 'jungle_knife_part',
  shape: ['  B', ' B ', ' N '],
  ingredients: {
    B: HOT_IRON_BLADE,
    N: HOT_IRON_NUGGET,
  },
  result: JungleKnifePart.create({}),
});
shapelessRecipe({
  key: 'jungle_knife',
  ingredients: [JungleKnifePart.create({}), Material.STICK],
  result: makeDamaged(JungleKnife.create({})),
});

// Katana
shapedRecipe({
  key: 'katana_part',
  shape: ['B', 'B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: KatanaPart.create({}),
});
shapelessRecipe({
  key: 'katana',
  ingredients: [KatanaPart.create({}), Material.STICK],
  result: makeDamaged(Katana.create({})),
});

// Knife
shapedRecipe({
  key: 'knife_part',
  shape: ['B', 'B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: KnifePart.create({}),
});
shapelessRecipe({
  key: 'knife',
  ingredients: [KnifePart.create({}), Material.STICK],
  result: makeDamaged(Knife.create({})),
});

// LongSword
shapedRecipe({
  key: 'long_sword_part',
  shape: ['B', 'B'],
  ingredients: {
    B: HOT_IRON_STICK,
  },
  result: LongswordPart.create({}),
});
shapelessRecipe({
  key: 'long_sword',
  ingredients: [LongswordPart.create({}), Material.STICK],
  result: makeDamaged(Longsword.create({})),
});

// Rapier
shapedRecipe({
  key: 'rapier_part',
  shape: ['B', 'B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: RapierPart.create({}),
});
shapelessRecipe({
  key: 'rapier',
  ingredients: [RapierPart.create({}), Material.STICK],
  result: makeDamaged(Rapier.create({})),
});

// Saber
shapedRecipe({
  key: 'saber_part',
  shape: [' BB', 'B  '],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: SaberPart.create({}),
});
shapelessRecipe({
  key: 'saber',
  ingredients: [SaberPart.create({}), Material.STICK],
  result: makeDamaged(Saber.create({})),
});

// Scythe
shapedRecipe({
  key: 'scythe_part',
  shape: ['BB ', '  S'],
  ingredients: {
    B: HOT_IRON_BLADE,
    S: HOT_IRON_STICK,
  },
  result: ScythePart.create({}),
});
shapelessRecipe({
  key: 'scythe',
  ingredients: [ScythePart.create({}), Material.STICK],
  result: makeDamaged(Scythe.create({})),
});

// Sickle
shapedRecipe({
  key: 'sickle_part',
  shape: ['BB ', '  S'],
  ingredients: {
    B: HOT_IRON_BLADE,
    S: HOT_IRON_STICK,
  },
  result: SicklePart.create({}),
});
shapelessRecipe({
  key: 'sickle',
  ingredients: [SicklePart.create({}), Material.STICK],
  result: makeDamaged(Sickle.create({})),
});

// Spear
shapedRecipe({
  key: 'spear_part',
  shape: ['B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: SpearPart.create({}),
});
shapelessRecipe({
  key: 'spear',
  ingredients: [SpearPart.create({}), Material.STICK, Material.STICK],
  result: makeDamaged(Spear.create({})),
});

// WarAxe
shapedRecipe({
  key: 'war_axe_part',
  shape: ['PBP', 'P P'],
  ingredients: {
    B: HOT_IRON_BAR,
    P: HOT_IRON_PLATE,
  },
  result: WarAxePart.create({}),
});
shapelessRecipe({
  key: 'war_axe',
  ingredients: [WarAxePart.create({}), Material.STICK],
  result: makeDamaged(WarAxe.create({})),
});

// IronAxe
shapedRecipe({
  key: 'iron_axe_part',
  shape: ['PB', 'P '],
  ingredients: {
    B: HOT_IRON_BAR,
    P: HOT_IRON_PLATE,
  },
  result: IronAxePart.create({}),
});
shapelessRecipe({
  key: 'iron_axe',
  ingredients: [IronAxePart.create({}), Material.STICK],
  result: makeDamaged(Material.IRON_AXE),
});

// IronHoe
shapedRecipe({
  key: 'iron_hoe_part',
  shape: ['BB'],
  ingredients: {
    B: HOT_IRON_BAR,
  },
  result: IronHoePart.create({}),
});
shapelessRecipe({
  key: 'iron_hoe',
  ingredients: [IronHoePart.create({}), Material.STICK],
  result: makeDamaged(Material.IRON_HOE),
});

// IronPickaxe
shapedRecipe({
  key: 'iron_pickaxe_part',
  shape: ['BBB'],
  ingredients: {
    B: HOT_IRON_BAR,
  },
  result: IronPickaxePart.create({}),
});
shapelessRecipe({
  key: 'iron_pickaxe',
  ingredients: [IronPickaxePart.create({}), Material.STICK],
  result: makeDamaged(Material.IRON_PICKAXE),
});

// IronShovel
shapedRecipe({
  key: 'iron_shovel_part',
  shape: ['BBB'],
  ingredients: {
    B: HOT_IRON_BAR,
  },
  result: IronShovelPart.create({}),
});
shapelessRecipe({
  key: 'iron_shovel',
  ingredients: [IronShovelPart.create({}), Material.STICK],
  result: makeDamaged(Material.IRON_SHOVEL),
});

// IronSword
shapedRecipe({
  key: 'iron_sword_part',
  shape: ['B', 'B'],
  ingredients: {
    B: HOT_IRON_BLADE,
  },
  result: IronSwordPart.create({}),
});
shapelessRecipe({
  key: 'iron_sword',
  ingredients: [IronSwordPart.create({}), Material.STICK],
  result: makeDamaged(Material.IRON_SWORD),
});

// WarHammer
shapedRecipe({
  key: 'war_hammer_part',
  shape: [' B ', 'III', 'I  '],
  ingredients: {
    B: HOT_IRON_BLADE,
    I: HOT_IRON_INGOT,
  },
  result: WarHammerPart.create({}),
});
shapelessRecipe({
  key: 'war_hammer',
  ingredients: [WarHammerPart.create({}), Material.STICK],
  result: makeDamaged(WarHammer.create({})),
});

/**
 * Shields
 */

// Shield
shapedRecipe({
  key: 'shield',
  shape: ['IPI', 'PPP', 'IPI'],
  ingredients: {
    I: HOT_IRON_STICK,
    P: PLANKS,
  },
  result: Material.SHIELD,
});

// HeaterShield
shapedRecipe({
  key: 'heater_shield',
  shape: ['III', 'PPP', ' I '],
  ingredients: {
    I: HOT_IRON_STICK,
    P: PLANKS,
  },
  result: HeaterShield.create({}),
});

// RoundShield
shapedRecipe({
  key: 'round_shield',
  shape: [' I ', 'IPI', ' I '],
  ingredients: {
    I: HOT_IRON_STICK,
    P: PLANKS,
  },
  result: RoundShield.create({}),
});

/**
 * Other
 */
// WarlkingStickSword
shapedRecipe({
  key: 'walking_stick_sword',
  shape: ['B', 'B', 'G'],
  ingredients: {
    B: HOT_IRON_STICK,
    G: Material.GOLD_NUGGET,
  },
  result: makeDamaged(WalkingStickSword.create({})),
});

// Pliers
shapedRecipe({
  key: 'pliers',
  shape: [' N ', 'BBN', ' B '],
  ingredients: {
    B: HOT_IRON_STICK,
    N: HOT_IRON_NUGGET,
  },
  result: Pliers.create({}),
});

// Key
shapedRecipe({
  key: 'key',
  shape: ['NB', 'NB', ' P'],
  ingredients: {
    B: HOT_IRON_STICK,
    N: HOT_IRON_NUGGET,
    P: HOT_IRON_PLATE,
  },
  result: Key.create({}, 3),
});

// Picklock
shapedRecipe({
  key: 'picklock',
  shape: ['N', 'S', 'S'],
  ingredients: {
    N: HOT_IRON_NUGGET,
    S: HOT_IRON_STICK,
  },
  result: Picklock.create({}),
});

// Handcuffs
shapedRecipe({
  key: 'handcuffs',
  shape: ['PSP'],
  ingredients: {
    P: HOT_IRON_PLATE,
    S: HOT_IRON_STICK,
  },
  result: Handcuffs.create({}),
});

// Shuriken
shapedRecipe({
  key: 'shuriken',
  shape: [' N ', 'NPN', ' N '],
  ingredients: {
    P: HOT_IRON_PLATE,
    N: HOT_IRON_NUGGET,
  },
  result: Shuriken.create({}),
});

// GuillotineBlade
shapedRecipe({
  key: 'guillotine_blade',
  shape: ['PPP', 'NNN', 'NNN'],
  ingredients: {
    P: PLANKS,
    N: HOT_IRON_PLATE,
  },
  result: GuillotineBlade.create({}),
});

// Lock
shapedRecipe({
  key: 'lock',
  shape: ['NNN', 'NPN', 'NNN'],
  ingredients: {
    N: Material.GOLD_NUGGET,
    P: HOT_IRON_PLATE,
  },
  result: createLockItem(),
});

// WallLantern
shapedRecipe({
  key: 'wall_lantern',
  shape: ['LI'],
  ingredients: {
    I: HOT_IRON_INGOT,
    L: Material.LANTERN,
  },
  result: VkMaterial.WALL_LANTERN,
});

/**
 * Vanilla
 */

// Chain
shapedRecipe({
  key: 'chain',
  shape: ['N', 'I', 'N'],
  ingredients: {
    N: HOT_IRON_NUGGET,
    I: HOT_IRON_INGOT,
  },
  result: Material.CHAIN,
});

// IronBars
shapedRecipe({
  key: 'iron_bars',
  shape: ['III', 'III'],
  ingredients: {
    I: HOT_IRON_BAR,
  },
  result: Material.IRON_BARS,
});

// IronHelmet
shapedRecipe({
  key: 'iron_helmet',
  shape: ['III', 'I I'],
  ingredients: {
    I: HOT_IRON_PLATE,
  },
  result: Material.IRON_HELMET,
});

// IronChestplate
shapedRecipe({
  key: 'iron_chestplate',
  shape: ['I I', 'III', 'III'],
  ingredients: {
    I: HOT_IRON_PLATE,
  },
  result: Material.IRON_CHESTPLATE,
});

// IronLeggings
shapedRecipe({
  key: 'iron_leggings',
  shape: ['III', 'I I', 'I I'],
  ingredients: {
    I: HOT_IRON_PLATE,
  },
  result: Material.IRON_LEGGINGS,
});

// IronBoots
shapedRecipe({
  key: 'iron_boots',
  shape: ['I I', 'I I'],
  ingredients: {
    I: HOT_IRON_PLATE,
  },
  result: Material.IRON_BOOTS,
});

// Anvil
shapedRecipe({
  key: 'anvil',
  shape: ['BBB', ' I ', 'III'],
  ingredients: {
    B: Material.IRON_BLOCK,
    I: HOT_IRON_INGOT,
  },
  result: Material.ANVIL,
});

// Bucket
shapedRecipe({
  key: 'bucket',
  shape: ['I I', ' I '],
  ingredients: {
    I: HOT_IRON_PLATE,
  },
  result: Material.BUCKET,
});

// Compass
shapedRecipe({
  key: 'compass',
  shape: [' I ', 'IRI', ' I '],
  ingredients: {
    I: HOT_IRON_PLATE,
    R: Material.REDSTONE,
  },
  result: Material.IRON_BOOTS,
});

// Lantern
shapedRecipe({
  key: 'lantern',
  shape: [' I ', 'ITI', ' I '],
  ingredients: {
    I: HOT_IRON_NUGGET,
    T: Material.TORCH,
  },
  result: new ItemStack(Material.LANTERN, 4),
});

// Piston
shapedRecipe({
  key: 'piston',
  shape: ['PPP', 'CIC', 'CRC'],
  ingredients: {
    P: PLANKS,
    I: HOT_IRON_INGOT,
    C: COBBLESTONE_LIKE,
    R: Material.REDSTONE,
  },
  result: Material.PISTON,
});

// BlastFurnace
shapedRecipe({
  key: 'hot_iron_ingot',
  shape: ['III', 'IFI', 'CCC'],
  ingredients: {
    I: HOT_IRON_INGOT,
    F: Material.FURNACE,
    C: COBBLESTONE_LIKE,
  },
  result: Material.BLAST_FURNACE,
});

// Probably not needed
// // IronBlock
// shapedRecipe({
//   key: 'iron_block',
//   shape: ['III', 'III', 'III'],
//   ingredients: {
//     I: HOT_IRON_INGOT,
//   },
//   result: Material.IRON_BLOCK,
// });
// // HotIronIngot
// shapedRecipe({
//   key: 'hot_iron_ingot',
//   shape: ['III', 'III', 'III'],
//   ingredients: {
//     I: HOT_IRON_NUGGET,
//   },
//   result: HOT_IRON_INGOT,
// });
