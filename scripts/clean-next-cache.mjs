import fs from "fs"; 
import path from "path";

const root = process.cwd();
for (const d of [".next", ".next-dev", "node_modules/.cache"]) {
  try { 
    fs.rmSync(path.join(root, d), { recursive: true, force: true }); 
  } catch {}
}