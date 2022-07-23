import * as TestMethods from "./methods";
import * as TestObjects from "./objects";

async function ReadData(
  sheet: string,
  gapi: any,
  stickyrows: number
): Promise<TestObjects.Sheet> {
  var sheety = await gapi.client.sheets.spreadsheets.values
    .get({
      spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
      range: sheet + "!A:H",
      majorDimension: "ROWS"
    })
    .then((response) => response.result);

  var Sheet: TestObjects.Sheet = {
    header: {
      id: "ID",
      question: "Question",
      answer: "Answer",
      response: "Response",
      robotsuccess: "Robot Success",
      success: "Succeeded?",
      issues: "Issues",
      notes: "Notes"
    },
    stickyrows: [],
    rows: []
  };

  for (let i = 1; i < sheety.values.length; ++i) {
    if (i < stickyrows) {
      Sheet.stickyrows.push(TestMethods.CreateRowFromArray(sheety.values[i]));
    } else {
      Sheet.rows.push(TestMethods.CreateRowFromArray(sheety.values[i]));
    }
  }

  return Sheet;
}

export { ReadData };
