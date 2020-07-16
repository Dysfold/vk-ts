import * as _ from 'lodash';
import { persist } from './common/persist';
import { Players } from './common/players';

const data = Players.get(server.onlinePlayers[0]);

server.broadcastMessage(JSON.stringify(data));
