import { Material } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { ChestLock } from './ChestLock';
import { DoorLock } from './DoorLock';
import { LecternLock } from './LecternLock';
import { TrapDoorLock } from './TrapDoorLock';

const BLOCK_LOCKS = [ChestLock, DoorLock, LecternLock, TrapDoorLock];

const LOCKABLE_MATERIALS = new Set<Material>();
BLOCK_LOCKS.forEach((lock) => {
  lock.materials.forEach((type) => {
    LOCKABLE_MATERIALS.add(type);
  });
});

export function isLockableMaterial(material: Material) {
  return LOCKABLE_MATERIALS.has(material);
}

export function getLockClass(block: Block) {
  for (const LockClass of BLOCK_LOCKS) {
    if (LockClass.check(block)) return LockClass;
  }
}
