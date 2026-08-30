/**
 * Shared E2E prerequisite helper — used by all 06A–15A suites.
 *
 * Runs the full flow:
 *   Search Dealer → App Status → Zip Code → MITC → PAN Verification →
 *   Product Selection → Income Declaration → KYC → POI → POA →
 *   Surrogate Details → Approval Details
 *
 * Each spec file calls this helper and picks up assertions from the screen
 * that immediately follows Approval Details (their target screen).
 */

import { test } from '../../fixtures';
import { DataGenerator } from '../../utils';

export const MOBILE_NUMBER = '5678654324'; // Legacy constant, kept for backwards compatibility if needed directly

export const getVal = (val: string | undefined, def: string) =>
  val && val !== 'undefined' ? val : def;

export async function completeFullPrerequisites(
  context: any,
  testData: Record<string, string>,
  options?: { stopAfter?: 'appStatus' | 'pan' | 'productSelection' | 'income' | 'kyc' | 'poi' | 'poa' | 'surrogate' | 'approval' | 'additional', forceZipCode?: boolean }
): Promise<void> {
  const {
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  } = context;

  const mobileNumber = '5678654324';

  // ── Search Dealer ──────────────────────────────────────────────────────────
  await test.step('Search Dealer', async () => {
    await dealerSearchPage.navigateToSearchDealer();
    await dealerSearchPage.selectDealerAndSearch(
      testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
      testData['mobilenumberlabel'] || 'Mobile Number',
      mobileNumber,
      testData['searchbutton'] || 'Search'
    );
  });

  // Force navigate to App Status if we landed on an advanced screen
  if (options?.forceZipCode) {
    // Give it a brief moment to settle
    await page.waitForTimeout(3000);
    const screen = await appStatusPage.getCurrentScreen();
    if (screen && !screen.includes('App Status')) {
      console.log(`ℹ forceZipCode is true, but landed on "${screen}". Navigating back to Application Status via Hamburger...`);
      try {
        const hamburgerBtn = page.locator("//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]").first()
          .or(page.locator("//button[@class='breadcrumb-button']").last());
        
        if (await hamburgerBtn.count() > 0) {
           await hamburgerBtn.click({ force: true }).catch(() => {});
           await page.waitForTimeout(1000);
           const appStatusMenu = page.locator("//a/span[contains(text(),'App Status')] | //button[contains(text(),'App Status')] | //a/span[contains(text(),'Application Status')] | //button[contains(text(),'Application Status')]").first();
           if (await appStatusMenu.isVisible({ timeout: 3000 })) {
             await appStatusMenu.click({ force: true });
             await page.waitForTimeout(3000);
           }
        }
      } catch (e) {
        console.log('⚠ Failed to force navigate to Application Status via hamburger menu.');
      }
    }
  }

  // ── App Status ─────────────────────────────────────────────────────────────
  await test.step('Proceed from App Status', async () => {
    await appStatusPage.proceedFromAppStatus(
      testData['appstatuspagename'] || 'App Status',
      testData['proceedbuttonvalue'] || 'Proceed'
    );
  });

  if (options?.stopAfter === 'appStatus') return;

  // Wait for screen to transition away from App Status
  for (let i = 0; i < 10; i++) {
    const current = await zipCodePage.getCurrentScreen();
    if (current && !current.includes('App Status')) break;
    await page.waitForTimeout(1000);
  }

  // Force navigation to Zip Code if requested and we aren't already there
  if (options?.forceZipCode) {
    const isZip = await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal']);
    if (!isZip) {
      console.log(`ℹ forceZipCode is true. Currently on "${await zipCodePage.getCurrentScreen()}". Navigating to Zip Code via Hamburger...`);
      try {
        const hamburgerBtn = page.locator("//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]").first()
          .or(page.locator("//button[@class='breadcrumb-button']").last());
          
        if (await hamburgerBtn.count() > 0) {
           await hamburgerBtn.click({ force: true }).catch(() => {});
           await page.waitForTimeout(1000);
           const zipMenu = page.locator("//a/span[contains(text(),'Zip Code')] | //button[contains(text(),'Zip Code')] | //a[contains(text(),'Zip Code')]").first();
           if (await zipMenu.isVisible({ timeout: 3000 })) {
             await zipMenu.click({ force: true });
             await page.waitForTimeout(3000);
           }
        }
      } catch (e) {
        console.log('⚠ Failed to force navigate to Zip Code via hamburger menu.');
      }
    }
  }

  // ── Zip Code ───────────────────────────────────────────────────────────────
  if (await zipCodePage.isCurrentScreen(['Zip Code Verification', 'Zip/Postal'])) {
    await test.step('Zip Code Details', async () => {
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
  }

  // ── MITC ───────────────────────────────────────────────────────────────────
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

  await page.waitForTimeout(3000);

  // ── PAN Verification ───────────────────────────────────────────────────────
  if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification'])) {
    await test.step('PAN Verification (No)', async () => {
      await panVerificationPage.fillPanVerificationDetails(
        getVal(testData['panNo'], 'HFHPP1234D'),
        getVal(testData['firstname'], 'Dummycust'),
        getVal(testData['lastname'], 'Doe'),
        getVal(testData['dobvalue'], '18-12-1996'),
        getVal(testData['proceedbuttonvalue'], 'Proceed')
      );
    });

    console.log('⚠ PAN prompt not found. Assuming we are already on Product Selection.');
  }

  if (options?.stopAfter === 'pan') return;

  await page.waitForTimeout(2000);

  // ── Product Selection ──────────────────────────────────────────────────────
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

  if (options?.stopAfter === 'productSelection') return;

  await page.waitForTimeout(4000);

  // ── Income Declaration ─────────────────────────────────────────────────────
  if (await incomeDeclarationPage.isCurrentScreen('Income Declaration')) {
    await test.step('Income Declaration', async () => {
      await incomeDeclarationPage.fillIncomeDeclaration(
        '40000',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }

  if (options?.stopAfter === 'income') return;

  await page.waitForTimeout(4000);

  // ── KYC ───────────────────────────────────────────────────────────────────
  if (await kycPage.isCurrentScreen('KYC')) {
    await test.step('KYC Details', async () => {
      await kycPage.fillKYCDetails(
        "Customer doesn't have one of the listed Document types",
        'Save',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }

  if (options?.stopAfter === 'kyc') return;

  await page.waitForTimeout(4000);

  // ── POI ───────────────────────────────────────────────────────────────────
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

  if (options?.stopAfter === 'poi') return;

  await page.waitForTimeout(4000);

  // ── POA ───────────────────────────────────────────────────────────────────
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

  if (options?.stopAfter === 'poa') return;

  await page.waitForTimeout(4000);

  // ── Surrogate Details ──────────────────────────────────────────────────────
  await test.step('Surrogate Details', async () => {
    const isSurrogateScreen = await surrogateDetailsPage.navigateToSurrogateDetails();
    if (isSurrogateScreen) {
      await surrogateDetailsPage.selectSurrogateDetails(
        testData['surrogatedetailspagename'] || 'Surrogate Details',
        testData['processtypelabel'] || 'Process Type',
        testData['processtypevalue'] || 'Normal',
        testData['creditprogramlabel'] || 'Credit Program',
        testData['creditprogramvalue'] || '1.06 [Prime Banking]',
        testData['checkapprovalbuttonlabel'] || 'Check Approval',
        'RSA',
        'No',
        undefined,
        testData['customerbankname'] || 'Axis Bank'
      );
    } else {
      console.log('⚠ Surrogate Details not found. Skipping surrogate step (customer likely advanced).');
    }
  });

  if (options?.stopAfter === 'surrogate') return;

  await page.waitForTimeout(3000);

  // ── Approval Details ───────────────────────────────────────────────────────
  await test.step('Approval Details', async () => {
    await approvalDetailsPage.navigateToApprovalDetails();
    await approvalDetailsPage.clickButton(testData['proceedbuttonvalue'] || 'Proceed');
    await page.waitForTimeout(1000);
    await approvalDetailsPage.checkForErrors();
  });

  if (options?.stopAfter === 'approval') return;

  // App auto-navigates to next screen after Approval Details Proceed
  await page.waitForTimeout(3000);

  // ── Additional Details ─────────────────────────────────────────────────────
  if (context.additionalDetailsPage) {
    await test.step('Additional Details', async () => {
      const { additionalDetailsPage } = context;
      await additionalDetailsPage.enterOfficeDetails(
        '411014', 'OTHERS', 'EUREKA FORBS SERVICE CENTER', 'Private Ltd', 'SHOP OWNER',
        'EUREKA FORBS SERVICE CENTER', 'AM SERVISES', 'AM SERVISES', 'BAVDHAN',
        'Mobile', '5675435678', 'Salaried', 'Others', 'Rs 25001-50000', 'AMIR',
        testData['proceedbuttonvalue'] || 'Proceed'
      );

      await additionalDetailsPage.enterPersonalDetails(
        'MAHEBUB', 'Rahima', '9527187976', 'Married', 'Graduate',
        'Residence', 'Within 3 months', testData['continuebuttonlabel'] || 'Continue'
      );
    });
  }

  if (options?.stopAfter === 'additional') return;
}
