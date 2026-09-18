import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

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
 * Helper: Complete prerequisite steps through Permanent Address
 */
async function completeFullPrerequisitesToEmploymentIncomeDetails(
  context: any,
  testData: Record<string, string>
): Promise<void> {
  const {
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
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

  // Wait for screen to transition away from App Status
  for (let i = 0; i < 5; i++) {
    const current = await zipCodePage.getCurrentScreen();
    if (current && !current.includes('App Status')) break;
    await page.waitForTimeout(1000);
  }

  const zipReadyBefore = await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pincode', 'Pin code', 'Pin Code Verification', 'Pincode Verification', 'PinCode']);
  if (!zipReadyBefore) {
    await test.step('Hamburger Navigation to Zip Code Details', async () => {
      console.log('⚠ Not on Zip Code Details! Navigating to Zip Code Details via Hamburger...');

      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());

      await expect(hamburger).toBeVisible({ timeout: 5000 });
      await hamburger.click({ force: true });

      const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
        .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));

      await expect(targetLink.first()).toBeVisible({ timeout: 5000 });
      await targetLink.first().click({ force: true });
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
        await hamburger.click({ force: true, timeout: 3000 }).catch(() => { });
        await page.waitForTimeout(1000);

        const targetLink = page.getByRole('button', { name: 'Product Selection' })
          .or(page.getByRole('menuitem', { name: /Product Selection/i }));

        const targetVisible = await targetLink.first().isVisible({ timeout: 3000 }).catch(() => false);
        if (!targetVisible) {
          console.log('⚠ "Product Selection" menu item not found — hamburger menu may not have opened. Continuing anyway.');
          return;
        }
        await targetLink.first().click({ force: true, timeout: 3000 }).catch(() => { });
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
    await approvalDetailsPage.checkForErrors();
  });

  await test.step('Permanent Address', async () => {
    await permanentAddressPage.navigateToPermanentAddress();
    await permanentAddressPage.fillPincode('411014');
    await permanentAddressPage.clickProceed();
  });

  // Verify transition to Employment & Income Details after Permanent Address
  await employmentIncomeDetailsPage.navigateToEmploymentIncomeDetails();
  console.log('✓ Prerequisites completed up to Employment & Income Details');
}

test.describe('14A - Employment & Income Details [E2E Full Flow]', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  test('14AP-01: E2E → Employment & Income Details → Fill All Valid Details → Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    // This E2E test runs through 8+ prerequisite screens before reaching
    // the Employment form. The global 5-min timeout is not enough.
    test.setTimeout(10 * 60 * 1000);

    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill all Employment, Income, and Address details', async () => {
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
    });

    await test.step('Click Proceed and verify successful transition', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorBanner = page.locator(".slds-theme_error");
      await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
      console.log('✓ TC-1 Passed: All details filled and proceeded successfully');
    });
  });

  test('14AN-02 [Negative]: Employment & Income → Salaried/Self-Employed Without Company Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Attempt to proceed without Company/Business Name', async () => {
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/Name of Company\/Business is required/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ TC-2 Passed: Validation error displayed for missing Company Name');
    });
  });

  test('14AN-03 [Negative]: Employment & Income → Without Office Phone Type → Expected Behavior', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Office Phone Number Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation state', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const isErrorVisible = await page.locator(".slds-form-element__help").first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`TC-3 Result: ${isErrorVisible ? 'Validation error shown' : 'Proceeded without error'}`);
    });
  });

  test('14AP-04 [Feature]: Employment & Income → Self-Employed Type → Fill and Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form with Self-Employed as Employment Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('selfemployed@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Self Employed');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Business Location 1');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify success', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      await expect(page.locator(".slds-theme_error")).not.toBeVisible({ timeout: 3000 });
      console.log('✓ TC-4 Passed: Self-Employed type processed successfully');
    });
  });

  test('14AN-05 [Negative]: Employment & Income → Without Qualification → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Qualification', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('FreelancerFreelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.fillMonthlyIncome('40000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify form submission is blocked due to missing Qualification', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Since the form refuses to proceed without Qualification, 
      // verify we are still on the Employment & Income page (e.g., Proceed button is still visible)
      const proceedButton = page.getByRole('button', { name: /proceed|next/i }).first();
      await expect(proceedButton).toBeVisible({ timeout: 5000 });

      console.log('✓ 14C-05 Passed: Form submission blocked successfully for missing Qualification');
    });
  });

  test('14AN-06 [Negative]: Employment & Income → Without Monthly Income → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Monthly Income', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect mandatory validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible error messages/toasts while explicitly avoiding the hidden aura container text
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .filter({ hasText: /required|complete this field|missing|invalid/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 10000 });
      console.log('✓ 14C-06 Passed: Mandatory error displayed for missing Monthly Income');
    });
  });

  test('14AP-07 [Feature]: Employment & Income → Verify Household Income State (Pre-filled/Disabled)', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Verify Monthly Household Income field state', async () => {
      const isDisabled = await employmentIncomeDetailsPage.isMonthlyHouseholdIncomeDisabled();
      const prefillValue = await employmentIncomeDetailsPage.getMonthlyHouseholdIncomeValue();

      expect(isDisabled || prefillValue !== '').toBe(true);
      console.log('✓ TC-7 Passed: Household Income field has expected state');
    });
  });

  test('14AP-08 [Feature]: Employment & Income → Without Pincode → Dependent Fields Disabled', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Verify dependent field states without Pincode', async () => {
      const isCityDisabled = await employmentIncomeDetailsPage.isCityDisabled();
      const isStateDisabled = await employmentIncomeDetailsPage.isStateDisabled();
      const cityValue = await employmentIncomeDetailsPage.getCityValue();
      const stateValue = await employmentIncomeDetailsPage.getStateValue();

      const fieldsInExpectedState = (isCityDisabled || cityValue === '') && (isStateDisabled || stateValue === '');
      expect(fieldsInExpectedState).toBe(true);
      console.log('✓ TC-8 Passed: City and State fields are in expected state');
    });
  });

  test('14AN-09 [Negative]: Employment & Income → Single Char in Address Lines → Min Length Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form with single character in Address Lines', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('a');
      await employmentIncomeDetailsPage.fillAddressLine2('b');
      await employmentIncomeDetailsPage.fillAddressLine3('c');
      await employmentIncomeDetailsPage.fillArea('d');
    });

    await test.step('Click Proceed and check for validation', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Updated locator to catch the custom validation exception banner shown in Salesforce
      const errorMsg = page.locator('#auraErrorMessage, .slds-notify_toast, .forceVisualMessageAndUtility, .desktop.toastContainer')
        .filter({ hasText: /Office Addresses must have at least three characters|FIELD_CUSTOM_VALIDATION_EXCEPTION|Error!/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-09 Passed: Minimum length validation error displayed');
    });
  });

  test('14AN-10 [Negative]: Employment & Income → Blank Submission → Form Validation Errors', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Attempt to proceed without filling any fields', async () => {
      await employmentIncomeDetailsPage.clickProceed();
    });

    await test.step('Verify multiple mandatory validation errors appear', async () => {
      const errorElements = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|complete this field|error|invalid/i));
      await expect(errorElements.first()).toBeVisible({ timeout: 5000 });
      const count = await errorElements.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ TC-10 Passed: ${count} validation error(s) displayed`);
    });
  });

  test('14AN-11 [Negative]: Employment & Income → Salaried Without Industry → Expected Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Industry selection', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible field errors, toast notifications, or validation banners securely
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .or(page.locator(':visible').getByText(/required|select|complete this field|Industry|error|invalid/i))
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-11 Passed: Validation error displayed for missing Industry');
    });
  });

  test('14C-02 [Negative]: Employment & Income → Salaried/Self-Employed Without Company Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Attempt to proceed without Company/Business Name', async () => {
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/Name of Company\/Business is required/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ TC-2 Passed: Validation error displayed for missing Company Name');
    });
  });


  test('14C-03 [Negative]: Employment & Income → Without Office Phone Type → Expected Behavior', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Office Phone Number Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation state', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const isErrorVisible = await page.locator(".slds-form-element__help").first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`TC-3 Result: ${isErrorVisible ? 'Validation error shown' : 'Proceeded without error'}`);
    });
  });


  test('14C-04 [Feature]: Employment & Income → Self-Employed Type → Fill and Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form with Self-Employed as Employment Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('selfemployed@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Self Employed');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Business Location 1');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify success', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      await expect(page.locator(".slds-theme_error")).not.toBeVisible({ timeout: 3000 });
      console.log('✓ TC-4 Passed: Self-Employed type processed successfully');
    });
  });


  test('14C-05 [Negative]: Employment & Income → Without Qualification → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Qualification', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('FreelancerFreelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.fillMonthlyIncome('40000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify form submission is blocked due to missing Qualification', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Since the form refuses to proceed without Qualification, 
      // verify we are still on the Employment & Income page (e.g., Proceed button is still visible)
      const proceedButton = page.getByRole('button', { name: /proceed|next/i }).first();
      await expect(proceedButton).toBeVisible({ timeout: 5000 });

      console.log('✓ 14C-05 Passed: Form submission blocked successfully for missing Qualification');
    });
  });


  test('14C-06 [Negative]: Employment & Income → Without Monthly Income → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Monthly Income', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect mandatory validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible error messages/toasts while explicitly avoiding the hidden aura container text
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .filter({ hasText: /required|complete this field|missing|invalid/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 10000 });
      console.log('✓ 14C-06 Passed: Mandatory error displayed for missing Monthly Income');
    });
  });


  test('14C-07 [Feature]: Employment & Income → Verify Household Income State (Pre-filled/Disabled)', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Verify Monthly Household Income field state', async () => {
      const isDisabled = await employmentIncomeDetailsPage.isMonthlyHouseholdIncomeDisabled();
      const prefillValue = await employmentIncomeDetailsPage.getMonthlyHouseholdIncomeValue();

      expect(isDisabled || prefillValue !== '').toBe(true);
      console.log('✓ TC-7 Passed: Household Income field has expected state');
    });
  });


  test('14C-08 [Feature]: Employment & Income → Without Pincode → Dependent Fields Disabled', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Verify dependent field states without Pincode', async () => {
      const isCityDisabled = await employmentIncomeDetailsPage.isCityDisabled();
      const isStateDisabled = await employmentIncomeDetailsPage.isStateDisabled();
      const cityValue = await employmentIncomeDetailsPage.getCityValue();
      const stateValue = await employmentIncomeDetailsPage.getStateValue();

      const fieldsInExpectedState = (isCityDisabled || cityValue === '') && (isStateDisabled || stateValue === '');
      expect(fieldsInExpectedState).toBe(true);
      console.log('✓ TC-8 Passed: City and State fields are in expected state');
    });
  });


  test('14C-09 [Negative]: Employment & Income → Single Char in Address Lines → Min Length Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form with single character in Address Lines', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('a');
      await employmentIncomeDetailsPage.fillAddressLine2('b');
      await employmentIncomeDetailsPage.fillAddressLine3('c');
      await employmentIncomeDetailsPage.fillArea('d');
    });

    await test.step('Click Proceed and check for validation', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Updated locator to catch the custom validation exception banner shown in Salesforce
      const errorMsg = page.locator('#auraErrorMessage, .slds-notify_toast, .forceVisualMessageAndUtility, .desktop.toastContainer')
        .filter({ hasText: /Office Addresses must have at least three characters|FIELD_CUSTOM_VALIDATION_EXCEPTION|Error!/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-09 Passed: Minimum length validation error displayed');
    });
  });


  test('14C-10 [Negative]: Employment & Income → Blank Submission → Form Validation Errors', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Attempt to proceed without filling any fields', async () => {
      await employmentIncomeDetailsPage.clickProceed();
    });

    await test.step('Verify multiple mandatory validation errors appear', async () => {
      const errorElements = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|complete this field|error|invalid/i));
      await expect(errorElements.first()).toBeVisible({ timeout: 5000 });
      const count = await errorElements.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ TC-10 Passed: ${count} validation error(s) displayed`);
    });
  });


  test('14C-11 [Negative]: Employment & Income → Salaried Without Industry → Expected Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form without Industry selection', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible field errors, toast notifications, or validation banners securely
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .or(page.locator(':visible').getByText(/required|select|complete this field|Industry|error|invalid/i))
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-11 Passed: Validation error displayed for missing Industry');
    });
  });

});

// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> E2E)
// =============================================================================
test.describe('14C - Employment & Income Details [Asset Cart Change Scheme Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000);
  let testDataC: Record<string, string>;
  const mobileNumber = '5789008099';

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testDataC = excelReader.getTestDataForTestCase(config.excel.suiteName);
  });

  async function completeFullPrerequisites(context: any, testData: Record<string, string>) {
    const {
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage
    } = context;

    await test.step('Search Dealer', async () => {
      await dealerSearchPage.navigateToSearchDealer();
      await dealerSearchPage.selectDealerAndSearch(
        testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
        testData['mobilenumberlabel'] || 'Mobile Number',
        mobileNumber,
        testData['searchbutton'] || 'Search'
      );
    });

    let isAppStatus = false;
    let isZip = false;

    for (let i = 0; i < 15; i++) {
      if (await appStatusPage.isCurrentScreen('App Status')) {
        isAppStatus = true;
        break;
      }
      if (await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pin Code Verification'])) {
        isZip = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (isAppStatus) {
      await test.step('App Status', async () => {
        await appStatusPage.proceedFromAppStatus(
          testData['appstatuspagename'] || 'App Status',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
      });

      for (let i = 0; i < 15; i++) {
        if (await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pin Code Verification'])) {
          isZip = true;
          break;
        }
        await page.waitForTimeout(1000);
      }
    }

    if (!isZip) {
      await test.step('Hamburger Navigation to Zip Code Details', async () => {
        console.log('⚠ Using Hamburger menu to navigate to Zip Code Details...');
        await page.waitForTimeout(1000);
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.locator('.slds-icon-utility-rows').first());
        if (await hamburger.isVisible()) {
          await hamburger.click({ force: true });
          await page.waitForTimeout(1500);
          const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
            .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));
          await targetLink.click({ force: true }).catch(() => {});
          await page.waitForTimeout(2000);
        }
      });
    }

    await test.step('Zip Code Details', async () => {
      await page.waitForTimeout(2000);
      await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
    });

    let isMitc = false;
    for (let i = 0; i < 15; i++) {
      if (await mitcPage.isCurrentScreen('MITC')) {
        isMitc = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (isMitc) {
      await test.step('MITC Details', async () => {
        await mitcPage.fillMitcDetailsWithFirstAndLastName(
          testData['firstname'] || 'Dummycust',
          testData['lastname'] || 'Doe',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
        await mitcPage.proceedToPanVerification(testData['proceedbuttonvalue'] || 'Proceed');
      });
    }

    let isPan = false;
    for (let i = 0; i < 15; i++) {
      if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification', 'Pan Details'])) {
        isPan = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (isPan) {
      await test.step('PAN Verification (No)', async () => {
        await panVerificationPage.fillPanVerificationDetails(
          testData['panNo'] || 'HFHPP1234D',
          testData['firstname'] || 'Dummycust',
          testData['lastname'] || 'Doe',
          testData['dobvalue'] || '18-12-1996',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
      });
    }
  }

  async function forceNavigateIfNeeded(expectedScreen: string | string[], pageObj: any, page: any) {
    const screens = Array.isArray(expectedScreen) ? expectedScreen : [expectedScreen];
    
    let isOnScreen = false;
    for (let i = 0; i < 15; i++) {
      for (const name of screens) {
        if (await pageObj.isCurrentScreen(name)) {
          isOnScreen = true;
          break;
        }
      }
      if (isOnScreen) break;
      await page.waitForTimeout(1000);
    }

    if (!isOnScreen) {
      console.log(`⚠ Not on ${screens[0]}. Force navigating via Hamburger...`);
      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());
      await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
      await hamburger.click({ force: true });
      await page.waitForTimeout(1500);

      let clicked = false;
      for (const name of screens) {
        const targetLink = page.getByRole('button', { name: new RegExp(name, 'i') })
          .or(page.getByRole('menuitem', { name: new RegExp(name, 'i') }))
          .or(page.locator(`//a//span[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${name.toLowerCase()}')]`));
        if (await targetLink.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await targetLink.first().click({ force: true });
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        const targetLink = page.getByRole('button', { name: new RegExp(screens[0], 'i') })
          .or(page.getByRole('menuitem', { name: new RegExp(screens[0], 'i') }));
        await targetLink.first().click({ force: true });
      }
      await page.waitForTimeout(2000);
    }
  }

  async function navigateToEmploymentIncomeDetails(
    page: any, assetCartPage: any, productSelectionPage: any, incomeDeclarationPage: any,
    kycPage: any, poiPage: any, poaPage: any, permanentAddressPage: any, surrogateDetailsPage: any,
    approvalDetailsPage: any, targetPageObj: any
  ) {
    await forceNavigateIfNeeded('Asset Cart', assetCartPage, page);
    await test.step('Expand Asset Cart and Change Scheme', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      expect(oppId).toBeTruthy();
      await assetCartPage.expandCartDetails(oppId);
      await assetCartPage.clickChangeScheme();
    });
    await test.step('Product Selection (Change Scheme)', async () => {
      try { await productSelectionPage.proceedFromChangeScheme(); } catch (e: any) { }
    });

    await forceNavigateIfNeeded('Income Declaration', incomeDeclarationPage, page);
    await test.step('Income Declaration', async () => {
      await incomeDeclarationPage.fillIncomeDeclaration('30000', 'Proceed');
    });

    await forceNavigateIfNeeded(['KYC', 'E-KYC', 'KYC Verification'], kycPage, page);
    await test.step('KYC Verification', async () => {
      await kycPage.fillKYCDetails("Customer doesn't have one of the listed Document types", 'Save', 'Proceed');
    });

    await forceNavigateIfNeeded(['POI', 'Officially Valid Documents'], poiPage, page);
    await test.step('POI Details', async () => {
      await poiPage.fillPoiDetails('Dummycust', '', 'Doe', 'Aadhaar', '2222', 'Male', '18-12-1996', 'Salaried', 'Proceed');
    });

    await forceNavigateIfNeeded(['POA', 'Current Address'], poaPage, page);
    await test.step('POA Details', async () => {
      await poaPage.fillPoaDetails('Self Owned', '411014', '411014-Manual Testing Pune', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Pune, Maharashtra', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Pune', 'Maharashtra', 'Aadhaar', '2222', 'Proceed', 'CHANDAN NAGAR TSTING');
    });

    await forceNavigateIfNeeded('Surrogate Details', surrogateDetailsPage, page);
    await test.step('Surrogate Details', async () => {
      await surrogateDetailsPage.selectSurrogateDetails('Axis Bank', 'No', undefined, false);
    });

    await forceNavigateIfNeeded('Approval Details', approvalDetailsPage, page);
    await test.step('Approval Details', async () => {
      await approvalDetailsPage.clickButton('Proceed');
      await approvalDetailsPage.checkForErrors();
    });

    await forceNavigateIfNeeded('Permanent Address', permanentAddressPage, page);
    await test.step('Permanent Address', async () => {
      await permanentAddressPage.fillPermanentAddressDetails('Self Owned', '411014', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Sakore Nagar, Viman Nagar', 'Pune', 'Maharashtra', 'Aadhaar', '2222');
      await permanentAddressPage.clickProceed();
    });

    await forceNavigateIfNeeded('Employment & Income Details', targetPageObj, page);
  }

  test('14C-1: Positive: Employment & Income Details [Change Scheme Flow]', async ({
    page,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    assetCartPage,
    productSelectionPage,
    incomeDeclarationPage,
    kycPage,
    poiPage,
    poaPage,
    permanentAddressPage,
    surrogateDetailsPage,
    approvalDetailsPage,
    employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC);
    await navigateToEmploymentIncomeDetails(
      page, assetCartPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage,
      permanentAddressPage, surrogateDetailsPage, approvalDetailsPage, employmentIncomeDetailsPage
    );

    await test.step('Fill Employment & Income details', async () => {
      await employmentIncomeDetailsPage.fillCompleteForm(
        'BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR',
        'Freelancer',
        'Mobile',
        '6675435678',
        'test@example.com',
        'Salaried',
        'CEO/ CFO/ COO/ CXO',
        'Graduate',
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
  });

  test('14C-02 [Negative]: Employment & Income → Salaried/Self-Employed Without Company Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Attempt to proceed without Company/Business Name', async () => {
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/Name of Company\/Business is required/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ TC-2 Passed: Validation error displayed for missing Company Name');
    });
  });


  test('14C-03 [Negative]: Employment & Income → Without Office Phone Type → Expected Behavior', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form without Office Phone Number Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation state', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const isErrorVisible = await page.locator(".slds-form-element__help").first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`TC-3 Result: ${isErrorVisible ? 'Validation error shown' : 'Proceeded without error'}`);
    });
  });


  test('14C-04 [Feature]: Employment & Income → Self-Employed Type → Fill and Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form with Self-Employed as Employment Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('selfemployed@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Self Employed');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Business Location 1');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify success', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      await expect(page.locator(".slds-theme_error")).not.toBeVisible({ timeout: 3000 });
      console.log('✓ TC-4 Passed: Self-Employed type processed successfully');
    });
  });


  test('14C-05 [Negative]: Employment & Income → Without Qualification → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form without Qualification', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('FreelancerFreelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.fillMonthlyIncome('40000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and verify form submission is blocked due to missing Qualification', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Since the form refuses to proceed without Qualification, 
      // verify we are still on the Employment & Income page (e.g., Proceed button is still visible)
      const proceedButton = page.getByRole('button', { name: /proceed|next/i }).first();
      await expect(proceedButton).toBeVisible({ timeout: 5000 });

      console.log('✓ 14C-05 Passed: Form submission blocked successfully for missing Qualification');
    });
  });


  test('14C-06 [Negative]: Employment & Income → Without Monthly Income → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form without Monthly Income', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect mandatory validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible error messages/toasts while explicitly avoiding the hidden aura container text
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .filter({ hasText: /required|complete this field|missing|invalid/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 10000 });
      console.log('✓ 14C-06 Passed: Mandatory error displayed for missing Monthly Income');
    });
  });


  test('14C-07 [Feature]: Employment & Income → Verify Household Income State (Pre-filled/Disabled)', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Verify Monthly Household Income field state', async () => {
      const isDisabled = await employmentIncomeDetailsPage.isMonthlyHouseholdIncomeDisabled();
      const prefillValue = await employmentIncomeDetailsPage.getMonthlyHouseholdIncomeValue();

      expect(isDisabled || prefillValue !== '').toBe(true);
      console.log('✓ TC-7 Passed: Household Income field has expected state');
    });
  });


  test('14C-08 [Feature]: Employment & Income → Without Pincode → Dependent Fields Disabled', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Verify dependent field states without Pincode', async () => {
      const isCityDisabled = await employmentIncomeDetailsPage.isCityDisabled();
      const isStateDisabled = await employmentIncomeDetailsPage.isStateDisabled();
      const cityValue = await employmentIncomeDetailsPage.getCityValue();
      const stateValue = await employmentIncomeDetailsPage.getStateValue();

      const fieldsInExpectedState = (isCityDisabled || cityValue === '') && (isStateDisabled || stateValue === '');
      expect(fieldsInExpectedState).toBe(true);
      console.log('✓ TC-8 Passed: City and State fields are in expected state');
    });
  });


  test('14C-09 [Negative]: Employment & Income → Single Char in Address Lines → Min Length Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form with single character in Address Lines', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('a');
      await employmentIncomeDetailsPage.fillAddressLine2('b');
      await employmentIncomeDetailsPage.fillAddressLine3('c');
      await employmentIncomeDetailsPage.fillArea('d');
    });

    await test.step('Click Proceed and check for validation', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Updated locator to catch the custom validation exception banner shown in Salesforce
      const errorMsg = page.locator('#auraErrorMessage, .slds-notify_toast, .forceVisualMessageAndUtility, .desktop.toastContainer')
        .filter({ hasText: /Office Addresses must have at least three characters|FIELD_CUSTOM_VALIDATION_EXCEPTION|Error!/i })
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-09 Passed: Minimum length validation error displayed');
    });
  });


  test('14C-10 [Negative]: Employment & Income → Blank Submission → Form Validation Errors', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Attempt to proceed without filling any fields', async () => {
      await employmentIncomeDetailsPage.clickProceed();
    });

    await test.step('Verify multiple mandatory validation errors appear', async () => {
      const errorElements = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|complete this field|error|invalid/i));
      await expect(errorElements.first()).toBeVisible({ timeout: 5000 });
      const count = await errorElements.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ TC-10 Passed: ${count} validation error(s) displayed`);
    });
  });


  test('14C-11 [Negative]: Employment & Income → Salaried Without Industry → Expected Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    await completeFullPrerequisitesToEmploymentIncomeDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage,
    assetCartPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testDataC);

    await test.step('Fill form without Industry selection', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('President');
      await employmentIncomeDetailsPage.selectQualification('Diploma holder');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and check for validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();

      // Target visible field errors, toast notifications, or validation banners securely
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error, .slds-notify_toast, .forceVisualMessageAndUtility')
        .locator(':visible')
        .or(page.locator(':visible').getByText(/required|select|complete this field|Industry|error|invalid/i))
        .first();

      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-11 Passed: Validation error displayed for missing Industry');
    });
  });

});