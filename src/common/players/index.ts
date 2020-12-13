import { Files } from 'java.nio.file';
import { UUID } from 'java.util';
import { OfflinePlayer } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import { AsyncPlayerPreLoginEvent } from 'org.bukkit.event.player';
import { config } from '../config';
import { applyDefault } from '../data';
import { readJSON, writeJSON } from '../json';
import { defaultPlayerData, PlayerData, playerDataSchema } from '../types';

const indexFile = config.DATA_FOLDER.resolve('players').resolve('index.json');

/**
 * Singleton providing access to custom player data
 */
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

  private static load(uuid: string, name?: string): PlayerData {
    console.log(`Loading ${uuid}`);

    if (name) {
      this.index[name] = uuid;
    }

    if (this.loaded[uuid]) {
      return this.loaded[uuid];
    }
    const file = this.getFile(uuid);
    this.loaded[uuid] = applyDefault(
      readJSON(file),
      defaultPlayerData,
      playerDataSchema,
    );
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

  /**
   * Get a player's custom data
   * @param player Either a player object or a uuid as a string
   * @throws Will throw an error if `player` is not a valid uuid
   */
  static get(player: Player | OfflinePlayer | string) {
    if (typeof player === 'string') {
      // Test if the uuid is valid, throw an error if not
      UUID.fromString(player);
    }

    const [uuid, name] =
      typeof player === 'string'
        ? [player, undefined]
        : [player.uniqueId.toString(), player.name];

    return this.load(uuid, name ?? undefined);
  }

  /**
   * Get player data from a name, online or offline
   * @param name name of the player
   * @returns The player's data, or undefined if the name could not be found
   */
  static fromName(name: string) {
    const uuid = this.index[name];
    if (!uuid) {
      return undefined;
    }
    return this.get(uuid);
  }
}

Players.init();
