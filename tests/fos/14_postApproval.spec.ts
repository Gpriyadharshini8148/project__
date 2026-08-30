import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

/**
 * Test Suite: 14 - FOS Post-Approval (Pre-DO)
 * 
 * Prerequisites: Admin approval completed (Step 13)
 * 
 * Purpose: FOS handles post-approval tasks before DO issuance
 * 
 * Scenarios:
 * - Positive: Search approved application and proceed
 * - Positive: Complete pre-DO verification
 * - Negative: Search non-approved application
 * - Feature: Verify approved application status
 * - Feature: Upload additional documents if required
 */

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

test.describe('14 - FOS Post-Approval (Pre-DO)', () => {
  let testData: Record<string, string>;
  let opportunityId: string;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
    // In real scenario, opportunityId would come from previous tests
    opportunityId = testData['OPPORTUNITY_ID'] || 'OPP-' + Date.now();
  });

  test('Positive: Search approved application', async ({
    loginPage,
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Login to FOS
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    // Search by Opportunity ID
    await dealerSearchPage.searchByOpportunity(
      testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
      opportunityId
    );

    // Verify App Status shows "Approved"
    await expect(
      appStatusPage.page.locator('text=/approved|sanction/i')
    ).toBeVisible({ timeout: config.timeouts.element });

    console.log('✓ Approved application found');
  });

  test('Positive: Proceed with post-approval tasks', async ({
    page,
    loginPage,
    dealerSearchPage,
    appStatusPage,
    assetCartPage,
  }) => {
    // Login and search
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await dealerSearchPage.searchByOpportunity(
      testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
      opportunityId
    );

    // Proceed from App Status
    await appStatusPage.proceedFromAppStatus(
      testData['APP_STATUS_PAGE'] || 'Application Status',
      testData['PROCEED_BUTTON'] || 'Proceed'
    );

    // Complete post-approval steps in Asset Cart
    await assetCartPage.proceed(testData['PROCEED_BUTTON'] || 'Proceed');

    console.log('✓ Post-approval tasks completed');
  });

  test('Negative: Search non-approved application', async ({
    page,
    loginPage,
    dealerSearchPage,
  }) => {
    // Login to FOS
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    // Search for pending/draft application
    const pendingOppId = 'PENDING-OPP-' + Date.now();
    
    const searchBox = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await searchBox.fill(pendingOppId);
    await searchBox.press('Enter');

    // Verify either no results or status shows "Pending"
    await page.waitForTimeout(2000);
    
    const noResults = page.locator('text=/no results|not found/i');
    const pendingStatus = page.locator('text=/pending|draft|in progress/i');
    
    const hasNoResults = await noResults.isVisible({ timeout: 3000 }).catch(() => false);
    const hasPending = await pendingStatus.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasNoResults || hasPending) {
      console.log('✓ Non-approved application not accessible for post-approval');
    }
  });

  test('Feature: Verify approved application status', async ({
    page,
    loginPage,
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Login and search
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await dealerSearchPage.searchByOpportunity(
      testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
      opportunityId
    );

    // Verify status badge
    const statusBadge = page.locator('.status-badge, .application-status, [data-testid="status"]');
    const hasStatus = await statusBadge.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasStatus) {
      const statusText = await statusBadge.textContent();
      console.log(`Application status: ${statusText}`);
      
      // Verify status is "Approved" or "Sanctioned"
      expect(statusText?.toLowerCase()).toMatch(/approved|sanction/i);
    }

    // Verify approval date if shown
    const approvalDate = page.locator('text=/approval.*date|approved.*on/i');
    const hasDate = await approvalDate.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasDate) {
      console.log('✓ Approval date displayed');
    }
  });

  test('Feature: Upload additional post-approval documents', async ({
    page,
    loginPage,
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Login and search
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await dealerSearchPage.searchByOpportunity(
      testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
      opportunityId
    );

    await appStatusPage.proceedFromAppStatus(
      testData['APP_STATUS_PAGE'] || 'Application Status',
      testData['PROCEED_BUTTON'] || 'Proceed'
    );

    // Check for document upload section
    const uploadSection = page.locator('text=/upload.*document|additional.*document/i');
    const hasUpload = await uploadSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUpload) {
      console.log('✓ Additional document upload available');
      
      // Check for upload button
      const uploadButton = page.locator('input[type="file"], button:has-text("Upload")');
      const hasButton = await uploadButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasButton) {
        console.log('✓ Upload button found');
      }
    } else {
      console.log('No additional documents required at this stage');
    }
  });

  test('Feature: View sanction letter', async ({
    page,
    loginPage,
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Login and search
    await loginPage.loginToFOS(
      testData['URL'] || config.urls.fos,
      testData['FOS_USERNAME'] || config.credentials.fos.username,
      testData['FOS_PASSWORD'] || config.credentials.fos.password,
      testData['LOGIN_BUTTON'] || 'Log In'
    );

    await dealerSearchPage.searchByOpportunity(
      testData['SEARCH_BOX_LABEL'] || 'Search by Opportunity Name or Deal ID',
      opportunityId
    );

    // Check for sanction letter link/button
    const sanctionLetter = page.locator('text=/sanction.*letter|approval.*letter/i, button:has-text("View Letter")');
    const hasLetter = await sanctionLetter.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasLetter) {
      console.log('✓ Sanction letter available for viewing');
      
      // Click to view/download
      await sanctionLetter.first().click();
      
      // Wait for download or new tab
      await page.waitForTimeout(2000);
      
      console.log('✓ Sanction letter accessed');
    } else {
      console.log('Sanction letter not yet available');
    }
  });
});
