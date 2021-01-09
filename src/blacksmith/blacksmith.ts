import { Location, Material, Rotation, Sound, SoundCategory } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { EntityType, Item, ItemFrame, Player } from 'org.bukkit.entity';
import { CraftItemEvent, InventoryType } from 'org.bukkit.event.inventory';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { isRightClick } from '../common/helpers/click';
import { summonInvisibleItemFrame } from '../common/helpers/itemframes';
import { CustomItem } from '../common/items/CustomItem';
import { Directional } from 'org.bukkit.block.data';

const MOLTEN_MATERIAL = Material.IRON_NUGGET;

export const Pliers = new CustomItem({
  id: 9,
  type: Material.IRON_HOE,
  modelId: 9,
  name: 'Pihdit',
});

export const Hammer = new CustomItem({
  id: 8,
  type: Material.IRON_HOE,
  modelId: 8,
  name: 'Vasara',
});

// Pliers with items
export const PliersAndIronBar = new CustomItem({
  id: 12,
  type: Material.IRON_HOE,
  modelId: 12,
  name: 'Pihdit',
});
export const PliersAndIronBlade = new CustomItem({
  id: 13,
  type: Material.IRON_HOE,
  modelId: 13,
  name: 'Pihdit',
});
export const PliersAndIronIngot = new CustomItem({
  id: 14,
  type: Material.IRON_HOE,
  modelId: 14,
  name: 'Pihdit',
});
export const PliersAndIronNugget = new CustomItem({
  id: 15,
  type: Material.IRON_HOE,
  modelId: 15,
  name: 'Pihdit',
});
export const PliersAndIronPlate = new CustomItem({
  id: 16,
  type: Material.IRON_HOE,
  modelId: 16,
  name: 'Pihdit',
});
export const PliersAndIronStick = new CustomItem({
  id: 17,
  type: Material.IRON_HOE,
  modelId: 17,
  name: 'Pihdit',
});

// Molten metal items
export const HotIronIngot = new CustomItem({
  id: 1,
  type: MOLTEN_MATERIAL,
  modelId: 1,
  name: 'Kuuma rautaharkko',
});
export const HotIronBlade = new CustomItem({
  id: 2,
  type: MOLTEN_MATERIAL,
  modelId: 2,
  name: 'Kuuma rautaterä',
});
export const HotIronStick = new CustomItem({
  id: 3,
  type: MOLTEN_MATERIAL,
  modelId: 3,
  name: 'Kuuma rautatikku',
});
export const HotIronPlate = new CustomItem({
  id: 4,
  type: MOLTEN_MATERIAL,
  modelId: 4,
  name: 'Kuuma rautaharkko',
});
export const HotIronBar = new CustomItem({
  id: 5,
  type: MOLTEN_MATERIAL,
  modelId: 5,
  name: 'Kuuma rautaharkko',
});
export const HotIronNugget = new CustomItem({
  id: 6,
  type: MOLTEN_MATERIAL,
  modelId: 6,
  name: 'Kuuma rautaharkko',
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
      pliers = key.create();
    }
  });
  return pliers;
}

// Iron ingot can form into these items
const IronIngotDerivatives = new Map<CustomItem<{}>, ItemStack>([
  [HotIronBar, PliersAndIronBar.create()],
  [HotIronBlade, PliersAndIronBlade.create()],
  [HotIronIngot, PliersAndIronIngot.create()],
  [HotIronPlate, PliersAndIronPlate.create()],
  [HotIronStick, PliersAndIronStick.create()],
]);
const IronIngotDerivativesArray = Array.from(IronIngotDerivatives.keys());

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
  if (item?.type !== MOLTEN_MATERIAL) return false;
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
    const inventory = event.player.inventory;

    // Get the iron to be smelted
    const itemInOtherHand =
      hand === EquipmentSlot.HAND
        ? inventory.itemInOffHand
        : inventory.itemInMainHand;

    const pliersWithItem = getPliersWithItem(itemInOtherHand);
    if (!pliersWithItem) return;

    itemInOtherHand.amount--;
    // TODO: This repairs broken pliers
    if (hand === EquipmentSlot.HAND) {
      inventory.itemInMainHand = pliersWithItem.create();
    } else {
      inventory.itemInOffHand = pliersWithItem.create();
    }
    event.player.world.playSound(
      event.player.location,
      Sound.ITEM_FIRECHARGE_USE,
      SoundCategory.PLAYERS,
      0.6,
      1,
    );
  },
);

// Place iron on anvil
registerEvent(PlayerInteractEvent, (event) => {
  if (event.clickedBlock?.type !== Material.ANVIL) return;
  if (event.blockFace !== BlockFace.UP) return;
  if (!isRightClick(event.action)) return;
  const tool = event.item;
  if (!tool) return;

  PLIERS_ITEMS.forEach((smelted, pliers) => {
    if (pliers.check(tool)) {
      event.setCancelled(true);

      // Place hot iron on the anvil
      const anvil = event.clickedBlock;
      if (!anvil) return;
      const smeltedItem = smelted.create();
      const meta = smeltedItem.itemMeta;
      meta.displayName = ''; // Displayname would hover on top of the itemframe
      smeltedItem.itemMeta = meta;
      const frame = summonInvisibleItemFrame(
        anvil,
        event.blockFace,
        smeltedItem,
      );
      if (!frame) return;
      frame.rotation = getAnvilFrameRotation(anvil.blockData as Directional);

      // Give player empty pliers
      if (event.hand === EquipmentSlot.HAND) {
        event.player.inventory.itemInMainHand = Pliers.create();
      } else {
        event.player.inventory.itemInOffHand = Pliers.create();
      }
    }
  });
});

// Shape the iron with a hammer
const hammerUsers = new Set<Player>();
Hammer.event(
  PlayerInteractEntityEvent,
  (event) => event.player.inventory.itemInMainHand,
  async (event) => {
    const clicked = event.rightClicked;
    if (clicked.type !== EntityType.ITEM_FRAME) return;
    const frame = clicked as ItemFrame;

    // Check if the frame is on top of anvil
    if (frame.facing !== BlockFace.UP) return;
    const attachedBlock = frame.world.getBlockAt(
      frame.location.add(0, -0.5, 0),
    );
    if (attachedBlock.type !== Material.ANVIL) return;

    const item = frame.item;
    if (!isMoltenMetal(item)) return;

    const player = event.player;
    event.setCancelled(true);
    if (hammerUsers.has(player)) return;
    hammerUsers.add(player);

    let newIronItem = item;
    IronIngotDerivativesArray.forEach((iron, index) => {
      if (iron.check(item)) {
        const nextIndex = (index + 1) % IronIngotDerivativesArray.length;
        newIronItem = IronIngotDerivativesArray[nextIndex].create();

        // Hide nametag from the item
        const meta = newIronItem.itemMeta;
        meta.displayName = '';
        newIronItem.itemMeta = meta;
      }
    });

    playHammeringSounds(frame.location);
    await swingHammer(player);
    frame.setItem(newIronItem, false);
    frame.location.world.playSound(
      frame.location,
      Sound.ENTITY_RAVAGER_STEP,
      SoundCategory.PLAYERS,
      0.6,
      1,
    );

    hammerUsers.delete(player);
  },
);

async function swingHammer(player: Player) {
  await wait(0.4, 'seconds');
  player.swingMainHand();
  await wait(0.4, 'seconds');
  player.swingMainHand();
  await wait(0.4, 'seconds');
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
    const clicked = event.rightClicked;
    if (clicked.type !== EntityType.ITEM_FRAME) return;
    const frame = clicked as ItemFrame;
    const item = frame.item;
    if (item.type !== MOLTEN_MATERIAL) return;
    if (!item.itemMeta.hasCustomModelData()) return;
    const player = event.player;
    event.setCancelled(true);

    const pliers = getPliersForItem(item);
    if (!pliers) return;
    player.inventory.itemInMainHand = pliers;
    frame.remove();
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
          // Check because this event was fired 3 times. This line may be deleted later
          if (!Pliers.check(event.player.inventory.itemInMainHand)) return;

          const pliersWithItem = getPliersForItem(item);
          if (!pliersWithItem) continue;

          entity.itemStack.amount--;
          await wait(1, 'ticks');
          event.player.inventory.itemInMainHand = pliersWithItem;

          return;
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

      event.player.inventory.itemInMainHand = Pliers.create();

      const ironItem = iron.create();
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
  if (!event.inventory.contains(MOLTEN_MATERIAL)) return;
  const inv = event.inventory;
  if (
    inv.type !== InventoryType.CRAFTING &&
    inv.type !== InventoryType.WORKBENCH
  ) {
    return;
  }
  if (inv.contains(new ItemStack(MOLTEN_MATERIAL))) return;
  const crafter = event.whoClicked;
  if (crafter.getTargetBlock(5)?.type === Material.SMITHING_TABLE) return;
  if (!(crafter instanceof Player)) return;
  crafter.sendTitle('', 'Tarvitset takomispöydän');
  // crafter.playSound(
  //   crafter.location,
  //   Sound.BLOCK_STONE_BREAK,
  //   SoundCategory.PLAYERS,
  //   2,
  //   1,
  // );
  // const contents = inv.contents;
  // for (const item of contents) {
  //   if (isMoltenMetal(item)) {
  //     giveItem(crafter, item);
  //     item.type = Material.AIR;
  //   }
  // }
  inv.result = null;
  //crafter.closeInventory();
});
