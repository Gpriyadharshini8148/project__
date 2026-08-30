import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Additional Details Page Object
 * Handles Stage: Additional Details (Personal Details & Office Details)
 *
 * Key principle:
 *  - Wait for each element BEFORE interacting — one by one.
 *  - Detect which section is visible (Personal OR Office) and fill accordingly.
 *  - Handle read-only auto-filled fields (Office City, State) gracefully.
 */
export class AdditionalDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: Navigate via Hamburger → Additional Details
  // ─────────────────────────────────────────────────────────────────
  async navigateToAdditionalDetails(): Promise<void> {
    console.log('===== Navigate via Hamburger Menu to: Additional Details =====');

    // 1. Wait for URL to leave searchmain
    try {
      await this.page.waitForFunction(
        () => !window.location.href.includes('searchmain'),
        { timeout: 15000 }
      );
    } catch {
      console.log('⚠ URL still on searchmain');
    }

    // 2. Wait for Salesforce LWC network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await this.page.waitForTimeout(666);

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
      await exactCloseBtn.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(2000);
      console.log('✓ Clicked Reappraisal close button');
    }

    // 3. Retry loop — up to 3 attempts to find hamburger and click Additional Details
    let formFound = false;
    for (let attempt = 1; attempt <= 3 && !formFound; attempt++) {
      if (attempt > 1) {
        console.log(`↩ Retry attempt ${attempt}/3 for hamburger...`);
        await this.page.waitForTimeout(1000);
      }

      // Check if form is already on screen (current stage = Additional Details)
      const alreadyPersonal = await this.page.locator('[name="fathersName"]').count().then(c => c > 0).catch(() => false);
      const alreadyOffice = await this.page.getByRole('textbox', { name: 'Office Pincode' }).count().then(c => c > 0).catch(() => false);
      if (alreadyPersonal || alreadyOffice) {
        console.log('✓ Additional Details form already on screen');
        formFound = true;
        break;
      }

      // Find the "..." button by count() — works even when element is not yet visible
      const dotsBtn = this.page.locator(
        "//button[@class='breadcrumb-button' and contains(normalize-space(text()),'...')]"
      );
      const dotsBtnCount = await dotsBtn.count().catch(() => 0);

      if (dotsBtnCount > 0) {
        await dotsBtn.first().scrollIntoViewIfNeeded().catch(() => { });
        await dotsBtn.first().click({ force: true });
        console.log('✓ Clicked Hamburger (...) menu button');
      } else {
        // Fallback: last breadcrumb-button with force
        const lastBreadcrumb = this.page.locator("//button[@class='breadcrumb-button']").last();
        const lastCount = await lastBreadcrumb.count().catch(() => 0);
        if (lastCount > 0) {
          await lastBreadcrumb.scrollIntoViewIfNeeded().catch(() => { });
          await lastBreadcrumb.click({ force: true });
          console.log('✓ Clicked last breadcrumb button (fallback)');
        } else {
          console.log(`⚠ No breadcrumb button found on attempt ${attempt}`);
          continue;
        }
      }

      await this.page.waitForTimeout(500);

      // Try clicking "Additional Details" in the opened menu
      const menuItem = this.page.locator(
        "//a/span[text()='Additional Details'] | //button[text()='Additional Details']"
      );
      if (await menuItem.isVisible({ timeout: 4000 }).catch(() => false)) {
        await menuItem.click();
        console.log("✓ Clicked 'Additional Details' from Hamburger menu");
        await this.page.waitForTimeout(1000);
        formFound = true;
      } else {
        // Dismiss menu — may already be on Additional Details stage
        await this.page.keyboard.press('Escape').catch(() => { });
        await this.page.waitForTimeout(500);

        // Check for breadcrumb link
        const breadcrumbLink = this.page.locator(
          "//a[normalize-space(text())='Additional Details'] | //span[normalize-space(text())='Additional Details']"
        ).first();
        if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await breadcrumbLink.click();
          console.log("✓ Clicked 'Additional Details' breadcrumb link");
          await this.page.waitForTimeout(1000);
          formFound = true;
        } else {
          console.log(`⚠ 'Additional Details' not in menu on attempt ${attempt}`);
        }
      }
    }

    // 4. Detect which section is loaded
    console.log('⏳ Waiting for Additional Details form to render...');
    await this.page.waitForTimeout(666);

    const personalVisible = await this.page.locator('[name="fathersName"]').isVisible({ timeout: 8000 }).catch(() => false);
    const officeVisible = await this.page.getByRole('textbox', { name: 'Office Pincode' }).first().isVisible({ timeout: 4000 }).catch(() => false);

    if (personalVisible) {
      console.log('✓ Personal Details form is ready');
    } else if (officeVisible) {
      console.log('✓ Office Details form is ready (Personal Details already completed)');
    } else {
      console.log('⚠ Neither form detected after navigation');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 2a: Fill Personal Details — one field at a time with wait
  // ─────────────────────────────────────────────────────────────────
  async enterPersonalDetails(
    fatherName: string = 'MAHEBUB',
    motherName: string = 'Rahima',
    alternateMobile: string = '9527187976',
    maritalStatus: string = 'Married',
    qualification: string = 'Graduate',
    preferredMailingAddress: string = 'Residence',
    timeHorizon: string = 'Within 3 months',
    continueButtonLabel: string = 'Continue'
  ): Promise<boolean> {
    console.log('===== Fill Personal Information Details =====');

    // Check if Personal Details section is visible at all
    // After Office Details Proceed, page may take several seconds to show Personal Details
    let personalSectionVisible = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      // Scroll to top to ensure fields are in view
      await this.page.evaluate(() => window.scrollTo(0, 0)).catch(() => { });
      personalSectionVisible = await this.page.locator(
        'text=/Personal Details/i'
      ).or(this.page.locator('h1, h2, h3, div').filter({ hasText: /Personal Details/i }))
      .first().isVisible({ timeout: 5000 }).catch(() => false);
      if (personalSectionVisible) break;
      console.log(`⏳ Waiting for Personal Details section (attempt ${attempt}/3)...`);
      await this.page.waitForTimeout(1000);
    }
    if (!personalSectionVisible) {
      console.log('⚠ Personal Details section not visible — skipping (may already be completed)');
      return false;
    }
    console.log('✓ Personal Details section detected');

    // 1. Father's Name — wait then fill using label/placeholder
    await this.waitAndFillByLabel("Spouse Name", fatherName, "Father's Name");

    // 2. Mother's Name — wait then fill using label/placeholder (empty for negative test)
    await this.waitAndFillByLabel("Mother's Name", motherName, "Mother's Name");

    // 3. Alternate Mobile Number — try with and without "Enter" prefix
    let altMobileFilled = await this.waitAndFillByLabel('Enter Alternate Mobile Number', alternateMobile, 'Alternate Mobile');
    if (!altMobileFilled) {
      altMobileFilled = await this.waitAndFillByLabel('Alternate Mobile Number', alternateMobile, 'Alternate Mobile');
    }
    if (!altMobileFilled) {
      // Last resort: look for any input with placeholder containing "Alternate"
      const altInput = this.page.locator('input[placeholder*="Alternate" i], input[placeholder*="alternate" i]').first();
      if (await altInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await altInput.scrollIntoViewIfNeeded().catch(() => { });
        await altInput.click();
        await altInput.fill(alternateMobile);
        console.log(`✓ Filled Alternate Mobile via placeholder fallback: "${alternateMobile}"`);
      } else {
        console.log('⚠ Alternate Mobile Number field not found');
      }
    }

    // 4. Marital Status
    await this.waitAndSelect('Marital Status', maritalStatus);

    // 5. Qualification
    await this.waitAndSelect('Qualification', qualification);

    // 6. Preferred Mailing Address
    await this.waitAndSelect('Preferred Mailing Address', preferredMailingAddress);

    // 7. Time horizon for next purchase (empty = negative test)
    if (timeHorizon) {
      await this.waitAndSelect('Time horizon for next purchase', timeHorizon);
    } else {
      console.log('⚠ Leaving Time horizon empty (negative test)');
    }

    // 8. Click Continue
    await this.waitAndClickBtn(continueButtonLabel);
    await this.page.waitForTimeout(833);
    console.log('✓ Personal Details submitted');
    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 2b: Fill Office Details — one field at a time with wait
  // ─────────────────────────────────────────────────────────────────
  async enterOfficeDetails(
    officePincode: string = '411021',
    companyName: string = 'OTHERS',
    otherCompanySpecify: string = 'EUREKA FORBS SERVICE CENTER',
    natureOfCompany: string = 'Private Ltd',
    otherNatureSpecify: string = 'SHOP OWNER',
    addressLine1: string = 'EUREKA FORBS SERVICE CENTER',
    addressLine2: string = 'AM SERVISES',
    addressLine3: string = 'AM SERVISES',
    locality: string = 'BAVDHAN',
    officePhoneType: string = 'Mobile',
    officeMobile: string = '9403660419',
    employmentType: string = 'Self Employed',
    designation: string = 'Others',
    monthlyIncome: string = 'Rs 25001-50000',
    nameOnCard: string = 'AMIR',
    proceedButtonLabel: string = 'Proceed'
  ): Promise<void> {
    console.log('===== Fill Office & Employment Details =====');

    // Wait for the Office Details section to render
    await this.page.waitForTimeout(666);

    // 1. Office Pincode — type with delay, click suggestion from dropdown list
    const pincodeInput = this.page.getByRole('textbox', { name: 'Office Pincode' }).first();
    const pincodeVisible = await pincodeInput.isVisible({ timeout: 10000 }).catch(() => false);
    if (pincodeVisible) {
      await pincodeInput.scrollIntoViewIfNeeded().catch(() => { });

      await pincodeInput.click({ clickCount: 3 }).catch(() => {});
      await pincodeInput.press('Backspace').catch(() => {});
      await this.page.waitForTimeout(200);

      // Use fill instead of pressSequentially to avoid LWC eating the first character
      await pincodeInput.fill(officePincode, { force: true }).catch(() => {});
      await this.page.waitForTimeout(500);

      await pincodeInput.click({ force: true }).catch(() => {});
      await this.page.keyboard.press('ArrowDown').catch(() => {});
      await this.page.waitForTimeout(1500);

      const exactOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem')
        .filter({ has: this.page.getByText(officePincode, { exact: false }) })
        .first();

      const anyOption = this.page.locator('lightning-base-combobox-item, li[role="option"], li.listitem')
        .filter({ hasText: /\w/ })
        .first();

      let appeared = await exactOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (appeared) {
        await exactOption.click({ force: true });
        console.log(`✓ Selected pincode suggestion (exact Playwright): ${officePincode}`);
      } else {
        console.log(`ℹ Exact option didn't appear, checking for any option fallback...`);
        let fallbackAppeared = await anyOption.isVisible({ timeout: 2000 }).catch(() => false);
        if (fallbackAppeared) {
          await anyOption.click({ force: true });
          console.log(`⚠ Pincode (first available option fallback used)`);
        } else {
          console.log(`⚠ No pincode option found for '${officePincode}'. Attempting keyboard fallback.`);
          await this.page.keyboard.press('ArrowDown').catch(() => {});
          await this.page.keyboard.press('Enter').catch(() => {});
        }
      }

      // WAIT for City/State to auto-fill after pincode selection
      await this.page.waitForTimeout(1000);
    } else {
      console.log('⚠ Office Pincode input not found');
    }

    // 2. Name of Company/Business — lookup field (insertText + slds-box li click)
    // Try multiple locator strategies to find this field
    let companyEl: any = null;
    const companyStrategies = [
      this.page.getByRole('textbox', { name: 'Name of Company/Business' }),
      this.page.getByPlaceholder('Name of Company/Business'),
      this.page.getByPlaceholder(/company/i),
      this.page.locator('input[placeholder*="Company" i]'),
      this.page.locator('input[placeholder*="Business" i]'),
      this.page.locator("//label[contains(text(),'Company')]/..//input"),
      this.page.locator("//span[contains(text(),'Company')]/..//input"),
    ];
    for (const loc of companyStrategies) {
      const el = loc.first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        companyEl = el;
        break;
      }
    }

    if (companyEl) {
      await companyEl.scrollIntoViewIfNeeded().catch(() => { });
      await companyEl.click();
      await companyEl.press('Control+A');
      await companyEl.press('Backspace');
      await this.page.keyboard.insertText(companyName);
      await companyEl.press('Backspace');
      console.log(`✓ Typed company: ${companyName}`);
      await this.page.waitForTimeout(666);

      // Click matching li in slds-box dropdown
      const companyOption = this.page.locator(
        `//div[@class='slds-box']//..//li[text()='${companyName}'] | //li[contains(text(),'${companyName}')]`
      ).first();
      if (await companyOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await companyOption.click();
        console.log(`✓ Selected company from list: ${companyName}`);
        // Wait for LWC to re-render the form after company selection
        await this.page.waitForTimeout(1000);
      } else {
        console.log(`⚠ Company suggestion '${companyName}' not found — pressing Tab`);
        await companyEl.press('Tab');
        await this.page.waitForTimeout(500);
      }
    } else {
      console.log('⚠ Company/Business input not found by any strategy');
    }

    // 3. If Other Company Please Specify
    await this.waitAndFillByLabel('If Other Company Please Specify', otherCompanySpecify, 'If Other Company');

    // 4. Nature of Company / Business
    await this.waitAndSelect('Nature of Company/Business', natureOfCompany);

    // 5. If Other Please Specify
    await this.waitAndFillByLabel('If Other Please Specify', otherNatureSpecify, 'If Other Nature');

    // 6. Office Address Line 1
    await this.waitAndFillByLabel('Office Address Line 1', addressLine1, 'Office Address Line 1');

    // 7. Office Address Line 2
    await this.waitAndFillByLabel('Office Address Line 2', addressLine2, 'Office Address Line 2');

    // 8. Office Address Line 3
    await this.waitAndFillByLabel('Office Address Line 3', addressLine3, 'Office Address Line 3');

    // 9. Office Area / Locality — try multiple label variants with retry for auto-erase issue
    let localityFilled = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      localityFilled = await this.waitAndFillByLabel('Office Area/Locality', locality, 'Office Area/Locality');
      if (!localityFilled) {
        localityFilled = await this.waitAndFillByLabel('Locality', locality, 'Office Locality');
      }
      if (!localityFilled) {
        localityFilled = await this.waitAndFillByLabel('Area/Locality', locality, 'Office Area Locality');
      }
      if (!localityFilled) {
        // Placeholder partial match fallback
        const localityInput = this.page.locator('input[placeholder*="Locality" i], input[placeholder*="Area" i]').first();
        if (await localityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await localityInput.scrollIntoViewIfNeeded().catch(() => { });
          await localityInput.click();
          await localityInput.fill(locality);
          console.log(`✓ Filled Office Locality via placeholder fallback: "${locality}"`);
          localityFilled = true;
        } else {
          console.log('⚠ Office Area/Locality not found by any strategy');
        }
      }

      if (localityFilled) {
        // Wait and verify if it got auto-erased by LWC
        await this.page.waitForTimeout(500);
        const verifyInput = this.page.locator('input[placeholder*="Locality" i], input[placeholder*="Area" i], //label[contains(text(), "Locality")]/..//input').first();
        if (await verifyInput.isVisible().catch(() => false)) {
          const currentVal = await verifyInput.inputValue().catch(() => '');
          if (currentVal.trim() === '') {
            console.log(`⚠ Locality got auto-erased (Attempt ${attempt}), retrying...`);
            localityFilled = false;
            await this.page.waitForTimeout(333);
          } else {
            break; // Successfully filled and retained
          }
        } else {
          break; // Input no longer visible, move on
        }
      } else {
        break; // Didn't find the field at all
      }
    }

    // 10. Office City — may be auto-filled (read-only) by pincode lookup
    await this.waitAndFillByLabel('Office City', 'PUNE', 'Office City');

    // 11. Office State — may be auto-filled (read-only) by pincode lookup
    await this.waitAndFillByLabel('Office State', 'MAHARASHTRA', 'Office State');

    // Wait for LWC to re-render bottom fields after location auto-fill
    await this.page.waitForTimeout(666);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => { });
    await this.page.waitForTimeout(500);

    // 12. Office Phone Number Type
    await this.waitAndSelect('Office Phone Number Type', officePhoneType);

    // 13. Office Mobile / Landline Number
    await this.waitAndFillByLabel('Office Mobile/Landline Number', officeMobile, 'Office Mobile');

    // 14. Employment Type
    await this.waitAndSelect('Employment Type', employmentType);

    // 15. Designation
    await this.waitAndSelect('Designation', designation);

    // 16. Monthly Income
    await this.waitAndSelect('Monthly Income', monthlyIncome);

    // 17. Name on Card
    await this.waitAndFillByLabel('Name on Card', nameOnCard, 'Name on Card');

    // 18. Click Proceed
    await this.waitAndClickBtn(proceedButtonLabel);
    // Wait for transition from Office Details to Personal Details
    await this.page.waitForTimeout(1666);
    console.log('✓ Office Details submitted');
  }

  // ─────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────

  /** Fill by [name] attribute — e.g. [name="fathersName"] */
  private async waitAndFillByAttr(nameAttr: string, value: string, fieldDesc: string): Promise<boolean> {
    const el = this.page.locator(`[name="${nameAttr}"]`).first();
    const isVisible = await el.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      console.log(`⚠ ${fieldDesc} [name="${nameAttr}"] not visible`);
      return false;
    }

    const isEditable = await el.isEditable({ timeout: 2000 }).catch(() => false);
    if (!isEditable) {
      const val = await el.inputValue().catch(() => '');
      console.log(`✓ ${fieldDesc} is read-only (auto: "${val}")`);
      return true;
    }

    await el.scrollIntoViewIfNeeded().catch(() => { });
    await el.click();
    await this.page.waitForTimeout(50);

    if (value === '') {
      await el.fill('');
      await el.press('Tab');
      console.log(`⚠ Cleared ${fieldDesc} (negative test)`);
    } else {
      await el.fill(value);
      // Force LWC to recognize the change
      await el.evaluate((node: HTMLInputElement) => {
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
        node.dispatchEvent(new Event('blur', { bubbles: true }));
      });
      await el.press('Tab');
      console.log(`✓ Filled ${fieldDesc}: "${value}"`);
    }
    await this.page.waitForTimeout(150);
    return true;
  }

  /** Fill by accessible label text — tries multiple locator strategies */
  private async waitAndFillByLabel(labelText: string, value: string, fieldDesc: string): Promise<boolean> {
    const strategies = [
      // Placeholder-based (most reliable for LWC fields like "Enter Alternate Mobile Number")
      this.page.getByPlaceholder(labelText),
      this.page.getByPlaceholder(new RegExp(labelText, 'i')),
      // Role-based
      this.page.getByRole('textbox', { name: labelText }),
      this.page.getByRole('textbox', { name: new RegExp(labelText, 'i') }),
      // Name attribute
      this.page.locator(`[name="${labelText}"]`),
      // XPath label-based
      this.page.locator(`//label[contains(normalize-space(text()),'${labelText}')]/..//input`),
      this.page.locator(`//label[contains(text(),'${labelText}')]/..//input`),
      this.page.locator(`//div[contains(text(),'${labelText}')]/..//input`),
      // Placeholder partial match
      this.page.locator(`input[placeholder*="${labelText}" i]`),
      // Span label pattern used in some LWC forms
      this.page.locator(`//span[contains(text(),'${labelText}')]/..//input`),
      this.page.locator(`//span[contains(text(),'${labelText}')]/following::input[1]`),
    ];

    for (const loc of strategies) {
      const el = loc.first();
      const isVisible = await el.isVisible({ timeout: 300 }).catch(() => false);
      if (!isVisible) continue;

      const isEditable = await el.isEditable({ timeout: 1000 }).catch(() => false);
      if (!isEditable) {
        const val = await el.inputValue().catch(() => '');
        console.log(`✓ ${fieldDesc} is read-only (auto-filled: "${val}")`);
        return true;
      }

      await el.scrollIntoViewIfNeeded().catch(() => { });
      await el.click();
      await this.page.waitForTimeout(50);

      if (value === '') {
        await el.fill('');
        await el.press('Tab');
        console.log(`⚠ Cleared ${fieldDesc} (negative test)`);
      } else {
        await el.fill(value);
        // Force LWC to recognize the change
        await el.evaluate((node: HTMLInputElement) => {
          node.dispatchEvent(new Event('input', { bubbles: true }));
          node.dispatchEvent(new Event('change', { bubbles: true }));
          node.dispatchEvent(new Event('blur', { bubbles: true }));
        });
        await el.press('Tab');
        console.log(`✓ Filled ${fieldDesc}: "${value}"`);
      }
      await this.page.waitForTimeout(150);
      return true;
    }

    console.log(`⚠ ${fieldDesc} not found on page`);
    return false;
  }

  /** Select dropdown option — h1-based, label-based, or fuzzy match */
  private async waitAndSelect(label: string, value: string): Promise<boolean> {
    if (!value) return false;
    console.log(`[Select '${label}' → '${value}']`);

    const selectLocators = [
      this.page.locator(`//div//h1[text()='${label}']//..//select`),
      this.page.locator(`//div//h1[contains(text(),'${label}')]//..//select`),
      this.page.locator(`//label[normalize-space(text())='${label}']/..//select`),
      this.page.locator(`//label[contains(text(),'${label}')]/..//select`),
      this.page.locator(`//div[contains(text(),'${label}')]/..//select`),
      this.page.locator(`select[name="${label}"]`),
      // LWC lightning-combobox locators
      this.page.locator(`//lightning-combobox[.//label[contains(text(), '${label}')]]//button | //lightning-combobox[.//label[contains(text(), '${label}')]]//input`),
      this.page.locator(`//div[contains(@class, 'slds-form-element') and .//label[contains(text(), '${label}')]]//button | //div[contains(@class, 'slds-form-element') and .//label[contains(text(), '${label}')]]//input`)
    ];

    for (const loc of selectLocators) {
      const el = loc.first();
      const isVisible = await el.isVisible({ timeout: 1000 }).catch(() => false);
      if (!isVisible) continue;

      await el.scrollIntoViewIfNeeded().catch(() => { });
      
      const tagName = await el.evaluate(e => e.tagName.toLowerCase()).catch(() => '');
      
      if (tagName !== 'select') {
        // Handle LWC combobox
        await el.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(500);
        
        // Find the exact option in the dropdown list
        const optionLocator = this.page.locator(`lightning-base-combobox-item, li[role="option"], .slds-listbox__item`)
          .filter({ has: this.page.getByText(value, { exact: false }) })
          .filter({ state: 'visible' })
          .first();
          
        if (await optionLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
          await optionLocator.scrollIntoViewIfNeeded().catch(() => {});
          await optionLocator.click({ force: true });
          console.log(`✓ Selected '${value}' for '${label}' (LWC)`);
          await this.page.waitForTimeout(150);
          return true;
        } else {
          // Keyboard fallback
          await this.page.keyboard.press(value.charAt(0));
          await this.page.keyboard.press('Enter');
          console.log(`⚠ Selected '${value}' for '${label}' (LWC Keyboard Fallback)`);
          return true;
        }
      }

      // Handle standard <select>
      let selected = false;
      try {
        await el.selectOption({ value }, { timeout: 1000 });
        selected = true;
      } catch {
        try {
          await el.selectOption({ label: value }, { timeout: 1000 });
          selected = true;
        } catch {
          // Fuzzy match — handles "Rs 25001-50000" vs "Rs. 25001-50000"
          const options = await el.locator('option').allInnerTexts().catch(() => []);
          const cleanTarget = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          for (const opt of options) {
            const cleanOpt = opt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cleanOpt.length > 1 && (cleanOpt.includes(cleanTarget) || cleanTarget.includes(cleanOpt))) {
              await el.selectOption({ label: opt }, { timeout: 1000 }).catch(() => { });
              selected = true;
              break;
            }
          }
        }
      }
      if (selected) {
        console.log(`✓ Selected '${value}' for '${label}' (Select)`);
        await this.page.waitForTimeout(150);
        return true;
      }
    }

    console.log(`⚠ Dropdown '${label}' not found`);
    return false;
  }

  /** Click Proceed / Continue button */
  private async waitAndClickBtn(label: string): Promise<void> {
    console.log(`[Click button '${label}']`);
    const btn = this.page.locator("//button[@class='proceedBtn']")
      .or(this.page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }))
      .or(this.page.locator(`//button[normalize-space(text())='${label}']`))
      .first();

    const isVisible = await btn.isVisible({ timeout: 6000 }).catch(() => false);
    if (isVisible) {
      await btn.scrollIntoViewIfNeeded().catch(() => { });
      await btn.click({ force: true });
      console.log(`✓ Clicked '${label}'`);
    } else {
      console.log(`⚠ Button '${label}' not visible`);
    }
  }

  async getToastMessage(timeoutMs: number = 5000): Promise<string | null> {
    const selectors = [
      ".toastMessage",
      ".slds-notify_toast",
      "[role='alert']",
      ".slds-theme_error",
      ".forcePageError",
      ".pageLevelErrors",
      ".slds-form-element__help",
      ".help-text",
      ".error-message",
      "text='FIELD_CUSTOM_VALIDATION_EXCEPTION'",
      "text='Error! Update failed'"
    ];

    const iterations = Math.ceil(timeoutMs / 200);
    for (let i = 0; i < iterations; i++) {
      for (const sel of selectors) {
        const els = this.page.locator(sel);
        const count = await els.count().catch(() => 0);
        for (let j = 0; j < count; j++) {
          const el = els.nth(j);
          if (await el.isVisible().catch(() => false)) {
            const text = await el.innerText().catch(() => '');
            if (text.trim().length > 0) {
              return text;
            }
          }
        }
      }
      await this.page.waitForTimeout(200);
    }

    return null;
  }
}
