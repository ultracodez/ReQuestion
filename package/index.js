import { QuestionWord as QWord } from "./QuestionWord/index";
import { YesNo as YN } from "./YesNo/YesNo";
import { ProcessedYesNo as PYN } from "./YesNo/ProcessedYesNo";
import { Tag as TTag } from "./Tag/Tag";
import * as Fin from "finnlp";
import { MessageError } from "./Exceptions/messagError";
import { OptionsObject } from "./Processors/Pre";
//import nlp from "compromise/three";

//Question Syntax: https://www.englishclub.com/grammar/questions.htm

//TODO: check if there is negative in (Wh-) questions, then use negative if yes. (if not, no)
//TODO: Make better ToNegative (detecting do and adding not)
//TODO: use tNegative (or improvement) instead of .sentences().toNegative()
//TODO: use verbs().to (tense) instead of sentences for more compatibility
//TODO: Make simple double check that question is simple-types
const DEBUG = false;
if (!DEBUG) {
  console = console || {};
  console.log = function () {};
  console.debug = function () {};
  console.warn = function () {};
  console.error = function () {};
  console.info = function () {};
  console.success = function () {};
} /**/

export function IsRestatement(q, t, options) {

  if (!DEBUG) {
    console = console || {};
    console.log = function () {};
    console.debug = function () {};
    console.warn = function () {};
    console.error = function () {};
    console.info = function () {};
    console.success = function () {};
  } /**/
  //var nlp = window.nlp;
  console.time("IsRestatement()");
  var question = new Fin.Run(q);
  if (question.sentences.length > 1 || question.sentences.length < 1) {
    console.error("Too Many (or Too Little) Sentences!");
    console.error(question.sentences);
    throw new MessageError(
      "Messages",
      false,
      [
        "Too many, or too little sentences were found! Remember to only type in one."
      ],
      ["danger"]
    );
  }
  let rr = new Fin.Run(t);

  const tes =
    question
      .sentenceType()[0]
      .some((item) => item.type === "interrogative" && item.confidence > 50) ||
    /(what|when|who|how|where|why|whom|which|whose)/.test(
      question.raw.toLowerCase()
    ) ||
    rr
      .sentenceType()[0]
      .some((item) => item.type === "interrogative" && item.confidence > 50);

  if (/*IsYesNo() || IsSimple()*/ tes) {
    //console.log(`Parse(): "${question.text()}", "${text.text()}"`);
    var result = Parse(question, rr, options, q);
    console.timeEnd(`IsRestatement()`);
    console.debug(`IsRestatement("${q}","${t}") Result: ${result}`);
    return result;
  } else {
    console.error(`"${question.raw}" Is Not A Question!`);
    throw new MessageError(
      "Messages",
      false,
      ["Not correct sentence type! Are you sure that's a question?"],
      ["danger"]
    );
  }
}

function Parse(q, t, options, originalq) {
  let messages = [];
  let messageLevels = [];
  console.log(`Parse(): QPart: ${q.raw}`);
  console.log(`Parse(): TPart: ${t.raw}`);
  if (q && t && q.raw && t.raw) {
    var A = Tag(q, t);
    console.debug(`Parse(): Tag Result: ${A}`);

    if (!/(what|when|who|how|where|why|whom|which|whose)/.test(q.raw))
      if (!A) {
        try {
          var B = YesNo(
            q.raw,
            t.raw,
            options.QWordStrict ? options.QWordStrict : false
          );
        } catch (e) {
          if (e.name && e.name === "MessageError") {
            for (let i = 0; i < e.issues.length; ++i) {
              messages.push(e.issues[i]);
              messageLevels.push(e.issueLevels[i]);
            }
          }
          B = e.result;
        }
        try {
          var Balt = ProcessedYesNo(
            q.raw,
            t.raw,
            options.QWordStrict ? options.QWordStrict : false
          );
        } catch (e) {
          if (e.name && e.name === "MessageError") {
            for (let i = 0; i < e.issues.length; ++i) {
              messages.push(e.issues[i]);
              messageLevels.push(e.issueLevels[i]);
            }
          }
          Balt = e.result;
        }
      }
    if (!!!B) B = false;
    console.debug(`Parse(): YesNo Result: ${B}`);
    if (!A && !B)
      try {
        var C = QuestionWord(
          originalq,
          t.raw,
          options.QWordStrict ? options.QWordStrict : false
        ); //AttemptB(qpart, tpart);
      } catch (e) {
        if (e.name && e.name === "MessageError") {
          for (let i = 0; i < e.issues.length; ++i) {
            messages.push(e.issues[i]);
            messageLevels.push(e.issueLevels[i]);
          }
          C = e.result;
        }
      }
    console.debug(`Parse(): QuestionWord Result: ${C}`);
    //if (!A && !B && !C) var D = Simple(q.clone(), t.clone());
    //console.debug(`Parse(): Simple Result: ${D}`);
    let res = ((A && options.DoTag) || (B && options.DoYesNo) || (C && options.DoQuestionWord) || (Balt  && options.DoYesNo)) === true ? true : false; // || D;
    if (messages.length > 0) {
      throw new MessageError("MessageError", res, messages, messageLevels);
    }
    return res;
  } else return null;
}

function YesNo(q, t, strict) {
  return YN(q, t, strict);
}
function ProcessedYesNo(q, t, strict) {
  return PYN(q, t, strict);
}

function Tag(q, t, strict) {
  return TTag(q.raw, t.raw, strict);
}

function QuestionWord(q, t, strict) {
  console.log(q.raw ? q.raw : q);
  let question = new Fin.Run(q.raw ? q.raw : q);
  let response = new Fin.Run(t.raw ? t.raw : t);
  return QWord(question, response, strict);
}

//deprecated start
/*
var IsSimple = () => false;
function Simple(q, t) {
  console.log("Simple()");
  if (IsSimple(q)) {
    var qpart = q.clone();

    var SimpleVerb = getSimpleVerb(qpart);
    var SimpleSubject = getSimpleSubject(qpart);
    var SimpleOObject = getSimpleOObject(qpart);

    console.log(`Simple(): SimpleVerb: ${SimpleVerb.text()} `);
    console.log(`Simple(): SimpleSubject: ${SimpleSubject.text()}`);
    console.log(`Simple(): SimpleOObject: ${SimpleOObject.text()}`);

    if (qpart.match("^(Why|Where|When|Which|Whom|Who|What)").found) {
      var phraset = nlp(
        SimpleSubject.text() +
          " " +
          SimpleVerb.text().toLowerCase() +
          " " +
          SimpleOObject.text() +
          " because"
      );
      var phrasett = nlp(
        SimpleSubject.text() +
          " " +
          SimpleVerb.text().toLowerCase() +
          " because"
      );
      var orett = false;

      if (SimpleSubject.text().toLowerCase() === "you") {
        var phrasettt = nlp(
          "I " +
            SimpleVerb.text().toLowerCase() +
            " " +
            SimpleOObject.text() +
            " because"
        );
        var phrasetttt = nlp(
          "I " + SimpleVerb.text().toLowerCase() + " because"
        );
        orett = TenseTest(phrasettt, t) || TenseTest(phrasetttt, t);
      }
      return TenseTest(phraset, t) || TenseTest(phrasett, t) || orett;
    } else {
      var phrase = nlp(
        SimpleSubject.text() +
          " " +
          SimpleVerb.text().toLowerCase() +
          " " +
          SimpleOObject.text()
      );
      //console.
      return TenseTest(phrase, t);
    }
  } else return false;
}
/* */
//deprecated end

//obsolete start
/*
function TenseTest(phrase, t) {
  var current = phrase.clone();
  var past = phrase.verbs().first().verbs().toPastTense().all();
  var present = phrase.verbs().first().verbs().toPresentTense().all().clone();
  var future = phrase.verbs().first().verbs().toFutureTense().all().clone();
  var infinitive = phrase.verbs().first().verbs().toInfinitive().all().clone();
  var gerund = phrase.verbs().first().verbs().toGerund().all().clone();
  //var pasty = phrase.verbs().first.verbs().text() === "is" ? phrase.replace()
  console.log(`TenseTest(): Current: ${current.text()}`);
  console.log(`TenseTest(): Past: ${past.text()}`);
  console.log(`TenseTest(): Present: ${present.text()}`);
  console.log(`TenseTest(): Future: ${future.text()}`);
  console.log(`TenseTest(): Infinitive: ${infinitive.text()}`);
  console.log(`TenseTest(): Gerund: ${gerund.text()}`);

  var result =
    NegaTest(current, t) ||
    NegaTest(past, t) ||
    NegaTest(present, t) ||
    NegaTest(future, t) ||
    NegaTest(infinitive, t) ||
    NegaTest(gerund, t);

  return result;
}

function NegaTest(phrase, compare) {
  if (phrase.text() === "" || compare.text() === "") return false;

  console.log(`NegaTest(): Phrase: "${phrase.text()}"`);
  var NegativePhrase = phrase.sentences().clone().toNegative();
  var PositivePhrase = phrase.sentences().clone().toPositive();
  //console.log(`(): $.`);
  console.log(`NegaTest(): Negative "${NegativePhrase.text()}"`);
  console.log(`NegaTest(): Positive: "${PositivePhrase.text()}"`);
  console.log(`NegaTest(): Compare: "${compare.text()}"`);
  return (
    NegativePhrase.text()
      .toLowerCase()
      .includes(compare.text().toLowerCase()) ||
    PositivePhrase.text()
      .toLowerCase()
      .includes(compare.text().toLowerCase()) ||
    compare
      .text()
      .toLowerCase()
      .includes(PositivePhrase.text().toLowerCase()) ||
    compare
      .text()
      .toLowerCase()
      .includes(NegativePhrase.text().toLowerCase()) ||
    phrase.text().toLowerCase().includes(compare.text().toLowerCase()) ||
    compare.text().toLowerCase().includes(phrase.text().toLowerCase())
  );
}

function getSimpleVerb(q) {
  var qpart = q.clone();
  qpart.remove("^(Why|Where|When|Which|Whom|Who|What)");
  return qpart.match("^(be|was|is|am|are|were|been|being)");
}
function getSimpleSubject(q) {
  var qpart = q.clone();
  qpart.remove("^#QuestionWord? (be|was|is|am|are|were|been|being)");
  return qpart.match("^(#ProperNoun|#Pronoun|#Noun)");
}
function getSimpleOObject(q) {
  var qpart = q.clone();
  qpart.remove(
    "^#QuestionWord? (be|was|is|am|are|were|been|being) (#ProperNoun|#Pronoun|#Noun)"
  );
  qpart.terms().last().post(" ");
  return qpart;
}

function YesNoSimple(q, t) {
  if (!IsSimple(q)) return false;
  return Simple(q, t);
}
/* */
