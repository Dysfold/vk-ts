import { Player } from 'org.bukkit.entity';
import { Paths, Files } from 'java.nio.file';
import { config } from './config';
import {
  PlayerJoinEvent,
  AsyncPlayerPreLoginEvent,
} from 'org.bukkit.event.player';
import { readJSON, writeJSON } from './json';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerData {}

const indexFile = config.DATA_FOLDER.resolve('players').resolve('index.json');

export class Players {
  private static loaded: Record<string, any> = {};
  /**
   * Dictionary mapping name to a uuid
   */
  private static index: Record<string, string> = {};

  static init() {
    this.index = readJSON(indexFile);

    const online = [...server.onlinePlayers];
    online.forEach((p) => this.load(p.uniqueId.toString(), p.name));

    registerEvent(AsyncPlayerPreLoginEvent, ({ uniqueId, name }) => {
      this.load(uniqueId.toString(), name);
    });

    addUnloadHandler(() => Players.unload());
  }

  private static getFile(uuid: string) {
    return config.DATA_FOLDER.resolve('players').resolve(`${uuid}.json`);
  }

  private static load(uuid: string, name?: string) {
    console.log(`Loading ${uuid}`);

    if (name) {
      this.index[name] = uuid;
    }

    if (this.loaded[uuid]) {
      return this.loaded[uuid];
    }
    const file = this.getFile(uuid);
    this.loaded[uuid] = readJSON(file);
    return this.loaded[uuid];
  }

  private static unload(uuid?: string) {
    if (!uuid) {
      writeJSON(indexFile, this.index);
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
    return this.load(uuid, player.name);
  }
}

Players.init();
