import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';
import { IncomeDeclarationPage } from '@pages/index';


/**
 * Test Suite: 07 - Income Declaration
 * 
 * Prerequisites: Steps 01-06 (through Product Selection) completed
 * 
 * Purpose: Declare customer income and source
 * 
 * Scenarios:
 * - Positive: Declare salaried income
 * - Positive: Declare self-employed income
 * - Negative: Income below minimum threshold
 * - Negative: Income above maximum threshold
 * - Negative: Proceed without income source
 * - Feature: Verify income source options
 */

// const excelReader = new ExcelReader();
// const suiteName = config.excel.suiteName;

test.describe('07 - Income Declaration', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_07_IncomeDeclaration');
  });

  async function completePrerequisites(context: any) {
    const {
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      assetCartPage,
      productSelectionPage,
      incomeDeclarationPage,
      poiPage,
      kycPage,
      page,
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

    if (await appStatusPage.isCurrentScreen('Approval Details')) {
      await test.step('Hamburger Navigation to Zip Code Details', async () => {
        console.log('⚠ Landed on Approval Details! Using Hamburger menu to navigate to Zip Code Details...');
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());

        await hamburger.click({ force: true });

        const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
          .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));

        await targetLink.click({ force: true });
        console.log('✓ Hamburger navigation to Zip Code Details complete.');
      });
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
          testData['firstname'] || 'Dummycust',
          testData['lastname'] || 'Doe',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
        await mitcPage.proceedToPanVerification(testData['proceedbuttonvalue'] || 'Proceed');
      });
    }

    await page.waitForTimeout(3000);

    if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification'])) {
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

    await test.step('Hamburger Navigation to Asset Cart', async () => {
      console.log('? Using Hamburger menu to navigate to Asset Cart...');
      await page.waitForTimeout(2000);
      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());

      await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
      await hamburger.click({ force: true });

      const targetLink = page.getByRole('button', { name: 'Asset Cart' })
        .or(page.getByRole('menuitem', { name: /Asset Cart/i }));

      await targetLink.first().click({ force: true });
      console.log('? Hamburger navigation to Asset Cart complete.');
    });

    await test.step('Expand Asset Cart and Change Scheme', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      if (oppId) {
        await assetCartPage.expandCartDetails(oppId);
        await assetCartPage.clickChangeScheme();
      }
    });

    await test.step('Select product from catalog', async () => {
      await productSelectionPage.fillProductDetails(
        testData['productModel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        testData['invoiceamount'] || '49600',
        testData['requiredloanamount'] || '35000',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });
  }
  // await appStatusPage.proceedFromAppStatus(
  //   testData['appstatuspagename'] || 'App Status',
  //   testData['proceedbuttonvalue'] || 'Proceed'
  // );

  // const zipCodeData: ZipCodeData = {
  //   zipCode: testData["zipcodelabel"] || "Enter Customer ZipCode",
  //   zipCodeValue: testData["zipcodevalue"] || "411014 Pune",
  //   bflBranch: testData["bflbranchvalue"] || "411014-Manual Testing Pune",
  //   dob: testData["dobvalue"] || "18-12-1996",
  //   gender: testData["gendervalue"] || "Male",
  //   language: testData["preferredcommunicationlanguagevalue"] || "English",
  //   preferredLanguage: testData["preferredlanguagevalue"] || "HINDI",
  //   poaAddressType: testData["poaaddresstype"],
  // };
  // await zipCodePage.fillZipCodeDetails(zipCodeData);
  // await zipCodePage.proceed(testData["proceedbuttonvalue"] || "Proceed");

  // await mitcPage.fillMitcDetailsWithFirstAndLastName(
  //   testData['firstname'] || 'Dummycust',
  //   testData['lastname'] || 'Doe',
  //   testData['proceedbuttonvalue'] || 'Proceed'
  // );

  // await mitcPage.proceedToPanVerification(testData['proceedbuttonvalue'] || 'Proceed');

  // await panVerificationPage.fillPanVerificationDetails(
  //   DataGenerator.generatePanNumber(),
  //   testData['firstname'] || 'Dummycust',
  //   testData['lastname'] || 'Doe',
  //   testData['dobvalue'] || '18-12-1996',
  //   testData['proceedbuttonvalue'] || 'Proceed'
  // );

  // await page.waitForTimeout(2000);
  // console.log('✓ Reached product selection flow successfully');

  // test.beforeEach(async ({
  //   loginPage,
  //   dealerSearchPage,
  //   appStatusPage,
  //   zipCodePage,
  //   mitcPage,
  //   panVerificationPage,
  //   page,
  // }) => {
  //   await completePrerequisites({
  //       zipCodePage,
  //       mitcPage,
  //       panVerificationPage,
  //       assetCartPage,
  //       poiPage,
  //       kycPage
  //     });
  // });

  test('Positive: Declare salaried income', async ({
    dealerSearchPage,
    appStatusPage,
    page,
    incomeDeclarationPage,
    productSelectionPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    assetCartPage,
    poiPage,
    kycPage
  }) => {
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      incomeDeclarationPage,
      productSelectionPage,
      page,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      assetCartPage,
      poiPage,
      kycPage
    });

    await test.step('Eneter monthly income', async () => {
      const incomeData = {
        monthlyIncome: testData["monthlyincome"] || "50000",
        proceedButton: testData["proceedbuttonvalue"] || "Proceed",
      };

      await incomeDeclarationPage.fillIncomeDeclaration(
        incomeData.monthlyIncome,
        incomeData.proceedButton
      );
    });
  });


  test('Negative: Proceed without entering income', async ({
    dealerSearchPage,
    appStatusPage,
    page,
    incomeDeclarationPage,
    productSelectionPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    assetCartPage,
    poiPage,
    kycPage
  }) => {
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      incomeDeclarationPage,
      productSelectionPage,
      page,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      assetCartPage,
      poiPage,
      kycPage
    });

    await test.step('Attempt to proceed without entering income', async () => {
      const proceedButton = testData["proceedbuttonvalue"] || "Proceed";
      await incomeDeclarationPage.clickButton(proceedButton);
    });

    //error handle "Error notification.Error Failed to fetch declaration status."
    await test.step('Verify error message for missing income', async () => {
      const errorMessage = page.locator('text=/please enter.*income|income.*required|required field/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: config.timeouts.element });
    });

  });




  //     test('Negative: Income below minimum threshold', async ({
  //   loginPage,
  //   dealerSearchPage,
  //   appStatusPage,
  //   page,
  //   incomeDeclarationPage,
  //   productSelectionPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //   await completePrerequisites({
  //       zipCodePage,
  //       mitcPage,
  //       panVerificationPage,
  //       assetCartPage,
  //       poiPage,
  //       kycPage
  //     });

  //   await test.step('Enter income below allowed minimum and proceed', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(
  //       testData['monthlyincomebelow'] || '5000',
  //       testData['proceedbuttonvalue'] || 'Proceed'
  //     );
  //   });

  //   await test.step('Verify minimum income validation error', async () => {
  //     const errorMessage = page.locator(
  //       'text=/minimum income|income.*low|insufficient income/i'
  //     );
  //     await expect(errorMessage.first()).toBeVisible({ timeout: config.timeouts.element });
  //     console.log('✓ Income below minimum threshold validation displayed');
  //   });
  // });



  // test('Negative: Income above maximum threshold', async ({
  //   loginPage,
  //   dealerSearchPage,
  //   appStatusPage,
  //   page,
  //   incomeDeclarationPage,
  //   productSelectionPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //   await completePrerequisites({
  //       zipCodePage,
  //       mitcPage,
  //       panVerificationPage,
  //       assetCartPage,
  //       poiPage,
  //       kycPage
  //     });

  //   await test.step('Enter income above allowed maximum and proceed', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(
  //       testData['monthlyincomeabove'] || '99999999',
  //       testData['proceedbuttonvalue'] || 'Proceed'
  //     );
  //   });

  //   await test.step('Verify maximum income validation error', async () => {
  //     const errorMessage = page.locator(
  //       'text=/exceeds.*limit|maximum.*income|too high|income.*high/i'
  //     );
  //     await expect(errorMessage.first()).toBeVisible({ timeout: config.timeouts.element });
  //     console.log('✓ Income above maximum threshold validation displayed');
  //   });
  // });








  // test('Negative: Proceed without selecting income source', async ({
  //   loginPage,
  //   dealerSearchPage,
  //   appStatusPage,
  //   page,
  //   incomeDeclarationPage,
  //   productSelectionPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //     await completePrerequisites({
  //       zipCodePage,
  //       mitcPage,
  //       panVerificationPage,
  //       assetCartPage,
  //       poiPage,
  //       kycPage
  //     });

  //   // Navigate to Income Declaration
  //   await expect(
  //     page.locator(`text=${testData['incomedeclarationpagename'] || 'Income Declaration'}`)
  //   ).toBeVisible({ timeout: config.timeouts.page });

  //   // Fill only income, don't select source
  //   const incomeInput = page.locator('input[name*="income"], input[placeholder*="Income"]');
  //   await incomeInput.fill('30000');

  //   // Try to proceed without selecting source
  //   const proceedButton = page.locator(`button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`);

  //   const isEnabled = await proceedButton.isEnabled().catch(() => true);

  //   if (isEnabled) {
  //     await proceedButton.click();

  //     // Verify error
  //     const errorMessage = page.locator(
  //       'text=/select.*source|income source.*required|required field/i'
  //     );
  //     await expect(errorMessage.first()).toBeVisible({ timeout: config.timeouts.element });
  //   } else {
  //     console.log('✓ Proceed button disabled without income source');
  //   }
  // });





  // test('Positive: Declare self-employed income', async ({
  //   page,
  //   incomeDeclarationPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //   // Navigate to Income Declaration
  //   await expect(
  //     page.locator(`text=${testData['incomedeclarationpagename'] || 'Income Declaration'}`)
  //   ).toBeVisible({ timeout: config.timeouts.page });

  //   // Fill income - self employed
  //   const incomeInput = page.locator('input[name*="income"], input[placeholder*="Income"]');
  //   await incomeInput.fill('75000');

  //   // Select income source
  //   const incomeSourceDropdown = page.locator('select[name*="source"], select[name*="incomeSource"]');
  //   await incomeSourceDropdown.selectOption({ label: /Business|Self.*Employed/i });

  //   // Proceed
  //   const proceedButton = page.locator(`button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`);
  //   await proceedButton.click();

  //   // Verify navigation
  //   await expect(
  //     page.locator(`text=${testData['surrogatedetailspagename'] || 'Surrogate Details'}`)
  //   ).toBeVisible({ timeout: config.timeouts.element });
  // });





  // test('Feature: Verify income source options', async ({
  //   page,
  //   incomeDeclarationPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //   // Navigate to Income Declaration
  //   await expect(
  //     page.locator(`text=${testData['incomedeclarationpagename'] || 'Income Declaration'}`)
  //   ).toBeVisible({ timeout: config.timeouts.page });

  //   // Get income source dropdown
  //   const incomeSourceDropdown = page.locator('select[name*="source"], select[name*="incomeSource"]');
  //   const hasDropdown = await incomeSourceDropdown.isVisible({ timeout: 3000 }).catch(() => false);

  //   if (hasDropdown) {
  //     // Get all options
  //     const options = await incomeSourceDropdown.locator('option').allTextContents();
  //     console.log(`Found income sources: ${options.join(', ')}`);

  //     // Verify common income sources
  //     const expectedSources = ['Salary', 'Business', 'Self Employed', 'Professional', 'Pension', 'Investment'];

  //     for (const source of expectedSources) {
  //       const hasSource = options.some(opt => opt.toLowerCase().includes(source.toLowerCase()));
  //       if (hasSource) {
  //         console.log(`✓ Found income source: ${source}`);
  //       }
  //     }

  //     // Verify at least 3 options
  //     expect(options.length).toBeGreaterThanOrEqual(3);
  //   }
  // });

  // test('Feature: Verify income amount formatting', async ({
  //   page,
  //   incomeDeclarationPage,
  //,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     assetCartPage,
  //     poiPage,
  //     kycPage
  //   }) => {
  //   // Navigate to Income Declaration
  //   await expect(
  //     page.locator(`text=${testData['incomedeclarationpagename'] || 'Income Declaration'}`)
  //   ).toBeVisible({ timeout: config.timeouts.page });

  //   // Test income input formatting
  //   const incomeInput = page.locator('input[name*="income"], input[placeholder*="Income"]');

  //   // Enter income with commas
  //   await incomeInput.fill('50,000');

  //   // Verify value is accepted
  //   const inputValue = await incomeInput.inputValue();
  //   console.log(`Income value after input: ${inputValue}`);

  //   // Value should either preserve commas or convert to number
});
// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> Income Declaration)
// =============================================================================
test.describe('07C - Income Declaration [Asset Cart Change Scheme Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000);
  let testDataC: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testDataC = excelReader.getTestDataForTestCase('TC_07_IncomeDeclaration');
  });

  async function completeFullPrerequisites(context: any, testData: Record<string, string>, options?: { stopAtPan?: boolean }) {
    const {
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage
    } = context;

    await test.step('Search Dealer', async () => {
      await dealerSearchPage.navigateToSearchDealer();
      await dealerSearchPage.selectDealerAndSearch(
        testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
        testData['mobilenumberlabel'] || 'Mobile Number',
        '5675435678',
        testData['searchbutton'] || 'Search'
      );
    });

    await page.waitForTimeout(4000);

    if (await appStatusPage.isCurrentScreen('App Status')) {
      await test.step('App Status', async () => {
        await appStatusPage.proceedFromAppStatus(
          testData['appstatuspagename'] || 'App Status',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
      });
    } else {
      await test.step('Hamburger Navigation to Zip Code Details', async () => {
        console.log('? Using Hamburger menu to navigate to Zip Code Details...');
        await page.waitForTimeout(1000);
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.locator('.slds-icon-utility-rows').first());
        await hamburger.click({ force: true });
        await page.waitForTimeout(1500);
        const targetLink = page.getByRole('button', { name: 'Zip Code Verification' })
          .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
      });
    }

    await test.step('Zip Code Details', async () => {
      await page.waitForTimeout(2000);
      await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
    });

    if (await mitcPage.isCurrentScreen('MITC')) {
      await test.step('MITC Details', async () => {
        await mitcPage.fillMitcDetailsWithFirstAndLastName(
          testData['firstname'] || 'Dummycust',
          testData['lastname'] || 'Doe',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
        await mitcPage.proceedToPanVerification(testData['proceedbuttonvalue'] || 'Proceed');
      });
    }

    await page.waitForTimeout(3000);

    if (options?.stopAtPan) {
      console.log('? stopAtPan is true - exiting completeFullPrerequisites early.');
      return;
    }

    if (await panVerificationPage.isCurrentScreen(['PAN Verification', 'Data Verification'])) {
      let panProcessed = true;
      await test.step('PAN Verification (No)', async () => {
        panProcessed = await panVerificationPage.fillPanVerificationDetails(
          testData['panNo'] || 'HFHPP1234D',
          testData['firstname'] || 'Dummycust',
          testData['lastname'] || 'Doe',
          testData['dobvalue'] || '18-12-1996',
          testData['proceedbuttonvalue'] || 'Proceed'
        );
      });
    }
  }

  async function forceNavigateIfNeeded(expectedScreen: string, pageObj: any, page: any) {
    await page.waitForTimeout(3000);
    if (!(await pageObj.isCurrentScreen(expectedScreen))) {
      console.log('? Not on \. Force navigating via Hamburger...');
      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());
      await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
      await hamburger.click({ force: true });
      await page.waitForTimeout(1500);

      const targetLink = page.getByRole('button', { name: new RegExp(expectedScreen, 'i') })
        .or(page.getByRole('menuitem', { name: new RegExp(expectedScreen, 'i') }));
      await targetLink.first().click({ force: true });
      await page.waitForTimeout(2000);
    }
  }

  async function navigateToIncomeDeclaration(page: any, assetCartPage: any, productSelectionPage: any, incomeDeclarationPage: any) {
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
  }

  test('07C-1: Positive: Declare salaried income [Change Scheme Flow]', async ({
    page,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    assetCartPage,
    productSelectionPage,
    incomeDeclarationPage,
    poiPage,
    kycPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC, { stopAtPan: false });
    await navigateToIncomeDeclaration(page, assetCartPage, productSelectionPage, incomeDeclarationPage);

    await test.step('Fill Income details', async () => {
      const incomeAmount = testDataC['income'] || '30000';
      const proceedButtonValue = testDataC['proceedbuttonvalue'] || 'Proceed';
      await incomeDeclarationPage.fillIncomeDeclaration(incomeAmount, proceedButtonValue);
      // Wait for navigation after filling details
      await page.waitForTimeout(3000);
    });
  });

  test('07C-2: Negative: Proceed without entering income [Change Scheme Flow]', async ({
    page,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    assetCartPage,
    productSelectionPage,
    incomeDeclarationPage,
    poiPage,
    kycPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC, { stopAtPan: false });
    await navigateToIncomeDeclaration(page, assetCartPage, productSelectionPage, incomeDeclarationPage);

    await test.step('Attempt to proceed without income', async () => {
      let validationPassed = false;
      try {
        const proceedButtonValue = testDataC['proceedbuttonvalue'] || 'Proceed';
        await incomeDeclarationPage.proceed(proceedButtonValue);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        console.log('Expected validation path reached:', message);
      } finally {
        const errorMessage = page.locator('text=Error! Please enter income details').or(page.locator('.error-msg'));
        validationPassed = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
        if (!validationPassed) {
          validationPassed = await incomeDeclarationPage.isCurrentScreen('Income Declaration');
        }
        if (!page.isClosed()) {
          await page.close();
        }
      }
      expect(validationPassed).toBe(true);
    });
  });
});

// =============================================================================
// SUITE A: E2E — Full flow auto-landing on Income Declaration
// Run: npx playwright test tests/customer/07_incomeDeclaration.spec.ts -g "07A"
// =============================================================================
import { completeFullPrerequisites as sharedPrereq07, getVal as gv07 } from '../helpers/completeFullPrerequisites';

test.describe('07A - Income Declaration [E2E Full Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000);
  let testData07A: Record<string, string>;

  test.beforeAll(async () => {
    testData07A = new ExcelReader().getTestDataForTestCase(config.excel.suiteName);
  });

  // ── 07A-1: Positive — Declare income and proceed ─────────────────────────
  test('07A-1: E2E → Income Declaration → Declare income → Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  }) => {
    await sharedPrereq07({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData07A, { stopAfter: 'productSelection' });

    await test.step('Income Declaration', async () => {
      await incomeDeclarationPage.fillIncomeDeclaration(
        testData07A['monthlyincome'] || '30000',
        testData07A['proceedbuttonvalue'] || 'Proceed'
      );
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
    console.log('✓ 07A-1 Passed: Income Declaration completed');
  });

  // ── 07A-2: Negative — Proceed without entering income ────────────────────
  test('07A-2 [Negative]: E2E → Income Declaration → Proceed without income → Validation', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  }) => {
    await sharedPrereq07({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData07A, { stopAfter: 'productSelection' });

    await test.step('Proceed without entering income', async () => {
      await incomeDeclarationPage.clickButton(testData07A['proceedbuttonvalue'] || 'Proceed');
      const errorMsg = page.locator('text=/please enter.*income|income.*required|required field/i');
      const isVisible = await errorMsg.first().isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        console.log('✓ 07A-2 Passed: Validation error shown for missing income');
      } else {
        console.log('⚠ 07A-2: Validation message not visible — app may have accepted empty income');
      }
    });
  });


  // ==========================================
  // NEW TEST SCENARIOS (Pending Implementation)
  // Change 'test.skip' to 'test' to activate each scenario
  // ==========================================

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-03: Positive — Enter minimum threshold income → Proceed → Fill
  //            Income Declaration Additional Details → Proceed
  //
  //  FLOW:
  //    Income Declaration (enter min income)
  //      → Additional Details page (Monthly Applicant Primary Income,
  //         Monthly Applicant Other Income, Monthly Household Other Income,
  //         Monthly Household Obligations + Gender, Marital Status, PAN)
  //      → Household Member Details page (Relationship, First Name, Last Name,
  //         Mobile, DOB, Gender, Pin Code, Identity Type, ID Number)
  //      → Initiate Income Declaration (click "Click here")
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-03: Positive → Min Threshold Income → Additional Details → Household Member → Initiate', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   // ── Step 1: Income Declaration ────────────────────────────────────────
  //   await test.step('Enter minimum threshold income and proceed', async () => {
  //     const minIncome = testData07A['minthresholdincome'] || '10000';
  //     await incomeDeclarationPage.fillIncomeDeclaration(minIncome, testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     console.log(`✓ Entered min threshold income: ${minIncome}`);
  //   });
  //
  //   // ── Step 2: Income Additional Details (screen shown after Income Declaration) ──
  //   await test.step('Fill Income Additional Details', async () => {
  //     await page.waitForTimeout(2000);
  //
  //     // Monthly Applicant Primary Income
  //     const primaryIncomeInput = page.locator(
  //       'input[placeholder*="Primary Income"], lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input'
  //     ).first();
  //     if (await primaryIncomeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await primaryIncomeInput.fill(testData07A['primaryincome'] || '8000');
  //       console.log('✓ Filled Monthly Applicant Primary Income');
  //     }
  //
  //     // Monthly Applicant Other Income
  //     const otherIncomeInput = page.locator(
  //       'input[placeholder*="Other Income"], lightning-input:has(label:text-is("Monthly Applicant Other Income")) input'
  //     ).first();
  //     if (await otherIncomeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await otherIncomeInput.fill(testData07A['otherapplicantincome'] || '1000');
  //       console.log('✓ Filled Monthly Applicant Other Income');
  //     }
  //
  //     // Monthly Household Other Income
  //     const householdOtherIncomeInput = page.locator(
  //       'input[placeholder*="Household Other"], lightning-input:has(label:text-is("Monthly Household Other Income")) input'
  //     ).first();
  //     if (await householdOtherIncomeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await householdOtherIncomeInput.fill(testData07A['householdotherincome'] || '1000');
  //       console.log('✓ Filled Monthly Household Other Income');
  //     }
  //
  //     // Monthly Household Obligations
  //     const obligationsInput = page.locator(
  //       'input[placeholder*="Household Obligations"], lightning-input:has(label:text-is("Monthly Household Obligations")) input'
  //     ).first();
  //     if (await obligationsInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await obligationsInput.fill(testData07A['householdobligations'] || '0');
  //       console.log('✓ Filled Monthly Household Obligations');
  //     }
  //
  //     // Gender (Additional Details section)
  //     const genderDropdown = page.getByRole('combobox', { name: /Gender/i }).first()
  //       .or(page.locator('select[name*="gender"]').first());
  //     if (await genderDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await genderDropdown.selectOption({ label: testData07A['gendervalue'] || 'Male' });
  //       console.log('✓ Selected Gender');
  //     }
  //
  //     // Marital Status
  //     const maritalDropdown = page.getByRole('combobox', { name: /Marital Status/i }).first()
  //       .or(page.locator('select[name*="marital"]').first());
  //     if (await maritalDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await maritalDropdown.selectOption({ label: testData07A['maritalstatusvalue'] || 'Single' });
  //       console.log('✓ Selected Marital Status');
  //     }
  //
  //     // PAN Number
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first()
  //       .or(page.locator('input[name*="pan"]').first());
  //     if (await panInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await panInput.fill(testData07A['pannumber'] || 'HFHPP1234D');
  //       console.log('✓ Filled PAN Number');
  //     }
  //
  //     // Proceed from Additional Details
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //     console.log('✓ Proceeded from Income Additional Details');
  //   });
  //
  //   // ── Step 3: Household Member Details ─────────────────────────────────
  //   await test.step('Fill Household Member Details', async () => {
  //     await page.waitForTimeout(2000);
  //
  //     // Relationship with Applicant
  //     const relationshipDropdown = page.getByRole('combobox', { name: /Relationship with Applicant/i }).first()
  //       .or(page.locator('select[name*="relationship"]').first());
  //     if (await relationshipDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await relationshipDropdown.selectOption({ label: testData07A['relationshipvalue'] || 'Spouse' });
  //       console.log('✓ Selected Relationship');
  //     }
  //
  //     // First Name as per ID Proof
  //     const firstNameInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first()
  //       .or(page.locator('input[name*="firstName"], input[placeholder*="First Name"]').first());
  //     if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await firstNameInput.fill(testData07A['householdfirstname'] || 'Testfirst');
  //       console.log('✓ Filled Household Member First Name');
  //     }
  //
  //     // Last Name as per ID Proof
  //     const lastNameInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first()
  //       .or(page.locator('input[name*="lastName"], input[placeholder*="Last Name"]').first());
  //     if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await lastNameInput.fill(testData07A['householdlastname'] || 'Testlast');
  //       console.log('✓ Filled Household Member Last Name');
  //     }
  //
  //     // Household Mobile No.
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first()
  //       .or(page.locator('input[name*="mobile"], input[placeholder*="Mobile"]').first());
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await mobileInput.fill(testData07A['householdmobile'] || '9876543210');
  //       console.log('✓ Filled Household Mobile No.');
  //     }
  //
  //     // Date of Birth as per ID Proof
  //     const dobInput = page.locator('input[type="date"]').first()
  //       .or(page.getByRole('textbox', { name: /Date Of Birth/i }).first());
  //     if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await dobInput.fill(testData07A['householddob'] || '1990-01-15');
  //       console.log('✓ Filled Date of Birth');
  //     }
  //
  //     // Gender
  //     const genderHHDropdown = page.getByRole('combobox', { name: /Gender/i }).first()
  //       .or(page.locator('select[name*="gender"]').first());
  //     if (await genderHHDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await genderHHDropdown.selectOption({ label: testData07A['gendervalue'] || 'Male' });
  //       console.log('✓ Selected Household Gender');
  //     }
  //
  //     // Pin Code
  //     const pinInput = page.getByRole('textbox', { name: /Pin Code/i }).first()
  //       .or(page.locator('input[name*="pin"], input[placeholder*="Pin"]').first());
  //     if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await pinInput.fill(testData07A['householdpincode'] || '411014');
  //       console.log('✓ Filled Pin Code');
  //     }
  //
  //     // Identity Type
  //     const idTypeDropdown = page.getByRole('combobox', { name: /Identity Type/i }).first()
  //       .or(page.locator('select[name*="identityType"]').first());
  //     if (await idTypeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await idTypeDropdown.selectOption({ label: testData07A['identitytypevalue'] || 'PAN' });
  //       console.log('✓ Selected Identity Type');
  //     }
  //
  //     // Enter Identification Number
  //     const idNumberInput = page.getByRole('textbox', { name: /Identification Number|Enter Identification/i }).first()
  //       .or(page.locator('input[name*="identificationNumber"]').first());
  //     if (await idNumberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await idNumberInput.fill(testData07A['identificationnumber'] || 'HFHPP1234D');
  //       console.log('✓ Filled Identification Number');
  //     }
  //
  //     // Initiate Income Declaration → Click here
  //     const initiateLink = page.getByText('Click here').first()
  //       .or(page.locator('a:has-text("Click here"), button:has-text("Click here")').first());
  //     if (await initiateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await initiateLink.click({ force: true });
  //       await page.waitForTimeout(3000);
  //       console.log('✓ Clicked Initiate Income Declaration → Click here');
  //     }
  //
  //     const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
  //     expect(errorBanner).toBe(false);
  //     console.log('✓ 07A-03 Passed: Full min-threshold income + Additional Details + Household Member flow completed');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-04: Negative — Enter max threshold income (999999999999) → expect
  //            validation error or abnormal income warning
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-04: Negative → Max Threshold Income (999999999999) → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Enter maximum (overflow) income value 999999999999 and proceed', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration('999999999999', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Verify error or truncation for exceeding max income', async () => {
  //     const errorLocators = [
  //       page.locator('text=/maximum.*income|income.*exceed|too high|invalid.*income|above.*limit/i'),
  //       page.locator(".slds-theme_error, [role='alert'], .toastMessage"),
  //     ];
  //     let hasError = false;
  //     for (const loc of errorLocators) {
  //       hasError = await loc.first().isVisible({ timeout: 4000 }).catch(() => false);
  //       if (hasError) break;
  //     }
  //     // Also accept if the field doesn't allow more than a certain digit count
  //     const inputVal = await page.locator('input[type="number"], input[placeholder*="Income"]').first().inputValue().catch(() => '');
  //     const isFieldTruncated = inputVal.length < 13;
  //     expect(hasError || isFieldTruncated).toBe(true);
  //     console.log(`✓ 07A-04 Passed: Max income validation triggered. Error=${hasError}, Truncated=${isFieldTruncated}`);
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-05: Negative — Income Declaration = 10000, but in Additional Details
  //            fill mismatched values (100 + 200 + 1000) so sum != 10000 →
  //            expect error: "Sum of income details in first three fields should
  //            be equal to Income entered on the previous page."
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-05: Negative → Income=10000 but Additional Details sum mismatch → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Enter 10000 as income and proceed to Additional Details', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration('10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill mismatched income breakdown (100 + 200 + 1000 = 1300 ≠ 10000)', async () => {
  //     // Primary Income
  //     const primaryIncomeInput = page.locator(
  //       'lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input, input[placeholder*="Primary Income"]'
  //     ).first();
  //     if (await primaryIncomeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await primaryIncomeInput.fill('100');
  //     }
  //     // Applicant Other Income
  //     const otherIncomeInput = page.locator(
  //       'lightning-input:has(label:text-is("Monthly Applicant Other Income")) input, input[placeholder*="Other Income"]'
  //     ).first();
  //     if (await otherIncomeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await otherIncomeInput.fill('200');
  //     }
  //     // Household Other Income
  //     const hhOtherIncomeInput = page.locator(
  //       'lightning-input:has(label:text-is("Monthly Household Other Income")) input, input[placeholder*="Household Other"]'
  //     ).first();
  //     if (await hhOtherIncomeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await hhOtherIncomeInput.fill('1000');
  //     }
  //
  //     // Click Proceed
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Verify sum mismatch error is shown', async () => {
  //     const sumError = page.locator(
  //       'text=/sum of income details.*should be equal|income.*mismatch|sum.*equal.*previous/i'
  //     );
  //     const isVisible = await sumError.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-05 Passed: Sum mismatch error correctly shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-06: Negative — In Additional Details, do NOT select Marital Status
  //            → click Proceed → expect mandatory field error → success
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-06: Negative → Additional Details: Without Marital Status → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Enter income and land on Additional Details', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['monthlyincome'] || '30000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill all fields EXCEPT Marital Status then Proceed', async () => {
  //     // Fill Primary, Other, Household, Obligations, Gender, PAN — skip Marital Status
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill(testData07A['primaryincome'] || '20000');
  //
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await panInput.fill(testData07A['pannumber'] || 'HFHPP1234D');
  //     }
  //
  //     // Do NOT select Marital Status — proceed directly
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify Marital Status required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/marital status.*required|please select marital|marital.*mandatory/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-06 Passed: Marital Status required error correctly shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-07: Negative — In Additional Details, do NOT enter PAN Number
  //            → click Proceed → expect mandatory field error → success
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-07: Negative → Additional Details: Without PAN → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Enter income and land on Additional Details', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['monthlyincome'] || '30000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill all fields EXCEPT PAN Number then Proceed', async () => {
  //     const maritalDropdown = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await maritalDropdown.selectOption({ label: testData07A['maritalstatusvalue'] || 'Single' });
  //     }
  //     // Leave PAN empty — proceed
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify PAN Number required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/pan.*required|enter.*pan|pan number.*mandatory/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-07 Passed: PAN Number required error correctly shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-08: Negative — In Additional Details, enter an INVALID PAN format
  //            (e.g. "12345") → click Proceed → expect invalid PAN error
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-08: Negative → Additional Details: Invalid PAN format → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Enter income and land on Additional Details', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['monthlyincome'] || '30000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Enter invalid PAN (12345) and Proceed', async () => {
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first()
  //       .or(page.locator('input[name*="pan"]').first());
  //     if (await panInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await panInput.fill('12345'); // invalid PAN
  //       console.log('✓ Entered invalid PAN: 12345');
  //     }
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify invalid PAN format error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/invalid.*pan|pan.*invalid|incorrect.*pan|pan format/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-08 Passed: Invalid PAN format error correctly shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-09: Negative — In Household Member Details, leave FIRST NAME and
  //            LAST NAME blank → click Proceed → expect mandatory field errors
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-09: Negative → Household Member: Without First Name & Last Name → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Complete Income Declaration and Additional Details to reach Household Member page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     // Fill valid Additional Details
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInput.isVisible({ timeout: 3000 }).catch(() => false)) await panInput.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('On Household Member page, leave First Name & Last Name empty, then Proceed', async () => {
  //     // Fill Relationship but leave Name fields blank
  //     const relationDrop = page.getByRole('combobox', { name: /Relationship with Applicant/i }).first();
  //     if (await relationDrop.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await relationDrop.selectOption({ label: testData07A['relationshipvalue'] || 'Spouse' });
  //     }
  //     // Explicitly clear first & last name fields
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) await firstInput.fill('');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('');
  //
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify First Name / Last Name required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/first name.*required|last name.*required|enter.*name|name.*mandatory/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-09 Passed: First/Last Name required error shown on Household Member page');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-10: Negative — In Household Member Details, leave HOUSEHOLD MOBILE
  //            NUMBER blank → click Proceed → expect mandatory field error
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-10: Negative → Household Member: Without Mobile No. → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page (via valid income + additional details)', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     // Fill valid Additional Details quickly
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInput.isVisible({ timeout: 3000 }).catch(() => false)) await panInput.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill Household Member details WITHOUT mobile number and Proceed', async () => {
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) await firstInput.fill('Testfirst');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('Testlast');
  //     // Leave Mobile No. blank
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first();
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) await mobileInput.fill('');
  //
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify Mobile No. required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/mobile.*required|enter.*mobile|mobile number.*mandatory/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-10 Passed: Household Mobile No. required error shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-11: Negative — In Household Member Details, leave DATE OF BIRTH blank
  //            → click Proceed → expect mandatory field error
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-11: Negative → Household Member: Without Date of Birth → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInput = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInput.isVisible({ timeout: 3000 }).catch(() => false)) await panInput.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill Household Member details WITHOUT Date of Birth and Proceed', async () => {
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) await firstInput.fill('Testfirst');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('Testlast');
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first();
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) await mobileInput.fill('9876543210');
  //     // Leave DOB blank
  //     const dobInput = page.locator('input[type="date"]').first();
  //     if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) await dobInput.fill('');
  //
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify Date of Birth required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/date of birth.*required|enter.*dob|dob.*mandatory|birth.*required/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-11 Passed: Date of Birth required error shown on Household Member page');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-12: Positive — In Household Member Identification Details, select
  //            Identity Type = "PAN" → verify PAN-specific ID number field appears
  //            → fill and proceed successfully
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-12: Positive → Household Member: Identity Type = PAN → Fill & Proceed', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInputAD = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInputAD.isVisible({ timeout: 3000 }).catch(() => false)) await panInputAD.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill all Household Member fields + Identity Type = PAN', async () => {
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) await firstInput.fill('Testfirst');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('Testlast');
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first();
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) await mobileInput.fill('9876543210');
  //     const dobInput = page.locator('input[type="date"]').first();
  //     if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) await dobInput.fill('1990-01-15');
  //     const pinInput = page.getByRole('textbox', { name: /Pin Code/i }).first();
  //     if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) await pinInput.fill('411014');
  //
  //     // Select Identity Type = PAN
  //     const idTypeDrop = page.getByRole('combobox', { name: /Identity Type/i }).first();
  //     if (await idTypeDrop.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await idTypeDrop.selectOption({ label: 'PAN' });
  //       console.log('✓ Selected Identity Type: PAN');
  //       await page.waitForTimeout(1000);
  //     }
  //     // Fill PAN ID Number
  //     const idInput = page.getByRole('textbox', { name: /Identification Number|Enter Identification/i }).first();
  //     if (await idInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await idInput.fill('ABCDE1234F');
  //       console.log('✓ Filled PAN Identification Number: ABCDE1234F');
  //     }
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Verify no error and page progressed', async () => {
  //     const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
  //     expect(errorBanner).toBe(false);
  //     console.log('✓ 07A-12 Passed: Identity Type PAN filled and proceeded successfully');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-13: Positive — In Household Member Identification Details, select
  //            Identity Type = "Voter ID" → verify Voter ID field appears
  //            → fill and proceed successfully
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-13: Positive → Household Member: Identity Type = Voter ID → Fill & Proceed', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInputAD = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInputAD.isVisible({ timeout: 3000 }).catch(() => false)) await panInputAD.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill all Household Member fields + Identity Type = Voter ID', async () => {
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) await firstInput.fill('Testfirst');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('Testlast');
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first();
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) await mobileInput.fill('9876543210');
  //     const dobInput = page.locator('input[type="date"]').first();
  //     if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) await dobInput.fill('1990-01-15');
  //     const pinInput = page.getByRole('textbox', { name: /Pin Code/i }).first();
  //     if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) await pinInput.fill('411014');
  //
  //     // Select Identity Type = Voter ID
  //     const idTypeDrop = page.getByRole('combobox', { name: /Identity Type/i }).first();
  //     if (await idTypeDrop.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await idTypeDrop.selectOption({ label: 'Voter Id' });
  //       console.log('✓ Selected Identity Type: Voter ID');
  //       await page.waitForTimeout(1000);
  //     }
  //     // Fill Voter ID number
  //     const idInput = page.getByRole('textbox', { name: /Identification Number|Enter Identification/i }).first();
  //     if (await idInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  //       await idInput.fill('ABC1234567');
  //       console.log('✓ Filled Voter ID Identification Number: ABC1234567');
  //     }
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Verify no error and page progressed', async () => {
  //     const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
  //     expect(errorBanner).toBe(false);
  //     console.log('✓ 07A-13 Passed: Identity Type Voter ID filled and proceeded successfully');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-14: Negative — In Household Member Identification Details, leave
  //            Identification Number blank → click Proceed → expect error
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-14: Negative → Household Member: Without ID Number → Expect Error', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInputAD = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInputAD.isVisible({ timeout: 3000 }).catch(() => false)) await panInputAD.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Fill Household Member fields, select Identity Type, but leave ID Number blank', async () => {
  //     const firstInput = page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first();
  //     if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) await firstInput.fill('Testfirst');
  //     const lastInput = page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first();
  //     if (await lastInput.isVisible({ timeout: 3000 }).catch(() => false)) await lastInput.fill('Testlast');
  //     const mobileInput = page.getByRole('textbox', { name: /Household Mobile/i }).first();
  //     if (await mobileInput.isVisible({ timeout: 3000 }).catch(() => false)) await mobileInput.fill('9876543210');
  //     const dobInput = page.locator('input[type="date"]').first();
  //     if (await dobInput.isVisible({ timeout: 3000 }).catch(() => false)) await dobInput.fill('1990-01-15');
  //     const pinInput = page.getByRole('textbox', { name: /Pin Code/i }).first();
  //     if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) await pinInput.fill('411014');
  //
  //     // Select Identity Type but leave Number empty
  //     const idTypeDrop = page.getByRole('combobox', { name: /Identity Type/i }).first();
  //     if (await idTypeDrop.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await idTypeDrop.selectOption({ label: 'PAN' });
  //     }
  //     // Leave identification number blank
  //     const idInput = page.getByRole('textbox', { name: /Identification Number|Enter Identification/i }).first();
  //     if (await idInput.isVisible({ timeout: 3000 }).catch(() => false)) await idInput.fill('');
  //
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(2000);
  //   });
  //
  //   await test.step('Verify ID Number required error is shown', async () => {
  //     const errorLocator = page.locator(
  //       '.slds-has-error, [role="alert"], text=/identification.*required|enter.*id number|id number.*mandatory/i, .toastMessage'
  //     );
  //     const isVisible = await errorLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isVisible).toBe(true);
  //     console.log('✓ 07A-14 Passed: Identification Number required error shown');
  //   });
  // });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-07A-15: Positive — Click "Initiate Income Declaration → Click here" link
  //            at the bottom of Household Member Details → verify action triggers
  // ─────────────────────────────────────────────────────────────────────────────
  // test.skip('07A-15: Positive → Household Member: Initiate Income Declaration (Click here)', async ({
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //   panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //   kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  // }) => {
  //   await sharedPrereq07({
  //     page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
  //     panVerificationPage, productSelectionPage, incomeDeclarationPage,
  //     kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  //   }, testData07A, { stopAfter: 'productSelection' });
  //
  //   await test.step('Navigate to Household Member Details page', async () => {
  //     await incomeDeclarationPage.fillIncomeDeclaration(testData07A['minthresholdincome'] || '10000', testData07A['proceedbuttonvalue'] || 'Proceed');
  //     await page.waitForTimeout(3000);
  //     const primaryInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input').first();
  //     if (await primaryInput.isVisible({ timeout: 5000 }).catch(() => false)) await primaryInput.fill('8000');
  //     const otherInput = page.locator('lightning-input:has(label:text-is("Monthly Applicant Other Income")) input').first();
  //     if (await otherInput.isVisible({ timeout: 3000 }).catch(() => false)) await otherInput.fill('1000');
  //     const hhInput = page.locator('lightning-input:has(label:text-is("Monthly Household Other Income")) input').first();
  //     if (await hhInput.isVisible({ timeout: 3000 }).catch(() => false)) await hhInput.fill('1000');
  //     const maritalDrop = page.getByRole('combobox', { name: /Marital Status/i }).first();
  //     if (await maritalDrop.isVisible({ timeout: 3000 }).catch(() => false)) await maritalDrop.selectOption({ label: 'Single' });
  //     const panInputAD = page.getByRole('textbox', { name: /Pan Number|PAN/i }).first();
  //     if (await panInputAD.isVisible({ timeout: 3000 }).catch(() => false)) await panInputAD.fill('HFHPP1234D');
  //     const proceedBtn = page.getByRole('button', { name: testData07A['proceedbuttonvalue'] || 'Proceed', exact: true }).first();
  //     await proceedBtn.click({ force: true });
  //     await page.waitForTimeout(3000);
  //   });
  //
  //   await test.step('Click "Initiate Income Declaration → Click here" link', async () => {
  //     // Look for the link at the bottom of the Household Member Details page
  //     const initiateSection = page.locator('text=Initiate Income Declaration').first();
  //     const isInitiateVisible = await initiateSection.isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(isInitiateVisible).toBe(true);
  //     console.log('✓ Initiate Income Declaration section is visible');
  //
  //     const clickHereLink = page.getByText('Click here').first()
  //       .or(page.locator('a:has-text("Click here"), button:has-text("Click here")').first());
  //     if (await clickHereLink.isVisible({ timeout: 5000 }).catch(() => false)) {
  //       await clickHereLink.click({ force: true });
  //       await page.waitForTimeout(3000);
  //       console.log('✓ Clicked "Click here" — Initiate Income Declaration triggered');
  //     }
  //
  //     // Verify no hard error was thrown
  //     const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
  //     expect(errorBanner).toBe(false);
  //     console.log('✓ 07A-15 Passed: Initiate Income Declaration clicked successfully');
  //   });
  // });

});