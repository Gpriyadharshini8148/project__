import { test, expect } from '../../fixtures';
import { ExcelReader } from '../../utils';
import { config } from '../../config/environment.config';

const excelReader = new ExcelReader();
const suiteName = config.excel.suiteName;

async function navigateViaHamburgerToPermanentAddress(
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

  await test.step('Navigate to Permanent Address via Hamburger Menu', async () => {
    const hamburger = page.getByRole('button', { name: '...' }).first()
      .or(page.getByText('...', { exact: true }).first())
      .or(page.locator('.slds-icon-utility-rows').first());

    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click({ force: true });

    const targetLink = page.getByRole('button', { name: 'Permanent Address' })
      .or(page.getByRole('menuitem', { name: /Permanent Address/i }))
      .or(page.locator('a, button').filter({ hasText: /Permanent Address/i }));

    await expect(targetLink.first()).toBeVisible({ timeout: 10000 });
    await targetLink.first().click({ force: true });

    // Ensure full rendering of the target page DOM
    await page.waitForTimeout(3000);
  });
}

test.describe('13C - Permanent Address [Hamburger Direct Shortcut]', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    testData = excelReader.getTestDataForTestCase(suiteName);
  });

  test('13C-01: Jump from App Status via Hamburger → Fill Pincode and Click Proceed → Proceed', async ({
    page, dealerSearchPage, appStatusPage, permanentAddressPage
  }) => {
    await navigateViaHamburgerToPermanentAddress({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Fill Permanent Address Details', async () => {
      await permanentAddressPage.fillPermanentAddressDetails('Self Owned', '411014', 'Bajaj Finserv Head Office', 'Sakore Nagar, Viman Nagar', 'Near Pune International Airport', 'Sakore Nagar, Viman Nagar', 'Pune', 'Maharashtra', 'Aadhaar', '2222');
    });

    await test.step('Click Proceed on Permanent Address', async () => {
      await permanentAddressPage.clickProceed();
    });

    // Verify no error banner appears
    const errorBanner = page.locator(".slds-theme_error");
    await expect(errorBanner).not.toBeVisible({ timeout: 5000 });
    console.log('✓ 13C-01 Passed: Permanent Address proceeded successfully via Hamburger shortcut');
  });

  test('13C-02 [positive]: Permanent Address → Verify Fields Enabled (Editable)', async ({
    page, dealerSearchPage, appStatusPage, permanentAddressPage
  }) => {
    await navigateViaHamburgerToPermanentAddress({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Check if address fields are enabled and editable', async () => {
      const isEditable = await permanentAddressPage.verifyAddressLineIsEditable();
      expect(isEditable).toBe(true);
      console.log('✓ 13C-02 Passed: Address fields are enabled and can be edited');
    });
  });

  test('13C-03 [Feature]: Permanent Address → Verify Proceed Button Visible & Enabled', async ({
    page, dealerSearchPage, appStatusPage, permanentAddressPage
  }) => {
    await navigateViaHamburgerToPermanentAddress({ page, dealerSearchPage, appStatusPage }, testData);

    await test.step('Verify Proceed button is visible and enabled', async () => {
      const isProceedVisible = await permanentAddressPage.isProceedButtonVisible();
      expect(isProceedVisible).toBe(true);
      console.log('✓ Proceed button is visible');

      const proceedBtn = page.getByRole('button', { name: /proceed/i }).first()
          .or(page.locator('c-permanent-address-reinvent div.mainStaticProceedNormalBox button').first());
      const isEnabled = await proceedBtn.isEnabled({ timeout: 2000 }).catch(() => false);
      expect(isEnabled).toBe(true);
      console.log('✓ Proceed button is enabled');
      console.log('✓ 13C-03 Passed: Proceed button is visible and enabled');
    });
  });
});
