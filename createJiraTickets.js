function createJiraTickets() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TEST SPRINT 3");
  var rows = sheet.getDataRange().getValues();
  
  // Replace 'your-jira-domain' with your actual Jira domain
  var jiraUrl = '__/rest/api/3/issue/bulk'; // your company domain 
  var username = ''; // your Jira username or email
  var apiToken = ''; // your Jira API token
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(username + ':' + apiToken),
    "Content-Type": "application/json"
  };

  // Define the checkbox column index (e.g., column 10 = index 9 if checkboxes are in column J)
  var checkboxColumnIndex = 9;
  var dataRange = sheet.getRange(2, checkboxColumnIndex, sheet.getLastRow() - 1, 1); // Starts from row 2
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
    Logger.log("please select tasks for insert to jira");
    SpreadsheetApp.getUi().alert('Please select task for insert in Jira');
  } 



  var validComponents = getProjectComponents(headers);
  // var validBugSeverities = getBugSeverityOptions(headers);
  var validComponentMap = {};
  validComponents.forEach(component => {
    validComponentMap[component.name] = component.id; // Assuming component has 'name' and 'id'
  });
  // var validBugSeverityMap = {};
  // validBugSeverities.forEach(option => {
  //   validBugSeverityMap[option.value] = option.id; // Assuming option has 'value' and 'id'
  // });


  // Iterate through rows starting from row 2 (to skip the header)
  for (var i = 1; i < rows.length; i++) {
    // Check if the checkbox is checked (TRUE) in the checkbox column
    if (rows[i][checkboxColumnIndex] !== true) {
      continue; // Skip this row if the checkbox is not checked
    }

    // Extract row data
    var parentIssueSummary = rows[i][0];  // Parent Issue summary from the first column
    var summary = rows[i][1];             // Summary from the second column
    var bugType = rows[i][2];            // bugType from the third column
    var bugSeverity = rows[i][3]         // bugSeverity from the fourth column
    var component = rows[i][4]           // component from the fifth column
    var assigneeEmail = rows[i][6];       // Assignee email from the seven column
    var issueType = "Bug";              // Issue type from the no column


    var bugTypeArray = Array.isArray(bugType) ? bugType : [bugType];
    var customFieldArray = bugTypeArray.map(bug => ({
      "type": "BugType", // Replace with actual type if needed
      "value": bug // Assuming value is directly the bugType; adjust if it requires more structure
    }));

    Logger.log("bug type "+ customFieldArray);
    Logger.log(bugType);

    var bugSeverityArray = Array.isArray(bugSeverity) ? bugSeverity : [bugSeverity];
    var customFieldBugSeverityArray = bugSeverityArray.map(bugsev => ({
      "type": "Bug Severity", // Replace with actual type if needed
      "value": bugsev // Assuming value is directly the; adjust if it requires more structure
    }));

    // var bugSeverityId = validBugSeverityMap[bugSeverity];
    // if (!bugSeverityId) {
    //   Logger.log("Invalid Bug Severity: " + bugSeverity);
    //   continue; // Skip this row if the bug severity is invalid
    // }

    Logger.log("bug severity "+ customFieldBugSeverityArray);
    Logger.log(bugSeverity);

    var componentsArray = Array.isArray(component) ? component : [component];
    var customFieldComponentsArray = componentsArray.map(component => ({
      "type": "components", // Replace with actual type if needed
      "value": component // Assuming value is directly the bugType; adjust if it requires more structure
    }));

    var componentIds = [];
    for (let comp of componentsArray) {
      let compId = validComponentMap[comp];
      if (compId) {
        componentIds.push({ "id": compId });
      } else {
        Logger.log("Invalid Component: " + comp);
      }
    }

    Logger.log("components "+ customFieldComponentsArray);
    Logger.log(component);


    // Check for duplicate issues by summary ***
    // if (isDuplicateIssue(summary, headers)) {
    //   Logger.log('Duplicate issue found with summary: ' + summary);
    //   continue; // Skip this row if a duplicate issue is found
    // }
    

    //check if empty of merge cells  
    var currentRange = sheet.getRange(i + 1, 1); // Current cell in column A
    var mergedRanges = currentRange.getMergedRanges();
    
    if (mergedRanges.length > 0) {  // If the cell is part of a merged range
      var firstCellInMergedRange = mergedRanges[0].getCell(1, 1).getValue();  // Get value of the first cell in the merged range
      var parentIssueSummary = firstCellInMergedRange;
      Logger.log("Merged cell detected at Row " + (i + 1) + ". First value in merged range: " + firstCellInMergedRange);
    }

    // Search for the parent issue by name (summary)
    var parentIssueId = getParentIssueIdByName(parentIssueSummary, headers);
    if (!parentIssueId) {
      Logger.log('Parent issue not found for summary: ' + parentIssueSummary);
      continue; // Skip to the next row if the parent issue is not found
    }


    // Fetch the account ID for the assignee email
    var assigneeAccountId = getJiraAccountId(assigneeEmail);
    Logger.log("jirs user id " + assigneeAccountId);
    Logger.log("sheet value " +  assigneeEmail);

    // Prepare payload for Jira ticket creation
    var payload = JSON.stringify({
      "issueUpdates": [{
        "fields": {
          "project": {
            "key": "RASA" // Replace PROJECTKEY with your actual project key TII
          },
          "parent": {
            "key": parentIssueId
          },
          "summary": summary,
          "issuetype": {
            "name": issueType
          },
          "assignee": assigneeAccountId ? { "id": assigneeAccountId } : null,
          // Add custom field or other fields if needed
          "customfield_10095": customFieldArray ,
          // "customfield_10096": [{ "id": bugSeverityId }], // Use the ID for the custom field
          "components": componentIds.length ? componentIds : null 
        }
      }]
    });

    // Set options for the Jira API call
    var options = {
      "method": "post",
      "headers": headers,
      "payload": payload,
      "muteHttpExceptions": true
    };

    // Try to send the request to create the Jira ticket
    try {
      var response = UrlFetchApp.fetch(jiraUrl, options);
      Logger.log(response.getContentText()); // Log the response for debugging
      SpreadsheetApp.getUi().alert('Successfully create Jira Tasks ');
    } catch (error) {
      Logger.log("Error creating Jira ticket: " + error.message);
      SpreadsheetApp.getUi().alert('Facing error while creating Jira Task ' + error.message);
    }
  }
}

// Function to check if an issue with the same summary already exists
function isDuplicateIssue(summary, headers) {
  var jql = 'summary ~ "' + summary + '"';
  var searchUrl = 'https://portonics.atlassian.net/rest/api/3/search?jql=' + encodeURIComponent(jql);

  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };

  try {
    // var response = UrlFetchApp.fetch(searchUrl, options);
    // var result = JSON.parse(response.getContentText());

    // Check if any issues are found
    if (result.issues && result.issues.length > 0) {
      return true; // Duplicate found
    }
  } catch (error) {
    Logger.log("Error checking for duplicate issue: " + error.message);
  }
  return false; // No duplicates found
}

// Function to fetch the parent issue ID by its summary
function getParentIssueIdByName(summary, headers) {
  // var jql = 'summary ~ "' + summary + '"'; 

  var jql = 'project= RASA AND issuetype = Epic AND summary ~ "' + summary + '"';
  var searchUrl = 'https://portonics.atlassian.net/rest/api/3/search?jql=' + encodeURIComponent(jql);

  Logger.log(searchUrl);
  Logger.log(summary);

  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(searchUrl, options);
    var result = JSON.parse(response.getContentText());

    Logger.log(result.issues[0].key);

    // Check if any issues are found
    if (result.issues && result.issues.length > 0) {
      return result.issues[0].key; // Return the first matched issue key (ID)        
     } else {
      Logger.log("No issues found with the summary: " + summary);
      return null;
    }
  } catch (error) {
    Logger.log("Error fetching parent issue ID: " + error.message);
    return null;
  }
}

// Function to fetch Jira Account ID based on the email
function getJiraAccountId(email) {
  var jiraUserUrl = 'https://portonics.atlassian.net/rest/api/3/user/search?query=' + encodeURIComponent(email);
  var headers = {
    "Authorization": "Basic " + Utilities.base64Encode('email' + ':' + 'token'),
    "Content-Type": "application/json"
  };

  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(jiraUserUrl, options);
    var users = JSON.parse(response.getContentText());

    // Check if user found and return the first match's accountId
    if (users && users.length > 0) {
      return users[0].accountId; // Return the accountId of the first matched user
    } else {
      Logger.log("No user found for email: " + email);
      return null;
    }
  } catch (error) {
    Logger.log("Error fetching account ID: " + error.message);
    return null;
  }
}

function getProjectComponents(headers) {
  var componentsUrl = 'https://portonics.atlassian.net/rest/api/3/project/RASA/components'; // Replace RASA with your project key
  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(componentsUrl, options);
    return JSON.parse(response.getContentText()); // Return the available components
  } catch (error) {
    Logger.log("Error fetching components: " + error.message);
    return [];
  }
}
function getBugSeverityOptions(headers) {
  var fieldOptionsUrl = 'https://portonics.atlassian.net/rest/api/3/customFieldOptions/customfield_10096';
  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(fieldOptionsUrl, options);
    var result = JSON.parse(response.getContentText());
    return result.values; // Return the available options for Bug Severity
  } catch (error) {
    Logger.log("Error fetching Bug Severity options: " + error.message);
    return [];
  }
}
