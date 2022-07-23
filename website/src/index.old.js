import { QuestionWord as QWord } from "./QuestionWord/index.js";
import { YesNo as YN } from "./YesNo/YesNo";
import * as Fin from "finnlp";
import { MessageError } from "./Exceptions/messagError";
import nlp from "compromise/three";

//Question Syntax: https://www.englishclub.com/grammar/questions.htm

//TODO: check if there is negative in (Wh-) questions, then use negative if yes. (if not, no)
//TODO: Make better ToNegative (detecting do and adding not)
//TODO: use tNegative (or improvement) instead of .sentences().toNegative()
//TODO: use verbs().to (tense) instead of sentences for more compatibility
//TODO: Make simple double check that question is simple-types

export function IsRestatement(q, t, options) {
  //var nlp = window.nlp;
  console.time("IsRestatement()");
  var question = nlp(q);
  question.terms().last().post(" ");
  if (question.sentences().length > 1 || question.sentences().length < 1) {
    console.error("Too Many (or Too Little) Sentences!");
    console.error(question.sentences());
    throw new MessageError(
      "Messages",
      false,
      [
        "Too many, or too little sentences were found! Remember to only type in one."
      ],
      ["danger"]
    );
  }

  var text = nlp(t);

  let qq = new Fin.Run(q);
  let rr = new Fin.Run(t);

  const tes =
    qq
      .sentenceType()[0]
      .some((item) => item.type === "interrogative" && item.confidence > 50) ||
    /(what|when|who|how|where|why|whom|which|whose)/.test(
      qq.raw.toLowerCase()
    ) ||
    rr
      .sentenceType()[0]
      .some((item) => item.type === "interrogative" && item.confidence > 50);

  if (
    question.sentences().isQuestion().length >= 1 ||
    IsSimple(question) ||
    IsYesNo(question) ||
    tes
  ) {
    //console.log(`Parse(): "${question.text()}", "${text.text()}"`);
    var result = Parse(question, text, options, q);
    console.timeEnd(`IsRestatement()`);
    console.debug(`IsRestatement("${q}","${t}") Result: ${result}`);
    return result;
  } else {
    console.error(`"${question.text()}" Is Not A Question!`);
    throw new MessageError(
      "Messages",
      false,
      ["Not correct sentence type! Are you sure that's a question?"],
      ["danger"]
    );
  }
}

function Parse(q, t, options, originalq) {
  var qpart = q.clone();
  var tpart = t.clone();
  console.log(`Parse(): QPart: ${qpart.text()}`);
  console.log(`Parse(): TPart: ${tpart.text()}`);
  if (qpart && tpart) {
    if (
      !/(what|when|who|how|where|why|whom|which|whose)/.test(
        qpart.text().toLowerCase().trim()
      )
    )
      var A = YesNo(
        qpart,
        tpart,
        options.QWordStrict ? options.QWordStrict : false
      );
    console.debug(`Parse(): YesNo Result: ${A}`);
    if (!A)
      var B = QuestionWord(
        originalq,
        tpart,
        options.QWordStrict ? options.QWordStrict : false
      ); //AttemptB(qpart, tpart);
    console.debug(`Parse(): QuestionWord Result: ${B}`);
    if (!A && !B) var C = Tag(qpart, tpart);
    console.debug(`Parse(): Tag Result: ${C}`);
    if (!A && !B && !C) var D = Simple(q.clone(), t.clone());
    console.debug(`Parse(): Simple Result: ${D}`);
    return A || B || C || D;
  } else return null;
}

function IsYesNo(q) {
  var qpart = q.match(
    "#QuestionWord? (#Verb|Will) (#ProperNoun|#Noun|#Pronoun) #Verb *"
  );

  //console.warn(qpart.match("(Who|What|When|How|Why|Where|Which)"));
  if (!qpart.found) return false;
  else if (qpart.match("(Who|What|When|How|Why|Where|Which)").found)
    return false;
  else return true;
}

function YesNo(q, t, strict) {
  return YN(q.text ? q.text() : q, t.text ? t.text() : t, strict);
}

function IsSimple(q) {
  //be: be, was, is
  var match = q.match(
    "^#QuestionWord? (be|was|is|am|are|were|been|being) (#Noun|#Pronoun|#ProperNoun) *"
  );
  return match.found;
}

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

let Tag = () => false;

function QuestionWord(q, t, strict) {
  console.log(q.text ? q.text() : q);
  let question = new Fin.Run(q.text ? q.text() : q);
  let response = new Fin.Run(t.text ? t.text() : t);
  return QWord(question, response, strict);
}
