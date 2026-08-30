import re

filepath = r"d:\SFDC_POS_Playwright_TS_____\pages\customer-onboarding\ZipCodePage.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix enterZipCode
enter_zipcode_regex = r"(const input = this\.textbox\(label\);\s*await input\.waitFor\(\{ state: 'visible', timeout: 10000 \}\);)(.*?)(await input\.press\('Control\+A'\);\s*await input\.pressSequentially\(codePrefix, \{ delay: 50 \}\);)"
enter_replacement = r"""\1

    const clearBtn = this.page.locator(`//label[text()='${label}']/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearBtn.click();
      await this.waitFor(500);
    }
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.fill('');
    await this.page.waitForTimeout(100);
    await input.fill(codePrefix);
    await input.click();
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(500);"""

content = re.sub(enter_zipcode_regex, enter_replacement, content, flags=re.DOTALL)

# Fix lookupBflBranch
bfl_branch_regex = r"(const input = this\.textbox\('BFL Branch'\);\s*await input\.waitFor\(\{ state: 'visible', timeout: 10000 \}\);\s*await input\.scrollIntoViewIfNeeded\(\);\s*await input\.click\(\);\s*await input\.press\('Control\+A'\);\s*const codePrefix = value\.split\('-'\)\[0\]\.trim\(\);\s*await input\.pressSequentially\(codePrefix, \{ delay: 50 \}\);)"

bfl_replacement = r"""const input = this.textbox('BFL Branch');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const clearBtn = this.page.locator(`//label[text()='BFL Branch']/following::button[contains(@title, 'Clear') or contains(@title, 'Remove')][1]`).first();
    if (await clearBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearBtn.click();
      await this.waitFor(500);
    }
    
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.fill('');
    await this.page.waitForTimeout(100);
    const codePrefix = value.split('-')[0].trim();
    await input.fill(codePrefix);
    await input.click();
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(500);"""

content = re.sub(bfl_branch_regex, bfl_replacement, content, flags=re.DOTALL)

# Also fix the wait logic in lookupBflBranch to match enterZipCode
wait_logic_regex = r"(const appeared = await anyOption\.waitFor\(\{ state: 'visible', timeout: 4000 \}\)\.then\(\(\) => true\)\.catch\(\(\) => false\);\s*if \(!appeared\) await this\.waitFor\(1000\);)"
wait_logic_replacement = r"""const appeared = await anyOption.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
    if (!appeared) {
      await this.page.keyboard.press('Tab');
      await this.waitFor(500);
      await input.click({ force: true }).catch(() => { });
      await this.waitFor(300);
    }"""
content = re.sub(wait_logic_regex, wait_logic_replacement, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ZipCodePage.ts")
