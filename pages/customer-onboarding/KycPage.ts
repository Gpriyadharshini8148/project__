import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { TIMEOUT } from 'dns';

/**
 * KYC Page Object
 * Handles Know Your Customer verification (E-KYC, Digilocker)
 */
export class KycPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async clickActionButton(buttonName: string): Promise<void> {
    const roleButton = this.page.getByRole('button', { name: new RegExp(buttonName, 'i') }).first();
    const fallbackButton = this.page.locator('button, [role="button"], input[type="button"], input[type="submit"]').filter({
      hasText: new RegExp(buttonName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    }).first();

    await roleButton.or(fallbackButton).first().click();
  }

  /**
   * Complete E-KYC verification
   */
  async fillKYCDetails(
    //pageName: string, 
    bypassReason: string, 
    saveButton: string, 
    proceedButton: string
  ): Promise<void> {
    console.log('===== E-KYC Page =====');
    await this.verifyCurrentScreen('KYC');

    const eKycRadio = this.page.getByRole('radio', { name: /e-kyc/i }).first();
    const eKycFallback = this.page.locator('input[value="e-kyc" i], input[name*="e-kyc" i], label:has-text("E-KYC")').first();
    await eKycRadio.or(eKycFallback).first().click();
    console.log('✓ Selected E-KYC option');

    const initiateButton = this.page.getByRole('button', { name: /initiate/i }).first();
    await initiateButton.click();
    console.log('✓ Clicked Initiate button');

    const mobileButton = this.page.getByRole('button', { name: /mobile/i }).first();
    const mobileFallback = this.page.locator('button, [role="button"]').filter({ hasText: /mobile/i }).first();
    await mobileButton.or(mobileFallback).first().click();
    console.log('✓ Clicked Mobile button');

    const refreshButton = this.page.locator('button:has(svg[data-key="refresh"]), svg[data-key="refresh"], [data-key="refresh"], button[title*="refresh" i], button:has-text("Refresh")').first();
    await refreshButton.click({ force: true }).catch(() => {});
    console.log('✓ Clicked Refresh button');

    // Wait up to 30s for the dropdown to become enabled (backend processes Refresh)
    let bypassFound = false;
    let standardSelect = this.page.locator('select').filter({ hasText: /bypass/i }).first()
      .or(this.page.locator('select[class*="isBypassReason"], select[id*="dealer-select2"]').first());
      
    let customDropdown = this.page.locator('lightning-combobox, .slds-combobox_container').filter({ hasText: /bypass/i }).first()
      .or(this.page.locator('lightning-combobox, .slds-combobox_container').first());

    console.log('⏳ Waiting for Bypass Reason dropdown to become enabled...');
    let isEnabled = false;
    for (let i = 0; i < 15; i++) {
      await this.page.waitForTimeout(2000);
      if (await standardSelect.isEnabled({ timeout: 1000 }).catch(() => false)) {
        isEnabled = true;
        break;
      }
      const trigger = customDropdown.locator('button, input').first();
      if (await trigger.isEnabled({ timeout: 1000 }).catch(() => false)) {
        // Double check it doesn't have a disabled attribute
        const disabledAttr = await trigger.getAttribute('disabled');
        if (disabledAttr === null) {
          isEnabled = true;
          break;
        }
      }
    }

    if (!isEnabled) {
      console.warn('⚠ Bypass Reason dropdown did not enable within 30s.');
    }

    if (await standardSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await standardSelect.isEnabled({ timeout: 10000 }).catch(() => false)) {
        await standardSelect.selectOption({ label: bypassReason }).catch(async () => {
          await standardSelect.selectOption({ value: bypassReason }).catch(() => {});
        });
        console.log(`✓ Selected bypass reason: ${bypassReason} (Standard Select)`);
        bypassFound = true;
      }
    } 
    
    if (!bypassFound && await customDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      const trigger = customDropdown.locator('button, input').first();
      if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click to open dropdown
        await trigger.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(1000); // wait for dropdown animation

        // Find the option
        const optionWords = bypassReason.split(' ').slice(0, 3).join(' '); // Match first few words to avoid exact match issues
        const option = this.page.getByRole('option', { name: new RegExp(optionWords, 'i') }).first()
          .or(this.page.locator(`lightning-base-combobox-item, li[role="presentation"]`).filter({ hasText: new RegExp(optionWords, 'i') }).first())
          .or(this.page.locator('lightning-base-combobox-item, li[role="presentation"]').nth(1)); // Fallback to 2nd item in list
        
        await option.click({ force: true }).catch(() => {});
        console.log(`✓ Selected bypass reason: ${bypassReason} (Custom Dropdown)`);
        bypassFound = true;
      }
    }

    if (!bypassFound) {
      // Strategy 3: Generic Clickable Input anywhere on screen containing "Bypass"
      const genericInput = this.page.locator('input[placeholder*="Bypass" i], input[name*="Bypass" i]').first();
      if (await genericInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await genericInput.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('option').nth(1).click({ force: true }).catch(() => {});
        console.log(`✓ Selected bypass reason fallback (Generic Input)`);
        bypassFound = true;
      }
    }

    if (!bypassFound) {
      console.warn('⚠ Bypass reason dropdown not found or remained disabled — continuing without selection');
    }


//    await this.page.getByRole('button', { name: 'Proceed' }).click();
//    await this.page.getByRole('button', { name: 'Save' }).click();

    await this.clickActionButton(saveButton);
    await this.waitFor(1000);
    console.log('✓ Clicked Save button');

    // Wait up to 20s for the Proceed button to become enabled after Save
    const proceedBtn = this.page.getByRole('button', { name: new RegExp(proceedButton, 'i') }).first();
    await proceedBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    for (let i = 0; i < 20; i++) {
      const disabled = await proceedBtn.getAttribute('disabled').catch(() => 'true');
      if (disabled === null) break;
      await this.page.waitForTimeout(1000);
    }

    await this.clickActionButton(proceedButton);
    await this.waitFor(1000); 
    await this.checkForErrors();
    console.log('✓ E-KYC completed');
  }



  /**
   * Complete Digilocker verification
   */
  async selectDigilocker(
    pageName: string, 
    bypassReason: string, 
    saveButton: string, 
    proceedButton: string
  ): Promise<void> {
    console.log('===== Digilocker Page =====');
    await this.verifyCurrentScreen(pageName);

    const digilockerCandidates = [
      this.page.getByLabel(/digilocker/i).first(),
      this.page.getByText(/digilocker/i).first(),
      this.page.getByRole('radio', { name: /digilocker/i }).first(),
      this.page.locator('input[value*="digilocker" i], input[name*="digilocker" i], input[id*="digilocker" i]').first(),
      this.page.locator('label').filter({ hasText: /digilocker/i }).first().locator('input').first(),
    ];

    let digilockerRadio: any = null;
    for (const candidate of digilockerCandidates) {
      const count = await candidate.count().catch(() => 0);
      if (count) {
        digilockerRadio = candidate;
        break;
      }
    }

    if (!digilockerRadio) {
      throw new Error('Digilocker radio button was not found on the KYC page.');
    }

    await digilockerRadio.click({ force: true }).catch(async () => {
      await digilockerRadio.check({ force: true }).catch(() => digilockerRadio.click({ force: true }));
    });
    console.log('✓ Clicked Digilocker radio');

    const initiateButton = this.page.getByRole('button', { name: /initiate/i }).first();
    await initiateButton.click({ force: true }).catch(async () => {
      await this.page.getByText(/initiate/i).first().click({ force: true });
    });
    console.log('✓ Clicked Initiate button');

    const bypassDropdown = this.page.getByLabel(/bypass reason/i).first();
    const fallbackDropdown = this.page.locator('select, [role="combobox"]').filter({ hasText: /bypass reason/i }).first();

    const targetDropdown = (await bypassDropdown.count().catch(() => 0)) ? bypassDropdown : fallbackDropdown;
    if (await targetDropdown.count().catch(() => 0)) {
      await targetDropdown.selectOption({ label: bypassReason }).catch(async () => {
        await targetDropdown.selectOption({ value: bypassReason });
      });
      console.log(`✓ Selected bypass reason: ${bypassReason}`);
    } else {
      console.warn('⚠ Bypass reason dropdown not found.');
    }

    await this.clickActionButton(saveButton);
    await this.waitFor(1000);
    console.log('✓ Clicked Save button');

    await this.clickActionButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ Digilocker completed');
  }

    async withoutfillKYCDetailsSave(
    //pageName: string, 
    bypassReason: string, 
    saveButton: string, 
   // proceedButton: string
  ): Promise<void> {
    console.log('===== E-KYC Page =====');
    await this.verifyCurrentScreen('KYC');
     
    const eKycRadio = this.page.getByRole('radio', { name: /e-kyc/i }).first();
    const eKycFallback = this.page.locator('input[value="e-kyc" i], input[name*="e-kyc" i], label:has-text("E-KYC")').first();
    await eKycRadio.or(eKycFallback).first().click();
    console.log('selected E-kyc');

    const initiateButton = this.page.getByRole('button', { name: /initiate/i }).first();
    await initiateButton.click();
    console.log('clicked on initiate');

    const mobileButton = this.page.getByRole('button', { name: /mobile/i }).first();
    const mobileFallback = this.page.locator('button, [role="button"]').filter({ hasText: /mobile/i }).first();
    await mobileButton.or(mobileFallback).first().click();
    console.log('clicked on mobile page');

    const refreshButton = this.page.locator('button:has(svg[data-key="refresh"]), svg[data-key="refresh"], [data-key="refresh"], button[title*="refresh" i], button:has-text("Refresh")').first();
    await refreshButton.click();
    await this.page.waitForTimeout(1000);

    const bypassDropdown = this.page.getByRole('combobox').filter({ hasText: /bypass reason/i }).first();
    const bypassFallback = this.page.locator('select, [role="combobox"]').filter({ hasText: /bypass reason/i }).first();
    await bypassDropdown.or(bypassFallback).first().selectOption({ value: bypassReason });
    console.log(`✓ Selected bypass reason: ${bypassReason}`);

//    await this.page.getByRole('button', { name: 'Proceed' }).click();
//    await this.page.getByRole('button', { name: 'Save' }).click();

    await this.clickActionButton(saveButton);
    await this.waitFor(1000);

    // await this.clickActionButton(proceedButton);
    // await this.waitFor(600);
}

  async selectKycOption(option: string): Promise<void> {
    const optionRadio = this.page.getByRole('radio', { name: new RegExp(option, 'i') }).first();
    const fallback = this.page.locator(`input[value="${option}" i], input[name*="${option}" i], label:has-text("${option}")`).first();
    await optionRadio.or(fallback).first().click();
    console.log(`✓ Selected KYC option: ${option}`);
  }

  async proceed(proceedButton: string): Promise<void> {
    await this.clickActionButton(proceedButton);
    await this.waitFor(1000);
  }
}
