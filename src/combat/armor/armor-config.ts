import { UUID } from 'java.util';
import { Bukkit, Material } from 'org.bukkit';
import { Attribute, AttributeModifier } from 'org.bukkit.attribute';
import { Operation } from 'org.bukkit.attribute.AttributeModifier';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';

const ARMORS = new Map<Material, (item: ItemStack) => ItemStack>([
  [Material.DIAMOND_HELMET, createDefaultHelmet],
  [Material.DIAMOND_CHESTPLATE, createDefaultChestplate],
  [Material.DIAMOND_LEGGINGS, createDefaultLeggings],
  [Material.DIAMOND_BOOTS, createDefaultBoots],

  [Material.LEATHER_HELMET, createDefaultHelmet],
  [Material.LEATHER_CHESTPLATE, createDefaultChestplate],
  [Material.LEATHER_LEGGINGS, createDefaultLeggings],
  [Material.LEATHER_BOOTS, createCustomHat],

  [Material.GOLDEN_HELMET, createDefaultHelmet],
  [Material.GOLDEN_CHESTPLATE, createDefaultChestplate],
  [Material.GOLDEN_LEGGINGS, createDefaultLeggings],
  [Material.GOLDEN_BOOTS, createDefaultBoots],

  [Material.CHAINMAIL_HELMET, createDefaultHelmet],
  [Material.CHAINMAIL_CHESTPLATE, createDefaultChestplate],
  [Material.CHAINMAIL_LEGGINGS, createDefaultLeggings],
  [Material.CHAINMAIL_BOOTS, createDefaultBoots],

  [Material.NETHERITE_HELMET, createDefaultHelmet],
  [Material.NETHERITE_CHESTPLATE, createDefaultChestplate],
  [Material.NETHERITE_LEGGINGS, createDefaultLeggings],
  [Material.NETHERITE_BOOTS, createDefaultBoots],

  [Material.IRON_HELMET, createIronHelmet],
  [Material.IRON_CHESTPLATE, createIronChestplate],
  [Material.IRON_LEGGINGS, createIronLeggings],
  [Material.IRON_BOOTS, createIronBoots],

  [Material.TURTLE_HELMET, createDefaultHelmet],
]);

/**
 * Modify attributes of the armor
 * @param item Armor to be modified.
 * @returns Modified armor.
 */
export function modifyArmor(item: ItemStack) {
  const modifierFunction = ARMORS.get(item.type);
  if (!modifierFunction) {
    return item;
  }
  return modifierFunction(item);
}

/**
 * Default helmet with very small armor value
 */
function createDefaultHelmet(item: ItemStack) {
  const meta = item.itemMeta;

  const headAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'head_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.HEAD,
  );

  meta.removeAttributeModifier(EquipmentSlot.HEAD);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, headAdd1);
  item.itemMeta = meta;
  return item;
}

/**
 * Default chestplate with very small armor value
 */
function createDefaultChestplate(item: ItemStack) {
  const meta = item.itemMeta;

  const chestAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'chest_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.CHEST,
  );

  meta.removeAttributeModifier(EquipmentSlot.CHEST);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, chestAdd1);
  item.itemMeta = meta;
  return item;
}

/**
 * Default leggings with very small armor value
 */
function createDefaultLeggings(item: ItemStack) {
  const meta = item.itemMeta;

  const legsAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'legs_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.LEGS,
  );

  meta.removeAttributeModifier(EquipmentSlot.LEGS);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, legsAdd1);
  item.itemMeta = meta;
  return item;
}

/**
 * Default boots with very small armor value
 */
function createDefaultBoots(item: ItemStack) {
  const meta = item.itemMeta;

  const feetAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'feet_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.FEET,
  );

  meta.removeAttributeModifier(EquipmentSlot.FEET);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, feetAdd1);
  item.itemMeta = meta;
  return item;
}

/**
 * Leather boots and custom hats
 */
function createCustomHat(item: ItemStack) {
  const meta = item.itemMeta;

  // Check if the item was actully default leather boots
  if (!meta.hasCustomModelData()) return createDefaultBoots(item);

  // Item was custom hat!
  return createDefaultHelmet(item);
}

/**
 * Iron helmet with custom armor values
 */
function createIronHelmet(item: ItemStack) {
  const meta = item.itemMeta;

  const headAdd3 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_helmet_3',
    3,
    Operation.ADD_NUMBER,
    EquipmentSlot.HEAD,
  );

  meta.removeAttributeModifier(EquipmentSlot.HEAD);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, headAdd3);
  //meta.addAttributeModifier(Attribute.GENERIC_ARMOR_TOUGHNESS, headAdd2);
  item.itemMeta = meta;
  return item;
}

/**
 * Iron chestplate with custom armor values
 */
function createIronChestplate(item: ItemStack) {
  const meta = item.itemMeta;

  const chestAdd4 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_chestplate_4',
    4,
    Operation.ADD_NUMBER,
    EquipmentSlot.CHEST,
  );
  const chestAdd2 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_chestplate_2',
    4,
    Operation.ADD_NUMBER,
    EquipmentSlot.CHEST,
  );

  const chestSub = new AttributeModifier(
    UUID.randomUUID(),
    'iron_chestplate_sub',
    -0.012,
    Operation.ADD_NUMBER,
    EquipmentSlot.CHEST,
  );

  meta.removeAttributeModifier(EquipmentSlot.CHEST);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, chestAdd4);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR_TOUGHNESS, chestAdd2);
  meta.addAttributeModifier(Attribute.GENERIC_MOVEMENT_SPEED, chestSub);
  item.itemMeta = meta;
  return item;
}

/**
 * Iron leggings with custom armor values
 */
function createIronLeggings(item: ItemStack) {
  const meta = item.itemMeta;

  const legsAdd3 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_leggings_3',
    3,
    Operation.ADD_NUMBER,
    EquipmentSlot.LEGS,
  );
  const legsAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_leggings_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.LEGS,
  );

  const legsSub = new AttributeModifier(
    UUID.randomUUID(),
    'iron_leggings_sub',
    -0.012,
    Operation.ADD_NUMBER,
    EquipmentSlot.LEGS,
  );

  meta.removeAttributeModifier(EquipmentSlot.LEGS);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, legsAdd3);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR_TOUGHNESS, legsAdd1);
  meta.addAttributeModifier(Attribute.GENERIC_MOVEMENT_SPEED, legsSub);
  item.itemMeta = meta;
  return item;
}

/**
 * Iron boots with custom armor values
 */
function createIronBoots(item: ItemStack) {
  const meta = item.itemMeta;

  const feetAdd2 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_boots_2',
    2,
    Operation.ADD_NUMBER,
    EquipmentSlot.FEET,
  );
  const feetAdd1 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_boots_1',
    1,
    Operation.ADD_NUMBER,
    EquipmentSlot.FEET,
  );

  const feetSub1 = new AttributeModifier(
    UUID.randomUUID(),
    'iron_boots_sub',
    -0.012,
    Operation.ADD_NUMBER,
    EquipmentSlot.FEET,
  );

  meta.removeAttributeModifier(EquipmentSlot.FEET);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR, feetAdd2);
  meta.addAttributeModifier(Attribute.GENERIC_ARMOR_TOUGHNESS, feetAdd1);
  meta.addAttributeModifier(Attribute.GENERIC_MOVEMENT_SPEED, feetSub1);
  item.itemMeta = meta;
  return item;
}
