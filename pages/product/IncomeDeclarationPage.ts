import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import type { ProductData } from '../../types/customer.types';

/**
 * Income Declaration Page Object
 * Handles income declaration, Additional Details, and Household Member Details
 * using precise structural XPaths and fallback locators.
 */
export class IncomeDeclarationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Screen 1: Income Declaration
  // ═══════════════════════════════════════════════════════════════════════════

  /** Monthly Income input field */
  get loc_monthlyIncome(): Locator {
    return this.page.locator('xpath=//div[@class="form-section"]//div[1]//div[1]//input[1]')
      .or(this.page.locator('xpath=(//input[@type="number"])[1]'))
      .first();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Screen 2: Income Additional Details
  // ═══════════════════════════════════════════════════════════════════════════

  /** Monthly Applicant Primary Income spinbutton */
  get loc_primaryIncome(): Locator {
    return this.page.getByRole('spinbutton').filter({ has: this.page.locator('text=/Monthly Applicant Primary Income/i') })
      .or(this.page.locator('xpath=//*[contains(., "Monthly Applicant Primary Income")]/following-sibling::div//input | //*[contains(., "Monthly Applicant Primary Income")]/following-sibling::div//spinbutton'))
      .first();
  }

  /** Monthly Applicant Other Income spinbutton */
  get loc_applicantOtherIncome(): Locator {
    return this.page.getByRole('spinbutton').filter({ has: this.page.locator('text=/Monthly Applicant Other Income/i') })
      .or(this.page.locator('xpath=//*[contains(., "Monthly Applicant Other Income")]/following-sibling::div//input | //*[contains(., "Monthly Applicant Other Income")]/following-sibling::div//spinbutton'))
      .first();
  }

  /** Monthly Household Other Income spinbutton */
  get loc_householdOtherIncome(): Locator {
    return this.page.getByRole('spinbutton').filter({ has: this.page.locator('text=/Monthly Household Other Income/i') })
      .or(this.page.locator('xpath=//*[contains(., "Monthly Household Other Income")]/following-sibling::div//input | //*[contains(., "Monthly Household Other Income")]/following-sibling::div//spinbutton'))
      .first();
  }

  /** Monthly Household Obligations spinbutton */
  get loc_householdObligations(): Locator {
    return this.page.getByRole('spinbutton').filter({ has: this.page.locator('text=/Monthly Household Obligations/i') })
      .or(this.page.locator('xpath=//*[contains(., "Monthly Household Obligations")]/following-sibling::div//input | //*[contains(., "Monthly Household Obligations")]/following-sibling::div//spinbutton'))
      .first();
  }

  /** Gender select (Additional Details section) */
  get loc_genderDropdown(): Locator {
    return this.page.locator('xpath=//div[@class="content"]//div[1]//select[1]')
      .or(this.page.locator('xpath=//select[@class="field-box"]').nth(0))
      .first();
  }

  /** Marital Status select (Additional Details section) */
  get loc_maritalStatusDropdown(): Locator {
    return this.page.locator('xpath=//div[@class="additional-details"]//div[2]//select[1]')
      .or(this.page.locator('xpath=//select[@class="field-box"]').nth(1))
      .first();
  }
  /** PAN Number input (Additional Details section) */
  get loc_panInput(): Locator {
    return this.page.locator('xpath=//div[@class="input-group"]//input[@type="text"]')
      .or(this.page.getByRole('textbox', { name: /Pan Number|PAN/i }))
      .first();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Screen 3: Household Member Details
  // ═══════════════════════════════════════════════════════════════════════════

  /** Relationship with Applicant dropdown */
  get loc_relationshipDropdown(): Locator {
    return this.page.locator('xpath=//div[@class="form-section"]//div[1]//select[1]')
      .or(this.page.getByRole('combobox', { name: /Relationship with Applicant/i }))
      .or(this.page.locator('select[name*="relationship" i]'))
      .first();
  }

  /** First Name as per ID Proof input */
  get loc_hhFirstName(): Locator {
    return this.page.locator('xpath=//div[@class="form-section"]//div[2]//input[1]')
      .or(this.page.getByRole('textbox', { name: /First Name as per ID Proof/i }))
      .first();
  }

  /** Last Name as per ID Proof input */
  get loc_hhLastName(): Locator {
    return this.page.locator('xpath=(//input[@type="text"])[3]')
      .or(this.page.getByRole('textbox', { name: /Last Name as per ID Proof/i }))
      .first();
  }

  /** Household Mobile No. input */
  get loc_hhMobile(): Locator {
    return this.page.locator('xpath=//input[@type="number"]')
      .or(this.page.getByRole('textbox', { name: /Household Mobile|Mobile No|Phone/i }))
      .first();
  }

  /** Date Of Birth as per ID Proof input */
  get loc_hhDob(): Locator {
    return this.page.locator('xpath=//input[@type="date"]')
      .or(this.page.getByRole('textbox', { name: /Date of Birth|DOB/i }))
      .first();
  }

  /** Gender dropdown (Household Member section) */
  get loc_hhGender(): Locator {
    return this.page.locator('xpath=(//select[@class="field-box"])[2]')
      .or(this.page.getByRole('combobox', { name: /Gender/i }).nth(1))
      .first();
  }

  /** Pin Code input */
  get loc_hhPinCode(): Locator {
    return this.page.locator('xpath=(//input[@type="text"])[4]')
      .or(this.page.getByRole('textbox', { name: /Pin Code|Pincode|Postal Code/i }))
      .first();
  }

  /** Identity Type dropdown */
  get loc_identityType(): Locator {
    return this.page.locator('xpath=//div[@class="identification-section"]//select[@class="field-box"]')
      .or(this.page.getByRole('combobox', { name: /Identity Type|ID Type|Type of Identity/i }))
      .first();
  }

  /** Enter Identification Number input */
  get loc_identificationNumber(): Locator {
    return this.page.locator('xpath=(//input[@type="text"])[5]')
      .or(this.page.getByRole('textbox', { name: /Identification Number|Enter Identification|ID Number/i }))
      .first();
  }

  /** "Click here" link for Initiate Income Declaration */
  get loc_initiateLink(): Locator {
    return this.page.locator('xpath=//button[normalize-space()="Click here"]')
      .or(this.page.locator('a:has-text("Click here")'))
      .first();
  }

  /** Proceed Button */
  get loc_proceedButton(): Locator {
    return this.page.locator('xpath=//button[normalize-space()="Proceed"]')
      .first();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Error / Validation
  // ═══════════════════════════════════════════════════════════════════════════

  get loc_errorBanner(): Locator {
    return this.page.locator("//div[contains(@class,'slds-theme_error') or contains(@class,'error') or @role='alert']");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async isIncomeDeclarationPage(): Promise<boolean> {
    return await this.loc_monthlyIncome.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /** Selects an option in a native <select> by matching value or visible text (case-insensitive), avoiding brittle option-click patterns. */
  private async selectNativeOption(locator: Locator, value: string, label: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.waitFor({ state: 'visible', timeout: 8000 });

    const options = await locator.evaluate((el: HTMLSelectElement) =>
      Array.from(el.options).map(o => ({ value: o.value, text: (o.textContent || '').trim() }))
    ).catch(() => [] as { value: string; text: string }[]);
    console.log(`[DEBUG] ${label} options: ${JSON.stringify(options)}`);

    const match = options.find(o => o.value.toLowerCase() === value.toLowerCase() || o.text.toLowerCase() === value.toLowerCase())
      || options.find(o => o.text.toLowerCase().includes(value.toLowerCase()));

    await locator.selectOption(match ? match.value : value);
  }

  async fillIncomeDeclaration(incomeAmount: string, proceedButton: string = 'Proceed'): Promise<void> {
    console.log('===== Income Declaration =====');
    const incomeInput = this.loc_monthlyIncome;
    await incomeInput.waitFor({ state: 'visible', timeout: 5000 });
    await incomeInput.click({ force: true });
    await incomeInput.fill('');
    await incomeInput.pressSequentially(incomeAmount, { delay: 100 });
    console.log(`✓ Income declared: ${incomeAmount}`);

    await this.loc_proceedButton.click({ force: true });
    await this.waitFor(2000);
  }

async fillAdditionalDetails(data: {
    primaryIncome?: string;
    applicantOtherIncome?: string;
    householdOtherIncome?: string;
    householdObligations?: string;
    gender?: string;
    maritalStatus?: string;
    panNumber?: string;
    proceedButton?: string;
  }): Promise<void> {
    console.log('===== Income Additional Details =====');
    await this.page.waitForTimeout(2000);

    // --- 1. Primary Income (Spinbutton) ---
    if (data.primaryIncome !== undefined) {
      try {
        await this.loc_primaryIncome.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_primaryIncome.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        await this.page.waitForTimeout(500);
        
        // For spinbutton, need to click first then type
        await this.loc_primaryIncome.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_primaryIncome.fill(data.primaryIncome);
        await this.loc_primaryIncome.blur().catch(() => {});
        console.log(`✓ Filled Primary Income: ${data.primaryIncome}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Primary Income: ${e.message}`);
      }
    }

    // --- 2. Applicant Other Income (Spinbutton) ---
    if (data.applicantOtherIncome !== undefined) {
      try {
        await this.loc_applicantOtherIncome.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_applicantOtherIncome.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(300);
        
        await this.loc_applicantOtherIncome.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_applicantOtherIncome.fill(data.applicantOtherIncome);
        await this.loc_applicantOtherIncome.blur().catch(() => {});
        console.log(`✓ Filled Applicant Other Income: ${data.applicantOtherIncome}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Applicant Other Income: ${e.message}`);
      }
    }

    // --- 3. Household Other Income (Spinbutton) ---
    if (data.householdOtherIncome !== undefined) {
      try {
        await this.loc_householdOtherIncome.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_householdOtherIncome.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(300);
        
        await this.loc_householdOtherIncome.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_householdOtherIncome.fill(data.householdOtherIncome);
        await this.loc_householdOtherIncome.blur().catch(() => {});
        console.log(`✓ Filled Household Other Income: ${data.householdOtherIncome}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Household Other Income: ${e.message}`);
      }
    }

    // --- 4. Household Obligations (Spinbutton) ---
    if (data.householdObligations !== undefined) {
      try {
        await this.loc_householdObligations.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_householdObligations.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(300);
        
        await this.loc_householdObligations.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_householdObligations.fill(data.householdObligations);
        await this.loc_householdObligations.blur().catch(() => {});
        console.log(`✓ Filled Household Obligations: ${data.householdObligations}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Household Obligations: ${e.message}`);
      }
    }

 // --- 5. Gender (Native Select Element) ---
    if (data.gender) {
      try {
        console.log(`[LOG] Attempting to select Gender: ${data.gender}`);
        const genderSelect = this.loc_genderDropdown;
        
        await genderSelect.scrollIntoViewIfNeeded().catch(() => {});
        await genderSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        console.log(`[DEBUG] Gender select is visible`);
        
        // Use selectOption for native select elements
        await genderSelect.selectOption(data.gender);
        await this.page.waitForTimeout(400);
        console.log(`✓ Selected Gender: ${data.gender}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to select Gender: ${e.message}`);
      }
    }

    // --- 6. Marital Status (Native Select Element) ---
    if (data.maritalStatus) {
      try {
        console.log(`[LOG] Attempting to select Marital Status: ${data.maritalStatus}`);
        const maritalSelect = this.loc_maritalStatusDropdown;
        
        await maritalSelect.scrollIntoViewIfNeeded().catch(() => {});
        await maritalSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        console.log(`[DEBUG] Marital Status select is visible`);
        
        // Use selectOption for native select elements
        await maritalSelect.selectOption(data.maritalStatus);
        await this.page.waitForTimeout(400);
        console.log(`✓ Selected Marital Status: ${data.maritalStatus}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to select Marital Status: ${e.message}`);
      }
    }
    // --- 7. PAN Number (Textbox) ---
    if (data.panNumber) {
      try {
        await this.loc_panInput.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_panInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_panInput.fill(data.panNumber);
        console.log(`✓ Filled PAN Number: ${data.panNumber}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill PAN Number: ${e.message}`);
      }
    }

    // --- 8. Proceed ---
    if (data.proceedButton) {
      try {
        const proceedBtn = this.page.getByRole('button', { name: data.proceedButton, exact: true }).first();
        await proceedBtn.scrollIntoViewIfNeeded().catch(() => {});
        await proceedBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await proceedBtn.click({ force: true });
        console.log(`✓ Clicked ${data.proceedButton} on Additional Details screen`);
        // Wait for Household Member Details screen to load
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      } catch (e: any) {
        console.warn(`⚠ Failed to click Proceed: ${e.message}`);
      }
    }
  }
  async fillHouseholdMemberDetails(data: {
    relationship?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    dob?: string;
    gender?: string;
    pinCode?: string;
    identityType?: string;
    identificationNumber?: string;
    initiateDeclaration?: boolean;
    proceedButton?: string;
  }): Promise<void> {
    console.log('===== Household Member Details =====');
    // Wait for Household Member Details form to fully render
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // --- 1. Relationship with Applicant (Native Select) ---
    if (data.relationship) {
      try {
        console.log(`[LOG] Attempting to select Relationship: ${data.relationship}`);
        await this.selectNativeOption(this.loc_relationshipDropdown, data.relationship, 'Relationship');
        await this.page.waitForTimeout(300);
        console.log(`✓ Selected Relationship: ${data.relationship}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to select Relationship: ${e.message}`);
      }
    }

    // --- 2. First Name as per ID Proof ---
    if (data.firstName !== undefined) {
      try {
        await this.loc_hhFirstName.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_hhFirstName.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_hhFirstName.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_hhFirstName.fill(data.firstName);
        console.log(`✓ Filled First Name: ${data.firstName}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill First Name: ${e.message}`);
      }
    }

    // --- 3. Last Name as per ID Proof ---
    if (data.lastName !== undefined) {
      try {
        await this.loc_hhLastName.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_hhLastName.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_hhLastName.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_hhLastName.fill(data.lastName);
        console.log(`✓ Filled Last Name: ${data.lastName}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Last Name: ${e.message}`);
      }
    }

    // --- 4. Household Mobile No. ---
    if (data.mobile !== undefined) {
      try {
        await this.loc_hhMobile.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_hhMobile.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_hhMobile.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_hhMobile.fill(data.mobile);
        console.log(`✓ Filled Mobile No: ${data.mobile}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Mobile No: ${e.message}`);
      }
    }

    // --- 5. Date of Birth as per ID Proof ---
    if (data.dob !== undefined) {
      try {
        await this.loc_hhDob.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_hhDob.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_hhDob.fill(data.dob);
        console.log(`✓ Filled DOB: ${data.dob}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill DOB: ${e.message}`);
      }
    }

    // --- 6. Gender (Native Select - Household Member section) ---
    if (data.gender) {
      try {
        const genderSelect = this.loc_hhGender;
        await genderSelect.scrollIntoViewIfNeeded().catch(() => {});
        await genderSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        
        // Use selectOption for native select elements
        await genderSelect.selectOption(data.gender);
        await this.page.waitForTimeout(300);
        console.log(`✓ Selected Gender (HH): ${data.gender}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to select Gender (HH): ${e.message}`);
      }
    }

    // --- 7. Pin Code ---
    if (data.pinCode !== undefined) {
      try {
        await this.loc_hhPinCode.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_hhPinCode.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_hhPinCode.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(300);
        await this.loc_hhPinCode.fill(data.pinCode);
        await this.loc_hhPinCode.blur();
        console.log(`✓ Filled Pin Code: ${data.pinCode}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Pin Code: ${e.message}`);
      }
    }

    // --- 8. Identity Type (Native Select) ---
    if (data.identityType) {
      try {
        await this.selectNativeOption(this.loc_identityType, data.identityType, 'Identity Type');
        await this.page.waitForTimeout(300);
        console.log(`✓ Selected Identity Type: ${data.identityType}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to select Identity Type: ${e.message}`);
      }
    }

    // --- 10. Identification Number ---
    if (data.identificationNumber !== undefined) {
      try {
        await this.loc_identificationNumber.scrollIntoViewIfNeeded().catch(() => {});
        await this.loc_identificationNumber.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.loc_identificationNumber.fill(data.identificationNumber);
        console.log(`✓ Filled Identification Number: ${data.identificationNumber}`);
      } catch (e: any) {
        console.warn(`⚠ Failed to fill Identification Number: ${e.message}`);
      }
    }

    // --- 11. Click "Click here" button AFTER ALL FIELDS FILLED ---
    if (data.initiateDeclaration) {
      try {
        // Use the exact locator provided
        const clickHereBtn = this.page.locator('xpath=//button[normalize-space()="Click here"]').first();
        await clickHereBtn.scrollIntoViewIfNeeded().catch(() => {});
        await clickHereBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(500);
        await clickHereBtn.click({ force: true });
        await this.page.waitForTimeout(2000);
        console.log(`✓ Clicked 'Click here' button`);
      } catch (e: any) {
        console.warn(`⚠ Failed to click 'Click here' button: ${e.message}`);
      }
    }
  }

  async proceed(proceedButton: string = 'Proceed'): Promise<void> {
    await this.loc_proceedButton.click({ force: true });
  }
}