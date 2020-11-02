import { Material } from 'org.bukkit';
import { EntityType } from 'org.bukkit.entity';
import { EntityDeathEvent } from 'org.bukkit.event.entity';
import { ItemStack } from 'org.bukkit.inventory';
import { SkullMeta } from 'org.bukkit.inventory.meta';

class HeadItem {
  item: ItemStack;
  name: string;
  rarity: number;

  constructor(owner: string, name: string, rarity: number) {
    this.item = new ItemStack(Material.PLAYER_HEAD, 1);
    const skull = this.item.itemMeta as SkullMeta;
    skull.owner = owner;
    skull.displayName = '§r' + name;
    this.item.itemMeta = skull;
    this.name = name;
    this.rarity = rarity;
  }
}

// prettier-ignore
const Heads = new Map<number, HeadItem>([
  [EntityType.CHICKEN.ordinal(),      new HeadItem('MHF_Chicken',   "Kanan pää",        0.001)],
  [EntityType.PIG.ordinal(),          new HeadItem('MHF_Pig',       "Sian pää",         0.001)],
  [EntityType.COW.ordinal(),          new HeadItem('MHF_Cow',       "Lehmän pää",       0.001)],
  [EntityType.WOLF.ordinal(),         new HeadItem('MHF_Wolf',      "Suden pää",        0.001)],
  [EntityType.OCELOT.ordinal(),       new HeadItem('MHF_Ocelot',    "Oselotin pää",     0.001)],
  [EntityType.SHEEP.ordinal(),        new HeadItem('MHF_Sheep',     "Lampaan pää",      0.001)],
  [EntityType.SQUID.ordinal(),        new HeadItem('MHF_Squid',     "Kalmarin pää",     0.001)],
  [EntityType.SLIME.ordinal(),        new HeadItem('MHF_Slime',     "Liman pää",        0.001)],
  [EntityType.ENDERMAN.ordinal(),     new HeadItem('MHF_Enderman',  "Endermanin pää",   0.001)],
]);

registerEvent(EntityDeathEvent, async (event) => {
  const head = Heads.get(event.entity.type.ordinal());
  if (!head) return;
  if (Math.random() > head.rarity) return;
  event.entity.world.dropItem(event.entity.location, head.item);
});
