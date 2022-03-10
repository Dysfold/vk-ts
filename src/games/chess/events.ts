import { BlockFace } from 'org.bukkit.block';
import { EntityType } from 'org.bukkit.entity';
import {
  Action,
  BlockBreakEvent,
  BlockPlaceEvent,
} from 'org.bukkit.event.block';
import {
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { VkMaterial } from '../../common/items/VkMaterial';
import { clickBoard, createBoard, destroyBoard } from './chess';

const BOARD_INTERACTION_DISTANCE = 2.5;

// Create a board
registerEvent(BlockPlaceEvent, (event) => {
  if (event.block.type === VkMaterial.CHESSBOARD) createBoard(event.block);
});

// Destroy a board
registerEvent(BlockBreakEvent, (event) => {
  if (event.block.type === VkMaterial.CHESSBOARD) destroyBoard(event.block);
});

// Click a board
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  const entity = event.rightClicked;
  const hand = event.hand;

  if (hand !== EquipmentSlot.HAND) return;
  if (entity.type !== EntityType.ARMOR_STAND) return;

  const raytrace = event.player.rayTraceBlocks(BOARD_INTERACTION_DISTANCE);
  if (!raytrace) return;
  const block = raytrace.hitBlock;
  if (!block) return;
  if (block.type !== VkMaterial.CHESSBOARD) return;
  if (raytrace.hitBlockFace !== BlockFace.UP) return;

  clickBoard(raytrace, event.player);
});

registerEvent(PlayerInteractEvent, (event) => {
  const player = event.player;
  const action = event.action;
  const block = event.clickedBlock;
  const face = event.blockFace;

  if (!block) return;
  if (block.type !== VkMaterial.CHESSBOARD) return;
  if (event.hand !== EquipmentSlot.HAND) return;

  // Restart board
  if (action === Action.LEFT_CLICK_BLOCK) {
    if (player.isSneaking()) {
      destroyBoard(block);
      createBoard(block);
      return;
    }
  }
  if (face !== BlockFace.UP) return;

  const raytrace = player.rayTraceBlocks(BOARD_INTERACTION_DISTANCE);
  if (!raytrace) return;
  if (raytrace.hitBlockFace !== BlockFace.UP) return;
  if (!raytrace.hitBlock) return;
  if (raytrace.hitBlock.type !== VkMaterial.CHESSBOARD) return;

  clickBoard(raytrace, event.player);
});
