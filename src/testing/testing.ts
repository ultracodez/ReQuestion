import * as Data from "./data";
import * as TestObjects from "./objects";
import { Progress } from "./progress";
import { IsRestatement } from "../index";

async function DoTests(sheetname: string, gapi: any, progress?: Progress) {
  let sheet = await Data.ReadData(sheetname, gapi, 3);
  var updateData = [];

  let totalRows = sheet.rows.filter((item) => {
    return item.question !== null && item.response !== null;
  }).length;

  if (progress) await progress.updatePercent(0);

  for (let i = 0; i < sheet.rows.length; ++i) {
    const rowNumber = 4 + i;
    const range = `${sheetname}!E${rowNumber}`;
    const row: TestObjects.Row = sheet.rows[i];

    if (row.question !== null && row.response !== null) {
      let rowresult: boolean = false;

      let percent = (rowNumber / totalRows) * 100;

      try {
        rowresult = IsRestatement(row.question, row.response, {});
      } catch (e) {
        if (!(e.name && e.name === "MessageError")) rowresult = false;
        else rowresult = e.result;
      }

      updateData.push({
        range: range,
        values: [[rowresult]]
      });

      if (progress) await progress.updatePercent(percent);
    }
  }

  var body = { data: updateData, valueInputOption: "USER_ENTERED" };
  let x = window.confirm("Do you want to update the spreadsheet?");
  if (x) {
    await gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
      resource: body
    });
  }

  if (progress) await progress.updatePercent(100);
}

export { DoTests };
