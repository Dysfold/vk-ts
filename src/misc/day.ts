import { Bukkit } from 'org.bukkit';

const TICKS = 2;
const NIGHT_BEGIN = 13000;
const NIGHT_END = 23000;
let count = 0;

// We assume that first world is the default world
const world = Bukkit.server.worlds[0];

setInterval(() => {
  const time = world.time;
  if (time > NIGHT_BEGIN && time < NIGHT_END) {
    // Night
    world.time++;
  } else {
    // Day

    // Only add time every 8th time -> Slower day
    // During the day, time will increase by 1 every TICKS*8 (Ticks)
    count = (count + 1) % 8;
    if (count == 0) {
      world.time++;
    }
  }
}, TICKS * 50);
