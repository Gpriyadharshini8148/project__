import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TestDataRow, TestSuiteConfig } from '../types/test-data.types';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default test data file path
const DEFAULT_TEST_DATA_PATH = path.resolve(__dirname, '../test-data/TestData.xlsx');

/**
 * Excel Reader Utility
 * Reads test data and test suite configuration from Excel files
 */
export class ExcelReader {
  private workbook: XLSX.WorkBook;

  constructor(filePath: string = DEFAULT_TEST_DATA_PATH) {
    this.workbook = XLSX.readFile(path.resolve(filePath));
  }

  /**
   * Get all test suites from TestSuites sheet
   */
  getAllSuites(suiteSheet: string = 'TestSuites'): TestSuiteConfig[] {
    const sheet = this.getSheet(suiteSheet);
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    const headerIndex = rows.findIndex((row) =>
      String(row[0] || '').trim() === 'SpecFile'
    );

    if (headerIndex === -1) {
      throw new Error(`Header row not found in sheet "${suiteSheet}"`);
    }

    const headers = rows[headerIndex].map((cell) => String(cell || '').trim());
    const dataRows = rows.slice(headerIndex + 1).filter((row) =>
      row.some((cell) => String(cell || '').trim() !== '')
    );

    return dataRows.map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] || '').trim();
      });

      return {
        specFile: record['SpecFile'] || '',
        description: record['Description'] || '',
        tags: record['Tags'] || '',
        environment: record['Environment'] || '',
        executionFlag: record['ExecutionFlag'] || '',
      };
    });
  }

  /**
   * Get enabled test suites
   */
  getEnabledSuites(suiteSheet: string = 'TestSuites'): TestSuiteConfig[] {
    return this.getAllSuites(suiteSheet)
      .filter(s => s.executionFlag.toLowerCase() === 'yes');
  }

  /**
   * Get suite configuration for a specific spec file
   */
  getSuiteConfig(specFile: string, suiteSheet: string = 'TestSuites'): TestSuiteConfig | undefined {
    return this.getAllSuites(suiteSheet)
      .find((suite) => suite.specFile === specFile);
  }

  /**
   * Get enabled spec file names (used by playwright.config.ts)
   */
  getEnabledSpecFiles(suiteSheet: string = 'TestSuites'): string[] {
    return this.getEnabledSuites(suiteSheet).map(s => s.specFile);
  }

  /**
   * Parse test data blocks from TestData sheet
   */
  parseBlocks(dataSheet: string = 'TestData'): Record<string, TestDataRow[]> {
    const sheet = this.getSheet(dataSheet);
    if (!sheet) return {};

    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });

    const blocks: Record<string, TestDataRow[]> = {};
    let currentSuite: string | null = null;
    let headers: string[] = [];

    for (const row of rows) {
      const firstCell = String(row[0] || '').trim();

      // Empty row - reset current suite
      if (row.every(c => String(c).trim() === '')) {
        currentSuite = null;
        headers = [];
        continue;
      }

      // New suite header (starts with TC_)
      if (/^TC_\d+_/.test(firstCell)) {
        currentSuite = firstCell;
        headers = row.map(h => this.toCamelCase(String(h)));
        blocks[currentSuite] = [];
        continue;
      }

      // Data row
      if (currentSuite && headers.length > 0) {
        const record: Record<string, string> = {};
        headers.forEach((key, idx) => {
          record[key] = String(row[idx] || '').trim();
        });
        blocks[currentSuite].push(record as unknown as TestDataRow);
      }
    }

    return blocks;
  }

  /**
   * Get test data for a specific suite
   */
  getSuiteData(suiteName: string, dataSheet: string = 'TestData'): TestDataRow[] {
    const blocks = this.parseBlocks(dataSheet);
    if (!blocks[suiteName]) {
      return [];
    }
    return blocks[suiteName];
  }

  /**
   * Get runnable rows (execution flag = yes)
   */
  getRunnableRows(suiteName: string, dataSheet: string = 'TestData'): TestDataRow[] {
    return this.getSuiteData(suiteName, dataSheet)
      .filter(r => r.executionFlag?.toLowerCase() === 'yes');
  }

  /**
   * Get test data for a spec file (main method to use in tests)
   * Checks both suite-level and row-level execution flags
   */
  getDataForSpec(specFile: string, dataSheet: string = 'TestData', suiteSheet: string = 'TestSuites'): TestDataRow[] {
    const suiteConfig = this.getSuiteConfig(specFile, suiteSheet);
    
    // If suite is not enabled, return empty array
    if (!suiteConfig || suiteConfig.executionFlag.toLowerCase() !== 'yes') {
      return [];
    }

    const suiteEnvironment = suiteConfig.environment.trim().toLowerCase();
    const rows = this.getRunnableRows(specFile, dataSheet);
    
    // Filter by environment if specified
    if (!suiteEnvironment) {
      return rows;
    }

    return rows.filter((row) => {
      const rowEnv = String(row.environment || '').trim().toLowerCase();
      return rowEnv === suiteEnvironment;
    });
  }

  /**
   * Get test data for a test case (returns first runnable row as key-value pairs)
   * This is a convenience method for tests that need a single data row
   */
  getTestDataForTestCase(testCaseName: string, dataSheet: string = 'TestData'): Record<string, string> {
    // Try exact match first
    let rows = this.getRunnableRows(testCaseName, dataSheet);
    
    // If no exact match, try finding by pattern (TC_##_testCaseName)
    if (rows.length === 0) {
      const blocks = this.parseBlocks(dataSheet);
      const matchingKey = Object.keys(blocks).find(key => 
        key.toLowerCase().endsWith(testCaseName.toLowerCase()) ||
        key.toLowerCase().includes(testCaseName.toLowerCase())
      );
      
      if (matchingKey) {
        rows = blocks[matchingKey].filter(r => r.executionFlag?.toLowerCase() === 'yes');
      }
    }
    
    if (rows.length === 0) {
      return {};
    }

    // Return first runnable row as Record<string, string>
    const firstRow = rows[0] as unknown as Record<string, string>;
    return firstRow;
  }

  /**
   * Get a worksheet by name
   */
  private getSheet(name: string): XLSX.WorkSheet | null {
    const sheet = this.workbook.Sheets[name];
    if (!sheet) {
      return null;
    }
    return sheet;
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase())
      .replace(/\s+/g, '');
  }
}

/**
 * Extract test case name from file URL
 */
export function getTestCaseNameFromFile(metaUrl: string): string {
  // Handle both file:// URLs and regular paths
  let fileName: string;
  
  if (metaUrl.startsWith('file://')) {
    const url = new URL(metaUrl);
    fileName = path.basename(url.pathname);
  } else {
    fileName = path.basename(metaUrl);
  }
  
  // Remove .spec.ts or .spec.js extension
  return fileName.replace(/\.spec\.(ts|js)$/, '');
}
