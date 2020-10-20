import { Integer } from 'java.lang';
import { Location, Material, World } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { RayTraceResult, Vector } from 'org.bukkit.util';

import { Chess, Move, Square } from 'chess.js';
let chess = new Chess();

const BOARD_MATERIAL = Material.GRAY_GLAZED_TERRACOTTA;
const PIECE_MATERIAL = Material.HEART_OF_THE_SEA;
const BOARD_MODEL_DIRECTION = { x: -1, z: 0 };
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const CENTERING_VECTOR = new Vector(0.5, 0, 0.5);

const ModelData: { [key: string]: number } = {
  // Black pieces
  b: 2,
  k: 3,
  n: 4,
  p: 5,
  q: 6,
  r: 7,
  // White pieces
  B: 9,
  K: 10,
  N: 11,
  P: 12,
  Q: 13,
  R: 14,
  // Other
  selection: 8,
};

interface Castling {
  type: string;
  from: Square;
  to: Square;
}

function getToken(char: string, color: 'w' | 'b') {
  return color === 'b' ? char : char.toUpperCase();
}

function isAllied(square: Square) {
  return chess.get(square)?.color == chess.turn();
}

export function clickBoard(raytrace: RayTraceResult, player: Player) {
  const block = raytrace.hitBlock;
  if (!block) return;
  if (block.type !== BOARD_MATERIAL) return;

  const selection = getChessNotation(block, raytrace.hitPosition);
  const squareCenter = roundToCenter(raytrace.hitPosition);

  const world = block.world;
  const squareLocation = new Location(
    world,
    squareCenter.x,
    squareCenter.y,
    squareCenter.z,
  );

  let selectionArmorstand = findArmorstand(block, 'selection');
  const allied = isAllied(selection);

  // Select source
  if (allied) {
    selectionArmorstand?.remove();
    selectionArmorstand = createArmorstand('selection', world);
    selectionArmorstand.teleport(squareLocation);
  }

  // Select destination
  else if (selectionArmorstand) {
    const destination = selection;

    // Get previously selected source
    const armorstandLoc = selectionArmorstand.location.toVector();
    const source = getChessNotation(block, armorstandLoc);

    // Check if we can make the move
    //const legal = isLegalMove(source, destination);

    ////server.broadcastMessage('Siirretään ' + source + ' -> ' + destination);

    let move =
      chess.move({ from: source, to: destination }) ||
      chess.move({ from: source, to: destination, promotion: 'q' });

    //const movedArmorstand = moveArmorstand();

    if (move) {
      makeChangesToBoard(block, move);
      //destroyBoard(block);
      //createBoard(block);
    } else {
      //server.broadcastMessage('Ei voida siirtää');
    }

    //const fenString = chess.fen();
    selectionArmorstand.remove();
  } else {
    // cant select
  }
}

function notationToXY(square: Square) {
  const y = LETTERS.indexOf(square.charAt(0));
  const x = +square.charAt(1) - 1;
  //server.broadcastMessage(x + ' ' + y);
  return { x, y };
}

function getSquareLocation(block: Block, square: Square) {
  //server.broadcastMessage('finding: ' + square);
  let { x, y } = notationToXY(square);
  // Centering the piece
  x = (x + 0.5) / 8;
  y = (y + 0.5) / 8;

  // Calculate the location in the world
  const relative = new Vector(x, 1, y);

  // Get the direction of the block
  const data = (block.blockData as unknown) as Directional;
  const facing = data.facing;
  const forward = facing.direction;

  // Calculate the angle between blocks direction and the direction of the model
  const x1 = BOARD_MODEL_DIRECTION.x;
  const x2 = forward.x;
  const z1 = BOARD_MODEL_DIRECTION.z;
  const z2 = forward.z;
  const dot = x1 * x2 + z1 * z2;
  const det = x1 * z2 - z1 * x2;
  const angle = Math.atan2(det, dot);

  // Move Y-axis to the center of the block, rotate and move Y-axis back
  relative
    .subtract(CENTERING_VECTOR)
    .rotateAroundY(-angle)
    .add(CENTERING_VECTOR);

  // Location in the world
  const location = block.location.add(relative);
  return location;
}

function findArmorstandAtSquare(block: Block, type: string, square: Square) {
  const location = getSquareLocation(block, square);
  location.y = location.y + 0.2;

  const entities = location.getNearbyEntities(0.01, 0.1, 0.01);

  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;
      if (armorstand.helmet.itemMeta.customModelData === ModelData[type]) {
        if (armorstand.customName === square) {
          return armorstand;
        }
      }
    }
  }
}

function findArmorstand(block: Block, type: string) {
  const tabletop = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = tabletop.getNearbyEntities(0.4, 0.1, 0.4);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;
      if (armorstand.helmet.itemMeta.customModelData === ModelData[type]) {
        return armorstand;
      }
    }
  }
  return null;
}

function getChessNotation(block: Block, position: Vector) {
  const relative = getRelativeVector(position, block);

  // Algebraic notation ("a1", "h6", "b7" etc.)
  const letter_index = Math.floor(relative.z * 8);
  const letter = LETTERS[letter_index];
  const number = Math.floor(relative.x * 8) + 1;

  return (letter + number) as Square;
}

function getRelativeVector(position: Vector, block: Block) {
  const location = block.location.toVector();
  const relative = position.subtract(location);

  // Get the direction of the block
  const data = (block.blockData as unknown) as Directional;
  const facing = data.facing;
  const forward = facing.direction;

  // Calculate the angle between blocks direction and the direction of the model
  const x1 = BOARD_MODEL_DIRECTION.x;
  const x2 = forward.x;
  const z1 = BOARD_MODEL_DIRECTION.z;
  const z2 = forward.z;
  const dot = x1 * x2 + z1 * z2;
  const det = x1 * z2 - z1 * x2;
  const angle = Math.atan2(det, dot);

  // Move Y-axis to the center of the block, rotate and move Y-axis back
  relative
    .subtract(CENTERING_VECTOR)
    .rotateAroundY(angle)
    .add(CENTERING_VECTOR);

  return relative;
}

function roundToCenter(position: Vector) {
  const x = position.x;
  const z = position.z;
  position.x = (Math.floor(x * 8) + 0.5) / 8;
  position.z = (Math.floor(z * 8) + 0.5) / 8;

  return position;
}

function getSquare(x: number, y: number) {
  const letter = LETTERS[y];
  const number = x + 1;
  return (letter + number) as Square;
}

export function createBoard(block: Block) {
  const board = chess.board();

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const piece = board[i][j];
      if (piece) {
        const x = 7 - i;
        const type = getToken(piece.type, piece.color);
        const square = getSquare(x, j);
        const armorstand = createArmorstand(type, block.world, square);
        const destination = getSquareLocation(block, square);
        armorstand.teleport(destination);
      }
    }
  }
}

function makeChangesToBoard(block: Block, move: Move) {
  // Capture a piece
  if (move.captured) {
    server.broadcastMessage('captured');
    const victim = getToken(move.captured, invert(move.color));
    const capturedArmorstand = findArmorstandAtSquare(block, victim, move.to);
    capturedArmorstand?.remove();
  }

  // An passant capture
  if (move.flags.includes('e')) {
    let row = +move.to.charAt(1);
    row = row === 6 ? 5 : 4;
    const square = (move.to.charAt(0) + row) as Square;

    const victim = getToken('p', invert(move.color));
    const capturedArmorstand = findArmorstandAtSquare(block, victim, square);
    capturedArmorstand?.remove();
  }

  // Kingside castling
  if (move.flags.includes('k')) {
    const whiteRook: Castling = { type: 'R', from: 'h1', to: 'f1' };
    const blackRook: Castling = { type: 'r', from: 'h8', to: 'f8' };

    const rook = move.color === 'w' ? whiteRook : blackRook;
    const rookArmorstand = findArmorstandAtSquare(block, rook.type, rook.from);
    if (!rookArmorstand) return;
    const destination = getSquareLocation(block, rook.to);
    rookArmorstand.setCustomName(rook.to);
    rookArmorstand.teleport(destination);
  }

  // Queenside castling
  if (move.flags.includes('q')) {
    const whiteRook: Castling = { type: 'R', from: 'a1', to: 'd1' };
    const blackRook: Castling = { type: 'r', from: 'a8', to: 'd8' };

    const rook = move.color === 'w' ? whiteRook : blackRook;
    const rookArmorstand = findArmorstandAtSquare(block, rook.type, rook.from);
    if (!rookArmorstand) return;
    const destination = getSquareLocation(block, rook.to);
    rookArmorstand.setCustomName(rook.to);
    rookArmorstand.teleport(destination);
  }

  // Get the moved piece
  const type = getToken(move.piece, move.color);
  let armorstand = findArmorstandAtSquare(block, type, move.from);
  if (!armorstand) return;

  // Promotion
  if (move.promotion) {
    const promotionType = getToken(move.promotion, move.color);
    armorstand.helmet.itemMeta.customModelData = ModelData[promotionType];
  }

  // Move the piece
  const destination = getSquareLocation(block, move.to);
  armorstand.setCustomName(move.to);
  armorstand.teleport(destination);
}

function createArmorstand(type: string, world: World, square?: Square) {
  const armorstand = world.spawnEntity(
    new Location(world, 0, 0, 0),
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  const helmet = new ItemStack(PIECE_MATERIAL);
  const meta = helmet.getItemMeta();
  meta.setCustomModelData(new Integer(ModelData[type]));
  helmet.setItemMeta(meta);

  armorstand.helmet = helmet;
  armorstand.setSmall(true);
  armorstand.setVisible(false);
  armorstand.setSilent(true);
  armorstand.setDisabledSlots(
    EquipmentSlot.CHEST,
    EquipmentSlot.FEET,
    EquipmentSlot.HAND,
    EquipmentSlot.LEGS,
    EquipmentSlot.OFF_HAND,
  );
  armorstand.setGravity(false);
  armorstand.setInvulnerable(true);
  armorstand.setSilent(true);
  armorstand.setCollidable(false);
  armorstand.setCanMove(false);
  armorstand.setCanPickupItems(false);

  if (square) armorstand.setCustomName(square);
  armorstand.setCustomNameVisible(false);
  return armorstand;
}

export function destroyBoard(block: Block) {
  const tabletop = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = tabletop.getNearbyEntities(0.4, 0.1, 0.4);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      entity.remove();
    }
  }
}

function invert(color: 'w' | 'b') {
  return color === 'w' ? 'b' : 'w';
}
