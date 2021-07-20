import { Material } from 'org.bukkit';
import {
  Hammer,
  HotIronBar,
  HotIronBlade,
  HotIronNugget,
  HotIronPlate,
  HotIronStick,
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
} from '../../../blacksmith/metal-parts';
import {
  Gladius,
  Glaive,
  JungleKnife,
  Katana,
  Knife,
  Longsword,
  Rapier,
  Saber,
} from '../../../blacksmith/swords';
import { Spear, WarAxe } from '../../../blacksmith/tools';
import { Scythe, Sickle } from '../../../farming/harvesting';
import { HandSaw } from '../../../misc/saw';
import { PLANKS } from '../../utilities/choices';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { shapelessRecipe } from '../../utilities/shapeless-recipes';

const HOT_IRON_BAR = HotIronBar.create({});
const HOT_IRON_BLADE = HotIronBlade.create({});
const HOT_IRON_NUGGET = HotIronNugget.create({});
// const HOT_IRON_INGOT = HotIronIngot.create({});
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
