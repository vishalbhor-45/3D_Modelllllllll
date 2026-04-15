// Script to convert Excel file to JSON - EXACT data preservation
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelFilePath = path.join(__dirname, '../CH-967+030.xlsx');
const outputJsonPath = path.join(__dirname, '../CH-967+030.json');

try {
  console.log('Reading Excel file:', excelFilePath);
  
  // Read the Excel file with minimal processing
  const workbook = XLSX.readFile(excelFilePath, {
    cellDates: false, // Keep dates as strings
    cellNF: false, // Don't parse number formats
    cellStyles: false, // Don't include styles
    sheetStubs: true, // Include empty cells
  });
  
  const sheetNames = workbook.SheetNames;
  console.log('Found sheets:', sheetNames);
  
  const result = {};
  
  sheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the exact range from the worksheet
    const range = worksheet['!ref'];
    if (!range) {
      console.log(`  Sheet "${sheetName}": No data found`);
      result[sheetName] = { data: [] };
      return;
    }
    
    const decodedRange = XLSX.utils.decode_range(range);
    const maxRow = decodedRange.e.r;
    const maxCol = decodedRange.e.c;
    
    console.log(`\nProcessing sheet "${sheetName}":`);
    console.log(`  Range: ${range} (${maxRow + 1} rows x ${maxCol + 1} columns)`);
    
    // Read as array of arrays - this preserves exact data
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Array of arrays
      defval: '', // Use empty string for empty cells
      raw: true, // Don't convert values - keep them as they are
      blankrows: true, // Include blank rows
      range: range, // Use the exact range
    });
    
    console.log(`  Rows read: ${rawData.length}`);
    
    // Count non-empty rows
    const nonEmptyRows = rawData.filter(row => 
      Array.isArray(row) && row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    ).length;
    
    console.log(`  Non-empty rows: ${nonEmptyRows}`);
    
    // Store exactly as read from Excel
    result[sheetName] = {
      range: range,
      totalRows: maxRow + 1,
      totalColumns: maxCol + 1,
      actualRows: rawData.length,
      data: rawData // Exact data as array of arrays
    };
  });
  
  // Write to JSON file
  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  
  console.log(`\n✅ Successfully converted Excel to JSON`);
  console.log(`   Output: ${outputJsonPath}`);
  
  // Calculate file size
  const stats = fs.statSync(outputJsonPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   Output file size: ${fileSizeMB} MB`);
  
  // Verify data integrity
  console.log(`\n📊 Data Summary:`);
  sheetNames.forEach((sheetName) => {
    const sheet = result[sheetName];
    console.log(`   ${sheetName}:`);
    console.log(`     Range: ${sheet.range}`);
    console.log(`     Total rows in Excel: ${sheet.totalRows}`);
    console.log(`     Rows in JSON: ${sheet.actualRows}`);
    console.log(`     Columns: ${sheet.totalColumns}`);
  });
  
} catch (error) {
  console.error('❌ Error converting Excel to JSON:', error.message);
  console.error(error.stack);
  process.exit(1);
}
