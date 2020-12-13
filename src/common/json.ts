import { Files, Path } from 'java.nio.file';

function ensureJSON(file: Path) {
  if (Files.exists(file)) {
    return;
  }
  Files.createDirectories(file.getParent());
  Files.createFile(file);
  Files.writeString(file, '{}' as any);
}

export function readJSON(file: Path): any {
  ensureJSON(file);
  const data = Files.readString(file);
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function writeJSON<T>(file: Path, data: T): T {
  ensureJSON(file);
  Files.writeString(file, JSON.stringify(data) as any);
  return data;
}
