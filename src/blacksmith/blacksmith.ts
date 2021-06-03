import {
  Location,
  Material,
  Particle,
  Rotation,
  Sound,
  SoundCategory,
} from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { EntityType, Item, ItemFrame, Player } from 'org.bukkit.entity';
import { EntityDamageByEntityEvent } from 'org.bukkit.event.entity';
import { CraftItemEvent, InventoryType } from 'org.bukkit.event.inventory';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { isRightClick } from '../common/helpers/click';
import { spawnHiddenItemFrame } from '../common/entities/item-frame';
import { CustomItem } from '../common/items/CustomItem';
import { Damageable } from 'org.bukkit.inventory.meta';
import { VkItem } from '../common/items/VkItem';
import { equippedItem } from '../common/helpers/inventory';
import { translate } from 'craftjs-plugin/chat';

export const Pliers = new CustomItem({
  id: 9,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});

export const Hammer = new CustomItem({
  id: 8,
  type: VkItem.TOOL,
  name: translate('vk.hammer'),
});

// Pliers with items
export const PliersAndIronBar = new CustomItem({
  id: 12,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});
export const PliersAndIronBlade = new CustomItem({
  id: 13,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});
export const PliersAndIronIngot = new CustomItem({
  id: 14,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});
export const PliersAndIronNugget = new CustomItem({
  id: 15,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});
export const PliersAndIronPlate = new CustomItem({
  id: 16,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});
export const PliersAndIronStick = new CustomItem({
  id: 17,
  type: VkItem.TOOL,
  name: translate('vk.pliers'),
});

// Molten metal items
export const HotIronIngot = new CustomItem({
  id: 1,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_ingot'),
});
export const HotIronBlade = new CustomItem({
  id: 2,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_blade'),
});
export const HotIronStick = new CustomItem({
  id: 3,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_stick'),
});
export const HotIronPlate = new CustomItem({
  id: 4,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_plate'),
});
export const HotIronBar = new CustomItem({
  id: 5,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_bar'),
});
export const HotIronNugget = new CustomItem({
  id: 6,
  type: VkItem.MOLTEN,
  name: translate('vk.hot_iron_nugget'),
});

// Pair pliers with corresponding molten items
const PLIERS_ITEMS = new Map<CustomItem<{}>, CustomItem<{}>>([
  [PliersAndIronBar, HotIronBar],
  [PliersAndIronBlade, HotIronBlade],
  [PliersAndIronIngot, HotIronIngot],
  [PliersAndIronNugget, HotIronNugget],
  [PliersAndIronPlate, HotIronPlate],
  [PliersAndIronStick, HotIronStick],
]);

// Combine molten iron shape with pliers
function getPliersForItem(item: ItemStack): ItemStack | undefined {
  let pliers = undefined;
  PLIERS_ITEMS.forEach((value, key) => {
    if (value.check(item)) {
      pliers = key.create({});
    }
  });
  return pliers;
}

// Iron ingot can form into these items
const IRON_INGOT_DERIVATIVES = new Map<CustomItem<{}>, ItemStack>([
  [HotIronBar, PliersAndIronBar.create({})],
  [HotIronBlade, PliersAndIronBlade.create({})],
  [HotIronIngot, PliersAndIronIngot.create({})],
  [HotIronPlate, PliersAndIronPlate.create({})],
  [HotIronStick, PliersAndIronStick.create({})],
]);
const IRON_INGOT_DERIVATIVES_ARRAY = Array.from(IRON_INGOT_DERIVATIVES.keys());

// Maybe needed in the future?
//const IronNuggetDerivatives = [HotIronNugget];

// Combine pliers and regular iron item into pliers + molten iron ingot
// Used when clicking a fire
function getPliersWithItem(item: ItemStack) {
  if (item.type === Material.IRON_INGOT) return PliersAndIronIngot;
  if (item.type === Material.IRON_NUGGET) return PliersAndIronNugget;
  return undefined;
}

export function isMoltenMetal(item: ItemStack | null) {
  if (item?.type !== VkItem.MOLTEN) return false;
  if (!item.itemMeta.hasCustomModelData()) return false;
  return true;
}

function getAnvilFrameRotation(anvil: Directional) {
  switch (anvil.facing) {
    case BlockFace.EAST:
    case BlockFace.WEST:
      return Rotation.CLOCKWISE_45;

    default:
      return Rotation.CLOCKWISE_135;
  }
}

// Smelt an iron
Pliers.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.clickedBlock?.type !== Material.FIRE) return;
    const hand = event.hand;
    if (!event.item) return;
    const inventory = event.player.inventory;

    // Get the iron to be smelted
    const itemInOtherHand =
      hand === EquipmentSlot.HAND
        ? inventory.itemInOffHand
        : inventory.itemInMainHand;

    const pliersWithItem = getPliersWithItem(itemInOtherHand);
    if (!pliersWithItem) return;

    itemInOtherHand.amount--;
    // Keep the original damage of the pliers
    const pliers = copyDamage(event.item, pliersWithItem.create({}));
    if (hand === EquipmentSlot.HAND) {
      inventory.itemInMainHand = pliers;
    } else {
      inventory.itemInOffHand = pliers;
    }
    playFlameParticle(event.clickedBlock.location.add(0.5, 0.5, 0.5));
    event.player.world.playSound(
      event.player.location,
      Sound.ITEM_FIRECHARGE_USE,
      SoundCategory.PLAYERS,
      0.6,
      1,
    );
  },
);

// Used to copy damage to next plier item
function copyDamage(from: ItemStack, to: ItemStack) {
  const fromMeta = from.itemMeta;
  const toMeta = to.itemMeta;
  if (fromMeta instanceof Damageable && toMeta instanceof Damageable) {
    toMeta.damage = fromMeta.damage;
    to.itemMeta = toMeta;
  }
  return to;
}

// Place iron on anvil
registerEvent(PlayerInteractEvent, (event) => {
  if (event.clickedBlock?.type !== Material.ANVIL) return;
  if (!isRightClick(event.action)) return;
  const tool = event.item;
  if (!tool) return;

  PLIERS_ITEMS.forEach((smelted, pliers) => {
    if (pliers.check(tool)) {
      event.setCancelled(true);

      // Place hot iron on the anvil
      const anvil = event.clickedBlock;
      if (!anvil) return;
      const smeltedItem = smelted.create({});
      const meta = smeltedItem.itemMeta;
      meta.displayName = ''; // Displayname would hover on top of the itemframe
      smeltedItem.itemMeta = meta;
      const frame = spawnHiddenItemFrame(anvil, BlockFace.UP, smeltedItem);
      if (!frame) return;
      frame.rotation = getAnvilFrameRotation(anvil.blockData as Directional);

      // Give player empty pliers
      // Keep the original damage of the pliers
      const emptyPliers = copyDamage(tool, Pliers.create({}));
      if (event.hand === EquipmentSlot.HAND) {
        event.player.inventory.itemInMainHand = emptyPliers;
      } else {
        event.player.inventory.itemInOffHand = emptyPliers;
      }
      playIronClickSound(frame.location);
    }
  });
});

// Shape the iron with a hammer
const hammerUsers = new Set<Player>();

async function hammerHit(frame: ItemFrame, player: Player) {
  // Check if the frame is on top of anvil
  if (frame.facing !== BlockFace.UP) return;
  const attachedBlock = frame.world.getBlockAt(frame.location.add(0, -0.5, 0));
  if (attachedBlock.type !== Material.ANVIL) return;

  const item = frame.item;
  if (!isMoltenMetal(item)) return;

  if (hammerUsers.has(player)) return;
  hammerUsers.add(player);

  let newIronItem = item;
  IRON_INGOT_DERIVATIVES_ARRAY.forEach((iron, index) => {
    if (iron.check(item)) {
      const nextIndex = (index + 1) % IRON_INGOT_DERIVATIVES_ARRAY.length;
      newIronItem = IRON_INGOT_DERIVATIVES_ARRAY[nextIndex].create({});

      // Hide nametag from the item
      const meta = newIronItem.itemMeta;
      meta.displayName = '';
      newIronItem.itemMeta = meta;
    }
  });

  playHammeringSounds(frame.location);
  await swingHammer(player, frame.location);
  frame.setItem(newIronItem, false);
  frame.location.world.playSound(
    frame.location,
    Sound.ENTITY_RAVAGER_STEP,
    SoundCategory.PLAYERS,
    0.6,
    1,
  );

  hammerUsers.delete(player);
}

Hammer.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInMainHand,
  async (event) => {
    const clicked = event.rightClicked;
    if (clicked.type !== EntityType.ITEM_FRAME) return;
    const frame = clicked as ItemFrame;
    event.setCancelled(true);

    await hammerHit(frame, event.player);
  },
);

Hammer.event(
  EntityDamageByEntityEvent,
  (event) => equippedItem(event.damager, EquipmentSlot.HAND),
  async (event) => {
    event.setCancelled(true);
    const entity = event.entity;
    if (!(entity instanceof ItemFrame)) return;
    await hammerHit(entity, (event.damager as unknown) as Player);
  },
);

function playIronClickSound(location: Location) {
  location.world.playSound(
    location,
    Sound.ITEM_TRIDENT_HIT,
    SoundCategory.PLAYERS,
    0.7,
    1,
  );
}

async function swingHammer(player: Player, location: Location) {
  hotIronParticle(location);
  await wait(0.4, 'seconds');
  hotIronParticle(location);
  player.swingMainHand();
  await wait(0.4, 'seconds');
  hotIronParticle(location);
  player.swingMainHand();
  await wait(0.4, 'seconds');
}

function hotIronParticle(location: Location) {
  location.world.spawnParticle(Particle.LAVA, location.add(0, -0.2, 0), 3);

  // Alternative particle effect
  /*
  location.world.spawnParticle(
    Particle.SMOKE_NORMAL,
    location,
    0,
    (Math.random() - 0.5) * 0.2,
    0,
    (Math.random() - 0.5) * 0.2,
  );
  */
}

function playFlameParticle(location: Location) {
  location.world.spawnParticle(Particle.LAVA, location, 3);
}

function playHammeringSounds(location: Location) {
  const pitch = Math.random() * 0.2 + 0.8;
  location.world.playSound(location, Sound.BLOCK_ANVIL_USE, 0.6, pitch);
}

// Take the molten iron from the anvil with pliers
Pliers.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInMainHand,
  async (event) => {
    if (event.hand !== EquipmentSlot.HAND) return;
    const clicked = event.rightClicked;
    if (clicked.type !== EntityType.ITEM_FRAME) return;
    const frame = clicked as ItemFrame;
    const item = frame.item;
    if (item.type !== VkItem.MOLTEN) return;
    if (!item.itemMeta.hasCustomModelData()) return;
    const player = event.player;
    event.setCancelled(true);

    const pliers = getPliersForItem(item);
    if (!pliers) return;
    // Keep the original damage of the pliers
    player.inventory.itemInMainHand = copyDamage(
      player.inventory.itemInMainHand,
      pliers,
    );
    frame.remove();
    playIronClickSound(frame.location);
  },
);

// Take the molten iron from ground
Pliers.event(
  PlayerInteractEvent,
  (event) => event.player.inventory.itemInMainHand,
  async (event) => {
    if (!isRightClick(event.action)) return;

    const raytrace = event.player.rayTraceBlocks(4);
    const hitPos = raytrace?.hitPosition;
    if (!hitPos) return;
    const world = event.player.world;
    const entities = world.getNearbyEntities(
      hitPos.toLocation(world),
      0.5,
      0.5,
      0.5,
    );
    for (const entity of entities) {
      if (entity instanceof Item) {
        const item = entity.itemStack;
        if (isMoltenMetal(item)) {
          const inventory = event.player.inventory;
          // Check because this event was fired 3 times. This line may be deleted later
          if (!Pliers.check(inventory.itemInMainHand)) return;

          const pliersWithItem = getPliersForItem(item);
          if (!pliersWithItem) continue;

          // Wait 1 millis, because the event would be called twice
          // and the item would go to the inventory
          await wait(1, 'millis');

          // Prevent duplication caused by delay
          // Check if the item despawned or was destroyed
          if (!entity.isValid()) return;
          if (!Pliers.check(inventory.itemInMainHand)) return;

          entity.itemStack.amount--;
          // Keep the original damage of the pliers
          const pliers = copyDamage(inventory.itemInMainHand, pliersWithItem);
          inventory.itemInMainHand.itemMeta = pliers.itemMeta;
        }
      }
    }
  },
);

// Click with pliers to get the molten iron
PLIERS_ITEMS.forEach((iron, plier) => {
  plier.event(
    PlayerInteractEvent,
    (event) => event.player.inventory.itemInMainHand,
    async (event) => {
      if (event.clickedBlock?.type === Material.ANVIL) return;
      if (event.clickedBlock?.type === Material.FIRE) return;

      // Keep the original damage of the pliers
      const pliersInHand = event.player.inventory.itemInMainHand;
      event.player.inventory.itemInMainHand = copyDamage(
        pliersInHand,
        Pliers.create({}),
      );

      const ironItem = iron.create({});
      if (event.player.inventory.addItem(ironItem).size()) {
        event.player.world.dropItem(event.player.location, ironItem);
      }
    },
  );
});

// Open crafting table by clicking the smithing table
registerEvent(PlayerInteractEvent, (event) => {
  if (!isRightClick(event.action)) return;
  if (event.clickedBlock?.type !== Material.SMITHING_TABLE) return;
  event.setCancelled(true);
  event.player.openWorkbench(event.clickedBlock.location, true);
});

// Allow crafting (with molten items) only with smithing table
registerEvent(CraftItemEvent, (event) => {
  if (!event.inventory.contains(VkItem.MOLTEN)) return;
  const inv = event.inventory;
  if (
    inv.type !== InventoryType.CRAFTING &&
    inv.type !== InventoryType.WORKBENCH
  ) {
    return;
  }
  if (inv.contains(new ItemStack(VkItem.MOLTEN))) return;
  const crafter = event.whoClicked;
  if (crafter.getTargetBlock(5)?.type === Material.SMITHING_TABLE) return;
  if (!(crafter instanceof Player)) return;
  crafter.sendTitle('', 'Tarvitset takomispöydän');
  inv.result = null;
  crafter.closeInventory();
  crafter.updateInventory();
});
