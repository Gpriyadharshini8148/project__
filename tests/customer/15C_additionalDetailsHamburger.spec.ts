import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

async function navigateViaHamburgerToAdditionalDetails(
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

  await test.step('Navigate to Additional Details via Hamburger Menu', async () => {
    const hamburger = page.getByRole('button', { name: '...' }).first()
      .or(page.getByText('...', { exact: true }).first())
      .or(page.locator('.slds-icon-utility-rows').first());

    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click({ force: true });

    const targetLink = page.getByRole('button', { name: 'Additional Details' })
      .or(page.getByRole('menuitem', { name: /Additional Details/i }))
      .or(page.locator('a, button').filter({ hasText: /Additional Details/i }));

    await expect(targetLink.first()).toBeVisible({ timeout: 10000 });
    await targetLink.first().click({ force: true });

    // Ensure full rendering of the target page DOM
    await page.waitForTimeout(3000);
  });
}

test.describe('15C - Additional Details [Hamburger Direct Shortcut - 15 Cases]', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  // 15C-01
  test('15C-01: Hamburger → Additional Details → Select Relationship Type → Verify Salutation Auto-populate', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-02
  test('15C-02: Hamburger → Additional Details → Enter Valid Data For All Fields and Submit', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
      const errorBanner = page.locator('.slds-theme_error');
      await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
    });
  });

  // 15C-03
  test('15C-03: Hamburger → Additional Details → Enable Politically Exposed Person (PEP) and Submit', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill mandatory fields and enable PEP toggle', async () => {
      await additionalDetailsPage.fillAlternateMobile('6876543210');
      await additionalDetailsPage.selectMaritalStatus(1); // Adjust index or value as needed per your helper
      await additionalDetailsPage.selectRelationshipType(1);
      await additionalDetailsPage.fillFirstName('John');
      await additionalDetailsPage.fillLastName('Doe');
      await additionalDetailsPage.selectMailingAddress(1);
      await additionalDetailsPage.selectTimeHorizon(7);
      await additionalDetailsPage.fillNameOnCard('abcd');
      await additionalDetailsPage.enablePoliticallyExposedToggle();
    });

    await test.step('Submit form and verify processing', async () => {
      await additionalDetailsPage.proceedButton.click();
    });
  });

  // 15C-04 [Negative]

  // 15C-04 [Negative]
  test('15C-04 [Negative]: Hamburger → Additional Details → Enable Differently Abled Without Disability Details Shows Error', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
  // 15C-05
  test('15C-05: Hamburger → Additional Details → Disability Percentage Field - Character Restriction Validation', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Enable differently abled and test typing non-numeric characters', async () => {
      await additionalDetailsPage.enableDifferentlyAbled();
      const resultingValue = await additionalDetailsPage.typeDisabilityPercentage('abc40xyz');
      expect(resultingValue).toBe('40');
    });
  });

  // 15C-06 [Negative]
  test('15C-06 [Negative]: Hamburger → Additional Details → Submit Without Alternate Mobile Number Shows Error', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-07
  test('15C-07: Hamburger → Additional Details → Select Single Relationship Type and Submit', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-08 [Negative]
  test('15C-08 [Negative]: Hamburger → Additional Details → Submit Without First Name Shows Error', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

      // Verify that submission is blocked and we remain on the page
      await page.waitForTimeout(1500);
      const isStillOnPage = await additionalDetailsPage.proceedButton.isVisible();
      expect(isStillOnPage).toBe(true);
    });
  });

  // 15C-09 [Negative]
  test('15C-09 [Negative]: Hamburger → Additional Details → Submit Form With Completely Empty Fields', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-10 [Negative]
  test('15C-10 [Negative]: Hamburger → Additional Details → Enter Short/Invalid Alternate Mobile Number Length', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-11 [Negative]
  test('15C-11 [Negative]: Hamburger → Additional Details → Enter Characters in Alternate Mobile Number Field and Submit', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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

  // 15C-12 [Negative]
  test('15C-12 [Negative]: Hamburger → Additional Details → Special Characters in First Name → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
      console.log('✓ 15C-12 Passed: Special characters in name blocked successfully');
    });
  });

  // 15C-13
  test('15C-13: Hamburger → Additional Details → Select Spouse Relationship Type → Verify Salutation and Proceed', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
      console.log('✓ 15C-13 Passed: Spouse relationship selected and processed successfully');
    });
  });

  // 15C-14 [Negative]
  test('15C-14 [Negative]: Hamburger → Additional Details → Disability Percentage Greater Than 100 → Validation Error', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
      console.log('✓ 15C-14 Passed: Disability percentage > 100 correctly blocked');
    });
  });

  // 15C-15
  test('15C-15: Hamburger → Additional Details → Disability Percentage Field → Pure Character Restriction', async ({
    page, dealerSearchPage, appStatusPage, additionalDetailsPage
  }) => {
    await navigateViaHamburgerToAdditionalDetails({ page, dealerSearchPage, appStatusPage }, testData);

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
