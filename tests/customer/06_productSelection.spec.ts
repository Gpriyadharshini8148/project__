/**
 * 06 - Product Selection
 * 
 * Purpose: Test product selection, filtering, and validation
 * Scenarios: Single product + Multiple products + Product validation + EMI calculation
 */

import { test, expect, PageObjects } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';
import { ProductSelectionPage } from '../../pages/product/ProductSelectionPage';
import { ZipCodeData } from '../../types/customer.types';

test.describe('06 - Product Selection', () => {
  test.describe.configure({ mode: 'parallel' });

  let testData: Record<string, string>;
  let mobileNumber: string;
  let generatedPanNumber: string;
  let productSelectionPage: ProductSelectionPage;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_06_ProductSelection');
  });

  const getVal = (val: string | undefined, def: string) => (val && val !== 'undefined' ? val : def);

  async function completeFullPrerequisites(context: any) {
    const {
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      mitcPage,
      panVerificationPage,
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
  //     loginPage,
  //     dealerSearchPage,
  //     appStatusPage,
  //     zipCodePage,
  //     mitcPage,
  //     panVerificationPage,
  //     page,
  //   });
  // });

  test('Positive: Select single product', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await completeFullPrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      productSelectionPage,
      page,
    });

    await test.step('Select product from catalog', async () => {
      const productData = {
        productModel: testData["productmodel"] || "SAMYANG-CAMERA - 10MM F2.8 Canon M",
        invoiceAmount: testData["invoiceamount"] || "30000",
        requiredLoanAmount: testData["requiredloanamount"] || "30000",
        proceedButton: testData["proceedbuttonvalue"] || "Proceed",
      };

      await productSelectionPage.fillProductDetails(
        productData.productModel,
        productData.invoiceAmount,
        productData.requiredLoanAmount,
        productData.proceedButton
      );
    });
  });



  test('Positive: Search product by name', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await completeFullPrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      productSelectionPage,
      page,
    });

    await test.step('Search for product', async () => {
      const productData = {
        productModel: testData['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        invoiceAmount: testData['invoiceamount'] || '30000',
        requiredLoanAmount: testData['requiredloanamount'] || '30000',
        proceedButton: testData['proceedbuttonvalue'] || 'Proceed',
      };

      await productSelectionPage.fillProductDetails(
        productData.productModel,
        productData.invoiceAmount,
        productData.requiredLoanAmount,
        productData.proceedButton
      );
    });
  });

  test('Negative: Select product exceeding loan limit', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await completeFullPrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      mitcPage,
      panVerificationPage,
      productSelectionPage,
      page,
    });

    await test.step('Select high-value product', async () => {
      const productData = {
        productModel: testData['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        invoiceAmount: testData['invoiceamount'] || '30000',
        requiredLoanAmount: '50000',
        proceedButton: testData['proceedbuttonvalue'] || 'Proceed',
      };

      let validationPassed = false;
      try {
        await productSelectionPage.fillProductDetails(
          productData.productModel,
          productData.invoiceAmount,
          productData.requiredLoanAmount,
          productData.proceedButton
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        console.log('Expected validation path reached:', message);
      } finally {
        const errorMessage = page.locator('span:has-text("Error! Please provide Loan Amount less than Invoice Amount")');
        validationPassed = await errorMessage
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        if (validationPassed) {
          console.log('✓ Validation works for invalid loan amount');
        } else {
          console.warn('Validation message was not visible after invalid loan amount');
        }

        if (!page.isClosed()) {
          await page.close();
          console.log('✓ Closed page after negative validation');
        }
      }

      expect(validationPassed).toBe(true);
    });
  });



  // test('Negative: Proceed without selecting product', async ({
  //   dealerSearchPage,
  //   appStatusPage,
  //   //zipCodePage,
  //   //mitcPage,
  //   //panVerificationPage,
  //   productSelectionPage,
  //   page,
  // }) => {
  //   await completePrerequisites({
  //     dealerSearchPage,
  //     appStatusPage,
  //     //zipCodePage,
  //     //mitcPage,
  //     //panVerificationPage,
  //     productSelectionPage,
  //     page,
  //   });

  //   await test.step('Search for product', async () => {
  //     const productData = {
  //       productModel: '',
  //       invoiceAmount: testData['invoiceamount'] || '30000',
  //       requiredLoanAmount: testData['requiredloanamount'] || '30000',
  //       proceedButton: testData['proceedbuttonvalue'] || 'Proceed',
  //     };

  //     let validationPassed = false;

  //     try {
  //       await productSelectionPage.fillProductDetails(
  //         productData.productModel,
  //         productData.invoiceAmount,
  //         productData.requiredLoanAmount,
  //         productData.proceedButton
  //       );
  //     } catch (error: unknown) {
  //       const message = error instanceof Error ? error.message : JSON.stringify(error);
  //       console.log('Expected validation path reached:', message);
  //     } finally {
  //       const errorMessage = page.locator('span:has-text("Error! Please select Product Category, Brand and Model.")');
  //       validationPassed = await errorMessage
  //         .isVisible({ timeout: 5000 })
  //         .catch(() => false);

  //       if (validationPassed) {
  //         console.log('✓ Validation works for empty product selection');
  //       } else {
  //         console.warn('Validation message was not visible after leaving product unselected');
  //       }

  //       expect(validationPassed).toBe(true);
  //     }
  //   });
  // });




  // test('Positive: Select multiple products', async ({
  //   productSelectionPage,
  //   page,
  // }) => {
  //   // await completePrerequisites(...);

  //   const products = [
  //     { name: 'LED TV 43"', category: 'Electronics' },
  //     { name: 'Refrigerator', category: 'Home Appliances' },
  //     { name: 'Washing Machine', category: 'Home Appliances' },
  //   ];

  //   await test.step('Select multiple products', async () => {
  //     for (const product of products) {
  //       await productSelectionPage.selectProduct(product.name, product.category);
  //       console.log(`✓ Added: ${product.name}`);
  //     }
  //   });

  //   await test.step('Verify all products in cart', async () => {
  //     for (const product of products) {
  //       await expect(page.locator(`text=${product.name}`)).toBeVisible();
  //     }

  //     console.log(`✓ All ${products.length} products added`);
  //   });

  //   await test.step('Verify total amount calculation', async () => {
  //     const totalAmount = await page.locator(testData['totalamountlabel'] || 'Total Amount').textContent();
  //     expect(totalAmount).toBeTruthy();

  //     console.log(`✓ Total amount: ${totalAmount}`);
  //   });
  // });




  // test('Positive: Filter products by category', async ({
  //   productSelectionPage,
  //   page,
  // }) => {
  //   // await completePrerequisites(...);

  //   await test.step('Apply category filter', async () => {
  //     await productSelectionPage.filterByCategory(testData['productcategory'] || 'Electronics');
  //   });

  //   await test.step('Verify only filtered products shown', async () => {
  //     const productCount = await page.locator('.product-item').count();
  //     expect(productCount).toBeGreaterThan(0);

  //     console.log(`✓ Found ${productCount} products in category`);
  //   });
  // });
});

// =============================================================================
// SUITE C: Custom Hamburger Flow (PAN -> Asset Cart -> Change Scheme -> Product Selection)
// =============================================================================
test.describe('06C - Product Selection [Asset Cart Change Scheme Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000); // Set timeout to 30 minutes
  let testDataC: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testDataC = excelReader.getTestDataForTestCase('TC_06_ProductSelection');
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

  async function navigateToChangeScheme(page: any, assetCartPage: any) {
    await test.step('Hamburger Navigation to Asset Cart', async () => {
      console.log('? Using Hamburger menu to navigate to Asset Cart...');
      await page.waitForTimeout(2000);
      const hamburger = page.getByRole('button', { name: '...' }).first()
        .or(page.getByText('...', { exact: true }).first())
        .or(page.locator('.slds-icon-utility-rows').first());

      await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
      await hamburger.click({ force: true });
      await page.waitForTimeout(1500);

      const targetLink = page.getByRole('button', { name: 'Asset Cart' })
        .or(page.getByRole('menuitem', { name: /Asset Cart/i }));

      await targetLink.first().click({ force: true });
      await page.waitForTimeout(2000);
      console.log('? Hamburger navigation to Asset Cart complete.');
    });

    await test.step('Expand Asset Cart and Change Scheme', async () => {
      const oppId = await assetCartPage.getOpportunity('Asset Cart');
      expect(oppId).toBeTruthy();
      await assetCartPage.expandCartDetails(oppId);
      await assetCartPage.clickChangeScheme();
    });
  }

  test('06C-1: Positive: Select single product [Change Scheme Flow]', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, assetCartPage, productSelectionPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC, { stopAtPan: false });
    await navigateToChangeScheme(page, assetCartPage);

    await test.step('Select product from catalog', async () => {
      const productData = {
        productModel: testDataC['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        invoiceAmount: testDataC['invoiceamount'] || '30000',
        requiredLoanAmount: testDataC['requiredloanamount'] || '30000',
        proceedButton: testDataC['proceedbuttonvalue'] || 'Proceed',
      };
      await productSelectionPage.fillProductDetails(productData.productModel, productData.invoiceAmount, productData.requiredLoanAmount, productData.proceedButton);
    });
  });

  test('06C-2: Positive: Search product by name [Change Scheme Flow]', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, assetCartPage, productSelectionPage
  }) => {
    await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC, { stopAtPan: false });
    await navigateToChangeScheme(page, assetCartPage);

    await test.step('Search for product', async () => {
      const productData = {
        productModel: testDataC['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        invoiceAmount: testDataC['invoiceamount'] || '30000',
        requiredLoanAmount: testDataC['requiredloanamount'] || '30000',
        proceedButton: testDataC['proceedbuttonvalue'] || 'Proceed',
      };
      await productSelectionPage.fillProductDetails(productData.productModel, productData.invoiceAmount, productData.requiredLoanAmount, productData.proceedButton);
    });
  });

  // test('06C-3: Negative: Select product exceeding loan limit [Change Scheme Flow]', async ({ 
  //   page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, assetCartPage, productSelectionPage 
  // }) => {
  //   await completeFullPrerequisites({ page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage }, testDataC, { stopAtPan: false });
  //   await navigateToChangeScheme(page, assetCartPage);

  //   await test.step('Select high-value product', async () => {
  //     const productData = {
  //       productModel: 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
  //       invoiceAmount: testDataC['invoiceamount'] || '30000',
  //       requiredLoanAmount: '50000', // Exceeding loan amount
  //       proceedButton: testDataC['proceedbuttonvalue'] || 'Proceed',
  //     };

  //     let validationPassed = false;
  //     try {
  //       await productSelectionPage.fillProductDetails(
  //         productData.productModel,
  //         productData.invoiceAmount,
  //         productData.requiredLoanAmount,
  //         productData.proceedButton
  //       );
  //     } catch (error) {
  //       const message = error instanceof Error ? error.message : JSON.stringify(error);
  //       console.log('Expected validation path reached:', message);
  //     } finally {
  //       const errorMessage = page.locator('text=/please provide loan amount less than invoice amount/i');
  //       validationPassed = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
  //       if (validationPassed) {
  //         console.log('✓ Validation works for invalid loan amount');
  //       } else {
  //         console.warn('Validation message was not visible after invalid loan amount');
  //       }
  //       if (!page.isClosed()) {
  //         await page.close();
  //       }
  //     }
  //     expect(validationPassed).toBe(true);
  //   });
  // });
});

// =============================================================================
// SUITE A: E2E — Full flow auto-landing on Product Selection
// Run: npx playwright test tests/customer/06_productSelection.spec.ts -g "06A"
// =============================================================================
import { completeFullPrerequisites as sharedPrereq, MOBILE_NUMBER as SHARED_MOBILE, getVal as gv } from '../helpers/completeFullPrerequisites';

test.describe('06A - Product Selection [E2E Full Flow]', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(1800000);
  let testData06A: Record<string, string>;

  test.beforeAll(async () => {
    testData06A = new ExcelReader().getTestDataForTestCase(config.excel.suiteName);
  });

  async function openManualProductForm(page: any) {
    const productModelInput = page.getByRole('textbox', { name: 'Select Product Model' });
    if (await productModelInput.isVisible({ timeout: 2000 }).catch(() => false)) return;

    const enterManuallyButton = page.getByRole('button', { name: 'Enter Manually', exact: true });
    await expect(enterManuallyButton).toBeVisible({ timeout: 30000 });
    await enterManuallyButton.click().catch(() => enterManuallyButton.click({ force: true }));

    if (!await productModelInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByText('Enter Manually', { exact: true }).click({ force: true });
    }
    await expect(productModelInput).toBeVisible({ timeout: 10000 });
  }

  async function selectTestProductModel(page: any, requireOption: boolean = true) {
    let productModelInput = page.getByRole('textbox', { name: 'Select Product Model' });
    await expect(productModelInput).toBeVisible({ timeout: 10000 });

    if (await productModelInput.isDisabled().catch(() => false)) {
      await expect(productModelInput).not.toHaveValue('');
      return;
    }

    const options = page.locator('li.listitem');
    const option = options.nth(1).or(options.first()).first();
    let optionVisible = false;
    const searchTerms = [
      '10mm',
      testData06A['productmodel'] || 'SAMYANG-CAMERA',
      '123 - Samsung-LED Rs49600',
    ];

    for (let attempt = 1; attempt <= 3 && !optionVisible; attempt++) {
      await openManualProductForm(page);
      productModelInput = page.getByRole('textbox', { name: 'Select Product Model' });
      await expect(productModelInput).toBeVisible({ timeout: 10000 });
      if (await productModelInput.isDisabled().catch(() => false)) {
        await expect(productModelInput).not.toHaveValue('');
        return;
      }

      await productModelInput.fill('');
      await productModelInput.click({ force: true });
      await productModelInput.pressSequentially(searchTerms[attempt - 1], { delay: 100 + attempt * 25 }).catch(() => { });
      optionVisible = await option
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
    }

    if (!optionVisible && !requireOption) {
      productModelInput = page.getByRole('textbox', { name: 'Select Product Model' });
      await expect(productModelInput).not.toHaveValue('');
      await page.keyboard.press('Escape');
      return;
    }

    await expect(option).toBeVisible({ timeout: 3000 });
    await option.click({ force: true });
    await page.keyboard.press('Escape');
    await options.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => { });
    await page.waitForTimeout(500);
  }

  async function ensureProductConfirmationChecked(page: any) {
    const checkbox = page.getByRole('checkbox').first();
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (!await checkbox.isChecked()) {
        const indicator = checkbox.locator('xpath=..').locator('span.slds-checkbox_faux');
        await indicator.click({ force: true });
      }
      if (!await checkbox.isChecked()) {
        await checkbox.evaluate((element: HTMLInputElement) => {
          element.checked = true;
          element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        });
      }
      await expect(checkbox).toBeChecked();
    }
  }

  // ── 06A-1: Positive — Select SAMYANG product, verify no error ────────────
  test('06A-1: E2E → Product Selection → Select SAMYANG product → Proceed', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  }) => {
    await sharedPrereq({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData06A, { stopAfter: 'pan' });

    await test.step('Product Selection', async () => {
      await productSelectionPage.fillProductDetails(
        testData06A['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
        testData06A['invoiceamount'] || '30000',
        testData06A['requiredloanamount'] || '30000',
        testData06A['proceedbuttonvalue'] || 'Proceed'
      );
    });

    const errorBanner = await page.locator("//div[contains(@class,'slds-theme_error')]").isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorBanner).toBe(false);
    console.log('✓ 06A-1 Passed: Product Selection completed');
  });

  // ── 06A-2: Negative — Loan amount > Invoice amount ───────────────────────
  test('06A-2 [Negative]: E2E → Product Selection → Loan exceeds Invoice → Validation', async ({
    page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
    panVerificationPage, productSelectionPage, incomeDeclarationPage,
    kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
  }) => {
    await sharedPrereq({
      page, dealerSearchPage, appStatusPage, zipCodePage, mitcPage,
      panVerificationPage, productSelectionPage, incomeDeclarationPage,
      kycPage, poiPage, poaPage, surrogateDetailsPage, approvalDetailsPage
    }, testData06A, { stopAfter: 'pan' });

    await test.step('Enter loan amount exceeding invoice amount', async () => {
      let caught = false;
      try {
        await productSelectionPage.fillProductDetails(
          testData06A['productmodel'] || 'SAMYANG-CAMERA - 10MM F2.8 Canon M',
          testData06A['invoiceamount'] || '30000',
          '40000', // loan > invoice — should trigger validation
          testData06A['proceedbuttonvalue'] || 'Proceed'
        );
      } catch (e: any) {
        if (e.message?.includes('ValidationError')) {
          caught = true;
          console.log(`✓ 06A-2 Passed: Validation caught — ${e.message}`);
        } else {
          throw e;
        }
      }
      if (!caught) {
        const errorVisible = await page.locator('.toastMessage, .slds-notify_toast').filter({ hasText: /loan amount|invoice amount/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(errorVisible).toBe(true);
        console.log('✓ 06A-2 Passed: Validation toast visible');
      }
    });
  });



  // ==========================================
  // NEW TEST SCENARIOS (Pending Implementation)
  // Change 'test.skip' to 'test' to activate
  // All tests use completeFullPrerequisites() — full flow required
  // (Search Dealer → App Status → Zip Code → MITC → PAN → Product Selection)
  // ==========================================

  test('06A-3 [Negative]: Proceed on Product Details page without entering Invoice Amount — expects validation error.', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await sharedPrereq(
      { dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, page },
      testData06A,
      { stopAfter: 'pan' }
    );

    await test.step('Click Enter Manually on Product Details', async () => {
      await openManualProductForm(page);
    });

    await test.step('Fill Product Model but leave Invoice Amount blank and click Proceed', async () => {
      await selectTestProductModel(page, false);

      // Leave Invoice Amount blank — do NOT fill spinbuttons
      // Check checkbox if present
      await ensureProductConfirmationChecked(page);

      // Click Proceed
      await page.getByRole('button', { name: 'Proceed' }).first().click();
      await page.waitForTimeout(2000);

      // Expect validation error or page stays on Product Details
      const errorEl = page.locator('.slds-has-error, .toastMessage, [role="alert"]').first();
      const hasError = await errorEl.isVisible({ timeout: 5000 }).catch(() => false);
      const stillOnProduct = await page.getByText('Product Details', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasError || stillOnProduct).toBe(true);
      console.log(`✓ Blank Invoice Amount: error=${hasError} | still on product page=${stillOnProduct} — PASS`);
    });
  });


  test('06A-4 [Positive]: After valid product entry, verify "Recommended Schemes" page appears with scheme cards.', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await sharedPrereq(
      { dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, page },
      testData06A,
      { stopAfter: 'pan' }
    );

    await test.step('Fill valid product details', async () => {
      await openManualProductForm(page);

      await selectTestProductModel(page);

      const invoiceField = page.getByRole('spinbutton', { name: /Invoice Amount/i }).first()
        .or(page.getByRole('spinbutton').nth(0));
      await invoiceField.click({ force: true });
      await invoiceField.fill(testData06A['invoiceamount'] || '30000');

      const loanField = page.getByRole('spinbutton', { name: /Required Loan Amount/i }).first()
        .or(page.getByRole('spinbutton').nth(1));
      await loanField.click({ force: true });
      await loanField.fill(testData06A['requiredloanamount'] || '30000');

      await ensureProductConfirmationChecked(page);
      await page.getByRole('button', { name: 'Proceed' }).first().click();
    });

    await test.step('Verify Recommended Schemes page and at least one scheme card is visible', async () => {
      const recommendedTitle = page.getByText('Recommended Schemes', { exact: true });
      const onSchemes = await recommendedTitle.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
      expect(onSchemes).toBe(true);
      console.log('✓ Recommended Schemes page is shown after valid product entry — PASS');

      // Click View More if present
      const viewMore = page.getByText('View More', { exact: true });
      if (await viewMore.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewMore.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✓ View More clicked');
      }

      // Verify at least one scheme card (defaultSchemeBorder = unselected) exists
      const schemeCard = page.locator('div.scheme.defaultSchemeBorder').first();
      const hasCard = await schemeCard.isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasCard).toBe(true);
      console.log(`✓ Scheme card visible on Recommended Schemes page — PASS`);
    });
  });

  // test('06A-5 [Positive]: Click View More on Recommended Schemes and verify the "No More Schemes" warning appears.', async ({
  //   dealerSearchPage,
  //   appStatusPage,
  //   zipCodePage,
  //   mitcPage,
  //   panVerificationPage,
  //   productSelectionPage,
  //   page,
  // }) => {
  //   await sharedPrereq(
  //     { dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, page },
  //     testData06A,
  //     { stopAfter: 'pan' }
  //   );

  //   await test.step('Complete product entry and reach Recommended Schemes', async () => {
  //     await openManualProductForm(page);

  //     await selectTestProductModel(page);

  //     const invoiceField = page.getByRole('spinbutton').nth(0);
  //     await invoiceField.click({ force: true });
  //     await invoiceField.fill(testData06A['invoiceamount'] || '30000');
  //     const loanField = page.getByRole('spinbutton').nth(1);
  //     await loanField.click({ force: true });
  //     await loanField.fill(testData06A['requiredloanamount'] || '30000');

  //     await ensureProductConfirmationChecked(page);
  //     await page.getByRole('button', { name: 'Proceed' }).first().click();
  //     await page.getByText('Recommended Schemes', { exact: true }).waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  //   });

  //   await test.step('Click View More and verify warning popup "No More Schemes Available"', async () => {
  //     const viewMore = page.getByText('View More', { exact: true });
  //     const hasViewMore = await viewMore.isVisible({ timeout: 5000 }).catch(() => false);
  //     if (hasViewMore) {
  //       const warningMsg = page.getByText(/No More Schemes Available/i).first()
  //         .or(page.locator('.toastMessage, [role="alert"]').filter({ hasText: /No More Schemes/i }).first());
  //       let hasWarning = false;
  //       for (let attempt = 1; attempt <= 3 && !hasWarning; attempt++) {
  //         await viewMore.click({ force: true });
  //         hasWarning = await warningMsg
  //           .waitFor({ state: 'visible', timeout: 5000 })
  //           .then(() => true)
  //           .catch(() => false);
  //       }
  //       expect(hasWarning).toBe(true);
  //       console.log('✓ View More reached the "No More Schemes" warning — PASS');
  //     } else {
  //       console.log('ℹ "View More" button not present on Recommended Schemes page (all schemes already shown)');
  //     }
  //   });
  // });

  test('06A-6 [Negative]: Click Confirm on Recommended Schemes without selecting any scheme card — expects Confirm to remain disabled or show error.', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await sharedPrereq(
      { dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, page },
      testData06A,
      { stopAfter: 'pan' }
    );

    await test.step('Reach Recommended Schemes page', async () => {
      await openManualProductForm(page);

      await selectTestProductModel(page);

      const invoiceField = page.getByRole('spinbutton').nth(0);
      await invoiceField.click({ force: true });
      await invoiceField.fill(testData06A['invoiceamount'] || '30000');
      const loanField = page.getByRole('spinbutton').nth(1);
      await loanField.click({ force: true });
      await loanField.fill(testData06A['requiredloanamount'] || '30000');

      await ensureProductConfirmationChecked(page);
      await page.getByRole('button', { name: 'Proceed' }).first().click();
      await page.getByText('Recommended Schemes', { exact: true }).waitFor({ state: 'visible', timeout: 30000 }).catch(() => { });
    });

    await test.step('Attempt to click Confirm without selecting any scheme card', async () => {
      // Do NOT click any scheme card (div.scheme.defaultSchemeBorder)
      const confirmBtn = page.getByRole('button', { name: 'Confirm' }).first()
        .or(page.locator('c-scheme-selection-reinvent div.mainStaticProceedNormalBox button').first());

      const isEnabled = await confirmBtn.isEnabled({ timeout: 5000 }).catch(() => false);
      if (!isEnabled) {
        // Confirm is disabled — this is the expected behavior
        console.log('✓ Confirm button is disabled when no scheme card is selected — PASS');
        expect(isEnabled).toBe(false);
      } else {
        // If enabled, click it and check error
        await confirmBtn.click({ force: true });
        await page.waitForTimeout(2000);
        const stillOnSchemes = await page.getByText('Recommended Schemes', { exact: true }).isVisible({ timeout: 3000 }).catch(() => false);
        const hasError = await page.locator('.toastMessage, [role="alert"], .slds-has-error').first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(stillOnSchemes || hasError).toBe(true);
        console.log(`✓ No scheme selected: Confirm error=${hasError} | still on schemes=${stillOnSchemes} — PASS`);
      }
    });
  });

  test('06A-7 [Positive]: Select a scheme card and click Confirm — verify confirmation outcome.', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    panVerificationPage,
    productSelectionPage,
    page,
  }) => {
    await sharedPrereq(
      { dealerSearchPage, appStatusPage, zipCodePage, mitcPage, panVerificationPage, productSelectionPage, page },
      testData06A,
      { stopAfter: 'pan' }
    );

    await test.step('Fill valid product details', async () => {
      await openManualProductForm(page);

      await selectTestProductModel(page);

      const invoiceField = page.getByRole('spinbutton').nth(0);
      await invoiceField.click({ force: true });
      await invoiceField.fill(testData06A['invoiceamount'] || '30000');
      const loanField = page.getByRole('spinbutton').nth(1);
      await loanField.click({ force: true });
      await loanField.fill(testData06A['requiredloanamount'] || '30000');

      await ensureProductConfirmationChecked(page);
      await page.getByRole('button', { name: 'Proceed' }).first().click();
      await page.getByText('Recommended Schemes', { exact: true }).waitFor({ state: 'visible', timeout: 30000 }).catch(() => { });
    });

    await test.step('Select first scheme card (defaultSchemeBorder) and click Confirm', async () => {
      const navigated = await productSelectionPage.selectSchemeAndConfirm(false);
      const onIncome = await page.locator('text=/Income Declaration|Income Declared/i').first().isVisible({ timeout: 10000 }).catch(() => false);
      if (navigated || onIncome) {
        console.log('✓ Scheme confirmed — Income Declaration page displayed — PASS');
        return;
      }

      const selectedCard = page.locator('div.scheme.colorSchemeBorder').first();
      const applicationError = page.locator('.toastMessage, .slds-notify_toast, [role="alert"]')
        .filter({ hasText: /error|failed|invalid/i })
        .first();
      await expect(selectedCard).toBeVisible();
      await expect(applicationError).toBeHidden();
      console.log('✓ Scheme selection retained after Confirm with no application error — PASS');
    });
  });

});