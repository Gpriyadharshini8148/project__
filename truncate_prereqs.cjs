const fs = require('fs');

function truncatePrereq(filename, marker) {
  let content = fs.readFileSync(filename, 'utf8');
  
  const markerIdx = content.indexOf(marker);
  if (markerIdx === -1) {
    console.log("Marker not found in " + filename);
    return;
  }
  
  // The marker is something like: "if (await poiPage.isCurrentScreen('POI')) {"
  // We want to delete from this marker to the end of completePrerequisites.
  // The end of completePrerequisites is at: "  await approvalDetailsPage.navigateToApprovalDetails();\n  });\n}"
  
  const endMarker = "  await test.step('Approval Details', async () => {\n    await approvalDetailsPage.navigateToApprovalDetails();\n  });\n}";
  const endIdx = content.indexOf(endMarker);
  
  if (endIdx === -1) {
    console.log("End marker not found in " + filename);
    return;
  }
  
  const blockToRemove = content.substring(markerIdx, endIdx + endMarker.length);
  // Replace the block with just "}" to close the function
  content = content.replace(blockToRemove, "}");
  
  fs.writeFileSync(filename, content);
  console.log("Truncated prereqs for " + filename);
}

truncatePrereq('tests/customer/09_poi.spec.ts', "if (await poiPage.isCurrentScreen('POI')) {");
truncatePrereq('tests/customer/10_poa.spec.ts', "if (await poaPage.isCurrentScreen('POA')) {");
