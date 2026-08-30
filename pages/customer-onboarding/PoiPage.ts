//import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import type { PoiData } from '../../types/customer.types';
import { expect, Locator, Page } from '@playwright/test';


/**
 * POI Page Object
 * Handles Proof of Identity details
 */
export class PoiPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  public normalizeComparisonValue(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  private normalizeExcelDate(value: string): string {
    if (!value || !value.trim()) return value;

    const trimmed = value.trim();
    const numericValue = Number(trimmed);

    if (Number.isFinite(numericValue) && trimmed.length <= 10 && numericValue >= 1) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const actualDate = new Date(excelEpoch.getTime() + numericValue * 86400000);

      const day = String(actualDate.getUTCDate()).padStart(2, '0');
      const month = String(actualDate.getUTCMonth() + 1).padStart(2, '0');
      const year = actualDate.getUTCFullYear();

      return `${year}-${month}-${day}`;
    }

    const normalized = trimmed.replace(/\//g, '-');
    const match = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return trimmed;
  }

  public async clearInputValue(locator: any, label: string): Promise<void> {
    await locator.click({ clickCount: 3 }).catch(() => locator.click());
    await locator.press('Control+A').catch(() => locator.press('Meta+A'));
    await locator.press('Backspace');
    console.log(`↺ Cleared existing ${label} value before refilling.`);
  }

  public async clearAndFillIfNeeded(locator: any, value: string, label: string, forceRefill: boolean = false): Promise<boolean> {
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

    const currentValue = (await locator.inputValue({ timeout: 1000 }).catch(() => '')).trim();

    if (!value || !value.trim()) {
      if (currentValue) {
        console.log(`⚠ ${label} was supplied as empty but already has value "${currentValue}". Clearing for required-field validation.`);
        await this.clearInputValue(locator, label);
      } else {
        console.log(`✓ ${label} is already empty; no action needed.`);
      }
      return false;
    }

    if (currentValue) {
      const normalizedCurrent = this.normalizeComparisonValue(currentValue);
      const normalizedExpected = this.normalizeComparisonValue(value);

      if (normalizedCurrent === normalizedExpected && !forceRefill) {
        console.log(`✓ ${label} already matches the expected value; proceeding without refill.`);
        return false;
      }

      console.log(`⚠ ${label} value mismatch. Existing: "${currentValue}" | Expected: "${value}". Clearing and refilling.`);
      await this.clearInputValue(locator, label);
    }

    await locator.fill(value, { timeout: 5000 });
    await locator.press('Tab');
    console.log(`✓ Entered ${label}: ${value}`);
    return true;
  }

  public async selectDropdownIfNeeded(label: string, value: string, forceRefill: boolean = false): Promise<boolean> {
    if (!value || !value.trim()) return false;

    const normalizedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let finalDropdown: any = null;

    const directSelect = this.page.locator('select').filter({
      has: this.page.locator('option', { hasText: new RegExp(value, 'i') })
    }).first();

    if (await directSelect.count()) {
      finalDropdown = directSelect;
    }

    if (!finalDropdown) {
      // Build label aliases — e.g. "POI Type" also matches "POI/OVD Type" in the app
      const labelAliases = [normalizedLabel];
      if (/poi.*type/i.test(label)) labelAliases.push('POI/OVD Type', 'POI\\/OVD Type');

      const candidates = [
        this.page.getByRole('combobox', { name: new RegExp(normalizedLabel, 'i') }).first(),
        this.page.getByLabel(new RegExp(normalizedLabel, 'i')).first(),
        this.page.locator('label').filter({ hasText: new RegExp(normalizedLabel, 'i') }).locator('..').locator('select, [role="combobox"]').first(),
        // Alias: POI/OVD Type
        this.page.locator('select').filter({ has: this.page.locator('option', { hasText: new RegExp(value, 'i') }) }).first(),
        this.page.locator('label').filter({ hasText: /POI\/OVD Type/i }).locator('..').locator('select, [role="combobox"]').first(),
        this.page.locator('//label[contains(text(),"POI") and contains(text(),"Type")]/following::select[1]').first(),
      ];

      for (const candidate of candidates) {
        const exists = await candidate.count().catch(() => 0);
        if (!exists) continue;
        const visible = await candidate.isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          finalDropdown = candidate;
          break;
        }
      }
    }

    if (!finalDropdown) {
      const allSelects = this.page.locator('select');
      const total = await allSelects.count().catch(() => 0);
      for (let i = 0; i < total; i++) {
        const select = allSelects.nth(i);
        const opts = await select.locator('option').allTextContents().catch(() => []);
        if (opts.some(option => new RegExp(value, 'i').test(option))) {
          finalDropdown = select;
          break;
        }
      }
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

      if (normalizedCurrent === normalizedExpected && !forceRefill) {
        console.log(`✓ ${label} already matches the expected value; proceeding without refill.`);
        return false;
      }

      console.log(`⚠ ${label} value mismatch. Existing: "${existingText}" | Expected: "${value}". Re-selecting.`);
    }

    try {
      await finalDropdown.selectOption({ label: value }, { timeout: 5000 });
    } catch {
      try {
        await finalDropdown.selectOption({ value: value }, { timeout: 5000 });
      } catch {
        try {
          await finalDropdown.click();
          const option = this.page.locator('option', { hasText: new RegExp(value, 'i') }).first();
          if (await option.count()) {
            await option.click({ timeout: 5000 });
          } else {
            throw new Error('No option match found');
          }
        } catch {
          console.warn(`⚠ Could not select ${value} in ${label}; skipping.`);
          return false;
        }
      }
    }

    console.log(`✓ Selected ${value} from ${label}`);
    return true;
  }

  private async enterDOB(dob: string): Promise<boolean> {
    const normalizedDob = this.normalizeExcelDate(dob);
    if (!normalizedDob || !normalizedDob.trim()) return false;

    const candidateLocators = [
      this.page.getByRole('textbox', { name: /date of birth|dob/i }).first(),
      this.page.getByPlaceholder(/date of birth|dob|date/i).first(),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'date of birth')]/following::input[1]"),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dob')]/following::input[1]"),
      this.page.locator("//input[@type='date']").first(),
    ];

    let input: any = null;
    for (const locator of candidateLocators) {
      if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
        input = locator;
        break;
      }
    }

    if (!input) {
      throw new Error('POI DOB input not found');
    }

    const currentValue = (await input.inputValue().catch(() => '')).trim();
    if (currentValue) {
      const normalizedCurrent = this.normalizeComparisonValue(currentValue);
      const normalizedExpected = this.normalizeComparisonValue(normalizedDob);

      if (normalizedCurrent === normalizedExpected) {
        console.log('✓ POI DOB already matches the expected value; proceeding without refill.');
        return false;
      }

      console.log(`⚠ POI DOB mismatch. Existing: "${currentValue}" | Expected: "${normalizedDob}". Clearing and refilling.`);
      await this.clearInputValue(input, 'POI DOB');
    }

    await input.click();
    await input.fill(normalizedDob);
    await this.page.keyboard.press('Tab');
    console.log(`✓ Entered POI DOB: ${normalizedDob}`);
    return true;
  }

  private async enterExpiryDate(expiryDate: string): Promise<void> {
    if (!expiryDate || !expiryDate.trim()) return;

    const normalizedExpiryDate = this.normalizeExcelDate(expiryDate);
    const candidateLocators = [
      this.page.getByRole('textbox', { name: /expiry date|date of expiry|valid till|passport expiry/i }).first(),
      this.page.getByPlaceholder(/expiry|valid till|date of expiry|passport expiry/i).first(),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'expiry date')]/following::input[1]"),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'date of expiry')]/following::input[1]"),
      this.page.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'valid till')]/following::input[1]"),
      this.page.locator('input[type="date"]').nth(1),
      this.page.locator('input[type="date"]').first(),
    ];

    let input: any = null;
    for (const locator of candidateLocators) {
      const exists = await locator.count().catch(() => 0);
      if (!exists) continue;
      const visible = await locator.isVisible({ timeout: 1500 }).catch(() => false);
      if (visible) {
        input = locator;
        break;
      }
    }

    if (!input) {
      const dateInputs = this.page.locator('input[type="date"]');
      const total = await dateInputs.count().catch(() => 0);
      if (total > 0) {
        input = dateInputs.nth(total - 1);
      }
    }

    if (!input) {
      throw new Error('POI Expiry Date input not found');
    }

    const currentValue = (await input.inputValue().catch(() => '')).trim();
    if (currentValue) {
      const normalizedCurrent = this.normalizeComparisonValue(currentValue);
      const normalizedExpected = this.normalizeComparisonValue(normalizedExpiryDate);

      if (normalizedCurrent === normalizedExpected) {
        console.log('✓ POI Expiry Date already matches the expected value; proceeding without refill.');
        return;
      }

      console.log(`⚠ POI Expiry Date mismatch. Existing: "${currentValue}" | Expected: "${normalizedExpiryDate}". Clearing and refilling.`);
      await this.clearInputValue(input, 'POI Expiry Date');
    }

    await input.click();
    await input.fill(normalizedExpiryDate);
    await this.page.keyboard.press('Tab');
    console.log(`✓ Entered POI Expiry Date: ${normalizedExpiryDate}`);
  }

  /**
   * Fill POI (Proof of Identity) details
   */
  async fillPoiDetails(
    firstName: string,
    middleName: string,
    lastName: string,
    poiType: string,
    poiNumber: string,
    gender: string,
    dob: string,
    employmentType: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== POI Page =====');
    await this.waitFor(600); // Wait for the page to load properly
    await this.verifyCurrentScreen('POI');

    const firstNameInput = this.page.getByRole('textbox', { name: /first name/i }).first();
    const lastNameInput = this.page.getByRole('textbox', { name: /last name/i }).first();
    const poiNumberInput = this.page.getByRole('textbox', { name: /poi|ovd|number/i }).first();

    let changed = false;

    changed = await this.clearAndFillIfNeeded(firstNameInput, firstName, 'First Name') || changed;

    const middleNameInput = this.page.getByRole('textbox', { name: /middle name/i }).first();
    changed = await this.clearAndFillIfNeeded(middleNameInput, middleName, 'Middle Name') || changed;

    changed = await this.clearAndFillIfNeeded(lastNameInput, lastName, 'Last Name') || changed;
    changed = await this.selectDropdownIfNeeded('POI Type', poiType) || changed;
    changed = await this.clearAndFillIfNeeded(poiNumberInput, poiNumber, 'POI Number') || changed;
    changed = await this.selectDropdownIfNeeded('Gender', gender) || changed;
    changed = await this.enterDOB(dob) || changed;
    changed = await this.selectDropdownIfNeeded('Employment Type', employmentType) || changed;

    if (changed) {
      console.log('ℹ POI Details were modified. Attempting to check POI Changed Flag...');

      const lwcCheckbox = this.page.locator('lightning-input').filter({ hasText: /poi.*changed/i }).first();
      if (await lwcCheckbox.isVisible({ timeout: 1500 }).catch(() => false)) {
        const inputNode = lwcCheckbox.locator('input');
        if (!(await inputNode.isChecked().catch(() => false))) {
          // Click the label inside the LWC component to properly trigger LWC change events
          await lwcCheckbox.locator('label').click({ force: true }).catch(() => lwcCheckbox.click({ force: true }));
          console.log('✓ Checked POI Changed Flag checkbox (via LWC component)');
        } else {
          console.log('✓ POI Changed Flag checkbox already checked');
        }
      } else {
        // Fallback to standard checkbox
        const standardCheckbox = this.page.getByRole('checkbox', { name: /poi.*changed/i }).first();
        if (await standardCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
          if (!(await standardCheckbox.isChecked().catch(() => false))) {
            // Try to check standard way, or dispatch click if it's visually hidden
            await standardCheckbox.check({ force: true }).catch(() => standardCheckbox.dispatchEvent('click'));
            console.log('✓ Checked POI Changed Flag checkbox (standard)');
          }
        } else {
          // Ultimate fallback: finding the text and clicking its sibling input/label
          const labelEl = this.page.locator('label').filter({ hasText: /poi.*changed/i }).first();
          if (await labelEl.isVisible({ timeout: 1000 }).catch(() => false)) {
            await labelEl.click({ force: true });
            console.log('✓ Checked POI Changed Flag checkbox (by label click)');
          }
        }
      }
    }

    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ POI completed');
  }

  /**
 * Fill POI (Proof of Identity) details with Passport
 */
  async fillPoiDetailsWithPassport(
    firstName: string,
    middleName: string,
    lastName: string,
    poiType: string,
    poiNumber: string,
    expiryDate: string,
    gender: string,
    dob: string,
    employmentType: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== POI Page =====');
    await this.waitFor(1000); // Wait for the page to load properly
    await this.verifyCurrentScreen('POI');

    const firstNameInput = this.page.getByRole('textbox', { name: /first name/i }).first();
    const lastNameInput = this.page.getByRole('textbox', { name: /last name/i }).first();
    const poiNumberInput = this.page.getByRole('textbox', { name: /poi|ovd|number/i }).first();

    await this.clearAndFillIfNeeded(firstNameInput, firstName, 'First Name');

    const middleNameInput = this.page.getByRole('textbox', { name: /middle name/i }).first();
    await this.clearAndFillIfNeeded(middleNameInput, middleName, 'Middle Name');

    await this.clearAndFillIfNeeded(lastNameInput, lastName, 'Last Name');

    await this.selectDropdownIfNeeded('POI Type', poiType);

    await this.clearAndFillIfNeeded(poiNumberInput, poiNumber, 'POI Number');

    await this.enterExpiryDate(expiryDate);

    await this.selectDropdownIfNeeded('Gender', gender);
    await this.enterDOB(dob);
    await this.selectDropdownIfNeeded('Employment Type', employmentType);

    await this.waitFor(300);
    const poiChangedInput = this.page.locator('input[data-id="isPoiChanged"], input[name*="poiChanged"], input[type="checkbox"]').filter({ has: this.page.locator('..') }).first();
    const checkbox = this.page.locator('input[data-id="isPoiChanged"]').first();
    if (await checkbox.count()) {
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (!isChecked) {
        await checkbox.check({ force: true });
      }
    } else if (await poiChangedInput.count()) {
      const isChecked = await poiChangedInput.isChecked().catch(() => false);
      if (!isChecked) {
        await poiChangedInput.check({ force: true });
      }
    }
    console.log('POI changed checkbox handled');

    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ POI completed');
  }
}
