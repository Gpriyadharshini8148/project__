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

  public async selectAddAddressManually(): Promise<void> {
    const candidates = [
      this.page.getByText(/add address manually|manual address|enter address manually|add manually|manual/i).first(),
      this.page.locator('label').filter({ hasText: /add address manually|manual address|enter address manually|add manually|manual/i }).first(),
      this.page.getByRole('radio', { name: /add address manually|manual address|enter address manually|add manually|manual/i }).first(),
      this.page.locator('input[type="radio"]').filter({ has: this.page.locator('..') }).first(),
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
        console.log(`⚠ ${label} already matches the expected value; but refilling to trigger UI events.`);
      } else {
        console.log(`⚠ ${label} value mismatch. Existing: "${currentValue}" | Expected: "${value}". Clearing and refilling.`);
      }
      await this.clearInputValue(locator, label);
    }

    await locator.fill(value, { timeout: 5000 });
    await locator.press('Tab');
    console.log(`✓ Entered ${label}: ${value}`);
  }

  public async selectDropdownIfNeeded(label: string, value: string): Promise<boolean> {
    if (!value || !value.trim()) return false;

    const labelAliases = [label];
    if (/poa.*type/i.test(label) || /proof/i.test(label)) {
      labelAliases.push('Current Address Proof Submitted', 'Current Address Proof', 'Proof Submitted', 'POA Type');
    }

    let finalDropdown: any = null;
    for (const alias of labelAliases) {
      const candidates = [
        this.page.getByRole('combobox', { name: new RegExp(alias, 'i') }).first(),
        this.page.getByRole('button', { name: new RegExp(alias, 'i') }).first(),
        this.page.locator('label').filter({ hasText: new RegExp(alias, 'i') }).locator('..').locator('select, [role="combobox"]').first(),
        this.page.locator('select').filter({ has: this.page.locator('option', { hasText: new RegExp(value, 'i') }) }).first(),
      ];

      for (const candidate of candidates) {
        const exists = await candidate.count().catch(() => 0);
        if (exists) {
          finalDropdown = candidate;
          break;
        }
      }
      if (finalDropdown) break;
    }

    if (!finalDropdown) {
      console.warn(`⚠ ${label} dropdown not found; skipping selection.`);
      return false;
    }

    const visible = await finalDropdown.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) {
      console.warn(`⚠ ${label} dropdown is not visible; skipping selection.`);
      return false;
    }

    const currentValue = (await finalDropdown.inputValue({ timeout: 1000 }).catch(() => '')).trim();
    const selectedText = (await finalDropdown.locator('option:checked').textContent({ timeout: 1000 }).catch(() => '')).trim();
    const existingText = currentValue || selectedText;

    if (existingText) {
      const normalizedCurrent = this.normalizeComparisonValue(existingText);
      const normalizedExpected = this.normalizeComparisonValue(value);

      if (normalizedCurrent === normalizedExpected) {
        console.log(`⚠ ${label} already matches the expected value; but re-selecting to trigger UI events.`);
      } else {
        console.log(`⚠ ${label} value mismatch. Existing: "${existingText}" | Expected: "${value}". Re-selecting.`);
      }
    }

    try {
      await finalDropdown.selectOption({ label: value }, { timeout: 5000 });
    } catch {
      try {
        await finalDropdown.selectOption({ value: value }, { timeout: 5000 });
      } catch {
        console.warn(`⚠ Could not select ${value} in ${label}; skipping.`);
        return false;
      }
    }

    console.log(`✓ Selected ${value} from ${label}`);
    return true;
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
    proceedButton: string,
    areaBelt?: string
  ): Promise<void> {
    console.log('===== POA Page =====');
    await this.verifyCurrentScreen(['POA', 'Current Address']);

    // Check if the address form is already open (e.g. Address Line 1 visible)
    const addressLine1Field = this.page.getByRole('textbox', { name: /address line 1/i }).first()
      .or(this.page.locator('textarea[name*="addressLine1" i], input[name*="addressLine1" i]').first());

    const isFormAlreadyOpen = await addressLine1Field.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isFormAlreadyOpen) {
      // Select Add Address Manually for the POA flow
      await this.selectAddAddressManually();
      await this.clickButton('Proceed');
      await this.page.getByText('Address Line 1', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
      console.log('✓ Reached POA details form and waiting for Address Line 1 field.');
    } else {
      console.log('✓ Address details form already visible; proceeding to fill fields.');
    }

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
        console.log(`⚠ Residence Type already matches "${targetValue}"; but re-selecting to trigger UI events.`);
      }
      
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
    
    if (areaBelt) {
      await this.page.waitForTimeout(2000); // give time for area belt to populate if dynamic
      
      const areaBeltDropdown = this.page.getByRole('combobox', { name: /area belt/i }).first()
        .or(this.page.locator('select[name*="areaBelt" i], select[id*="areaBelt" i]').first())
        .or(this.page.locator('lightning-combobox').filter({ hasText: /Area Belt/i }).locator('input, button').first())
        .or(this.page.locator('//label[contains(normalize-space(.), "Area Belt")]/following::input[1]').first());

      if (await areaBeltDropdown.count().catch(() => 0) && await areaBeltDropdown.isVisible({ timeout: 1000 }).catch(() => false)) {
        try {
          // Try native select first
          await areaBeltDropdown.selectOption({ label: areaBelt }, { timeout: 2000 });
          console.log(`✓ Selected Area Belt (native): ${areaBelt}`);
        } catch {
          try {
            // Try custom LWC combobox click-and-select
            await areaBeltDropdown.click({ force: true });
            await this.page.waitForTimeout(1000);
            
            const option = this.page.getByRole('option', { name: new RegExp(areaBelt, 'i') }).first()
              .or(this.page.locator(`lightning-base-combobox-item`).filter({ hasText: new RegExp(areaBelt, 'i') }).first())
              .or(this.page.locator(`//span[contains(text(), "${areaBelt}")]`).first());
            
            if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
               await option.click({ force: true });
               console.log(`✓ Selected Area Belt (custom option): ${areaBelt}`);
            } else {
               // Try typing into it if it's searchable
               if (await areaBeltDropdown.isEditable().catch(() => false)) {
                 await areaBeltDropdown.fill(areaBelt);
                 await this.page.waitForTimeout(1000);
                 await this.page.keyboard.press('ArrowDown');
                 await this.page.keyboard.press('Enter');
                 console.log(`✓ Typed Area Belt (autocomplete): ${areaBelt}`);
               } else {
                 console.warn(`⚠ Could not select Area Belt options and field is not editable.`);
               }
            }
          } catch (e) {
            console.warn(`⚠ Failed to interact with Area Belt dropdown: ${e}`);
          }
        }
      } else {
        console.warn('⚠ Area Belt field not found or not visible.');
      }
    }

    await this.selectDropdownIfNeeded('BFL Branch', bflBranch);

    const addressLine1Input = this.page.getByRole('textbox', { name: /house no.*address line 1|address line 1/i }).first()
      .or(this.page.locator('textarea[name*="addressLine1" i], input[name*="addressLine1" i], textarea[aria-label*="Address Line 1" i], input[aria-label*="Address Line 1" i], textarea[placeholder*="Address Line 1" i], input[placeholder*="Address Line 1" i]').first())
      .or(this.page.locator('//label[contains(normalize-space(.), "Address Line 1") or contains(normalize-space(.), "Address Line1")]/following::input[1] | //label[contains(normalize-space(.), "Address Line 1") or contains(normalize-space(.), "Address Line1")]/following::textarea[1]').first());
    const addressLine2Input = this.page.getByRole('textbox', { name: /street.*address line 2|address line 2/i }).first()
      .or(this.page.locator('textarea[name*="addressLine2" i], input[name*="addressLine2" i], textarea[aria-label*="Address Line 2" i], input[aria-label*="Address Line 2" i], textarea[placeholder*="Address Line 2" i], input[placeholder*="Address Line 2" i]').first())
      .or(this.page.locator('//label[contains(normalize-space(.), "Address Line 2")]/following::input[1] | //label[contains(normalize-space(.), "Address Line 2")]/following::textarea[1]').first());
    const addressLine3Input = this.page.getByRole('textbox', { name: /landmark\/address line 3|address line 3/i }).first()
      .or(this.page.locator('textarea[name*="addressLine3" i], input[name*="addressLine3" i], textarea[aria-label*="Address Line 3" i], input[aria-label*="Address Line 3" i], textarea[placeholder*="Address Line 3" i], input[placeholder*="Address Line 3" i]').first())
      .or(this.page.locator('//label[contains(normalize-space(.), "Address Line 3")]/following::input[1] | //label[contains(normalize-space(.), "Address Line 3")]/following::textarea[1]').first());

    await this.clearAndFillIfNeeded(addressLine1Input, addressLine1, 'Address Line 1');
    await this.clearAndFillIfNeeded(addressLine2Input, addressLine2, 'Address Line 2');
    await this.clearAndFillIfNeeded(addressLine3Input, addressLine3, 'Address Line 3');

    const areaCandidates = [
      this.page.getByRole('textbox', { name: 'Enter Area' }),
      this.page.getByPlaceholder('Enter Area', { exact: true }),
      this.page.getByPlaceholder('Enter Area'),
      this.page.getByRole('textbox', { name: /^Area\s*\*?$/i }),
      this.page.locator('input[name*="area" i], input[placeholder*="Area" i]'),
      this.page.locator('//label[contains(normalize-space(.), "Area")]/following::input[1]')
    ];

    let foundAreaLocality: any = null;
    for (const candidate of areaCandidates) {
      const c = await candidate.count().catch(() => 0);
      for (let i = 0; i < c; i++) {
        const item = candidate.nth(i);
        if (await item.isVisible({ timeout: 500 }).catch(() => false)) {
          foundAreaLocality = item;
          break;
        }
      }
      if (foundAreaLocality) break;
    }

    if (foundAreaLocality) {
      await this.clearAndFillIfNeeded(foundAreaLocality, areaLocality, 'Area');
    } else {
      console.warn('⚠ Area input not found or not visible; skipping fill.');
    }

    // Landmark field - direct fill with focus, clear, and type
    const landmarkInput = this.page.locator('input[name="landmark"]').first();
    
    if (await landmarkInput.count().catch(() => 0)) {
      try {
        await landmarkInput.waitFor({ state: 'visible', timeout: 3000 });
        await landmarkInput.focus();
        await landmarkInput.evaluate((el: any) => el.value = '');
        await landmarkInput.type(landmark, { delay: 50 });
        await landmarkInput.press('Tab');
        console.log(`✓ Entered Landmark: ${landmark}`);
      } catch (e) {
        console.warn(`⚠ Direct landmark fill failed: ${e}. Trying generic method...`);
        await this.clearAndFillIfNeeded(landmarkInput, landmark, 'Landmark');
      }
    } else {
      console.warn('⚠ Landmark field not found; skipping.');
    }

    const cityInput = this.page.getByRole('textbox', { name: /city/i }).first()
      .or(this.page.locator('input[name*="city" i], input[aria-label*="City" i], input[placeholder*="City" i]').first());
    await this.clearAndFillIfNeeded(cityInput, city, 'City');

    const stateField = this.page.getByRole('textbox', { name: /state/i }).first();
    const stateInput = this.page.locator('input[aria-label*="State" i], input[name*="state" i], input[placeholder*="State" i]').first();
    if (await stateField.count().catch(() => 0) || await stateInput.count().catch(() => 0)) {
      const finalStateField = await stateField.count().catch(() => 0) ? stateField : stateInput;
      await this.clearAndFillIfNeeded(finalStateField, state, 'State');
    } else {
      await this.selectDropdownIfNeeded('State', state);
    }

    // Special handling for POA Type - it's critical to fill before proceeding
    const poaTypeSelected = await this.selectDropdownIfNeeded('POA Type', poaType);
    if (!poaTypeSelected) {
      console.warn('⚠ POA Type selection via standard method failed; trying alternative selectors...');
      const poaTypeDropdown = this.page.locator('select[data-id="poaType"]').first()
        .or(this.page.locator('select[name*="poa" i], select[name*="document" i]').first())
        .or(this.page.locator('//h1[contains(text(), "POA Type")]/following::select[1] | //h1[contains(text(), "POA Type")]/following::*[1]//select').first());
      
      if (await poaTypeDropdown.count().catch(() => 0)) {
        try {
          await poaTypeDropdown.selectOption({ label: poaType }, { timeout: 5000 }).catch(async () => {
            await poaTypeDropdown.selectOption({ value: poaType }, { timeout: 5000 });
          });
          console.log(`✓ Selected ${poaType} from POA Type via alternative selector`);
        } catch (e) {
          console.warn(`⚠ POA Type selection failed even with alternative selector: ${e}`);
        }
      }
    }

    const normalizedPoaNumber =
      this.normalizeComparisonValue(poaType).includes('aadhaar') && /^\d{12}$/.test((poaNumber || '').trim())
        ? (poaNumber || '').trim().slice(-4)
        : (poaNumber || '').trim();

    const poaNumberInput = this.page.locator(
      'input[aria-label*="POA Number" i], input[aria-label*="Document Number" i], input[name*="poa" i], input[name*="document" i], input[placeholder*="POA Number" i], input[placeholder*="Document Number" i], input[aria-label*="UIDAI" i], input[placeholder*="UIDAI" i]'
    ).first();

    if (await poaNumberInput.count().catch(() => 0)) {
      await this.clearAndFillIfNeeded(poaNumberInput, normalizedPoaNumber, 'POA Number');
    } else {
      const poaNumberTextbox = this.page.getByRole('textbox', { name: /poa number|document number|uidai|digit/i }).first();
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