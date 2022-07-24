import { QuestionWord, Test } from "./index";

type Testy = { question: string; response: string };

export function ExecuteTests(tests: Testy[]) {
  var results = [];

  for (const test of tests) {
    console.error(test);
    results.push(Test(test.question, test.response));
  }

  console.info("Results (should be true):", results);
  console.info(
    (results.filter(Boolean).length / results.length) * 100 + "% Accuracy"
  );
}
