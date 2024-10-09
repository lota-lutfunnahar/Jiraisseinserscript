function onButtonClick() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Define the range with checkboxes (assuming column H has checkboxes starting from row 2)
  var checkboxColumnIndex = 7; // Column G (7th column)
  var dataRange = sheet.getRange(2, checkboxColumnIndex, sheet.getLastRow() - 1, 1); // Starts from row 2
  
  // Get values from the checkbox column
  var data = dataRange.getValues();
  
  // Counter for checked rows
  var checkedCount = 0;
  
  // Iterate over the rows to count checked boxes
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === true) { // Check if checkbox is checked
      checkedCount++;
    }
  }
  
  // Show alert based on the count of checked checkboxes
  if (checkedCount === 0) {
    SpreadsheetApp.getUi().alert('Please select task for insert in Jira');
  } else {
    SpreadsheetApp.getUi().alert('Number of checked rows: ' + checkedCount);
  }
}
