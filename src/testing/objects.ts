class Sheet {
  header: HeaderRow;
  stickyrows: Row[];
  rows: Row[];
}

class HeaderRow {
  id: string;
  question: string;
  answer: string;
  response: string;
  robotsuccess: string;
  success: string;
  issues: string;
  notes: string;
}

class Row {
  id: number;
  question: string;
  answer: string;
  response: string;
  robotsuccess: boolean;
  success: boolean;
  issues: number;
  notes: string;
}

class Value<T> {
  value: T;
}

export { Value, Row, Sheet };
