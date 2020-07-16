import * as yup from 'yup';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerData {
  // TODO
}

export const playerDataSchema = yup.object({}) as yup.Schema<PlayerData>;

export const defaultPlayerData: PlayerData = {};
