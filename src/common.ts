import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

export const currentModuleDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRootPath = path.resolve(currentModuleDir, "..");
export const distPath = path.join(projectRootPath, "dist");
export const mkDist = () => fs.mkdirSync(distPath, { recursive: true });
