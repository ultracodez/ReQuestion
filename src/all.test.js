import { IsRestatement } from "./index";
//import SteinStore from "stein-js-client";

/*import sheetdb from "sheetdb-node";

// create a config file
var config = {
  address: "zdg1nm5dui7kq"
};

// Create new client
var client = sheetdb(config);*/

const ten_min_int = 600000;

test(
  "All",
  async () => {
    expect(await doTests()).toBe(true);
  },
  ten_min_int
);

async function doTests() {}
/*const client = new SteinStore(
    "https://api.steinhq.com/v1/storages/625892ab4906bb05373b254a"
  );
  /*throw new EvalError(); /* */
/*
  let sheet = await client.read("SO8X").then(
    (result) => result,
    (error) => console.error(error)
  );
  console.log(sheet);
  let result = true;
  for (let i = 3; i < sheet.length; ++i) {
    let row = sheet[i];
    if (row.Question && row.Response) {
      test(
        "Row: " + i,
        async () => {
          var rowresult;
          try {
            rowresult = IsRestatement(row.Question, row.Response, false);
          } catch (e) {
            if (!(e.name && e.name === "MessageError")) throw e;
            else rowresult = e.result;
          }
          await client.update("ID", row.ID, {
            "Robot Success": rowresult ? "TRUE" : "FALSE"
          });
          expect(rowresult).toBe(true);
          result = result && rowresult;
        },
        ten_min_int
      );
    }
  }
  return result;
  /*let sheet = JSON.parse(
    await client.read().then(
      (result) => result,
      (error) => {
        console.error(error);
      }
    )
  );

  let result = true;
  for (let i = 3; i < sheet.length; ++i) {
    let row = sheet[i];
    if (row.Question && row.Response) {
      test(
        "Row: " + i,
        async () => {
          var rowresult;
          try {
            rowresult = IsRestatement(row.Question, row.Response, false);
          } catch (e) {
            if (!(e.name && e.name === "MessageError")) throw e;
            else rowresult = e.result;
          }
          await client.update("ID", row.ID, {
            "Robot Success": rowresult ? "TRUE" : "FALSE"
          });
          expect(rowresult).toBe(true);
          result = result && rowresult;
        },
        ten_min_int
      );
    }
  }
  return result;*/

/*test("All", async () => {
  let sheet = await SheetDB.read(
    "https://sheetdb.io/api/v1/zdg1nm5dui7kq",
    {}
  ).then(
    (result) => result,
    (error) => {
      console.error(error);
    }
  );
  let result = true;
  for (let i = 3; i < sheet.length; ++i) {
    let row = sheet[i];
    if (row.Question && row.Response) {
      test("Row: " + i, () => {
        var rowresult;
        try {
          rowresult = IsRestatement(row.Question, row.Response, false);
        } catch (e) {
          if (!(e.name && e.name === "MessageError")) throw e;
          else rowresult = e.result;
        }
        expect(rowresult).toBe(true);
        result = result && rowresult;
      });
    }
  }
  expect(result).toBe(true);
});/* */
