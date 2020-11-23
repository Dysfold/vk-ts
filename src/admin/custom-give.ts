import { Player } from 'org.bukkit.entity';
import { CustomItem } from '../common/items/CustomItem';
import { Material } from 'org.bukkit';
import { PlayerInventory } from 'org.bukkit.inventory';

registerCommand('customitem', (sender, label, args) => {
  if (!sender.isOp()) return;

  sender.sendMessage('/customitem <id> <type> <modelid?> <name?>');
  if (args.length < 2) return;

  if (sender instanceof Player) {
    const player = sender as Player;

    const id = Number.parseInt(args[0]);
    const type = Material.getMaterial(args[1]);
    const modelId = Number.parseInt(args[2]) || 0;
    const name = args[3] || undefined;

    if (!type) return;

    const item = new CustomItem({
      id: id,
      type: type,
      modelId: modelId,
      name: name,
    });

    (player.inventory as PlayerInventory).addItem(item.create());
  }
});
