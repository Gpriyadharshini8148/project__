import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * App Status Page Object
 * Handles application status page operations
 */
export class AppStatusPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Proceed from Application Status page
   */
  async proceedFromAppStatus(pageName: string, proceedButton: string): Promise<void> {
    const expectedPageName = pageName || 'App Status';
    const buttonText = proceedButton || 'Proceed';

    console.log('===== App Status Page =====');

    // Remove any blocking overlays or dialogs before proceeding
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.closeVisibleDialogs();

    // Handle "Mobile Validated" intermediate screen (appears for new/unverified mobile numbers)
    const mobileValidatedText = this.page.getByText('Mobile Validated', { exact: false }).first()
      .or(this.page.getByText('Your Mobile Validation is Completed Successfully', { exact: false }).first());

    const isMobileValidatedVisible = await mobileValidatedText.isVisible({ timeout: 15000 }).catch(() => false);
    if (isMobileValidatedVisible) {
      console.log('ℹ Mobile Validated screen detected — clicking Proceed to continue...');
      const proceedBtn = this.page.getByRole('button', { name: /proceed/i }).first();
      await proceedBtn.click({ force: true });
      await this.page.waitForTimeout(3000);
      console.log('✓ Proceeded past Mobile Validated screen');
    }

    await this.waitForAppStatusPage(expectedPageName);
    await this.verifyCurrentScreen(expectedPageName);

    await this.clickButton(buttonText);
    await this.checkForErrors();

     // Let the Zip Code LWC fully hydrate/prefill before we start probing for fields
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);

    const pincodeField = this.page.locator('input[placeholder*="Zip" i], input[name*="zip" i], input[id*="zip" i]').first();
    const customerPincodeField = this.page.locator('input').filter({ hasText: /pincode/i }).first();
    const zipField = pincodeField.or(customerPincodeField);

    const zipOrMitcOrApprovalVisible = await Promise.race([
      zipField.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false),
      this.page.locator('text=/MITC|Terms and Conditions/i').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false),
      this.page.getByText('Zip Code Verification').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false),
      this.page.getByText('Approval Details').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false),
    ]);

    if (!zipOrMitcOrApprovalVisible) {
      console.log('⚠ App Status Proceed did not auto-navigate. Using Hamburger menu to navigate to Zip Code...');
      try {
        const hamburgerBtn = this.page.locator('button, a').filter({ has: this.page.locator('svg') }).filter({ hasText: /menu|more/i }).first()
          .or(this.page.locator('.slds-global-actions__item-action, button.slds-button_icon-border-filled, lightning-button-icon').first());
        if (await hamburgerBtn.isVisible({ timeout: 3000 })) {
           await hamburgerBtn.click({ force: true });
           await this.page.waitForTimeout(1000);
           const zipMenu = this.page.locator('button, a, li[role="menuitem"], li[role="option"]').filter({ hasText: /Zip Code Verification|Zip\/Postal/i }).first();
           if (await zipMenu.isVisible({ timeout: 3000 })) {
             await zipMenu.click({ force: true });
             await this.page.waitForTimeout(2000);
           }
        }
      } catch (e) {
        throw new Error('After clicking Proceed from App Status, Zip Code screen was not visible and fallback navigation failed.');
      }
    }

    console.log('✓ Proceeded from App Status');
  }

  private async waitForAppStatusPage(pageName: string): Promise<void> {
    const expectedName = pageName || 'App Status';
    const pageLocator = this.page.locator(`text=${expectedName}`).first();

    if (await pageLocator.isVisible({ timeout: 8000 }).catch(() => false)) {
      return;
    }

    const fallback = this.page.locator(`//h1[contains(normalize-space(.),"${expectedName}")] | //span[contains(normalize-space(.),"${expectedName}")] | //div[contains(normalize-space(.),"${expectedName}")]`).first();
    if (await fallback.isVisible({ timeout: 8000 }).catch(() => false)) {
      return;
    }

    // If page name isn't visible, allow retries before failing.
    await this.page.waitForTimeout(1000);
  }

  private async closeVisibleDialogs(): Promise<void> {
    const closeSelectors = [
      "button[aria-label='Close']",
      "button[aria-label='Dismiss']",
      "button:has-text('Close')",
      "button:has-text('Dismiss')",
      "button:has-text('No thanks')",
      "button:has-text('×')",
      "button:has-text('X')",
    ];

    for (const selector of closeSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click().catch(() => undefined);
      }
    }
  }

  /**
   * Get opportunity value from Asset Cart
   */
  async getOpportunityValue(assetCartPageName: string): Promise<string> {
    console.log('===== Get Opportunity Value =====');
    await this.verifyCurrentScreen(assetCartPageName);
    
    // Get opportunity ID from the page
    const oppElement = this.page.locator("//div[contains(@class,'opportunity')]//span").first();
    const oppValue = await oppElement.textContent() || '';
    
    console.log(`✓ Opportunity Value: ${oppValue.trim()}`);
    return oppValue.trim();
  }

  /**
   * Enter opportunity in search textbox (Post Approval flow)
   */
  async enterOpportunityInSearchBox(searchBoxLabel: string, opportunityValue: string): Promise<void> {
    console.log('===== Enter Opportunity in Search =====');
    
    const searchBox = this.page.locator(`//input[@placeholder='${searchBoxLabel}']`);
    
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill(opportunityValue);
      await searchBox.press('Enter');
      await this.waitFor(5000);
    } else {
      // Alternative search approach
      await this.clickButton('Search');
      await this.fillTextbox(searchBoxLabel, opportunityValue);
      await this.clickButton('Search');
    }
    
    console.log(`✓ Searched for opportunity: ${opportunityValue}`);
  }
}
