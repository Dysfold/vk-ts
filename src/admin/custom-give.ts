import { Material } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const CUSTOM_ITEM_TYPES = new Map(Object.entries(VkItem));
const ALIASES = Object.keys(VkItem).map((key) => key.toLowerCase());

registerCommand(
  'customitem',
  (sender, _label, args) => {
    if (args.length < 2) return;

    if (sender instanceof Player) {
      const player = sender as Player;

      const type =
        CUSTOM_ITEM_TYPES.get(args[0].toUpperCase()) ??
        Material.getMaterial(args[0]);
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
