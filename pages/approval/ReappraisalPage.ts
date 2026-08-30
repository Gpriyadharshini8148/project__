import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Reappraisal Page Object
 * Handles Reappraisal stage details and processing
 */
export class ReappraisalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Reappraisal via Hamburger Menu
   */
  async navigateToReappraisal(): Promise<void> {
    console.log('===== Navigate via Hamburger Menu to: Reappraisal =====');

    try {
      await this.page.waitForFunction(
        () => !window.location.href.includes('searchmain'),
        { timeout: 15000 }
      );
    } catch {
      console.log('⚠ URL still on searchmain');
    }

    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(666);

    let formFound = false;
    for (let attempt = 1; attempt <= 3 && !formFound; attempt++) {
      if (attempt > 1) {
        console.log(`↩ Retry attempt ${attempt}/3 for hamburger...`);
        await this.page.waitForTimeout(1000);
      }

      const isScreen = await this.page.locator("//div[@class='currentScreen']").innerText().catch(() => '');
      if (isScreen.includes('Reappraisal')) {
        console.log('✓ Reappraisal form already on screen');
        formFound = true;
        break;
      }

      const dotsBtn = this.page.locator(
        "//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]"
      );
      const dotsBtnCount = await dotsBtn.count().catch(() => 0);

      if (dotsBtnCount > 0) {
        await dotsBtn.first().scrollIntoViewIfNeeded().catch(() => { });
        await dotsBtn.first().click({ force: true }).catch(() => { });
        console.log('✓ Clicked Hamburger (...) menu button');
      } else {
        const lastBreadcrumb = this.page.locator("//button[@class='breadcrumb-button']").last();
        const lastCount = await lastBreadcrumb.count().catch(() => 0);
        if (lastCount > 0) {
          await lastBreadcrumb.scrollIntoViewIfNeeded().catch(() => { });
          await lastBreadcrumb.click({ force: true }).catch((e) => {
            console.log('⚠ Fallback breadcrumb click failed:', e.message);
          });
          console.log('✓ Attempted click on last breadcrumb button (fallback)');
        } else {
          console.log(`⚠ No breadcrumb button found on attempt ${attempt}`);
          continue;
        }
      }

      await this.page.waitForTimeout(500);

      const menuItem = this.page.locator(
        "//a/span[text()='Reappraisal'] | //button[text()='Reappraisal'] | //div[@class='hamburger-menu']//div//button[text()='Reappraisal']"
      );
      if (await menuItem.isVisible({ timeout: 4000 }).catch(() => false)) {
        const isEnabled = await menuItem.isEnabled().catch(() => false);
        if (isEnabled) {
          await menuItem.click();
          console.log("✓ Clicked 'Reappraisal' from Hamburger menu");
        } else {
          console.log("✓ 'Reappraisal' is disabled in menu (already on screen)");
        }
        await this.page.waitForTimeout(1000);
        formFound = true;
      } else {
        await this.page.keyboard.press('Escape').catch(() => { });
        await this.page.waitForTimeout(500);

        const breadcrumbLink = this.page.locator(
          "//a[normalize-space(text())='Reappraisal'] | //span[normalize-space(text())='Reappraisal']"
        ).first();
        if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await breadcrumbLink.click();
          console.log("✓ Clicked 'Reappraisal' breadcrumb link");
          await this.page.waitForTimeout(1000);
          formFound = true;
        } else {
          console.log(`⚠ 'Reappraisal' not in menu on attempt ${attempt}`);
        }
      }
    }
    await this.page.locator("//div[contains(text(),'Reappraisal')]").first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  /**
   * Process Reappraisal stage
   */
  async processReappraisal(
    pageName: string,
    proceedButton: string,
    reappraisalReason?: string,
    fosReappraisalReason?: string
  ): Promise<void> {
    console.log('===== Reappraisal Stage =====');
    await this.verifyCurrentScreen(pageName);

    if (reappraisalReason) {
      console.log(`Selecting Reappraisal Reason: ${reappraisalReason}`);
      
      // Use exact start regex to avoid matching "FOS Reappraisal Reason"
      const reasonCombo = this.page.locator('lightning-combobox')
        .filter({ has: this.page.locator('label', { hasText: /^Reappraisal Reason/ }) })
        .locator('button, input')
        .first();
      
      if (await reasonCombo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonCombo.scrollIntoViewIfNeeded().catch(() => {});
        await reasonCombo.click({ force: true });
        await this.page.waitForTimeout(500);
        
        // Find option within the same lightning-combobox to avoid cross-talk
        const comboboxHost = this.page.locator('lightning-combobox').filter({ has: this.page.locator('label', { hasText: /^Reappraisal Reason/ }) });
        const optionLocator = comboboxHost.locator(`lightning-base-combobox-item:has-text("${reappraisalReason}"), [data-value="${reappraisalReason}"]`).first();
        
        if (await optionLocator.isVisible().catch(() => false)) {
          await optionLocator.click({ force: true });
        } else {
           await this.page.keyboard.press('ArrowDown');
           await this.page.keyboard.press('Enter');
        }
        console.log(`✓ Selected Reappraisal Reason: ${reappraisalReason}`);
      } else {
        console.log(`⚠ Reappraisal Reason combobox not visible`);
      }
    }

    if (fosReappraisalReason) {
      console.log(`Selecting FOS Reappraisal Reason: ${fosReappraisalReason}`);
      
      const fosReasonCombo = this.page.locator('lightning-combobox')
        .filter({ has: this.page.locator('label', { hasText: /^FOS Reappraisal Reason/ }) })
        .locator('button, input')
        .first();
      
      if (await fosReasonCombo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fosReasonCombo.scrollIntoViewIfNeeded().catch(() => {});
        await fosReasonCombo.click({ force: true });
        await this.page.waitForTimeout(500);
        
        const comboboxHost = this.page.locator('lightning-combobox').filter({ has: this.page.locator('label', { hasText: /^FOS Reappraisal Reason/ }) });
        const optionLocator = comboboxHost.locator(`lightning-base-combobox-item:has-text("${fosReappraisalReason}"), [data-value="${fosReappraisalReason}"]`).first();

        if (await optionLocator.isVisible().catch(() => false)) {
          await optionLocator.click({ force: true });
        } else {
           await this.page.keyboard.press('ArrowDown');
           await this.page.keyboard.press('Enter');
        }
        console.log(`✓ Selected FOS Reappraisal Reason: ${fosReappraisalReason}`);
      } else {
        console.log(`⚠ FOS Reappraisal Reason combobox not visible`);
      }
    }

    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ Processed Reappraisal stage successfully');
  }
}
