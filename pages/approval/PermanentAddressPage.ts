import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Permanent Address Page Object
 * Handles Stage: Permanent Address (after Approval Details / Additional Details)
 */
export class PermanentAddressPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: Screen Verification
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * Verify if currently on Permanent Address screen
   */
  async isCurrentScreen(): Promise<boolean> {
    const actual = await this.getCurrentScreen().catch(() => '');
    const expectedValues = ['Permanent Address', 'Permanent'];
    return expectedValues.some(exp => actual.includes(exp));
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Navigate to Permanent Address via Navigation Menu
  // ─────────────────────────────────────────────────────────────────
  async navigateToPermanentAddress(): Promise<void> {
    console.log('===== Navigate to Permanent Address =====');

    // 1. Wait for URL to leave searchmain
    try {
      await this.page.waitForFunction(
        () => !window.location.href.includes('searchmain'),
        { timeout: 15000 }
      );
    } catch {
      console.log('⚠ URL still on searchmain');
    }

    // 2. Wait for Salesforce LWC network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(666).catch(() => { });

    // 3. Check if form component or proceed button is already present on screen
    const permanentAddressForm = await this.page.locator(
      'c-permanent-address-reinvent, c-permanent-address-reinvent div.mainStaticProceedNormalBox button, [name="pinCode"], input[placeholder*="Pin Code" i]'
    ).count().then(c => c > 0).catch(() => false);

    if (permanentAddressForm) {
      console.log('✓ Permanent Address form already on screen');
      return;
    }

    // 4. Retry loop — up to 3 attempts to click Permanent Address from menu
    let formFound = false;
    for (let attempt = 1; attempt <= 3 && !formFound; attempt++) {
      if (attempt > 1) {
        console.log(`↩ Retry attempt ${attempt}/3 for hamburger...`);
        await this.page.waitForTimeout(1000).catch(() => { });
      }

      // Find the "..." button
      const dotsBtn = this.page.locator(
        "//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]"
      );
      const dotsBtnCount = await dotsBtn.count().catch(() => 0);

      if (dotsBtnCount > 0) {
        await dotsBtn.first().scrollIntoViewIfNeeded().catch(() => { });
        await dotsBtn.first().click({ force: true });
        console.log('✓ Clicked Hamburger (...) menu button');
      } else {
        // Fallback: last breadcrumb button
        const lastBreadcrumb = this.page.locator("//button[@class='breadcrumb-button']").last();
        const lastCount = await lastBreadcrumb.count().catch(() => 0);
        if (lastCount > 0) {
          await lastBreadcrumb.scrollIntoViewIfNeeded().catch(() => { });
          await lastBreadcrumb.click({ force: true });
          console.log('✓ Clicked last breadcrumb button (fallback)');
        } else {
          console.log(`⚠ No breadcrumb button found on attempt ${attempt}`);
          continue;
        }
      }

      await this.page.waitForTimeout(500).catch(() => { });

      // Target ONLY scoped menu items to avoid clicking body text labels
      const menuItem = this.page.locator(
        `//div[contains(@class,'dropdown') or contains(@class,'menu') or @role='menu']//a[normalize-space(text())='Permanent Address'] | ` +
        `//div[contains(@class,'dropdown') or contains(@class,'menu') or @role='menu']//button[normalize-space(text())='Permanent Address'] | ` +
        `//div[contains(@class,'dropdown') or contains(@class,'menu') or @role='menu']//span[normalize-space(text())='Permanent Address'] | ` +
        `//a[@role='menuitem' and contains(., 'Permanent Address')] | ` +
        `//button[@role='menuitem' and contains(., 'Permanent Address')]`
      ).first();

      if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuItem.click({ force: true });
        console.log("✓ Clicked 'Permanent Address' from Hamburger menu");
        await this.page.waitForTimeout(1000).catch(() => { });
        formFound = true;
      } else {
        // Dismiss menu
        await this.page.keyboard.press('Escape').catch(() => { });
        await this.page.waitForTimeout(500).catch(() => { });

        // Check for specific breadcrumb link
        const breadcrumbLink = this.page.locator(
          "//div[contains(@class,'breadcrumb')]//a[normalize-space(text())='Permanent Address'] | " +
          "//div[contains(@class,'breadcrumb')]//button[normalize-space(text())='Permanent Address']"
        ).first();

        if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await breadcrumbLink.click({ force: true });
          console.log("✓ Clicked 'Permanent Address' breadcrumb link");
          await this.page.waitForTimeout(1000).catch(() => { });
          formFound = true;
        } else {
          console.log(`⚠ 'Permanent Address' navigation item not in menu on attempt ${attempt}`);
        }
      }
    }

    // 5. Verify form is now rendered
    console.log('⏳ Waiting for Permanent Address form to render...');
    await this.page.waitForTimeout(666).catch(() => { });

    const formVisible = await this.page.locator(
      'c-permanent-address-reinvent, c-permanent-address-reinvent div.mainStaticProceedNormalBox button, [name="pinCode"], input[placeholder*="Pin Code" i]'
    ).first().isVisible({ timeout: 8000 }).catch(() => false);

    if (formVisible) {
      console.log('✓ Permanent Address form is ready');
    } else {
      console.log('⚠ Permanent Address form not fully visible');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: Check if "Permanent Address same as Current Address" is checked
  // ─────────────────────────────────────────────────────────────────
  async isSameAsCurrentAddressChecked(): Promise<boolean> {
    const checkbox = this.page.locator(
      'input[type="checkbox"][name*="same" i], input[type="checkbox"][aria-label*="same" i], //label[contains(text(), "same")]/preceding-sibling::input[1]'
    ).first();

    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      return await checkbox.isChecked().catch(() => false);
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: Check if key fields are disabled (Auto-Filled)
  // ─────────────────────────────────────────────────────────────────
  async areFieldsDisabled(): Promise<boolean> {
    console.log('⏳ Checking if address fields are disabled...');

    const fields = [
      this.page.locator('c-permanent-address-reinvent input[name*="pin" i], c-permanent-address-reinvent input[placeholder*="pin" i]').first(),
      this.page.locator('c-permanent-address-reinvent input[name*="address" i], c-permanent-address-reinvent textarea').first(),
      this.page.locator('c-permanent-address-reinvent combobox, c-permanent-address-reinvent select').first(),
    ];

    let allDisabled = true;

    for (const field of fields) {
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isDisabled = await field.isDisabled({ timeout: 1000 }).catch(() => false);
        const isReadOnly = await field.evaluate((el: HTMLInputElement) => el.readOnly || el.hasAttribute('disabled')).catch(() => false);
        
        // Check if Salesforce LWC parent container marks field disabled
        const isParentDisabled = await field.evaluate((el: HTMLElement) => {
          const parent = el.closest('.slds-form-element, .inputBoxCss, lightning-input');
          return parent ? parent.classList.contains('slds-is-disabled') || parent.getAttribute('aria-disabled') === 'true' : false;
        }).catch(() => false);

        if (!isDisabled && !isReadOnly && !isParentDisabled) {
          allDisabled = false;
          break;
        }
      }
    }

    if (allDisabled) {
      console.log('✓ Address fields are correctly disabled/read-only (auto-filled)');
    } else {
      console.log('ℹ Address fields are editable');
    }

    return allDisabled;
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 4.5: Verify fields are editable
  // ─────────────────────────────────────────────────────────────────
  async verifyAddressLineIsEditable(): Promise<boolean> {
    console.log('⏳ Checking if address line is editable by modifying it...');
    const addressLineInput = this.page.locator('c-permanent-address-reinvent input[name*="address" i], c-permanent-address-reinvent textarea, input[name="addressLine1"]').first();
    
    const isVisible = await addressLineInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      console.log('⚠ Address line input not visible');
      return false;
    }

    const isDisabled = await addressLineInput.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log('⚠ Address line is disabled');
      return false;
    }

    // Attempt to backspace
    const initialValue = await addressLineInput.inputValue().catch(() => '');
    if (initialValue.length > 0) {
      await addressLineInput.focus();
      await this.page.keyboard.press('End');
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(500);
      const newValue = await addressLineInput.inputValue().catch(() => '');
      
      const success = newValue.length === initialValue.length - 1;
      
      // Optionally put the character back
      if (success) {
        const removedChar = initialValue.slice(-1);
        await addressLineInput.pressSequentially(removedChar);
      }
      
      return success;
    } else {
      // If empty, type a character
      await addressLineInput.fill('A');
      await this.page.waitForTimeout(500);
      const newValue = await addressLineInput.inputValue().catch(() => '');
      await addressLineInput.fill(''); // clear it back
      return newValue === 'A';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 5: Fill Pincode
  // ─────────────────────────────────────────────────────────────────
  async fillPincode(pincode: string): Promise<void> {
    console.log(`===== Fill Pincode: ${pincode} =====`);
    const pincodeInput = this.page.locator('[name="pincode"]');
    
    // Wait for it to be visible and enabled
    await pincodeInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click and clear if necessary
    await pincodeInput.scrollIntoViewIfNeeded();
    await pincodeInput.click({ clickCount: 3 }).catch(() => {});
    await pincodeInput.press('Backspace').catch(() => {});
    await this.page.waitForTimeout(200);

    // Type character by character
    await pincodeInput.fill('');
    await pincodeInput.pressSequentially(pincode, { delay: 150 });
    await this.page.waitForTimeout(1000);

    // Select from dropdown
    const matchingOption = this.page
      .locator('lightning-base-combobox-item, [role="option"], .slds-listbox__item, .slds-listbox__option, li')
      .filter({ hasText: new RegExp(pincode, 'i') })
      .filter({ visible: true })
      .first();

    const isOptionVisible = await matchingOption.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    
    if (isOptionVisible) {
      await matchingOption.click({ force: true });
      console.log(`✓ Selected pincode option from dropdown: ${pincode}`);
    } else {
      console.log(`⚠ Dropdown option for ${pincode} not found, proceeding with typed value`);
      await this.page.keyboard.press('Escape').catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 5.5: Fill Permanent Address Details
  // ─────────────────────────────────────────────────────────────────
  async fillPermanentAddressDetails(
    residanceType: string,
    pincode: string,
    houseNo: string,
    street: string,
    landmark: string,
    area: string,
    city: string,
    state: string,
    proofType: string,
    documentNumber: string
  ): Promise<void> {
    console.log('===== Fill Permanent Address Details =====');

    // 1. Residence Type
    const resType = this.page.locator('select[name="residenceType"], select').first();
    if (await resType.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resType.selectOption({ label: residanceType }).catch(async () => {
        await resType.selectOption({ value: residanceType }).catch(() => {});
      });
      await resType.dispatchEvent('change').catch(() => {});
    }

    // 2. Pincode
    await this.fillPincode(pincode);

    // 3. Wait for fields to become enabled (if auto-filling takes time)
    await this.page.waitForTimeout(2000);

    // 4. Fill text fields
    const fillField = async (locator: Locator, value: string) => {
      if (await locator.count().catch(() => 0) > 0 && await locator.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.first().isEditable({ timeout: 500 }).catch(() => false)) {
          await locator.first().fill(value);
          await locator.first().press('Tab');
        } else {
          console.log(`⚠ Field is disabled/not editable; skipping fill for value: ${value}`);
        }
      }
    };

    const houseNoInput = this.page.getByPlaceholder(/Enter House No/i).first().or(this.page.locator('input[name*="addressLine1" i]').first());
    await fillField(houseNoInput, houseNo);

    const streetInput = this.page.getByPlaceholder(/Enter Street/i).first().or(this.page.locator('input[name*="addressLine2" i]').first());
    await fillField(streetInput, street);

    const landmarkInput = this.page.getByPlaceholder(/Enter Landmark/i).first().or(this.page.locator('input[name*="addressLine3" i]').first());
    await fillField(landmarkInput, landmark);

    const areaInput = this.page.getByPlaceholder(/Enter Area/i).first().or(this.page.locator('input[name*="area" i]').first());
    await fillField(areaInput, area);

    const cityInput = this.page.getByPlaceholder(/Enter city/i).first().or(this.page.locator('input[name*="city" i]').first());
    await fillField(cityInput, city);

    const stateInput = this.page.getByPlaceholder(/Enter state/i).first().or(this.page.locator('input[name*="state" i]').first());
    await fillField(stateInput, state);

    // 5. Proof Type
    const proofTypeSelect = this.page.locator('select[name="poaType"], select[data-id="poaType"]').last()
      .or(this.page.locator('//label[contains(., "Proof Submitted")]/following::select[1]').first());
    if (await proofTypeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await proofTypeSelect.selectOption({ label: proofType }).catch(async () => {
        await proofTypeSelect.selectOption({ value: proofType }).catch(() => {});
      });
      await proofTypeSelect.dispatchEvent('change').catch(() => {});
    }

    // 6. Document Number
    const docNum = this.page.getByPlaceholder(/Enter POI\/OVD/i).first()
      .or(this.page.getByRole('textbox', { name: /Document Number/i }).first());
    if (await docNum.isVisible({ timeout: 1000 }).catch(() => false)) {
      const docVal = proofType.toLowerCase().includes('aadhaar') ? documentNumber.slice(-4) : documentNumber;
      await docNum.fill(docVal);
      await docNum.press('Tab');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 6: Check if Proceed button is visible
  // ─────────────────────────────────────────────────────────────────
  async isProceedButtonVisible(): Promise<boolean> {
    const proceedBtn = this.page.locator(
      'c-permanent-address-reinvent div.mainStaticProceedNormalBox button'
    ).or(this.page.getByRole('button', { name: /proceed/i })).first();

    return await proceedBtn.isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 6: Click Proceed button
  // ─────────────────────────────────────────────────────────────────
  async clickProceed(): Promise<void> {
    console.log('===== Permanent Address Proceed =====');

    // Directly targets the Proceed button inside c-permanent-address-reinvent
    const proceedBtn = this.page.locator(
      'c-permanent-address-reinvent div.mainStaticProceedNormalBox button'
    ).or(this.page.getByRole('button', { name: /proceed/i })).first();

    const isVisible = await proceedBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!isVisible) {
      throw new Error('Proceed button not found on Permanent Address page');
    }

    await proceedBtn.scrollIntoViewIfNeeded().catch(() => { });
    await proceedBtn.click({ force: true });
    console.log('✓ Clicked Proceed on Permanent Address');

    // Wait for navigation/network response
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(1000).catch(() => { });

    // Check for errors
    await this.checkForErrors();
    console.log('✓ Proceeded from Permanent Address');
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER: Get toast message if present
  // ─────────────────────────────────────────────────────────────────
  async getToastMessage(timeoutMs: number = 5000): Promise<string | null> {
    const selectors = [
      ".toastMessage",
      ".slds-notify_toast",
      "[role='alert']",
      ".slds-theme_error",
      ".forcePageError",
      ".pageLevelErrors",
      ".slds-form-element__help",
    ];

    const iterations = Math.ceil(timeoutMs / 200);
    for (let i = 0; i < iterations; i++) {
      for (const sel of selectors) {
        const els = this.page.locator(sel);
        const count = await els.count().catch(() => 0);
        for (let j = 0; j < count; j++) {
          const el = els.nth(j);
          if (await el.isVisible().catch(() => false)) {
            const text = await el.innerText().catch(() => '');
            if (text.trim().length > 0) {
              return text;
            }
          }
        }
      }
      await this.page.waitForTimeout(200).catch(() => { });
    }

    return null;
  }
}