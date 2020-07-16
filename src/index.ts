import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';

const data = Players.get('uuid');

server.broadcastMessage(JSON.stringify(data));
