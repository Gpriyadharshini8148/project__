const fs = require('fs');
const glob = require('glob');
const files = glob.sync('tests/customer/*.spec.ts');
files.push('pages/approval/SurrogateDetailsPage.ts');

for (let f of files) {
  let content = fs.readFileSync(f, 'utf-8');
  if (f.includes('SurrogateDetailsPage.ts')) {
    content = content.replace(/async selectSurrogateDetails\([\s\S]*?\): Promise<void> \{/g,
\sync selectSurrogateDetails(
    bankName: string = 'Axis Bank',
    rsaValue?: string,
    rsaRejectReason?: string,
    stopAfterCheckApproval: boolean = false
  ): Promise<void> {\
    );
  } else {
    let regex = /selectSurrogateDetails\s*\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*(?:,\s*([^,]+?))?\s*(?:,\s*([^,]+?))?\s*(?:,\s*([^,)]+?))?\s*\)/g;
    content = content.replace(regex, (m, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11) => {
      let b = (p10 && p10 !== 'undefined') ? p10 : "testData['customerbankname'] || 'Axis Bank'";
      let rsa = (p8 && p8 !== 'undefined') ? p8 : 'undefined';
      let reason = (p9 && p9 !== 'undefined') ? p9 : 'undefined';
      let stop = (p11 && p11 !== 'undefined') ? p11 : 'false';
      return \selectSurrogateDetails(\, \, \, \)\;
    });
  }
  fs.writeFileSync(f, content);
}
