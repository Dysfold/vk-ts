import { Location, SoundCategory } from 'org.bukkit';

export function playSetUnlockedSound(location: Location) {
  location.world.playSound(
    location,
    'custom.lock',
    SoundCategory.PLAYERS,
    0.4,
    1.7,
  );
}

export function playSetLockedSound(location: Location) {
  location.world.playSound(
    location,
    'custom.lock',
    SoundCategory.PLAYERS,
    0.4,
    1.1,
  );
}

export function playWrongKeySound(location: Location) {
  location.world.playSound(
    location,
    // 'minecraft:block.stone_button.click_on',
    'minecraft:block.iron_trapdoor.open',
    SoundCategory.PLAYERS,
    0.7,
    1.5,
  );
}

export function playAddLockSound(location: Location) {
  location.world.playSound(
    location,
    'minecraft:block.stone_button.click_on',
    // 'minecraft:block.iron_trapdoor.open',
    SoundCategory.PLAYERS,
    0.7,
    1.5,
  );
}
