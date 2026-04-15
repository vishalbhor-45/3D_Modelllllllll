// Script to convert Excel file to JSON - Key-Value pair structure with separate sub-objects for time-series tables
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert Excel serial date to DD-Mon-YY format
function excelDateToFormattedString(excelSerialDate) {
  if (typeof excelSerialDate !== 'number') {
    return excelSerialDate; // Return as-is if not a number
  }
  
  // Excel serial date: number of days since January 1, 1900
  // But Excel incorrectly treats 1900 as a leap year, so we adjust
  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
  const date = new Date(excelEpoch.getTime() + (excelSerialDate - 1) * 24 * 60 * 60 * 1000);
  
  // Format as DD-Mon-YY (e.g., 23-Jan-25)
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

// Get command line argument for Excel file name, or use default
const excelFileName = process.argv[2] || 'CH+894+285.xlsx';
const excelFilePath = path.join(__dirname, '..', excelFileName);

// Generate output JSON filename from Excel filename
const outputFileName = excelFileName.replace('.xlsx', '.json');
const outputJsonPath = path.join(__dirname, '..', outputFileName);

try {
  console.log('Reading Excel file:', excelFilePath);
  
  // Check if file exists
  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ File not found: ${excelFilePath}`);
    process.exit(1);
  }
  
  // Read the Excel file - preserve date format as strings
  const workbook = XLSX.readFile(excelFilePath, {
    cellDates: false, // Keep dates as numbers (Excel serial date)
    cellNF: false,
    cellStyles: false,
    sheetStubs: true,
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
      result[sheetName] = { data: [], timeSeries: [] };
      return;
    }
    
    const decodedRange = XLSX.utils.decode_range(range);
    const maxRow = decodedRange.e.r;
    const maxCol = decodedRange.e.c;
    
    console.log(`\nProcessing sheet "${sheetName}":`);
    console.log(`  Range: ${range} (${maxRow + 1} rows x ${maxCol + 1} columns)`);
    
    // Read as array of arrays - preserving exact data
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Array of arrays
      defval: null, // Use null for empty cells
      raw: true, // Don't convert values - keep them as they are
      blankrows: false, // Skip blank rows
      range: range, // Use the exact range
    });
    
    console.log(`  Rows read: ${rawData.length}`);
    
    if (rawData.length === 0) {
      result[sheetName] = { data: [], timeSeries: [] };
      return;
    }
    
    const mainData = [];
    const timeSeriesData = [];
    let currentHeaders = null;
    let isTimeSeriesTable = false;
    let currentLatLong = null;
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip empty rows
      if (!Array.isArray(row) || row.length === 0) continue;
      
      // Check if this is a header row
      const firstCell = row[0];
      if (firstCell !== null && firstCell !== undefined && typeof firstCell === 'string') {
        const firstCellLower = firstCell.toLowerCase();
        
        // Check if this is a time-series table header (has "Date" column)
        if (firstCellLower.includes('lat') && row.some(cell => 
          cell !== null && typeof cell === 'string' && cell.toLowerCase().includes('date')
        )) {
          isTimeSeriesTable = true;
          currentHeaders = row.filter((h, idx) => {
            if (h === null || h === undefined || h === '') return false;
            return true;
          }).map(h => String(h));
          currentLatLong = null; // Reset for new time-series table
          console.log(`  Found time-series table header at row ${i + 1}: ${currentHeaders.join(', ')}`);
          continue;
        }
        // Check if this is the main table header (has D_ dates)
        else if (firstCellLower.includes('lat') && row.some(cell => 
          cell !== null && typeof cell === 'string' && cell.includes('D_')
        )) {
          isTimeSeriesTable = false;
          currentHeaders = row.filter((h, idx) => {
            if (h === null || h === undefined || h === '') return false;
            return true;
          }).map(h => String(h));
          console.log(`  Found main table header at row ${i + 1}: ${currentHeaders.join(', ')}`);
          continue;
        }
      }
      
      // Skip if no headers are set yet
      if (!currentHeaders || currentHeaders.length === 0) continue;
      
      // Convert row to object
      const obj = {};
      let hasData = false;
      let rowLatLong = null;
      
      currentHeaders.forEach((header, index) => {
        let value = row[index];
        
        // Convert Excel serial date number to formatted date string
        if (header.toLowerCase().includes('date') && typeof value === 'number') {
          value = excelDateToFormattedString(value);
        }
        
        // Track Lat/Long for time-series tables
        if (isTimeSeriesTable && (header.toLowerCase().includes('lat') || header.toLowerCase().includes('long'))) {
          if (value !== null && value !== undefined && value !== '') {
            rowLatLong = String(value);
          }
        }
        
        // Only include non-null, non-undefined, non-empty values
        if (value !== null && value !== undefined && value !== '') {
          obj[header] = value;
          hasData = true;
        }
      });
      
      // Only add object if it has at least one property
      if (hasData && Object.keys(obj).length > 0) {
        if (isTimeSeriesTable) {
          // Update current Lat/Long if found in this row
          if (rowLatLong) {
            currentLatLong = rowLatLong;
          }
          
          // Add Lat/Long to object if it's missing but we have a current one
          if (!obj.hasOwnProperty('Lat/Long') && !obj.hasOwnProperty('Lat/Lon') && currentLatLong) {
            obj['Lat/Long'] = currentLatLong;
          }
          
          timeSeriesData.push(obj);
        } else {
          mainData.push(obj);
        }
      }
    }
    
    console.log(`  Main data records: ${mainData.length}`);
    console.log(`  Time-series records: ${timeSeriesData.length}`);
    
    // Store both types of data
    result[sheetName] = {
      data: mainData,
      timeSeries: timeSeriesData
    };
  });
  
  // Write to JSON file
  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  
  console.log(`\n✅ Successfully converted Excel to JSON`);
  console.log(`   Input:  ${excelFilePath}`);
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
    console.log(`     Main data: ${sheet.data.length} records`);
    console.log(`     Time-series: ${sheet.timeSeries.length} records`);
    if (sheet.timeSeries.length > 0) {
      console.log(`     Sample time-series date: ${sheet.timeSeries.find(r => r.Date)?.Date || 'N/A'}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error converting Excel to JSON:', error.message);
  console.error(error.stack);
  process.exit(1);
}
