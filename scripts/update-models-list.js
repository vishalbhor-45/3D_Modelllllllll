// Script to automatically update models.json with all .glb files in public/models/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../public/models');
const modelsJsonPath = path.join(modelsDir, 'models.json');

try {
  // Read all files in the models directory
  const files = fs.readdirSync(modelsDir);
  
  // Filter only .glb files
  const glbFiles = files.filter(file => file.toLowerCase().endsWith('.glb'));
  
  // Create models.json
  const modelsData = {
    models: glbFiles.sort()
  };
  
  fs.writeFileSync(modelsJsonPath, JSON.stringify(modelsData, null, 2));
  
  console.log(`✅ Updated models.json with ${glbFiles.length} models:`);
  glbFiles.forEach(file => console.log(`   - ${file}`));
} catch (error) {
  console.error('Error updating models.json:', error);
  process.exit(1);
}

