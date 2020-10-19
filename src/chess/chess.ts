import { Integer } from 'java.lang';
import { Location, Material, World } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Directional } from 'org.bukkit.block.data';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { RayTraceResult, Vector } from 'org.bukkit.util';
import { string } from 'yup';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { Game, Piece, Point } from './engine';
import { Move } from './engine/core/Move';

const engine = new Game(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
);

const fenString = engine.toFen(); // getting fen string

engine.turn; // one of ['w', 'b']

const BOARD_MATERIAL = Material.GRAY_GLAZED_TERRACOTTA;
const PIECE_MATERIAL = Material.HEART_OF_THE_SEA;

const Color: { [key: string]: string } = {
  w: 'Valkoinen',
  b: 'Musta',
};

interface PieceItem {
  [key: string]: ItemStack;
}
const SELECTION_CUSTOM_MODEL_DATA = 8;

const PieceItems: PieceItem = {
  b: createPiece(2),
  k: createPiece(3),
  n: createPiece(4),
  p: createPiece(5),
  q: createPiece(6),
  r: createPiece(7),

  selection: createPiece(SELECTION_CUSTOM_MODEL_DATA),

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

function isAllied(notation: string) {
  const sourcePoint = new Point(notation);
  const piece = engine.getPiece(sourcePoint.x, sourcePoint.y);
  return piece?.color === engine.turn;
}

function selectDestination(src: string, dest: string) {
  const destPoint = new Point(dest);
  const srcPoint = new Point(src);
  const srcPiece = engine.getPiece(srcPoint.x, srcPoint.y);

  const moves = srcPiece?.getMoves() || [];
  const move = new Move(src, dest);

  server.broadcastMessage(moves.length + '0');
  for (const possibleMove of moves) {
    server.broadcastMessage(possibleMove.x + ' ' + possibleMove.y);
    if (possibleMove.x === move.x && possibleMove.y === move.y) {
      return true;
    }
  }

  return false;
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

  let selectionArmorstand = findSelectionArmorstand(block);
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
    const valid = selectDestination(source, destination);

    if (valid) {
      server.broadcastMessage('Siirretään');
      selectionArmorstand.remove();
    } else {
      server.broadcastMessage('Ei voida siirtää');
    }
  } else {
    // cant select
  }

  return;
  /*
  const selectionPoint = new Point(selection);
  const piece = engine.getPiece(selectionPoint.x, selectionPoint.y);

  if (piece) {
    // Clicked a chess piece
    const pieceColor = piece.color;
    if (pieceColor == engine.turn) {
      // Clicked allied piece, set the selection on that
      selectionArmorstand = createArmorstand('selection', world);
      selectionArmorstand.teleport(squareLocation);
      server.broadcastMessage(`Selected: ${selection}`);
    } else {
      // Clicked enemy square, check if source was selected
      if (selectionArmorstand) {
        // Move
        const source = getChessNotation(
          block,
          selectionArmorstand.location.toVector(),
        );
        const sourcePoint = new Point(source);
        const sourcePiece = engine.getPiece(sourcePoint.x, sourcePoint.y);

        server.broadcastMessage(`Move from ${source} to ${selection} ?`);
        const move = new Move(source, selection);

        const moves = sourcePiece?.getMoves() || [];
        server.broadcastMessage(moves.length + '0');
        for (const possibleMove of moves) {
          server.broadcastMessage(possibleMove.x + ' ' + possibleMove.y);
          if (possibleMove.x === move.x && possibleMove.y === move.y) {
            player.sendActionBar('Siirretty');
            selectionArmorstand.remove();
          }
        }
      } else {
        player.sendActionBar(Color[engine.turn] + ' siirtää');
      }
    }
  } else {
    // Clicked an empty square
    if (selectionArmorstand) {
      // Move
      const source = getChessNotation(
        block,
        selectionArmorstand.location.toVector(),
      );
      server.broadcastMessage(`Move from ${source} to ${selection}`);

      const sourcePoint = new Point(source);
      const sourcePiece = engine.getPiece(sourcePoint.x, sourcePoint.y);

      server.broadcastMessage(`Move from ${source} to ${selection} ?`);
      const move = new Move(source, selection);

      const moves = sourcePiece?.getMoves() || [];
      server.broadcastMessage(moves.length + '0');
      for (const possibleMove of moves) {
        server.broadcastMessage(possibleMove.x + ' ' + possibleMove.y);
        if (possibleMove.x === move.x && possibleMove.y === move.y) {
          player.sendActionBar('Siirretty');
          selectionArmorstand.remove();
        }
      }
    } else {
      player.sendActionBar('Valitse nappula ensin');
    }
  }

  // if (!selectionArmorstand) {
  //   // Select sourc
  // } else {
  //   // Source was already selected. Make the move
  //   const source = getChessNotation(
  //     block,
  //     selectionArmorstand.location.toVector(),
  //   );
  //   server.broadcastMessage(`From ${source} to ${selection}`);

  //   selectionArmorstand.remove();
  // }
  */
}

function findSelectionArmorstand(block: Block) {
  const tabletop = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = tabletop.getNearbyEntities(0.4, 0.1, 0.4);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      if (
        (entity as ArmorStand).helmet.itemMeta.customModelData ===
        SELECTION_CUSTOM_MODEL_DATA
      )
        return entity as ArmorStand;
    }
  }
  return null;
}

const BOARD_MODEL_DIRECTION = { x: -1, z: 0 };
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const CENTERING_VECTOR = new Vector(0.5, 0, 0.5);

function getChessNotation(block: Block, position: Vector) {
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
  position.z = (Math.floor(z * 8) + 0.5) / 8;

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
  const tabletop = block.location.add(new Vector(0.5, 1.2, 0.5));
  const entities = tabletop.getNearbyEntities(0.4, 0.1, 0.4);
  for (const entity of entities) {
    if (entity.type === EntityType.ARMOR_STAND) {
      entity.remove();
    }
  }
}
