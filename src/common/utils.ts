import { Path, Files } from 'java.nio.file';
import * as _ from 'lodash';

const MessageDigest = java.security.MessageDigest;

/**
 * Calculate a hash of the given string
 * @param algorithm Name of the algorithm to use, defaults to 'MD5'
 */
export function hash(str: string, algorithm = 'MD5') {
  const md = MessageDigest.getInstance(algorithm);
  md.update((str as any).getBytes());
  const digest = [...md.digest()] as number[];
  return digest.map((byte) => (byte + 128).toString(16)).join('');
}

/**
 * Ensures that `file` exists. If it doesn't, this creates the file.
 * @param file
 */
export function ensureFile(file: Path) {
  if (Files.exists(file)) {
    return;
  }
  Files.createFile(file);
}

/**
 * Deeply walk an object, calling `callback` on all of it's leaf nodes
 * @param obj Object to traverse
 * @param callback Callback to call
 */
export function walk(
  obj: any,
  callback: (
    value: any,
    key: string | number,
    path: (string | number)[],
  ) => void,
  path: (string | number)[] = [],
) {
  if (!(obj instanceof Object)) {
    callback(obj, _.last(path) ?? '', path);
    return;
  }

  for (const key in obj) {
    const val = obj[key];
    if (Array.isArray(val)) {
      val.forEach((e, i) => walk(e, callback, [...path, key, i]));
      continue;
    }
    walk(val, callback, [...path, key]);
  }
}
