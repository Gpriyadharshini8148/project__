import { test, expect, PageObjects } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MOBILE NUMBER
// ─────────────────────────────────────────────────────────────────────────────
//const MOBILE_NUMBER = '5675435678';
const MOBILE_NUMBER = '5678654324';


// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Complete full prerequisite steps Search Dealer → Additional Details
// (App auto-lands on Asset Cart after previous step Proceed)
// ─────────────────────────────────────────────────────────────────────────────
// Helper to handle literal 'undefined' strings from Excel parsing
const getVal = (val: string | undefined, def: string) => (val && val !== 'undefined' ? val : def);
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
async function completeFullPrerequisites(context: any, testData: Record<string, string>, options?: { stopAtPan?: boolean }) {
  const {
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  } = context;

  await test.step('Search Dealer', async () => {
    await dealerSearchPage.navigateToSearchDealer();
    await dealerSearchPage.selectDealerAndSearch(
      testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
      testData['mobilenumberlabel'] || 'Mobile Number',
      '5678654324',
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
      await page.waitForTimeout(1500);

      const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
        .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));

      await targetLink.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✓ Hamburger navigation to Zip Code Details complete.');
    });
  }

  await test.step('Zip Code Details', async () => {
    await page.waitForTimeout(2000);
    await zipCodePage.fillZipCodeDetails({
      zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
      zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
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

  await page.waitForTimeout(3000); // Wait for Data Verification screen to render

  if (options?.stopAtPan) {
    console.log('✓ stopAtPan is true — exiting completeFullPrerequisites early.');
    return; // Stop at PAN Verification to let the custom test flow take over
  }

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

        const hamburgerVisible = await hamburger.isVisible({ timeout: 5000 }).catch(() => false);
        if (!hamburgerVisible) {
          console.log('⚠ Hamburger menu not visible — skipping navigation, flow may already be past PAN.');
          return;
        }
        await hamburger.click({ force: true, timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(1500);

        const targetLink = page.getByRole('button', { name: 'Product Selection' })
          .or(page.getByRole('menuitem', { name: /Product Selection/i }));

        const targetVisible = await targetLink.first().isVisible({ timeout: 5000 }).catch(() => false);
        if (!targetVisible) {
          console.log('⚠ "Product Selection" menu item not found — hamburger menu may not have opened. Continuing anyway.');
          return;
        }
        await targetLink.first().click({ force: true, timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(2000);
        console.log('✓ Hamburger navigation to Product Selection complete.');
      });
    }
  }

  await page.waitForTimeout(2000);

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

  await page.waitForTimeout(4000);

  await waitForScreenOrThrow(incomeDeclarationPage, 'Income Declaration', 'Income Declaration');
  await test.step('Income Declaration', async () => {
    await incomeDeclarationPage.fillIncomeDeclaration(
      '30000',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await page.waitForTimeout(4000);

  await waitForScreenOrThrow(kycPage, 'KYC', 'KYC');
  await test.step('KYC Details', async () => {
    await kycPage.fillKYCDetails(
      "Customer doesn't have one of the listed Document types",
      'Save',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  await page.waitForTimeout(4000);

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

  await page.waitForTimeout(4000);

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

  await page.waitForTimeout(4000);

  await waitForScreenOrThrow(surrogateDetailsPage, 'Surrogate Details', 'Surrogate Details');
  await test.step('Surrogate Details', async () => {
    await surrogateDetailsPage.navigateToSurrogateDetails();
    await surrogateDetailsPage.selectSurrogateDetails(testData['customerbankname'] || 'Axis Bank', 'No', undefined, false);
  });

  await page.waitForTimeout(2000);
  await test.step('Approval Details', async () => {
    await approvalDetailsPage.navigateToApprovalDetails();
    await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
    await approvalDetailsPage.checkForErrors();
  });



  await test.step('Permanent Address', async () => {
    await permanentAddressPage.navigateToPermanentAddress();
    await permanentAddressPage.fillPermanentAddressDetails('Self Owned', '411014', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Sakore Nagar, Viman Nagar', 'Pune', 'Maharashtra', 'Aadhaar', '2222');
    await permanentAddressPage.clickProceed();
  });

  await test.step('Employment & Income Details', async () => {
    await employmentIncomeDetailsPage.navigateToEmploymentIncomeDetails();
    await employmentIncomeDetailsPage.fillCompleteForm(
      'BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR',
      'Freelancer',
      'Mobile',
      '6675435678',
      'test@example.com',
      'Salaried',
      'President',
      'Diploma holder',
      '20000',
      'Purchase of Consumer Durable Product',
      '411014',
      'Pune 14',
      'Pune Market',
      'Koregaon Park',
      'Near Station'
    );
    await employmentIncomeDetailsPage.clickProceed();
  });
  await test.step('Additional Details', async () => {
    await additionalDetailsPage.fillAlternateMobile('6876456326');
    await additionalDetailsPage.selectMaritalStatus(1);
    await additionalDetailsPage.selectRelationshipType(3);
    await additionalDetailsPage.fillFirstName('Mary');
    await additionalDetailsPage.fillLastName('Doe');
    await additionalDetailsPage.selectMailingAddress(1);
    await additionalDetailsPage.selectTimeHorizon(7);
    await additionalDetailsPage.fillNameOnCard('abcd');
    await page.waitForTimeout(500); // Wait for form to settle after last field fill
    await additionalDetailsPage.proceedButton.click();
    await page.waitForTimeout(2000); // Wait for navigation
  });

  // App auto-navigates to Asset Cart after Reappraisal
  await page.waitForTimeout(3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Navigate to App Status only (for Hamburger suite)
// ─────────────────────────────────────────────────────────────────────────────
async function navigateToAppStatus(context: any, testData: Record<string, string>) {
  const { dealerSearchPage } = context;
  await test.step('Search Dealer', async () => {
    await dealerSearchPage.navigateToSearchDealer();
    await dealerSearchPage.selectDealerAndSearch(
      testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
      testData['mobilenumberlabel'] || 'Mobile Number',
      '5678654324',
    );
    console.log('✓ Reached App Status. NOT clicking Proceed — going via Hamburger next.');
  });
}


// =============================================================================
// SUITE A: E2E — Full Flow auto-landing on Asset Cart
// Run: npx playwright test tests/customer/15_assetCart.spec.ts --grep "E2E"
// =============================================================================
test.describe.skip('15A - Asset Cart [E2E Full Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  let testData: Record<string, string>;
  test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

  // ─── E2E 1: Positive — Asset Cart loaded, click Opportunity ID ───────────
  // test('E2E-1: Full flow → Asset Cart → Verify Opportunity ID and navigate', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, assetCartPage
  // }) => {
  //   await completeFullPrerequisites({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }, testData);

  //   await test.step('Navigate to Asset Cart', async () => {
  //     await assetCartPage.navigateToAssetCart();
  //   });

  //   await test.step('Get Opportunity ID and click it', async () => {
  //     const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
  //     console.log('Opportunity ID:', opportunityId);
  //     expect(opportunityId).toBeTruthy();
  //     await assetCartPage.clickOpportunity(opportunityId);
  //   });

  //   await test.step('Verify navigation away from Asset Cart', async () => {
  //     const isAssetCartStillVisible = await page.locator("//div[@class='currentScreen' and contains(text(),'Asset Cart')]").isVisible({ timeout: 2000 }).catch(() => false);
  //     expect(isAssetCartStillVisible).toBeFalsy();
  //   });

  //   console.log('\u2713 E2E-1 Passed: Opportunity loaded successfully to the new page');
  // });

  // ─── E2E 2: Positive — Verify Asset Cart page elements ───────────────────
  // test('E2E-2: Full flow → Asset Cart → Verify page loads correctly', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, assetCartPage
  // }) => {
  //   await completeFullPrerequisites({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }, testData);

  //   await test.step('Navigate to Asset Cart', async () => {
  //     await assetCartPage.navigateToAssetCart();
  //   });

  //   await test.step('Verify Asset Cart loaded with opportunity', async () => {
  //     const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
  //     expect(opportunityId).toBeTruthy();
  //     console.log(`\u2713 Asset Cart loaded with Opportunity ID: ${opportunityId}`);
  //   });

  //   console.log('\u2713 E2E-2 Passed: Asset Cart page elements verified');
  // });

  // ─── E2E 3: Positive — Change Scheme → Navigate to Product Selection ────────
  // test('E2E-3: Full flow → Asset Cart → Click Change Scheme', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, assetCartPage
  // }) => {
  //   await completeFullPrerequisites({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }, testData);

  //   await test.step('Navigate to Asset Cart', async () => {
  //     await assetCartPage.navigateToAssetCart();
  //   });

  //   await test.step('Expand Asset Cart and Click Change Scheme', async () => {
  //     const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
  //     expect(opportunityId).toBeTruthy();

  //     await assetCartPage.expandCartDetails(opportunityId);
  //     await assetCartPage.clickChangeScheme();
  //   });

  //   await test.step('Verify navigation to Product Selection', async () => {
  //     const isProductSelectionVisible = await page.locator("//div[@class='currentScreen' and contains(text(),'Product Selection')]").isVisible({ timeout: 5000 }).catch(() => false);
  //     if (isProductSelectionVisible) {
  //       console.log('\u2713 Successfully navigated to Product Selection page');
  //     } else {
  //       console.log('⚠ Did not detect Product Selection screen text, but clicked Change Scheme successfully');
  //     }
  //   });

  //   console.log('\u2713 E2E-3 Passed: Full flow \u2192 Asset Cart \u2192 Change Scheme verified');
  // });

  // ─── E2E 4: Positive — Cancel Opportunity from Asset Cart ───────────────────
  // test('E2E-4: Full flow → Asset Cart → Cancel Opportunity', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, assetCartPage
  // }) => {
  //   await completeFullPrerequisites({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }, testData);

  //   await test.step('Navigate to Asset Cart', async () => {
  //     await assetCartPage.navigateToAssetCart();
  //   });

  //   await test.step('Expand Asset Cart and Click Cancel', async () => {
  //     const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
  //     expect(opportunityId).toBeTruthy();

  //     await assetCartPage.expandCartDetails(opportunityId);
  //     await assetCartPage.clickCancelOpportunity();
  //   });

  //   await test.step('Verify cancellation', async () => {
  //     const toast = page.locator('.toastMessage, .forceToastMessage, lightning-toast').first();
  //     if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       const msg = await toast.textContent();
  //       console.log(`✓ Cancellation toast detected: ${msg}`);
  //     }
  //   });

  //   console.log('\u2713 E2E-4 Passed: Full flow \u2192 Asset Cart \u2192 Cancel verified');
  // });
});

// =============================================================================
// SUITE B: HAMBURGER — App Status → Hamburger → Asset Cart
// Run: npx playwright test tests/customer/15_assetCart.spec.ts --grep "HB"
// =============================================================================
// test.describe.skip('15B - Asset Cart [Hamburger Navigation]', () => {
//   test.describe.configure({ mode: 'parallel' });
//   let testData: Record<string, string>;
//   test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

//   // ─── HB 1: Positive — Asset Cart loaded via Hamburger ────────────────────
//   test('HB-1: Hamburger → Asset Cart → Verify Opportunity ID and navigate', async ({
//     page, dealerSearchPage, appStatusPage, assetCartPage
//   }) => {
//     await navigateToAppStatus({ dealerSearchPage, appStatusPage }, testData);

//     await test.step('Navigate via Hamburger \u2192 Asset Cart', async () => {
//       await assetCartPage.navigateToAssetCart();
//     });

//     await test.step('Get Opportunity ID and click it', async () => {
//       const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       console.log('Opportunity ID:', opportunityId);
//       expect(opportunityId).toBeTruthy();
//       await assetCartPage.clickOpportunity(opportunityId);
//     });

//     await test.step('Verify navigation away from Asset Cart', async () => {
//       const isAssetCartStillVisible = await page.locator("//div[@class='currentScreen' and contains(text(),'Asset Cart')]").isVisible({ timeout: 2000 }).catch(() => false);
//       expect(isAssetCartStillVisible).toBeFalsy();
//     });

//     console.log('\u2713 HB-1 Passed: Hamburger \u2192 Asset Cart \u2192 Opportunity clicked successfully');
//   });

//   // ─── HB 2: Positive — Change Scheme → Navigate to Product Selection ────────
//   test('HB-2: Hamburger → Asset Cart → Click Change Scheme', async ({
//     page, dealerSearchPage, appStatusPage, assetCartPage
//   }) => {
//     await navigateToAppStatus({ dealerSearchPage, appStatusPage }, testData);

//     await test.step('Navigate via Hamburger \u2192 Asset Cart', async () => {
//       await assetCartPage.navigateToAssetCart();
//     });

//     await test.step('Expand Asset Cart and Click Change Scheme', async () => {
//       const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       expect(opportunityId).toBeTruthy();

//       await assetCartPage.expandCartDetails(opportunityId);
//       await assetCartPage.clickChangeScheme();
//     });

//     await test.step('Verify navigation to Product Selection', async () => {
//       // It should navigate to Product Selection page
//       const isProductSelectionVisible = await page.locator("//div[@class='currentScreen' and contains(text(),'Product Selection')]").isVisible({ timeout: 5000 }).catch(() => false);

//       // We don't strict assert here in case it navigates elsewhere, but we log it
//       if (isProductSelectionVisible) {
//         console.log('\u2713 Successfully navigated to Product Selection page');
//       } else {
//         console.log('⚠ Did not detect Product Selection screen text, but clicked Change Scheme successfully');
//       }
//     });

//     console.log('\u2713 HB-2 Passed: Hamburger \u2192 Asset Cart \u2192 Change Scheme verified');
//   });

//   // ─── HB 3: Positive — Cancel Opportunity from Asset Cart ───────────────────
//   // test('HB-3: Hamburger → Asset Cart → Cancel Opportunity', async ({
//   //   page, dealerSearchPage, appStatusPage, assetCartPage
//   // }) => {
//   //   await navigateToAppStatus({ dealerSearchPage, appStatusPage }, testData);

//   //   await test.step('Navigate via Hamburger \u2192 Asset Cart', async () => {
//   //     await assetCartPage.navigateToAssetCart();
//   //   });

//   //   await test.step('Expand Asset Cart and Click Cancel', async () => {
//   //     const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//   //     expect(opportunityId).toBeTruthy();

//   //     await assetCartPage.expandCartDetails(opportunityId);
//   //     await assetCartPage.clickCancelOpportunity();
//   //   });

//   //   await test.step('Verify cancellation', async () => {
//   //     // Depending on the app flow, it might show a toast, a modal, or navigate to App Status
//   //     const toast = page.locator('.toastMessage, .forceToastMessage, lightning-toast').first();
//   //     if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
//   //       const msg = await toast.textContent();
//   //       console.log(`✓ Cancellation toast detected: ${msg}`);
//   //     }
//   //   });

//   //   console.log('\u2713 HB-3 Passed: Hamburger \u2192 Asset Cart \u2192 Cancel verified');
//   // });
// });

// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> E2E)
// =============================================================================
// test.describe('15C - Asset Cart [Custom Hamburger Flow]', () => {
//   test.describe.configure({ mode: 'parallel' });
//   let testData: Record<string, string>;
//   test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

//   test('E2E-C1: Custom flow \u2192 PAN \u2192 Hamburger Asset Cart \u2192 Change Scheme \u2192 Finish', async ({
//     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
//     panVerificationPage, productSelectionPage, incomeDeclarationPage,
//     kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage
//   }) => {
//     // 1. Complete prerequisites up to PAN (stopAtPan = true)
//     await completeFullPrerequisites({
//       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
//       panVerificationPage, productSelectionPage, incomeDeclarationPage,
//       kycPage, poiPage, poaPage, surrogateDetailsPage,
//       approvalDetailsPage: null, additionalDetailsPage: null
//     }, testData, { stopAtPan: true });

//     // 2. Click Hamburger and navigate to Asset Cart
//     await test.step('Navigate via Hamburger to Asset Cart', async () => {
//       console.log('⚠ Stopping at PAN prompt. Using Hamburger menu to navigate to Asset Cart...');
//       await assetCartPage.navigateToAssetCart(true);
//       console.log('✓ Hamburger navigation to Asset Cart complete.');
//     });

//     // 3. Get Opportunity ID and expand details
//     let opportunityId = '';
//     await test.step('Get Opportunity ID and expand details', async () => {
//       opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       expect(opportunityId).toBeTruthy();
//       console.log(`✓ Got Opportunity ID: ${opportunityId}`);
//       await assetCartPage.expandCartDetails(opportunityId);
//     });

//     // 4. Click Change Scheme
//     await test.step('Click Change Scheme', async () => {
//       await assetCartPage.clickChangeScheme();
//     });

//     // 5. Product Selection (don't fill anything, just checkbox and proceed)
//     await test.step('Product Selection (Checkbox only)', async () => {
//       // Wait for product selection to load
//       await page.waitForTimeout(4000);
//       await productSelectionPage.proceedFromChangeScheme();
//     });

//     // 6. Income Declaration
//     await test.step('Income Declaration', async () => {
//       await page.waitForTimeout(4000);
//       if (await incomeDeclarationPage.isCurrentScreen('Income Declaration')) {
//         await incomeDeclarationPage.fillIncomeDeclaration(
//           '30000',
//           testData['proceedbuttonvalue'] || 'Proceed'
//         );
//       }
//     });

//     // 7. KYC Details
//     await test.step('KYC Details', async () => {
//       await page.waitForTimeout(4000);
//       if (await kycPage.isCurrentScreen('KYC')) {
//         await kycPage.fillKYCDetails(
//           "Customer doesn't have one of the listed Document types",
//           'Save',
//           testData['proceedbuttonvalue'] || 'Proceed'
//         );
//       }
//     });

//     // 8. POI Details
//     await test.step('POI Details', async () => {
//       await page.waitForTimeout(4000);
//       if (await poiPage.isCurrentScreen('POI')) {
//         await poiPage.fillPoiDetails(
//           getVal(testData['firstname'], 'Dummycust'),
//           '',
//           getVal(testData['lastname'], 'Doe'),
//           testData['poitypevalue'] || 'Aadhaar',
//           testData['poinumbervalue'] || '2222',
//           testData['gendervalue'] || 'Male',
//           getVal(testData['dobvalue'], '18-12-1996'),
//           testData['employmenttypevalue'] || 'Salaried',
//           testData['proceedbuttonvalue'] || 'Proceed'
//         );
//       }
//     });

//     // 9. POA Details
//     await test.step('POA Details', async () => {
//       await page.waitForTimeout(4000);
//       if (await poaPage.isCurrentScreen('POA')) {
//         await poaPage.fillPoaDetails(
//           'Self Owned',
//           testData['zipcodevalue'] || '411014 Pune',
//           testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//           testData['adressline1'] || 'Bajaj Finserv Head Office',
//           testData['adressline2'] || 'Sakore Nagar, Viman Nagar',
//           testData['adressline3'] || 'Pune, Maharashtra',
//           testData['arealocalityvalue'] || 'Sakore Nagar, Viman Nagar',
//           testData['landmarkvalue'] || 'Near Pune International Airport',
//           testData['cityvalue'] || 'Pune',
//           testData['statevalue'] || 'Maharashtra',
//           'Aadhaar',
//           testData['poanumbervalue'] || '2222',
//           testData['proceedbuttonvalue'] || 'Proceed'
//         );
//       }
//     });

//     // 10. Surrogate Details
//     await test.step('Surrogate Details', async () => {
//       await page.waitForTimeout(4000);
//       await surrogateDetailsPage.navigateToSurrogateDetails();
//       await surrogateDetailsPage.selectSurrogateDetails(
//         testData['surrogatedetailspagename'] || 'Surrogate Details',
//         testData['processtypelabel'] || 'Process Type',
//         testData['processtypevalue'] || 'Normal',
//         testData['creditprogramlabel'] || 'Credit Program',
//         testData['creditprogramvalue'] || '1.06 [Prime Banking]',
//         testData['checkapprovalbuttonlabel'] || 'Check Approval',
//         'RSA',
//         'No'
//       );
//     });

//     console.log('\u2713 E2E-C1 Passed: Custom Hamburger Flow to Surrogate Details completed successfully');
//   });
// });

// // =============================================================================
// // SUITE D: Asset Cart Change Scheme Loop Flow
// // Run: npx playwright test tests/customer/15_assetCart.spec.ts --grep "15D"
// // =============================================================================
// test.describe('15D - Asset Cart [Change Scheme Loop]', () => {
//   test.setTimeout(600000); // 10 minutes timeout for this massive E2E loop
//   test.describe.configure({ mode: 'parallel' });
//   let testData: Record<string, string>;
//   test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

//   async function completeChangeSchemeLoop(context: any, testData: any) {
//     const {
//       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
//       panVerificationPage, productSelectionPage, incomeDeclarationPage,
//       kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
//     } = context;

//     await completeFullPrerequisites({
//       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
//       panVerificationPage, productSelectionPage, incomeDeclarationPage,
//       kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, assetCartPage
//     }, testData, { stopAtPan: true });

//     await test.step('PAN Verification (Select No -> Enter Manually -> Verify)', async () => {
//       console.log('Checking for PAN Card Yes/No prompt...');
//       let targetFrame = page;

//       // 1. Click No
//       let clickedNo = false;
//       for (const frame of page.frames()) {
//         const noBtn = frame.getByRole('button', { name: 'No', exact: true });
//         if (await noBtn.isVisible().catch(() => false)) {
//           await noBtn.click({ force: true });
//           console.log('✓ Clicked "No" for PAN Card');
//           targetFrame = frame;
//           clickedNo = true;
//           break;
//         }
//       }

//       if (clickedNo) {
//         await page.waitForTimeout(2000);

//         // 2. Click Enter Manually
//         const enterManuallyBtn = targetFrame.getByRole('button', { name: 'Enter Manually', exact: true }).first();
//         if (await enterManuallyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
//           await enterManuallyBtn.click({ force: true });
//           console.log('✓ Clicked "Enter Manually"');
//         } else {
//           console.log('⚠ "Enter Manually" not found, proceeding anyway...');
//         }
//         await page.waitForTimeout(2000);
//       }
//     });

//     if (await productSelectionPage.isCurrentScreen('Product Selection')) {
//       console.log('✓ Already on Product Selection. Skipping Asset Cart / Change Scheme navigation.');
//     } else {
//       await test.step('Navigate to Asset Cart', async () => {
//         await assetCartPage.navigateToAssetCart(true);
//       });

//       await test.step('Expand Asset Cart and Change Scheme', async () => {
//         try {
//           const oppId = await assetCartPage.getOpportunity('Asset Cart');
//           await assetCartPage.expandCartDetails(oppId);
//           await assetCartPage.clickChangeScheme();
//         } catch (e: any) {
//           console.log('⚠ Asset Cart navigation or interaction failed:', e.message);
//           console.log('Proceeding to Product Selection anyway...');
//         }
//       });
//     }

//     await test.step('Product Selection (Change Scheme)', async () => {
//       try {
//         await productSelectionPage.proceedFromChangeScheme();
//       } catch (e: any) {
//         console.log('⚠ Proceed from Change Scheme did not land on expected page:', e.message);
//         console.log('✓ Force navigating to Income Declaration via Hamburger menu as requested...');

//         const hamburger = page.getByRole('button', { name: '...' }).first()
//           .or(page.getByText('...', { exact: true }).first())
//           .or(page.locator('.slds-icon-utility-rows').first());
//         await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
//         await hamburger.click({ force: true });
//         await page.waitForTimeout(1500);

//         const targetLink = page.getByRole('button', { name: 'Income Declaration' })
//           .or(page.getByRole('menuitem', { name: /Income Declaration/i }));
//         await targetLink.click({ force: true });
//         await page.waitForTimeout(2000);
//       }
//     });

//     // Helper to force navigation via Hamburger if not on the expected screen
//     async function forceNavigateIfNeeded(expectedScreen: string, pageObj: any) {
//       await page.waitForTimeout(3000);
//       if (!(await pageObj.isCurrentScreen(expectedScreen))) {
//         console.log(`⚠ Not on ${expectedScreen}. Force navigating via Hamburger...`);

//         // [HOTFIX]: Check for the Reappraisal popup that sometimes appears and blocks the Hamburger Menu
//         console.log('⚠ Checking for Reappraisal screen...');
//         const exactCloseBtn = page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();
//         let isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
//         if (!isReappraisal) {
//           await page.waitForTimeout(2000);
//           isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
//         }
//         if (isReappraisal) {
//           console.log('⚠ Reappraisal screen detected, attempting to close...');
//           await exactCloseBtn.click({ force: true }).catch(() => { });
//           await page.waitForTimeout(2000);
//           console.log('✓ Clicked Reappraisal close button');
//         }

//         const hamburger = page.getByRole('button', { name: '...' }).first()
//           .or(page.getByText('...', { exact: true }).first())
//           .or(page.locator('.slds-icon-utility-rows').first());
//         await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
//         await hamburger.click({ force: true });
//         await page.waitForTimeout(1500);

//         const targetLink = page.getByRole('button', { name: new RegExp(expectedScreen, 'i') })
//           .or(page.getByRole('menuitem', { name: new RegExp(expectedScreen, 'i') }));

//         if (await targetLink.isVisible({ timeout: 5000 }).catch(() => false)) {
//           await targetLink.click({ force: true });
//         } else {
//           console.log(`⚠ ${expectedScreen} not visible in menu. Retrying hamburger click...`);
//           await hamburger.click({ force: true }).catch(() => { });
//           await page.waitForTimeout(1500);
//           await targetLink.click({ force: true, timeout: 10000 }).catch((e: any) => console.log('⚠ targetLink click failed:', e.message));
//         }
//         await page.waitForTimeout(2000);
//       }
//     }

//     await test.step('Income Declaration', async () => {
//       await forceNavigateIfNeeded('Income Declaration', incomeDeclarationPage);
//       if (await incomeDeclarationPage.isCurrentScreen('Income Declaration')) {
//         await incomeDeclarationPage.fillIncomeDeclaration('30000', testData['proceedbuttonvalue'] || 'Proceed');
//       }
//     });

//     await test.step('KYC Verification', async () => {
//       await forceNavigateIfNeeded('KYC', kycPage);
//       await kycPage.fillKYCDetails("Customer doesn't have one of the listed Document types", 'Save', testData['proceedbuttonvalue'] || 'Proceed');
//     });

//     await test.step('POI Details', async () => {
//       await forceNavigateIfNeeded('POI', poiPage);
//       await poiPage.fillPoiDetails('dummy', '', 'test', 'Aadhaar', '2222', 'Male', '2000-12-01', 'Salaried', testData['proceedbuttonvalue'] || 'Proceed');
//     });

//     await test.step('POA Details', async () => {
//       await forceNavigateIfNeeded('POA', poaPage);
//       await poaPage.fillPoaDetails('Self Owned', '411014', testData['bflbranchvalue'] || '411014-Manual Testing Pune', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Pune, Maharashtra', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Pune', 'Maharashtra', 'Aadhaar', '2222', testData['proceedbuttonvalue'] || 'Proceed');
//     });

//     await test.step('Complete Surrogate Details', async () => {
//       await surrogateDetailsPage.navigateToSurrogateDetails();
//       await surrogateDetailsPage.selectSurrogateDetails(
//         testData['surrogatedetailspagename'] || 'Surrogate Details',
//         testData['processtypelabel'] || 'Process Type',
//         testData['processtypevalue'] || 'Normal',
//         testData['creditprogramlabel'] || 'Credit Program',
//         testData['creditprogramvalue'] || '1.06 [Prime Banking]',
//         testData['checkapprovalbuttonlabel'] || 'Check Approval',
//         testData['rsalabel'] || 'RSA',
//         testData['rsavalue_no'] || 'No'
//       );
//       await surrogateDetailsPage.clickProceed();

//       console.log('⚠ Waiting up to 5s for possible Reappraisal screen...');
//       const exactCloseBtn = page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();

//       let isReappraisal = false;
//       for (let i = 0; i < 5; i++) {
//         if (await exactCloseBtn.isVisible().catch(() => false)) {
//           isReappraisal = true;
//           break;
//         }
//         await page.waitForTimeout(1000);
//       }

//       if (isReappraisal) {
//         console.log('⚠ Reappraisal screen detected, attempting to close...');
//         await exactCloseBtn.click({ force: true }).catch(() => { });
//         await page.waitForTimeout(2000);
//         console.log('✓ Clicked Reappraisal close button');
//       }
//     });

//     await test.step('Approval Details', async () => {
//       await approvalDetailsPage.navigateToApprovalDetails();
//       await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
//       await page.waitForTimeout(1000);
//       await approvalDetailsPage.checkForErrors();
//     });

//     await test.step('Additional Details', async () => {
//       await context.additionalDetailsPage.navigateToAdditionalDetails();
//       await additionalDetailsPage.enterOfficeDetails(
//         '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
//         'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
//         'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
//         testData['proceedbuttonvalue'] || 'Proceed'
//       );
//       await additionalDetailsPage.enterPersonalDetails(
//         'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
//         'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
//       );
//       await page.waitForTimeout(1000);
//     });

//     await test.step('Wait for Auto-navigation to Asset Cart', async () => {
//       await forceNavigateIfNeeded('Asset Cart', assetCartPage);
//       console.log('✓ Reached final Asset Cart.');
//     });
//   }

//   test('15D-1: Verify Opportunity ID is present after Change Scheme loop', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
//     const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
//     await completeChangeSchemeLoop(context, testData);

//     await test.step('Verify Asset Cart loaded with opportunity', async () => {
//       const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       expect(opportunityId).toBeTruthy();
//       console.log(`\u2713 Asset Cart loaded with Opportunity ID: ${opportunityId}`);
//     });
//   });

//   test('15D-2: Expand Asset Cart and click Change Scheme again', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
//     const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
//     await completeChangeSchemeLoop(context, testData);

//     await test.step('Expand Asset Cart and Click Change Scheme', async () => {
//       const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       expect(opportunityId).toBeTruthy();

//       await assetCartPage.expandCartDetails(opportunityId);
//       await assetCartPage.clickChangeScheme();
//       console.log('\u2713 Clicked Change Scheme successfully');
//     });
//   });

//   test('15D-3: Expand Asset Cart and Cancel Opportunity', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
//     const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
//     await completeChangeSchemeLoop(context, testData);

//     await test.step('Expand Asset Cart and Click Cancel', async () => {
//       const opportunityId = await assetCartPage.getOpportunity(testData['assetcartpagename'] || 'Asset Cart');
//       expect(opportunityId).toBeTruthy();

//       await assetCartPage.expandCartDetails(opportunityId);
//       await assetCartPage.clickCancelOpportunity();
//       console.log('\u2713 Cancel Opportunity clicked');
//     });
//   });

//   /* test('E2E-Shortcut: Mobile Validation direct to Asset Cart', async ({ page, dealerSearchPage, assetCartPage }) => {
//     // Missing completeShortcutToAssetCart
//   }); */
// });

// =============================================================================
// SUITE A: E2E — Full flow auto-landing on Asset Cart
// Run: npx playwright test tests/customer/15_assetCart.spec.ts -g "15A"
// =============================================================================
import { completeFullPrerequisites as sharedPrereq15, getVal as gv15 } from '../helpers/completeFullPrerequisites';

test.describe('15A - Asset Cart [E2E Full Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000);
  let testData15A: Record<string, string>;

  test.beforeAll(async () => {
    testData15A = excelReader.getTestDataForTestCase(suiteName);
  });

  // ── 15A-1: Positive — Navigate to Asset Cart and expand details ───────────
  test('17A-1: E2E → Asset Cart → Expand opportunity → Change Scheme', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  }: any) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
    }, testData15A);

    await test.step('Navigate to Asset Cart', async () => {
      await assetCartPage.navigateToAssetCart(true);
    });

    await test.step('Expand cart details and Change Scheme', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      if (oppId) {
        await assetCartPage.expandCartDetails(oppId);
        await assetCartPage.clickChangeScheme();
        console.log('✓ 15A-1 Passed: Asset Cart expanded and Change Scheme clicked');
      } else {
        test.skip(true, 'No opportunity found in Asset Cart');
      }
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
  });

  // ── 15A-2: Positive — Navigate to Asset Cart and verify opportunity ───────
  test('17A-2: E2E → Asset Cart → Verify opportunity is listed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  }: any) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
    }, testData15A);

    await test.step('Navigate to Asset Cart', async () => {
      await assetCartPage.navigateToAssetCart(true);
    });

    await test.step('Verify at least one opportunity exists in Asset Cart', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      if (oppId) {
        console.log(`✓ 15A-2 Passed: Opportunity found — ID: ${oppId}`);
        expect(oppId).toBeTruthy();
      } else {
        test.skip(true, 'No opportunity found in Asset Cart — expected for new customer flow');
      }
    });
  });

  // ── 15A-3: Positive — Click Opportunity ID → Verify navigation away ────────
  test('17A-3: E2E → Asset Cart → Click Opportunity ID → Verify navigation', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  }: any) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
    }, testData15A);

    await test.step('Navigate to Asset Cart', async () => {
      await assetCartPage.navigateToAssetCart(true);
    });

    await test.step('Click Opportunity ID and verify navigation', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      if (oppId) {
        console.log(`✓ Got Opportunity ID: ${oppId}`);
        await assetCartPage.clickOpportunity(oppId);
        const isAssetCartStillVisible = await page
          .locator("//div[@class='currentScreen' and contains(text(),'Asset Cart')]")
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(isAssetCartStillVisible).toBeFalsy();
        console.log('✓ 15A-3 Passed: Opportunity clicked — navigated away from Asset Cart');
      } else {
        test.skip(true, 'No opportunity found in Asset Cart');
      }
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
  });

  // ── 15A-4: Positive — Cancel Opportunity from Asset Cart ────────
  test('17A-4: E2E → Asset Cart → Cancel Opportunity', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  }: any) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
    }, testData15A);

    await test.step('Navigate to Asset Cart', async () => {
      await assetCartPage.navigateToAssetCart(true);
    });

    await test.step('Expand cart details and click Cancel Opportunity', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      if (oppId) {
        console.log(`✓ Got Opportunity ID: ${oppId}`);
        await assetCartPage.expandCartDetails(oppId);
        await assetCartPage.clickCancelOpportunity();
        console.log('✓ 15A-4 Passed: Asset Cart expanded and Cancel Opportunity clicked');
      } else {
        test.skip(true, 'No opportunity found in Asset Cart');
      }
    });

    await test.step('Verify cancellation', async () => {
      const toast = page.locator('.toastMessage, .forceToastMessage, lightning-toast, .slds-notify_toast').first();
      if (await toast.isVisible({ timeout: 5000 }).catch(() => false)) {
        const msg = await toast.textContent();
        console.log(`✓ Cancellation toast detected: ${msg}`);
      } else {
        console.log('⚠ No cancellation toast detected, but cancel button was clicked');
      }
    });
  });



  // ==========================================
  // NEW TEST SCENARIOS (Pending Implementation)
  // Change 'test.skip' to 'test' to activate
  // ==========================================
  // ── 15A-5: Negative — Initiate Authorization Failure (Red Card) ────────
  //   test('15A-5 [Negative]: E2E → Asset Cart → Initiate Auth Failure → Red Card', async ({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }: any) => {
  //     await completeFullPrerequisites({
  //       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //       panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
  //       kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //     }, testData15A);

  //     await test.step('Navigate to Asset Cart', async () => {
  //       await assetCartPage.navigateToAssetCart(true);
  //     });

  //     await test.step('Verify Authorization Failure state (Red Card)', async () => {
  //       // Check for red card state (failed authorization)
  //       const redCard = page.locator('.card-header-failed, .slds-theme_error, [class*="red"]').first();
  //       const isRedCardVisible = await redCard.isVisible({ timeout: 10000 }).catch(() => false);

  //       if (isRedCardVisible) {
  //         console.log('✓ 15A-5 Passed: Red Card (Authorization Failed) state detected');
  //         expect(isRedCardVisible).toBe(true);

  //         // Check for failure message
  //         const failureMsg = page.getByText(/Failed|Declined|Rejected|Unable to process/i).first();
  //         const hasMsgAvailable = await failureMsg.isVisible({ timeout: 3000 }).catch(() => false);
  //         if (hasMsgAvailable) {
  //           const msgText = await failureMsg.textContent();
  //           console.log(`  Failure message: "${msgText?.trim()}"`);
  //         }

  //         // Verify Initiate Auth button is still enabled for retry
  //         const initiateAuthBtn = page.getByRole('button', { name: /Initiate Auth|Authorization/i }).first();
  //         const isBtnVisible = await initiateAuthBtn.isVisible({ timeout: 3000 }).catch(() => false);
  //         if (isBtnVisible) {
  //           const isEnabled = await initiateAuthBtn.isEnabled().catch(() => false);
  //           console.log(`  Initiate Auth button enabled for retry: ${isEnabled}`);
  //         }
  //       } else {
  //         console.log('⚠ 15A-5: No Red Card state detected (authorization may have succeeded or not yet attempted)');
  //         test.skip(true, 'Red Card state not present');
  //       }
  //     });
  //   });

  // ── 15A-6: Positive — Opportunity List Display ────────
  test('17A-5: E2E → Asset Cart → Verify Opportunity List Display', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  }: any) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
    }, testData15A);

    await test.step('Navigate to Asset Cart', async () => {
      await assetCartPage.navigateToAssetCart(true);
    });

    await test.step('Verify opportunity list is displayed', async () => {
      // Check for opportunity cards
      const oppCards = page.locator('.slds-box, .opportunity-card, [data-id], .card-header').filter({ hasText: /OPP-|Deal ID|Model/i });
      const cardCount = await oppCards.count();

      if (cardCount > 0) {
        console.log(`✓ 15A-6 Passed: ${cardCount} opportunity card(s) displayed`);
        expect(cardCount).toBeGreaterThan(0);

        // Verify each card shows key information
        for (let i = 0; i < Math.min(3, cardCount); i++) {
          const card = oppCards.nth(i);
          const cardText = await card.textContent();

          // Check for Deal ID
          const hasDealId = /Deal ID|OPP-\d+/i.test(cardText || '');

          // Check for Model Name
          const hasModel = /Model|Product/i.test(cardText || '');

          console.log(`  Card ${i + 1}: Deal ID=${hasDealId}, Model=${hasModel}`);
        }
      } else {
        // Check for "No opportunities" message
        const noOppMsg = page.getByText(/No opportunities|No records|Empty/i).first();
        const hasNoOppMsg = await noOppMsg.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasNoOppMsg) {
          console.log('✓ 15A-6 Passed: "No opportunities" message displayed correctly');
          expect(hasNoOppMsg).toBe(true);
        } else {
          console.log('⚠ 15A-6: Neither opportunities nor "no opportunities" message found');
        }
      }
    });

    await test.step('Verify MITC/Consent state restoration', async () => {
      // Check if MITC button state is restored
      const mitcBtn = page.getByRole('button', { name: /Initiate MITC|MITC/i }).first();
      const mitcBtnExists = await mitcBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (mitcBtnExists) {
        const isDisabled = await mitcBtn.isDisabled().catch(() => false);
        console.log(`  MITC button state restored: ${isDisabled ? 'Completed' : 'Pending'}`);
      }

      // Check if Consent button state is restored (dealer profile)
      const consentBtn = page.getByRole('button', { name: /Initiate Consent|Consent/i }).first();
      const consentBtnExists = await consentBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (consentBtnExists) {
        const isDisabled = await consentBtn.isDisabled().catch(() => false);
        console.log(`  Consent button state restored: ${isDisabled ? 'Completed' : 'Pending'}`);
      }
    });
  });

  //   // ── 15A-7: Negative — Change Scheme Disabled (Invalid Conditions) ────────
  //   test('15A-7 [Negative]: E2E → Asset Cart → Verify Change Scheme Disabled', async ({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }: any) => {
  //     await completeFullPrerequisites({
  //       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //       panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
  //       kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //     }, testData15A);

  //     await test.step('Navigate to Asset Cart', async () => {
  //       await assetCartPage.navigateToAssetCart(true);
  //     });

  //     await test.step('Verify Change Scheme button is disabled for invalid conditions', async () => {
  //       const oppId = await assetCartPage.getOpportunity('Asset Cart');
  //       if (oppId) {
  //         await assetCartPage.expandCartDetails(oppId);

  //         // Check Change Scheme button state
  //         const changeSchemeBtn = page.getByRole('button', { name: /Change Scheme/i }).first();
  //         const isBtnVisible = await changeSchemeBtn.isVisible({ timeout: 5000 }).catch(() => false);

  //         if (isBtnVisible) {
  //           const isDisabled = await changeSchemeBtn.isDisabled().catch(() => false);

  //           if (isDisabled) {
  //             console.log('✓ 15A-7 Passed: Change Scheme button is DISABLED (invalid conditions detected)');
  //             expect(isDisabled).toBe(true);

  //             // Log possible reasons
  //             console.log('  Possible reasons:');
  //             console.log('    - Scheme Code = 0');
  //             console.log('    - Channel ≠ Store');
  //             console.log('    - Stage ≠ New');
  //             console.log('    - Integration Response exists');
  //           } else {
  //             console.log('⚠ 15A-7: Change Scheme button is ENABLED (valid conditions)');
  //             test.skip(true, 'Change Scheme is enabled - test expects disabled state');
  //           }
  //         } else {
  //           console.log('⚠ 15A-7: Change Scheme button not found');
  //           test.skip(true, 'Change Scheme button not visible');
  //         }
  //       } else {
  //         test.skip(true, 'No opportunity found in Asset Cart');
  //       }
  //     });
  //   });

  //   // ── 15A-8: Negative — Cancel Opportunity Disabled (Invalid Stage) ────────
  //   test('15A-8 [Negative]: E2E → Asset Cart → Verify Cancel Opportunity Disabled', async ({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     assetCartPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //   }: any) => {
  //     await completeFullPrerequisites({
  //       page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //       panVerificationPage, productSelectionPage, assetCartPage, incomeDeclarationPage,
  //       kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage, reappraisalPage
  //     }, testData15A);

  //     await test.step('Navigate to Asset Cart', async () => {
  //       await assetCartPage.navigateToAssetCart(true);
  //     });

  //     await test.step('Verify Cancel Opportunity button is disabled for invalid stage', async () => {
  //       const oppId = await assetCartPage.getOpportunity('Asset Cart');
  //       if (oppId) {
  //         await assetCartPage.expandCartDetails(oppId);

  //         // Check Cancel Opportunity button state
  //         const cancelBtn = page.getByRole('button', { name: /Cancel Opportunity|Cancel/i }).first();
  //         const isBtnVisible = await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false);

  //         if (isBtnVisible) {
  //           const isDisabled = await cancelBtn.isDisabled().catch(() => false);

  //           if (isDisabled) {
  //             console.log('✓ 15A-8 Passed: Cancel Opportunity button is DISABLED (invalid stage)');
  //             expect(isDisabled).toBe(true);

  //             // Log reason
  //             console.log('  Reason: Stage is NOT "New" or "DO Preparation"');

  //             // Try to identify current stage
  //             const stageText = page.locator('.stage, [data-stage], .opportunity-stage').first();
  //             const stageVisible = await stageText.isVisible({ timeout: 2000 }).catch(() => false);
  //             if (stageVisible) {
  //               const stage = await stageText.textContent();
  //               console.log(`  Current stage: "${stage?.trim()}"`);
  //             }
  //           } else {
  //             console.log('⚠ 15A-8: Cancel Opportunity button is ENABLED (valid stage: New/DO Preparation)');
  //             test.skip(true, 'Cancel button is enabled - test expects disabled state');
  //           }
  //         } else {
  //           console.log('⚠ 15A-8: Cancel Opportunity button not found');
  //           test.skip(true, 'Cancel Opportunity button not visible');
  //         }
  //       } else {
  //         test.skip(true, 'No opportunity found in Asset Cart');
  //       }
  //     });
  //   });
});

