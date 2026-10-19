import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const RUNTIME_DIR = path.join(os.tmpdir(), "freight-desk");

/**
 * Vercel functions can read the deployed project and can write only under the
 * OS temp directory. Local `next dev` keeps using `data/` so the JSON files
 * stay the record on disk.
 */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export function bundledDataFile(filename: string): string {
  return path.join(process.cwd(), "data", filename);
}

export function runtimeDataFile(filename: string): string {
  if (isVercelRuntime()) return path.join(RUNTIME_DIR, filename);
  return bundledDataFile(filename);
}

/**
 * Read the writable copy when it exists. On Vercel, the first request in an
 * instance falls back to the JSON file that shipped with the deployment.
 */
export async function readRuntimeJson(filename: string): Promise<string> {
  const runtimePath = runtimeDataFile(filename);
  try {
    return await fs.readFile(runtimePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (!isVercelRuntime()) throw error;
  }
  return fs.readFile(bundledDataFile(filename), "utf8");
}

export async function writeRuntimeJson(
  filename: string,
  contents: string
): Promise<void> {
  const filePath = runtimeDataFile(filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}
