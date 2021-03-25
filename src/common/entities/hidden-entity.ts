import { ArmorStand, Entity, ItemFrame } from 'org.bukkit.entity';

/**
 * Checks if the given entity is hidden.
 *
 * Hidden entities are used internally in e.g. smithing and corpse systems.
 * They are usually invisible to players and do not drop their item forms.
 * For example, hidden item frames drop their contents but not themself.
 * Just invisibility should never make an entity 'hidden'.
 * @param entity Entity.
 * @returns If the given entity is hidden.
 */
export function isHiddenEntity(entity: Entity): boolean {
  if (entity instanceof ItemFrame) {
    return !entity.isVisible() && entity.isSilent();
  } else if (entity instanceof ArmorStand) {
    return !entity.isVisible() && entity.isSilent();
  }
  return false;
}
