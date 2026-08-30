#!/usr/bin/env node

/**
 * Test Scenario Generator
 * 
 * Creates new test scenarios with proper structure, Page Objects, and Excel data templates
 * 
 * Usage:
 *   node scripts/scenario-generator.cjs
 * 
 * Or via npm:
 *   npm run generate:scenario
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Template generators
function generateTestTemplate(config) {
  const { testNumber, testName, category, pageName, includeDataGenerator } = config;
  const testCaseName = `TC_${testNumber}_${testName}`;
  
  return `import { test, expect } from '../../fixtures';
import { ExcelReader${includeDataGenerator ? ', DataGenerator' : ''} } from '../../utils';
import { config } from '../../config/environment.config';

test.describe('${testNumber} - ${testName}', () => {
  let testData: Record<string, string>;${includeDataGenerator ? '\n  let mobileNumber: string;' : ''}

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('${testCaseName}');${includeDataGenerator ? '\n    mobileNumber = DataGenerator.generateMobileNumber();' : ''}
    
    console.log(\`✓ Test Data Loaded: \${Object.keys(testData).length} fields\`);${includeDataGenerator ? '\n    console.log(`✓ Generated Mobile: ${mobileNumber}`);' : ''}
  });

  test.beforeEach(async ({ loginPage }) => {
    // Login before each test
    await loginPage.loginToFOS(
      testData['appurlcustomerlogin'] || config.urls.fosCustomer,
      testData['usernamecustomerlogin'] || config.credentials.fosUsername,
      testData['passwordcustomerlogin'] || config.credentials.fosPassword,
      testData['fosloginbutton'] || 'Log in'
    );
  });

  test('Positive: ${testName} with valid data', async ({
    page,
    ${pageName}Page,
  }) => {
    await test.step('Execute ${testName}', async () => {
      // TODO: Implement test steps using ${pageName}Page methods
      // Example:
      // await ${pageName}Page.fillForm(testData);
      // await ${pageName}Page.submitForm();
      
      console.log('✓ ${testName} completed successfully');
    });

    await test.step('Verify results', async () => {
      // TODO: Add verification steps
      // Example:
      // await expect(page.locator(testData['successMessage'])).toBeVisible();
      
      console.log('✓ Verification passed');
    });
  });

  test('Negative: ${testName} with invalid data', async ({
    page,
    ${pageName}Page,
  }) => {
    await test.step('Attempt ${testName} with invalid data', async () => {
      // TODO: Implement negative test scenario
      
      console.log('✓ Negative test executed');
    });

    await test.step('Verify error handling', async () => {
      // TODO: Verify error messages
      
      console.log('✓ Error handling verified');
    });
  });

  // Add more test cases as needed
});

/**
 * How to add more test cases:
 * 
 * 1. Copy the test() block above
 * 2. Update test name and description
 * 3. Implement test steps using Page Object methods
 * 4. Add corresponding Excel data fields
 * 
 * Example:
 * test('Edge Case: ${testName} with boundary values', async ({ ${pageName}Page }) => {
 *   // Your test implementation
 * });
 */
`;
}

function generatePageObjectTemplate(config) {
  const { pageName, includeAdvancedMethods } = config;
  
  return `import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * ${pageName} Page Object
 * Handles all interactions with the ${pageName} page
 */
export class ${pageName}Page extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Locators ====================

  /**
   * Get primary form fields
   */
  private get formFields() {
    return {
      // TODO: Add specific locators
      // Example:
      // fieldName: this.textbox('Field Name'),
      // dropdown: this.combobox('Dropdown Label'),
      // submitButton: this.button('Submit'),
    };
  }

  // ==================== Page Actions ====================

  /**
   * Fill the main form with test data
   */
  async fillForm(data: Record<string, string>): Promise<void> {
    console.log('===== Filling ${pageName} Form =====');
    
    // TODO: Implement form filling logic
    // Example:
    // await this.actions.fill(
    //   this.formFields.fieldName,
    //   data['fieldname'] || 'default',
    //   'Fill Field Name'
    // );
    
    await this.actions.waitForPageLoad();
    console.log('✓ Form filled successfully');
  }

  /**
   * Submit the form
   */
  async submitForm(): Promise<void> {
    // TODO: Implement submit logic
    // await this.actions.click(this.formFields.submitButton, 'Submit Form');
    await this.actions.waitForPageLoad();
    console.log('✓ Form submitted');
  }${includeAdvancedMethods ? `

  /**
   * Verify page is loaded
   */
  async verifyPageLoaded(pageTitle: string): Promise<void> {
    await this.page.waitForSelector(\`text=\${pageTitle}\`, { timeout: 30000 });
    console.log(\`✓ \${pageTitle} page loaded\`);
  }

  /**
   * Navigate to next step
   */
  async proceedToNext(buttonText: string = 'Proceed'): Promise<void> {
    await this.clickButton(buttonText);
    await this.actions.waitForPageLoad();
    console.log('✓ Proceeded to next step');
  }` : ''}
}
`;
}

function generateExcelDataTemplate(config) {
  const { testNumber, testName } = config;
  const testCaseName = `TC_${testNumber}_${testName}`;
  
  return `
# Excel Data Template for ${testCaseName}

Add this to your TestData.xlsx file (Sheet: TestData):

## Row Structure:

${testCaseName}                                    ← Suite Header (Row 1)
executionFlag              yes                      ← Row 2
environment                PREPROD                  ← Row 3
appurlcustomerlogin       https://your-app.com    ← Row 4
usernamecustomerlogin     test.user@company.com   ← Row 5
passwordcustomerlogin     Password@123            ← Row 6
fosloginbutton            Log in                   ← Row 7

# Add your test-specific fields below:
# Example:
# fieldname                 value
# buttonlabel               Button Text
# expectedmessage           Success Message

                                                   ← Empty row (separator)

## TestConfig Sheet:

Add this row to TestConfig sheet:

| SpecFile | Description | Tags | Environment | ExecutionFlag |
|----------|-------------|------|-------------|---------------|
| ${testCaseName} | ${testName} test | smoke | PREPROD | yes |

## Next Steps:

1. Open test-data/TestData.xlsx
2. Add the above data structure to TestData sheet
3. Add the TestConfig row
4. Update field values according to your test requirements
5. Run: npm run validate

`;
}

function generateFixtureUpdate(config) {
  const { pageName } = config;
  const lowerPageName = pageName.charAt(0).toLowerCase() + pageName.slice(1);
  
  return `
# Fixture Update Required

Add this to fixtures/base.fixture.ts:

## 1. Import Statement:
Add to imports section:
import { ${pageName}Page } from '../pages/YOUR_CATEGORY/${pageName}Page';

## 2. Interface Update:
Add to PageObjects interface:
${lowerPageName}Page: ${pageName}Page;

## 3. Fixture Definition:
Add to test.extend block:
${lowerPageName}Page: async ({ page }, use) => {
  await use(new ${pageName}Page(page));
},

## 4. Export Update (if needed):
Add to pages/YOUR_CATEGORY/index.ts:
export { ${pageName}Page } from './${pageName}Page';

`;
}

// Main execution
async function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'cyan');
  log('║   Test Scenario Generator for Playwright TS       ║', 'cyan');
  log('╚════════════════════════════════════════════════════╝\n', 'cyan');

  try {
    // Gather information
    log('Please provide the following information:\n', 'bright');

    const testNumber = await question(colors.yellow + 'Test Number (e.g., 15): ' + colors.reset);
    const testName = await question(colors.yellow + 'Test Name (e.g., PaymentVerification): ' + colors.reset);
    const category = await question(colors.yellow + 'Category [customer/admin/fos/e2e]: ' + colors.reset) || 'customer';
    const pageName = await question(colors.yellow + 'Page Object Name (e.g., Payment): ' + colors.reset);
    
    const createPageObject = await question(colors.yellow + 'Create Page Object? [y/n]: ' + colors.reset);
    const includeDataGenerator = await question(colors.yellow + 'Include DataGenerator (mobile, PAN, etc.)? [y/n]: ' + colors.reset);
    const includeAdvancedMethods = await question(colors.yellow + 'Include advanced methods in Page Object? [y/n]: ' + colors.reset);

    const config = {
      testNumber: testNumber.padStart(2, '0'),
      testName,
      category: category.toLowerCase(),
      pageName,
      createPageObject: createPageObject.toLowerCase() === 'y',
      includeDataGenerator: includeDataGenerator.toLowerCase() === 'y',
      includeAdvancedMethods: includeAdvancedMethods.toLowerCase() === 'y'
    };

    log('\n' + colors.bright + 'Generating files...' + colors.reset + '\n');

    // Generate test spec file
    const testFileName = `${config.testNumber}_${config.testName.toLowerCase()}.spec.ts`;
    const testFilePath = path.join(process.cwd(), 'tests', config.category, testFileName);
    
    if (fs.existsSync(testFilePath)) {
      log(`⚠️  Test file already exists: ${testFileName}`, 'yellow');
    } else {
      fs.writeFileSync(testFilePath, generateTestTemplate(config));
      log(`✓ Created test file: tests/${config.category}/${testFileName}`, 'green');
    }

    // Generate Page Object
    if (config.createPageObject) {
      const pageFileName = `${config.pageName}Page.ts`;
      const pageFilePath = path.join(process.cwd(), 'pages', config.category, pageFileName);
      
      // Create category directory if it doesn't exist
      const categoryDir = path.join(process.cwd(), 'pages', config.category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
        log(`✓ Created directory: pages/${config.category}/`, 'green');
      }
      
      if (fs.existsSync(pageFilePath)) {
        log(`⚠️  Page Object already exists: ${pageFileName}`, 'yellow');
      } else {
        fs.writeFileSync(pageFilePath, generatePageObjectTemplate(config));
        log(`✓ Created Page Object: pages/${config.category}/${pageFileName}`, 'green');
      }
    }

    // Generate Excel data template
    const excelTemplateFileName = `EXCEL_TEMPLATE_${config.testNumber}_${config.testName}.md`;
    const excelTemplatePath = path.join(process.cwd(), 'docs', excelTemplateFileName);
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(excelTemplatePath, generateExcelDataTemplate(config));
    log(`✓ Created Excel template: docs/${excelTemplateFileName}`, 'green');

    // Generate fixture update instructions
    if (config.createPageObject) {
      const fixtureFileName = `FIXTURE_UPDATE_${config.pageName}.md`;
      const fixturePath = path.join(process.cwd(), 'docs', fixtureFileName);
      fs.writeFileSync(fixturePath, generateFixtureUpdate(config));
      log(`✓ Created fixture update guide: docs/${fixtureFileName}`, 'green');
    }

    // Summary
    log('\n' + colors.bright + '═══════════════════════════════════════════════════', 'green');
    log('✓ Scenario generation completed!', 'green');
    log('═══════════════════════════════════════════════════' + colors.reset + '\n', 'green');

    log('Next Steps:\n', 'bright');
    log('1. Review the generated test file and implement test logic', 'cyan');
    if (config.createPageObject) {
      log('2. Review the Page Object and add specific locators/methods', 'cyan');
      log('3. Update fixtures/base.fixture.ts following the guide in docs/', 'cyan');
    }
    log(`${config.createPageObject ? '4' : '2'}. Add Excel data using the template in docs/`, 'cyan');
    log(`${config.createPageObject ? '5' : '3'}. Run: npm run validate`, 'cyan');
    log(`${config.createPageObject ? '6' : '4'}. Run your test: npm test tests/${config.category}/${testFileName}\n`, 'cyan');

  } catch (error) {
    log('\n❌ Error: ' + error.message, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
