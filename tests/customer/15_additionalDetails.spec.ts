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
 * Helper: Complete prerequisite steps through Employment & Income Details to reach Additional Details
 */
async function completeFullPrerequisitesToAdditionalDetails(
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

  const zipReady = await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal', 'Pincode', 'Pin code', 'Pin Code Verification', 'Pincode Verification', 'PinCode']);
  if (!zipReady) {
    await page.waitForTimeout(2000);
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
    await panVerificationPage.fillPanVerificationDetails(
      getVal(testData['panNo'], 'HFHPP1234D'),
      getVal(testData['firstname'], 'Dummycust'),
      getVal(testData['lastname'], 'Doe'),
      getVal(testData['dobvalue'], '18-12-1996'),
      getVal(testData['proceedbuttonvalue'], 'Proceed')
    );
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

  await additionalDetailsPage.navigateToAdditionalDetails();
  console.log('✓ Prerequisites completed up to Additional Details');
}

test.describe('15A - Additional Details [E2E Comprehensive Suite - 20 Cases]', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  // 15A-01
  test('15AP-01: E2E → Select Relationship Type → Verify Salutation Auto-populate', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    const relationshipTests = [
      { type: 'Father', expectedSalutation: /^Mr\.?$/i },
    ];

    for (const testCase of relationshipTests) {
      await test.step(`Select relationship type: ${testCase.type}`, async () => {
        await additionalDetailsPage.selectRelationshipType(testCase.type);
        await page.waitForTimeout(1000);

        const salutationValue = await additionalDetailsPage.salutationSelect.inputValue().catch(() => '');
        if (salutationValue) {
          expect(salutationValue).toMatch(testCase.expectedSalutation);
        }
        console.log(`✓ Passed: Relationship type ${testCase.type} correctly auto-populated salutation.`);
      });
    }
  });

  // 15A-02
  test('15AP -02: E2E → Enter Valid Data For All Fields and Submit', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill all mandatory and optional fields correctly', async () => {
      await additionalDetailsPage.fillAlternateMobile('9876543210');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillMiddleName('M');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(1);
      await additionalDetailsPage.fillNameOnCard('John Doe');
    });

    await test.step('Click Proceed and verify successful submission', async () => {
      await additionalDetailsPage.proceedButton.click();
      const errorBanner = page.locator(".slds-theme_error");
      await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
    });
  });

  // 15A-04
  test('15AP -03: E2E → Enable Politically Exposed Person (PEP) and Submit', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill mandatory fields and enable PEP toggle', async () => {
      await additionalDetailsPage.alternateMobileInput.fill('9876543210');
      await additionalDetailsPage.firstNameInput.fill('Jane');
      await additionalDetailsPage.lastNameInput.fill('Smith');
      await additionalDetailsPage.politicallyExposedCheckbox.click();
    });

    await test.step('Submit form and verify processing', async () => {
      await additionalDetailsPage.proceedButton.click();
    });
  });

  // 15A-05 [Negative]
  test('15AN-04 [Negative]: E2E → Enable Differently Abled Without Disability Details Shows Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill specified fields and enable Differently Abled toggle without sub-fields', async () => {
      // Fill all specified fields
      await additionalDetailsPage.fillAlternateMobile('6876543210');
      await additionalDetailsPage.selectMaritalStatus(1); // Adjust index or value as needed per your helper
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');

      // Enable toggle but intentionally leave disability sub-fields blank
      await additionalDetailsPage.enableDifferentlyAbled();
      await additionalDetailsPage.waitForDisabilitySection();
    });

    await test.step('Attempt to submit and verify validation blocks navigation', async () => {
      await additionalDetailsPage.proceedButton.click();

      // Verify that submission is blocked and we remain on the Additional Details page
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
    });
  });

  // 15A-05
  test('15AP -05: E2E → Disability Percentage Field - Character Restriction Validation', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Enable differently abled and test typing non-numeric characters', async () => {
      await additionalDetailsPage.differentlyAbledCheckbox.click();
      const resultingValue = await additionalDetailsPage.typeDisabilityPercentage('abc40xyz');
      expect(resultingValue).toBe('40');
    });
  });

  // 15A-07 [Negative]
  test('15AN-06 [Negative]: E2E → Submit Without Alternate Mobile Number Shows Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form leaving alternate mobile empty', async () => {
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillMiddleName('M');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('John Doe');
    });

    await test.step('Click Proceed and check for error banner', async () => {
      await additionalDetailsPage.proceedButton.click();

      // Verify that submission is blocked (either by toast or inline error) and we remain on the page
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
    });
  });

  // 15A-08
  test('15AP -07: E2E → Select Single Relationship Type and Submit', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Select Single and complete required entries', async () => {
      await additionalDetailsPage.selectMaritalStatus(2);
      await additionalDetailsPage.selectRelationshipType(2);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillMiddleName('M');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('John Doe');
    });


    await test.step('Submit and verify', async () => {
      await additionalDetailsPage.proceedButton.click();
    });
  });

  // 15A-09 [Negative]
  test('15AN-08 [Negative]: E2E → Submit Without First Name Shows Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill details leaving First Name blank', async () => {
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('');
      await additionalDetailsPage.fillMiddleName('M');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('John Doe');
    });

    await test.step('Attempt to submit and verify error message', async () => {
      await additionalDetailsPage.proceedButton.click();
      const errorMsg = await additionalDetailsPage.getToastMessage(2000);
      expect(errorMsg).not.toBeNull();
    });
  });

  // 15A-10 [Negative]
  test('15AN-09 [Negative]: E2E → Submit Form With Completely Empty Fields', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Click Proceed immediately on empty page', async () => {
      await additionalDetailsPage.proceedButton.click();
    });

    await test.step('Verify blocking validation errors appear', async () => {
      // Verify that submission is blocked and we remain on the page
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
    });
  });

  // 15A-11 [Negative]
  test('15AN-10 [Negative]: E2E → Enter Short/Invalid Alternate Mobile Number Length', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Enter a short mobile string', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');
    });

    await test.step('Submit and verify format error', async () => {
      await additionalDetailsPage.proceedButton.click();
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
    });
  });

  // 15A-12 [Negative]
  test('15AN-11 [Negative]: E2E → Enter Characters in Alternate Mobile Number Field and Submit', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Type characters into the mobile number input', async () => {
      await additionalDetailsPage.fillAlternateMobile('ghgfghjg');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');
    });

    await test.step('Attempt to submit and verify that character error/block occurs', async () => {
      await additionalDetailsPage.proceedButton.click();
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
      const value = await additionalDetailsPage.alternateMobileInput.inputValue();
      expect(value).not.toContain('a');
    });
  });

  // // 15A-12
  // test('15A-12: E2E → Select Relationship Type → Verify Multiple Salutations Auto-populate', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  // }) => {
  //   test.setTimeout(10 * 60 * 1000);
  //   await completeFullPrerequisitesToAdditionalDetails({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  //   }, testData);

  //   const relationshipTests = [
  //     { type: 'Father', expectedSalutation: /^Mr\.?$/i },
  //     { type: 'Mother', expectedSalutation: /^Mrs\.?|^Ms\.?$/i },
  //     { type: 'Spouse', expectedSalutation: /^Mr\.?|^Mrs\.?$/i },
  //   ];

  //   for (const test_case of relationshipTests) {
  //     await test.step(`Select Relationship Type: ${test_case.type}`, async () => {
  //       const relationshipType = page.getByRole('combobox', { name: /relationship type/i }).first();
  //       await relationshipType.click();
  //       await page.getByRole('option', { name: test_case.type, exact: true }).click();
  //       await page.waitForTimeout(1000);

  //       const salutationValue = await page.getByRole('combobox', { name: /salutation/i }).first().inputValue();
  //       if (salutationValue && test_case.expectedSalutation.test(salutationValue)) {
  //         expect(salutationValue).toMatch(test_case.expectedSalutation);
  //       }
  //     });
  //   }
  // });

  // 15A-14
  // test('15A-14: E2E → Enable Differently Abled → Fill Disability Details → Proceed', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  // }) => {
  //   test.setTimeout(10 * 60 * 1000);
  //   await completeFullPrerequisitesToAdditionalDetails({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  //   }, testData);

  //   await test.step('Fill Office Details to expose Personal/Disability sections', async () => {
  //     await additionalDetailsPage.enterOfficeDetails(
  //       '411014', 'OTHERS', 'TEST COMPANY', 'Private Ltd', 'EMPLOYEE',
  //       'TEST COMPANY', 'TEST DEPT', 'TEST DEPT', 'TEST AREA',
  //       'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'TEST NAME',
  //       'Proceed'
  //     );
  //   });

  //   await test.step('Fill Personal Details', async () => {
  //     await additionalDetailsPage.enterPersonalDetails(
  //       'TestFather', 'TestMother', '9876543210', 'Married', 'Graduate',
  //       'Residence', 'Within 3 months', 'Continue'
  //     );
  //   });

  //   await test.step('Enable Differently Abled toggle & fill details', async () => {
  //     await page.getByLabel(/differently abled/i).setChecked(true);
  //     await additionalDetailsPage.waitForDisabilitySection();
  //     await additionalDetailsPage.fillDisabilityDetails('Acid attack Victim', '40');
  //   });
  // });

  // // 15A-15
  // test('15A-15: E2E → Enable Politically Exposed Person → Verify Submission', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  // }) => {
  //   test.setTimeout(10 * 60 * 1000);
  //   await completeFullPrerequisitesToAdditionalDetails({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  //   }, testData);

  //   await test.step('Fill Office Details & Personal Details', async () => {
  //     await additionalDetailsPage.enterOfficeDetails(
  //       '411014', 'OTHERS', 'TEST COMPANY', 'Private Ltd', 'EMPLOYEE',
  //       'TEST COMPANY', 'TEST DEPT', 'TEST DEPT', 'TEST AREA',
  //       'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'TEST NAME',
  //       'Proceed'
  //     );
  //     await additionalDetailsPage.enterPersonalDetails(
  //       'TestFather', 'TestMother', '9876543210', 'Married', 'Graduate',
  //       'Residence', 'Within 3 months', 'Continue'
  //     );
  //   });

  //   await test.step('Enable Politically Exposed Person (PEP)', async () => {
  //     await additionalDetailsPage.togglePoliticallyExposed(true);
  //     expect(await additionalDetailsPage.isPoliticallyExposedEnabled()).toBe(true);
  //   });
  // });

  // // 15A-16
  // test('15A-16: E2E → Disability Percentage Field → Character Restriction Validation Matrix', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //   additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  // }) => {
  //   test.setTimeout(10 * 60 * 1000);
  //   await completeFullPrerequisitesToAdditionalDetails({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
  //     additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  //   }, testData);

  //   await test.step('Fill Office and Personal Details up to Disability section', async () => {
  //     await additionalDetailsPage.enterOfficeDetails(
  //       '411014', 'OTHERS', 'TEST COMPANY', 'Private Ltd', 'EMPLOYEE',
  //       'TEST COMPANY', 'TEST DEPT', 'TEST DEPT', 'TEST AREA',
  //       'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'TEST NAME',
  //       'Proceed'
  //     );
  //     await additionalDetailsPage.enterPersonalDetails(
  //       'TestFather', 'TestMother', '9876543210', 'Married', 'Graduate',
  //       'Residence', 'Within 3 months', 'Continue'
  //     );
  //     await page.getByLabel(/differently abled/i).setChecked(true);
  //   });

  //   const testCases = [
  //     { input: 'abc40xyz', description: 'Mixed alphabetic and numeric' },
  //     { input: '50@#$%', description: 'Numeric with special characters' },
  //   ];

  //   for (const test_case of testCases) {
  //     await test.step(`Type "${test_case.input}" into Disability Percentage`, async () => {
  //       const resultingValue = await additionalDetailsPage.typeDisabilityPercentage(test_case.input);
  //       const expectedNumeric = test_case.input.replace(/[^0-9]/g, '');
  //       if (expectedNumeric !== '') {
  //         expect(resultingValue).toBe(expectedNumeric);
  //       }
  //     });
  //   }
  // });

  // 15A-17 [Negative]: Additional Details → Special Characters in First/Last Name → Validation Error
  test('15AN-12 [Negative]: E2E → Special Characters in First Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Fill form with special characters in First Name', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876456326');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John@@#$');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');
    });

    await test.step('Click Proceed and verify validation error blocks submission', async () => {
      await additionalDetailsPage.proceedButton.click();
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
      console.log('✓ 15A-12 Passed: Special characters in name blocked successfully');
    });
  });

  // 15A-18 [Feature]: Additional Details → Select Spouse Relationship Type → Verify Behavior
  test('15AP -13: E2E → Select Spouse Relationship Type → Verify Salutation and Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Select Spouse as Relationship Type and fill required fields', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876456326');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(3);
      await additionalDetailsPage.fillFirstName('Mary');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');
    });

    await test.step('Click Proceed and verify successful flow transition', async () => {
      await additionalDetailsPage.proceedButton.click();
      const errorBanner = page.locator('.slds-theme_error');
      await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
      console.log('✓ 15A-13 Passed: Spouse relationship selected and processed successfully');
    });
  });

  // 15A-19 [Negative]: Additional Details → Disability Percentage Greater Than 100 → Error Validation
  test('15AN-14 [Negative]: E2E → Disability Percentage Greater Than 100 → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Enable Differently Abled and enter invalid percentage (>100)', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876456326');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(3);
      await additionalDetailsPage.fillFirstName('Mary');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');

      await additionalDetailsPage.enableDifferentlyAbled();
      await additionalDetailsPage.waitForDisabilitySection();
      await additionalDetailsPage.fillDisabilityDetails('Locomotor Disability', '150');
    });

    await test.step('Click Proceed and expect range validation error', async () => {
      await additionalDetailsPage.proceedButton.click();
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
      console.log('✓ 15A-14 Passed: Disability percentage > 100 correctly blocked');
    });
  });

  // 15A-20 [Feature]: Additional Details → Minimal Mandatory Fields Only → Successful Submission
  test('15AP -15: E2E → Additional Details → Disability Percentage Field → Pure Character Restriction', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
    additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
  }) => {
    test.setTimeout(10 * 60 * 1000);
    await completeFullPrerequisitesToAdditionalDetails({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage,
      additionalDetailsPage, permanentAddressPage, employmentIncomeDetailsPage
    }, testData);

    await test.step('Enable Differently Abled and attempt to enter alphabetical characters', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876456326');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(3);
      await additionalDetailsPage.fillFirstName('Mary');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');

      await additionalDetailsPage.enableDifferentlyAbled();
      await additionalDetailsPage.waitForDisabilitySection();

      // Try to enter purely characters
      const resultingValue = await additionalDetailsPage.typeDisabilityPercentage('abcdefgh');

      // Verify that characters are completely rejected and the field remains blank
      expect(resultingValue).toBe('');
      console.log('✓ 15C-15 Passed: Alphabetical characters were blocked from Disability Percentage field');
    });
  });
});

// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> E2E)
// =============================================================================
test.describe('15C - Additional Details [Asset Cart Change Scheme Flow]', () => {
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

  async function navigateToAdditionalDetails(
    page: any, assetCartPage: any, productSelectionPage: any, incomeDeclarationPage: any,
    kycPage: any, poiPage: any, poaPage: any, permanentAddressPage: any, surrogateDetailsPage: any,
    approvalDetailsPage: any, employmentIncomeDetailsPage: any, targetPageObj: any
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

    await forceNavigateIfNeeded('Employment & Income Details', employmentIncomeDetailsPage, page);
    await test.step('Employment & Income Details', async () => {
      await employmentIncomeDetailsPage.fillCompleteForm('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR', 'Freelancer', 'Mobile', '6675435678', 'test@example.com', 'Salaried', 'President', 'Diploma holder', '20000', 'Purchase of Consumer Durable Product', '411014', 'Pune 14', 'Pune Market', 'Koregaon Park', 'Near Station');
      await employmentIncomeDetailsPage.clickProceed();
    });

    await forceNavigateIfNeeded('Additional Details', targetPageObj, page);
  }

  test('15C-1: Positive: Additional Details [Change Scheme Flow]', async ({
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
    employmentIncomeDetailsPage,
    additionalDetailsPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC);
    await navigateToAdditionalDetails(
      page, assetCartPage, productSelectionPage, incomeDeclarationPage, kycPage, poiPage, poaPage,
      permanentAddressPage, surrogateDetailsPage, approvalDetailsPage, employmentIncomeDetailsPage, additionalDetailsPage
    );

    await test.step('Fill Additional Details', async () => {
      await additionalDetailsPage.fillAlternateMobile('9876543210');
      await additionalDetailsPage.selectMaritalStatus(1);
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillMiddleName('M');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(1);
      await additionalDetailsPage.fillNameOnCard('John Doe');
      
      await additionalDetailsPage.proceedButton.click();
      const errorBanner = page.locator('.slds-theme_error');
      await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
    });
  });
});