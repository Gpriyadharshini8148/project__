import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * POA Page Object
 * Handles Proof of Address details
 */
export class PoaPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  public normalizeComparisonValue(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  private async selectAddAddressManually(): Promise<void> {
    const candidates = [
      this.page.getByText(/add address manually|manual/i).first(),
      this.page.locator('label').filter({ hasText: /add address manually|manual/i }).first(),
      this.page.locator('input[type="radio"]').filter({ has: this.page.locator('..') }).first(),
      this.page.getByRole('radio', { name: /add address manually|manual/i }).first(),
    ];

    for (let attempt = 0; attempt < 5; attempt++) {
      for (const candidate of candidates) {
        const exists = await candidate.count().catch(() => 0);
        if (!exists) continue;

        const visible = await candidate.isVisible({ timeout: 1500 }).catch(() => false);
        if (!visible) continue;

        try {
          const radioInput = candidate.locator('input[type="radio"]').first();
          if (await radioInput.count().catch(() => 0)) {
            const checked = await radioInput.isChecked().catch(() => false);
            if (!checked) {
              await radioInput.check({ force: true }).catch(async () => {
                await radioInput.click({ force: true });
              });
            }
            const isNowChecked = await radioInput.isChecked().catch(() => false);
            if (isNowChecked) {
              console.log('✓ Selected Add Address Manually');
              return;
            }
          }

          await candidate.click({ force: true }).catch(() => candidate.evaluate((el: any) => el.click()));
          const elementChecked = await candidate.evaluate((el: any) => {
            const input = el.tagName === 'INPUT' ? el : el.querySelector('input[type="radio"]');
            return input ? input.checked : false;
          }).catch(() => false);

          if (elementChecked) {
            console.log('✓ Selected Add Address Manually');
            return;
          }
        } catch {
          // Keep retrying until the radio becomes available.
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Add Address Manually radio was not found or could not be selected on the POA page.');
  }

  public async clearInputValue(locator: any, label: string): Promise<void> {
    await locator.click({ clickCount: 3 }).catch(() => locator.click());
    await locator.press('Control+A').catch(() => locator.press('Meta+A'));
    await locator.press('Backspace');
    console.log(`↺ Cleared existing ${label} value before refilling.`);
  }

  public async clearAndFillIfNeeded(locator: any, value: string, label: string): Promise<void> {
    const count = await locator.count().catch(() => 0);
    if (!count) {
      console.warn(`⚠ ${label} input not found; skipping fill.`);
      return;
    }

    const visible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) {
      console.warn(`⚠ ${label} input is not visible; skipping fill.`);
      return;
    }

    const editable = await locator.isEditable({ timeout: 1000 }).catch(() => false);
    if (!editable) {
      console.warn(`⚠ ${label} input is disabled/not editable; skipping fill.`);
      return;
    }

    const currentValue = (await locator.inputValue({ timeout: 1000 }).catch(() => '')).trim();

    if (!value || !value.trim()) {
      if (currentValue) {
        console.log(`⚠ ${label} was supplied as empty but already has value "${currentValue}". Clearing for required-field validation.`);
        await this.clearInputValue(locator, label);
      } else {
        console.log(`✓ ${label} is already empty; no action needed.`);
      }
      return;
    }

    if (currentValue) {
      const normalizedCurrent = this.normalizeComparisonValue(currentValue);
      const normalizedExpected = this.normalizeComparisonValue(value);

      if (normalizedCurrent === normalizedExpected) {
        console.log(`✓ ${label} already matches the expected value; proceeding without refill.`);
        return;
      }

      console.log(`⚠ ${label} value mismatch. Existing: "${currentValue}" | Expected: "${value}". Clearing and refilling.`);
      await this.clearInputValue(locator, label);
    }

    await locator.fill(value, { timeout: 5000 });
    await locator.press('Tab');
    console.log(`✓ Entered ${label}: ${value}`);
  }

  public async selectDropdownIfNeeded(label: string, value: string): Promise<void> {
    if (!value || !value.trim()) return;

    const candidates = [
      this.page.getByRole('combobox', { name: new RegExp(label, 'i') }).first(),
      this.page.getByRole('button', { name: new RegExp(label, 'i') }).first(),
      this.page.locator('label').filter({ hasText: new RegExp(label, 'i') }).locator('..').locator('select, [role="combobox"]').first(),
      this.page.locator('select').filter({ has: this.page.locator('option', { hasText: new RegExp(value, 'i') }) }).first(),
    ];

    let finalDropdown: any = null;
    for (const candidate of candidates) {
      const exists = await candidate.count().catch(() => 0);
      if (exists) {
        finalDropdown = candidate;
        break;
      }
    }

    if (!finalDropdown) {
      console.warn(`⚠ ${label} dropdown not found; skipping selection.`);
      return;
    }

    const visible = await finalDropdown.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) {
      console.warn(`⚠ ${label} dropdown is not visible; skipping selection.`);
      return;
    }

    const currentValue = (await finalDropdown.inputValue({ timeout: 1000 }).catch(() => '')).trim();
    const selectedText = (await finalDropdown.locator('option:checked').textContent({ timeout: 1000 }).catch(() => '')).trim();
    const existingText = currentValue || selectedText;

    if (existingText) {
      const normalizedCurrent = this.normalizeComparisonValue(existingText);
      const normalizedExpected = this.normalizeComparisonValue(value);

      if (normalizedCurrent === normalizedExpected) {
        console.log(`✓ ${label} already matches the expected value; proceeding without refill.`);
        return;
      }

      console.log(`⚠ ${label} value mismatch. Existing: "${existingText}" | Expected: "${value}". Re-selecting.`);
    }

    try {
      await finalDropdown.selectOption({ label: value }, { timeout: 5000 });
    } catch {
      try {
        await finalDropdown.selectOption({ value: value }, { timeout: 5000 });
      } catch {
        console.warn(`⚠ Could not select ${value} in ${label}; skipping.`);
        return;
      }
    }

    console.log(`✓ Selected ${value} from ${label}`);
  }

  /**
   * Fill POA (Proof of Address) details
   */
  async fillPoaDetails(
    residanceType: string,
    zipCode: string,
    bflBranch: string,
    addressLine1: string,
    addressLine2: string,
    addressLine3: string,
    areaLocality: string,
    landmark: string,
    city: string,
    state: string,
    poaType: string,
    poaNumber: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== POA Page =====');
    await this.verifyCurrentScreen('POA');

    // Always select Add Address Manually for the POA flow; do not silently fall back to Current Address.
    await this.selectAddAddressManually();

    await this.clickButton('Proceed');
    await this.page.getByText('Address Line 1 *', { exact: true }).waitFor({ state: 'visible', timeout: 20000 });
    console.log('✓ Reached POA details form and waiting for Address Line 1 field.');

    // --- FIX FOR RESIDENCE TYPE DROPDOWN ---
    const residenceTypeDropdown = this.page.locator(
      'select[name="residence"], select[id^="residenceType"], select.select-dealer'
    ).first();

    const residenceTypeExists = await residenceTypeDropdown.count().catch(() => 0);

    if (residenceTypeExists) {
      await residenceTypeDropdown.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      const normalizedExpected = this.normalizeComparisonValue(residanceType);
      
      // Value/Label map based on exact DOM option values
      const mapping: Record<string, string> = {
        selfowned: 'Self Owned',
        owned: 'Self Owned',
        parental: 'Owned by Parent',
        ownedbyparent: 'Owned by Parent',
        rented: 'Rented',
        companyprovided: 'Company Provided',
        sharingpg: 'Sharing/PG',
        pg: 'Sharing/PG',
      };

      const targetValue = mapping[normalizedExpected] || residanceType;

      const currentValue = (await residenceTypeDropdown.inputValue({ timeout: 1000 }).catch(() => '')).trim();
      const normalizedCurrent = this.normalizeComparisonValue(currentValue || '');

      if (normalizedCurrent && normalizedCurrent === this.normalizeComparisonValue(targetValue)) {
        console.log(`✓ Residence Type already matches "${targetValue}"; proceeding without refill.`);
      } else {
        const disabled = await residenceTypeDropdown.evaluate((el: HTMLSelectElement) => el.disabled || el.hasAttribute('disabled')).catch(() => false);
        if (disabled) {
          console.warn(`⚠ Residence Type dropdown is disabled/locked; cannot change value to "${targetValue}". Skipping.`);
        } else {
          try {
            await residenceTypeDropdown.selectOption({ label: targetValue }, { timeout: 3000 });
          } catch {
            await residenceTypeDropdown.selectOption({ value: targetValue }, { timeout: 3000 }).catch(async () => {
              // Fallback: iterate over options to match by normalized innerText
              const optionElements = await residenceTypeDropdown.locator('option').allInnerTexts().catch(() => []);
              const matchingOption = optionElements.find(
                (opt) => this.normalizeComparisonValue(opt) === this.normalizeComparisonValue(targetValue)
              );
              if (matchingOption) {
                await residenceTypeDropdown.selectOption({ label: matchingOption.trim() }, { timeout: 3000 }).catch(() => {
                  console.warn(`⚠ Could not select "${matchingOption.trim()}" (dropdown might have locked dynamically). Skipping.`);
                });
              } else {
                console.warn(`⚠ No matching option found for "${targetValue}". Skipping.`);
              }
            });
          }

          // Trigger change event for LWC framework reactivity
          await residenceTypeDropdown.dispatchEvent('change').catch(() => {});
          console.log(`✓ Attempted to select "${targetValue}" from Residence Type`);
        }
      }
    } else {
      console.warn('⚠ Residence Type select not found; skipping selection.');
    }
    // --- END FIX ---

    // Broader zip code locator - POA form uses different attribute names than role/name
    const zipCodeInput = this.page.getByRole('textbox', { name: /zip code/i }).first()
      .or(this.page.locator('input[placeholder*="zip" i], input[placeholder*="pincode" i], input[placeholder*="postal" i]').first())
      .or(this.page.locator('input[aria-label*="zip" i], input[aria-label*="pincode" i]').first())
      .or(this.page.locator('input[name*="zip" i], input[name*="pincode" i], input[name*="postal" i]').first())
      .or(this.page.locator('input[id*="zip" i], input[id*="pincode" i]').first());
    await this.clearAndFillIfNeeded(zipCodeInput, zipCode, 'Zip Code');
    await this.selectDropdownIfNeeded('BFL Branch', bflBranch);

    await this.clearAndFillIfNeeded(this.page.getByRole('textbox', { name: /address line 1/i }).first(), addressLine1, 'Address Line 1');
    await this.clearAndFillIfNeeded(this.page.getByRole('textbox', { name: /address line 2/i }).first(), addressLine2, 'Address Line 2');
    await this.clearAndFillIfNeeded(this.page.getByRole('textbox', { name: /address line 3/i }).first(), addressLine3, 'Address Line 3');

    await this.clearAndFillIfNeeded(this.page.getByRole('textbox', { name: /area|locality/i }).first(), areaLocality, 'Area/Locality');

    const landmarkInput = this.page.getByRole('textbox', { name: 'Enter Landmark' });
    await this.clearAndFillIfNeeded(landmarkInput, landmark, 'Landmark');

    await this.clearAndFillIfNeeded(this.page.getByRole('textbox', { name: /city/i }).first(), city, 'City');

    const stateField = this.page.getByRole('textbox', { name: /state/i }).first();
    const stateInput = this.page.locator('input[aria-label*="State" i], input[name*="state" i], input[placeholder*="State" i]').first();
    if (await stateField.count().catch(() => 0) || await stateInput.count().catch(() => 0)) {
      const finalStateField = await stateField.count().catch(() => 0) ? stateField : stateInput;
      await this.clearAndFillIfNeeded(finalStateField, state, 'State');
    } else {
      await this.selectDropdownIfNeeded('State', state);
    }

    await this.selectDropdownIfNeeded('POA Type', poaType);

    const normalizedPoaNumber =
      this.normalizeComparisonValue(poaType).includes('aadhaar') && /^\d{12}$/.test((poaNumber || '').trim())
        ? (poaNumber || '').trim().slice(-4)
        : (poaNumber || '').trim();

    const poaNumberInput = this.page.locator(
      'input[aria-label*="POA Number" i], input[aria-label*="Document Number" i], input[name*="poa" i], input[name*="document" i], input[placeholder*="POA Number" i], input[placeholder*="Document Number" i]'
    ).first();

    if (await poaNumberInput.count().catch(() => 0)) {
      await this.clearAndFillIfNeeded(poaNumberInput, normalizedPoaNumber, 'POA Number');
    } else {
      const poaNumberTextbox = this.page.getByRole('textbox', { name: /poa number|document number/i }).first();
      if (await poaNumberTextbox.count().catch(() => 0)) {
        await this.clearAndFillIfNeeded(poaNumberTextbox, normalizedPoaNumber, 'POA Number');
      } else {
        console.warn('⚠ POA Number field not found; attempting final fallback.');
        const finalPoaField = this.page.locator('input').filter({ has: this.page.locator('..') }).first();
        if (await finalPoaField.count().catch(() => 0)) {
          await this.clearAndFillIfNeeded(finalPoaField, normalizedPoaNumber, 'POA Number');
        }
      }
    }

    await this.waitFor(1000);
    // Proceed
    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ POA completed');
  }

  async proceed(proceedButton: string): Promise<void> {
    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
  }
}