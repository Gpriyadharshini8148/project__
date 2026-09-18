import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

/**
 * Test Suite: 14 - Permanent Address
 *
 * Prerequisites: Steps 01-13 completed (through Additional Details)
 *
 * Purpose: Verify Permanent Address screen with auto-populated fields
 *
 * Scenarios:
 * - Positive: Simply proceed through Permanent Address
 * - Validation: Verify fields are disabled when auto-populated
 * - Feature: Verify Proceed button visibility and state
 */

// Helper to handle literal 'undefined' strings from Excel parsing
const getVal = (val: string | undefined, def: string) => (val && val !== 'undefined' ? val : def);

/**
 * Helper: Wait for screen with timeout and throw error if not reached
 */
async function waitForScreenOrThrow(
  pageObj: any,
  expected: string | string[],
  label: string,
  timeoutMs: number = 15000
): Promise<void> {
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  const pollInterval = 1000;
  const maxAttempts = Math.ceil(timeoutMs / pollInterval);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const actual = await pageObj.getCurrentScreen().catch(() => '');
    if (expectedValues.includes(actual)) {
      return;
    }

    await pageObj.page?.waitForTimeout?.(pollInterval);
  }

  throw new Error(`Flow did not reach ${label}. Current screen: ${await pageObj.getCurrentScreen().catch(() => 'unknown')}`);
}

/**
 * Helper: Complete prerequisite steps through Additional Details
 */
async function completeFullPrerequisitesToPermanentAddress(
  context: any,
  testData: Record<string, string>
): Promise<void> {
  const {
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage
  } = context;

  const mobileNumber = '5678654324';

  await test.step('Search Dealer', async () => {
    await dealerSearchPage.navigateToSearchDealer();
    await dealerSearchPage.selectDealerAndSearch(
      testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
      testData['mobilenumberlabel'] || 'Mobile Number',
      mobileNumber,
      testData['searchbutton'] || 'Search'
    );
  });

  await test.step('Proceed from App Status', async () => {
    await appStatusPage.proceedFromAppStatus(
      testData['appstatuspagename'] || 'App Status',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  // Handle alternative flow where user is dumped into 'Approval Details' instead of Zip Code
  if (await appStatusPage.isCurrentScreen('Approval Details')) {
    await test.step('Hamburger Navigation to Zip Code Details', async () => {
      console.log('⚠ Landed on Approval Details! Using Hamburger menu to navigate to Zip Code Details...');
      await page.waitForTimeout(1000);

      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());

      await hamburger.click({ force: true });
      await page.waitForTimeout(1000);

      const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
        .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));

      await targetLink.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('✓ Hamburger navigation to Zip Code Details complete.');
    });
  }

  // Verify Zip Code screen before filling
  const zipReady = await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pincode', 'Pin code', 'Pin Code Verification', 'Pincode Verification', 'PinCode']);
  if (!zipReady) {
    const currentScreen = await zipCodePage.getCurrentScreen().catch(() => 'unknown');
    console.log(`⚠ Not on expected screen. Current screen: "${currentScreen}". Waiting 2 seconds...`);
    await page.waitForTimeout(2000);
    const stillNotReady = await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pincode', 'Pin code', 'Pin Code Verification', 'Pincode Verification', 'PinCode']);
    if (!stillNotReady) {
      const stillCurrentScreen = await zipCodePage.getCurrentScreen().catch(() => 'unknown');
      throw new Error(`Expected Zip Code/Pincode page, but app is on: "${stillCurrentScreen}"`);
    }
  }

  await test.step('Zip Code Details', async () => {
    await zipCodePage.fillZipCodeDetails({
      zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
      zipCodeValue: '411014',
      bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
      dob: testData['dobvalue'] || '18-12-1996',
      gender: testData['gendervalue'] || 'Male',
      language: testData['preferredcommunicationlanguagevalue'] || 'English',
      preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
      poaAddressType: testData['poaaddresstype'],
    });
    await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
  });

  if (await mitcPage.isCurrentScreen('MITC')) {
    await test.step('MITC Details', async () => {
      await mitcPage.fillMitcDetailsWithFirstAndLastName(
        getVal(testData['firstname'], 'Dummycust'),
        getVal(testData['lastname'], 'Doe'),
        getVal(testData['proceedbuttonvalue'], 'Proceed')
      );
      await mitcPage.proceedToPanVerification(getVal(testData['proceedbuttonvalue'], 'Proceed'));
    });
  }

  await page.waitForTimeout(1500);

  if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification', 'Pan Details'])) {
    let panProcessed = true;
    await test.step('PAN Verification (No)', async () => {
      panProcessed = await panVerificationPage.fillPanVerificationDetails(
        getVal(testData['panNo'], 'HFHPP1234D'),
        getVal(testData['firstname'], 'Dummycust'),
        getVal(testData['lastname'], 'Doe'),
        getVal(testData['dobvalue'], '18-12-1996'),
        getVal(testData['proceedbuttonvalue'], 'Proceed')
      );
    });

    if (!panProcessed) {
      await test.step('Hamburger Navigation to Product Selection', async () => {
        console.log('⚠ PAN prompt not found. Using Hamburger menu to navigate to Product Selection...');
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());

        const hamburgerVisible = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
        if (!hamburgerVisible) {
          console.log('⚠ Hamburger menu not visible — skipping navigation, flow may already be past PAN.');
          return;
        }
        await hamburger.click({ force: true, timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(1000);

        const targetLink = page.getByRole('button', { name: 'Product Selection' })
          .or(page.getByRole('menuitem', { name: /Product Selection/i }));

        const targetVisible = await targetLink.first().isVisible({ timeout: 3000 }).catch(() => false);
        if (!targetVisible) {
          console.log('⚠ "Product Selection" menu item not found — hamburger menu may not have opened. Continuing anyway.');
          return;
        }
        await targetLink.first().click({ force: true, timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(1500);
        console.log('✓ Hamburger navigation to Product Selection complete.');
      });
    }
  }

  await page.waitForTimeout(1500);

  if (await productSelectionPage.isCurrentScreen('Product Selection')) {
    await test.step('Product Selection', async () => {
      await productSelectionPage.fillProductDetails(
        testData['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        testData['invoiceamount'] || '30000',
        testData['requiredloanamount'] || '30000',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }

  await waitForScreenOrThrow(incomeDeclarationPage, 'Income Declaration', 'Income Declaration');
  await test.step('Income Declaration', async () => {
    await incomeDeclarationPage.fillIncomeDeclaration(
      '30000',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await waitForScreenOrThrow(kycPage, 'KYC', 'KYC');
  await test.step('KYC Details', async () => {
    await kycPage.fillKYCDetails(
      "Customer doesn't have one of the listed Document types",
      'Save',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await waitForScreenOrThrow(poiPage, ['POI', 'Officially Valid Documents'], 'POI');
  await test.step('POI Details', async () => {
    await poiPage.fillPoiDetails(
      getVal(testData['firstname'], 'Dummycust'),
      '',
      getVal(testData['lastname'], 'Doe'),
      testData['poitypevalue'] || 'Aadhaar',
      testData['poinumbervalue'] || '2222',
      testData['gendervalue'] || 'Male',
      getVal(testData['dobvalue'], '18-12-1996'),
      testData['employmenttypevalue'] || 'Salaried',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await waitForScreenOrThrow(poaPage, ['POA', 'Current Address'], 'POA');
  await test.step('POA Details', async () => {
    await poaPage.fillPoaDetails(
      'Self Owned',
      '411014',
      testData['bflbranchvalue'] || '411014-Manual Testing Pune',
      testData['adressline1'] || 'Bajaj Finserv Head Office',
      testData['adressline2'] || 'Sakore Nagar, Viman Nagar',
      testData['adressline3'] || 'Pune, Maharashtra',
      testData['arealocalityvalue'] || 'Sakore Nagar, Viman Nagar',
      testData['landmarkvalue'] || 'Near Pune International Airport',
      testData['cityvalue'] || 'Pune',
      testData['statevalue'] || 'Maharashtra',
      'Aadhaar',
      testData['poanumbervalue'] || '2222',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await waitForScreenOrThrow(surrogateDetailsPage, 'Surrogate Details', 'Surrogate Details');
  await test.step('Surrogate Details', async () => {
    await surrogateDetailsPage.navigateToSurrogateDetails();
    await surrogateDetailsPage.selectSurrogateDetails(testData['customerbankname'] || 'Axis Bank', 'No', undefined, false);
  });

  await page.waitForTimeout(2000);

  await test.step('Approval Details', async () => {
    await approvalDetailsPage.navigateToApprovalDetails();
    await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
    await page.waitForTimeout(1000);
    await approvalDetailsPage.checkForErrors();
  });

  await page.waitForTimeout(1500);
  console.log('✓ Prerequisites completed up to Additional Details');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE A: E2E — Full flow auto-landing on Permanent Address
// ─────────────────────────────────────────────────────────────────────────────
test.describe('13A - Permanent Address [E2E Full Flow]', () => {
  // Set explicit timeout for long E2E workflow execution (7 minutes)
  test.setTimeout(420000);

  let testData: Record<string, string>;
  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  // ─── 14A-1: Positive — Proceed through Permanent Address ───────────────────
  test('13A-1: E2E → Permanent Address → Fill Pincode and Click Proceed → Navigate to Next Screen', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage
  }) => {
    await completeFullPrerequisitesToPermanentAddress({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage
    }, testData);

    await test.step('Navigate to Permanent Address', async () => {
      await permanentAddressPage.navigateToPermanentAddress();
    });

    await test.step('Fill Permanent Address Details', async () => {
      await permanentAddressPage.fillPermanentAddressDetails('Self Owned', '411014', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Sakore Nagar, Viman Nagar', 'Pune', 'Maharashtra', 'Aadhaar', '2222');
    });

    await test.step('Click Proceed on Permanent Address', async () => {
      await permanentAddressPage.clickProceed();
    });

    // Verify no error banner appears
    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
    console.log('✓ 14A-1 Passed: Permanent Address proceeded successfully');
  });

  // ─── 14A-2: Validation — Verify address fields are enabled and editable ───
  test('13A-2 [positive]: E2E → Permanent Address → Verify Fields Enabled (Editable)', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage
  }) => {
    await completeFullPrerequisitesToPermanentAddress({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage
    }, testData);

    await test.step('Navigate to Permanent Address', async () => {
      await permanentAddressPage.navigateToPermanentAddress();
    });

    await test.step('Check if address fields are enabled and editable', async () => {
      const isEditable = await permanentAddressPage.verifyAddressLineIsEditable();
      expect(isEditable).toBe(true);
      console.log('✓ 13A-2 Passed: Address fields are enabled and can be edited');
    });
  });

  // ─── 14A-3: Feature — Verify Proceed button visibility and enabled state ───────────
  test('13A-3 [Feature]: E2E → Permanent Address → Verify Proceed Button Visible & Enabled', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage
  }) => {
    await completeFullPrerequisitesToPermanentAddress({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage
    }, testData);

    await test.step('Navigate to Permanent Address', async () => {
      await permanentAddressPage.navigateToPermanentAddress();
    });

    await test.step('Verify Proceed button is visible and enabled', async () => {
      const isProceedVisible = await permanentAddressPage.isProceedButtonVisible();
      expect(isProceedVisible).toBe(true);
      console.log('✓ Proceed button is visible');

      const proceedBtn = page.getByRole('button', { name: /proceed/i }).first();
      const isEnabled = await proceedBtn.isEnabled({ timeout: 2000 }).catch(() => false);
      expect(isEnabled).toBe(true);
      console.log('✓ Proceed button is enabled');
      console.log('✓ 14A-3 Passed: Proceed button is visible and enabled');
    });
  });
});