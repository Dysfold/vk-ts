import * as yup from 'yup';

export type Newable<T> = new (...args: any[]) => T;

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
