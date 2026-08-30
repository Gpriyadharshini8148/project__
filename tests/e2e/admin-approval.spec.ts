import { test, expect } from '../../fixtures';
import { ExcelReader, getTestCaseNameFromFile } from '../../utils/excel-reader.util';

// Get test case name from file
const testCaseName = getTestCaseNameFromFile(import.meta.url);

// Initialize Excel reader
const excelReader = new ExcelReader();

// You can override the test case name to match your Excel suite names
// For example: 'TC_01_E2E_SanityUIFlow' or any suite name from your Excel file
const excelSuiteName = process.env.EXCEL_SUITE_NAME || 'TC_01_E2E_SanityUIFlow';

test.describe('Admin Approval Flow', () => {
  let testData: Record<string, string>;
  let dealId: string;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(excelSuiteName);
    dealId = testData['DEAL_ID'] || 'DEAL-12345';
    console.log(`Test: ${testCaseName}`);
    console.log(`Excel Suite: ${excelSuiteName}`);
    console.log(`Test Data:`, testData);
  });

  test('TC-03: Admin approve customer application', async ({
    loginPage,
    adminCustomerPage,
  }) => {
    // ===== Step 1: Login to Admin =====
    await test.step('Login to Admin', async () => {
      await loginPage.loginToAdmin(
        testData['ADMIN_URL'] || process.env.ADMIN_URL!,
        testData['ADMIN_USERNAME'] || process.env.ADMIN_USERNAME!,
        testData['ADMIN_PASSWORD'] || process.env.ADMIN_PASSWORD!,
        testData['LOGIN_BUTTON'] || 'Log In'
      );
    });

    // ===== Step 2: Search by Deal ID =====
    await test.step('Search by Deal ID', async () => {
      await adminCustomerPage.searchByDealId(dealId);
    });

    // ===== Step 3: Open Customer Record =====
    await test.step('Open Customer Record', async () => {
      await adminCustomerPage.openCustomerRecord(dealId);
    });

    // ===== Step 4: View Details =====
    await test.step('View Application Details', async () => {
      await adminCustomerPage.viewApplicationDetails();
    });

    // ===== Step 5: Approve Application =====
    await test.step('Approve Application', async () => {
      await adminCustomerPage.approveApplication(
        testData['APPROVE_BUTTON'] || 'Approve'
      );
    });

    // ===== Step 6: Logout =====
    await test.step('Logout from Admin', async () => {
      await loginPage.logoutFromAdmin();
    });

    console.log('✓ Admin approval test completed');
  });
});
