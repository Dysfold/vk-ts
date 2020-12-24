import { EntityTeleportEndGatewayEvent } from 'com.destroystokyo.paper.event.entity';
import { PlayerTeleportEndGatewayEvent } from 'com.destroystokyo.paper.event.player';
import { ArrayList } from 'java.util';
import { Material, Location, Sound, ChatColor, Particle } from 'org.bukkit';
import { Dispenser, EndGateway } from 'org.bukkit.block';
import { Action, BlockDispenseEvent } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { ItemStack, PlayerInventory } from 'org.bukkit.inventory';

const ENDER_POWDER = Material.REDSTONE;
const PORTAL_CALIBRATOR = Material.SUNFLOWER;

async function initPortals(dispenser: Dispenser) {
  const effectLocation = dispenser.location.add(0.5, 1, 0.5);
  dispenser.world.playSound(
    effectLocation,
    Sound.BLOCK_RESPAWN_ANCHOR_SET_SPAWN,
    0.5,
    1,
  );
  for (let i = 0; i < 10; i++) {
    dispenser.world.spawnParticle(
      Particle.PORTAL,
      effectLocation.add(0, 0.1, 0),
      20,
      0.2,
      0,
      0.2,
      0,
    );
    await wait(200, 'millis');
  }

  const inventory = dispenser.inventory;

  const slot = inventory.first(ENDER_POWDER);
  if (slot === -1) return;
  const powder = inventory.getItem(slot);
  if (!powder) return;
  powder.amount--;

  const calSlot = inventory.first(PORTAL_CALIBRATOR);
  if (calSlot === -1) return;
  const calibrator = inventory.getItem(calSlot);
  if (!calibrator) return;

  const lore = calibrator.lore && calibrator.lore[0];
  if (!lore) return;
  const target = lore.split(' ');

  if (target[0] === 'Uncalibrated') return;

  const enterLocation = dispenser.location.add(0, 1, 0);

  const exitLocation = new Location(
    dispenser.world,
    +target[1],
    +target[2],
    +target[3],
  );
  createPortals(enterLocation, exitLocation);
}

async function createPortals(enterLocation: Location, exitLocation: Location) {
  const lowerPortal = enterLocation.block;
  const upperPortal = lowerPortal.getRelative(0, 1, 0);
  const lowerExitPortal = exitLocation.block;
  const upperExitPortal = lowerExitPortal.getRelative(0, 1, 0);

  if (
    lowerPortal.type !== Material.AIR ||
    upperPortal.type !== Material.AIR ||
    lowerExitPortal.type !== Material.AIR ||
    upperExitPortal.type !== Material.AIR
  ) {
    // Play portal blocked effects
    lowerPortal.world.playSound(
      lowerPortal.location.add(0.5, 0.5, 0.5),
      Sound.BLOCK_FIRE_EXTINGUISH,
      1,
      1,
    );
    return;
  }

  // Play portal creation effects
  lowerPortal.world.playSound(
    lowerPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_END_PORTAL_SPAWN,
    0.5,
    1.5,
  );
  lowerExitPortal.world.playSound(
    lowerExitPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_END_PORTAL_SPAWN,
    0.5,
    1.5,
  );

  lowerPortal.type = Material.END_GATEWAY;
  upperPortal.type = Material.END_GATEWAY;
  lowerExitPortal.type = Material.END_GATEWAY;
  upperExitPortal.type = Material.END_GATEWAY;

  // Setup enter portal
  const lowerState = lowerPortal.state as EndGateway;
  lowerState.exitLocation = lowerExitPortal.location;
  lowerState.setExactTeleport(true);
  lowerState.update();

  // Setup exit portal
  const lowerExitState = lowerExitPortal.state as EndGateway;
  lowerExitState.exitLocation = lowerPortal.location;
  lowerExitState.setExactTeleport(true);
  lowerExitState.update();

  // Play portal ambient effects
  lowerPortal.world.playSound(
    lowerPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_RESPAWN_ANCHOR_AMBIENT,
    0.5,
    1,
  );

  lowerExitPortal.world.playSound(
    lowerExitPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_RESPAWN_ANCHOR_AMBIENT,
    0.5,
    1,
  );

  await wait(5000, 'millis');

  // Play portal removal effects
  lowerPortal.world.playSound(
    lowerPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_RESPAWN_ANCHOR_DEPLETE,
    0.5,
    0.5,
  );
  lowerExitPortal.world.playSound(
    lowerPortal.location.add(0.5, 0.5, 0.5),
    Sound.BLOCK_RESPAWN_ANCHOR_DEPLETE,
    0.5,
    1,
  );

  lowerPortal.type = Material.AIR;
  upperPortal.type = Material.AIR;
  lowerExitPortal.type = Material.AIR;
  upperExitPortal.type = Material.AIR;
}

registerEvent(BlockDispenseEvent, (event) => {
  if (event.block.type !== Material.DISPENSER) return;
  if (event.item.type !== ENDER_POWDER && event.item.type !== PORTAL_CALIBRATOR)
    return;

  // PORTAL ITEM WAS DISPENSED !
  const dispenser = event.block.state as Dispenser;
  const inventory = dispenser.inventory;

  // DISPENSED ITEM WAS CALIBRATOR -> REPLACE ITEM WITH FIRST OTHER ITEM
  // IF OTHER ITEM IS POWDER -> CONTINUE CREATING PORTAL
  if (event.item.type === PORTAL_CALIBRATOR) {
    for (const item of inventory.contents) {
      if (item) {
        if (item.type !== PORTAL_CALIBRATOR) {
          event.item = new ItemStack(item.type, 1);
          item.amount--;
        }
      }
    }
  }

  if (event.item.type === PORTAL_CALIBRATOR) {
    event.setCancelled(true);
    return;
  }

  if (event.item.type !== ENDER_POWDER) return;
  event.setCancelled(true);

  initPortals(dispenser);
});

async function playTeleportSounds(from: Location, to: Location) {
  const world = from.world;
  await wait(10, 'millis');
  world.playSound(from, Sound.ENTITY_ENDERMAN_TELEPORT, 1, 1);
  world.playSound(to, Sound.ENTITY_ENDERMAN_TELEPORT, 1, 1);
}

// Play teleport entity effeccts
registerEvent(EntityTeleportEndGatewayEvent, (event) => {
  if (event.to) playTeleportSounds(event.from, event.to);
});

// Play teleport player effeccts
registerEvent(PlayerTeleportEndGatewayEvent, (event) => {
  playTeleportSounds(event.from, event.to);
});

// Calibrate portal calibrator with compass
registerEvent(PlayerInteractEvent, (event) => {
  if (event.item?.type !== Material.COMPASS) return;
  const a = event.action;
  if (a !== Action.LEFT_CLICK_AIR && a !== Action.LEFT_CLICK_BLOCK) return;
  const inv = event.player.inventory as PlayerInventory;
  if (inv.itemInOffHand.type !== PORTAL_CALIBRATOR) return;
  const portalCalibrator = inv.itemInOffHand;

  const player = event.player;
  const { blockX, blockY, blockZ } = player.location;
  const lore = new ArrayList<string>();
  lore.add(
    ChatColor.DARK_GRAY +
      'Target:' +
      ChatColor.GRAY +
      ' ' +
      blockX +
      ' ' +
      blockY +
      ' ' +
      blockZ,
  );
  portalCalibrator.setLore(lore);
  player.world.playSound(
    player.location,
    Sound.ITEM_LODESTONE_COMPASS_LOCK,
    0.5,
    1,
  );
});
