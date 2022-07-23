import { DoTests } from "./testing";
import { Progress, CreateProgress } from "./progress";

console = console || {};
console.log = function () {};
console.debug = function () {};
console.warn = function () {};
console.error = function () {};
console.info = function () {};
console.success = function () {};

if ((global.gapi || window.gapi) && document.getElementById("gapi_module")) {
  var gapi = global.gapi ? global.gapi : window.gapi;
  // 1. Load the JavaScript client library.
  gapi.load("client:auth2", InitializeClient);
}

var authorizeButton = document.getElementById("authorize-button");
var signoutButton = document.getElementById("signout-button");

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = "none";
    signoutButton.style.display = "block";
  } else {
    authorizeButton.style.display = "block";
    signoutButton.style.display = "none";
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

var progress;
async function InitializeClient() {
  await gapi.client
    .init({
      apiKey: "AIzaSyANkiRWBlN5QpNmn8WCXyJzYrwqNHhZ6Dw",
      // Your API key will be automatically added to the Discovery Document URLs.
      discoveryDocs: [
        "https://sheets.googleapis.com/$discovery/rest?version=v4"
      ],
      // clientId and scope are optional if auth is not required.
      clientId:
        "987155256875-70grat34824mf3u51gtl0kmavkatljnp.apps.googleusercontent.com",
      scope:
        "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/spreadsheets"
    })
    .then(async function () {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;

      progress = CreateProgress();
      progress.addLink(document.getElementById("bar"), "value");
      progress.addLink(document.getElementById("p"), "innerText");

      document.getElementById("test").onclick = async function () {
        document.getElementById("p").innerText = "Working...";
        document.getElementById("xx").style.display = "initial";
        await DoTests("True", gapi, progress);
        document.getElementById("xx").style.display = "none";
        document.getElementById("p").innerText = "Done!";
      };
      document.getElementById("ntest").onclick = async function () {
        document.getElementById("p").innerText = "Working...";
        document.getElementById("xx").style.display = "initial";
        await DoTests("False", gapi, progress);
        document.getElementById("xx").style.display = "none";
        document.getElementById("p").innerText = "Done!";
      };
      // 3. Initialize and make the API request.
    })
    .catch(function (reason) {
      console.error("Error:", reason);
    });
}

/*const delay = (ms) => new Promise((res) => setTimeout(res, ms));
function percentage(partialValue, totalValue) {
  return (partialValue / totalValue) * 100;
}

const isStrTrue = (str) => {
  return (
    str &&
    (typeof str === "string" || str instanceof String) &&
    str.trim() &&
    str.trim() !== "" &&
    str !== null &&
    str !== undefined &&
    str.match(/^ *$/) === null
  );
};

const nullVal = "00NULL??LKKKXXKS<?^&*()NO>s";

function makeObject(x) {
  var batchRowValues = x["values"];
  var rows = [];

  for (var i = 3; i < batchRowValues.length; i++) {
    var rowObject = {};
    for (var j = 0; j < batchRowValues[0].length; j++) {
      rowObject[batchRowValues[0][j]] = nullVal;
      try {
        rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
      } catch {
        rowObject[batchRowValues[0][j]] = nullVal;
      }
    }
    rows.push(rowObject);
  }
  return rows;
}

async function doTest() {
  try {
    let sheety = await gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        range: "True!A:H"
      })
      .then((response) => response.result);

    navigator.clipboard.writeText(JSON.stringify(makeObject(sheety)));
    /*let falsheety = await gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        range: "False!A:H"
      })
      .then((response) => response.result);
    let falsheet = falsheety.values;*/

/*navigator.clipboard.writeText(JSON.stringify(sheety));

    let sheet = sheety.values;
    var data = [];

    var is = [];
    let ras = sheet.filter((item, index) => {
      if (index > 2 && isStrTrue(item[1]) && isStrTrue(item[3])) return true;
      return false;
    }).length;
    for (let xx = 3; xx < sheet.length; ++xx) {
      const i = xx;
      if (is.includes(i)) continue;
      is.push(i);
      let row = sheet[i];
      if (isStrTrue(row[1]) && isStrTrue(row[3])) {
        let rowresult;
        try {
          rowresult = IsRestatement(row[1], row[3], false);
        } catch (e) {
          if (!(e.name && e.name === "MessageError")) rowresult = false;
          else rowresult = e.result;
        }
        let rowNum = 3 + parseInt(row[0]);
        let values = [[rowresult]];

        let prog = percentage(i, ras);

        data.push({
          range: `True!E${rowNum}`,
          values: values
        });
        document.getElementById("bar").value = prog;
        document.getElementById("bar").innerText = prog + "%";
        document.getElementById("p").innerText = prog + "%";
        await delay(5);
      }
    }
    document.getElementById("bar").value = 100;
    document.getElementById("bar").innerText = 100 + "%";
    document.getElementById("p").innerText = 100 + "%";

    var body = { data: data, valueInputOption: "USER_ENTERED" };
    let x = window.confirm("Do you want to update the spreadsheet?");
    if (x)
      await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        resource: body
      });*/
/* } catch (e) {
    alert(e);
    alert(JSON.stringify(e));
  }
} /*

    let sheet = sheety.values;
    var data = [];

    var is = [];
    let ras = sheet.filter((item, index) => {
      if (index > 2 && isStrTrue(item[1]) && isStrTrue(item[3])) return true;
      return false;
    }).length;
    for (let xx = 3; xx < sheet.length; ++xx) {
      const i = xx;
      if (is.includes(i)) continue;
      is.push(i);
      let row = sheet[i];
      if (isStrTrue(row[1]) && isStrTrue(row[3])) {
        let rowresult;
        try {
          rowresult = IsRestatement(row[1], row[3], false);
        } catch (e) {
          if (!(e.name && e.name === "MessageError")) rowresult = false;
          else rowresult = e.result;
        }
        let rowNum = 3 + parseInt(row[0]);
        let values = [[rowresult]];

        let prog = percentage(i, ras);

        data.push({
          range: `False!E${rowNum}`,
          values: values
        });
        document.getElementById("bar").value = prog;
        document.getElementById("bar").innerText = prog + "%";
        document.getElementById("p").innerText = prog + "%";
        await delay(5);
      }
    }
    document.getElementById("bar").value = 100;
    document.getElementById("bar").innerText = 100 + "%";
    document.getElementById("p").innerText = 100 + "%";

    var body = { data: data, valueInputOption: "USER_ENTERED" };
    let x = window.confirm("Do you want to update the spreadsheet?");
    if (x)
      await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        resource: body
      });
  } catch (e) {
    alert(e);
    alert(JSON.stringify(e));
  }
}
*/

/*async function doTestFalses() {
  try {
    let sheety = await gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        range: "False!A:H"
      })
      .then((response) => response.result);
    /*let falsheety = await gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: "1SZ7Kc3ZkEtp-39wXiH_nP8OgtjPaUfbR9QZAuXP1Hno",
        range: "False!A:H"
      })
      .then((response) => response.result);
    let falsheet = falsheety.values;*/
