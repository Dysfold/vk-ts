const MessageDigest = java.security.MessageDigest;

export function md5(str: string) {
  const md = MessageDigest.getInstance('MD5');
  md.update((str as any).getBytes());
  const digest = [...md.digest()] as number[];
  return digest.map(byte => (byte + 128).toString(16)).join('');
}
