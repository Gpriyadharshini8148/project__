import re

def make_methods_public(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("private async clearAndFillIfNeeded", "public async clearAndFillIfNeeded")
    content = content.replace("private async selectDropdownIfNeeded", "public async selectDropdownIfNeeded")
    content = content.replace("private async clearInputValue", "public async clearInputValue")
    content = content.replace("private normalizeComparisonValue", "public normalizeComparisonValue")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Made methods public in {filepath}")

make_methods_public('pages/customer-onboarding/PoiPage.ts')
make_methods_public('pages/customer-onboarding/PoaPage.ts')
