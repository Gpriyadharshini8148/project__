import csv, json
with open('E2E_Temp.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

html = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SFDC POS — All E2E / A-Series Test Cases</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; background: #f4f6fb; color: #222; padding: 32px 20px; }
    .container { max-width: 1100px; margin: auto; }
    h1 { font-size: 22px; color: #1a3c6e; border-left: 5px solid #2563eb; padding-left: 14px; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: #555; margin-bottom: 28px; padding-left: 19px; }
    .section-title { font-size: 15px; font-weight: 700; color: #fff; background: #1a3c6e; padding: 9px 16px; border-radius: 6px 6px 0 0; margin-top: 28px; }
    .badge { background: #2563eb; border-radius: 4px; font-size: 11px; padding: 2px 8px; font-weight: 600; margin-left: 8px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 0 0 6px 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    thead th { background: #e8eef8; color: #1a3c6e; font-size: 12px; font-weight: 700; text-align: left; padding: 10px 14px; border-bottom: 2px solid #c0cfe8; text-transform: uppercase; letter-spacing: 0.4px; }
    thead th:first-child { width: 54px; text-align: center; }
    thead th:nth-child(2) { width: 130px; }
    thead th:nth-child(3) { width: 190px; }
    tbody tr:nth-child(even) { background: #f7f9fd; }
    tbody tr:hover { background: #dbeafe; }
    tbody td { padding: 9px 14px; font-size: 13px; border-bottom: 1px solid #e5eaf3; vertical-align: middle; }
    tbody td:first-child { text-align: center; font-weight: 600; color: #888; }
    tbody td:nth-child(2) { font-weight: 700; color: #1a3c6e; font-family: monospace; }
    .pe { background: #dbeafe; color: #1e40af; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .ne { background: #fce7f3; color: #9d174d; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .btn-bar { display: flex; gap: 12px; margin-bottom: 24px; }
    button { background: #2563eb; color: white; border: none; padding: 9px 22px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    button.g { background: #059669; }
    button.g:hover { background: #047857; }
    @media print { body { background: white; padding: 10px; } .btn-bar { display: none; } }
  </style>
</head>
<body>
<div class="container">
  <h1>SFDC POS - All E2E / A-Series Test Cases</h1>
  <p class="subtitle">Complete Master List of E2E and A-Series Test Cases across all modules | Generated: 27-Aug-2026</p>
  <div class="btn-bar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="g" onclick="downloadCSV()">Download as CSV</button>
  </div>
'''

current_mod = ""
index = 1
csv_rows = []
for row in data:
    if row['Module'] != current_mod:
        if current_mod != "":
            html += "</tbody></table>"
        current_mod = row['Module']
        index = 1
        html += f"<div class='section-title'>Module: {current_mod} <span class='badge'>{current_mod}.spec.ts</span></div>"
        html += "<table><thead><tr><th>S.No.</th><th>Test Case ID</th><th>Test Case Type</th><th>Description</th></tr></thead><tbody>"
    cls = "ne" if "Negative" in row['Type'] else "pe"
    clean_desc = row['Description'].replace("+'", "->").replace('?"', "-").replace('\u2192', "->").encode("ascii", "ignore").decode("ascii").strip()
    html += f"<tr><td>{index}</td><td>{row['ID']}</td><td><span class='{cls}'>{row['Type']}</span></td><td>{clean_desc}</td></tr>"
    csv_rows.append([current_mod, str(index), row['ID'], row['Type'], clean_desc])
    index += 1

if current_mod != "":
    html += "</tbody></table>"

csv_json = json.dumps(csv_rows)
html += f'''
</div>
<script>
function downloadCSV() {{
  const data = {csv_json};
  const rows = [['Module','S.No.','Test Case ID','Test Case Type','Description']].concat(data);
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
  const blob = new Blob([csv], {{ type: 'text/csv' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'SFDC_POS_All_E2E_TestCases.csv';
  a.click();
}}
</script>
</body></html>
'''
with open('SFDC_POS_All_E2E_TestCases.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("File created: SFDC_POS_All_E2E_TestCases.html")
