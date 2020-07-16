import { Player } from 'org.bukkit.entity';
import { Paths, Files } from 'java.nio.file';
import { config } from './config';
import {
  PlayerJoinEvent,
  AsyncPlayerPreLoginEvent,
} from 'org.bukkit.event.player';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerData {}

export class Players {
  private static loaded: Record<string, any> = {};

  static init() {
    const online = [...server.onlinePlayers];
    online.forEach((p) => this.load(p.uniqueId.toString()));

    registerEvent(AsyncPlayerPreLoginEvent, ({ uniqueId }) => {
      this.load(uniqueId.toString());
    });

    addUnloadHandler(() => Players.unload());
  }

  private static getFile(uuid: string) {
    return config.DATA_FOLDER.resolve('players').resolve(`${uuid}.json`);
  }

  private static load(uuid: string) {
    console.log(`Loading ${uuid}`);
    if (this.loaded[uuid]) {
      return this.loaded[uuid];
    }
    const file = this.getFile(uuid);
    if (!Files.exists(file)) {
      Files.createDirectories(file.getParent());
      Files.createFile(file);
    }
    const contents = Files.readString(file);
    try {
      this.loaded[uuid] = JSON.parse(contents);
    } catch {
      this.loaded[uuid] = {};
    }
    return this.loaded[uuid];
  }

  private static unload(uuid?: string) {
    if (!uuid) {
      for (const player in this.loaded) {
        this.unload(player);
      }
      return;
    }
    if (!this.loaded[uuid]) {
      return;
    }
    const file = this.getFile(uuid);
    Files.writeString(file, JSON.stringify(this.loaded[uuid]) as any);
  }

  static get(player: Player) {
    const uuid = player.uniqueId.toString();
    return this.load(uuid);
  }
}

Players.init();
