import { Material } from "org.bukkit";
import { Biome } from "org.bukkit.block";
import { Action } from "org.bukkit.event.block";
import { PlayerInteractEvent } from "org.bukkit.event.player";
import { EquipmentSlot, ItemStack } from "org.bukkit.inventory";

const GOLD_CHANCE = 0.02;

registerEvent(PlayerInteractEvent, (event) => {
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    if (event.item?.type !== Material.BOWL) return;

    const player = event.player

    if (player.getCooldown(Material.BOWL)) return;

    const block = event.clickedBlock
    if (!block) return;

    const biome = block.biome
    if (biome !== Biome.RIVER && biome !== Biome.FROZEN_RIVER) return;
    player.setCooldown(Material.BOWL, 20);
    if (Math.random() > GOLD_CHANCE) return;

    const water = block.getRelative(event.blockFace);
    if (water.type !== Material.WATER) return;

    if (event.hand === EquipmentSlot.HAND) {
        player.swingMainHand();
    } else {
        player.swingOffHand();
    }

    const offset = player.location.direction
    offset.y = 0
    const location = player.location.add(offset)

    block.world.dropItem(
        location,
        new ItemStack(Material.GOLD_NUGGET, 1)
    );
});
