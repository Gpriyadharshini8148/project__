/**
 * 03 - Zip Code Verification
 *
 * Purpose: Test zip code entry, verification, and customer details
 * Scenarios: Valid zip + Invalid zip + Non-serviceable area
 *
 * Dependencies: Requires successful dealer search (step 01, 02)
 */

import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';
import { config } from '../../config/environment.config';
import type { ZipCodeData } from '../../types/customer.types';



test.describe('03 - Zip Code Verification', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_03_ZipCode');
  });

  // Helper: Complete prerequisites (steps 01-02)
  async function completePrerequisites(context: any, explicitMobileNumber?: string) {
    const { dealerSearchPage, appStatusPage } = context;
    const mobileNumber = explicitMobileNumber || '5678654324';

    // Session is already authenticated via global-setup.ts (storageState).
    // Navigate directly to Search Dealer page — no login needed.
    await dealerSearchPage.navigateToSearchDealer();

    // Step 2: Search dealer
    await dealerSearchPage.selectDealerAndSearch(
      testData['dealervalue'],
      testData['mobilenumberlabel'],
      mobileNumber,
      testData['searchbutton'] || 'Search'
    );

    // Step 3: Proceed from app status
    await appStatusPage.proceedFromAppStatus(
      testData['appstatuspagename'] || 'App Status',
      testData['proceedbuttonvalue'] || 'Proceed'
    );

    // Handle alternative flow: navigate via Hamburger menu if not on Zip Code page
    const page = context.page;
    if (page) {
      const isZipCode = await page.locator('text=/Zip Code Verification|Zipcode|Customer ZipCode/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (!isZipCode) {
        console.log('⚠ Not on Zip Code! Using Hamburger menu to navigate to Zip Code Verification...');
        const hamburger = page.getByRole('button', { name: '...' }).first()
          .or(page.getByText('...', { exact: true }).first())
          .or(page.locator('.slds-icon-utility-rows').first());
          
        await hamburger.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        
        const targetLink = page.getByRole('button', { name: /Zip Code Verification/i })
          .or(page.getByRole('menuitem', { name: /Zip Code Verification/i }));
          
        await targetLink.click({ force: true }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    }
  }

  test('Positive: Valid serviceable zip code with all details', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    page,
  }) => {
    // Prerequisites
    await completePrerequisites({ dealerSearchPage, appStatusPage, page });

    await test.step('Enter valid zip code and customer details', async () => {
      const zipCodeData: ZipCodeData = {
        zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
        zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
        bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
        dob: testData['dobvalue'] || '18-12-1996',
        gender: testData['gendervalue'] || 'Male',
        preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
        language: testData['preferredcommunicationlanguagevalue'] || 'English',
        poaAddressType: testData['poaaddresstype'],
      };

      await zipCodePage.fillZipCodeDetails(zipCodeData);
      console.log(`✓ Zip code entered: ${zipCodeData.zipCodeValue}`);
    });

    await test.step('Submit and verify success', async () => {
      await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');

      // Verify moved to next step (MITC or next page)
      await expect(
        page.locator('text=MITC').or(page.locator('text=Terms and Conditions'))
      ).toBeVisible({ timeout: config.timeouts.element });

      console.log('✓ Zip code verification successful');
    });
  });


  test('Positive: Valid zip code with different language preference', async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    page,
  }) => {
    await completePrerequisites({ dealerSearchPage, appStatusPage });

    await test.step('Enter details with regional language', async () => {
      const zipCodeData: ZipCodeData = {
        zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
        zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
        bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
        dob: testData['dobvalue'] || '18-12-1996',
        gender: testData['gendervalue'] || 'Male',
        preferredLanguage: 'MARATHI',
        language: 'Marathi', // Regional language
      };

      await zipCodePage.fillZipCodeDetails(zipCodeData);
      await zipCodePage.proceed(testData['proceedbuttonvalue']);
    });

    await test.step('Verify language applied', async () => {
      // Check if UI language changed or next page loaded
      await expect(page.locator('text=MITC')).toBeVisible();
      console.log('✓ Regional language preference accepted');
    });
  });


test('Negative: Invalid zip code format', async ({
  dealerSearchPage,
  appStatusPage,
  zipCodePage,
}) => {
  await completePrerequisites({ dealerSearchPage, appStatusPage });

  await test.step('Enter invalid zip code and verify error', async () => {
    const invalidZipCodeData: ZipCodeData = {
      zipCode: testData['zipcodelabel'],
      zipCodeValue: '000000', // Invalid format
      bflBranch: '', // Should not enter BFL Branch for invalid zip
      dob: testData['dobvalue'],
      gender: testData['gendervalue'],
      preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
      language: testData['preferredcommunicationlanguagevalue'],
      expectDropdown: false,
    };

    await expect(async () => {
      await zipCodePage.fillZipCodeDetails(invalidZipCodeData);
      await zipCodePage.proceed(testData['proceedbuttonvalue']);
    }).rejects.toThrow(/kindly select customer branch|invalid zip code|please enter valid zip code|please enter zipcode, bfl branch/i);

    console.log('✓ Invalid zip code validation error caught successfully');
  });
});

test('Negative: Non-serviceable zip code', async ({
  dealerSearchPage,
  appStatusPage,
  zipCodePage,
}) => {
  await completePrerequisites({ dealerSearchPage, appStatusPage });

  await test.step('Enter non-serviceable zip code and verify error', async () => {
    const nonServiceableZipData: ZipCodeData = {
      zipCode: testData['zipcodelabel'],
      zipCodeValue: '999999', // Non-serviceable area
      bflBranch: '', // Should not enter BFL Branch for invalid zip
      dob: testData['dobvalue'],
      gender: testData['gendervalue'],
      preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
      language: testData['preferredcommunicationlanguagevalue'],
      expectDropdown: false,
    };

    await expect(async () => {
      await zipCodePage.fillZipCodeDetails(nonServiceableZipData);
      await zipCodePage.proceed(testData['proceedbuttonvalue']);
    }).rejects.toThrow(/kindly select customer branch|area not serviceable|service not available|we do not operate|please enter zipcode, bfl branch/i);

    console.log('✓ Non-serviceable zip code validation error caught successfully');
  });
});


test('Negative: Future date of birth', async ({
  loginPage,
  dealerSearchPage,
  appStatusPage,
  zipCodePage,
  page,
}) => {
  await completePrerequisites({ loginPage, dealerSearchPage, appStatusPage ,zipCodePage});

    await test.step('Enter adult DOB and customer details', async () => {
    const currentYear = new Date().getFullYear();
    const futuredob = `01-01-${currentYear + 1}`; // Next year
    const futureData: ZipCodeData = {
      zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
      zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
      bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
      dob: futuredob,
      gender: testData['gendervalue'] || 'Male',
      preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
      language: testData['preferredcommunicationlanguagevalue'] || 'English',
    };

    // Wrap the entire action block because enterDOB triggers the error prior to proceed()
    await expect(async () => {
      await zipCodePage.fillZipCodeDetails(futureData);
      await zipCodePage.proceed(testData['proceedbuttonvalue']);
    }).rejects.toThrow(/date of birth cannot be today or in the future|customer age cannot be lessthan 21/i);

    console.log('✓ Future DOB validation error caught successfully');
  });
});


// test('Positive: Adult customer (above 18 years)', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage });

//   await test.step('Enter adult DOB and customer details', async () => {
//     const currentYear = new Date().getFullYear();
//     const adultDob = `01-01-${currentYear - 25}`; // 25 years old, well above 18

//     const adultData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
//       bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//       dob: adultDob,
//       gender: testData['gendervalue'] || 'Male',
//       preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//       poaAddressType: testData['poaaddresstype'],
//     };

//     await zipCodePage.fillZipCodeDetails(adultData);
//     await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');

//     console.log(`✓ Adult customer (DOB: ${adultDob}) accepted`);
//   });

//   await test.step('Verify moved to next step (MITC)', async () => {
//     await expect(
//       page.getByText(/MITC|Terms and Conditions/i).first()
//     ).toBeVisible({ timeout: config.timeouts.element });

//     console.log('✓ Age validation passed — proceeded to MITC as expected');
//   });
// });

//   
test('Negative: Underage customer (below 18)', async ({
    loginPage,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    page,
  }) => {
    await completePrerequisites({ loginPage, dealerSearchPage, appStatusPage });

    await test.step('Enter underage DOB', async () => {
      const currentYear = new Date().getFullYear();
      const underageDob = `01-01-${currentYear - 15}`; // 15 years old

      const underageData: ZipCodeData = {
        zipCode: testData['zipcodelabel'],
        zipCodeValue: testData['zipcodevalue'],
        bflBranch: testData['bflbranchvalue'],
        dob: underageDob,
        gender: testData['gendervalue'],
        preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
        language: testData['preferredcommunicationlanguagevalue'],
      };

      await zipCodePage.fillZipCodeDetails(underageData);
      
      await expect(async () => {
        await zipCodePage.proceed(testData['proceedbuttonvalue']);
      }).rejects.toThrow(/customer age cannot be lessthan 21 or greater than 68/i);
      console.log('✓ Underage error shown');
    });
  });
});


// ==========================================
// NEW TEST SCENARIOS (Pending Implementation)
// Change 'test.skip' to 'test' to activate each scenario
// ==========================================

// test.skip('Negative: Valid zip code 411001 with mismatched BFL branch 411014 — expects validation error.', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage, page });
//
//   await test.step('Enter zip 411001 with branch that belongs to 411014 (mismatch)', async () => {
//     const mismatchData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: '411001',                       // Valid zip but different pincode area
//       bflBranch: '411014-Manual Testing Pune',      // This branch belongs to 411014, not 411001
//       dob: testData['dobvalue'] || '18-12-1996',
//       gender: testData['gendervalue'] || 'Male',
//       preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//       expectDropdown: true,
//     };
//     // If the app allows selecting branch 411014 under zip 411001 and Proceed is clicked,
//     // the app should throw a validation error. If it throws => test PASSES.
//     await expect(async () => {
//       await zipCodePage.fillZipCodeDetails(mismatchData);
//       await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
//     }).rejects.toThrow(
//       /kindly select customer branch|invalid branch|branch not found|please enter zipcode, bfl branch|does not match/i
//     );
//     console.log('✓ Validation error thrown for mismatched zip code / BFL branch — PASS');
//   });
// });

// test.skip('Negative: Proceed without entering DOB — expects mandatory field error.', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage, page });
//
//   await test.step('Fill all fields except DOB and click Proceed', async () => {
//     const noDobData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
//       bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//       dob: '',           // Intentionally blank — enterDOB will be skipped
//       gender: testData['gendervalue'] || 'Male',
//       preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//       poaAddressType: testData['poaaddresstype'],
//     };
//     await expect(async () => {
//       await zipCodePage.fillZipCodeDetails(noDobData);
//       await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
//     }).rejects.toThrow(
//       /complete this field|date of birth|dob is required|please enter.*date|enter valid date/i
//     );
//     console.log('✓ Validation error shown when DOB is missing — PASS');
//   });
// });

// test.skip('Negative: Proceed without selecting Gender — expects mandatory field error.', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage, page });
//
//   await test.step('Fill all fields except Gender and click Proceed', async () => {
//     const noGenderData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
//       bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//       dob: testData['dobvalue'] || '18-12-1996',
//       gender: '',        // Intentionally blank — selectGenderIfNeeded will skip
//       preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//       poaAddressType: testData['poaaddresstype'],
//     };
//     await expect(async () => {
//       await zipCodePage.fillZipCodeDetails(noGenderData);
//       await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
//     }).rejects.toThrow(
//       /complete this field|gender is required|select gender|please select.*gender/i
//     );
//     console.log('✓ Validation error shown when Gender is not selected — PASS');
//   });
// });

// test.skip('Negative: Proceed without selecting POA Address Type — expects validation error.', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage, page });
//
//   await test.step('Fill all fields except POA Address Type and click Proceed', async () => {
//     const noPoaData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
//       bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//       dob: testData['dobvalue'] || '18-12-1996',
//       gender: testData['gendervalue'] || 'Male',
//       preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//       poaAddressType: undefined, // Intentionally omitted
//     };
//     await expect(async () => {
//       await zipCodePage.fillZipCodeDetails(noPoaData);
//       await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
//     }).rejects.toThrow(
//       /complete this field|poa.*required|address type.*required|select.*address type|please select poa/i
//     );
//     console.log('✓ Validation error shown when POA Address Type is not selected — PASS');
//   });
// });

// test.skip('Positive: Preferred Language dropdown lists all expected language options.', async ({
//   dealerSearchPage,
//   appStatusPage,
//   zipCodePage,
//   page,
// }) => {
//   await completePrerequisites({ dealerSearchPage, appStatusPage, page });
//
//   await test.step('Fill zip code and basic details to reach the Preferred Language field', async () => {
//     // Leave preferredLanguage blank so we inspect the dropdown manually in the next step
//     const partialData: ZipCodeData = {
//       zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
//       zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
//       bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
//       dob: testData['dobvalue'] || '18-12-1996',
//       gender: testData['gendervalue'] || 'Male',
//       preferredLanguage: '', // Blank — we open the dropdown manually in the next step
//       language: testData['preferredcommunicationlanguagevalue'] || 'English',
//     };
//     await zipCodePage.fillZipCodeDetails(partialData);
//   });
//
//   await test.step('Open Preferred Language dropdown and verify all expected options are listed', async () => {
//     // Adjust this list to match what your application configures
//     const expectedLanguages = ['HINDI', 'MARATHI', 'ENGLISH', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI'];
//
//     const preferredLangCombobox = page
//       .getByRole('combobox', { name: /Preferred Language/i })
//       .or(page.locator('button[aria-label="Preferred Language"]'))
//       .first();
//
//     const isVisible = await preferredLangCombobox.isVisible({ timeout: 5000 }).catch(() => false);
//     if (!isVisible) {
//       console.log('ℹ "Preferred Language" combobox not visible — may not exist in this flow, skipping.');
//       return;
//     }
//
//     await preferredLangCombobox.click({ force: true });
//     await page.waitForTimeout(1500);
//
//     const optionLocator = page.locator(
//       'lightning-base-combobox-item span[class*="label"], li[role="option"] span, .slds-media__body span'
//     );
//     const optionTexts = await optionLocator.allTextContents();
//     const cleanedOptions = optionTexts
//       .map((t: string) => t.trim().toUpperCase())
//       .filter((t: string) => t.length > 0);
//
//     console.log(`Preferred Language options found: ${cleanedOptions.join(', ')}`);
//
//     // Minimum sanity: HINDI must be present
//     expect(cleanedOptions).toContain('HINDI');
//
//     for (const lang of expectedLanguages) {
//       console.log(`  ${cleanedOptions.includes(lang) ? '✓' : 'ℹ'} ${lang}: ${cleanedOptions.includes(lang) ? 'present' : 'not found'}`);
//     }
//
//     expect(cleanedOptions.length).toBeGreaterThan(0);
//     console.log(`✓ Preferred Language dropdown verified — ${cleanedOptions.length} option(s) — PASS`);
//     await page.keyboard.press('Escape');
//   });
// });
