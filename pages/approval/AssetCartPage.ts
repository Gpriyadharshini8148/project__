import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Asset Cart Page Object
 * Handles asset cart operations, opportunity retrieval, and application search
 */
export class AssetCartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Asset Cart page safely via Hamburger menu
  /**
   * Navigate to Asset Cart using the hamburger menu
   * @param skipAppStatusCheck if true, skips waiting for URL/App Status checks (useful when already deep in the flow)
   */
  async navigateToAssetCart(skipAppStatusCheck: boolean = false): Promise<void> {
    console.log('===== Navigate via Hamburger Menu to: Asset Cart =====');

    if (!skipAppStatusCheck) {
      // 1. Wait for URL to leave searchmain
      try {
        await this.page.waitForFunction(
          () => !window.location.href.includes('searchmain'),
          { timeout: 15000 }
        );
      } catch {
        console.log('⚠ URL still on searchmain');
      }

      // Wait for 'App Status' text to be visible since it loads before we can navigate
      console.log('⏳ Waiting for App Status page to load after search...');
      try {
        await this.page.locator('text=/App Status/i').first().waitFor({ state: 'visible', timeout: 20000 });
        console.log('✓ App Status loaded');
      } catch {
        console.log('⚠ App Status text not explicitly found, proceeding...');
      }

      // 2. Wait for Salesforce LWC network to settle
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    }
    
    await this.page.waitForTimeout(1000);

    // [HOTFIX]: Check for the Reappraisal popup that sometimes appears and blocks the Hamburger Menu
    console.log('⚠ Checking for Reappraisal screen...');
    const exactCloseBtn = this.page.locator('body > div.siteforcePrmBody > div.cCenterPanel.slds-m-top--x-large.slds-p-horizontal--medium > div > div.slds-col--padded.contentRegion.comm-layout-column > div > div > c-customer-detail-reinvent > c-re-appraisal-reinvent > section > div > div > header > button svg:visible').first();
    let isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
    if (!isReappraisal) {
      await this.page.waitForTimeout(2000);
      isReappraisal = await exactCloseBtn.isVisible().catch(() => false);
    }
    if (isReappraisal) {
      console.log('⚠ Reappraisal screen detected, attempting to close...');
      await exactCloseBtn.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(2000);
      console.log('✓ Clicked Reappraisal close button');
    }

    // 3. Retry loop — up to 3 attempts to find hamburger and click Asset Cart
    let formFound = false;
    for (let attempt = 1; attempt <= 3 && !formFound; attempt++) {
      if (attempt > 1) {
        console.log(`↩ Retry attempt ${attempt}/3 for hamburger...`);
        await this.page.waitForTimeout(1000);
      }

      // Check if form is already on screen (current stage = Asset Cart)
      const isScreen = await this.page.locator("//div[@class='currentScreen']").innerText().catch(() => '');
      if (isScreen.includes('Asset Cart')) {
        console.log('✓ Asset Cart form already on screen');
        formFound = true;
        break;
      }
      
      // Check for breadcrumb link directly
      const fallbackBreadcrumbs = [
        "//a[normalize-space(text())='Asset Cart']",
        "//span[normalize-space(text())='Asset Cart']"
      ];
      
      for (const frame of this.page.frames()) {
        for (const fb of fallbackBreadcrumbs) {
          const breadcrumbLink = frame.locator(fb).first();
          if (await breadcrumbLink.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`✓ Found breadcrumb link for Asset Cart in frame ${frame.url()}`);
            await breadcrumbLink.click({ force: true }).catch(() => { });
            formFound = true;
            break;
          }
        }
        if (formFound) break;
      }
      
      if (formFound) break;

      // Find the "..." button across all frames
      let clickedDots = false;
      const dotsLocators = [
        "//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')] | //lightning-primitive-icon[contains(@class, 'slds-icon-utility-rows')]",
        "//button[@title='Show More' or @title='Show Navigation']",
        ".slds-dropdown-trigger_click button"
      ];

      for (const frame of this.page.frames()) {
        for (const loc of dotsLocators) {
          const dotsBtn = frame.locator(loc);
          const dotsBtnCount = await dotsBtn.count().catch(() => 0);
          if (dotsBtnCount > 0) {
            await dotsBtn.first().scrollIntoViewIfNeeded().catch(() => { });
            await dotsBtn.first().click({ force: true }).catch(() => { });
            console.log(`✓ Clicked Hamburger (...) menu button in frame ${frame.url()}`);
            clickedDots = true;
            break;
          }
        }
        if (clickedDots) break;
      }

      if (!clickedDots) {
        // Fallback: last breadcrumb-button with force
        const lastBreadcrumb = this.page.locator("//button[@class='breadcrumb-button']").last();
        if (await lastBreadcrumb.isVisible().catch(() => false)) {
          await lastBreadcrumb.click({ force: true }).catch(() => {});
          console.log('✓ Attempted click on last breadcrumb button (fallback)');
        } else {
          console.log(`⚠ No breadcrumb button found on attempt ${attempt}`);
          continue;
        }
      }

      await this.page.waitForTimeout(1000);

      // Try clicking "Asset Cart" in the opened menu across all frames
      let clickedMenu = false;
      for (const frame of this.page.frames()) {
        const menuItem = frame.getByRole('menuitem', { name: /Asset Cart/i })
          .or(frame.getByRole('button', { name: /Asset Cart/i }))
          .or(frame.locator("//a/span[contains(text(), 'Asset Cart') or contains(text(), 'Asset cart')]"))
          .or(frame.locator("//button[contains(text(), 'Asset Cart')]"));
          
        if (await menuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isEnabled = await menuItem.isEnabled().catch(() => false);
          if (isEnabled) {
            await menuItem.first().click({ force: true });
            console.log(`✓ Clicked 'Asset Cart' from Hamburger menu in frame ${frame.url()}`);
          } else {
            console.log("✓ 'Asset Cart' is disabled in menu (already on screen)");
          }
          await this.page.waitForTimeout(1000);
          clickedMenu = true;
          formFound = true;
          break;
        }
      }

      if (!clickedMenu) {
        // Dismiss menu
        await this.page.keyboard.press('Escape').catch(() => { });
        await this.page.waitForTimeout(500);

        // Check for breadcrumb link directly
        const breadcrumbLink = this.page.locator(
          "//a[normalize-space(text())='Asset Cart'] | //span[normalize-space(text())='Asset Cart']"
        ).first();
        if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✓ Found breadcrumb link for Asset Cart, clicking it');
          await breadcrumbLink.click({ force: true }).catch(() => { });
          await this.page.waitForTimeout(1000);
          formFound = true;
        } else {
          console.log('⚠ Could not find Asset Cart in menu or breadcrumb');
        }
      }
    }

    if (!formFound) {
      console.log('⚠ Failed to navigate to Asset Cart after 3 attempts, proceeding anyway to let assertions catch it');
    }

    // Give it a moment to render
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify asset cart page and retrieve Opportunity ID
   */
  async getOpportunity(pageName: string): Promise<string> {
    console.log('===== Get Opportunity ID Value from Asset Cart =====');
    await this.verifyCurrentScreen(pageName);

    const oppElement = this.page.locator(
      "//h3[text()='Asset Cart']//..//div[@class='card-container']//..//div[@class='oppNumber'] | //lightning-formatted-text[@data-output-element-id='output-field']"
    ).first();
    const oppValue = (await oppElement.textContent()) || '';
    
    console.log(`✓ Opportunity ID retrieved: ${oppValue.trim()}`);
    return oppValue.trim();
  }

  /**
   * Search Opportunity ID into global search box
   */
  async enterOpportunityIntoSearchBox(label: string, value: string): Promise<void> {
    console.log('===== Search Opportunity Id Value =====');
    await this.actions.fill(
      this.page.locator("//div[@data-aura-class='uiInput uiAutocomplete uiInput--default']//input[@placeholder='Search...']"),
      value,
      `Enter ${value} in Search Box`
    );
    await this.actions.click(
      this.page.locator(`//div//ul//li//a[@role='option']//div[@class='slds-truncate']//span[@title='${value}']`),
      `Selected ${value} from search results`
    );
    await this.waitFor(1000);
    await this.checkForErrors();
    await this.waitFor(5000);
  }

  /**
   * Click the Opportunity ID to proceed
   */
  async clickOpportunity(oppId: string): Promise<void> {
    console.log(`===== Clicking Opportunity ID: ${oppId} =====`);
    const oppLocator = this.page.locator(`text=${oppId}`).first();
    await oppLocator.waitFor({ state: 'visible', timeout: 10000 });
    
    await oppLocator.click({ force: true });
    console.log(`✓ Clicked Opportunity ID: ${oppId}`);
    
    // Wait for navigation away from Asset Cart
    await this.page.waitForTimeout(3000);
  }

  /**
   * Expand Asset Cart details by clicking the chevron arrow
   */
  async expandCartDetails(oppId: string): Promise<void> {
    console.log(`===== Expanding Asset Cart for: ${oppId} =====`);
    
    // The chevron might be an icon, an SVG, or an accordion summary inside the card.
    const chevronLocators = [
      this.page.locator(`//div[contains(@class, 'oppNumber') and contains(text(), '${oppId}')]/ancestor::div[contains(@class, 'card-container')]//lightning-icon`).last(),
      this.page.locator('lightning-icon').filter({ has: this.page.locator('svg') }).last(),
      this.page.locator('button').filter({ has: this.page.locator('lightning-icon') }).first(),
      this.page.locator('c-asset-cart-card').locator('lightning-icon').first()
    ];

    let clicked = false;
    for (const loc of chevronLocators) {
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await loc.click({ force: true });
        console.log(`✓ Expanded cart details using chevron locator for ${oppId}`);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.log(`ℹ Cart details chevron not found, attempting to click the card itself or it might already be expanded`);
      // Fallback: just click the container near the text
      const container = this.page.locator('div').filter({ hasText: 'DO Preparation' }).last();
      if (await container.isVisible().catch(() => false)) {
        await container.click({ force: true }).catch(() => {});
      }
    }
    
    // Wait for animation
    await this.page.waitForTimeout(1500);
  }

  /**
   * Click 'Change Scheme' button and wait for navigation
   */
  async clickChangeScheme(): Promise<void> {
    console.log('===== Clicking Change Scheme =====');
    const changeSchemeBtn = this.page.locator("//button[normalize-space(text())='Change Scheme'] | //lightning-button//button[normalize-space(text())='Change Scheme']").first();
    await changeSchemeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await changeSchemeBtn.scrollIntoViewIfNeeded().catch(() => {});
    await changeSchemeBtn.click();
    console.log('✓ Clicked Change Scheme button');
    
    // Wait for navigation to Product Selection
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click 'Change Product' button and wait for navigation
   */
  async clickChangeProduct(): Promise<void> {
    console.log('===== Clicking Change Product =====');
    const changeProductBtn = this.page.locator("//button[normalize-space(text())='Change Product'] | //lightning-button//button[normalize-space(text())='Change Product']").first();
    await changeProductBtn.waitFor({ state: 'visible', timeout: 5000 });
    await changeProductBtn.scrollIntoViewIfNeeded().catch(() => {});
    await changeProductBtn.click();
    console.log('✓ Clicked Change Product button');
    
    // Wait for navigation
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click 'Cancel' button on Asset Cart
   */
  async clickCancelOpportunity(): Promise<void> {
    console.log('===== Clicking Cancel Opportunity =====');
    const cancelBtn = this.page.locator("//button[normalize-space(text())='Cancel'] | //lightning-button//button[normalize-space(text())='Cancel']").first();
    await cancelBtn.waitFor({ state: 'visible', timeout: 5000 });
    await cancelBtn.scrollIntoViewIfNeeded().catch(() => {});
    await cancelBtn.click();
    console.log('✓ Clicked Cancel button');
    
    // Wait for modal or action to complete
    await this.page.waitForTimeout(3000);
  }
}
