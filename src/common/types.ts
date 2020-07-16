import * as yup from 'yup';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerData {
  counter: number;
  // TODO
}

export const playerDataSchema = yup.object({
  counter: yup.number(),
}) as yup.Schema<PlayerData>;

export const defaultPlayerData: PlayerData = {
  counter: 0,
};
