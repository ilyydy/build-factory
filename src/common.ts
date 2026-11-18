import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const currentModuleDir = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(currentModuleDir, '..', 'dist');

export function writeArtifact(file: string, content: string) {
  const outputPath = path.join(distPath, file);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
}
