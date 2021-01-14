import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { CustomItem } from '../common/items/CustomItem';

const CUSTOM_ITEM_TYPES = new Map([
  ['misc', Material.SHULKER_SHELL],
  ['tool', Material.IRON_HOE],
  ['sword', Material.IRON_SWORD],
  ['hat', Material.LEATHER_BOOTS],
  ['food', Material.DRIED_KELP],
  ['throwable', Material.SNOWBALL],
  ['bottle', Material.GLASS_BOTTLE],
  ['hidden', Material.HEART_OF_THE_SEA],
  ['molten', Material.IRON_INGOT],
  ['smithing', Material.BLAZE_ROD],
  ['money', Material.PRISMARINE_SHARD],
  ['card', Material.PRISMARINE_CRYSTALS],
  ['shield', Material.SHIELD],
  ['drinks', Material.POTION],
]);
const ALIASES = [...CUSTOM_ITEM_TYPES.keys()];

registerCommand(
  'customitem',
  (sender, _label, args) => {
    if (args.length < 2) return;

    if (sender instanceof Player) {
      const player = sender as Player;

      const type =
        CUSTOM_ITEM_TYPES.get(args[0]) || Material.getMaterial(args[0]);
      const id = Number.parseInt(args[1]);

      const name = args[2] || undefined;
      const modelId = Number.parseInt(args[3]) || id;

      if (!type) return;

      const item = new CustomItem({
        id: id,
        type: type,
        modelId: modelId,
        name: name,
      });

      player.inventory.addItem(item.create());
    }
  },
  {
    completer: (_sender, _alias, args) => {
      switch (args.length) {
        case 1:
          return ALIASES;
        default:
          return [];
      }
    },
    executableBy: 'players',
    description: '/customitem <type> <id> <name?> <modelId?>',
  },
);
