import { Integer } from 'java.lang';
import { Location, Material, World } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { ArmorStand, EntityType } from 'org.bukkit.entity';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { RayTraceResult, Vector } from 'org.bukkit.util';
import { Game } from './engine';
const engine = new Game(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
);

const fenString = engine.toFen(); // getting fen string

engine.turn; // one of ['w', 'b']

const BOARD_MATERIAL = Material.GRAY_GLAZED_TERRACOTTA;
const PIECE_MATERIAL = Material.HEART_OF_THE_SEA;

interface Vec2 {
  x: number;
  y: number;
}

interface PieceItem {
  [key: string]: ItemStack;
}

const PieceItems: PieceItem = {
  b: createPiece(2),
  k: createPiece(3),
  n: createPiece(4),
  p: createPiece(5),
  q: createPiece(6),
  r: createPiece(7),

  selection: createPiece(8),

  B: createPiece(9),
  K: createPiece(10),
  N: createPiece(11),
  P: createPiece(12),
  Q: createPiece(13),
  R: createPiece(14),
};

function createPiece(customModelData: number) {
  const item = new ItemStack(PIECE_MATERIAL);
  const meta = item.getItemMeta();
  meta.setCustomModelData(new Integer(customModelData));
  item.setItemMeta(meta);
  return item;
}

export function clickBoard(raytrace: RayTraceResult) {
  const block = raytrace.hitBlock;
  if (!block) return;
  if (block.type !== BOARD_MATERIAL) return;

  const selection = getChessCoordinates(block, raytrace.hitPosition);
  const squareCenter = roundToCenter(raytrace.hitPosition);

  const world = block.world;
  const squareLocation = new Location(
    world,
    squareCenter.x,
    squareCenter.y,
    squareCenter.z,
  );

  server.broadcastMessage(selection);
}

const BOARD_MODEL_DIRECTION = { x: -1, z: 0 };
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const CENTERING_VECTOR = new Vector(0.5, 0, 0.5);

function getChessCoordinates(block: Block, position: Vector) {
  const relative = getRelativeVector(position, block);

  // Algebraic notation ("a1", "h6", "b7" etc.)
  const letter_index = Math.floor(relative.z * 8);
  const letter = LETTERS[letter_index];
  const number = Math.floor(relative.x * 8) + 1;

  return letter + number;
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
  position.y = (Math.floor(z * 8) + 0.5) / 8;

  return position;
}

export function createBoard(block: Block) {
  // The fenstring start from black rook, which is at [0 7]
  let y = 0;
  let x = 7;

  let row = '';
  for (const char of fenString) {
    if (char === ' ') {
      break;
    } else if (char === '/') {
      row = '';
      x--;
      y = 0;
    } else if (char >= '0' && char <= '9') {
      const empty = +char;
      row = row + '0'.repeat(empty);
      y += empty;
    } else {
      row = row + char;
      const armorstand = createArmorstand(char, block.world);
      moveArmorstand(armorstand, block, x, y);
      y++;
    }
  }
}

function createArmorstand(type: string, world: World) {
  const armorstand = world.spawnEntity(
    new Location(world, 0, 0, 0),
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  armorstand.helmet = PieceItems[type];
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
  // armorstand.setCustomName('%CHESS%');
  // armorstand.setCustomNameVisible(false);
  return armorstand;
}

function moveArmorstand(
  armorstand: ArmorStand,
  block: Block,
  x: number,
  y: number,
) {
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
  armorstand.teleport(location);
}

export function destroyBoard(block: Block) {
  const location = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = location.getNearbyEntities(0.4, 0.1, 0.4);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      entity.remove();
    }
  }
}