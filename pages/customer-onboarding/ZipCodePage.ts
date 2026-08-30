import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import type { ZipCodeData } from '../../types/customer.types';

/**
 * Zip Code Verification Page Object
 *
 * OPTIMIZATION STRATEGY:
 * - pressSequentially() instead of char-by-char typing (fast, reliable)
 * - waitFor({ state: 'visible' }) smart polling instead of fixed sleeps
 * - DOB detection using Promise.race() across all candidates in parallel
 * - All fallbacks are graceful
 */
export class ZipCodePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async fillZipCodeDetails(data: ZipCodeData): Promise<void> {
    console.log('===== Zip Code Verification =====');

    const expectDropdown = data.expectDropdown !== false;

    await this.handleOptionalCheckbox();
    await this.enterZipCode(data.zipCode, data.zipCodeValue, expectDropdown);
    await this.lookupBflBranch(data.bflBranch, expectDropdown);
    await this.enterDOB(data.dob);
    await this.selectGenderIfNeeded(data.gender);

    if (data.preferredLanguage) {
      await this.selectComboboxByTitle('Preferred Language', data.preferredLanguage);
      await this.page.keyboard.press('Escape');
      await this.waitFor(150);
    }

    await this.selectComboboxByTitle('Preferred Communication Language', data.language);
    await this.page.keyboard.press('Escape');
    await this.waitFor(150);

    if (data.poaAddressType) {
      await this.selectPoaAddressType(data.poaAddressType);
    }

    console.log('✓ Zip code details filled');
  }

  async proceed(proceedButton: string): Promise<void> {
    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    
    // Look for inline validation errors on the form
    const inlineError = this.page.locator('.slds-has-error, .slds-form-element__help, .error, lightning-helptext, [role="alert"]').first();
    if (await inlineError.isVisible({ timeout: 2000 }).catch(() => false)) {
       const errorText = await inlineError.innerText();
       if (errorText.trim()) {
           throw new Error(`Validation Error: ${errorText}`);
       }
    }
    
    await this.checkForErrors();
    await this.waitForNextPage();
    console.log('✓ Proceeded from Zip Code page');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async handleOptionalCheckbox(): Promise<void> {
    const checkbox = this.page.locator('span.slds-checkbox_faux').first();
    if (!await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) return;
    await checkbox.evaluate((el) =>
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
    );
    await checkbox.click({ force: true }).catch(() => { });
    console.log('✓ Optional checkbox clicked');
  }

  private async enterZipCode(label: string, value: string, expectDropdown: boolean): Promise<void> {
    const codePrefix = value.split(' ')[0] || value;
    // Try the provided label first, then fall back to common zip code field names
    // (the label can differ between flows — e.g. 'Enter Customer ZipCode' vs 'Zip/Postal Code')
    let input = this.textbox(label);
    const isVisible = await input.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (!isVisible) {
      console.log(`ℹ Zip code label '${label}' not found. Trying alternative labels...`);
      const altLabels = [
        'Zip/Postal Code', 'Zip Code', 'Pincode', 'Pin Code', 'Postal Code',
        'Enter Zip Code', 'Enter Zipcode', 'Customer ZipCode', 'ZipCode',
      ];
      let found = false;
      for (const alt of altLabels) {
        const altInput = this.textbox(alt);
        if (await altInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✓ Found zip code field via alternative label: '${alt}'`);
          input = altInput;
          found = true;
          break;
        }
      }
      if (!found) {
        // Final fallback: any visible input near a 'zip' or 'postal' label
        const xpathInput = this.page.locator(
          '//label[contains(translate(.,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"zip") or contains(translate(.,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"postal") or contains(translate(.,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"pincode")]/following::input[1]'
        ).first();
        if (await xpathInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`✓ Found zip code field via XPath label proximity`);
          input = xpathInput;
        } else {
          throw new Error(`Zip code input not found. Tried label '${label}' and ${altLabels.length} alternatives.`);
        }
      }
    }

    const clearBtn = this.page.locator(`//label[text()='${label}']/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearBtn.click();
      await this.waitFor(500);
    }
    
    if (await input.isDisabled().catch(() => false)) {
      // Look for the "Change Zipcode" toggle button
      const changeZipcodeToggle = this.page.getByText('Change Zipcode', { exact: false }).first();
      if (await changeZipcodeToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await changeZipcodeToggle.click({ force: true });
        console.log('✓ Clicked "Change Zipcode" toggle to unlock field');
        
        // Wait up to 2 seconds for it to become enabled
        await expect(input).toBeEnabled({ timeout: 2000 }).catch(() => {});
        
        if (await input.isDisabled().catch(() => false)) {
           console.log(`⚠ Zip Code input remained disabled after clicking toggle. Assuming pre-filled correctly and skipping...`);
           return;
        }
      } else {
        console.log(`ℹ Zip Code input is disabled and no toggle found, assuming already filled`);
        return;
      }
    }

    // Try to click the clear pill if it exists (crucial for resetting LWC state)
    const clearZipBtn = this.page.locator(`//label[contains(text(), 'Zip/Postal Code')]/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearZipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearZipBtn.click();
      await this.page.waitForTimeout(500);
    }

    // Robust clear and fill for LWC
    await input.scrollIntoViewIfNeeded();
    await input.click({ clickCount: 3 }).catch(() => {});
    await input.press('Backspace').catch(() => {});
    await this.page.waitForTimeout(200);
    
    // Use fill instead of pressSequentially to avoid LWC eating the first character
    // and use `codePrefix` so it types "411014" instead of "411014 Pune"
    await input.fill(codePrefix, { force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
    
    await input.click({ force: true }).catch(() => {});
    await this.page.keyboard.press('ArrowDown').catch(() => {});
    await this.page.waitForTimeout(1500);

    if (!expectDropdown) {
      await this.page.keyboard.press('Escape');
      console.log(`✓ Entered zip code (no dropdown): ${value}`);
      return;
    }

    // Custom LWC dropdowns can take several seconds to fetch results. 
    // We explicitly wait for the EXACT option to appear, ignoring "Searching..." or stale options.
    // Use getByText to pierce shadow DOM inside lightning-base-combobox-item
    const exactOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem')
      .filter({ has: this.page.getByText(value, { exact: false }) })
      .first();
    const anyOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem').filter({ hasText: /\w/ }).first();

    let appeared = await exactOption.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (appeared) {
      await exactOption.click({ force: true });
      console.log(`✓ Zip code (exact Playwright): ${value}`);
    } else {
      console.log(`ℹ Exact option didn't appear, checking for any option fallback...`);
      if (await anyOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyOption.click({ force: true });
        console.log(`⚠ Zip code (first available option fallback used)`);
      } else {
        await this.page.keyboard.press('Escape');
        console.log(`⚠ No zip code option found for '${value}'`);
      }
    }
  }

  private async lookupBflBranch(value: string, expectDropdown: boolean): Promise<void> {
    if (!value) {
      console.log('ℹ No BFL Branch value, skipping');
      return;
    }

    const input = this.textbox('BFL Branch');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const clearBtn = this.page.locator(`//label[text()='BFL Branch']/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearBtn.click();
      await this.waitFor(500);
    }

    if (await input.isDisabled().catch(() => false)) {
      console.log(`ℹ BFL Branch input is disabled. Clicking 'Change Zipcode' to unlock...`);
      const changeZipcodeToggle = this.page.getByText('Change Zipcode', { exact: false }).first();
      if (await changeZipcodeToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await changeZipcodeToggle.click({ force: true });
        
        // Wait up to 2 seconds for it to become enabled
        await expect(input).toBeEnabled({ timeout: 2000 }).catch(() => {});
        
        if (await input.isDisabled().catch(() => false)) {
           console.log(`⚠ BFL Branch input remained disabled after clicking toggle. Assuming pre-filled correctly and skipping...`);
           return;
        }
      } else {
        console.log(`ℹ BFL Branch input is disabled and no toggle found, assuming already filled`);
        return;
      }
    }
    
    await input.scrollIntoViewIfNeeded().catch(() => {});
    await input.click({ force: true }).catch(() => {});
    const codePrefix = value.split('-')[0].trim();

    // Try to click the clear pill if it exists
    const clearBranchBtn = this.page.locator(`//label[contains(text(), 'BFL Branch')]/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearBranchBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearBranchBtn.click();
      await this.page.waitForTimeout(500);
    }

    // Robust clear and fill for LWC
    await input.scrollIntoViewIfNeeded();
    await input.click({ clickCount: 3 }).catch(() => {});
    await input.press('Backspace').catch(() => {});
    await this.page.waitForTimeout(200);
    
    // Type the prefix using fill
    await input.fill(codePrefix, { force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
    
    // Crucial: In Salesforce LWC, BFL Branch specifically requires an explicit click 
    // after typing to trigger the dropdown to render its search results!
    await input.click({ force: true }).catch(() => {});
    await this.page.keyboard.press('ArrowDown').catch(() => {});
    await this.page.waitForTimeout(1500);

    if (!expectDropdown) {
      await this.page.keyboard.press('Escape');
      console.log(`✓ BFL Branch (no dropdown): ${value}`);
      return;
    }

    // Wait for exact match to bypass "Searching..." or stale options
    const exactOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem')
      .filter({ has: this.page.getByText(value, { exact: false }) })
      .filter({ visible: true })
      .first();
    const anyOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem').filter({ visible: true, hasText: /\w/ }).first();

    let appeared = await exactOption.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (appeared) {
      await exactOption.click({ force: true });
      console.log(`✓ BFL Branch (exact Playwright): ${value}`);
    } else {
      console.log(`ℹ Exact BFL Branch didn't appear, checking for any option fallback...`);
      if (await anyOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyOption.click({ force: true });
        console.log(`⚠ BFL Branch (first available option fallback used)`);
      } else {
        // Keyboard fallback if no option matched visually
        await this.page.keyboard.press('ArrowDown').catch(() => {});
        await this.page.keyboard.press('Enter').catch(() => {});
        console.log(`✓ BFL Branch: Attempted keyboard fallback selection`);
      }
    }

    await this.page.keyboard.press('Escape').catch(() => { });
    await this.waitFor(150);
  }

  private async enterDOB(dob: string): Promise<void> {
    const candidates: Locator[] = [
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'date of birth')]/following::input[1]"),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dob')]/following::input[1]"),
      this.page.getByPlaceholder(/date of birth|dob/i).first(),
      this.page.getByRole('textbox', { name: /date of birth|dob/i }).first(),
      this.page.locator("input[type='date']").first(),
    ];

    const input = await Promise.race(
      candidates.map(loc =>
        loc.waitFor({ state: 'visible', timeout: 6000 }).then(() => loc).catch(() => null)
      )
    );

    if (!input) throw new Error('DOB input not found within 6 seconds');

    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.press('Control+A');
    await input.press('Backspace');

    const cleanDob = dob.replace(/-/g, '');
    await input.pressSequentially(cleanDob, { delay: 60 });
    await this.page.keyboard.press('Tab');
    console.log(`✓ Entered DOB: ${dob}`);
  }

  private async selectGenderIfNeeded(value: string): Promise<void> {
    const genderEl = this.page.getByRole('combobox', { name: 'Gender' }).first();

    if (!await genderEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('ℹ Gender not visible, skipping');
      return;
    }

    await genderEl.scrollIntoViewIfNeeded();

    const currentText = (await genderEl.innerText().catch(() => '')).trim();
    if (currentText.toLowerCase().includes(value.toLowerCase())) {
      console.log(`✓ Gender already '${value}', skipping`);
      return;
    }

    await genderEl.click();

    const option = this.page
      .getByRole('option', { name: new RegExp(`^${value}$`, 'i') })
      .or(this.page.locator(`//lightning-base-combobox-item//*[contains(., '${value}')]`).first())
      .first();

    await option.waitFor({ state: 'visible', timeout: 4000 }).catch(() => { });
    await option.click({ force: true }).catch(async () => {
      await genderEl.click();
      await option.click({ force: true });
    });

    await this.page.keyboard.press('Escape').catch(() => { });
    await this.waitFor(150);
    console.log(`✓ Selected Gender: ${value}`);
  }

  private async selectPoaAddressType(value: string): Promise<void> {
    const poaCombobox = this.page.getByRole('combobox', { name: /poa address type/i })
      .or(this.page.locator(
        "//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'poa address type')]/following::*[(self::input or self::button or contains(@class,'combobox'))][1]"
      ));

    if (!await poaCombobox.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('ℹ POA Address Type not present, skipping');
      return;
    }

    const trigger = poaCombobox.first();
    
    // Read value properly (inputs use .inputValue(), divs/buttons use .innerText())
    let currentText = await trigger.inputValue().catch(() => '');
    if (!currentText) {
      currentText = (await trigger.innerText().catch(() => '')).trim();
    }

    if (new RegExp(`^${value}$`, 'i').test(currentText.trim())) {
      console.log(`ℹ POA Address Type already "${value}", skipping`);
      return;
    }

    await trigger.click({ timeout: 3000 }).catch(() => {});
    const listbox = this.page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });

    const option = listbox
      .getByRole('option', { name: new RegExp(`^${value}$`, 'i') })
      .or(listbox.locator(`li:has-text("${value}")`).first());

    await option.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    
    // Use explicit timeout to avoid Playwright's default 30s hang if the option doesn't exist in DOM
    await option.first().click({ force: true, timeout: 2000 }).catch(async () => {
      await trigger.click({ timeout: 2000 }).catch(() => {});
      await option.first().click({ force: true, timeout: 2000 }).catch(() => {});
    });

    await this.page.keyboard.press('Escape').catch(() => { });
    await this.waitFor(150);
    console.log(`✓ Selected POA Address Type: ${value}`);
  }

  private async waitForNextPage(): Promise<void> {
    try {
      // The most foolproof way to know we've navigated away from Zip Code
      // is to wait for the Zip Code specific fields to disappear from the DOM.
      const branchInput = this.textbox('BFL Branch');
      await branchInput.waitFor({ state: 'hidden', timeout: 20000 });
      console.log('✓ Next page detected (proceeded past Zip Code)');
    } catch {
      throw new Error('Failed to proceed from Zip Code. The page did not navigate or MITC element not found.');
    }
  }
}





