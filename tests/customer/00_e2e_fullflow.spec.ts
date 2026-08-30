import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

// ─────────────────────────────────────────────────────────────────────────────
// E2E Full Flow: Search Dealer → App Status → Zip Code → MITC → PAN →
//               Product Selection → Income Declaration → KYC → POI → POA →
//               Surrogate Details (Check Approval + Wait for Underwriting) →
//               View Approval Details → Approval Details → Additional Details → Asset Cart
// ─────────────────────────────────────────────────────────────────────────────

test.setTimeout(2400000); // 40 minutes for full E2E
test.describe.configure({ mode: 'serial' }); // run E2E tests one at a time

const MOBILE_NUMBER = '5678654324';
const DEALER        = '1300 - SHREE RAJENDRA DEPARTMENTAL STORES';

const getVal = (val: string | undefined, def: string) =>
  (val && val !== 'undefined' ? val : def);

// =============================================================================
// SUITE E2E: Full Application Flow
// Run: npx playwright test tests/customer/00_e2e_fullflow.spec.ts
// =============================================================================
test.describe('E2E - Full Application Flow', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  // ─── E2E Test 1: Complete positive full flow ──────────────────────────────
  test('E2E-1: Full Flow → Search Dealer → Asset Cart', async ({
    page,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    incomeDeclarationPage,
    kycPage,
    poiPage,
    poaPage,
    surrogateDetailsPage,
    approvalDetailsPage,
    additionalDetailsPage,
    assetCartPage,
  }) => {

    // ── Step 1: Search Dealer ───────────────────────────────────────────────
    await test.step('Search Dealer', async () => {
      await dealerSearchPage.navigateToSearchDealer();
      await dealerSearchPage.selectDealerAndSearch(
        testData['dealervalue'] || DEALER,
        testData['mobilenumberlabel'] || 'Mobile Number',
        '5678654324',
        testData['searchbutton'] || 'Search'
      );
    });

    // ── Step 2: App Status ──────────────────────────────────────────────────
    await test.step('App Status', async () => {
      await appStatusPage.proceedFromAppStatus(
        testData['appstatuspagename'] || 'App Status',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // Handle edge-case: if app lands directly on Approval Details, navigate back to Zip Code
    if (await appStatusPage.isCurrentScreen('Approval Details')) {
      await test.step('Hamburger Navigation to Zip Code Details', async () => {
        console.log('⚠ Landed on Approval Details after App Status. Navigating to Zip Code via Hamburger...');
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
          .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      });
    }

    // ── Step 3: Zip Code ────────────────────────────────────────────────────
    await test.step('Zip Code Details', async () => {
      await page.waitForTimeout(2000);
      await zipCodePage.fillZipCodeDetails({
        zipCode:           testData['zipcodelabel'] || 'Enter Customer ZipCode',
        zipCodeValue:      '411014',
        bflBranch:         testData['bflbranchvalue'] || '411014-Manual Testing Pune',
        dob:               testData['dobvalue'] || '18-12-1996',
        gender:            testData['gendervalue'] || 'Male',
        language:          testData['preferredcommunicationlanguagevalue'] || 'English',
        preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
        poaAddressType:    testData['poaaddresstype'],
      });
      await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
    });

    // ── Step 4: MITC (conditional) ──────────────────────────────────────────
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

    // ── Step 5: PAN Verification ────────────────────────────────────────────
    await test.step('PAN Verification (Select No -> Enter Manually -> Skip)', async () => {
      const panProcessed = await panVerificationPage.fillPanVerificationDetails(
        getVal(testData['panNo'], 'HFHPP1234D'),
        getVal(testData['firstname'], 'Dummycust'),
        getVal(testData['lastname'], 'Doe'),
        getVal(testData['dobvalue'], '18-12-1996'),
        getVal(testData['proceedbuttonvalue'], 'Proceed')
      );

      // If PAN prompt not shown, navigate to Product Selection via hamburger
      if (!panProcessed) {
        console.log('⚠ PAN prompt not found. Using Hamburger to navigate to Product Selection...');
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        const targetLink = page.getByRole('button', { name: 'Product Selection' })
          .or(page.getByRole('menuitem', { name: /Product Selection/i }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      }
    });

    // ── Step 6: Product Selection (Enter Manually → fill details → checkbox → Proceed → Scheme → Confirm) ──
    await page.waitForTimeout(2000);
    if (await productSelectionPage.isCurrentScreen('Product Selection')) {
      await test.step('Product Selection (Enter Manually → Scheme → Confirm)', async () => {
        await productSelectionPage.fillProductDetails(
          testData['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
          testData['invoiceamount'] || '30000',
          testData['requiredloanamount'] || '30000',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
        // fillProductDetails handles: Enter Manually → product model → invoice amount →
        // loan amount → checkbox → Proceed → Recommended Schemes → select first scheme → Confirm
        console.log('✓ Product Selection complete (Enter Manually → Scheme → Confirm)');
      });
    } else {
      console.log('⚠ Product Selection screen not detected — skipping Product Selection step');
    }


    // ── Step 7: Income Declaration ──────────────────────────────────────────
    await page.waitForTimeout(4000);
    if (await incomeDeclarationPage.isCurrentScreen('Income Declaration')) {
      await test.step('Income Declaration', async () => {
        await incomeDeclarationPage.fillIncomeDeclaration(
          '30000',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
      });
    }

    // ── Step 8: KYC ────────────────────────────────────────────────────────
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

    // ── Step 9: POI ─────────────────────────────────────────────────────────
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

    // ── Step 10: POA ────────────────────────────────────────────────────────
    await page.waitForTimeout(4000);
    if (await poaPage.isCurrentScreen('POA')) {
      await test.step('POA Details', async () => {
        await poaPage.fillPoaDetails(
          'Self Owned',
          testData['zipcodevalue'] || '411014 Pune',
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

    // ── Step 11: Surrogate Details → Check Approval → Wait Underwriting ─────
    await page.waitForTimeout(4000);
    await test.step('Surrogate Details → Check Approval → Wait for Approved popup', async () => {
      await surrogateDetailsPage.navigateToSurrogateDetails();

      // Select RSA = No only; let Check Approval run the full wait+popup flow
      await surrogateDetailsPage.selectSurrogateDetails(
        testData['surrogatedetailspagename'] || 'Surrogate Details',
        testData['processtypelabel']         || 'Process Type',
        testData['processtypevalue']         || 'Normal',
        testData['creditprogramlabel']       || 'Credit Program',
        testData['creditprogramvalue']       || '1.06 [Prime Banking]',
        testData['checkapprovalbuttonlabel'] || 'Check Approval',
        'RSA',
        'No',
        undefined,   // no RSA reject reason
        undefined,   // no bank name
        false        // stopAfterCheckApproval = false → wait for "Approved" popup + click "View Approval Details"
      );

      console.log('✓ Surrogate Details done — Approved popup handled, navigating to Approval Details');
    });

    // ── Step 12: Approval Details ───────────────────────────────────────────
    await page.waitForTimeout(3000);
    await test.step('Approval Details', async () => {
      await approvalDetailsPage.navigateToApprovalDetails();
      await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
      await page.waitForTimeout(1000);
      await approvalDetailsPage.checkForErrors();
      console.log('✓ Approval Details done');
    });

    // ── Step 13: Additional Details ─────────────────────────────────────────
    await page.waitForTimeout(3000);
    await test.step('Additional Details — Office', async () => {
      await additionalDetailsPage.navigateToAdditionalDetails();
      await additionalDetailsPage.enterOfficeDetails(
        '411014',
        'OTHERS',
        'EUREKA FORBS SERVICE CENTER',
        'Private Ltd',
        'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER',
        'AM SERVISES',
        'AM SERVISES',
        'BAVDHAN',
        'Mobile',
        '5675435678',
        'Salaried',
        'Others',
        'Rs 25001-50000',
        'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    await test.step('Additional Details — Personal', async () => {
      await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB',
        'Rahima',
        '9527187976',
        'Married',
        'Graduate',
        'Residence',
        'Never',
        testData['continuebuttonlabel'] || 'Continue'
      );
      await page.waitForTimeout(1000);
    });

    // ── Step 14: Asset Cart ─────────────────────────────────────────────────
    // App auto-navigates to Asset Cart after Additional Details
    await page.waitForTimeout(4000);
    await test.step('Asset Cart — Verify Landed', async () => {
      const currentScreen = await assetCartPage.getCurrentScreen();
      console.log(`Current screen after Additional Details: "${currentScreen}"`);

      const onAssetCart = currentScreen.includes('Asset Cart');
      if (!onAssetCart) {
        console.log('⚠ Not on Asset Cart yet — waiting a bit longer...');
        await page.waitForTimeout(4000);
        const retryScreen = await assetCartPage.getCurrentScreen();
        console.log(`Screen after extra wait: "${retryScreen}"`);
        expect(retryScreen).toContain('Asset Cart');
      } else {
        console.log('✓ Successfully reached Asset Cart!');
      }
    });

    console.log('✓ E2E-1 PASSED: Full flow from Search Dealer → Asset Cart completed successfully!');
  });
});
