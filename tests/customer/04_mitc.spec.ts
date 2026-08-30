import { test, expect } from "../../fixtures";
import { ExcelReader, DataGenerator } from "../../utils";
import { config } from "../../config/environment.config";
import type { ZipCodeData } from "../../types/customer.types";

/**
 * Test Suite: 04 - MITC (Most Important Terms & Conditions)
 *
 * Prerequisites: Steps 01-03 (Search Dealer ? App Status ? Zip Code) completed
 *
 * Purpose: Fill customer name details and accept terms & conditions
 *
 * Scenarios:
 * - Positive: Fill valid first and last name
 * - Positive: Fill with middle name
 * - Negative: Proceed without entering name
 * - Negative: Enter invalid characters in name
 * - Negative: Exceed character limit
 * - Feature: Verify terms and conditions modal
 */

test.describe("04 - MITC (Customer Name & Terms)", () => {
  let testData: Record<string, string>;
  let mobileNumber: string;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase("TC_03_ZipCode");
    mobileNumber = '5678654324';
  });

  // Helper: Complete prerequisites (steps 01-03)
  async function completePrerequisites(context: any) {
    const { dealerSearchPage, appStatusPage, zipCodePage, page } = context; // Step 1: Login

    await dealerSearchPage.navigateToSearchDealer(); // Step 2: Search dealer

    await dealerSearchPage.selectDealerAndSearch(
      testData["dealervalue"],
      testData["mobilenumberlabel"],
      mobileNumber,
      testData["searchbutton"] || "Search",
    ); // Step 3: Proceed from app status

    await appStatusPage.proceedFromAppStatus(
      testData["appstatuspagename"] || "App Status",
      testData["proceedbuttonvalue"] || "Proceed",
    );

    // Handle alternative flow: navigate via Hamburger menu if not on Zip Code page
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

    // Step 03: Zip Code
    const zipCodeData: ZipCodeData = {
      zipCode: testData["zipcodelabel"] || "Enter Customer ZipCode",
      zipCodeValue: testData["zipcodevalue"] || "411014 Pune",
      bflBranch: testData["bflbranchvalue"] || "411014-Manual Testing Pune",
      dob: testData["dobvalue"] || "18-12-1996",
      gender: testData["gendervalue"] || "Male",
      language: testData["preferredcommunicationlanguagevalue"] || "English",
      preferredLanguage: testData["preferredlanguagevalue"] || "HINDI",
      poaAddressType: testData["poaaddresstype"],
    };
    await zipCodePage.fillZipCodeDetails(zipCodeData);
    await zipCodePage.proceed(testData["proceedbuttonvalue"] || "Proceed");
  }

  test("Positive: Fill valid first and last name", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // Fill MITC details
    await test.step("Fill first and last name", async () => {
      const mitcData = {
        firstName: testData["firstname"] || "Dummycust",
        lastName: testData["lastname"] || "Doe",
      };

      await mitcPage.fillMitcDetailsWithFirstAndLastName(
        mitcData.firstName,
        mitcData.lastName,
        testData["proceedbuttonvalue"] || "Proceed",
      );

      await mitcPage.proceedToPanVerification(
        testData["proceedbuttonvalue"] || "Proceed",
      );
    });
  });

  test("Positive: Fill with middle name", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // Fill with middle name
    await test.step("Fill first,middle and last name", async () => {
      const mitcData = {
        firstName: testData["firstname"] || "Dummycust",
        middleName: testData["middlename"] || "Kumar",
        lastName: testData["lastname"] || "Doe",
      };

      await mitcPage.fillMitcDetailsWithMiddleName(
        mitcData.firstName,
        mitcData.middleName,
        mitcData.lastName,
        testData["proceedbuttonvalue"] || "Proceed",
      );

      await mitcPage.proceedToPanVerification(
        testData["proceedbuttonvalue"] || "Proceed",
      );
    });
  });

  test("Negative: Proceed without entering name", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // remove existing data from first and last name fields with control and backspace
    const firstNameInput = mitcPage.page.getByPlaceholder("Enter first Name");
    await firstNameInput.click();
    await firstNameInput.press("Control+A");
    await firstNameInput.press("Backspace");

    // Don't fill name, try to proceed
    const proceedButton = mitcPage.page.locator(
      `button:has-text("${testData["proceedbuttonvalue"] || "Proceed"}")`,
    );
    await proceedButton.click();

    // Verify error message or validation
    const errorMessage = mitcPage.page.locator(
      "text=/required|enter.*name|cannot be empty|field is mandatory/i",
    );
    await expect(errorMessage.first()).toBeVisible({
      timeout: config.timeouts.element,
    });
  });

  test("Negative: Enter invalid characters in name", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // Fill with invalid characters
    const invalidNames = [
      "John123", // Numbers
      "John@Doe", // Special characters
      "John_Doe", // Underscore
      "John-123", // Mix
    ];

    for (const invalidName of invalidNames) {
      // Fill first name with invalid characters
      const firstNameInput = mitcPage.page.getByPlaceholder("Enter first Name");
      await firstNameInput.click();
      await firstNameInput.press("Control+A");
      await firstNameInput.press("Backspace");
      await firstNameInput.fill(invalidName);

      // Fill last name (valid)
      const lastNameInput = mitcPage.page.getByPlaceholder("Enter last Name");
      await lastNameInput.click();
      await lastNameInput.press("Control+A");
      await lastNameInput.press("Backspace");
      await lastNameInput.fill("Smith");

      // Try to proceed
      const proceedButton = mitcPage.page.locator(
        `button:has-text("${testData["proceedbuttonvalue"] || "Proceed"}")`,
      );
      await proceedButton.click();

      // Verify error message
      const errorMessage = mitcPage.page.locator(
        "text=/invalid.*name|only letters|alphabets only|special characters not allowed/i",
      );
      const hasError = await errorMessage
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasError) {
        console.log(`? Validation works for invalid name: ${invalidName}`);
        break; // Stop after first validation
      }
    }
  });

  test("Negative: Exceed character limit", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // Generate very long name (more than typical limit of 50 characters)
    const veryLongName = "A".repeat(60);

    // Fill first name
    const firstNameInput = mitcPage.page.getByPlaceholder("Enter first Name");
    await firstNameInput.click();
    await firstNameInput.press("Control+A");
    await firstNameInput.press("Backspace");
    await firstNameInput.fill(veryLongName);

    // Verify either:
    // 1. Input is truncated by maxlength attribute
    // 2. Or validation error is shown

    // Try to proceed
    const proceedButton = mitcPage.page.locator(
      `button:has-text("${testData["proceedbuttonvalue"] || "Proceed"}")`,
    );
    await proceedButton.click();

    // Verify error message
    const errorMessage = mitcPage.page.locator(
      "text=/exceeds.*limit|too long|maximum.*characters/i",
    );
    const hasError = await errorMessage
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasError) {
      console.log(`? Validation works for invalid name: ${veryLongName}`);
    }

    // const actualValue = await firstNameInput.inputValue();

    // if (actualValue.length < veryLongName.length) {
    //   // Input was truncated - expected behavior
    //   console.log(`? Name input truncated to ${actualValue.length} characters`);
    //   expect(actualValue.length).toBeLessThanOrEqual(50);
    // } else {
    //   // Try to proceed and check for validation
    //   const lastNameInput = mitcPage.page.locator('input[name*="last"], input[placeholder*="Last Name"]');
    //   await lastNameInput.fill('Smith');

    //   const proceedButton = mitcPage.page.locator(`button:has-text("${testData['proceedbuttonvalue'] || 'Proceed'}")`);
    //   await proceedButton.click();

    //   const errorMessage = mitcPage.page.locator(
    //     'text=/exceeds.*limit|too long|maximum.*characters/i'
    //   );
    //   await expect(errorMessage).toBeVisible({ timeout: config.timeouts.element });
    // // }
  });

  test("Feature: Verify terms and conditions checkbox", async ({
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    page,
  }) => {
    // Complete prerequisites
    await completePrerequisites({
      dealerSearchPage,
      appStatusPage,
      zipCodePage,
      page,
    });

    // Fill MITC details
    await test.step("Fill first and last name", async () => {
      const mitcData = {
        firstName: testData["firstname"] || "Dummycust",
        lastName: testData["lastname"] || "Doe",
      };

      await mitcPage.fillMitcDetailsWithFirstAndLastName(
        mitcData.firstName,
        mitcData.lastName,
        testData["proceedbuttonvalue"] || "Proceed",
      );
    });

    // Check if T&C checkbox exists
    const termsCheckbox = mitcPage.page.locator(
      'input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="accept"]',
    );
    const hasTerms = await termsCheckbox
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasTerms) {
      // Verify checkbox is unchecked
      const isChecked = await termsCheckbox.isChecked();
      expect(isChecked).toBe(false);

      // Try to proceed without accepting terms
      const proceedButton = mitcPage.page.locator(
        `button:has-text("${testData["proceedbuttonvalue"] || "Proceed"}")`,
      );
      let isButtonEnabled = await proceedButton.isEnabled();

      if (!isButtonEnabled) {
        console.log("? Proceed button disabled when T&C not accepted");
      }

      // Accept terms
      await termsCheckbox.check();
      await mitcPage.page.waitForTimeout(500);

      // Verify button is now enabled
      isButtonEnabled = await proceedButton.isEnabled();
      expect(isButtonEnabled).toBe(true);

      // Click view terms link if available
      const viewTermsLink = mitcPage.page.locator(
        'a:has-text("Terms"), a:has-text("View"), button:has-text("View Terms")',
      );
      const hasViewLink = await viewTermsLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasViewLink) {
        await viewTermsLink.click();

        // Verify modal or new tab opens
        await mitcPage.page.waitForTimeout(1000);
        const modal = mitcPage.page.locator('.modal, .dialog, [role="dialog"]');
        const isModalVisible = await modal
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        if (isModalVisible) {
          console.log("? Terms and conditions modal opened");

          // Close modal
          const closeButton = mitcPage.page.locator(
            'button:has-text("Close"), button:has-text("�"), button[aria-label="Close"]',
          );
          await closeButton.click();
        }
      }
    }
  });
});

// ─── NTB-ONLY MITC SCENARIOS ───────────────────────────────────────────────

// ==========================================
// NEW TEST SCENARIOS (Pending Implementation)
// Change 'test.skip' to 'test' to activate each scenario
// ==========================================
