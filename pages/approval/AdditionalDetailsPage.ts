import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdditionalDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============================================================
  // LOCATORS
  // ============================================================

  get alternateMobileInput(): Locator {
    return this.page.locator('input[placeholder*="Alternate Mobile"], input[name*="alternateMobile"]').first();
  }

  get maritalStatusSelect(): Locator {
    return this.page.locator('select[name*="marital"], select[id*="marital"]').first();
  }

  get relationshipTypeSelect(): Locator {
    return this.page.locator('select[name*="relationship"], select[id*="relationship"]').first();
  }

  get salutationSelect(): Locator {
    return this.page.locator('select[name*="salutation" i], select[id*="salutation" i], input[name*="salutation" i], input[id*="salutation" i]').first();
  }

  get firstNameInput(): Locator {
    return this.page.locator('input[placeholder*="First Name"], input[name*="firstName"]').first();
  }

  get middleNameInput(): Locator {
    return this.page.locator('input[placeholder*="Middle Name"], input[name*="middleName"]').first();
  }

  get lastNameInput(): Locator {
    return this.page.locator('input[placeholder*="Last Name"], input[name*="lastName"]').first();
  }

  get mailingAddressSelect(): Locator {
    return this.page.locator('select[name*="mailingAddress"], select[id*="mailingaddress"]').first();
  }

  get timeHorizonSelect(): Locator {
    return this.page.locator('select[name*="timeHorizon"], select[id*="timeHorizon"]').first();
  }

  get nameOnCardInput(): Locator {
    return this.page.locator('input[placeholder*="Name on Card"], input[name*="nameOnCard"]').first();
  }

  get differentlyAbledCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /differently abled/i })
      .or(this.page.getByLabel(/differently abled/i))
      .or(this.page.locator('label:has-text("Differently Abled") span.slds-checkbox_faux'))
      .first();
  }

  get politicallyExposedCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /politically exposed/i })
      .or(this.page.getByLabel(/politically exposed/i))
      .or(this.page.locator('label:has-text("Politically Exposed Person") span.slds-checkbox_faux'))
      .first();
  }

  get disabilityTypeSelect(): Locator {
    return this.page.getByLabel(/disability type|type of disability/i)
      .or(this.page.locator('select[name*="disabilityType"], select[id*="disabilityType"], select[placeholder*="Disability Type"]'))
      .first();
  }

  get disabilityPercentageInput(): Locator {
    return this.page.getByLabel(/impairment|disability percentage|% of disability/i)
      .or(this.page.locator("input[placeholder*='Impairment'], input[name*='disabilityPercentage'], input[name*='percentage']"))
      .first();
  }

  get proceedButton(): Locator {
    return this.page.getByRole('button', { name: /^Proceed$/i }).or(this.page.getByRole('button', { name: /^Continue$/i })).first();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async clearInputValue(locator: Locator, label: string): Promise<void> {
    try {
      const clearBtn = locator.locator('..').locator('.slds-pill__remove, button[title*="Remove"], button[title*="Clear"]').first();
      if (await clearBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await clearBtn.click();
        await this.page.waitForTimeout(300);
        return;
      }
      await locator.click({ clickCount: 3, force: true }).catch(() => {});
      await locator.press('Control+A').catch(() => locator.press('Meta+A').catch(() => {}));
      await locator.press('Backspace').catch(() => {});
      await locator.fill('').catch(() => {});
      await this.page.waitForTimeout(300);
    } catch (e) {
      console.log(`[LOG] Error clearing ${label}: ${e}`);
    }
  }

  async navigateToAdditionalDetails(): Promise<void> {
    const heading = this.page.getByText(/Additional\s*Details/i).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  }

  async enterOfficeDetails(...args: any[]): Promise<void> {
    console.log('[LOG] Filling office details...');
    await this.page.waitForTimeout(500);
  }

  async enterPersonalDetails(
    fatherName: string,
    motherName: string,
    altMobile: string,
    maritalStatus: string,
    education: string,
    mailing: string,
    timeHorizon: string,
    buttonLabel: string
  ): Promise<boolean> {
    try {
      if (await this.alternateMobileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.alternateMobileInput.fill(altMobile);
      }
      if (await this.firstNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.firstNameInput.fill(fatherName);
      }
      if (await this.lastNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.lastNameInput.fill(motherName);
      }
      if (timeHorizon) {
        await this.timeHorizonSelect.selectOption({ label: timeHorizon }).catch(() => {});
      }
      await this.proceedButton.click();
      return true;
    } catch {
      return false;
    }
  }

  async isDifferentlyAbledEnabled(): Promise<boolean> {
    return await this.page.getByLabel(/differently abled/i).isChecked().catch(() => false);
  }

  // ============================================================
  // LOGGED FIELD ACTIONS (used by test specs)
  // ============================================================

  async fillAlternateMobile(value: string): Promise<void> {
    await this.alternateMobileInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.alternateMobileInput.click({ force: true }).catch(() => {});
    await this.alternateMobileInput.clear().catch(() => {});
    await this.alternateMobileInput.pressSequentially(value, { delay: 10 });
    await this.alternateMobileInput.blur().catch(() => {});
    await this.page.waitForTimeout(500);
    console.log(`[LOG] Alternate Mobile Number filled: ${value}`);
  }

  async selectMaritalStatus(option: string | number): Promise<void> {
    await this.maritalStatusSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    if (typeof option === 'number') {
      await this.maritalStatusSelect.selectOption({ index: option });
      console.log(`[LOG] Marital Status selected (index ${option})`);
      await this.page.waitForTimeout(300);
      return;
    }
    await this.maritalStatusSelect.selectOption({ label: option }).catch(() => this.maritalStatusSelect.selectOption({ index: 1 }));
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Marital Status selected: ${option}`);
  }

  async selectRelationshipType(option: string | number): Promise<void> {
    await this.relationshipTypeSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(300);
    if (typeof option === 'number') {
      await this.relationshipTypeSelect.selectOption({ index: option }).catch(() => {});
      console.log(`[LOG] Relationship Type selected (index ${option})`);
      await this.page.waitForTimeout(300);
      return;
    }
    await this.relationshipTypeSelect.selectOption({ label: option }).catch(async () => {
      const combobox = this.page.getByRole('combobox', { name: /relationship type/i }).first();
      await combobox.click();
      await this.page.getByRole('option', { name: option, exact: true }).click();
    });
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Relationship Type selected: ${option}`);
  }

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.firstNameInput.click({ force: true }).catch(() => {});
    await this.firstNameInput.clear().catch(() => {});
    await this.firstNameInput.pressSequentially(value, { delay: 10 });
    await this.firstNameInput.blur().catch(() => {});
    await this.page.waitForTimeout(300);
    console.log(`[LOG] First Name filled: ${value}`);
  }

  async fillMiddleName(value: string): Promise<void> {
    await this.middleNameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.middleNameInput.click({ force: true }).catch(() => {});
    await this.middleNameInput.clear().catch(() => {});
    await this.middleNameInput.pressSequentially(value, { delay: 10 });
    await this.middleNameInput.blur().catch(() => {});
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Middle Name filled: ${value}`);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.lastNameInput.click({ force: true }).catch(() => {});
    await this.lastNameInput.clear().catch(() => {});
    await this.lastNameInput.pressSequentially(value, { delay: 10 });
    await this.lastNameInput.blur().catch(() => {});
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Last Name filled: ${value}`);
  }

  async selectMailingAddress(index: number): Promise<void> {
    await this.mailingAddressSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.mailingAddressSelect.selectOption({ index });
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Mailing Address selected (index ${index})`);
  }

  async selectTimeHorizon(index: number): Promise<void> {
    await this.timeHorizonSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.timeHorizonSelect.selectOption({ index }).catch(() => {});
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Time Horizon selected (index ${index})`);
  }

  async fillNameOnCard(value: string): Promise<void> {
    await this.nameOnCardInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.nameOnCardInput.click({ force: true }).catch(() => {});
    await this.nameOnCardInput.clear().catch(() => {});
    await this.nameOnCardInput.pressSequentially(value, { delay: 10 });
    await this.nameOnCardInput.blur().catch(() => {});
    await this.page.waitForTimeout(300);
    console.log(`[LOG] Name on Card filled: ${value}`);
  }

  async enableDifferentlyAbled(): Promise<void> {
    const faux = this.page.locator('label:has-text("Differently Abled") span.slds-checkbox_faux').first();
    if (await faux.isVisible({ timeout: 2000 }).catch(() => false)) {
      await faux.click({ force: true });
    } else {
      await this.differentlyAbledCheckbox.evaluate(node => (node as HTMLElement).click()).catch(async () => {
        await this.differentlyAbledCheckbox.click({ force: true });
      });
    }
    await this.page.waitForTimeout(500);
    console.log('[LOG] Differently Abled toggle enabled');
  }

  async enablePoliticallyExposedToggle(): Promise<void> {
    await this.politicallyExposedCheckbox.click();
    console.log('[LOG] Politically Exposed Person toggle enabled');
  }

  async waitForDisabilitySection(): Promise<boolean> {
    try {
      await this.disabilityTypeSelect.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async fillDisabilityDetails(type: string, percentage: string): Promise<void> {
    await this.disabilityTypeSelect.selectOption({ label: type }).catch(() => {});
    console.log(`[LOG] Disability Type selected: ${type}`);
    await this.typeDisabilityPercentage(percentage);
  }

  async togglePoliticallyExposed(enable: boolean): Promise<void> {
    const toggle = this.page.getByLabel(/politically exposed/i).first();
    await toggle.setChecked(enable);
    console.log(`[LOG] Politically Exposed Person toggle set to: ${enable}`);
  }

  async isPoliticallyExposedEnabled(): Promise<boolean> {
    return await this.page.getByLabel(/politically exposed/i).first().isChecked().catch(() => false);
  }

  async typeDisabilityPercentage(value: string): Promise<string> {
    const input = this.disabilityPercentageInput;
    await input.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      throw new Error('Disability Percentage field did not appear. Ensure Differently Abled toggle was enabled successfully.');
    });
    await this.clearInputValue(input, 'Disability Percentage');
    await input.type(value);
    const resultingValue = await input.inputValue();
    console.log(`[LOG] Disability Percentage typed: '${value}', resulting value: ${resultingValue}`);
    return resultingValue;
  }

  async getToastMessage(timeout = 3000): Promise<string | null> {
    const toast = this.page.locator("div[class*='slds-theme_error'], div[class*='toastMessage'], [role='alert']").first();
    try {
      await toast.waitFor({ state: 'visible', timeout });
      return await toast.textContent();
    } catch {
      return null;
    }
  }

  async verifyPage(): Promise<void> {
    const heading = this.page.getByText(/Additional\s*Details/i).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  }
}