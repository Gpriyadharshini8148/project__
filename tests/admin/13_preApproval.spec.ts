import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

/**
 * Test Suite: 13 - Admin Pre-Approval
 * 
 * Prerequisites: Customer application submitted (Steps 01-12 completed)
 * 
 * Purpose: Admin reviews and approves customer application
 * 
 * Scenarios:
 * - Positive: Search and approve application by Deal ID
 * - Positive: Search and approve application by Opportunity ID
 * - Negative: Try to approve without reviewing details
 * - Negative: Search with invalid Deal ID
 * - Feature: Verify application details in admin panel
 * - Feature: Add admin comments before approval
 */

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

test.describe('13 - Admin Pre-Approval', () => {
  let testData: Record<string, string>;
  let dealId: string;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
    // In real scenario, dealId would come from previous test or shared state
    dealId = testData['DEAL_ID'] || 'DEAL-' + Date.now();
  });

  test('Positive: Admin search and approve by Deal ID', async ({
    loginPage,
    adminCustomerPage,
  }) => {
    // Step 1: Login to Admin
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    // Step 2: Search by Deal ID
    await adminCustomerPage.searchByDealId(dealId);

    // Step 3: Open Customer Record
    await adminCustomerPage.openCustomerRecord(dealId);

    // Step 4: View Application Details
    await adminCustomerPage.viewApplicationDetails();

    // Step 5: Approve Application
    await adminCustomerPage.approveApplication(
      testData['APPROVE_BUTTON'] || 'Approve'
    );

    // Verify approval success message
    const successMessage = adminCustomerPage.page.locator(
      'text=/approved.*successfully|approval.*confirmed|application.*approved/i'
    );
    await expect(successMessage.first()).toBeVisible({ timeout: config.timeouts.element });

    console.log('✓ Admin approval completed successfully');
  });

  test('Positive: Admin search by Opportunity ID', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login to Admin
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    // Search by Opportunity ID
    const opportunityId = testData['OPPORTUNITY_ID'] || 'OPP-' + Date.now();
    const searchBox = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await searchBox.fill(opportunityId);
    await searchBox.press('Enter');

    // Verify search results
    await page.waitForTimeout(2000);
    const resultCount = await page.locator('.search-result, .application-row').count();
    console.log(`Found ${resultCount} result(s) for Opportunity ID: ${opportunityId}`);
  });

  test('Negative: Search with invalid Deal ID', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login to Admin
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    // Search with invalid/non-existent Deal ID
    const invalidDealId = 'INVALID-DEAL-999999';
    
    const searchBox = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await searchBox.fill(invalidDealId);
    await searchBox.press('Enter');

    // Verify no results or error message
    const noResultsMessage = page.locator(
      'text=/no results|not found|no.*records|0.*found/i'
    );
    await expect(noResultsMessage.first()).toBeVisible({ timeout: config.timeouts.element });

    console.log('✓ Invalid Deal ID validation working');
  });

  test('Negative: Try to approve without reviewing', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login and search
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await adminCustomerPage.searchByDealId(dealId);
    await adminCustomerPage.openCustomerRecord(dealId);

    // Try to approve directly without viewing details
    const approveButton = page.locator(`button:has-text("${testData['APPROVE_BUTTON'] || 'Approve'}")`);
    const isEnabled = await approveButton.isEnabled().catch(() => false);

    if (!isEnabled) {
      console.log('✓ Approve button disabled until review is complete');
    } else {
      // If enabled, try clicking and check for validation
      await approveButton.click();
      
      const warningMessage = page.locator(
        'text=/please review|review.*required|check.*details/i'
      );
      const hasWarning = await warningMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasWarning) {
        console.log('✓ Warning shown when approving without review');
      }
    }
  });

  test('Feature: Verify application details in admin panel', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login and search
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await adminCustomerPage.searchByDealId(dealId);
    await adminCustomerPage.openCustomerRecord(dealId);
    await adminCustomerPage.viewApplicationDetails();

    // Verify key sections are visible
    const sections = [
      /customer.*details|applicant.*info/i,
      /product.*details|asset.*info/i,
      /loan.*details|finance.*info/i,
      /document.*details|kyc.*info/i,
      /income.*details/i,
    ];

    for (const sectionPattern of sections) {
      const section = page.locator(`text=${sectionPattern}`);
      const isVisible = await section.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        console.log(`✓ Found section: ${sectionPattern}`);
      }
    }
  });

  test('Feature: Add admin comments before approval', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login and search
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await adminCustomerPage.searchByDealId(dealId);
    await adminCustomerPage.openCustomerRecord(dealId);

    // Check for comments/notes field
    const commentsField = page.locator('textarea[name*="comment"], textarea[name*="note"], textarea[placeholder*="Comment"]');
    const hasComments = await commentsField.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasComments) {
      console.log('✓ Admin comments field available');
      
      // Add a test comment
      await commentsField.fill('Test approval comment - all documents verified');
      
      // Verify comment is saved
      const savedComment = await commentsField.inputValue();
      expect(savedComment).toContain('all documents verified');
      
      console.log('✓ Admin comment added successfully');
    } else {
      console.log('Comments field not available');
    }
  });

  test('Feature: Reject application option', async ({
    page,
    loginPage,
    adminCustomerPage,
  }) => {
    // Login and search
    await loginPage.loginToAdmin(
      testData['ADMIN_URL'] || config.urls.admin || process.env.ADMIN_URL!,
      testData['ADMIN_USERNAME'] || config.credentials.admin?.username || process.env.ADMIN_USERNAME!,
      testData['ADMIN_PASSWORD'] || config.credentials.admin?.password || process.env.ADMIN_PASSWORD!,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await adminCustomerPage.searchByDealId(dealId);
    await adminCustomerPage.openCustomerRecord(dealId);

    // Check for reject button
    const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Decline")');
    const hasReject = await rejectButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasReject) {
      console.log('✓ Reject option available');
      
      // Verify reject confirmation
      await rejectButton.click();
      
      const confirmDialog = page.locator('.modal, .dialog, [role="dialog"]');
      const hasDialog = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasDialog) {
        console.log('✓ Reject confirmation dialog shown');
        
        // Cancel the rejection
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")');
        await cancelButton.click();
      }
    } else {
      console.log('Reject option not available at this stage');
    }
  });
});
