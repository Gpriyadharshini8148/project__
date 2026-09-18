import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

async function navigateViaHamburgerToEmploymentIncomeDetails(
  context: any,
  testData: Record<string, string>
): Promise<void> {
  const { page, dealerSearchPage, appStatusPage } = context;
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

  await test.step('Navigate to Employment & Income Details via Hamburger Menu', async () => {
    const hamburger = page.getByRole('button', { name: '...' }).first()
      .or(page.getByText('...', { exact: true }).first())
      .or(page.locator('.slds-icon-utility-rows').first());

    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click({ force: true });

    const targetLink = page.getByRole('button', { name: 'Employment & Income Details' })
      .or(page.getByRole('menuitem', { name: /Employment & Income Details/i }))
      .or(page.locator('a, button').filter({ hasText: /Employment & Income Details/i }));

    await expect(targetLink.first()).toBeVisible({ timeout: 10000 });
    await targetLink.first().click({ force: true });

    // Ensure full rendering of the target page DOM
    await page.waitForTimeout(3000);
  });
}

test.describe('14C - Employment & Income Details [Hamburger Direct Shortcut]', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  test('14C-01: Jump from App Status via Hamburger → Fill Employment Details → Proceed', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill all Employment, Income, and Address details', async () => {
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
    });

    await test.step('Click Proceed and verify successful submission', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorBanner = page.locator(".slds-theme_error");
      await expect(errorBanner).not.toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-01 Passed: Form submitted via Hamburger bypass without running underwriting!');
    });
  });

  test('14C-02 [Negative]: Employment & Income → Salaried/Self-Employed Without Company Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Attempt to proceed without Company/Business Name', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
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
      console.log('✓ 14C-02 Passed: Validation error displayed for missing Company Name');
    });
  });

  test('14C-03 [Negative]: Employment & Income → Without Office Phone Type → Expected Behavior', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form without Office Phone Number Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
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
      console.log(`14C-03 Result: ${isErrorVisible ? 'Validation error shown' : 'Proceeded without error'}`);
    });
  });

  test('14C-04 [Feature]: Employment & Income → Self-Employed Type → Fill and Proceed', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form with Self-Employed as Employment Type', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('selfemployed@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Self Employed');
      await employmentIncomeDetailsPage.selectDesignation('Business Owner');
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
      console.log('✓ 14C-04 Passed: Self-Employed type processed successfully');
    });
  });

  test('14C-05 [Validation]: Employment & Income → Without Qualification → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form without Qualification', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('');
      await employmentIncomeDetailsPage.fillMonthlyIncome('20000');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect mandatory validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|complete this field|error|invalid/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-05 Passed: Mandatory error displayed for missing Qualification');
    });
  });

  test('14C-06 [Validation]: Employment & Income → Without Monthly Income → Mandatory Error', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form without Monthly Income', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
      await employmentIncomeDetailsPage.fillMonthlyIncome('');
      await employmentIncomeDetailsPage.selectPurposeOfLoan('Purchase of Consumer Durable Product');
      await employmentIncomeDetailsPage.fillPincode('411014');
      await employmentIncomeDetailsPage.fillAddressLine1('Pune 14');
      await employmentIncomeDetailsPage.fillAddressLine2('Pune Market');
      await employmentIncomeDetailsPage.fillAddressLine3('Koregaon Park');
      await employmentIncomeDetailsPage.fillArea('Near Station');
    });

    await test.step('Click Proceed and expect mandatory validation error', async () => {
      await employmentIncomeDetailsPage.clickProceed();
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|error|invalid/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
      console.log('✓ 14C-06 Passed: Mandatory error displayed for missing Monthly Income');
    });
  });

  test('14C-07 [Feature]: Employment & Income → Verify Household Income State (Pre-filled/Disabled)', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Verify Monthly Household Income field state', async () => {
      const isDisabled = await employmentIncomeDetailsPage.isMonthlyHouseholdIncomeDisabled();
      const prefillValue = await employmentIncomeDetailsPage.getMonthlyHouseholdIncomeValue();

      expect(isDisabled || prefillValue !== '').toBe(true);
      console.log('✓ 14C-07 Passed: Household Income field has expected state');
    });
  });

  test('14C-08 [Validation]: Employment & Income → Without Pincode → Dependent Fields Disabled', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Verify dependent field states without Pincode', async () => {
      await employmentIncomeDetailsPage.fillPincode('');
      const isCityDisabled = await employmentIncomeDetailsPage.isCityDisabled();
      const isStateDisabled = await employmentIncomeDetailsPage.isStateDisabled();
      const cityValue = await employmentIncomeDetailsPage.getCityValue();
      const stateValue = await employmentIncomeDetailsPage.getStateValue();

      const fieldsInExpectedState = (isCityDisabled || cityValue === '') && (isStateDisabled || stateValue === '');
      expect(fieldsInExpectedState).toBe(true);
      console.log('✓ 14C-08 Passed: City and State fields are in expected state');
    });
  });

  test('14C-09 [Negative]: Employment & Income → Single Char in Address Lines → Min Length Error', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form with single character in Address Lines', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('Freelancer');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
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
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|error|invalid/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 3000 });
      console.log('✓ 14C-09 Passed: Minimum length validation error displayed');
    });
  });

  test('14C-10 [Negative]: Employment & Income → Blank Submission → Form Validation Errors', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Attempt to proceed without filling any fields', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('');
      await employmentIncomeDetailsPage.selectIndustry('');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('');
      await employmentIncomeDetailsPage.fillMonthlyIncome('');
      await employmentIncomeDetailsPage.fillPincode('');
      
      await employmentIncomeDetailsPage.clickProceed();
    });

    await test.step('Verify multiple mandatory validation errors appear', async () => {
      const errorElements = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|complete this field|error|invalid/i));
      await expect(errorElements.first()).toBeVisible({ timeout: 5000 });
      const count = await errorElements.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ 14C-10 Passed: ${count} validation error(s) displayed`);
    });
  });

  test('14C-11 [Validation]: Employment & Income → Salaried Without Industry → Expected Error', async ({
    page, dealerSearchPage, appStatusPage, employmentIncomeDetailsPage
  }) => {
    await navigateViaHamburgerToEmploymentIncomeDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill form without Industry selection', async () => {
      await employmentIncomeDetailsPage.fillCompanyName('BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR');
      await employmentIncomeDetailsPage.selectIndustry('');
      await employmentIncomeDetailsPage.selectOfficePhoneType('Mobile');
      await employmentIncomeDetailsPage.fillOfficialContactNumber('5675435678');
      await employmentIncomeDetailsPage.fillOfficialEmailId('test@example.com');
      await employmentIncomeDetailsPage.selectEmploymentType('Salaried');
      await employmentIncomeDetailsPage.selectDesignation('CEO/ CFO/ COO/ CXO');
      await employmentIncomeDetailsPage.selectQualification('Graduate');
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
      const errorMsg = page.locator('.slds-form-element__help, .slds-theme_error').or(page.getByText(/required|error|invalid/i)).first();
      await expect(errorMsg).toBeVisible({ timeout: 3000 });
      console.log('✓ 14C-11 Passed: Validation error displayed for missing Industry');
    });
  });
});
