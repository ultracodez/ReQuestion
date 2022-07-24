import Mode from "./Dependencies/Mode";
import * as Fin from "finnlp";

class OptionsObject {
  AllLimitations: boolean = false;
  ForeignWords: boolean = false;
  NoMessageLog: boolean = false;
  EvaluationMode: Mode;
}
class MessageLogResult {
  messages: string[];
  messageLevels: string[];
}

function DetectQLimitations(
  options: OptionsObject,
  messages: string[],
  messageLevels: string[],
  sentence: Fin.SentenceResult
) {}
function DetectYLimitations(
  options: OptionsObject,
  messages: string[],
  messageLevels: string[],
  sentence: Fin.SentenceResult
) {}
function DetectTLimitations(
  options: OptionsObject,
  messages: string[],
  messageLevels: string[],
  sentence: Fin.SentenceResult
) {}

function DetectAllLimitations(
  options: OptionsObject,
  messages: string[],
  messageLevels: string[],
  sentence: Fin.SentenceResult
) {
  if (sentence.tags.includes("FW")) {
    messages.push();
    messageLevels.push("warning");
  }
}

function DetectLimitations(
  options: OptionsObject,
  messages: string[],
  messageLevels: string[],
  sentence: Fin.SentenceResult
): MessageLogResult {
  switch (options.EvaluationMode) {
    case Mode.QuestionWord:
      DetectQLimitations(options, messages, messageLevels, sentence);
      break;
    case Mode.YesNo:
      DetectYLimitations(options, messages, messageLevels, sentence);
      break;
    case Mode.Tag:
      DetectTLimitations(options, messages, messageLevels, sentence);
      break;
  }
  if (options.AllLimitations)
    DetectAllLimitations(options, messages, messageLevels, sentence);
  return { messages, messageLevels };
}

export { Mode, OptionsObject, DetectLimitations, MessageLogResult };
