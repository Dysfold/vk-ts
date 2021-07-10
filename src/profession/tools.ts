import { Profession } from './profession';
import { professionById } from './data/profession';

export function isSubordinateProfession(
  leader: Profession,
  subordinate: Profession,
): boolean {
  if (leader.subordinates.includes(subordinate.name)) {
    return true; // Direct subordinate
  } else if (leader.subordinates.length == 0) {
    return false; // Definitely not subordinate of this
  }

  // Not direct subordinate, but could be indirect one
  for (const id of leader.subordinates) {
    const prof = professionById(id);
    if (prof && isSubordinateProfession(prof, subordinate)) {
      return true; // Indirect subordinate
    }
  }
  return false; // Not subordinate
}
