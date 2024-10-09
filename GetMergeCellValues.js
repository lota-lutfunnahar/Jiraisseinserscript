function getValuesFromColumnA() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TEST SPRINT 3");
  var range = sheet.getRange('A:A');  // Select all of column A
  var values = range.getValues();  // Get all values in column A
  
  for (var i = 0; i < values.length; i++) {
    var cellValue = values[i][0];  // Get the value of each cell in column A

    if (cellValue === "") {  // If the cell is empty
      Logger.log("Row " + (i + 1) + " is empty.");
      
      // Check if the empty cell is part of a merged range
      var currentRange = sheet.getRange(i + 1, 1); // Current cell in column A
      var mergedRanges = currentRange.getMergedRanges();
      
      if (mergedRanges.length > 0) {  // If the cell is part of a merged range
        var firstCellInMergedRange = mergedRanges[0].getCell(1, 1).getValue();  // Get value of the first cell in the merged range
        Logger.log("Merged cell detected at Row " + (i + 1) + ". First value in merged range: " + firstCellInMergedRange);
      } else {
        Logger.log("Row " + (i + 1) + " is not part of a merged range.");
      }
    } else {
      Logger.log("Row " + (i + 1) + ": " + cellValue);  // Log the row and value if it's not empty
    }
  }
}
