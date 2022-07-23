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
import { allTrim } from "../Modifiers/index";

import { PreProcess, OptionsObject as PreOptions } from "../Processors/Pre";

var messages = [];
var messagesLevels = [];

/*
REMINDER:
REMINDER:
REMINDER:
REMINDER:
REMINDER:
REMINDER:
REMINDER:
REMINDER:
check for wh-word (if present return false;) */

let except = (sub) => {
  let exceptons = ["the", "them", "day", "easterday", "English", "French"];
  return exceptons.includes(sub);
};

export function YesNo(q, r, strict) {
  let question = new Fin.Run("" + q);
  let response = new Fin.Run("" + r);
  console.log("YesNo(): Sentence:", question);
  console.log("YesNo(): Response:", response);

  messages = [];
  try {
    console.debug("YesNo()", "Initiating type checks!");
    if (!(question.sentences.length > 1 && question.sentences.length < 1)) {
      console.log(`Question Sentence Type:`, question.sentenceType());
      console.log(`Response Sentence Type:`, response.sentenceType());
      if (
        !(
          question
            .sentenceType()[0]
            .some(
              (item) => item.type === "interrogative" && item.confidence > 50
            ) || Verb(question.sentences[0].tags[0])
        ) ||
        response
          .sentenceType()[0]
          .some((item) => item.type === "interrogative" && item.confidence > 50)
      ) {
        console.error("Not correct sentence type!");
        throw new MessageError(
          "Messages",
          false,
          [
            "Not correct sentence type! Are you sure that's a question and a response?"
          ],
          ["danger"]
        );
      } else {
        console.debug("Preliminary checks done!");
        try {
          let result = Extraction(question, response, strict);
          if (messages.length < 1) {
            return result;
          } else {
            throw new MessageError(
              "Messages",
              result,
              messages,
              messagesLevels
            );
          }
        } finally {
          console.debug("Exiting YesNo();");
        }
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

function Extraction(question, response, strict = false) {
  console.debug("Extraction()");
  let Sentence = question.sentences[0];
  console.log("Extraction(): Sentence:", Sentence);
  let auxFirstVerb = Sentence.tokens[0];
  console.log("Extraction(): auxFirstVerb:", auxFirstVerb);
  let YesNoStuff = [];
  Sentence.tokens.find((item, index) => {
    if (Sentence.tokens[index - 1] === auxFirstVerb) {
      console.log("Extracting YesNoStuff: preparingLoop");
      let was_last_determiner = false;
      let has_was_last_determiner = false;
      for (
        let i = index;
        (!(
          Verb(
            Sentence.tags[i]
          ) /*&& /* Added */ /* !Adjective(Sentence.tags[i - 1]/*)*/
        ) &&
          !["EX", "RB", "RBR", "RBS"].includes(Sentence.tags[i]) &&
          !Adjective(Sentence.tags[i])) /* Remove? */ ||
        was_last_determiner ||
        Sentence.tags[i] === "IN";
        ++i
      ) {
        if (
          (Sentence.tags[i - 1] === "NNS" &&
            (Sentence.tags[i] === "NNS" || Sentence.tags[i] === "NNP") &&
            !(
              (humannames[Sentence.tokens[i - 1]] &&
                !except(humannames[Sentence.tokens[i - 1]])) ||
              (humannames[Sentence.tokens[i]] && !except(Sentence.tokens[i]))
            )) ||
          (Sentence.tags[i] === "DT" && has_was_last_determiner)
        ) {
          console.log("DT and has_was_last_determiner || NNS by (NNS|NNP)");
          break;
        }
        was_last_determiner = false;
        if (Sentence.tags[i] === "IN" || Sentence.tags[i] === "CC") {
          console.log("Preposition/Conjunction");
          was_last_determiner = true;
          has_was_last_determiner = false;
        }
        if (Sentence.tags[i] === "DT") {
          console.log("Determiner");
          was_last_determiner = true;
          has_was_last_determiner = true;
        } else if (humannames[Sentence.tokens[i]]) {
          console.log("Human Name");
          has_was_last_determiner = true;
        }
        if (!Sentence.tags[i].includes("."))
          if (Sentence.tokens[i].includes("'s")) {
            YesNoStuff.push("POSSESIVE_INCOMING 's");
            YesNoStuff.push(Sentence.tokens[i]);
          } else YesNoStuff.push(Sentence.tokens[i]);
        if (i + 1 === Sentence.tokens.length) return false;
      }
      return true;
    } else return false;
  });
  console.log("Extraction(): YesNoStuff:", YesNoStuff);

  let ReSett = ReState(auxFirstVerb, YesNoStuff, Sentence, strict);
  console.log(ReSett);

  if (auxFirstVerb.toLowerCase().trim() === "do")
    response = new Fin.Run(response.sentences[0].sentence.replace("do ", ""));

  let ReSettSimple = TrySimpleReState(auxFirstVerb, Sentence.tokens[1]);
  let ReSettNN = TryNNReState(
    auxFirstVerb,
    Sentence.tokens.slice(1),
    Sentence.tags.slice(1)
  );
  let ReSettDeps = TryDepsReState(Sentence, auxFirstVerb);
  let ReSettParsed1 = TryParseableReState1(
    auxFirstVerb,
    Sentence.tokens.slice(1),
    Sentence.tags.slice(1)
  );
  let ReSettParsed2 = TryParseableReState2(
    auxFirstVerb,
    Sentence.tokens.slice(1),
    Sentence.tags.slice(1)
  );

  try {
    return (
      TenseTestArray(ReSett, response) ||
      TenseTestArray(ReSettSimple, response) ||
      TenseTestArray(ReSettNN, response) ||
      TenseTestArray(ReSettDeps, response) ||
      TenseTestArray(ReSettParsed1, response) ||
      TenseTestArray(ReSettParsed2, response)
    );
  } finally {
    console.debug("Exiting Extraction();");
  }
}

function TryParseableReState1(v, toks, tags) {
  let restructured = "";
  let othertags = ["JJ", "JJS", "JJR", "IN", "CC", "DT", "POS"];
  let firsttag = tags[0] === "DT" ? tags[1] : tags[0];
  firsttag = othertags.includes(firsttag) ? "" : firsttag;
  let finished = false;
  let has_adj = false;
  let has_noun = false;
  let has_det = false;
  let xx_det = false;
  for (let i = 0; i < toks.length; ++i) {
    let word = toks[i];
    let tag = tags[i];
    console.log(`${word}:${tag}, ${has_adj}, ${has_noun}, ${has_det}`);
    switch (tag) {
      case firsttag && !othertags.includes(tag):
        has_adj = false;
        restructured += " " + word;
        break;
      case "NN":
      case "NNS":
      case "NNP":
      case "NNPS":
        if (!has_noun) {
          has_noun = true;
          restructured += " " + word;
          firsttag = tag;
        } else if (has_det || has_adj) {
          has_adj = false;
          firsttag = tag;
          restructured += " " + word;
        } else {
          finished = true;
        }
        break;
      case "JJ":
      case "JJS":
      case "JJR":
        has_adj = true;
        restructured += " " + word;
        break;
      case "IN":
      case "CC":
        has_noun = false;
        has_adj = false;
        restructured += " " + word;
        break;
      case "DT":
        has_det = true;
        xx_det = true;
        has_noun = false;
        has_adj = false;
        restructured += " " + word;
        break;
      case "POS":
        has_adj = false;
        restructured += word;
        break;
      case "RB":
        finished = true;
        break;
      default:
        if (has_adj) {
          has_adj = false;
          restructured += " " + word;
        } else finished = true;
        break;
    }

    if (has_det) {
      if (xx_det) xx_det = false;
      else has_det = false;
    }

    if (finished) break;
    //if (tag === firsttag) restructured += " " + word;
    //else break;
  }
  console.log("{arseable}:", restructured);
  return [restructured, v];
}
function TryParseableReState2(v, toks, tags) {
  let restructured = "";
  let othertags = ["JJ", "JJS", "JJR", "IN", "CC", "DT", "POS"];
  let firsttag = tags[0] === "DT" ? tags[1] : tags[0];
  firsttag = othertags.includes(firsttag) ? "" : firsttag;
  let finished = false;
  let has_adj = false;
  let has_noun = false;
  let has_det = false;
  for (let i = 0; i < toks.length; ++i) {
    let word = toks[i];
    let tag = tags[i];
    console.log(`${word}:${tag}, ${has_adj}, ${has_noun}, ${has_det}`);
    switch (tag) {
      case firsttag && !othertags.includes(tag):
        has_adj = false;
        restructured += " " + word;
        break;
      case "NN":
      case "NNS":
      case "NNP":
      case "NNPS":
        if (!has_noun) {
          has_noun = true;
          restructured += " " + word;
          firsttag = tag;
        } else if (has_det) {
          firsttag = tag;
          restructured += " " + word;
          has_det = false;
        } else {
          finished = true;
        }
        break;
      case "JJ":
      case "JJS":
      case "JJR":
        has_adj = true;
        restructured += " " + word;
        break;
      case "IN":
      case "CC":
        has_noun = false;
        has_adj = false;
        restructured += " " + word;
        break;
      case "DT":
        has_det = true;
        has_noun = false;
        has_adj = false;
        restructured += " " + word;
        break;
      case "POS":
        has_adj = false;
        restructured += word;
        break;

      case "RB":
        finished = true;
        break;
      default:
        if (has_adj) {
          has_adj = false;
          restructured += " " + word;
        } else finished = true;
        break;
    }

    if (finished) break;
    //if (tag === firsttag) restructured += " " + word;
    //else break;
  }
  console.log("{arseable}:", restructured);
  return [restructured, v];
}

function TryNNReState(v, tok, tag) {
  const isUppercase = (word) => {
    return word[0] !== word[0].toLowerCase();
  };

  console.debug("TryNNReState()");
  console.log(v, tok, tag);
  if (tag[0] === "NNS") {
    console.log("NNS");
    let Subject = tok[0];
    for (let i = 1; i < tok.length && tag[i] === "NNS"; ++i)
      Subject += " " + tok[i];
    console.log("Subject");
    return [Subject, v];
  } else if (tag[0] === "NNP" || isUppercase(tok[0])) {
    console.log("NNP");
    let Subject = tok[0];
    for (
      let i = 1;
      i < tok.length && (tag[i] === "NNP" || isUppercase(tok[i]));
      ++i
    )
      Subject += " " + tok[i];
    console.log(Subject);
    return [Subject, v];
  } else return null;
}

function TryDepsReState(sent, vb) {
  let xindex = sent.tokens.indexOf(vb) + 1;
  let xdepstag = sent.deps[xindex].label;
  let strsub = "";
  for (let i = xindex; sent.deps[i].label === xdepstag; ++i) {
    if ([".", ",", ":", "POS"].includes(sent.tags[i])) strsub += sent.tokens[i];
    else strsub += " " + sent.tokens[i];
  }
  return [strsub, vb];
}

function TrySimpleReState(v, s) {
  return [s, v];
}

function ReState(auxVerb, YesNoStuff, orsent, strict = false) {
  let arr = [];

  let YesNoStuffConcat = "";
  let ispossesive = false;
  for (const term of YesNoStuff) {
    if (term === "POSSESIVE_INCOMING 's") {
      ispossesive = true;
      continue;
    }
    let YesNoStuffAnalysis = orsent.tags[orsent.tokens.indexOf(term)];
    if (/(DT|PRP)/.test(YesNoStuffAnalysis) && !YesNoStuff.length === 1) {
    } else if (ispossesive) {
      ispossesive = false;
      YesNoStuffConcat = YesNoStuffConcat.trimEnd();
      YesNoStuffConcat += term + " ";
    } else YesNoStuffConcat += term + " ";
  }
  if (!YesNoStuffConcat.trim()) return "";
  console.log("ReState(): YesNoStuffConcat:", YesNoStuffConcat);

  let ExtractSub = getGender(YesNoStuffConcat, "en") === "male" ? "he" : "she";

  if (
    strict &&
    (!humannames[capitalizeFirstLetter(YesNoStuffConcat.trim())] ||
      except(YesNoStuffConcat.toLowerCase().trim())) &&
    !pronouns.some((item) =>
      item.includes(YesNoStuffConcat.toLowerCase().trim())
    )
  ) {
    console.warn("ReState(): Strict Enabled");
    arr.push(YesNoStuffConcat);
  } else {
    console.log("NoStrict");
    if (
      !strict &&
      (!humannames[
        capitalizeFirstLetter(YesNoStuffConcat.split(" ")[0].trim())
      ] ||
        except(YesNoStuffConcat.toLowerCase().trim())) &&
      !pronouns.some(
        (item) =>
          item.includes(YesNoStuffConcat.toLowerCase().trim()) ||
          item.includes(YesNoStuffConcat.split(" ")[0].trim().toLowerCase())
      )
    ) {
      if (
        !except(YesNoStuffConcat.toLowerCase().trim()) &&
        !messages.includes(
          `Subject "${YesNoStuffConcat}" isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('Limitations').scrollIntoView();" onkeydown="document.getElementById('Limitations').scrollIntoView();">limitations</a> for more info.`
        )
      ) {
        messages.push(
          `Subject "${YesNoStuffConcat}" isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('Limitations').scrollIntoView();" onkeydown="document.getElementById('Limitations').scrollIntoView();">limitations</a> for more info.`
        );
        messagesLevels.push("warning");
      }
    }
    arr.push(YesNoStuffConcat);
    for (const it of pronouns) {
      console.log("pronoun extraction: it:", it);
      console.log(
        "pronoun extraction: it.some:",
        it.some(
          (item) =>
            item === YesNoStuffConcat.toLowerCase() ||
            item === ExtractSub.toLowerCase()
        )
      );
      if (
        it.some(
          (item) =>
            item === YesNoStuffConcat.toLowerCase() ||
            item === ExtractSub.toLowerCase()
        )
      ) {
        for (const sub of it) {
          console.log("pronoun extraction: extracting:", sub);
          arr.push(sub);
        }
      }
    }

    for (const sub of pronouns[2]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[3]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[4]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[5]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[6]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[7]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }
    for (const sub of pronouns[8]) {
      console.log("pronoun extraction: extracting:", sub);
      arr.push(sub);
    }

    console.log("MainVerb", auxVerb);
  }
  arr.push(auxVerb);
  return arr;
}

function TenseTestArray(qarr, r) {
  console.debug("Entering TenseTestArray()");
  console.log("TenseTestArray(): qarr:", qarr);
  if (!qarr || qarr.length === 0) {
    console.debug("Exiting TenseTestArray: Too Small Qarr");
    return false;
  }
  let result = false;
  let MainVerb = qarr[qarr.length - 1];
  if (!MainVerb) return false;
  console.log("TenseTestArray(): MainVerb:", MainVerb);
  for (let i = 0; i < qarr.length - 1; ++i) {
    console.log("TenseTestArray(): iteration:", i);
    let Sub = qarr[i];
    console.log(`TenseTestArray(): Subject for iteration ${i}:`, Sub);
    if (Sub === "") continue;
    if (["do", "did"].includes(MainVerb.toLowerCase().trim()))
      result = TenseTest(Sub, r) || result;
    else result = TenseTest(Sub + " " + MainVerb, r) || result;
    if (result === true) break;
  }
  console.log("TenseTestArray(): Result:", result);
  try {
    return result;
  } finally {
    console.debug("Exiting TenseTestArray()");
  }
}

//TenseTests
/*let infly = new Inflectors("I work in a bank");


console.log(infly);
console.warn(infly.toPast());
console.warn(infly.toGerund());
console.warn(infly.toPastParticiple());
console.warn(infly.toPresent());
console.warn(infly.toPresentS());
*/

function TenseTest(g, r) {
  console.debug("Entering TenseTest()");
  let sentence = allTrim(r.sentences[0].sentence.toLowerCase().trim());
  let generated = allTrim(g.toLowerCase().trim());

  console.log("TenseTest(): Response:", sentence);
  console.log("TenseTest(): Question:", generated);

  if (sentence.trim() === "" || generated.trim() === "") {
    console.log("TenseTest(): Empty");
    return false;
  }
  if (sentence.includes(generated)) {
    console.log("TenseTest(): Included!");
    return true;
  }
  let Sentence = new Fin.Run(generated);
  console.log("TenseTest(): Sentence:", Sentence);
  let FirstVerbIndex = Sentence.sentences[0].tags.findIndex(
    (item) =>
      item.includes("VB") ||
      item.includes("IN") ||
      item.includes("TO") ||
      item.includes("MD")
  );
  let FirstVerb = Sentence.sentences[0].tokens[FirstVerbIndex];
  FirstVerbIndex = generated.indexOf(FirstVerb);
  console.log("TenseTest(): FirstVerb:", FirstVerb);
  if (!FirstVerb) {
    console.log("TenseTest(): Exiting cause of empty firstverb");
    return false;
  }

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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function Adjective(posTag) {
  console.info("Adjective():", posTag);
  console.info("Adjective():", /(JJ|JJR|JJS)/.test(posTag));
  return /(JJ|JJR|JJS)/.test(posTag);
}

function Verb(posTag) {
  console.info("Verb():", posTag);
  console.info("Verb():", /(IN|TO|VB|MD)/.test(posTag));
  return /(IN|TO|VB|MD)/.test(posTag);
}
