import { Path, Files } from 'java.nio.file';

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
