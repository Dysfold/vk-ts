import * as _ from 'lodash';
import { persist } from './common/persist';

const list = persist({
  counter: 0,
});
list.counter++;
console.log(list.counter);

server.broadcastMessage('VK plugin loaded!');
server.broadcastMessage('Jei !');
server.broadcastMessage(_.sum([1, 2, 3]).toString());
