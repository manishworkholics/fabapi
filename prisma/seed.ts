import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Cross-platform __dirname equivalent that works in both CommonJS and ES modules
// In ES modules, use import.meta.url; in CommonJS, use require.main
const __dirname = (() => {
  // ES module path (works when running as ES module in Docker)
  // We need to access import.meta.url at runtime even though TypeScript is configured for CommonJS
  try {
    // Directly access import.meta.url - it exists at runtime in ES module context
    // @ts-expect-error - import.meta is not available in CommonJS TypeScript config, but exists at runtime in ES modules
    const metaUrl: string | undefined = import.meta.url;
    if (metaUrl) {
      return path.dirname(fileURLToPath(metaUrl));
    }
  } catch {
    // import.meta not available, fall through to CommonJS check
  }

  // CommonJS fallback (works with ts-node in CommonJS mode)
  try {
    if (typeof require !== 'undefined' && require.main?.filename) {
      return path.dirname(require.main.filename);
    }
  } catch {
    // require not available, fall through to final fallback
  }

  // Final fallback: use process.cwd() and assume we're in the prisma directory
  return path.join(process.cwd(), 'prisma');
})();

const prisma = new PrismaClient();

interface CSVRow {
  'PCB Manufacturer Name': string;
  Email: string;
  'Phone Contact': string;
  Location: string;
  Employees: string;
  Certifications: string;
  Industries: string;
  Website: string;
  'EMS Type': string;
  'Manufacturing Specifications': string;
  'Assembly Specifications': string;
  Capabilities: string;
  Equipment: string;
  'Constraints/Notes': string;
}

function parseCSV(filePath: string): CSVRow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows: CSVRow[] = [];

  let headers: string[] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let isFirstRow = true;

  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    const nextChar = fileContent[i + 1];

    if (char === '"' && nextChar === '"' && insideQuotes) {
      // Escaped quote
      currentCell += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote state
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }

      // Add last cell
      currentRow.push(currentCell.trim());
      currentCell = '';

      // Process row
      if (currentRow.some((cell) => cell.length > 0)) {
        if (isFirstRow) {
          headers = currentRow;
          isFirstRow = false;
        } else if (currentRow.length === headers.length) {
          const rowObject: any = {};
          headers.forEach((header, index) => {
            rowObject[header] = currentRow[index] || '';
          });
          rows.push(rowObject as CSVRow);
        }
      }

      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Handle last row if file doesn't end with newline
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (
      !isFirstRow &&
      currentRow.length === headers.length &&
      currentRow.some((cell) => cell.length > 0)
    ) {
      const rowObject: any = {};
      headers.forEach((header, index) => {
        rowObject[header] = currentRow[index] || '';
      });
      rows.push(rowObject as CSVRow);
    }
  }

  return rows;
}

async function seedEMSManufacturers() {
  console.log('🌱 Starting EMS Manufacturers seed...');

  // Use path.resolve for better cross-platform compatibility
  const csvPath = path.resolve(__dirname, 'data', 'ems-manufacturers.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    return;
  }

  const rows = parseCSV(csvPath);
  console.log(`📊 Found ${rows.length} rows in CSV`);

  // Clear existing data
  console.log('🗑️  Clearing existing EMS manufacturers...');
  await prisma.eMSManufacturer.deleteMany({});

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      await prisma.eMSManufacturer.create({
        data: {
          name: row['PCB Manufacturer Name'] || '',
          email: row['Email'] || null,
          phone: row['Phone Contact'] || null,
          location: row['Location'] || null,
          employees: row['Employees'] || null,
          certifications: row['Certifications'] || null,
          industries: row['Industries'] || null,
          website: row['Website'] || null,
          emsType: row['EMS Type'] || null,
          manufacturingSpecifications:
            row['Manufacturing Specifications'] || null,
          assemblySpecifications: row['Assembly Specifications'] || null,
          capabilities: row['Capabilities'] || null,
          equipment: row['Equipment'] || null,
          constraints: row['Constraints/Notes'] || null,
        },
      });
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error inserting ${row['PCB Manufacturer Name']}:`,
        error,
      );
    }
  }

  console.log(`✅ Successfully seeded ${successCount} EMS manufacturers`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed to seed ${errorCount} records`);
  }
}

async function main() {
  try {
    await seedEMSManufacturers();
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
