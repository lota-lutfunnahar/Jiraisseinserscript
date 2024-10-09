function clearCheckedCheckboxes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var checkboxColumnIndex = 10; // Adjust this to the index of your checkbox column (e.g., 7 for column J)

  // Get the range of the checkboxes
  var dataRange = sheet.getRange(2, checkboxColumnIndex, sheet.getLastRow() - 1, 1); // Adjust starting row as needed
  var values = dataRange.getValues();

  // Iterate through the rows and clear checked checkboxes
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === true) { // Check if the checkbox is checked
      values[i][0] = false; // Set the checkbox to unchecked
    }
  }

  // Update the range with unchecked checkboxes
  dataRange.setValues(values);
}
