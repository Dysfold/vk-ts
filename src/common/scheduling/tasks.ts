import { Runnable } from 'java.lang';

function getRunnable(callback: () => void) {
  const CustomRunnable = Java.extend(Runnable, {
    run() {
      callback();
    },
  });
  return new CustomRunnable();
}

export function runTask(callback: () => void) {
  return new Promise<void>((resolve) => {
    server.scheduler.runTask(
      __plugin,
      getRunnable(() => {
        callback();
        resolve();
      }),
    );
  });
}
