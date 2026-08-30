import { test, expect } from '../../fixtures';
import { ExcelReader, getTestCaseNameFromFile } from '../../utils/excel-reader.util';

// Get test case name from file
const testCaseName = getTestCaseNameFromFile(import.meta.url);

// Initialize Excel reader
const excelReader = new ExcelReader();

// You can override the test case name to match your Excel suite names
// For example: 'TC_01_E2E_SanityUIFlow' or any suite name from your Excel file
const excelSuiteName = process.env.EXCEL_SUITE_NAME || 'TC_01_E2E_SanityUIFlow';

test.describe('Post Approval Flow', () => {
  let testData: Record<string, string>;
  let opportunityId: string;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(excelSuiteName);
    // In real scenario, this would come from previous test or data file
    opportunityId = testData['OPPORTUNITY_ID'] || 'OPP-12345';
    console.log(`Test: ${testCaseName}`);
    console.log(`Excel Suite: ${excelSuiteName}`);
    console.log(`Test Data:`, testData);
  });

  test('TC-02: Complete post approval flow', async ({
    loginPage,
    dealerSearchPage,
    appStatusPage,
    assetCartPage,
  }) => {
    // ===== Step 1: Login to FOS =====
    await test.step('Login to FOS', async () => {
      await loginPage.loginToFOS(
        testData['URL'] || process.env.FOS_URL!,
        testData['FOS_USERNAME'] || process.env.FOS_USERNAME!,
        testData['FOS_PASSWORD'] || process.env.FOS_PASSWORD!,
        testData['LOGIN_BUTTON'] || 'Log In'
      );
    });

    // ===== Step 2: Search by Opportunity =====
    await test.step('Search by Opportunity', async () => {
      await dealerSearchPage.searchByOpportunity(
        testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
        opportunityId
      );
    });

    // ===== Step 3: Proceed from App Status =====
    await test.step('Proceed from App Status', async () => {
      await appStatusPage.proceedFromAppStatus(
        testData['APP_STATUS_PAGE'] || 'Application Status',
        testData['PROCEED_BUTTON'] || 'Proceed'
      );
    });

    // ===== Step 4: Asset Cart Operations =====
    await test.step('Complete Asset Cart', async () => {
      await assetCartPage.proceed(testData['PROCEED_BUTTON'] || 'Proceed');
    });

    // ===== Step 5: Logout =====
    await test.step('Logout from FOS', async () => {
      await loginPage.logoutFromFOS();
    });

    console.log('✓ Post approval test completed');
  });
});
