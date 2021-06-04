interface Duration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TICKS_IN_SECOND = 20;
const TICKS_IN_MINUTE = 60 * TICKS_IN_SECOND;
const TICKS_IN_HOUR = 60 * TICKS_IN_MINUTE;
const TICKS_IN_DAY = 24 * TICKS_IN_HOUR;

export function ticksToDuration(ticks: number): Duration {
  const days = Math.floor(ticks / TICKS_IN_DAY);
  const hours = Math.floor((ticks % TICKS_IN_DAY) / TICKS_IN_HOUR);
  const minutes = Math.floor((ticks % TICKS_IN_HOUR) / TICKS_IN_MINUTE);
  const seconds = Math.floor((ticks % TICKS_IN_MINUTE) / TICKS_IN_SECOND);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}
