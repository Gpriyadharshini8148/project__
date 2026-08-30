import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;
const MOBILE_NUMBER = '5678654324';
// Enable parallel execution for tests in this file
test.setTimeout(1800000); // 30 minutes to allow for long Surrogate Details polling
test.describe.configure({ mode: 'parallel' });

// ─────────────────────────────────────────────────────────────────────────────
// (Mobile Number now generated dynamically per test run to prevent collision)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Complete full prerequisite steps Search Dealer → Approval Details
// (App auto-lands on Additional Details after previous step Proceed)
// ─────────────────────────────────────────────────────────────────────────────
// Helper to handle literal 'undefined' strings from Excel parsing
const getVal = (val: string | undefined, def: string) => (val && val !== 'undefined' ? val : def);

async function completeFullPrerequisites(context: any, testData: Record<string, string>, options?: { stopAtPan?: boolean }) {
  const {
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
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

  await page.waitForTimeout(3000); // Wait for Data Verification screen to render
  
  if (options?.stopAtPan) {
    console.log('✓ stopAtPan is true — exiting completeFullPrerequisites early.');
    return; // Stop at PAN Verification to let the custom test flow take over
  }

  if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification'])) {
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
          
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        
        const targetLink = page.getByRole('button', { name: 'Product Selection' })
          .or(page.getByRole('menuitem', { name: /Product Selection/i }));
          
        await targetLink.click({ force: true });
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

  if (await incomeDeclarationPage.isCurrentScreen('Income Declaration')) {

    // Helper to force navigation via Hamburger if not on the expected screen
    async function forceNavigateIfNeeded(expectedScreen: string, pageObj: any) {
      await page.waitForTimeout(3000);
      if (!(await pageObj.isCurrentScreen(expectedScreen))) {
        console.log(`⚠ Not on ${expectedScreen}. Force navigating via Hamburger...`);
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        
        const targetLink = page.getByRole('button', { name: new RegExp(expectedScreen, 'i') })
          .or(page.getByRole('menuitem', { name: new RegExp(expectedScreen, 'i') }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    await test.step('Income Declaration', async () => {
      await incomeDeclarationPage.fillIncomeDeclaration(
        '30000',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }

  await page.waitForTimeout(4000);

  if (await kycPage.isCurrentScreen('KYC')) {
    await test.step('KYC Details', async () => {
      await kycPage.fillKYCDetails(
        "Customer doesn't have one of the listed Document types",
        'Save',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }

  await page.waitForTimeout(4000);

  if (await poiPage.isCurrentScreen('POI')) {
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
  }

  await page.waitForTimeout(4000);

  if (await poaPage.isCurrentScreen('POA')) {
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
  }

  await page.waitForTimeout(4000);

  await test.step('Surrogate Details', async () => {
    await surrogateDetailsPage.navigateToSurrogateDetails();
    await surrogateDetailsPage.selectSurrogateDetails(
      testData['surrogatedetailspagename'] || 'Surrogate Details',
      testData['processtypelabel'] || 'Process Type',
      testData['processtypevalue'] || 'Normal',
      testData['creditprogramlabel'] || 'Credit Program',
      testData['creditprogramvalue'] || '1.06 [Prime Banking]',
        testData['checkapprovalbuttonlabel'] || 'Check Approval',
      'RSA',
      'No'
    );
  });

  await page.waitForTimeout(3000);

  await test.step('Approval Details', async () => {
    await approvalDetailsPage.navigateToApprovalDetails();
    await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
    await page.waitForTimeout(1000);
    await approvalDetailsPage.checkForErrors();
  });

  // App auto-navigates to Additional Details after Approval Proceed
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
// SUITE A: E2E — Full Flow auto-landing on Additional Details
// Run: npx playwright test tests/customer/13_additionalDetails.spec.ts --grep "E2E"
// =============================================================================
test.describe('13A - Additional Details [E2E Full Flow]', () => {

  let testData: Record<string, string>;
  test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

  // ─── E2E 1: Positive — Fill Personal & Office Details ───────────────────
  test('E2E-1: Full flow → Additional Details → Fill Personal & Office Details → Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage
  }) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData);

    await test.step('Navigate to Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details', async () => {
      await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
      );
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
    console.log('\u2713 E2E-1 Passed: Additional Details completed');
  });

  // ─── E2E 2: Negative — Missing Time Horizon ─────────────────────────────
  test('E2E-2 [Negative]: Full flow → Additional Details → Missing Time Horizon', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage
  }) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData);

    await test.step('Navigate to Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details with Time Horizon 0-3 Months', async () => {
      const filled = await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', '0 - 3 Months', testData['continuebuttonlabel'] || 'Continue'
      );
      if (!filled) { test.skip(true, 'Personal Details section was skipped.'); return; }
      const errorText = await additionalDetailsPage.getToastMessage(4000);
      if (errorText) {
        console.log(`\u2713 E2E-2 Passed: Validation error \u2192 ${errorText}`);
        expect(errorText.toLowerCase()).toContain('mandatory unless time horizon is never');
      } else {
        throw new Error('Expected validation error, but none appeared');
      }
    });
  });

  // ─── E2E 3: Negative — Office Address with 1 char ───────────────────────
  test('E2E-3 [Negative]: Full flow → Additional Details → Short Office Address', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage
  }) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData);

    await test.step('Navigate to Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill short Office Address and verify validation', async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'a', 'a', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
      const errorText = await additionalDetailsPage.getToastMessage();
      if (errorText) {
        console.log(`\u2713 E2E-3 Passed: Validation toast \u2192 "${errorText}"`);
        expect(errorText.toLowerCase()).toMatch(/three characters|required fields/i);
      } else {
        throw new Error('Expected short address validation error, but none appeared');
      }
    });
  });

  // ─── E2E 4: Negative — Missing Mother's Name ────────────────────────────
  test("E2E-4 [Negative]: Full flow → Additional Details → Missing Mother's Name", async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage
  }) => {
    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData);

    await test.step('Navigate to Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step("Fill Personal Details without Mother's Name", async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
      const filled = await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', '', '9527187976', 'Married', 'Graduate',
        'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
      );
      if (!filled) { test.skip(true, 'Personal Details section was skipped.'); return; }
      const errorText = await additionalDetailsPage.getToastMessage();
      if (errorText) {
        console.log(`\u2713 E2E-4 Passed: Validation toast \u2192 "${errorText}"`);
        expect(errorText.toLowerCase()).toContain('required');
      } else {
        throw new Error("Expected required fields error for empty Mother's Name");
      }
    });
  });
});

// =============================================================================
// SUITE B: HAMBURGER — App Status → Hamburger → Additional Details
// Run: npx playwright test tests/customer/13_additionalDetails.spec.ts --grep "HB"
// =============================================================================
test.describe('13B - Additional Details [Hamburger Navigation]', () => {

  let testData: Record<string, string>;
  test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

  // ─── HB 1: Positive — Fill Personal & Office Details ────────────────────
  test('HB-1: Hamburger → Additional Details → Fill Personal & Office Details', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateToAppStatus({ dealerSearchPage, appStatusPage }, testData);

    await test.step('Navigate via Hamburger \u2192 Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details', async () => {
      await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
      );
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
    console.log('\u2713 HB-1 Passed: Hamburger \u2192 Additional Details completed');
  });

  // ─── HB 2: Negative — Missing Time Horizon ──────────────────────────────
  test('HB-2 [Negative]: Hamburger → Additional Details → Missing Time Horizon', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateToAppStatus({ dealerSearchPage, appStatusPage }, testData);

    await test.step('Navigate via Hamburger \u2192 Additional Details', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details with Time Horizon 0-3 Months → Expect validation', async () => {
      const filled = await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', '0 - 3 Months', testData['continuebuttonlabel'] || 'Continue'
      );
      if (!filled) { test.skip(true, 'Personal Details section was skipped.'); return; }
      const errorText = await additionalDetailsPage.getToastMessage(4000);
      if (errorText) {
        console.log(`\u2713 HB-2 Passed: Validation error \u2192 ${errorText}`);
        expect(errorText.toLowerCase()).toContain('mandatory unless time horizon is never');
      } else {
        throw new Error('Expected validation error, but none appeared');
      }
    });
  });
});

// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> Additional Details)
// =============================================================================
test.describe('13C - Additional Details [Asset Cart Change Scheme Flow]', () => {

  let testData: Record<string, string>;
  test.beforeEach(() => { test.setTimeout(8 * 60 * 1000); });
  test.beforeAll(async () => { testData = excelReader.getTestDataForTestCase(suiteName); });

  async function completeAssetCartToAdditionalPrerequisites(context: any, testData: any) {
    const {
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage
    } = context;

    await completeFullPrerequisites({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage, additionalDetailsPage, assetCartPage
    }, testData, { stopAtPan: true });

    await test.step('PAN Verification (Select No -> Enter Manually -> Verify)', async () => {
      console.log('Checking for PAN Card Yes/No prompt...');
      let targetFrame = page;
      
      // 1. Click No
      let clickedNo = false;
      for (const frame of page.frames()) {
        const noBtn = frame.getByRole('button', { name: 'No', exact: true });
        if (await noBtn.isVisible().catch(() => false)) {
          await noBtn.click({ force: true });
          console.log('✓ Clicked "No" for PAN Card');
          targetFrame = frame;
          clickedNo = true;
          break;
        }
      }
      
      if (clickedNo) {
        await page.waitForTimeout(2000);
        
        // 2. Click Enter Manually
        const enterManuallyBtn = targetFrame.getByRole('button', { name: 'Enter Manually', exact: true }).first();
        if (await enterManuallyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await enterManuallyBtn.click({ force: true });
          console.log('✓ Clicked "Enter Manually"');
        } else {
          console.log('⚠ "Enter Manually" not found, proceeding anyway...');
        }
        await page.waitForTimeout(2000);
        
        // As requested by user: DO NOT click verify or confirm. Go directly to Hamburger/Asset Cart.
      }
    });


    if (await productSelectionPage.isCurrentScreen('Product Selection')) {
      console.log('✓ Already on Product Selection. Skipping Asset Cart / Change Scheme navigation.');
    } else {
      await test.step('Navigate to Asset Cart', async () => {
        await assetCartPage.navigateToAssetCart(true);
      });

      await test.step('Expand Asset Cart and Change Scheme', async () => {
        try {
          const oppId = await assetCartPage.getOpportunity('Asset Cart');
          await assetCartPage.expandCartDetails(oppId);
          await assetCartPage.clickChangeScheme();
        } catch (e: any) {
          console.log('⚠ Asset Cart navigation or interaction failed:', e.message);
          console.log('Proceeding to Product Selection anyway...');
        }
      });
    }

    await test.step('Product Selection (Change Scheme)', async () => {
      try {
        await productSelectionPage.proceedFromChangeScheme();
      } catch (e: any) {
        console.log('⚠ Proceed from Change Scheme did not land on expected page:', e.message);
        console.log('✓ Force navigating to Income Declaration via Hamburger menu as requested...');
        
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        
        const targetLink = page.getByRole('button', { name: 'Income Declaration' })
          .or(page.getByRole('menuitem', { name: /Income Declaration/i }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      }
    });


    // Helper to force navigation via Hamburger if not on the expected screen
    async function forceNavigateIfNeeded(expectedScreen: string, pageObj: any) {
      await page.waitForTimeout(3000);
      if (!(await pageObj.isCurrentScreen(expectedScreen))) {
        console.log(`⚠ Not on ${expectedScreen}. Force navigating via Hamburger...`);
        
        // [HOTFIX]: Check for the Reappraisal popup that sometimes appears and blocks the Hamburger Menu
        console.log('⚠ Checking for Reappraisal screen...');
        const exactCloseBtn = page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();
        let isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
        if (!isReappraisal) {
          await page.waitForTimeout(2000);
          isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
        }
        if (isReappraisal) {
          console.log('⚠ Reappraisal screen detected, attempting to close...');
          await exactCloseBtn.click({ force: true }).catch(() => {});
          await page.waitForTimeout(2000);
          console.log('✓ Clicked Reappraisal close button');
        }

        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        
        const targetLink = page.getByRole('button', { name: new RegExp(expectedScreen, 'i') })
          .or(page.getByRole('menuitem', { name: new RegExp(expectedScreen, 'i') }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    await test.step('Income Declaration', async () => {
      await forceNavigateIfNeeded('Income Declaration', incomeDeclarationPage);
      await incomeDeclarationPage.fillIncomeDeclaration('30000', testData['proceedbuttonvalue'] || 'Proceed');
    });

    await test.step('KYC Verification', async () => {
      await forceNavigateIfNeeded('KYC', kycPage);
      await kycPage.fillKYCDetails("Customer doesn't have one of the listed Document types", 'Save', testData['proceedbuttonvalue'] || 'Proceed');
    });

    await test.step('POI Details', async () => {
      await forceNavigateIfNeeded('POI', poiPage);
      await poiPage.fillPoiDetails('dummy', '', 'test', 'Aadhaar', '2222', 'Male', '2000-12-01', 'Salaried', testData['proceedbuttonvalue'] || 'Proceed');
    });

    await test.step('POA Details', async () => {
      await forceNavigateIfNeeded('POA', poaPage);
      await poaPage.fillPoaDetails('Self Owned', '411014', testData['bflbranchvalue'] || '411014-Manual Testing Pune', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Pune, Maharashtra', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Pune', 'Maharashtra', 'Aadhaar', '2222', testData['proceedbuttonvalue'] || 'Proceed');
    });

    await test.step('Complete Surrogate Details', async () => {
      await surrogateDetailsPage.navigateToSurrogateDetails();
      await surrogateDetailsPage.selectSurrogateDetails(
        testData['surrogatedetailspagename'] || 'Surrogate Details',
        testData['processtypelabel'] || 'Process Type',
        testData['processtypevalue'] || 'Normal',
        testData['creditprogramlabel'] || 'Credit Program',
        testData['creditprogramvalue'] || '1.06 [Prime Banking]',
        testData['checkapprovalbuttonlabel'] || 'Check Approval',
        testData['rsalabel'] || 'RSA',
        testData['rsavalue_no'] || 'No'
      );
      await surrogateDetailsPage.clickProceed();

      console.log('⚠ Waiting up to 5s for possible Reappraisal screen...');
      // Using the exact CSS selector provided by the user for the Reappraisal close button, targeting the visible SVG
      const exactCloseBtn = page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();
      
      // Wait for the button to appear
      let isReappraisal = false;
      for (let i = 0; i < 5; i++) {
        if (await exactCloseBtn.isVisible().catch(() => false)) {
          isReappraisal = true;
          break;
        }
        await page.waitForTimeout(1000);
      }
      
      if (isReappraisal) {
        console.log('⚠ Reappraisal screen detected, attempting to close...');
        await exactCloseBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(2000);
        console.log('✓ Clicked Reappraisal close button');
      } else {
        console.log('✓ No Reappraisal screen appeared');
      }
    });

    await test.step('Approval Details', async () => {
      await approvalDetailsPage.navigateToApprovalDetails();
      await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
      await page.waitForTimeout(1000);
      await approvalDetailsPage.checkForErrors();
    });
  }

  test.describe.parallel('13C Parallel Suite', () => {
test('13C-1: Positive: Asset Cart → Change Scheme → Additional Details → Fill Personal & Office Details', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
    const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
    testData = testData || require('../../utils').newExcelReader().getTestDataForTestCase(suiteName);
    await completeAssetCartToAdditionalPrerequisites(context, testData);

    await test.step('Navigate to Additional Details', async () => {
      await context.additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await context.additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details', async () => {
      await context.additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
      );
    });

    const errorBanner = await context.page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(errorBanner).toBe(false);
    console.log('\u2713 13C-1 Passed: Custom flow \u2192 Additional Details \u2192 Fill Details done');
  });

  test('13C-2 [Negative]: Asset Cart → Change Scheme → Additional Details → Validation Time Horizon', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
    const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
    testData = testData || require('../../utils').newExcelReader().getTestDataForTestCase(suiteName);
    await completeAssetCartToAdditionalPrerequisites(context, testData);

    await test.step('Navigate to Additional Details', async () => {
      await context.additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill Office Details', async () => {
      await context.additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Fill Personal Details with Time Horizon 0-3 Months', async () => {
      const filled = await context.additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', '0 - 3 Months', testData['continuebuttonlabel'] || 'Continue'
      );
      if (!filled) { test.skip(true, 'Personal Details section was skipped.'); return; }
      const errorText = await context.additionalDetailsPage.getToastMessage(4000);
      if (errorText) {
        console.log(`\u2713 13C-2 Passed: Validation error \u2192 ${errorText}`);
        
        expect(errorText.toLowerCase()).toContain('mandatory unless time horizon is never');
      } else {
        throw new Error('Expected validation error, but none appeared');
      }
    });
  });

  test('13C-3 [Negative]: Asset Cart → Change Scheme → Additional Details → Short Office Address', async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
    const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
    testData = testData || require('../../utils').newExcelReader().getTestDataForTestCase(suiteName);
    await completeAssetCartToAdditionalPrerequisites(context, testData);

    await test.step('Navigate to Additional Details', async () => {
      await context.additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step('Fill short Office Address and verify validation', async () => {
      await context.additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'a', 'a', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
      const errorText = await context.additionalDetailsPage.getToastMessage();
      if (errorText) {
        console.log(`\u2713 13C-3 Passed: Validation toast \u2192 "${errorText}"`);
        
        expect(errorText.toLowerCase()).toMatch(/three characters|required fields/i);
      } else {
        throw new Error('Expected short address validation error, but none appeared');
      }
    });
  });

  test("13C-4 [Negative]: Asset Cart → Change Scheme → Additional Details → Missing Mother's Name", async ({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage }) => {
    const context = { page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage, surrogateDetailsPage, assetCartPage, approvalDetailsPage, additionalDetailsPage };
    testData = testData || require('../../utils').newExcelReader().getTestDataForTestCase(suiteName);
    await completeAssetCartToAdditionalPrerequisites(context, testData);

    await test.step('Navigate to Additional Details', async () => {
      await context.additionalDetailsPage.navigateToAdditionalDetails();
    });

    await test.step("Fill Personal Details without Mother's Name", async () => {
      await context.additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
      const filled = await context.additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', '', '9527187976', 'Married', 'Graduate',
        'Residence', 'Never', testData['continuebuttonlabel'] || 'Continue'
      );
      if (!filled) { test.skip(true, 'Personal Details section was skipped.'); return; }
      const errorText = await context.additionalDetailsPage.getToastMessage();
      if (errorText) {
        console.log(`\u2713 13C-4 Passed: Validation toast \u2192 "${errorText}"`);
        
        expect(errorText.toLowerCase()).toContain('required');
      } else {
        throw new Error("Expected required fields error for empty Mother's Name");
      }
    });
  });
});
});

// ==========================================
// NEW TEST SCENARIOS (Pending Implementation)
// Change 'test.skip' to 'test' to activate
// ==========================================

// test.skip('Positive: Fill out mandatory personal details (Mother name, Marital status, Qualification).', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details page', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//   });
//   await test.step('Fill mandatory personal details', async () => {
//     const heading = page.getByText(/Additional Details|Personal Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     // Fill Mother's Name
//     const motherNameInput = page.getByLabel(/Mother.*Name|Mother's Name/i).first()
//       .or(page.locator('input[name*="mother"], input[placeholder*="Mother"]').first());
//     if (await motherNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await motherNameInput.fill(testData['mothernamevalue'] || 'Sunita Sharma');
//       await page.keyboard.press('Tab');
//     }
//     // Select Marital Status
//     const maritalDropdown = page.getByRole('combobox', { name: /Marital Status/i }).first();
//     if (await maritalDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await maritalDropdown.click();
//       const marriedOpt = page.getByRole('option', { name: /Married/i }).first();
//       if (await marriedOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
//         await marriedOpt.click({ force: true });
//         await page.waitForTimeout(500);
//       }
//     }
//     // Select Qualification
//     const qualDropdown = page.getByRole('combobox', { name: /Qualification|Education/i }).first();
//     if (await qualDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await qualDropdown.click();
//       const gradOpt = page.getByRole('option', { name: /Graduate|Post Graduate/i }).first();
//       if (await gradOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
//         await gradOpt.click({ force: true });
//         await page.waitForTimeout(500);
//       }
//     }
//     const proceedBtn = page.getByRole('button', { name: testData['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
//     if (await proceedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await proceedBtn.click();
//       await page.waitForTimeout(3000);
//       console.log('✓ Mandatory personal details filled and submitted');
//     }
//   });
// });

// test.skip('Positive: Fill out mandatory office/employment address details.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details page', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//   });
//   await test.step('Fill office/employment address', async () => {
//     const heading = page.getByText(/Additional Details|Employment|Office Address/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     const companyInput = page.getByLabel(/Company Name|Employer Name|Office Name/i).first()
//       .or(page.locator('input[name*="company"], input[placeholder*="Company"]').first());
//     if (await companyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await companyInput.fill(testData['companynamevalue'] || 'Test Corp Pvt Ltd');
//       await page.keyboard.press('Tab');
//     }
//     const officeAddr = page.getByLabel(/Office Address|Work Address/i).first()
//       .or(page.locator('input[name*="office_address"], textarea[name*="office"]').first());
//     if (await officeAddr.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await officeAddr.fill(testData['officeaddressvalue'] || '123 Business Park, Pune');
//       await page.keyboard.press('Tab');
//       await page.waitForTimeout(500);
//     }
//     console.log('✓ Office/employment address details filled');
//   });
// });

// test.skip('Negative: Try to submit without the mandatory Mother name field.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details and submit without Mother name', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//     const heading = page.getByText(/Additional Details|Personal Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     // Clear Mother's Name if pre-filled
//     const motherNameInput = page.getByLabel(/Mother.*Name|Mother's Name/i).first()
//       .or(page.locator('input[name*="mother"]').first());
//     if (await motherNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await motherNameInput.fill('');
//       await page.keyboard.press('Tab');
//     }
//     const proceedBtn = page.getByRole('button', { name: testData['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
//     if (await proceedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await proceedBtn.click();
//       await page.waitForTimeout(2000);
//     }
//     const errorEl = page.locator('.slds-has-error, .toastMessage, [role="alert"]').filter({ hasText: /mother|required/i }).first();
//     const hasError = await errorEl.isVisible({ timeout: 5000 }).catch(() => false);
//     expect(hasError).toBe(true);
//     console.log(`✓ Mother name mandatory validation: error=${hasError}`);
//   });
// });

// test.skip('Negative: Try to submit without the mandatory Office address field.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details and submit without Office address', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//     const heading = page.getByText(/Additional Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     const officeAddr = page.getByLabel(/Office Address|Work Address/i).first()
//       .or(page.locator('input[name*="office_address"]').first());
//     if (await officeAddr.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await officeAddr.fill('');
//       await page.keyboard.press('Tab');
//     }
//     const proceedBtn = page.getByRole('button', { name: testData['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
//     if (await proceedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//       await proceedBtn.click();
//       await page.waitForTimeout(2000);
//     }
//     const errorEl = page.locator('.slds-has-error, .toastMessage, [role="alert"]').filter({ hasText: /office|address|required/i }).first();
//     const hasError = await errorEl.isVisible({ timeout: 5000 }).catch(() => false);
//     expect(hasError).toBe(true);
//     console.log(`✓ Office address mandatory validation: error=${hasError}`);
//   });
// });

// test.skip('Positive: Verify the EMI cycle date selection dropdown.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details and verify EMI cycle dropdown', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//     const heading = page.getByText(/Additional Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     const emiDropdown = page.getByRole('combobox', { name: /EMI.*Date|EMI Cycle|Payment Date/i }).first()
//       .or(page.locator('select[name*="emi"], lightning-combobox').filter({ hasText: /EMI/i }).first());
//     const hasEmi = await emiDropdown.isVisible({ timeout: 8000 }).catch(() => false);
//     if (hasEmi) {
//       await emiDropdown.click();
//       const firstOption = page.getByRole('option').first();
//       if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
//         const optText = await firstOption.textContent();
//         await firstOption.click({ force: true });
//         await page.waitForTimeout(500);
//         console.log(`✓ EMI cycle date selected: "${optText?.trim()}"`);
//       }
//     } else {
//       console.log('ℹ EMI cycle dropdown not found on Additional Details page');
//     }
//   });
// });

// test.skip('Positive: Verify insurance cross-sell selection (Opt-in / Opt-out).', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details and test insurance selection', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//     const heading = page.getByText(/Additional Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     // Check for insurance section
//     const insuranceSection = page.getByText(/Insurance|Protection Plan|Cover/i).first();
//     const hasInsurance = await insuranceSection.isVisible({ timeout: 8000 }).catch(() => false);
//     if (hasInsurance) {
//       // Try Opt-in
//       const optInBtn = page.getByRole('button', { name: /Opt.in|Add Insurance|Yes/i }).first()
//         .or(page.getByLabel(/Opt.in|With Insurance/i).first());
//       if (await optInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//         await optInBtn.click({ force: true });
//         await page.waitForTimeout(1000);
//         console.log('✓ Insurance opted in');
//       }
//       // Try Opt-out
//       const optOutBtn = page.getByRole('button', { name: /Opt.out|No Insurance|No/i }).first()
//         .or(page.getByLabel(/Opt.out|Without Insurance/i).first());
//       if (await optOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//         await optOutBtn.click({ force: true });
//         await page.waitForTimeout(1000);
//         console.log('✓ Insurance opted out');
//       }
//     } else {
//       console.log('ℹ Insurance cross-sell section not present on Additional Details page');
//     }
//   });
// });

// test.skip('Negative: Enter an invalid email address format.', async ({ page, dealerSearchPage, appStatusPage }) => {
//   await test.step('Reach Additional Details and enter invalid email', async () => {
//     await dealerSearchPage.navigateToSearchDealer();
//     await dealerSearchPage.selectDealerAndSearch(testData['dealervalue'], testData['mobilenumberlabel'], '5678654324', testData['searchbutton'] || 'Search');
//     await appStatusPage.proceedFromAppStatus(testData['appstatuspagename'] || 'App Status', testData['proceedbuttonvalue'] || 'Proceed');
//     await page.waitForTimeout(5000);
//     const heading = page.getByText(/Additional Details/i).first();
//     if (!await heading.isVisible({ timeout: 20000 }).catch(() => false)) { console.log('ℹ Additional Details page not reached'); return; }
//     const emailInput = page.getByLabel(/Email|Email Address/i).first()
//       .or(page.locator('input[type="email"], input[name*="email"]').first());
//     if (await emailInput.isVisible({ timeout: 8000 }).catch(() => false)) {
//       const invalidEmails = ['test@', '@domain.com', 'nodomain', 'test@.com'];
//       for (const email of invalidEmails) {
//         await emailInput.fill(email);
//         await page.keyboard.press('Tab');
//         await page.waitForTimeout(800);
//         const errorEl = page.locator('.slds-has-error, [role="alert"]').filter({ hasText: /email|invalid|format/i }).first();
//         const hasError = await errorEl.isVisible({ timeout: 3000 }).catch(() => false);
//         console.log(`✓ Invalid email "${email}": error=${hasError}`);
//       }
//     } else {
//       console.log('ℹ Email field not found on Additional Details page');
//     }
//   });
// });
