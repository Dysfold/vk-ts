import * as _ from 'lodash';
import { persist } from './common/persist';

const list = persist(Array<number>());

server.broadcastMessage('VK plugin loaded!');
server.broadcastMessage('Jei !');
server.broadcastMessage(_.sum([1, 2, 3]).toString());
