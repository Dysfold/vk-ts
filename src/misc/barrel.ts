import { Material } from 'org.bukkit';
import { BlockFace } from 'org.bukkit.block';
import { setBlockDrops, bindItemBlock } from '../common/items/drops';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';
import { BlockPlaceEvent } from 'org.bukkit.event.block';
import { text, translate } from 'craftjs-plugin/chat';

// Uses some of barrel block states for other blocks

/**
 * Normal (Vanilla) barrel.
 */
const Barrel = new CustomBlock({
  type: Material.BARREL,
  state: {
    facing: 'up',
  },
});
const BarrelItem = new CustomItem({
  id: 0,
  type: Material.BARREL,
});
bindItemBlock(BarrelItem, {}, Barrel, {});

const Bookshelf = new CustomBlock({
  type: Material.BARREL,
  state: {
    facing: 'down',
  },
});
const BookshelfItem = new CustomItem({
  id: 1,
  name: translate('block.minecraft.bookshelf'),
  type: Material.BARREL,
});
bindItemBlock(BookshelfItem, {}, Bookshelf, {});

const Dresser = new CustomBlock({
  type: Material.BARREL,
  state: {
    facing: ['north', 'south', 'east', 'west'],
  },
});
const DresserItem = new CustomItem({
  id: 2,
  name: text('Lipasto'),
  type: Material.BARREL,
});
setBlockDrops(Dresser, [{ item: DresserItem.create({}), rarity: 1, count: 1 }]);

// Handle placement on our own to get direction correctly
const dresserFaces: CustomBlock<any>[] = [];
dresserFaces.push(new CustomBlock(Dresser, { state: { facing: 'north' } }));
dresserFaces.push(new CustomBlock(Dresser, { state: { facing: 'south' } }));
dresserFaces.push(new CustomBlock(Dresser, { state: { facing: 'east' } }));
dresserFaces.push(new CustomBlock(Dresser, { state: { facing: 'west' } }));

DresserItem.event(
  BlockPlaceEvent,
  (event) => event.itemInHand,
  async (event) => {
    let block;
    switch (event.player.facing) {
      case BlockFace.NORTH:
        block = dresserFaces[1];
        break;
      case BlockFace.SOUTH:
        block = dresserFaces[0];
        break;
      case BlockFace.EAST:
        block = dresserFaces[3];
        break;
      case BlockFace.WEST:
        block = dresserFaces[2];
        break;
      default:
        block = Dresser;
    }
    block.create(event.block, {});
  },
);
