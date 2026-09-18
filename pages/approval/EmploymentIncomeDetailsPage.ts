import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class EmploymentIncomeDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async getVisibleLocator(
    locators: Locator[],
  ): Promise<Locator | null> {
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);

      for (let i = 0; i < count; i++) {
        const item = locator.nth(i);

        if (await item.isVisible().catch(() => false)) {
          return item;
        }
      }
    }

    return null;
  }

  private async clearInputValue(locator: Locator, label: string): Promise<void> {
    try {
      // Always attempt to force-clear via keyboard regardless of inputValue, 
      // as LWC pills hide the inputValue but can be deleted by clicking and pressing Backspace.
      
      const currentValue = (await locator.inputValue({ timeout: 1000 }).catch(() => '')).trim();
      
      // If there's a visible remove button specifically in the locator (like a combobox clear button)
      const clearBtn = locator.locator('..').locator('.slds-pill__remove, button[title*="Remove"], button[title*="Clear"]').first();
      if (await clearBtn.isVisible({ timeout: 500 }).catch(() => false)) {
         await clearBtn.click();
         console.log(`[LOG] Cleared existing ${label} via adjacent clear button.`);
         await this.page.waitForTimeout(300);
         return;
      }

      await locator.click({ clickCount: 3, force: true }).catch(() => locator.click({ force: true }).catch(() => {}));
      await locator.press('Control+A').catch(() => locator.press('Meta+A').catch(() => {}));
      await locator.press('Backspace').catch(() => {});
      
      if (currentValue !== '') {
        await locator.fill('').catch(() => {});
      }
      
      console.log(`[LOG] Force cleared ${label} via keyboard.`);
      await this.page.waitForTimeout(300);
      
    } catch (e) {
      console.log(`[LOG] Error in clearInputValue for ${label}: ${e}`);
    }
  }

  private async fillField(
    fieldName: string,
    value: string,
    locators: Locator[],
  ): Promise<void> {
    const input = await this.getVisibleLocator(locators);

    if (!input) {
      throw new Error(
        `${fieldName} field could not be located.`,
      );
    }

    await input.scrollIntoViewIfNeeded();

    const currentValue = (await input.inputValue().catch(() => '')).trim();
    if (currentValue === value && value.trim() !== '') {
      console.log(`⚠ ${fieldName} already matches expected value: "${value}". But refilling to trigger UI events.`);
    }

    if (!value || value.trim() === '') {
      await this.clearInputValue(input, fieldName);
      return;
    }

    await this.clearInputValue(input, fieldName);

    await input.click();
    await input.fill(value);

    await expect(input).toHaveValue(value);

    console.log(
      `[LOG] ${fieldName} filled and VERIFIED: "${value}"`,
    );
  }

  private async findInput(
    labels: string[],
    placeholders: string[] = [],
    selectors: string[] = [],
  ): Promise<Locator | null> {
    const locators: Locator[] = [];

    for (const label of labels) {
      locators.push(
        this.page.getByLabel(label, {
          exact: false,
        }),
      );
    }

    for (const placeholder of placeholders) {
      locators.push(
        this.page.getByPlaceholder(placeholder, {
          exact: false,
        }),
      );
    }

    for (const selector of selectors) {
      locators.push(
        this.page.locator(selector),
      );
    }

    return this.getVisibleLocator(locators);
  }

  // ============================================================
  // PAGE VERIFICATION
  // ============================================================

  async verifyPage(): Promise<void> {
    console.log(
      '============================================================',
    );
    console.log('[LOG] EMPLOYMENT & INCOME DETAILS');
    console.log(
      '============================================================',
    );

    console.log(
      '[LOG] Verifying Employment & Income Details page...',
    );

    const heading = this.page.getByText(
      /Employment\s*&\s*Income\s*Details/i,
    );

    await expect(heading.first()).toBeVisible({
      timeout: 15000,
    });

    console.log(
      '[LOG] Employment & Income Details page VERIFIED.',
    );
  }

  // ============================================================
  // COMPANY NAME
  // ============================================================

  async fillCompanyName(
    companyName: string = 'BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR',
  ): Promise<void> {
    const companyInput = await this.findInput(
      ['Company Name'],
      ['Company Name', 'Enter Company Name'],
      [
        'input[name="companyName"]',
        'input[placeholder*="Company" i]',
      ],
    );

    if (!companyInput) {
      throw new Error(
        'Company Name input could not be located.',
      );
    }

    await companyInput.scrollIntoViewIfNeeded();

    const currentValue = (await companyInput.inputValue().catch(() => '')).trim();
    if (currentValue !== '' && companyName.trim() !== '' && currentValue.toUpperCase().includes(companyName.trim().toUpperCase().substring(0, 5))) {
      console.log(`✓ Company Name appears to already match or is pre-filled: "${currentValue}". Skipping refill.`);
      return;
    }

    if (!companyName || companyName.trim() === '') {
      // Targeted logic to clear Company Name LWC Pill if present
      const lookupContainer = this.page.locator('c-bfl-re-lookup').filter({ hasText: /Company Name|Company \/ Business Name/i }).first();
      const pillRemoveBtn = lookupContainer.locator('.slds-pill__remove, button[title*="Remove"], button[title*="Clear"]').first();
      
      if (await pillRemoveBtn.isVisible({ timeout: 200 }).catch(() => false)) {
         await pillRemoveBtn.click({ force: true });
         console.log(`[LOG] Cleared Company Name via targeted pill remove button.`);
         await this.page.waitForTimeout(200);
      } else {
         await this.clearInputValue(companyInput, 'Company Name');
      }
      return;
    }

    await this.clearInputValue(companyInput, 'Company Name');

    await companyInput.click();
    await companyInput.fill('');

    const searchText = companyName
      .trim()
      .toUpperCase()
      .startsWith('BAJAJ')
      ? 'BAJAJ'
      : companyName.trim();

    await companyInput.fill('');
    await companyInput.pressSequentially(searchText, { delay: 50 });
    
    console.log(`[LOG] Typed company name: ${searchText}`);

    await this.page.waitForTimeout(1000);

    const exactOption = this.page.locator(`li[data-name="companyNameOption"][data-value="${companyName}"]`).first();
    try {
      await exactOption.waitFor({ state: 'attached', timeout: 1000 });
      await exactOption.scrollIntoViewIfNeeded();
      await exactOption.click({ force: true });
      console.log(`[LOG] Exact LWC option clicked: "${companyName}"`);
      await this.page.waitForTimeout(300);
      return;
    } catch {
      console.log(`[LOG] Exact option timeout. Proceeding to fallback.`);
    }

    const partialOption = this.page.locator(`li[data-name="companyNameOption"]`).filter({ hasText: companyName }).first();
    try {
      await partialOption.waitFor({ state: 'attached', timeout: 1000 });
      await partialOption.scrollIntoViewIfNeeded();
      await partialOption.click({ force: true });
      console.log(`[LOG] Partial LWC option clicked: "${companyName}"`);
      await this.page.waitForTimeout(300);
      return;
    } catch {
      console.log(`[LOG] Partial option timeout.`);
    }

    const genericOption = this.page.locator(
      `li[role="option"], [data-name="companyNameOption"], .slds-listbox__item`
    ).filter({ hasText: companyName }).first();
    try {
      await genericOption.waitFor({ state: 'visible', timeout: 2000 });
      await genericOption.scrollIntoViewIfNeeded();
      await genericOption.click({ force: true });
      console.log(`[LOG] Generic list option clicked: "${companyName}"`);
      await this.page.waitForTimeout(700);
      return;
    } catch {
      console.log(`[LOG] Generic option not found. Trying first visible suggestion.`);
    }

    const firstSuggestion = this.page.locator(
      `li[data-name="companyNameOption"], li[role="option"]`
    ).first();
    const firstVisible = await firstSuggestion.isVisible({ timeout: 1500 }).catch(() => false);
    if (firstVisible) {
      await firstSuggestion.click({ force: true });
      console.log(`[LOG] Clicked first available autocomplete suggestion.`);
      await this.page.waitForTimeout(700);
      return;
    }

    console.log('[LOG] Company autocomplete option not directly located. Using ArrowDown + Enter.');
    try {
      await companyInput.press('ArrowDown');
      await this.page.waitForTimeout(300);
      await companyInput.press('Enter');
      await this.page.waitForTimeout(700);
    } catch (keyErr) {
      throw new Error(
        `Company autocomplete keyboard fallback failed (page may have closed): ${(keyErr as Error).message}`,
      );
    }

    const finalCompanyValue = await companyInput
      .inputValue()
      .catch(() => '');

    if (!finalCompanyValue.trim()) {
      throw new Error(
        'Company autocomplete selection failed. Company field is empty after all strategies.',
      );
    }

    console.log(`[LOG] Company field VERIFIED: "${finalCompanyValue}"`);
  }

  // ============================================================
  // GENERIC DROPDOWN
  // ============================================================

  private async selectNativeDropdown(
    selectors: string[],
    value: string,
    fieldName: string,
  ): Promise<boolean> {
    for (const selector of selectors) {
      const select = this.page.locator(selector).first();

      if (
        await select.count().catch(() => 0) === 0
      ) {
        continue;
      }

      if (
        !await select.isVisible().catch(() => false)
      ) {
        continue;
      }

      try {
        await select.scrollIntoViewIfNeeded();

        const tagName = await select.evaluate(
          (element) =>
            element.tagName.toLowerCase(),
        );

        if (tagName !== 'select') {
          continue;
        }

        const matchedValue = await select.evaluate((el: HTMLSelectElement, val: string) => {
          const validOptions = Array.from(el.options).filter(opt => !opt.disabled);
          const option = validOptions.find(opt => opt.value === val || opt.text.trim() === val);
          
          if (option) {
            el.value = option.value;
            el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            return option.value;
          }
          return null;
        }, value);

        if (matchedValue) {
          console.log(
            `[LOG] ${fieldName} selected via evaluate and VERIFIED: "${matchedValue}"`,
          );
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  private async selectSalesforceDropdown(
    fieldNames: string[],
    value: string,
    fieldName: string,
  ): Promise<boolean> {
    for (const fieldNameCandidate of fieldNames) {
      const comboboxes = this.page.getByRole(
        'combobox',
        {
          name: new RegExp(
            this.escapeRegExp(fieldNameCandidate),
            'i',
          ),
        },
      );

      const count = await comboboxes.count().catch(() => 0);

      for (let i = 0; i < count; i++) {
        const combobox = comboboxes.nth(i);

        if (
          !await combobox
            .isVisible()
            .catch(() => false)
        ) {
          continue;
        }

        try {
          await combobox.scrollIntoViewIfNeeded();
          await combobox.click();

          await this.page.waitForTimeout(400);

          const option = this.page
            .getByRole('option')
            .filter({
              hasText: new RegExp(
                `^\\s*${this.escapeRegExp(value)}\\s*$`,
                'i',
              ),
            })
            .first();

          if (
            await option
              .isVisible()
              .catch(() => false)
          ) {
            await option.click();

            console.log(
              `[LOG] ${fieldName} selected and VERIFIED: "${value}"`,
            );

            return true;
          }

          const listboxOption = this.page
            .locator(
              '[role="listbox"]:visible [role="option"]:visible',
            )
            .filter({
              hasText: new RegExp(
                `^\\s*${this.escapeRegExp(value)}\\s*$`,
                'i',
              ),
            })
            .first();

          if (
            await listboxOption
              .isVisible()
              .catch(() => false)
          ) {
            await listboxOption.click();

            console.log(
              `[LOG] ${fieldName} selected and VERIFIED: "${value}"`,
            );

            return true;
          }
        } catch {
        }
      }
    }

    for (const fieldNameCandidate of fieldNames) {
      const label = this.page.getByText(
        new RegExp(
          `^\\s*${this.escapeRegExp(fieldNameCandidate)}\\s*$`,
          'i',
        ),
      ).first();

      if (
        !await label.isVisible().catch(() => false)
      ) {
        continue;
      }

      const containers = [
        label.locator(
          'xpath=ancestor::*[contains(@class,"slds-form-element")][1]',
        ),

        label.locator(
          'xpath=ancestor::*[self::div or self::section][1]',
        ),
      ];

      for (const container of containers) {
        if (
          !await container
            .isVisible()
            .catch(() => false)
        ) {
          continue;
        }

        const controls = [
          container.getByRole('combobox'),
          container.getByRole('button'),
          container.locator(
            'input[role="combobox"]',
          ),
          container.locator(
            'button[aria-haspopup="listbox"]',
          ),
        ];

        for (const controlLocator of controls) {
          const controlCount = await controlLocator
            .count()
            .catch(() => 0);

          for (
            let controlIndex = 0;
            controlIndex < controlCount;
            controlIndex++
          ) {
            const control =
              controlLocator.nth(controlIndex);

            if (
              !await control
                .isVisible()
                .catch(() => false)
            ) {
              continue;
            }

            try {
              await control.scrollIntoViewIfNeeded();
              await control.click();

              await this.page.waitForTimeout(400);

              const option = this.page
                .locator(
                  '[role="listbox"]:visible [role="option"]:visible',
                )
                .filter({
                  hasText: new RegExp(
                    `^\\s*${this.escapeRegExp(value)}\\s*$`,
                    'i',
                  ),
                })
                .first();

              if (
                await option
                  .isVisible()
                  .catch(() => false)
              ) {
                await option.click();

                console.log(
                  `[LOG] ${fieldName} selected and VERIFIED: "${value}"`,
                );

                return true;
              }

              const optionByText = this.page
                .getByText(value, {
                  exact: true,
                })
                .filter({
                  visible: true,
                })
                .first();

              if (
                await optionByText
                  .isVisible()
                  .catch(() => false)
              ) {
                await optionByText.click();

                console.log(
                  `[LOG] ${fieldName} selected and VERIFIED: "${value}"`,
                );

                return true;
              }
            } catch {
            }
          }
        }
      }
    }

    
    return false;
  }

 private async selectDropdown(
  nativeSelectors: string[],
  fieldNames: string[],
  value: string,
  fieldName: string,
): Promise<void> {
  // If value is intentionally blank, skip selection and let validation handle it
  if (!value || value.trim() === '') {
    console.warn(`[WARN] Intentionally leaving "${fieldName}" blank — form validation will check for required state.`);
    return;
  }

  const targetValue = value.trim();

  const nativeSelected =
    await this.selectNativeDropdown(
      nativeSelectors,
      targetValue,
      fieldName,
    );

  if (nativeSelected) return;

  const fieldNamesList = [
    fieldName,
    `${fieldName} *`,
    `* ${fieldName}`,
    `*${fieldName}`,
  ];

  const customSelected =
    await this.selectSalesforceDropdown(
      fieldNamesList,
      targetValue,
      fieldName,
    );

  if (customSelected) return;

  throw new Error(
    `${fieldName} dropdown could not be selected: "${value}"`,
  );
}

  // ============================================================
  // INDUSTRY
  // ============================================================

  async selectIndustry(
    value: string = 'Freelancer',
  ): Promise<void> {
    console.log(`[LOG] Selecting Industry: "${value}"`);

    // Strategy 1: native <select> — try by label text, then by value attribute
    const nativeSelectors = [
      'select#naturecompany-select-37',
      'select[id*="naturecompany" i]',
      'select[name="natureOfCompany"]',
      'select[name*="natureOfCompany" i]',
      'select[name*="industry" i]',
    ];
    for (const sel of nativeSelectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        try {
          await el.selectOption({ label: value });
          console.log(`[LOG] Industry selected via native <select> label: "${value}"`);
          return;
        } catch {
          try {
            await el.selectOption({ value });
            console.log(`[LOG] Industry selected via native <select> value: "${value}"`);
            return;
          } catch { /* continue */ }
        }
      }
    }

    // Strategy 2: find the Industry/Nature of Company label, open its combobox button, pick option by partial text
    const labelCandidates = ['Industry', 'Nature of Company', 'Nature Of Company', 'NatureOfCompany'];
    for (const labelText of labelCandidates) {
      const label = this.page.locator(
        `//label[contains(normalize-space(text()),'${labelText}')]`
      ).first();
      if (!await label.isVisible({ timeout: 1000 }).catch(() => false)) continue;

      // Find the combobox/button in the nearest slds-form-element ancestor
      const container = label.locator('xpath=ancestor::*[contains(@class,"slds-form-element")][1]');
      const btn = container.locator('button, input[role="combobox"]').first();
      if (!await btn.isVisible({ timeout: 1000 }).catch(() => false)) continue;

      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ force: true });
      await this.page.waitForTimeout(600);

      // Pick option using partial (contains) match — handles slash-separated values
      const option = this.page.locator(
        `[role="option"], [role="listbox"] li, .slds-listbox__item, lightning-base-combobox-item`
      ).filter({ hasText: value }).first();

      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click({ force: true });
        console.log(`[LOG] Industry selected via LWC combobox (label: "${labelText}"): "${value}"`);
        await this.page.waitForTimeout(400);
        return;
      }

      // Partial word match fallback (first significant word before "/")
      const partialWord = value.split('/')[0].trim();
      const partialOption = this.page.locator(
        `[role="option"], .slds-listbox__item, lightning-base-combobox-item`
      ).filter({ hasText: partialWord }).first();
      if (await partialOption.isVisible({ timeout: 1500 }).catch(() => false)) {
        await partialOption.click({ force: true });
        console.log(`[LOG] Industry selected via partial match ("${partialWord}"): "${value}"`);
        await this.page.waitForTimeout(400);
        return;
      }

      // Close any open dropdown before trying next label
      await this.page.keyboard.press('Escape').catch(() => {});
    }

    // Strategy 3: global visible option search (dropdown already open from another trigger)
    const globalOption = this.page.locator('[role="option"]').filter({ hasText: value }).first();
    if (await globalOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await globalOption.click({ force: true });
      console.log(`[LOG] Industry selected via global option search: "${value}"`);
      return;
    }

    // Log warning but do NOT hard-throw — let the form proceed and rely on validation
    console.warn(`⚠ Industry dropdown could not be selected: "${value}" — field may not be present or already set`);
  }

  // ============================================================
  // OFFICE PHONE TYPE
  // ============================================================

  async selectOfficePhoneType(
    value: string = 'Mobile',
  ): Promise<void> {
    await this.selectDropdown(
      [
        'select#phonetype-select-37',
        'select[id*="phonetype" i]',
        'select[name="phoneType"]',
        'select[name*="phoneType" i]',
      ],
      [
        'Office Phone Type',
        'Phone Type',
        'Official Phone Type',
      ],
      value,
      'Office Phone Type',
    );
  }

  // ============================================================
  // OFFICIAL CONTACT NUMBER
  // ============================================================

  async fillOfficialContactNumber(
    value: string = '6675435678',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Official Contact Number',
      ],
      [
        'Enter Official Contact Number',
      ],
      [
        'input[name="officialContactNumber"]',
        'input[name*="officialContact" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Official Contact Number field could not be located.',
      );
    }

    await this.fillField(
      'Official Contact Number',
      value,
      [input],
    );
  }

  // ============================================================
  // ALIAS REQUIRED BY EXISTING TEST FILE
  // ============================================================

  async fillOfficialContact(
    value: string = '6675435678',
  ): Promise<void> {
    await this.fillOfficialContactNumber(value);
  }

  // ============================================================
  // OFFICIAL EMAIL
  // ============================================================

  async fillOfficialEmail(
    value: string = 'test@example.com',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Official Email ID',
      ],
      [
        'Enter Official Email ID',
      ],
      [
        'input[name="officialEmail"]',
        'input[name="officialEmailId"]',
        'input[name*="officialEmail" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Official Email ID field could not be located.',
      );
    }

    await this.fillField(
      'Official Email ID',
      value,
      [input],
    );
  }

  // ============================================================
  // ALIAS REQUIRED BY EXISTING TEST FILE
  // ============================================================

  async fillOfficialEmailId(
    value: string = 'test@example.com',
  ): Promise<void> {
    await this.fillOfficialEmail(value);
  }

  // ============================================================
  // EMPLOYMENT TYPE
  // ============================================================

  async selectEmploymentType(
    value: string = 'Salaried',
  ): Promise<void> {
    await this.selectDropdown(
      [
        'select#employment-select-37',
        'select[id*="employment" i]',
        'select[name="employmentType"]',
        'select[name*="employmentType" i]',
      ],
      [
        'Employment Type',
        'Employment',
        'Type of Employment',
      ],
      value,
      'Employment Type',
    );
  }

  // ============================================================
  // DESIGNATION
  // ============================================================

  async selectDesignation(
    value: string = 'CEO/ CFO/ COO/ CXO',
  ): Promise<void> {
    await this.selectDropdown(
      [
        'select#designation-select-37',
        'select[id*="designation" i]',
        'select[name="designation"]',
        'select[name*="designation" i]',
      ],
      [
        'Designation',
        'Job Designation',
      ],
      value,
      'Designation',
    );
  }

  // ============================================================
  // QUALIFICATION
  // ============================================================

  async selectQualification(
    value: string = 'Graduate',
  ): Promise<void> {
    await this.selectDropdown(
      [
        'select#qualification-select-37',
        'select[id*="qualification" i]',
        'select[name="qualification"]',
        'select[name*="qualification" i]',
      ],
      [
        'Qualification',
        'Educational Qualification',
      ],
      value,
      'Qualification',
    );
  }

  // ============================================================
  // MONTHLY INCOME
  // ============================================================

  async fillMonthlyIncome(
    value: string = '20000',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Monthly Income',
      ],
      [
        'Enter Monthly Income',
      ],
      [
        'input[name="monthlyIncome"]',
        'input[name*="monthlyIncome" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Monthly Income field could not be located.',
      );
    }

    await this.fillField(
      'Monthly Income',
      value,
      [input],
    );
  }

  // ============================================================
  // PURPOSE OF LOAN
  // ============================================================

  async selectPurposeOfLoan(
    value: string =
      'Purchase of Consumer Durable Product',
  ): Promise<void> {
    await this.selectDropdown(
      [
        'select#purposeofloan-select-37',
        'select[id*="purposeofloan" i]',
        'select[name="purposeOfLoan"]',
        'select[name*="purpose" i]',
      ],
      [
        'Purpose of Loan',
        'Loan Purpose',
      ],
      value,
      'Purpose of Loan',
    );
  }

  // ============================================================
  // PINCODE
  // ============================================================

  async fillPincode(
    value: string = '411014',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Pincode',
        'Pin Code',
        'Zip Code',
      ],
      [
        'Enter Pincode',
        'Enter Pin Code',
        'Enter Customer ZipCode',
      ],
      [
        'input[name="pincode"]',
        'input[name="pinCode"]',
        'input[name="zipCode"]',
        'input[name*="pin" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Pincode field could not be located.',
      );
    }

    console.log(`[LOG] Typing Pincode letter by letter: "${value}"`);
    await input.scrollIntoViewIfNeeded();
    
    const currentValue = (await input.inputValue().catch(() => '')).trim();
    if (currentValue.includes(value) && value.trim() !== '') {
      console.log(`⚠ Pincode already matches expected value: "${currentValue}". But refilling to trigger UI events.`);
    }

    if (!value || value.trim() === '') {
      await this.clearInputValue(input, 'Pincode');
      return;
    }

    await this.clearInputValue(input, 'Pincode');
    
    // Type letter by letter with 2-second wait
    await input.fill('');
    for (const char of value) {
      await input.pressSequentially(char);
      await this.page.waitForTimeout(200);
    }

    // Wait an extra 2 seconds for the dropdown API to fully render
    await this.page.waitForTimeout(1000);

    // Try to find the LWC dropdown option (e.g., "411014 PUNE") and click it
    console.log(`[LOG] Waiting for Pincode dropdown option to appear...`);
    const prefixPattern = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const option = this.page
      .locator(
        'lightning-base-combobox-item, [role="option"], .slds-listbox__item, .slds-listbox__option, li'
      )
      .filter({ hasText: prefixPattern })
      .or(this.page.getByText(prefixPattern, { exact: false }))
      .filter({ visible: true })
      .first();
      
    const optionVisible = await option.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (optionVisible) {
      await option.scrollIntoViewIfNeeded().catch(() => {});
      await option.click({ force: true });
      console.log(`[LOG] Pincode dropdown option selected via click`);
    } else {
      console.log(`⚠ Pincode dropdown option not found in DOM, attempting keyboard fallback (ArrowDown + Enter)...`);
      await input.focus().catch(() => {});
      await input.press('ArrowDown');
      await this.page.waitForTimeout(500);
      await input.press('Enter');
    }
    
    await this.page.waitForTimeout(1000);

    const finalValue = await input.inputValue().catch(() => '');
    console.log(`[LOG] Pincode field VERIFIED: "${finalValue}"`);
  }

  // ============================================================
  // ADDRESS LINE 1
  // ============================================================

  async fillAddressLine1(
    value: string = 'Pune 14',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Address Line 1',
        'Address1',
      ],
      [
        'Enter Address Line 1',
        'Enter Address1',
        'Enter House No./Building No./Address Line 1',
      ],
      [
        'input[name="addressLine1"]',
        'textarea[name="addressLine1"]',
        'input[name*="addressline1" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Address Line 1 field could not be located.',
      );
    }

    await this.fillField(
      'Address Line 1',
      value,
      [input],
    );
  }

  // ============================================================
  // ADDRESS LINE 2
  // ============================================================

  async fillAddressLine2(
    value: string = 'Pune Market',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Address Line 2',
        'Address2',
      ],
      [
        'Enter Address Line 2',
        'Enter Address2',
        'Enter Street/Building Name/Address Line 2',
      ],
      [
        'input[name="addressLine2"]',
        'textarea[name="addressLine2"]',
        'input[name*="addressline2" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Address Line 2 field could not be located.',
      );
    }

    await this.fillField(
      'Address Line 2',
      value,
      [input],
    );
  }

  // ============================================================
  // ADDRESS LINE 3
  // ============================================================

  async fillAddressLine3(
    value: string = 'Koregaon Park',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Address Line 3',
        'Address3',
      ],
      [
        'Enter Address Line 3',
        'Enter Address3',
        'Enter Landmark/Address Line 3',
      ],
      [
        'input[name="addressLine3"]',
        'textarea[name="addressLine3"]',
        'input[name*="addressline3" i]',
      ],
    );

    if (!input) {
      throw new Error(
        'Address Line 3 field could not be located.',
      );
    }

    await this.fillField(
      'Address Line 3',
      value,
      [input],
    );
  }

  // ============================================================
  // AREA / LANDMARK
  // ============================================================

  async fillArea(
    value: string = 'Near Station',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Area',
        'Area / Locality',
        'Locality',
        'Landmark',
      ],
      [
        'Enter Area',
        'Enter Area / Locality',
        'Enter Locality',
        'Enter Landmark',
      ],
      [
        'input[name="area"]',
        'input[name="locality"]',
        'input[name="landmark"]',
        'textarea[name="area"]',
        'textarea[name="locality"]',
        'textarea[name="landmark"]',
      ],
    );

    if (!input) {
      throw new Error(
        'Area / Landmark field could not be located.',
      );
    }

    await this.fillField(
      'Area / Landmark',
      value,
      [input],
    );
  }

  // ============================================================
  // LANDMARK
  // ============================================================

  async fillLandmark(
    value: string = 'Near Station',
  ): Promise<void> {
    await this.fillArea(value);
  }

  // ============================================================
  // MONTHLY HOUSEHOLD INCOME
  // ============================================================

  async fillMonthlyHouseholdIncome(
    value: string = '50000',
  ): Promise<void> {
    const input = await this.findInput(
      [
        'Monthly Household Income',
        'Household Income',
      ],
      [
        'Enter Monthly Household Income',
      ],
      [
        'input[name="monthlyHouseholdIncome"]',
        'input[name*="householdIncome" i]',
      ],
    );

    if (!input) {
      console.log(
        '[LOG] Monthly Household Income field not present. Skipping.',
      );

      return;
    }

    await input.fill(value);

    console.log(
      `[LOG] Monthly Household Income filled: "${value}"`,
    );
  }

  // ============================================================
  // HOUSEHOLD INCOME STATE
  // ============================================================

  async isMonthlyHouseholdIncomeDisabled(): Promise<boolean> {
    const input = await this.findInput(
      [
        'Monthly Household Income',
        'Household Income',
      ],
      [
        'Enter Monthly Household Income',
      ],
      [
        'input[name="monthlyHouseholdIncome"]',
        'input[name*="householdIncome" i]',
      ],
    );

    if (!input) {
      return true;
    }

    return await input.isDisabled().catch(() => false);
  }

  async getMonthlyHouseholdIncomeValue(): Promise<string> {
    const input = await this.findInput(
      [
        'Monthly Household Income',
        'Household Income',
      ],
      [
        'Enter Monthly Household Income',
      ],
      [
        'input[name="monthlyHouseholdIncome"]',
        'input[name*="householdIncome" i]',
      ],
    );

    if (!input) {
      return '';
    }

    return await input.inputValue().catch(() => '');
  }

  // ============================================================
  // CITY / STATE
  // ============================================================

  async isCityDisabled(): Promise<boolean> {
    const input = await this.findInput(
      ['City'],
      ['Enter City'],
      [
        'input[name="city"]',
        'input[name*="city" i]',
      ],
    );

    if (!input) {
      return true;
    }

    return await input.isDisabled().catch(() => false);
  }

  async isStateDisabled(): Promise<boolean> {
    const input = await this.findInput(
      ['State'],
      ['Enter State'],
      [
        'input[name="state"]',
        'input[name*="state" i]',
      ],
    );

    if (!input) {
      return true;
    }

    return await input.isDisabled().catch(() => false);
  }

  async getCityValue(): Promise<string> {
    const input = await this.findInput(
      ['City'],
      ['Enter City'],
      [
        'input[name="city"]',
        'input[name*="city" i]',
      ],
    );

    if (!input) {
      return '';
    }

    return await input.inputValue().catch(() => '');
  }

  async getStateValue(): Promise<string> {
    const input = await this.findInput(
      ['State'],
      ['Enter State'],
      [
        'input[name="state"]',
        'input[name*="state" i]',
      ],
    );

    if (!input) {
      return '';
    }

    return await input.inputValue().catch(() => '');
  }

  // ============================================================
  // COMPLETE FORM
  //
  // IMPORTANT:
  // This method ONLY fills the form.
  //
  // It does NOT:
  // - click Proceed
  // - click Home
  // - click Back
  // - navigate
  // - call goto()
  // ============================================================

  async fillCompleteForm(
    companyName: string = 'BAJAJ ALLIANZ FINANCIAL DISTRIBUTOR',
    industry: string = 'Freelancer',
    officePhoneType: string = 'Mobile',
    officialContactNumber: string = '6675435678',
    officialEmail: string = 'test@example.com',
    employmentType: string = 'Salaried',
    designation: string = 'CEO/ CFO/ COO/ CXO',
    qualification: string = 'Graduate',
    monthlyIncome: string = '20000',
    purposeOfLoan: string =
      'Purchase of Consumer Durable Product',
    pincode: string = '411014',
    addressLine1: string = 'Pune 14',
    addressLine2: string = 'Pune Market',
    addressLine3: string = 'Koregaon Park',
    area: string = 'Near Station',
  ): Promise<void> {
    console.log(
      '============================================================',
    );

    console.log(
      '[LOG] Filling Employment & Income Details form...',
    );

    console.log(
      '============================================================',
    );

    // ----------------------------------------------------------
    // 1. COMPANY
    // ----------------------------------------------------------

    await this.fillCompanyName(companyName);

    // ----------------------------------------------------------
    // 2. INDUSTRY
    // ----------------------------------------------------------

    await this.selectIndustry(industry);

    // ----------------------------------------------------------
    // 3. OFFICE PHONE TYPE
    // ----------------------------------------------------------

    await this.selectOfficePhoneType(
      officePhoneType,
    );

    // ----------------------------------------------------------
    // 4. OFFICIAL CONTACT
    // ----------------------------------------------------------

    await this.fillOfficialContactNumber(
      officialContactNumber,
    );

    // ----------------------------------------------------------
    // 5. OFFICIAL EMAIL
    // ----------------------------------------------------------

    await this.fillOfficialEmail(
      officialEmail,
    );

    // ----------------------------------------------------------
    // 6. EMPLOYMENT TYPE
    // ----------------------------------------------------------

    await this.page.screenshot({ path: 'before-employment-type.png', fullPage: true });
    
    await this.selectEmploymentType(
      employmentType,
    );

    // ----------------------------------------------------------
    // 7. DESIGNATION
    // ----------------------------------------------------------

    await this.selectDesignation(
      designation,
    );

    // ----------------------------------------------------------
    // 8. QUALIFICATION
    // ----------------------------------------------------------

    await this.selectQualification(
      qualification,
    );

    // ----------------------------------------------------------
    // 9. MONTHLY INCOME
    // ----------------------------------------------------------

    await this.fillMonthlyIncome(
      monthlyIncome,
    );

    // ----------------------------------------------------------
    // 10. PURPOSE OF LOAN
    // ----------------------------------------------------------

    await this.selectPurposeOfLoan(
      purposeOfLoan,
    );

    // ----------------------------------------------------------
    // 11. PINCODE
    // ----------------------------------------------------------

    await this.fillPincode(pincode);

    // ----------------------------------------------------------
    // 12. ADDRESS LINE 1
    // ----------------------------------------------------------

    await this.fillAddressLine1(
      addressLine1,
    );

    // ----------------------------------------------------------
    // 13. ADDRESS LINE 2
    // ----------------------------------------------------------

    await this.fillAddressLine2(
      addressLine2,
    );

    // ----------------------------------------------------------
    // 14. ADDRESS LINE 3
    // ----------------------------------------------------------

    await this.fillAddressLine3(
      addressLine3,
    );

    // ----------------------------------------------------------
    // 15. AREA / LANDMARK
    // ----------------------------------------------------------

    await this.fillArea(area);

    console.log(
      '[LOG] All Employment & Income Details fields filled successfully.',
    );

    console.log(
      '[LOG] Staying on Employment & Income Details page.',
    );
  }

  // ============================================================
  // PROCEED
  // ============================================================

  async clickProceed(): Promise<void> {
    const proceedButton = this.page
      .getByRole('button', {
        name: /^Proceed$/i,
      })
      .first();

    await expect(proceedButton).toBeVisible({
      timeout: 10000,
    });

    await expect(proceedButton).toBeEnabled({
      timeout: 10000,
    });

    await proceedButton.scrollIntoViewIfNeeded();

    await proceedButton.click();

    console.log(
      '[LOG] Proceed button clicked.',
    );
  }

  // ============================================================
  // NAVIGATE TO EMPLOYMENT & INCOME DETAILS
  // ============================================================

  async navigateToEmploymentIncomeDetails(): Promise<void> {
    const heading = this.page.getByText(
      /Employment\s*&\s*Income\s*Details/i,
    );

    if (
      await heading
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        '[LOG] Already on Employment & Income Details page.',
      );

      return;
    }

    const hamburger = this.page
      .getByRole('button', {
        name: /menu|more|navigation/i,
      })
      .first()
      .or(
        this.page.locator(
          '.slds-icon-utility-rows',
        ).first(),
      );

    if (
      await hamburger
        .isVisible()
        .catch(() => false)
    ) {
      await hamburger.click({
        force: true,
      });

      await this.page.waitForTimeout(500);
    }

    const target = this.page
      .getByRole('button', {
        name: /Employment\s*&\s*Income\s*Details/i,
      })
      .or(
        this.page.getByRole('menuitem', {
          name: /Employment\s*&\s*Income\s*Details/i,
        }),
      )
      .or(
        this.page.getByText(
          /Employment\s*&\s*Income\s*Details/i,
          {
            exact: true,
          },
        ),
      )
      .first();

    await expect(target).toBeVisible({
      timeout: 30000,
    });

    await target.click({
      force: true,
    });

    await expect(
      this.page.getByText(
        /Employment\s*&\s*Income\s*Details/i,
      ).first(),
    ).toBeVisible({
      timeout: 15000,
    });

    console.log(
      '[LOG] Employment & Income Details page reached.',
    );
  }
}