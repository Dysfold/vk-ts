import * as _ from 'lodash';
import { persist } from './common/persist';
import './common/players';

//Players.get(server.onlinePlayers[0]);

server.broadcastMessage('VK plugin loaded!');
server.broadcastMessage('Jei !');
server.broadcastMessage(_.sum([1, 2, 3]).toString());
