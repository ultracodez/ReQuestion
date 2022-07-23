import * as Fin from "finnlp";
import "fin-emphasis";
import "fin-negation";
import "fin-sentiment";
import "fin-tense";
import "fin-ukus";
import "fin-sentence-type";

import { Inflectors } from "en-inflectors";
import humannames from "humannames";
import { getGender } from "gender-detection-from-name";
import { replaceConfusables, resolveContractions } from "en-norm";
import stemmer from "en-stemmer";

import { MessageError } from "../Exceptions/messagError";

import Negate from "../QuestionWord/negate";
import pronouns from "../QuestionWord/pronouns";

var messages = [];
var messagesLevels = [];

export function Tag(q, r, strict) {
  let question = new Fin.Run("" + q);
  let response = new Fin.Run("" + r);
  console.log("Tag(): Sentence:", question);
  console.log("Tag(): Response:", response);

  messages = [];
  try {
    console.debug("Tag()", "Initiating type checks!");
    if (!(question.sentences.length > 1 && question.sentences.length < 1)) {
      console.log(`Question Sentence Type:`, question.sentenceType());
      console.log(`Response Sentence Type:`, response.sentenceType());
      console.debug("Preliminary checks done!");
      try {
        let result = Extraction(question, response, strict);
        if (messages.length < 1) {
          return result;
        } else {
          throw new MessageError("Messages", result, messages, messagesLevels);
        }
      } finally {
        console.debug("Exiting Tag();");
      }
    } else {
      console.error("Too many, or too little sentences!");
      throw new MessageError(
        "Messages",
        false,
        ["Too many, or too little sentences were found!"],
        ["danger"]
      );
    }
  } catch (e) {
    console.error("An error has occured! More info:", e);
    if (e.name && e.name === "MessageError") throw e;
    else throw e;

    /*else
      throw new MessageError(
        "Messages",
        false,
        ["An error has occured! More info:" + e.toString()],
        ["danger"]
      );/**/
  }
}

function Extraction(q, r, strict) {
  let question = q.sentences[0];
  let response = r.sentences[0];
  let len = 0;
  console.debug("Extraction()");
  let withoutTagger = "";
  for (let i = 0; i < question.tokens.length; ++i) {
    if (
      [
        "which",
        "why",
        "who",
        "what",
        "how",
        "whom",
        "where",
        "whose",
        "when"
      ].includes(question.tokens[i].toLowerCase().trim())
    )
      break;
    if (
      [".", ",", ":", "SYM", "POS"].includes(question.tags[i]) ||
      question.tokens[i].includes("'s")
    )
      withoutTagger += question.tokens[i];
    else withoutTagger += " " + question.tokens[i];
    len++;
  }
  console.info("Extraction(): withoutTagger:", withoutTagger);

  if (len <= 1) return false;

  try {
    return TenseTest(withoutTagger, r);
  } finally {
    console.debug("Exiting Extraction()");
  }
}

function TenseTest(g, r) {
  console.debug("Entering TenseTest()");
  let sentence = r.sentences[0].sentence.toLowerCase().trim();
  let generated = g.toLowerCase().trim();
  console.log("TenseTest(): Response:", sentence);
  console.log("TenseTest(): Question:", generated);

  if (sentence.trim() === "" || generated.trim() === "") return false;
  if (sentence.includes(generated)) return true;

  let Sentence = new Fin.Run(generated);

  let FirstVerbIndex = Sentence.sentences[0].tags.findIndex(
    (item) =>
      item.includes("VB") ||
      item.includes("IN") ||
      item.includes("TO") ||
      item.includes("MD")
  );
  let FirstVerb = Sentence.sentences[0].tokens[FirstVerbIndex];
  FirstVerbIndex = generated.indexOf(FirstVerb);

  if (!FirstVerb) return false;

  let infly = new Inflectors(FirstVerb);

  let versions = [];

  let singular = new Inflectors(infly.toSingular());
  let plural = new Inflectors(infly.toPlural());

  versions.push(infly.word);

  versions.push(singular.word);
  versions.push(singular.toGerund());
  versions.push(singular.toPast());
  versions.push(singular.toPastParticiple());
  versions.push(singular.toPresent());
  versions.push(singular.toPresentS());
  versions.push(stemmer(singular.word));

  versions.push(plural.word);
  versions.push(singular.toGerund());
  versions.push(singular.toPast());
  versions.push(singular.toPastParticiple());
  versions.push(singular.toPresent());
  versions.push(singular.toPresentS());
  versions.push(stemmer(plural.word));

  if (/(be|am|is|are|was|were|being|been)/.test(FirstVerb)) {
    versions.push("be", "am", "is", "are", "was", "were", "being", "been");
  }

  console.info("TenseTest(): versions:", versions);

  let res = [];

  for (const version of versions) {
    if (!version) continue;
    let sent =
      generated.slice(0, FirstVerbIndex) +
      version +
      generated.slice(FirstVerbIndex + FirstVerb.length, generated.length);
    console.log("TenseTest(): version:", version);
    console.warn("TenseTest(): sent:", sent);
    if (sent && sentence) res.push(NegaTest(sent, sentence));
  }

  console.info("TenseTest(): res:", res);

  try {
    return res.some((item) => item === true);
  } finally {
    console.debug("Exiting TenseTest()");
  }
}

//NegaTest("You are", "You are not");
//NegaTest("walk", "");
//NegaTest("he walked", "");
//NegaTest("walk!", "");
//NegaTest("I walk", "");
//NegaTest("got walked", "");
//NegaTest("they were walked", "");
//NegaTest(0, 0);
//NegaTest([], "");
//NegaTest({ lol: 0, fi: '"' }, 0);
//NegaTest();
//NegaTest("");

function Norm(str) {
  let outputstr = "";
  outputstr += str;
  outputstr = resolveContractions(outputstr);
  outputstr = replaceConfusables(outputstr);
  return outputstr;
}

function NegaTest(g, r) {
  console.log(`NegaTest: g{${g}} r{${r}}`);
  var gr = Norm(g);
  var rr = Norm(r);
  var negated = Negate(gr);
  if (gr === "" || rr === "" || negated === "") return false;
  //var negated = negate(g);
  return rr.includes(gr) || rr.includes(negated);
}

function Verb(posTag) {
  console.info("Verb():", posTag);
  console.info("Verb():", /(IN|TO|VB|MD)/.test(posTag) ? true : false);
  return /(IN|TO|VB|MD)/.test(posTag) ? true : false;
}
