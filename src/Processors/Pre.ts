import * as Fin from "finnlp";
import Mode from "./Dependencies/Mode";

class OptionsObject {
  BeginningIdentifierTest: boolean = false;
  NoMessageLog: boolean = false;
  PrepositionTest: boolean = false;
  EvaluationMode: Mode;
}

function PreProcess(
  s,
  messages: string[],
  messagesLevels: string[],
  options: OptionsObject
): string {
  if (
    options.NoMessageLog ||
    messages === null ||
    messages === undefined ||
    messagesLevels === null ||
    messagesLevels === undefined
  ) {
    messages = [];
    messagesLevels = [];
  }

  let didRemStart = false;
  console.log("PreProcess(): s:", s);
  let sentence = s.sentence;
  console.log("WhatTest");
  if (
    options.BeginningIdentifierTest &&
    (options.EvaluationMode === Mode.YesNo
      ? !/be|can|could|dare|do|have|may|might|must|need|ought|shall|should|will|would/.test(
          s.tokens[0]
        )
      : options.EvaluationMode === Mode.QuestionWord
      ? !/what|when|who|how|where|why|whom|which|whose/.test(s.tokens[0])
      : false)
  ) {
    messages.push(
      'A beginning identifier was found and removed! This includes questions like "In addition, what was..." See Limitations'
    );
    messagesLevels.push("info");
    let arr = sentence.split(",").slice(1).join(",").trim();
    console.log("PreProcess: Remove start:", arr);
    sentence = arr;
    didRemStart = true;
    options.BeginningIdentifierTest = false;
  }
  console.log("IN Test");
  if (s.tags[0] === "IN" && !didRemStart && options.PrepositionTest) {
    messages.push(
      'A beginning preposition was found and removed! This includes questions like "Of what country did he come from?." See Limitations'
    );
    messagesLevels.push("info");
    let arr = sentence.split(" ").slice(1);
    arr[arr.length - 1] =
      arr[arr.length - 1].endsWith("?") ||
      arr[arr.length - 1].endsWith("!") ||
      arr[arr.length - 1].endsWith(".")
        ? arr[arr.length - 1].slice(0, -1)
        : arr[arr.length - 1];
    arr = arr.concat([s.tokens[0] + sentence.slice(-1)]).join(" ");
    options.PrepositionTest = false;
    return arr;
  } else if (didRemStart) {
    let z = new Fin.Run("" + sentence);
    let y = PreProcess(z.sentences[0], messages, messagesLevels, options);
    return y;
  } else return sentence;
}

export { PreProcess, Mode, OptionsObject };
