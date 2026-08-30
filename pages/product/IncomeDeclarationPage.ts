import { expect, Locator, Page } from '@playwright/test';
//import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import type { ProductData } from '../../types/customer.types';

/**
 * Income Declaration Page Object
 * Handles income declaration, Additional Details, and Household Member Details
 *
 * ─── SCREEN 1: Income Declaration ─────────────────────────────────────────────
 *   • Monthly Income input (single numeric field)
 *   • Proceed button
 *
 * ─── SCREEN 2: Income Additional Details ──────────────────────────────────────
 *   Fields:
 *   • Monthly Applicant Primary Income   → loc_primaryIncome
 *   • Monthly Applicant Other Income     → loc_applicantOtherIncome
 *   • Monthly Household Other Income     → loc_householdOtherIncome
 *   • Monthly Household Obligations      → loc_householdObligations
 *   • Gender (select)                    → loc_genderDropdown
 *   • Marital Status (select)            → loc_maritalStatusDropdown
 *   • Pan Number (text)                  → loc_panInput
 *   Note: "Sum of income details in first three fields should be equal to
 *          Income entered on the previous page." — hint text visible on page
 *
 * ─── SCREEN 3: Household Member Details ───────────────────────────────────────
 *   Fields:
 *   • Relationship with Applicant (select) → loc_relationshipDropdown
 *   • First Name as per ID Proof (text)    → loc_hhFirstName
 *   • Last Name as per ID Proof  (text)    → loc_hhLastName
 *   • Household Mobile No.       (text)    → loc_hhMobile
 *   • Date Of Birth as per ID Proof (date) → loc_hhDob
 *   • Gender (select)                      → loc_hhGender
 *   • Pin Code (text)                      → loc_hhPinCode
 *   Household Member Identification Details:
 *   • Identity Type (select)               → loc_identityType
 *   • Enter Identification Number (text)   → loc_identificationNumber
 *   Actions:
 *   • Initiate Income Declaration → "Click here" link → loc_initiateLink
 *   • Proceed button
 */
export class IncomeDeclarationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Screen 2: Income Additional Details
  // ═══════════════════════════════════════════════════════════════════════════

  /** Monthly Applicant Primary Income input */
  get loc_primaryIncome(): Locator {
    return this.page.locator(
      'lightning-input:has(label:text-is("Monthly Applicant Primary Income")) input, ' +
      'input[placeholder*="Primary Income" i], input[name*="primaryIncome" i]'
    ).first();
  }

  /** Monthly Applicant Other Income input */
  get loc_applicantOtherIncome(): Locator {
    return this.page.locator(
      'lightning-input:has(label:text-is("Monthly Applicant Other Income")) input, ' +
      'input[placeholder*="Applicant Other Income" i], input[name*="applicantOtherIncome" i]'
    ).first();
  }

  /** Monthly Household Other Income input */
  get loc_householdOtherIncome(): Locator {
    return this.page.locator(
      'lightning-input:has(label:text-is("Monthly Household Other Income")) input, ' +
      'input[placeholder*="Household Other Income" i], input[name*="householdOtherIncome" i]'
    ).first();
  }

  /** Monthly Household Obligations input */
  get loc_householdObligations(): Locator {
    return this.page.locator(
      'lightning-input:has(label:text-is("Monthly Household Obligations")) input, ' +
      'input[placeholder*="Household Obligations" i], input[name*="householdObligations" i]'
    ).first();
  }

  /** Gender dropdown (Additional Details section) */
  get loc_genderDropdown(): Locator {
    return this.page.getByRole('combobox', { name: /^Gender/i }).first()
      .or(this.page.locator('select[name*="gender" i]').first());
  }

  /** Marital Status dropdown */
  get loc_maritalStatusDropdown(): Locator {
    return this.page.getByRole('combobox', { name: /Marital Status/i }).first()
      .or(this.page.locator('select[name*="marital" i], select[name*="maritalStatus" i]').first());
  }

  /** PAN Number input (Additional Details section) */
  get loc_panInput(): Locator {
    return this.page.getByRole('textbox', { name: /Pan Number|PAN/i }).first()
      .or(this.page.locator('input[name*="pan" i], input[placeholder*="PAN" i]').first());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Screen 3: Household Member Details
  // ═══════════════════════════════════════════════════════════════════════════

  /** Relationship with Applicant dropdown */
  get loc_relationshipDropdown(): Locator {
    return this.page.getByRole('combobox', { name: /Relationship with Applicant/i }).first()
      .or(this.page.locator('select[name*="relationship" i]').first());
  }

  /** First Name as per ID Proof input */
  get loc_hhFirstName(): Locator {
    return this.page.getByRole('textbox', { name: /First Name as per ID Proof/i }).first()
      .or(this.page.locator('input[name*="firstName" i], input[placeholder*="First Name" i]').first());
  }

  /** Last Name as per ID Proof input */
  get loc_hhLastName(): Locator {
    return this.page.getByRole('textbox', { name: /Last Name as per ID Proof/i }).first()
      .or(this.page.locator('input[name*="lastName" i], input[placeholder*="Last Name" i]').first());
  }

  /** Household Mobile No. input */
  get loc_hhMobile(): Locator {
    return this.page.getByRole('textbox', { name: /Household Mobile/i }).first()
      .or(this.page.locator('input[name*="mobile" i][name*="household" i], input[placeholder*="Mobile" i]').first());
  }

  /** Date Of Birth as per ID Proof input (date type) */
  get loc_hhDob(): Locator {
    return this.page.locator('input[type="date"]').first()
      .or(this.page.getByRole('textbox', { name: /Date Of Birth/i }).first());
  }

  /** Gender dropdown (Household Member section) */
  get loc_hhGender(): Locator {
    return this.page.getByRole('combobox', { name: /^Gender/i }).first()
      .or(this.page.locator('select[name*="gender" i]').first());
  }

  /** Pin Code input */
  get loc_hhPinCode(): Locator {
    return this.page.getByRole('textbox', { name: /Pin Code/i }).first()
      .or(this.page.locator('input[name*="pin" i], input[placeholder*="Pin" i]').first());
  }

  /** Identity Type dropdown (Household Member Identification Details) */
  get loc_identityType(): Locator {
    return this.page.getByRole('combobox', { name: /Identity Type/i }).first()
      .or(this.page.locator('select[name*="identityType" i]').first());
  }

  /** Enter Identification Number input */
  get loc_identificationNumber(): Locator {
    return this.page.getByRole('textbox', { name: /Identification Number|Enter Identification/i }).first()
      .or(this.page.locator('input[name*="identificationNumber" i], input[name*="idNumber" i]').first());
  }

  /** "Click here" link next to "Initiate Income Declaration" */
  get loc_initiateLink(): Locator {
    return this.page.locator(
      'a:has-text("Click here"), button:has-text("Click here"), ' +
      'span:has-text("Click here"), lightning-button:has-text("Click here")'
    ).first()
      .or(this.page.getByText('Click here', { exact: true }).first());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATORS — Error / Validation
  // ═══════════════════════════════════════════════════════════════════════════

  /** Generic SLDS error banner (hard error) */
  get loc_errorBanner(): Locator {
    return this.page.locator("//div[contains(@class,'slds-theme_error')]");
  }

  /** Any inline field validation error */
  get loc_fieldError(): Locator {
    return this.page.locator('.slds-has-error, .slds-form-element__help, [role="alert"], .toastMessage');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  async isIncomeDeclarationPage(): Promise<boolean> {
    const screen = await this.getCurrentScreen();
    return screen === 'Income Declaration';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION: Screen 1 — Fill & Proceed Income Declaration
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fill monthly income amount and click Proceed.
   * Iterates frames to find the income input (skips global search bar).
   */
  async fillIncomeDeclaration(
    incomeAmount: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== Income Declaration =====');
    await this.verifyCurrentScreen('Income Declaration');

    let targetFrame: any = this.page;
    let incomeInput: Locator | null = null;

    // Iterate through frames to find the income input
    // The page also contains a global "Search..." input in the header. We need to skip it.
    for (const frame of this.page.frames()) {
        const inputs = frame.locator('input');
        const count = await inputs.count().catch(() => 0);
        
        let foundInputs = [];
        for (let i = 0; i < count; i++) {
            const el = inputs.nth(i);
            if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
                const type = await el.getAttribute('type').catch(() => '');
                const placeholder = await el.getAttribute('placeholder').catch(() => '') || '';
                
                // Skip hidden, radio, checkbox, and the global search bar
                if (type !== 'hidden' && type !== 'checkbox' && type !== 'radio' && type !== 'search' && !placeholder.toLowerCase().includes('search')) {
                    foundInputs.push(el);
                }
            }
        }
        
        // If we found any valid inputs, the LAST one is most likely our income field 
        // (since it's lower in the DOM than any remaining header elements)
        if (foundInputs.length > 0) {
            incomeInput = foundInputs[foundInputs.length - 1];
            targetFrame = frame;
            break;
        }
    }

    if (incomeInput) {
        await incomeInput.scrollIntoViewIfNeeded().catch(() => {});
        await incomeInput.click({ force: true });
        
        // Clear using multiple methods to be safe with LWC
        await incomeInput.press('Control+A');
        await incomeInput.press('Backspace');
        await incomeInput.fill('');
        
        // Type the amount
        await incomeInput.pressSequentially(incomeAmount, { delay: 100 });
        console.log(`✓ Income declared: ${incomeAmount}`);
    } else {
        console.log('⚠ Could not find Monthly Income input field');
    }

    // Proceed
    let proceedClicked = false;
    const btn = targetFrame.getByRole('button', { name: proceedButton || 'Proceed', exact: true }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true });
        console.log(`✓ Clicked Proceed button in frame`);
        proceedClicked = true;
    } 

    if (!proceedClicked) {
        await this.clickButton(proceedButton);
    }
    
    await this.waitFor(2000);
    await this.checkForErrors();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION: Screen 2 — Fill Income Additional Details
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fill all fields on the Income Additional Details screen and click Proceed.
   *
   * @param data.primaryIncome       - Monthly Applicant Primary Income
   * @param data.applicantOtherIncome - Monthly Applicant Other Income
   * @param data.householdOtherIncome - Monthly Household Other Income
   * @param data.householdObligations - Monthly Household Obligations (default '0')
   * @param data.gender              - Gender value to select (e.g. 'Male')
   * @param data.maritalStatus       - Marital Status value (e.g. 'Single', 'Married')
   * @param data.panNumber           - PAN number string (e.g. 'HFHPP1234D')
   * @param data.proceedButton       - Label of the Proceed button (default 'Proceed')
   *
   * NOTE: sum(primaryIncome + applicantOtherIncome + householdOtherIncome)
   *       MUST equal the income entered on the previous Income Declaration page,
   *       otherwise the app shows the validation error:
   *       "Sum of income details in first three fields should be equal to
   *        Income entered on the previous page."
   */
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

    const proceed = data.proceedButton || 'Proceed';

    if (data.primaryIncome !== undefined) {
      if (await this.loc_primaryIncome.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.loc_primaryIncome.fill(data.primaryIncome);
        console.log(`✓ Monthly Applicant Primary Income: ${data.primaryIncome}`);
      }
    }

    if (data.applicantOtherIncome !== undefined) {
      if (await this.loc_applicantOtherIncome.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_applicantOtherIncome.fill(data.applicantOtherIncome);
        console.log(`✓ Monthly Applicant Other Income: ${data.applicantOtherIncome}`);
      }
    }

    if (data.householdOtherIncome !== undefined) {
      if (await this.loc_householdOtherIncome.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_householdOtherIncome.fill(data.householdOtherIncome);
        console.log(`✓ Monthly Household Other Income: ${data.householdOtherIncome}`);
      }
    }

    if (data.householdObligations !== undefined) {
      if (await this.loc_householdObligations.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_householdObligations.fill(data.householdObligations);
        console.log(`✓ Monthly Household Obligations: ${data.householdObligations}`);
      }
    }

    if (data.gender) {
      if (await this.loc_genderDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_genderDropdown.selectOption({ label: data.gender });
        console.log(`✓ Gender: ${data.gender}`);
      }
    }

    if (data.maritalStatus) {
      if (await this.loc_maritalStatusDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_maritalStatusDropdown.selectOption({ label: data.maritalStatus });
        console.log(`✓ Marital Status: ${data.maritalStatus}`);
      }
    }

    if (data.panNumber) {
      if (await this.loc_panInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_panInput.fill(data.panNumber);
        console.log(`✓ PAN Number: ${data.panNumber}`);
      }
    }

    await this.clickButton(proceed);
    await this.waitFor(3000);
    await this.checkForErrors();
    console.log('✓ Proceeded from Income Additional Details');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION: Screen 3 — Fill Household Member Details
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fill all fields on the Household Member Details screen.
   *
   * @param data.relationship       - Relationship with Applicant (e.g. 'Spouse')
   * @param data.firstName          - First Name as per ID Proof
   * @param data.lastName           - Last Name as per ID Proof
   * @param data.mobile             - Household Mobile No. (10 digits)
   * @param data.dob                - Date of Birth in format 'YYYY-MM-DD'
   * @param data.gender             - Gender (e.g. 'Male', 'Female')
   * @param data.pinCode            - 6-digit Pin Code
   * @param data.identityType       - Identity Type to select ('PAN', 'Voter Id', etc.)
   * @param data.identificationNumber - ID number string matching the selected identity type
   * @param data.initiateDeclaration - if true, clicks "Initiate Income Declaration → Click here"
   * @param data.proceedButton      - Proceed button label (default 'Proceed')
   */
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
    await this.page.waitForTimeout(2000);

    const proceed = data.proceedButton || 'Proceed';

    if (data.relationship) {
      if (await this.loc_relationshipDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.loc_relationshipDropdown.selectOption({ label: data.relationship });
        console.log(`✓ Relationship: ${data.relationship}`);
      }
    }

    if (data.firstName !== undefined) {
      if (await this.loc_hhFirstName.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhFirstName.fill(data.firstName);
        console.log(`✓ First Name: ${data.firstName}`);
      }
    }

    if (data.lastName !== undefined) {
      if (await this.loc_hhLastName.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhLastName.fill(data.lastName);
        console.log(`✓ Last Name: ${data.lastName}`);
      }
    }

    if (data.mobile !== undefined) {
      if (await this.loc_hhMobile.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhMobile.fill(data.mobile);
        console.log(`✓ Household Mobile: ${data.mobile}`);
      }
    }

    if (data.dob !== undefined) {
      if (await this.loc_hhDob.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhDob.fill(data.dob);
        console.log(`✓ Date of Birth: ${data.dob}`);
      }
    }

    if (data.gender) {
      if (await this.loc_hhGender.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhGender.selectOption({ label: data.gender });
        console.log(`✓ Gender: ${data.gender}`);
      }
    }

    if (data.pinCode !== undefined) {
      if (await this.loc_hhPinCode.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_hhPinCode.fill(data.pinCode);
        console.log(`✓ Pin Code: ${data.pinCode}`);
      }
    }

    if (data.identityType) {
      if (await this.loc_identityType.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.loc_identityType.selectOption({ label: data.identityType });
        console.log(`✓ Identity Type: ${data.identityType}`);
        await this.page.waitForTimeout(1000); // allow dynamic field to appear
      }
    }

    if (data.identificationNumber !== undefined) {
      if (await this.loc_identificationNumber.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.loc_identificationNumber.fill(data.identificationNumber);
        console.log(`✓ Identification Number: ${data.identificationNumber}`);
      }
    }

    if (data.initiateDeclaration) {
      await this.clickInitiateIncomeDeclaration();
    }

    await this.clickButton(proceed);
    await this.waitFor(3000);
    await this.checkForErrors();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION: Initiate Income Declaration
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Click the "Initiate Income Declaration → Click here" link
   * visible at the bottom of the Household Member Details screen.
   */
  async clickInitiateIncomeDeclaration(): Promise<void> {
    const initiateText = this.page.locator('text=Initiate Income Declaration').first();
    const isVisible = await initiateText.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      console.log('✓ "Initiate Income Declaration" section visible');
    } else {
      console.log('⚠ "Initiate Income Declaration" section not found — skipping');
      return;
    }
    if (await this.loc_initiateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.loc_initiateLink.click({ force: true });
      await this.waitFor(3000);
      console.log('✓ Clicked "Click here" → Initiate Income Declaration triggered');
    } else {
      console.log('⚠ "Click here" link not found on Household Member page');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION: Check for hard error banner
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Assert that no hard SLDS error banner is showing on the page.
   * Returns true if no error, false if error present.
   */
  async hasNoErrorBanner(): Promise<boolean> {
    const visible = await this.loc_errorBanner.isVisible({ timeout: 1000 }).catch(() => false);
    return !visible;
  }

  /**
   * Skip income declaration (if already filled)
   */
  async proceed(proceedButton: string): Promise<void> {
    console.log('===== Skip Income Declaration =====');
    await this.clickButton(proceedButton);
    await this.checkForErrors();
  }
}

