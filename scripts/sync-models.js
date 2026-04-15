// Sync models.json with actual .glb files in public/models
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, "../public/models");
const modelsJsonPath = path.join(modelsDir, "models.json");

function getGlbFiles() {
  const files = fs.readdirSync(modelsDir, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".glb"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function writeModelsJson(glbFiles) {
  const json = { models: glbFiles };
  fs.writeFileSync(modelsJsonPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

function verifyModelsJson() {
  const data = JSON.parse(fs.readFileSync(modelsJsonPath, "utf8"));
  if (!Array.isArray(data.models)) {
    throw new Error('Invalid models.json: expected "models" array.');
  }

  const missing = data.models.filter((file) => !fs.existsSync(path.join(modelsDir, file)));
  if (missing.length > 0) {
    throw new Error(`models.json references missing files: ${missing.join(", ")}`);
  }
}

try {
  if (!fs.existsSync(modelsDir)) {
    throw new Error(`Models directory not found: ${modelsDir}`);
  }

  const glbFiles = getGlbFiles();
  writeModelsJson(glbFiles);
  verifyModelsJson();

  console.log(`✅ Synced models.json with ${glbFiles.length} model(s):`);
  glbFiles.forEach((file) => console.log(`   - ${file}`));
} catch (error) {
  console.error("❌ Failed to sync models:", error.message || error);
  process.exit(1);
}

