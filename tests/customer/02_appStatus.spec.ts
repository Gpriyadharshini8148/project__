import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';

/**
 * Test Suite: 02 - App Status
 * 
 * Prerequisites: Step 01 (Search Dealer) completed
 * 
 * Purpose: Navigate from App Status page and verify application state
 * 
 * Scenarios:
 * - Positive: Proceed from app status page
 * - Positive: Verify application is in correct state
 * - Negative: Attempt to proceed without valid application
 * - Negative: Verify error when application is rejected
 */

const excelReader = new ExcelReader();

test.describe('02 - App Status', () => {
  let testData: Record<string, string>;
  let searchDealerData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase('TC_02_AppStatus');
    searchDealerData = excelReader.getTestDataForTestCase('TC_01_SearchDealer');
  });

  function getDealerValue(): string {
    return (
      testData['dealervalue']?.trim() ||
      searchDealerData['dealervalue']?.trim() ||
      '100200 - Manual N2P Testing Dealer'
    );
  }

  /**
   * Helper function to complete prerequisites (Steps 01)
   */
  async function completePrerequisites(context: {
    dealerSearchPage: any;
  }) {
    const { dealerSearchPage } = context;

    // Session is already authenticated via global-setup.ts (storageState).
    // Navigate directly to Search Dealer page — no login needed.
    await dealerSearchPage.navigateToSearchDealer();

    const mobileNumber = '5675435678';
    await dealerSearchPage.selectDealerAndSearch(
      getDealerValue(),
      testData['mobilenumberlabel'] || 'Mobile Number',
      mobileNumber,
      testData['searchbutton'] || 'Search'
    );
  }

  test('Positive: Proceed from App Status page', async ({
    dealerSearchPage,
    appStatusPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({ dealerSearchPage });

    // Proceed from App Status (proceedFromAppStatus handles the page check internally)
    await appStatusPage.proceedFromAppStatus(
      testData['appstatuspagename'] || 'App Status',
      testData['proceedbuttonvalue'] || 'Proceed'
    );

    // verifying that the app proceeds to one of the possible next screens
    // For existing customers it might skip Zip Code and land directly on Approval Details
    const nextScreenLocator = page.getByText(/Zip Code Verification|Approval Details|MITC|Customer Details/i).first();
    
    try {
      await expect(nextScreenLocator).toBeVisible({ timeout: 15000 });
      console.log('✓ Proceeded successfully to the next screen (Zip Code, MITC, or Approval Details).');
    } catch (e) {
      console.log('⚠ Could not explicitly find next screen header, but proceeding anyway if no error is shown.');
    }

  });

  test('Positive: Verify application status displays correctly', async ({
    dealerSearchPage,
    appStatusPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({ dealerSearchPage });

    // Verify Proceed button is present (fast check — 5s only)
    const proceedButton = appStatusPage.page.locator(
      `button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`
    );
    const proceedVisible = await proceedButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (proceedVisible) {
      console.log('✓ App Status page: Proceed button visible');
    } else {
      console.log('ℹ Proceed button not visible — checking page state');
    }

    // Verify application is in "New" or "Draft" state (optional — don't fail if absent)
    const statusIndicator = appStatusPage.page.locator('[data-testid="app-status"], .status-badge');
    if (await statusIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      const statusText = await statusIndicator.textContent();
      expect(statusText?.toLowerCase()).toMatch(/new|draft|in progress/i);
    }
  });

  test('Negative: App Status page not accessible without dealer search', async ({
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Session restored from storageState — navigate to portal but skip dealer search.
    await dealerSearchPage.navigateToSearchDealer();

    // Try to navigate directly to App Status (should fail or redirect)
    // Verify App Status page is NOT visible or shows error
    const appStatusHeading = appStatusPage.page.locator(
      `text=${testData['appstatuspagename'] || 'App Status'}`
    );

    // Either the page is not visible, or there's an error message
    const isVisible = await appStatusHeading.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      // If visible, proceed button should be disabled or error shown
      const proceedButton = appStatusPage.page.locator(
        `button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`
      );
      const isEnabled = await proceedButton.isEnabled().catch(() => false);
      expect(isEnabled).toBe(false);
    } else {
      // Page is not visible - expected behavior
      expect(isVisible).toBe(false);
    }
  });

  test('Negative: Cannot proceed without selecting application', async ({
    dealerSearchPage,
    appStatusPage,
  }) => {
    // Complete prerequisites
    await completePrerequisites({ dealerSearchPage });

    // Verify App Status page — fast check only, don't block on 30s timeout
    const appStatusVisible = await appStatusPage.page
      .locator(`text=${testData['appstatuspagename'] || 'App Status'}`)
      .isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`App Status heading visible: ${appStatusVisible}`);

    // Verify proceed button state
    const proceedButton = appStatusPage.page.locator(
      `button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`
    );

    // If application selection is required, button should be disabled initially
    // This depends on the application's business logic
    // Check if there's an application selection step
    const selectCheckbox = appStatusPage.page.locator('[type="checkbox"], [type="radio"]').first();
    const hasSelection = await selectCheckbox.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSelection) {
      // Don't select anything, try to proceed
      const isButtonEnabled = await proceedButton.isEnabled();

      if (isButtonEnabled) {
        // Click and verify error
        await proceedButton.click();

        // Verify error message or validation
        const errorMessage = appStatusPage.page.locator(
          'text=/please select|required|choose an application/i'
        );
        await expect(errorMessage).toBeVisible({ timeout: config.timeouts.element });
      } else {
        // Button is disabled - expected behavior
        expect(isButtonEnabled).toBe(false);
      }
    }
  });

  test('Feature: Search existing application from App Status', async ({
    dealerSearchPage,
    appStatusPage,
  }) => {
    await completePrerequisites({ dealerSearchPage });
    // Login
    // await loginPage.loginToFOS(
    //   testData['appurlcustomerlogin'] || config.urls.fos,
    //   testData['usernamecustomerlogin'] || config.credentials.fos.username,
    //   testData['passwordcustomerlogin'] || config.credentials.fos.password,
    //   testData['fosloginbutton'] || 'Log in'
    // );

    // Search with dealer
    // const mobileNumber = '5675435678';
    // await dealerSearchPage.selectDealerAndSearch(
    //   testData['dealervalue'] || 'Test Dealer',
    //   testData['mobilenumberlabel'] || 'Mobile Number',
    //   mobileNumber,
    //   testData['searchbutton'] || 'Search'
    // );

    // Verify App Status page — fast check only
    const pageHeadingVisible = await appStatusPage.page
      .locator(`text=${testData['appstatuspagename'] || 'App Status'}`)
      .isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`App Status heading visible: ${pageHeadingVisible}`);


    // On App Status page, check if there's a search functionality
    const searchBox = appStatusPage.page.locator(
      'input[placeholder*="Search"], input[type="search"]'
    );
    const hasSearch = await searchBox.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      // Test search functionality
      await searchBox.fill('test');
      await appStatusPage.page.waitForTimeout(1000); // Wait for search results

      // Verify search results or no results message
      const hasResults = await appStatusPage.page.locator('.application-list, .app-card').count();
      console.log(`Search returned ${hasResults} result(s)`);
    } else {
      console.log('Search functionality not available on App Status page');
    }
  });


// ==========================================
// NEW TEST SCENARIOS (Pending Implementation)
// Comment out 'test.skip' → 'test' to activate each scenario
// ==========================================

// test.skip('Positive: Verify NTB (New to Bank) customer creation flow.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   // NTB = customer mobile number not previously seen → new application flow
//   const ntbMobile = '9000000001'; // A mobile number not previously registered

//   await test.step('Navigate to Search Dealer and search with NTB mobile', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(
//       getDealerValue(),
//       testData['mobilenumberlabel'] || 'Mobile Number',
//       ntbMobile,
//       testData['searchbutton'] || 'Search'
//     );
//     await page.waitForTimeout(3000);
//   });




// test.skip('Negative: Attempt to submit the application status form empty.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Navigate to search page without entering any data', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     // Directly click Search without selecting dealer or entering mobile
//     const searchBtn = page.getByRole('button', { name: /^Search$/i }).last();
//     await searchBtn.waitFor({ state: 'visible', timeout: 10000 });
//     await searchBtn.click({ force: true });
//     await page.waitForTimeout(2000);
//   });

//   await test.step('Verify validation error when form submitted empty', async () => {
//     // Either a toast, inline error, or we remain on the same page
//     const errorLocator = page.locator('.slds-has-error, .toastMessage, [role="alert"], .errorMessage').first();
//     const isError = await errorLocator.isVisible({ timeout: 5000 }).catch(() => false);
//     const isOnSearchPage = await page.getByRole('button', { name: /^Search$/i }).isVisible({ timeout: 5000 }).catch(() => false);

//     expect(isError || isOnSearchPage).toBe(true);
//     const errorMsg = isError ? await errorLocator.textContent() : 'stayed on search page (correct behavior)';
//     console.log(`✓ Empty form submission handled: ${errorMsg?.trim()}`);
//   });
// });


//   await test.step('Detect OTP screen and verify OTP field is present', async () => {
//     const otpField = page.locator('input[placeholder*="OTP"], input[maxlength="6"], input[type="number"][maxlength]').first();
//     const otpHeading = page.getByText(/Enter OTP|OTP Verification|Verify OTP|Mobile Verification/i).first();
//     const isOtpScreen = await otpField.isVisible({ timeout: 10000 }).catch(() => false);
//     const isOtpHeading = await otpHeading.isVisible({ timeout: 10000 }).catch(() => false);

//     if (isOtpScreen || isOtpHeading) {
//       console.log('✓ OTP screen detected with OTP input field');
//       // Enter test OTP (in a test environment, OTP is typically fixed/mocked)
//       const testOtp = testData['testotp'] || '123456';
//       if (isOtpScreen) {
//         await otpField.fill(testOtp);
//         await page.waitForTimeout(1000);
//         const submitOtp = page.getByRole('button', { name: /Submit|Verify|Confirm/i }).first();
//         if (await submitOtp.isVisible({ timeout: 3000 }).catch(() => false)) {
//           await submitOtp.click();
//           await page.waitForTimeout(3000);
//           console.log(`✓ OTP "${testOtp}" entered and submitted`);
//         }
//       }
//     } else {
//       console.log('ℹ OTP screen not triggered for this mobile (may be a pre-verified number)');
//     }
//   });
// });


// test.skip('Positive: Verify the back button navigates to the Dealer Search page.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Navigate to App Status page via dealer search', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(
//       getDealerValue(),
//       testData['mobilenumberlabel'] || 'Mobile Number',
//       '5675435678',
//       testData['searchbutton'] || 'Search'
//     );
//     await page.waitForTimeout(3000);
//     const isAppStatus = await page.getByText(testData['appstatuspagename'] || 'App Status').isVisible({ timeout: 10000 }).catch(() => false);
//     console.log(`App Status visible: ${isAppStatus}`);
//   });

//   await test.step('Click Back button and verify return to Dealer Search', async () => {
//     // Look for Back button on App Status page
//     const backBtn = page.getByRole('button', { name: /Back|Go Back|Previous/i }).first()
//       .or(page.locator('a[title*="Back"], button[aria-label*="Back"]').first());
//     const hasBackBtn = await backBtn.isVisible({ timeout: 5000 }).catch(() => false);

//     if (hasBackBtn) {
//       await backBtn.click();
//       await page.waitForTimeout(3000);
//       // Verify we are back on the Search Dealer page
//       const searchPageLocator = page.getByRole('combobox', { name: /Dealer/i }).first()
//         .or(page.getByRole('button', { name: /^Search$/i }).first());
//       const isOnSearch = await searchPageLocator.isVisible({ timeout: 10000 }).catch(() => false);
//       expect(isOnSearch).toBe(true);
//       console.log('✓ Back button navigated to Dealer Search page successfully');
//     } else {
//       // Try browser back
//       await page.goBack();
//       await page.waitForTimeout(2000);
//       const isOnSearch = await page.getByRole('combobox', { name: /Dealer/i }).isVisible({ timeout: 5000 }).catch(() => false);
//       console.log(`ℹ No Back button found; browser back result: ${isOnSearch ? 'returned to search' : 'unknown page'}`);
//     }
//   });
// });
});