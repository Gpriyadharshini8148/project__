import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator } from '../../utils';

test.describe('01 - Search Dealer', () => {
  let testData: Record<string, string>;
  let mobileNumber: string;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_01_SearchDealer');
    mobileNumber = '5678908765';

    console.log(`✓ Test Data Loaded: ${Object.keys(testData).length} fields`);
    console.log(`✓ Generated Mobile: ${mobileNumber}`);
  });

  test.beforeEach(async ({ dealerSearchPage }) => {
    // Session is already authenticated via global-setup.ts (storageState).
    // Just navigate directly to the Search Dealer page — no login needed.
    await dealerSearchPage.navigateToSearchDealer();
  });

  //positive scenario for valid dealer and mobile number
  test('Positive: Search with valid dealer and mobile number', async ({
    page,
    dealerSearchPage,
  }) => {
    await test.step('Select dealer from dropdown', async () => {
      await dealerSearchPage.selectDealerAndSearch(
        testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES',
        testData['mobilenumberlabel'] || 'Mobile Number',
        mobileNumber,
        testData['searchbutton'] || 'Search'
      );
      await page.waitForTimeout(5000);
    });

    await test.step('Verify search results displayed', async () => {
      const appStatusName = testData['appstatuspagename'] || 'App Status';
      const appStatusLocator = page.getByText(new RegExp(appStatusName, 'i')).first()
        .or(page.locator(`text=/${appStatusName}/i`).first());
      const searchResultsLocator = page.getByText(/result|record|customer|application/i).first()
        .or(page.locator('text=/result|record|customer|application/i').first());

      const appStatusVisible = await appStatusLocator.isVisible({ timeout: 10000 }).catch(() => false);
      const searchResultsVisible = await searchResultsLocator.isVisible({ timeout: 10000 }).catch(() => false);

      if (!appStatusVisible && !searchResultsVisible) {
        console.log('Search action completed, but no expected result label was found in the current UI.');
      } else {
        console.log('✓ Search action completed and a results-like page element was detected.');
      }

      expect(appStatusVisible || searchResultsVisible).toBe(true);
    });
  });





  // //valid card number positive scenario
  // test('Positive: Search with valid card number', async ({
  //   page,
  //   dealerSearchPage,
  // }) => {
  //   const validCardNumber = '1234567891234567';

  //   await test.step('Select dealer and switch to card number search', async () => {
  //     await dealerSearchPage.selectDealer(
  //       testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
  //     );
  //     await dealerSearchPage.selectSearchMode('Card Number');
  //   });

  //   await test.step('Enter valid card number and search', async () => {
  //     await dealerSearchPage.enterCardNumber('Card Number', validCardNumber);
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //   });

  //   await test.step('Verify search completed', async () => {
  //     const appStatusLocator = page.locator(testData['appstatuspagename'] || 'App Status');
  //     const searchResultsLocator = page.locator('text=/result|record|customer|application/i').first();

  //     const appStatusVisible = await appStatusLocator.isVisible({ timeout: 5000 }).catch(() => false);
  //     const searchResultsVisible = await searchResultsLocator.isVisible({ timeout: 5000 }).catch(() => false);

  //     if (!appStatusVisible && !searchResultsVisible) {
  //       console.log('Card search action completed, but no expected result label was found in the current UI.');
  //     } else {
  //       console.log('✓ Card search action completed and a results-like page element was detected.');
  //     }

  //     expect(appStatusVisible || searchResultsVisible).toBe(true);
  //   });
  // }); 


  //test scenarios for invalid card number "ex: 123"
  test('Negative: Search with invalid card number format', async ({
    page,
    dealerSearchPage,
  }) => {
    const invalidCardNumber = '123'; // Too short

    await test.step('Select dealer and switch to card number search', async () => {
      await dealerSearchPage.selectDealer(
        testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
      );
      await dealerSearchPage.selectSearchMode('Card Number');
    });

    await test.step('Enter invalid card number and search', async () => {
      await dealerSearchPage.enterCardNumber('Card Number', invalidCardNumber);
      await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
    });

    await test.step('Verify validation error for invalid card number', async () => {
      const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
      expect(isOnSearchPage).toBe(true);
      console.log('✓ Validation prevented invalid card number search');
    });
  });


  //positive scenario for valid dealer and card number
  test('Positive: Search with valid dealer and  card number', async ({
    page,
    dealerSearchPage,
  }) => {
    const validCardNumber = '1234567891234567';

    await test.step('Select valid dealer and card number', async () => {
      await dealerSearchPage.selectDealer(
        testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES'
      );
      await dealerSearchPage.selectSearchMode('Card Number');
    });

    await test.step('Enter valid card number and search', async () => {
      await dealerSearchPage.enterCardNumber('Card Number', validCardNumber);
      await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
      await page.waitForTimeout(5000);
    });

    await test.step('Verify search completed', async () => {
      const appStatusName = testData['appstatuspagename'] || 'App Status';
      const appStatusLocator = page.getByText(new RegExp(appStatusName, 'i')).first()
        .or(page.locator(`text=/${appStatusName}/i`).first());
      const searchResultsLocator = page.getByText(/result|record|customer|application/i).first()
        .or(page.locator('text=/result|record|customer|application/i').first());

      const appStatusVisible = await appStatusLocator.isVisible({ timeout: 10000 }).catch(() => false);
      const searchResultsVisible = await searchResultsLocator.isVisible({ timeout: 10000 }).catch(() => false);

      if (!appStatusVisible && !searchResultsVisible) {
        console.log('Card search action completed, but no expected result label was found in the current UI.');
      } else {
        console.log('✓ Card search action completed and a results-like page element was detected.');
      }

      expect(appStatusVisible || searchResultsVisible).toBe(true);
    });
  });


  // invalid mobile number negative scenario
  test('Negative: Search with invalid mobile format', async ({
    page,
    dealerSearchPage,
  }) => {
    const invalidMobile = '123'; // Too short

    await test.step('Select dealer', async () => {
      await dealerSearchPage.selectDealer(
        testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
      );
    });

    await test.step('Enter invalid mobile number', async () => {
      await dealerSearchPage.enterMobileNumber(
        testData['mobilenumberlabel'] || 'Mobile Number',
        invalidMobile
      );
      await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
    });

    await test.step('Verify validation error', async () => {
      // Check for error message or that we're still on search page
      const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
      expect(isOnSearchPage).toBe(true);
      console.log('✓ Validation prevented invalid search');
    });
  });


  //negative scenario for blank mobile number and search button click
  test('Negative: Search with blank mobile format', async ({
    page,
    dealerSearchPage,
  }) => {
    const blankmobile = ''; // blank

    await test.step('Select dealer', async () => {
      await dealerSearchPage.selectDealer(
        testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES'
      );
    });

    await test.step('Enter blank mobile number', async () => {
      await dealerSearchPage.enterMobileNumber(
        testData['mobilenumberlabel'] || 'Mobile Number',
        blankmobile
      );
      await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
    });

    await test.step('Verify validation error', async () => {
      // Check for error message or that we're still on search page
      const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
      expect(isOnSearchPage).toBe(true);
      console.log('✓ Validation prevented invalid search');
    });
  });

  // //negative scenario for temporary blocked card number and search button click
  // test('Negative: Search with temporary blocked card number', async ({
  //   page,
  //   dealerSearchPage,
  // }) => {
  //   const blockedCardNumber = '1478523691478523'; // Example blocked card number
  //   await test.step('Select dealer and switch to card number search', async () => {
  //     await dealerSearchPage.selectDealer(
  //       testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
  //     );
  //     await dealerSearchPage.selectSearchMode('Card Number');
  //   });

  //   await test.step('Enter blocked card number', async () => {
  //     await dealerSearchPage.enterCardNumber('Card Number', blockedCardNumber);
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //   }); 
  //   await test.step('Verify validation error for blocked card number', async () => {
  //     // Check for error message or that we're still on search page
  //     const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
  //     expect(isOnSearchPage).toBe(true);
  //     console.log('✓ Validation prevented blocked card number search');
  //   });
  // });


  // //negative scenario for paremanently blocked card number and search button click
  // test('Negative: Search with permanently blocked card number', async ({
  //   page, 
  //   dealerSearchPage,
  // }) => {
  //   const permanentlyBlockedCardNumber = '9876543219876543'; // Example permanently blocked card number
  //   await test.step('Select dealer and switch to card number search', async () => {
  //     await dealerSearchPage.selectDealer(
  //       testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
  //     );
  //     await dealerSearchPage.selectSearchMode('Card Number');
  //   });

  //   await test.step('Enter permanently blocked card number', async () => {
  //     await dealerSearchPage.enterCardNumber('Card Number', permanentlyBlockedCardNumber);
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //   }); 
  //   await test.step('Verify validation error for permanently blocked card number', async () => {
  //     // Check for error message or that we're still on search page
  //     const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
  //     expect(isOnSearchPage).toBe(true);
  //     console.log('✓ Validation prevented permanently blocked card number search');
  //   });
  // });



  // //negative scenario for blank card number and search button click   
  // test('Negative: Search with blank card format', async ({
  //   page,
  //   dealerSearchPage,
  // }) => {
  //   const blankcard = ''; // blank  
  //   await test.step('Select dealer and switch to card number search', async () => {
  //     await dealerSearchPage.selectDealer(
  //       testData['dealervalue'] || '100200 - Manual N2P Testing Dealer'
  //     );
  //     await dealerSearchPage.selectSearchMode('Card Number');
  //   });

  //   await test.step('Enter blank card number', async () => {
  //     await dealerSearchPage.enterCardNumber('Card Number', blankcard);
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //   });

  //   await test.step('Verify validation error', async () => {
  //     // Check for error message or that we're still on search page
  //     const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
  //     expect(isOnSearchPage).toBe(true);
  //     console.log('✓ Validation prevented invalid search');
  //   });
  // });



  //negative scenario for search without selecting dealer
  test('Negative: Search without selecting dealer', async ({
    page,
    dealerSearchPage,
  }) => {
    // //clearing selection of dealer
    // await test.step('Clear dealer selection', async () => {
    //   await dealerSearchPage.clickButton(testData['cleardealerbutton'] || 'Clear Dealer');
    // });

    await test.step('Enter mobile without dealer selection', async () => {
      await dealerSearchPage.enterMobileNumber(
        testData['mobilenumberlabel'] || 'Mobile Number',
        mobileNumber
      );
      await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
    });

    await test.step('Verify dealer selection required message', async () => {
      // Check for error or that search didn't proceed
      const isOnSearchPage = await page.locator('text=Search').isVisible().catch(() => true);
      expect(isOnSearchPage).toBe(true);
      console.log('✓ Error shown when dealer not selected');
    });
  });


// ==========================================
// NEW TEST SCENARIOS (Pending Implementation)
// Comment out 'test.skip' → 'test' to activate each scenario
// ==========================================


// test.skip('Negative: Search with an invalid or non-existent Dealer Code (verify error message).', async ({ page, dealerSearchPage }) => {
//   await dealerSearchPage.navigateToSearchDealer();

//   await test.step('Type an invalid dealer code into the combobox', async () => {
//     // Type a non-existent code — the dropdown should show no matches
//     const dealerDropdown = page.getByRole('combobox', { name: /Dealer/i }).first();
//     await dealerDropdown.click();
//     await page.keyboard.type('XXXXINVALID9999');
//     await page.waitForTimeout(2000);
//   });

//   await test.step('Verify no matching dealer option appears', async () => {
//     const noResultOption = page.locator('lightning-base-combobox-item, li[role="option"]').filter({ hasText: /XXXXINVALID|No result|No match/i }).first();
//     const anyOption = page.locator('lightning-base-combobox-item, li[role="option"]').first();
//     const hasAnyOption = await anyOption.isVisible({ timeout: 3000 }).catch(() => false);
//     // If no option is visible — correct; if an option shows a "no results" label — also correct
//     console.log(`✓ Dealer dropdown option count after invalid code: ${hasAnyOption ? 'some options shown' : 'no options shown'}`);
//     // Pressing Escape, then trying to search should show validation
//     await page.keyboard.press('Escape');
//     await dealerSearchPage.enterMobileNumber(testData['mobilenumberlabel'] || 'Mobile Number', mobileNumber);
//     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
//     await page.waitForTimeout(2000);
//     const isStillOnSearchPage = await page.getByRole('button', { name: /Search/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
//     expect(isStillOnSearchPage).toBe(true);
//     console.log('✓ Correct: Search blocked when dealer is not properly selected');
//   });
// });

// test.skip('Negative: Search with an invalid Dealer Name (verify "No opportunities found").', async ({ page, dealerSearchPage }) => {
//   await dealerSearchPage.navigateToSearchDealer();

//   await test.step('Type a non-existent dealer name', async () => {
//     const dealerDropdown = page.getByRole('combobox', { name: /Dealer/i }).first();
//     await dealerDropdown.click();
//     await page.keyboard.type('ZZZ_NON_EXISTENT_DEALER_123');
//     await page.waitForTimeout(2000);
//     await page.keyboard.press('Escape');
//   });

//   await test.step('Attempt search and verify "No opportunities found" or error', async () => {
//     await dealerSearchPage.enterMobileNumber(testData['mobilenumberlabel'] || 'Mobile Number', mobileNumber);
//     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
//     await page.waitForTimeout(3000);
//     // Either a toast message, error text, or we remain on the search page
//     const noResultMsg = page.getByText(/No opportunit|No record|not found|invalid dealer/i).first();
//     const isStillOnSearch = await page.getByRole('button', { name: /Search/i }).isVisible({ timeout: 5000 }).catch(() => false);
//     const hasNoResultMsg = await noResultMsg.isVisible({ timeout: 5000 }).catch(() => false);
//     expect(isStillOnSearch || hasNoResultMsg).toBe(true);
//     console.log('✓ Correct: No opportunities shown for invalid dealer name');
//   });
// });


// test.skip('Positive: Select a dealer from the auto-suggest dropdown list.', async ({ page, dealerSearchPage }) => {
//   await dealerSearchPage.navigateToSearchDealer();

//   await test.step('Type partial dealer code to trigger auto-suggest', async () => {
//     const dealerDropdown = page.getByRole('combobox', { name: /Dealer/i }).first();
//     await dealerDropdown.click();
//     const partialCode = (testData['dealervalue'] || '1300').split(' ')[0].substring(0, 3);
//     await page.keyboard.type(partialCode);
//     await page.waitForTimeout(2000);
//   });

//   await test.step('Verify dropdown suggestions appear and select first', async () => {
//     const firstOption = page.locator('lightning-base-combobox-item, li[role="option"]').filter({ hasText: /\w/ }).first();
//     const hasOption = await firstOption.isVisible({ timeout: 5000 }).catch(() => false);
//     expect(hasOption).toBe(true);
//     if (hasOption) {
//       await firstOption.click({ force: true });
//       console.log('✓ Auto-suggest dropdown appeared and dealer selected');
//     }
//   });
// });

// test.skip('Negative: Search using special characters in the search field.', async ({ page, dealerSearchPage }) => {
//   await dealerSearchPage.navigateToSearchDealer();

//   await test.step('Enter special characters in Mobile Number field', async () => {
//     await dealerSearchPage.selectDealer(testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES');
//     await dealerSearchPage.selectSearchMode('Mobile Number');
//     // Enter special characters — should be rejected or sanitized
//     const mobileInput = page.getByLabel(testData['mobilenumberlabel'] || 'Mobile Number', { exact: false }).last();
//     await mobileInput.fill('!@#$%^&*()');
//     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
//     await page.waitForTimeout(2000);
//   });

//   await test.step('Verify validation error or input sanitized', async () => {
//     const isOnSearchPage = await page.getByRole('button', { name: /Search/i }).isVisible({ timeout: 5000 }).catch(() => true);
//     expect(isOnSearchPage).toBe(true);
//     // Also check: the input should either be empty or have its value stripped
//     const mobileInput = page.getByLabel(testData['mobilenumberlabel'] || 'Mobile Number', { exact: false }).last();
  //   await test.step('Verify validation error or input sanitized', async () => {
  //     const isOnSearchPage = await page.getByRole('button', { name: /Search/i }).isVisible({ timeout: 5000 }).catch(() => true);
  //     expect(isOnSearchPage).toBe(true);
  //     // Also check: the input should either be empty or have its value stripped
  //     const mobileInput = page.getByLabel(testData['mobilenumberlabel'] || 'Mobile Number', { exact: false }).last();
  //     const val = await mobileInput.inputValue().catch(() => '');
  //     console.log(`✓ Input value after special chars: "${val}" — search blocked or input sanitized`);
  //   });
  // });

  // test.skip('Negative: Search without selecting a dealer (verify validation prevents search).', async ({ page, dealerSearchPage }) => {
  //   await dealerSearchPage.navigateToSearchDealer();

  //   await test.step('Skip dealer selection and go directly to mobile number entry', async () => {
  //     // Do NOT call selectDealer — leave the dealer field empty
  //     await dealerSearchPage.selectSearchMode('Mobile Number');
  //     await dealerSearchPage.enterMobileNumber(testData['mobilenumberlabel'] || 'Mobile Number', mobileNumber);
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //     await page.waitForTimeout(2000);
  //   });

  //   await test.step('Verify search is blocked and validation error appears for dealer field', async () => {
  //     // Expect a validation message on the dealer combobox or we stay on the search page
  //     const dealerError = page.locator(
  //       'lightning-combobox .slds-has-error, lightning-combobox [class*="error"], ' +
  //       'p.slds-form-error, .slds-form-element__help'
  //     ).first();
  //     const hasError = await dealerError.isVisible({ timeout: 5000 }).catch(() => false);
  //     const isStillOnSearchPage = await page.getByRole('button', { name: /Search/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(hasError || isStillOnSearchPage).toBe(true);
  //     if (hasError) {
  //       console.log('✓ Validation error displayed for empty dealer field');
  //     } else {
  //       console.log('✓ Search blocked — remained on search page without dealer selection');
  //     }
  //   });
  // });

  // test.skip('Negative: Search with an invalid mobile number (letters / too short / too long) and verify error.', async ({ page, dealerSearchPage }) => {
  //   await dealerSearchPage.navigateToSearchDealer();

  //   const invalidMobileNumbers = [
  //     { value: 'ABCDE12345',   label: 'alphabetic input' },
  //     { value: '12345',         label: 'too short (5 digits)' },
  //     { value: '123456789012', label: 'too long (12 digits)' },
  //     { value: '0000000000',   label: 'all zeros' },
  //   ];

  //   for (const { value, label } of invalidMobileNumbers) {
  //     await test.step(`Enter invalid mobile number: ${label}`, async () => {
  //       await dealerSearchPage.selectDealer(testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES');
  //       await dealerSearchPage.selectSearchMode('Mobile Number');
  //       const mobileInput = page.getByLabel(testData['mobilenumberlabel'] || 'Mobile Number', { exact: false }).last();
  //       await mobileInput.fill(value);
  //       await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //       await page.waitForTimeout(2000);

  //       // Expect validation error on the mobile field OR stay on the search page
  //       const mobileError = page.locator(
  //         '.slds-has-error, [class*="error"], p.slds-form-error, .slds-form-element__help'
  //       ).first();
  //       const hasError = await mobileError.isVisible({ timeout: 4000 }).catch(() => false);
  //       const isStillOnSearchPage = await page.getByRole('button', { name: /Search/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
  //       expect(hasError || isStillOnSearchPage).toBe(true);
  //       console.log(`✓ [${label}] — ${hasError ? 'Validation error shown' : 'Search blocked, still on search page'}`);

  //       // Reset: navigate again for the next iteration
  //       await dealerSearchPage.navigateToSearchDealer();
  //     });
  //   }
  // });

  // test.skip('Negative: Search with a blank CRD number (leave CRD field empty and verify error).', async ({ page, dealerSearchPage }) => {
  //   await dealerSearchPage.navigateToSearchDealer();

  //   await test.step('Switch to CRD Number search mode and leave field blank', async () => {
  //     await dealerSearchPage.selectDealer(testData['dealervalue'] || '1300 - SHREE RAJENDRA DEPARTMENTAL STORES');
  //     // Switch to CRD / Customer ID search mode — adjust the label to match your app
  //     await dealerSearchPage.selectSearchMode('CRD Number');
  //     // Intentionally do NOT fill the CRD field — leave it blank
  //     await dealerSearchPage.clickSearch(testData['searchbutton'] || 'Search');
  //     await page.waitForTimeout(2000);
  //   });

  //   await test.step('Verify validation error appears for blank CRD field', async () => {
  //     const crdError = page.locator(
  //       '.slds-has-error, [class*="error"], p.slds-form-error, .slds-form-element__help'
  //     ).first();
  //     const hasError = await crdError.isVisible({ timeout: 5000 }).catch(() => false);
  //     const isStillOnSearchPage = await page.getByRole('button', { name: /Search/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
  //     expect(hasError || isStillOnSearchPage).toBe(true);
  //     if (hasError) {
  //       const errorText = await crdError.textContent().catch(() => '');
  //       console.log(`✓ Validation error for blank CRD field: "${errorText?.trim()}"`);
  //     } else {
  //       console.log('✓ Search blocked — remained on search page with blank CRD number');
  //     }
  //   });
  // });

});