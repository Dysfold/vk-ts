import { Chess, ChessInstance, Move, Square } from 'chess.js';
import { Integer } from 'java.lang';
import { Location, Material, World } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { RayTraceResult, Vector } from 'org.bukkit.util';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const BOARD_MATERIAL = Material.GRAY_GLAZED_TERRACOTTA;
const PIECE_MATERIAL = Material.HEART_OF_THE_SEA;
const BOARD_MODEL_DIRECTION = { x: -1, z: 0 };
const LETTERS = 'abcdefgh'.split('');
const CENTERING_VECTOR = new Vector(0.5, 1, 0.5);

const games = new Map<string, ChessInstance>();

const Colors: { [key: string]: string } = {
  w: 'Valkoinen',
  b: 'Musta',
};

const ModelData = new Map<string, number>([
  // Black pieces (color "b" + symbol)
  ['bb', 2],
  ['bk', 3],
  ['bn', 4],
  ['bp', 5],
  ['bq', 6],
  ['br', 7],
  // White pieces (color "w" + symbol)
  ['wb', 9],
  ['wk', 10],
  ['wn', 11],
  ['wp', 12],
  ['wq', 13],
  ['wr', 14],
  // Other
  ['mark', 8],
  ['engine', 15],
]);

interface Castling {
  type: string;
  from: Square;
  to: Square;
}

function getToken(char: string, color: 'w' | 'b') {
  return color + char;
}

export function clickBoard(raytrace: RayTraceResult, player: Player) {
  const block = raytrace.hitBlock;
  if (!block) return;
  if (block.type !== BOARD_MATERIAL) return;
  const world = block.world;

  let chess = games.get(block.location.toString());
  const engine = getEngineArmorStand(block);

  if (!chess) {
    // No active chess instances were found. Creating a new one from backup
    chess = new Chess(engine.customName || undefined);
    games.set(block.location.toString(), chess);
  }

  const selection = getChessNotation(block, raytrace.hitPosition);
  const squareCenter = roundToCenter(raytrace.hitPosition);

  const squareLocation = new Location(
    world,
    squareCenter.x,
    squareCenter.y,
    squareCenter.z,
  );

  let marker = findArmorstand(block, 'mark');

  const color = chess.turn();
  const isAllied = chess.get(selection)?.color == color;

  // Select source
  if (isAllied) {
    marker?.remove();
    marker = createArmorstand('mark', world);

    marker.teleport(squareLocation);
  }

  // Select destination
  else if (marker) {
    const destination = selection;

    // Get previously selected source
    const armorstandLoc = marker.location.toVector();
    const source = getChessNotation(block, armorstandLoc);

    const move =
      chess.move({ from: source, to: destination }) ||
      // Automatic promotion to a queen
      chess.move({ from: source, to: destination, promotion: 'q' });

    if (move) {
      // Update storage
      engine.customName = chess.fen();

      // Update pieces on the block
      updateBoard(block, move);

      // Announce if game state changes
      if (chess.in_checkmate()) {
        announce(block, 'Shakkimatti', color);
      } else if (chess.in_check()) {
        announce(block, 'Shakki');
      } else if (chess.in_stalemate()) {
        announce(block, 'Tasapeli');
      } else if (chess.in_draw()) {
        announce(block, 'Patti');
      }
    } else {
      // Wrong move
      player.sendTitle('§4x', '', 0, 30, 5);
    }

    marker.remove();
  }
}

function announce(block: Block, state: string, winner?: 'w' | 'b') {
  const msg = winner ? `${Colors[winner]} voittaa!` : '';
  const entities = block.location.getNearbyEntities(3, 2, 3);
  for (const entity of entities) {
    if (entity.type === EntityType.PLAYER) {
      (entity as Player).sendTitle('§6' + state, msg, 0, 50, 30);
    }
  }
}

function getSquareLocation(block: Block, square: Square) {
  // Square index
  let y = LETTERS.indexOf(square.charAt(0));
  let x = +square.charAt(1) - 1;

  // Center of the square
  x = (x + 0.5) / 8;
  y = (y + 0.5) / 8;

  // Location (relative to the board block)
  const relative = new Vector(x, 1, y);

  // Get the direction of the block
  const data = (block.blockData as unknown) as Directional;
  const facing = data.facing;
  const forward = facing.direction;

  // Calculate the angle between block's direction and the direction of the model
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

  // Location of the square in the world
  return block.location.add(relative);
}

function findArmorstandAtSquare(block: Block, type: string, square: Square) {
  const location = getSquareLocation(block, square);
  location.y = location.y + 0.2;

  const entities = location.getNearbyEntities(0.06, 0.5, 0.06);

  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;
      if (armorstand.helmet.itemMeta.customModelData === ModelData.get(type)) {
        return armorstand;
      }
    }
  }
}

function findArmorstand(block: Block, type: string) {
  const tabletop = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = tabletop.getNearbyEntities(0.5, 0.5, 0.5);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;
      if (armorstand.helmet.itemMeta.customModelData === ModelData.get(type)) {
        return armorstand;
      }
    }
  }
  return null;
}

function getChessNotation(block: Block, position: Vector) {
  const relative = getRelativeVector(position, block);

  // Algebraic notation ("a1", "h6", "b7" etc.)
  const letterIdx = Math.floor(relative.z * 8);
  const letter = LETTERS[letterIdx];
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

function getEngineArmorStand(block: Block) {
  let engine = findArmorstand(block, 'engine');
  if (!engine) {
    engine = createArmorstand('engine', block.world);
    const destination = block.location.add(CENTERING_VECTOR);
    engine.teleport(destination);
    engine.customName = DEFAULT_FEN;
  }
  return engine;
}

export function createBoard(block: Block) {
  const chess = new Chess();
  games.set(block.location.toString(), chess);

  const board = chess.board();

  // Create engine armorstand
  getEngineArmorStand(block);

  // Generate pieces
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const piece = board[i][j];
      if (piece) {
        const x = 7 - i;
        const type = getToken(piece.type, piece.color);
        const square = getSquare(x, j);
        const armorstand = createArmorstand(type, block.world);
        const destination = getSquareLocation(block, square);
        armorstand.teleport(destination);
      }
    }
  }
}

function updateBoard(board: Block, move: Move) {
  // Capture a piece
  if (move.captured) {
    const victim = getToken(move.captured, invert(move.color));
    const capturedArmorstand = findArmorstandAtSquare(board, victim, move.to);
    capturedArmorstand?.remove();
  }

  // An passant capture
  if (move.flags.includes('e')) {
    let row = +move.to.charAt(1);
    // Row of the captured pawn will always be 5 or 4.
    row = row === 6 ? 5 : 4;
    const square = (move.to.charAt(0) + row) as Square;

    const enemyPawn = getToken('p', invert(move.color));
    const capturedArmorstand = findArmorstandAtSquare(board, enemyPawn, square);
    capturedArmorstand?.remove();
  }

  // Kingside castling
  if (move.flags.includes('k')) {
    const whiteRook: Castling = { type: 'R', from: 'h1', to: 'f1' };
    const blackRook: Castling = { type: 'r', from: 'h8', to: 'f8' };

    const rook = move.color === 'w' ? whiteRook : blackRook;
    const rookArmorstand = findArmorstandAtSquare(board, rook.type, rook.from);
    if (!rookArmorstand) return;
    const destination = getSquareLocation(board, rook.to);
    rookArmorstand.setCustomName(rook.to);
    rookArmorstand.teleport(destination);
  }

  // Queenside castling
  if (move.flags.includes('q')) {
    const whiteRook: Castling = { type: 'R', from: 'a1', to: 'd1' };
    const blackRook: Castling = { type: 'r', from: 'a8', to: 'd8' };

    const rook = move.color === 'w' ? whiteRook : blackRook;
    const rookArmorstand = findArmorstandAtSquare(board, rook.type, rook.from);
    if (!rookArmorstand) return;
    const destination = getSquareLocation(board, rook.to);
    rookArmorstand.setCustomName(rook.to);
    rookArmorstand.teleport(destination);
  }

  // Get the moved piece
  const type = getToken(move.piece, move.color);
  const armorstand = findArmorstandAtSquare(board, type, move.from);
  if (!armorstand) return;

  // Promotion
  if (move.promotion) {
    const promotionType = getToken(move.promotion, move.color);
    const helmet = armorstand.helmet;
    const meta = helmet.getItemMeta();
    const cmd = ModelData.get(promotionType) || 0;
    meta.setCustomModelData(new Integer(cmd));
    helmet.setItemMeta(meta);
    armorstand.helmet = helmet;
  }

  // Move the piece
  const destination = getSquareLocation(board, move.to);
  armorstand.setCustomName(move.to);
  armorstand.teleport(destination);
}

function createArmorstand(type: string, world: World) {
  const armorstand = world.spawnEntity(
    new Location(world, 0, 0, 0),
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  const helmet = new ItemStack(PIECE_MATERIAL);
  const meta = helmet.getItemMeta();
  meta.setCustomModelData(new Integer(ModelData.get(type) || 0));
  helmet.setItemMeta(meta);
  armorstand.helmet = helmet;

  armorstand.setSmall(true);
  armorstand.setVisible(false);
  armorstand.setSilent(true);
  armorstand.setGravity(false);
  armorstand.setInvulnerable(true);
  armorstand.setSilent(true);
  armorstand.setCollidable(false);
  armorstand.setCanMove(false);
  armorstand.setCanPickupItems(false);
  armorstand.setMarker(true);
  armorstand.setCustomNameVisible(false);
  armorstand.setDisabledSlots(
    EquipmentSlot.HAND,
    EquipmentSlot.OFF_HAND,
    EquipmentSlot.CHEST,
    EquipmentSlot.LEGS,
    EquipmentSlot.FEET,
  );

  return armorstand;
}

export function destroyBoard(block: Block) {
  games.delete(block.location.toString());
  const tabletop = block.location.add(new Vector(0.5, 0.9, 0.5));
  const entities = tabletop.getNearbyEntities(0.5, 0.5, 0.5);

  const cmdValues = [...ModelData.values()];
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      const armorstand = entity as ArmorStand;

      // Remove only armorstands with proper modeldata
      const cmd = armorstand.helmet.itemMeta.customModelData;
      if (cmdValues.includes(cmd)) {
        entity.remove();
      }
    }
  }
}

function invert(color: 'w' | 'b') {
  return color === 'w' ? 'b' : 'w';
}
