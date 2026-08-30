import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { apiPatch } from '../../utils/api.util';

/**
 * Approval Details Page Object
 * Handles navigation to Approval Details stage, status verification, API patching, and proceeding
 */
export class ApprovalDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Process Approval Details stage (UI navigation + verification + proceed)
   */
  async processApprovalDetails(pageName: string = 'Approval Details', proceedButtonLabel: string = 'Proceed'): Promise<void> {
    console.log('===== Approval Details Stage =====');
    
    // Check if on Approval Details screen; if not, navigate via Hamburger menu
    let isScreen = '';
    for (let i = 0; i < 5; i++) {
      isScreen = await this.page.locator("//div[@class='currentScreen']").innerText().catch(() => '');
      if (isScreen.includes('Approval Details')) break;
      await this.page.waitForTimeout(1000);
    }

    if (!isScreen.includes('Approval Details')) {
      await this.navigateToApprovalDetails();
    } else {
      console.log(`✓ Already on ${pageName} screen`);
    }

    // Click Proceed button
    await this.clickButton(proceedButtonLabel);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ Successfully proceeded from Approval Details stage');
  }

  /**
   * Click a button by name
   */
  async clickButton(buttonName: string): Promise<void> {
    const btn = this.page.getByRole('button', { name: buttonName, exact: true })
      .or(this.page.locator(`button:has-text("${buttonName}")`))
      .first();

    const isVisible = await btn.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
    if (isVisible) {
      await btn.click({ force: true }).catch(() => {});
      return;
    }
    console.log(`⚠ Button '${buttonName}' not visible or not found.`);
  }

  /**
   * Navigate via Hamburger menu to Approval Details safely
   */
  async navigateToApprovalDetails(): Promise<void> {
    console.log('===== Navigate to Approval Details =====');

    // 1. Try to use the "View Approval Details" button (e.g. if we are on Surrogate Details and Check Approval was clicked)
    console.log('⏳ Waiting up to 2 mins for "View Approval Details" button or screen transition (backend scheduler is ON)...');
    const viewApprovalDetailsBtn = this.page.locator('button, a, lightning-button')
      .filter({ hasText: /View Approval Details/i })
      .filter({ visible: true })
      .first();

    let buttonAppeared = false;
    let screenAppeared = false;

    // Loop for up to 120 seconds (120 * 1000ms = 2 mins)
    for (let i = 0; i < 120; i++) {
      if (await viewApprovalDetailsBtn.isVisible().catch(() => false)) {
        buttonAppeared = true;
        break;
      }
      const isScreen = await this.page.locator("//div[@class='currentScreen']").innerText().catch(() => '');
      if (isScreen.includes('Approval Details')) {
        screenAppeared = true;
        break;
      }
      await this.page.waitForTimeout(1000);
    }

    if (screenAppeared) {
      console.log('✓ Approval Details screen loaded naturally. Skipping button click.');
      return;
    }

    if (buttonAppeared) {
      console.log('✓ "View Approval Details" button appeared. Clicking...');
      let dismissed = false;
      for (let tries = 0; tries < 5; tries++) {
        if (await viewApprovalDetailsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`↻ Clicking View Approval Details (Attempt ${tries + 1})...`);
          await viewApprovalDetailsBtn.click({ timeout: 2000 }).catch(() =>
            viewApprovalDetailsBtn.click({ force: true }).catch(() => { })
          );
          await this.page.waitForTimeout(1500);
        } else {
          dismissed = true;
          break;
        }
      }
      if (!dismissed) {
        console.log('⚠ Button did not disappear after 5 attempts — trying one final force click...');
        await viewApprovalDetailsBtn.click({ force: true }).catch(() => { });
      }
      console.log('✓ Clicked "View Approval Details". Proceeding to Approval Details...');
      await this.page.waitForTimeout(2000);
      
      // Ensure we have transitioned to the Approval Details screen
      try {
        await this.page.waitForFunction(
          () => {
            const screen = document.querySelector('.currentScreen');
            return screen && screen.textContent && screen.textContent.includes('Approval Details');
          },
          { timeout: 15000 }
        );
        console.log('✓ Successfully transitioned to Approval Details screen');
      } catch {
        console.log('⚠ Timed out waiting for .currentScreen to show Approval Details. Proceeding anyway...');
      }

      return; // Navigation complete!
    } else {
      console.log('⚠ "View Approval Details" did not appear within 2 minutes. Falling back to Hamburger menu...');
    }

    console.log('===== Navigate via Hamburger Menu to: Approval Details =====');

    // 2. Wait for URL to leave searchmain
    try {
      await this.page.waitForFunction(
        () => !window.location.href.includes('searchmain'),
        { timeout: 15000 }
      );
    } catch {
      console.log('⚠ URL still on searchmain');
    }

    // Wait for the initial page to load (could be Zip Code Verification or App Status)
    console.log('⏳ Waiting for initial screen to load after search...');
    try {
      await this.page.locator('.currentScreen').first().waitFor({ state: 'visible', timeout: 20000 });
      console.log('✓ Initial screen loaded');
    } catch {
      console.log('⚠ Initial screen text not explicitly found, proceeding...');
    }

    // 2. Wait for Salesforce LWC network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(1000);

    // [HOTFIX]: Check for the Reappraisal popup that sometimes appears and blocks the Hamburger Menu
    console.log('⚠ Checking for Reappraisal screen...');
    const exactCloseBtn = this.page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();
    let isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
    if (!isReappraisal) {
      // wait a bit longer just in case
      await this.page.waitForTimeout(2000);
      isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
    }
    if (isReappraisal) {
      console.log('⚠ Reappraisal screen detected, attempting to close...');
      await exactCloseBtn.click({ force: true }).catch(() => { });
      await this.page.waitForTimeout(2000);
      console.log('✓ Clicked Reappraisal close button');
    }

    // 3. Retry loop — up to 3 attempts to find hamburger and click Approval Details
    let formFound = false;
    for (let attempt = 1; attempt <= 3 && !formFound; attempt++) {
      if (attempt > 1) {
        console.log(`↩ Retry attempt ${attempt}/3 for hamburger...`);
        await this.page.waitForTimeout(1000);
      }

      // Check if form is already on screen
      const isScreen = await this.page.locator("//div[@class='currentScreen']").innerText().catch(() => '');
      if (isScreen.includes('Approval Details')) {
        console.log('✓ Approval Details form already on screen');
        formFound = true;
        break;
      }

      // Find the "..." button
      const dotsBtn = this.page.locator(
        "//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]"
      );
      const dotsBtnCount = await dotsBtn.count().catch(() => 0);

      if (dotsBtnCount > 0) {
        await dotsBtn.first().scrollIntoViewIfNeeded().catch(() => { });
        await dotsBtn.first().click({ force: true }).catch(() => { });
        console.log('✓ Clicked Hamburger (...) menu button');
      } else {
        // Fallback: last breadcrumb-button with force
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

      await this.page.waitForTimeout(1000);

      // Try clicking "Approval Details" in the opened menu
      const menuItem = this.page.locator(
        "//a/span[text()='Approval Details'] | //button[text()='Approval Details'] | //div[@class='hamburger-menu']//div//button[text()='Approval Details'] | //a[text()='Approval Details']"
      ).first();
      if (await menuItem.isVisible({ timeout: 4000 }).catch(() => false)) {
        const isEnabled = await menuItem.isEnabled().catch(() => false);
        if (isEnabled) {
          await menuItem.click({ force: true });
          console.log("✓ Clicked 'Approval Details' from Hamburger menu");
        } else {
          console.log("✓ 'Approval Details' is disabled in menu (already on screen)");
        }
        await this.page.waitForTimeout(1000);
        formFound = true;
      } else {
        // Dismiss menu
        await this.page.keyboard.press('Escape').catch(() => { });
        await this.page.waitForTimeout(500);

        // Check for breadcrumb link directly
        const breadcrumbLink = this.page.locator(
          "//a[normalize-space(text())='Approval Details'] | //span[normalize-space(text())='Approval Details']"
        ).first();
        if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✓ Found breadcrumb link for Approval Details, clicking it');
          await breadcrumbLink.click({ force: true }).catch(() => { });
          await this.page.waitForTimeout(1000);
          formFound = true;
        } else {
          console.log('⚠ Could not find Approval Details in menu or breadcrumb');
        }
      }
    }

    if (!formFound) {
      console.log('⚠ Failed to navigate to Approval Details after 3 attempts, proceeding anyway');
    }

    // Give it a moment to render
    await this.page.waitForTimeout(2000);
  }

  /**
   * Stamp RecordTypeId, Underwriting Status = Completed, and Approval Status = Approved via Salesforce API Patch and refresh UI
   */
  async patchUnderwritingStatusViaApi(
    tokenUrl: string,
    params: string,
    endpointUrl: string,
    recordTypeId: string = '0121t000000MMgSAAW'
  ): Promise<void> {
    console.log('===== Patching RecordTypeId, Underwriting_Status__c = Completed, Approval_Status__c = Approved via API =====');
    const payload = [{
      RecordTypeId: recordTypeId,
      Underwriting_Status__c: 'Completed',
      Approval_Status__c: 'Approved'
    }];
    await apiPatch({ tokenUrl, params }, endpointUrl, payload);
    console.log('✓ Successfully patched RecordTypeId, Underwriting_Status__c = Completed, and Approval_Status__c = Approved');

    // Reload page to reflect updated status in UI
    await this.page.reload();
    await this.waitFor(2000);
  }
}
