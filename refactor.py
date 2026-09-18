import os
import glob
import re

files = glob.glob('tests/customer/*.spec.ts')
files.append('pages/approval/SurrogateDetailsPage.ts')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'SurrogateDetailsPage.ts' in f:
        # We replace the signature
        pattern = re.compile(r'async selectSurrogateDetails\([\s\S]*?\): Promise<void> \{')
        new_sig = '''async selectSurrogateDetails(
    bankName: string = 'Axis Bank',
    rsaValue?: string,
    rsaRejectReason?: string,
    stopAfterCheckApproval: boolean = false
  ): Promise<void> {'''
        content = pattern.sub(new_sig, content)
        content = content.replace("if (rsaValue) {", "if (rsaValue && rsaValue !== '') {")
        
        # We need to remove the creditProgram lines because they refer to creditProgramValue
        content = re.compile(r'// Select Credit Program if visible[\s\S]*?// \}\n').sub('', content)
        content = content.replace('if (checkApprovalButtonLabel && checkApprovalButtonLabel.trim().toLowerCase() === \'proceed\')', 'if (false)')
        
    else:
        # Regex to match the 11 arguments
        pattern = re.compile(r'selectSurrogateDetails\s*\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*(?:,\s*([^,]+?))?\s*(?:,\s*([^,]+?))?\s*(?:,\s*([^,)]+?))?\s*\)')
        
        def replacer(m):
            args = m.groups()
            b = args[9] if args[9] is not None and args[9] != 'undefined' else "testData['customerbankname'] || 'Axis Bank'"
            rsa = args[7] if args[7] is not None and args[7] != 'undefined' else 'undefined'
            reason = args[8] if args[8] is not None and args[8] != 'undefined' else 'undefined'
            stop = args[10] if args[10] is not None and args[10] != 'undefined' else 'false'
            return f'selectSurrogateDetails({b}, {rsa}, {reason}, {stop})'
        
        content = pattern.sub(replacer, content)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
