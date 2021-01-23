import { dataType } from '../common/datas/holder';
import * as yup from 'yup';

export const DeathData = dataType('playerDeathData', {
  isPrisoner: yup.boolean().notRequired(),
  respawnTime: yup.number().required(),
  deathLocation: yup
    .object({
      x: yup.number().required(),
      y: yup.number().required(),
      z: yup.number().required(),
      worldId: yup.string().required(),
    })
    .required(),
});
