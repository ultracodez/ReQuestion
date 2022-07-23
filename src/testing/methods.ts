import { Row } from "./objects";

function CreateRowFromArray(arr: any[]): Row {
  var Row: Row = {
    id: null,
    question: null,
    answer: null,
    response: null,
    robotsuccess: null,
    success: null,
    issues: null,
    notes: null
  };

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === "") continue;
    switch (i) {
      case 0:
        Row.id = arr[i];
        break;
      case 1:
        Row.question = arr[i];
        break;
      case 2:
        Row.answer = arr[i];
        break;
      case 3:
        Row.response = arr[i];
        break;
      case 4:
        Row.robotsuccess = arr[i];
        break;
      case 5:
        Row.success = arr[i];
        break;
      case 6:
        Row.issues = arr[i];
        break;
      case 7:
        Row.notes = arr[i];
        break;
    }
  }

  return Row;
}

export { CreateRowFromArray };
