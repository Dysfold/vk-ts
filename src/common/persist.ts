import * as _ from 'lodash';
import { Paths, Files } from 'java.nio.file';
import { hash } from './utils';
import { config } from './config';

const persistantObjects: Record<string, any> = {};
const callers: string[] = [];

const dataFile = config.DATA_FOLDER.resolve('persistant.json');

function load() {
  if (!Files.exists(dataFile)) {
    Files.createFile(dataFile);
    Files.writeString(dataFile, '{}' as any);
  }
  const contents = Files.readString(dataFile);

  const data = JSON.parse(contents);
  for (const key in data) {
    persistantObjects[key] = data[key];
  }
}

function unload() {
  Files.writeString(dataFile, JSON.stringify(persistantObjects) as any);
}

load();
addUnloadHandler(() => unload());

export function persist<T>(value: T): T {
  const caller = _.last(__requireStack);
  if (!caller) {
    throw new Error('Persist called from an unexpected place!');
  }

  const path = Paths.get(__jsdir).relativize(Paths.get(caller).normalize());
  const hashed = hash(path.toString());

  if (callers.includes(hashed)) {
    throw new Error('Persist may only be called once from a file!');
  }

  callers.push(hashed);
  if (!persistantObjects[hashed]) {
    persistantObjects[hashed] = value;
  }
  return persistantObjects[hashed];
}
