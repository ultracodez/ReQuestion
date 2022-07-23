import { YesNo } from "./YesNo";
import { PreProcess, Mode } from "../Processors/Pre";
import * as Fin from "finnlp";

export function ProcessedYesNo(q, r, strict) {
  console.debug("Entering PYN()");
  try {
    return YesNo(
      PreProcess(new Fin.Run(q).sentences[0], null, null, {
        NoMessageLog: true,
        EvaluationMode: Mode.YesNo,
        BeginningIdentifierTest: true
      }),
      r,
      strict
    );
  } finally {
    console.debug("Exiting PYN()");
  }
}
