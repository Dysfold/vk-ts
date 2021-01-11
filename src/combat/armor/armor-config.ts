import { UUID } from 'java.util';
import { Material } from 'org.bukkit';
import { Attribute, AttributeModifier } from 'org.bukkit.attribute';
import { Operation } from 'org.bukkit.attribute.AttributeModifier';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';

// prettier-ignore
const ARMORS = new Map<Material, (item: ItemStack) => ItemStack>([
  [Material.DIAMOND_HELMET,         createDefaultHelmet],
  [Material.DIAMOND_CHESTPLATE,     createDefaultChestplate],
  [Material.DIAMOND_LEGGINGS,       createDefaultLeggings],
  [Material.DIAMOND_BOOTS,          createDefaultBoots],

  [Material.LEATHER_HELMET,         createDefaultHelmet],
  [Material.LEATHER_CHESTPLATE,     createDefaultChestplate],
  [Material.LEATHER_LEGGINGS,       createDefaultLeggings],
  [Material.LEATHER_BOOTS,          createLeatherBoots],

  [Material.GOLDEN_HELMET,          createDefaultHelmet],
  [Material.GOLDEN_CHESTPLATE,      createDefaultChestplate],
  [Material.GOLDEN_LEGGINGS,        createDefaultLeggings],
  [Material.GOLDEN_BOOTS,           createDefaultBoots],

  [Material.CHAINMAIL_HELMET,       createDefaultHelmet],
  [Material.CHAINMAIL_CHESTPLATE,   createDefaultChestplate],
  [Material.CHAINMAIL_LEGGINGS,     createDefaultLeggings],
  [Material.CHAINMAIL_BOOTS,        createDefaultBoots],

  [Material.NETHERITE_HELMET,       createDefaultHelmet],
  [Material.NETHERITE_CHESTPLATE,   createDefaultChestplate],
  [Material.NETHERITE_LEGGINGS,     createDefaultLeggings],
  [Material.NETHERITE_BOOTS,        createDefaultBoots],

  [Material.IRON_HELMET,            createIronHelmet],
  [Material.IRON_CHESTPLATE,        createIronChestplate],
  [Material.IRON_LEGGINGS,          createIronLeggings],
  [Material.IRON_BOOTS,             createIronBoots],

  [Material.TURTLE_HELMET,          createDefaultHelmet],
]);

export function isArmor(type: Material) {
  return ARMORS.has(type);
}

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

  meta.removeAttributeModifier(EquipmentSlot.HEAD);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.HEAD,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Default chestplate with very small armor value
 */
function createDefaultChestplate(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.CHEST);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.CHEST,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Default leggings with very small armor value
 */
function createDefaultLeggings(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.LEGS);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.LEGS,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Default boots with very small armor value
 */
function createDefaultBoots(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.FEET);
  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.FEET,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Leather boots and custom hats
 */
function createLeatherBoots(item: ItemStack) {
  const meta = item.itemMeta;

  // Check if the item was actully default leather boots
  if (!meta.hasCustomModelData()) return createDefaultBoots(item);

  // The item was custom hat!
  return createDefaultHelmet(item);
}

/**
 * Iron helmet with custom armor values
 */
function createIronHelmet(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.HEAD);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      3,
      Operation.ADD_NUMBER,
      EquipmentSlot.HEAD,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Iron chestplate with custom armor values
 */
function createIronChestplate(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.CHEST);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      4,
      Operation.ADD_NUMBER,
      EquipmentSlot.CHEST,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR_TOUGHNESS,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armorToughness',
      4,
      Operation.ADD_NUMBER,
      EquipmentSlot.CHEST,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_KNOCKBACK_RESISTANCE,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.knockbackResistance',
      0.1,
      Operation.ADD_NUMBER,
      EquipmentSlot.CHEST,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_MOVEMENT_SPEED,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.movementSpeed',
      -0.005,
      Operation.ADD_NUMBER,
      EquipmentSlot.CHEST,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Iron leggings with custom armor values
 */
function createIronLeggings(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.LEGS);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      3,
      Operation.ADD_NUMBER,
      EquipmentSlot.LEGS,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR_TOUGHNESS,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armorToughness',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.LEGS,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_KNOCKBACK_RESISTANCE,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.knockbackResistance',
      0.1,
      Operation.ADD_NUMBER,
      EquipmentSlot.LEGS,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_MOVEMENT_SPEED,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.movementSpeed',
      -0.005,
      Operation.ADD_NUMBER,
      EquipmentSlot.LEGS,
    ),
  );
  item.itemMeta = meta;
  return item;
}

/**
 * Iron boots with custom armor values
 */
function createIronBoots(item: ItemStack) {
  const meta = item.itemMeta;

  meta.removeAttributeModifier(EquipmentSlot.FEET);

  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armor',
      2,
      Operation.ADD_NUMBER,
      EquipmentSlot.FEET,
    ),
  );
  meta.addAttributeModifier(
    Attribute.GENERIC_ARMOR_TOUGHNESS,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.armorToughness',
      1,
      Operation.ADD_NUMBER,
      EquipmentSlot.FEET,
    ),
  );
  // Can be added later
  /*
  meta.addAttributeModifier(
    Attribute.GENERIC_MOVEMENT_SPEED,
    new AttributeModifier(
      UUID.randomUUID(),
      'generic.movementSpeed',
      -0.005,
      Operation.ADD_NUMBER,
      EquipmentSlot.FEET,
    ),
  );
  */
  item.itemMeta = meta;
  return item;
}
