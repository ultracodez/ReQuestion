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

import Negate from "./negate";
import pronouns from "./pronouns";
import { allTrim } from "../Modifiers/index";
import {
  PreProcess as ProcessorPre,
  OptionsObject as PreOptions,
  Mode
} from "../Processors/Pre";

import { MessageError } from "../Exceptions/messagError";
//import negate from "./negate";

var itera = 0; //Iterations
var messages = [];
var messagesLevels = [];
//DoTests(); //Do the tests (in debug only)
//DoTests(true); //Do the tests (for NegaTest())

//Test("Where do you live?", "McDonald's");

function DoTests(nega = false) {
  if (nega) {
    var negatests = [];
    negatests.push(NegaTest("You are", "You are not"));
    negatests.push(NegaTest("walk", "don't walk"));
    negatests.push(NegaTest("he walked", "he did not walk"));
    negatests.push(NegaTest("walk!", "don't walk!"));
    negatests.push(NegaTest("I walk", "I do not walk"));
    negatests.push(NegaTest("got walked", "did not get walked"));
    negatests.push(NegaTest("they were walked", "they were not walked"));
    negatests.push(NegaTest("would walk", "would not walk"));
    negatests.push(NegaTest("wants to walk", "does not want to walk"));
    negatests.push(NegaTest("he did walk", "he did not walk"));
    negatests.push(NegaTest("used to walk", "did not used to walk"));
    console.success("NegaTests (should be true): ");
    console.log(negatests);
    console.success(
      (negatests.filter(Boolean).length / negatests.length) * 100 + "% Accuracy"
    );
  } else {
    var results = [];
    var falses = [];
    console.time("DoTests()");
    results.push(
      Test("Which type of food do you like the most?", "I like sushi the most.")
    );
    results.push(Test("How do you do work?", "I do work by eating it."));
    results.push(
      Test(
        "What is the value of x and 9 that makes 14?",
        "The value of x and 9 that makes 14 is 5"
      )
    );
    results.push(
      Test("How much does an apple weigh?", "an apple weighs 16 pounds.")
    );
    results.push(
      Test("Why do dogs bark?", "dogs bark because it is in their nature.")
    );
    results.push(Test("What is my mom's name?", "my mom's name is Alex"));
    results.push(
      Test("What is underneath this table?", "Gum is underneath this table")
    );
    results.push(
      Test("Where does Susan like to eat?", "Susan likes to eat at 'Yes Sushi'")
    );
    results.push(
      Test("What is underneath this table?", "Gum is underneath this table")
    );
    results.push(
      Test("What's your favorite meme?", "My favorite meme is pew, pew.")
    );
    results.push(
      Test("How do you play Halo 3?", "To play Halo 3, you have to HIII")
    );
    results.push(
      Test(
        "What is the longest steak that has ever been filleted",
        "The longest steak that has ever been filleted is a 180-day steak"
      )
    );
    results.push(
      Test(
        "Why are middle schoolers so immature?",
        "Middle schoolers are so immature because of apathy"
      )
    );
    results.push(
      Test(
        "Why is this so entertaining?",
        "This is so entertaining because it is."
      )
    );
    results.push(
      Test(
        "When will my brain stop getting crazy?",
        "My brain will never stop getting crazy"
      )
    );
    results.push(
      Test(
        "When was Albert Einstein born?",
        "Albert Einstein was born 1 day ago."
      )
    );
    results.push(
      Test(
        "What is your opinion on penguins?",
        "My opinion on penguins is that they are dumb tuxedo birds."
      )
    );
    results.push(
      Test(
        "How much did the Mongol Empire conquer?",
        "The Mongol Empire conquered nothing (LOL)."
      )
    );
    results.push(
      Test(
        "What kind of music do you like?",
        "The kind of music I like is rap."
      )
    );
    results.push(
      Test("What type of question?", "The type of question is what.")
    );
    results.push(Test("How is your day?", "My day was good."));
    results.push(
      Test(
        "What is today's Do Now?",
        "Today's Do Now is something, but I don't know"
      )
    );
    results.push(
      Test(
        "What are total fatalities of Lasagna?",
        "The total fatalities of Lasagna are approximately 1800."
      )
    );
    falses.push(Test("Where do you live?", "McDonald's"));
    falses.push(Test("I am not a question", "Hi"));
    falses.push(Test("I am fine!", "LOL!"));
    falses.push(Test("", ""));
    falses.push(Test("HAHAHAHAHAJ hufred ehsdjakf f", "hbfdksja"));
    falses.push(Test("ftakjdergduegyfhsdj", "fhdugsja"));
    falses.push(
      Test(
        "Nonsense and nonsense how are you did you are you fine no im not.",
        "b"
      )
    );
    console.timeEnd("DoTests()");
    console.success("Iterations: " + itera);
    console.info("Results (should be true):", results);
    console.success(
      (results.filter(Boolean).length / results.length) * 100 + "% Accuracy"
    );
    //console.success("% Accuracy True:", results.filter(Boolean).length);
    console.info("Falses (should be false):", falses);
    console.success(
      (falses.filter((c) => !c).length / falses.length) * 100 + "% Accuracy"
    );
  }
}
export function Test(str, res) {
  let processed = new Fin.Run(str);
  let response = new Fin.Run(res);
  console.info(
    `Testing for processed "${processed?.sentences[0]?.sentence}" and response "${response?.sentences[0]?.sentence}"`
  );
  let result = QuestionWord(processed, response);
  console.info(`Test Result ${itera++}:`, result);
  return result;
}

export function QuestionWord(q, t, strict = false) {
  messages = [];
  try {
    console.debug("QuestionWord()", "Initiating type checks!");
    if (!(q.sentences.length > 1 && q.sentences.length < 1)) {
      var question = new Fin.Run(PreProcess(q.sentences[0]));
      var response = new Fin.Run(t.sentences[0].sentence);
      console.log("Question: ", question);
      console.log("Response: ", response);
      console.log(`Question Sentence Type:`, question.sentenceType()[0]);
      console.log(`Response Sentence Type:`, response.sentenceType()[0]);
      if (
        !(
          question
            .sentenceType()[0]
            .some(
              (item) => item.type === "interrogative" && item.confidence > 50
            ) ||
          /(what|when|who|how|where|why|whom|which|whose)/.test(
            question.raw.toLowerCase()
          )
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
          console.debug("Exiting QuestionWord();");
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
    else
      throw new MessageError(
        "Messages",
        false,
        ["An error has occured! More info:" + e.toString()],
        ["danger"]
      );
  }
}

function PreProcess(s) {
  return ProcessorPre(s, messages, messagesLevels, {
    PrepositionTest: true,
    EvaluationMode: Mode.QuestionWord
  });
}

function Extraction(q, r, strict = false) {
  console.debug("Extraction()");
  var question = q.sentences[0];
  var depsTree = question.depsTree;
  var root = depsTree.tokens;

  let WDT = question.tokens[question.tags.indexOf("WDT")];
  let WP = question.tokens[question.tags.indexOf("WP")];
  let WP$ = question.tokens[question.tags.indexOf("WP$")];
  let WRB = question.tokens[question.tags.indexOf("WRB")];
  let WhSpecifier = WDT ? WDT : WP ? WP : WP$ ? WP$ : WRB;
  //var WhSpecifier = WDT ?? WP ?? WP$ ?? WRB;

  let WhStuff = [];
  let WhStuffStartIndex = 0;
  let WhStuffEndIndex = 1;
  let WhStuffRawEndIndex = 0;
  question.tokens.find(function (item, index) {
    let len = question.tokens.length;
    let prev = question.tokens[(index - 1) % len];

    console.log("Extraction(): Extracting WhStuff: ", item);
    console.log("Extraction(): Extracting WhStuff: len", len);
    console.log("Extraction(): Extracting WhStuff: prev", prev);

    let isPrecededBySpecifier = false;

    if (prev) {
      if (prev === WhSpecifier) isPrecededBySpecifier = true;
    }

    if (isPrecededBySpecifier && Verb(question.tags[index])) {
      WhStuffStartIndex = 0;
      WhStuffEndIndex = 0;
      return true;
    } else if (isPrecededBySpecifier) {
      console.log("Extraction(): Extracting WhStuff: isPrecededBySpecifier");
      console.log("Extraction(): Extracting WhStuff: preparingLoop");

      let arr = [];

      for (let i = index; i < len; ++i) {
        let curr = question.tokens[i];
        console.log(
          "Extraction(): Extracting WhStuff: loopindex " + i + ":",
          curr
        );

        let isfin = false;

        if (Verb(question.tags[i]) && question.tags[i] !== "IN") {
          isfin = true;
        } else {
          arr.push(curr);
          console.log("Extraction(): Extracting WhStuff: looparr:", arr);
        }

        if (
          question.tags[i].includes("NN") ||
          question.tags[i].includes("JJ") ||
          question.tags[i].includes("DT")
        ) {
          //isNoun
          console.log("Extraction(): Extracting WhStuff: loopcurr is noun");
          console.log(
            "Extraction(): Extracting WhStuff:",
            question.tags[(i + 1) % len]
          );
          isfin =
            question.tags[(i + 1) % len].includes("RB") ||
            question.tags[(i + 1) % len].includes("VB") ||
            question.tags[(i + 1) % len].includes(
              "MD"
            ) /*
            question.tags[(i + 1) % len].includes("IN") ||*/ ||
            question.tags[(i + 1) % len].includes("TO");
        }

        console.log("Extraction(): Extracting WhStuff: loopisfin:", isfin);

        if (isfin) {
          WhStuff = arr;
          WhStuffStartIndex = index;
          WhStuffEndIndex = i;
          WhStuffRawEndIndex =
            question.sentence.indexOf(WhStuff[WhStuff.length - 1]) +
            WhStuff[WhStuff.length - 1].length;
          console.log("WhStuff:", WhStuff);
          console.log("WhStuffStartIndex:", WhStuffStartIndex);
          console.log("WhStuffEndIndex:", WhStuffEndIndex);
          console.log("WhStuffRawEndIndex:", WhStuffRawEndIndex);
          break;
        }
      }
      return true;
    }

    return false;
  });

  let MainVerb = "";
  let Subject = "";
  let DidSubject = "";
  let OneWordSubject = "";
  let betwordsubject = "";
  question.tokens.find(function (item, index) {
    let sindex = WhStuffStartIndex; //try that
    let len = question.tokens.length;
    console.log("Extraction: Extracting MainVerb+Subject: len:", len);
    console.log("Extraction: Extracting MainVerb+Subject: sindex:", sindex);
    console.log("Extraction: Extracting MainVerb+Subject: index:", index);
    console.log("Extraction: Extracting MainVerb+Subject: item:", item);
    console.log("sindex", sindex);
    //if (index <= sindex) return false;
    //if (!question.tags[index].includes("VB")) return false;
    if (index < sindex) {
      console.log("index <= sindex, retrying");
      return false;
    }
    if (index === len) {
      console.log("TooFar");
      return false;
    }

    console.log(
      "Is Word Equal To WhSpecifier? : ",
      question.tokens[(index - WhStuff.length) % len],
      WhSpecifier
    );
    console.log("CurrentWordTag: ", question.tags[index]);
    if (
      question.tokens[index] === WhSpecifier &&
      Verb(question.tags[index + 1])
    ) {
      console.log("Did format");
      betwordsubject = question.sentence.slice(
        question.sentence.indexOf(question.tokens[index + 2]),
        question.sentence.indexOf(
          question.tokens[
            question.tags.findIndex((val, ind, arr) => {
              return (
                Verb(val) &&
                !(question.tokens[ind] === question.tokens[index + 1])
              );
            })
          ]
        )
      );

      for (
        let i = question.tokens.indexOf(WhSpecifier) + 2;
        i < question.tokens.length;
        ++i
      ) {
        let ns = "";
        let isclosend = (index) => {
          for (let i = index + 1; i < question.tags.length; ++i) {
            console.log("isclosend(): currtag:", question.tags[i]);
            if ([".", ",", ":", "SYM", "IN", "CD"].includes(question.tags[i]));
            else return false;
          }
          console.log("isclosend(): >?");
          return true;
        };
        if (Verb(question.tags[i]) && isclosend(i)) {
          DidSubject = question.tokens[i];
          console.log("Finish!");
          MainVerb = question.tokens[question.tokens.indexOf(WhSpecifier) + 1];
          OneWordSubject =
            question.tokens[question.tokens.indexOf(WhSpecifier) + 2];
          Subject = ns;
          return true;
        } else {
          console.log("Subjing Adding:", question.tokens[i]);
          ns += " " + question.tokens[i];
        }
      }
      console.log("Did failed...");
      if (!!!Subject || !!!MainVerb) return false;
    }
    if (
      (question.tokens[(index - (WhStuff.length + 1)) % len] === WhSpecifier &&
        Verb(question.tags[index]) &&
        !PrepositionalExceptions(question.tokens[index])) ||
      (question.tokens[(index - 1) % len] === WhStuff[WhStuff.length - 1] &&
        !PrepositionalExceptions(question.tokens[index]))
    ) {
      const trav = (deps, word, left) => {
        console.log("Trav(): Word:", word, "IsLeft:", left);

        if (!left && (!deps.right || deps.right.length > 0)) return null;
        if (left && (!deps.left || deps.left.length > 0)) return null;

        if (deps.tokens.includes(word)) {
          console.log("Word Found!");
          return deps;
        } else {
          console.log("Word not found in deps", deps);
          if (left) {
            if (deps.left.length === 0) return null;
            return deps.left.find((item) => trav(item, word, left));
          } else {
            if (deps.right.length === 0) return null;
            return deps.right.find((item) => trav(item, word, left));
          }
        }
      };
      const gettravparent = (deps, word, left, parent = null) => {
        console.log("Trav(): Word:", word, "IsLeft:", left, " Parent:", parent);
        let returner = null;

        if (!left && (!deps.right || deps.right.length > 0)) return null;
        if (left && (!deps.left || deps.left.length > 0)) return null;

        if (deps.tokens.includes(word)) {
          console.log("Word Found!");
          return parent;
        } else {
          console.log("Word not found in deps", deps);
          if (left) {
            if (deps.left.length === 0) return null;
            deps.left.forEach(
              (item) =>
                (returner = gettravparent(item, word, left, deps)
                  ? gettravparent(item, word, left, deps)
                  : returner)
            );
          } else {
            if (deps.right.length === 0) return null;
            deps.right.forEach(
              (item) =>
                (returner = gettravparent(item, word, left, deps)
                  ? gettravparent(item, word, left, deps)
                  : returner)
            );
          }
        }
        if (returner) return returner;
      };

      console.log("MainVerb before Subject");
      MainVerb = question.tokens[index];
      OneWordSubject = question.tokens[(index + 1) % len];
      Subject = question.tokens[(index + 1) % len];

      let has_any_quote = false;
      let has_last_any_quote = false;
      let was_last_determiner = false;
      let has_was_last_determiner = false;
      const enders = ["."];
      let subjj = "";
      let add = true;
      if (index + 2 < question.tokens.length)
        for (
          let i = index + 2;
          (was_last_determiner ||
            has_any_quote ||
            !(
              Verb(question.tags[i]) &&
              !PrepositionalExceptions(question.tokens[i])
            )) &&
          !(enders.includes(question.tags[i]) && !has_any_quote) &&
          i < question.tokens.length;
          ++i
        ) {
          if (
            (question.tags[i] === '"' || question.tags === "(") &&
            !has_any_quote
          ) {
            has_any_quote = true;
            has_last_any_quote = true;
            subjj += " " + question.tokens[i];

            console.log("has_any_quote_started:", subjj);
            continue;
          } else if (
            (question.tags[i] === '"' || question.tags === ")") &&
            has_any_quote
          ) {
            has_any_quote = false;
            subjj += question.tokens[i];
            console.log("has_any_quote_finished:", subjj);
            continue;
          } else if (has_any_quote) {
            if (question.tokens[i].toLowerCase().includes("'s")) {
              console.log("Adding possesive to subjj:", question.tokens[i]);
              subjj += "'s";
            } else {
              if (has_last_any_quote) {
                has_last_any_quote = false;
                subjj += question.tokens[i];
              } else subjj += " " + question.tokens[i];
            }
            console.log("has_any_quote: subjj:", subjj);
            continue;
          }

          if (question.tags[i] === "DT" && has_was_last_determiner) {
            add = false;
            break;
          }

          if (question.tags[i] === "IN" || question.tags[i] === "CD") {
            console.log("Preposition/Cardinal");
            was_last_determiner = true;
            has_was_last_determiner = false;
          }
          if (question.tags[i] === "DT" || question.tokens[i] === "'s") {
            console.log("Determiner");
            was_last_determiner = true;
            has_was_last_determiner = true;
          }
          if (question.tags[i - 1] === "NNPS" && question.tags[i] === "NN") {
            console.log("NNPS by NN");
            break;
          }

          if (question.tokens[i].toLowerCase().includes("'s")) {
            console.log("Adding possesive to subjj:", question.tokens[i]);
            subjj += "'s";
          } else {
            if (
              question.tags[(i + 1) % len] === "IN" &&
              question.tags[(i + 2) % len] === "."
            ) {
              console.log("Reached Sent Final Preposition. Breaking...");

              break;
            } else {
              console.log("Adding non-possesive to subjj:", question.tokens[i]);
              subjj += " " + question.tokens[i];
            }
          }
        }
      else add = false;
      if (add)
        if (subjj.trim().startsWith("'s")) Subject += subjj;
        else Subject += " " + subjj;

      let substree = trav(question.depsTree, Subject, false);
      if (!substree) substree = trav(question.depsTree, Subject, true);

      console.log("Substree:", substree);

      if (substree) {
        let newsubs = substree.tokens;
        for (let i = 0; i < newsubs.length; ++i) {
          console.log("Maybe adding newsub:", newsubs[i]);
          //tokens detector
          /*let xindex = question.tokens.indexOf(newsubs[i]);
          if (["POS"].includes(question.tags[xindex + 1])) {
            Subject += "'s";
            const enders = [".","VB"]
            for (let ii = xindex + 2; ii < question.tokens.length; ++ii) {
              let tok = question.tokens[ii];
              if(qu)
            }
          }*/
          //subtree detectors
          if (["DT", "IN"].includes(substree.tags[i])) {
            let x = gettravparent(question.depsTree, newsubs[i], false);
            let xindex = x.right.findIndex((item) =>
              item.tokens.includes(newsubs[i])
            );
            let toadd = x.right[xindex + 1];
            toadd.left.forEach((item) =>
              item.tokens.forEach((item) => (Subject += "" + item))
            );
            toadd.tokens.forEach((item) => (Subject += " " + item));
          }
          if (newsubs[i] === Subject) continue;
          else if (newsubs[i] === "'s") Subject += "'s";
          else Subject += " " + newsubs[i];
        }
      }

      return true;
    } else if (
      Verb(question.tags[index]) &&
      !PrepositionalExceptions(question.tokens[index]) &&
      question.tags[index - 1].includes("NN")
    ) {
      console.log("Subject before MainVerb");

      MainVerb = question.tokens[index];
      OneWordSubject = question.tokens[index + 1];
      Subject = "";
      for (
        let i = WhStuffEndIndex;
        question.tokens[i] !== question.tokens[index];
        ++i
      ) {
        if (question.tokens[i].includes("'s")) Subject += question.tokens[i];
        else Subject += " " + question.tokens[i];
      }

      //console.log("Subject before MainVerb");
      //MainVerb = question.tokens[index + 1];
      //Subject = question.tokens[index];
      return true;
    } /*else if (
      ((question.tags[(index) ].includes("NN") &&
        humannames[question.tokens[index]] !== null) ||
        question.tags[index].includes("PR")) &&
      Verb(question.tags[index+1]) &&
      question.tags[index+1] !== "PR"
    ) {
      console.log("Name after Verb");
      MainVerb = question.tokens[(index + 1) % len];
      Subject = question.tokens[index];
      return true;
    }*/

    return false;
    //return true;
  });
  let SubAfterAux = "";
  let MainVerbAfterSub = "";
  question.tokens.find((item, index) => {
    let sindex = WhStuffStartIndex; /*End*/
    let len = question.tokens.length;
    console.log(
      "Extraction: Extracting SubAfterAux+MainVerbAfterSub: len:",
      len
    );
    console.log(
      "Extraction: Extracting SubAfterAux+MainVerbAfterSub: sindex:",
      sindex
    );
    console.log(
      "Extraction: Extracting SubAfterAux+MainVerbAfterSub: index:",
      index
    );
    console.log(
      "Extraction: Extracting SubAfterAux+MainVerbAfterSub: item:",
      item
    );

    //if (index <= sindex) return false;
    //if (!question.tags[index].includes("VB")) return false;
    if (index < sindex) {
      console.log("index <= sindex, retrying");
      return false;
    }
    if (index === len) {
      console.log("TooFar");
      return false;
    }

    console.log(
      "Is Word Equal To WhSpecifier? : ",
      question.tokens[(index - 1) % len],
      WhSpecifier
    );
    console.log("CurrentWordTag: ", question.tags[index]);

    if (
      question.tokens[(index - 1) % len] === WhSpecifier &&
      Verb(question.tags[index])
    ) {
      MainVerbAfterSub = question.tokens[index];
      let posSubjectIndex = (index + 1) % len;
      console.error(posSubjectIndex);
      let posSubject = question.tokens[(index + 1) % len];

      console.error(posSubject);
      while (true) {
        if (question.tags[posSubjectIndex].includes("DT")) {
          posSubject = question.tokens[posSubjectIndex];
          console.error(posSubject);
          console.error(question.tags[posSubjectIndex]);
          console.error(posSubjectIndex);
          posSubjectIndex = ++posSubjectIndex;
          console.error(posSubjectIndex);
        } else break;
      }
      posSubject = question.tokens[posSubjectIndex];
      SubAfterAux = posSubject;
      console.error("MainVerbAfterSub", MainVerbAfterSub);
      console.error("SubAfterAux", MainVerbAfterSub);
      return true;
    }

    return false;
  });

  console.log("MainVerb:", MainVerb);
  console.log("Subject:", Subject);
  console.log("MainVerbAfterSub", MainVerbAfterSub);
  console.log("SubAfterAux", MainVerbAfterSub);
  console.log("DidVerb:", DidSubject);

  console.log("WDT", WDT);
  console.log("WP", WP);
  console.log("WP$", WP$);
  console.log("WRB", WRB);

  console.log("WhSpecifier: ", WhSpecifier);
  console.log("WhStuff: ", WhStuff);
  console.log("WhStuffStartIndex: ", WhStuffStartIndex);
  console.log("WhStuffEndIndex: ", WhStuffEndIndex);

  console.log("Question: ", question);
  console.log("Root: ", root);
  console.log("depsTree: ", depsTree);

  if (
    !WhSpecifier &&
    !(
      ["do", "are"].includes(
        MainVerb
      ) /* Special Cases which the YesNo handler doesn't understand. */
    )
  )
    return false;

  if (root[0] === "have" && WhSpecifier.toLowerCase().trim() === "what") {
    if (!strict)
      throw new MessageError(
        "MessageError",
        true,
        [
          'A "What... have?" question can have almost any response. Enable strict to check for specific cases.'
        ],
        ["danger"]
      );
    else if (strict) {
      return (
        Norm(r.raw.trim()).includes(Norm(Subject.trim())) ||
        Norm(r.raw.trim()).includes(Norm(OneWordSubject.trim()))
      );
    }
  }

  if (
    MainVerb.split(" ")[0].toLowerCase().trim() === "happened" &&
    WhSpecifier.toLowerCase().trim() === "what"
  )
    throw new MessageError(
      "MessageError",
      true,
      [
        'A "What happened" question can have any response. It can\'t be restated. '
      ],
      ["danger"]
    );
  if (
    ["did", "does"].includes(MainVerb.split(" ")[0].toLowerCase().trim()) &&
    ["what", "how", "when"].includes(WhSpecifier.toLowerCase().trim())
  )
    if (Subject && Subject.trim()) {
      console.log(`? Did: Q${Norm(Subject.trim())}, R${Norm(r.raw.trim())}`);
      return (
        Norm(r.raw.trim()).includes(Norm(Subject.trim())) ||
        Norm(r.raw.trim()).includes(Norm(OneWordSubject.trim()))
      );
    }
  if (
    MainVerb.split(" ")[0].toLowerCase().trim() === "were" &&
    r.raw.includes("were")
  ) {
    /*if (
    WhSpecifier.toLowerCase().trim() === "which" &&
    WhStuff[0].toLowerCase().trim() === "type"
  ) {
    throw new MessageError(
      "MessageError",
      false,
      [
        `The "Which type" detector hasn't been implemented. Contact the developer with this info:\n
        Remove WhSpecifier && WhStuff. TenseTest().
        ***This will return false.***`
      ],
      ["danger"]
    );
  }*/
    return true;
  }
  console.debug("Initiating ReStateWhStuff() and ReStateWhStuff(Root)");
  let ReSett = ReStateWhStuff(WhSpecifier, WhStuff);
  let ReSettRoot = ReStateWhStuff(WhSpecifier, root);
  let ReSettWhichType = ReStateWhStuffWhichType(WhStuffRawEndIndex, q.raw);
  console.debug("Initiating ReStateWhStuffSubjectVerb()");
  let ReSettAlternate = ReStateWhStuffSubjectVerb(
    MainVerb,
    Subject,
    strict,
    DidSubject
  );
  let ReSettAlternateOne = ReStateWhStuffSubjectVerb(
    MainVerb,
    OneWordSubject,
    strict,
    DidSubject
  );
  let ReSettBetweenVerbs = ReStateWhStuffSubjectVerb(
    MainVerb,
    betwordsubject,
    strict,
    DidSubject
  );
  let ReSettSpecial = ReStateWhStuffSubjectVerb(
    MainVerbAfterSub,
    SubAfterAux,
    strict,
    DidSubject
  );
  let others = false;
  let AltRoot = root.find((item, index) => {
    return Verb(depsTree.tags[index]);
  });
  console.warn("AltRoot:", AltRoot);
  if (AltRoot) {
    let ReSettAlternateRoot = ReStateWhStuffSubjectVerb(
      AltRoot,
      Subject,
      strict,
      DidSubject
    );
    console.log("ReSettAlternateRoot:", ReSettAlternateRoot);
    others = TenseTestArray(ReSettAlternateRoot, r) || others;
    let ReSettAlternateRootOne = ReStateWhStuffSubjectVerb(
      AltRoot,
      OneWordSubject,
      strict,
      DidSubject
    );
    console.log("ReSettAlternateRootOne:", ReSettAlternateRootOne);
    others = TenseTestArray(ReSettAlternateRootOne, r) || others;
  }
  console.debug("Finished Restaters!");
  console.log("Resett:", ReSett);
  console.log("ResettRoot:", ReSettRoot);
  console.log("ResettAlternate:", ReSettAlternate);
  console.log("ResettSpecial:", ReSettSpecial);
  console.log("ReSettWhichType:", ReSettWhichType);
  console.log("ReSettAlternateOne:", ReSettAlternateOne);
  console.log("ReSettBetweenVerbs: ", ReSettBetweenVerbs);
  try {
    return (
      TenseTest(ReSett, r) ||
      TenseTest(ReSettRoot, r) ||
      TenseTest(ReSettWhichType, r) ||
      TenseTestArray(ReSettAlternate, r) ||
      TenseTestArray(ReSettSpecial, r) ||
      TenseTestArray(ReSettAlternateOne, r) ||
      TenseTestArray(ReSettBetweenVerbs, r) ||
      others
    );
  } finally {
    console.debug("Exiting Extraction()");
  }
}

function ReStateWhStuff(WhSpecifier, WhStuff) {
  let val;
  let WhStuffConcat = "";
  for (const term of WhStuff) {
    WhStuffConcat += term + " ";
  }
  if (WhStuffConcat.trim() === "") {
    console.log("No WhStuff Available");
    return "";
  }

  var WhS = WhSpecifier ? WhSpecifier : "";
  switch (WhS.toLowerCase()) {
    case "what":
    case "which":
      val = "The " + WhStuffConcat;
      break;
    case "how":
      val = "To " + WhStuffConcat;
      break;
    case "who":
      val = WhStuffConcat;
      break;
    default:
      val = WhStuffConcat;
      break;
  }
  return val;
}

function ReStateWhStuffWhichType(index, raw) {
  let sle = raw.slice(index);
  if (sle.endsWith(".") || sle.endsWith("?") || sle.endsWith("!"))
    sle = sle.slice(0, -1);
  console.log(`ReStateWhStuffWhichType(index: ${index}, raw: ${raw}): `, sle);
  return sle;
  //return "";
}

function ReStateWhStuffSubjectVerb(
  MainVerb,
  Subject,
  strict = false,
  DidSubject = null
) {
  let SubArray = [];

  console.log("ReStateWhStuffSubjectVerb(): MainVerb:", MainVerb);
  console.log("ReStateWhStuffSubjectVerb(): Subject:", Subject);

  let except = (sub) => {
    let exceptons = ["the", "them", "school"];
    return exceptons.includes(sub);
  };

  let EditSub = Subject.includes("'s")
    ? Subject.replace(/\s?'s/, "").split(" ")[0]
    : Subject.trim().split(" ")[0];
  console.log("EditSub: ", EditSub);
  let ExtractSub = getGender(EditSub, "en") === "male" ? "he" : "she";
  if (
    EditSub.toLowerCase().trim().includes("the") ||
    pronouns.some((item) => item.includes(Subject.toLowerCase().trim()))
  )
    ExtractSub = "";
  console.log("ExtractSub: ", ExtractSub);

  if (EditSub.toLowerCase().trim().startsWith("the") || DidSubject) {
    console.log("Determiner defined; No pronoun xtraction");
    if (EditSub.toLowerCase().trim().startsWith("the")) {
      console.log("Trying recursive for THE");
      let pos = ReStateWhStuffSubjectVerb(
        MainVerb,
        Subject.slice(4),
        strict,
        DidSubject
      );
      console.log("pos:", pos);
      let posix = pos.indexOf(
        "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$^&Y@*#&$$$$$$$$$$$$$$"
      );
      console.log("posix:", posix);
      pos = pos.slice(0, posix !== -1 ? posix - 1 : -1);
      console.log("newpos:", pos);
      for (const itsss in pos) {
        SubArray.push("" + pos[itsss].trim());
      }
    }
    SubArray.push(Subject);
    SubArray.push("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$^&Y@*#&$$$$$$$$$$$$$$"); //separation identifier; The chances of a user inputting this are miniscule, and not of interest.
    SubArray.push(MainVerb);
    if (DidSubject) SubArray.push(DidSubject);
    return SubArray;
  } else if (
    strict &&
    !pronouns.some((item) => item.includes(Subject.toLowerCase().trim())) &&
    (!(
      humannames[capitalizeFirstLetter(EditSub.trim())] &&
      !except(EditSub.trim())
    ) ||
      except(EditSub.toLowerCase().trim()))
  ) {
    console.warn("ReStateWhStuffSubjectVerb(): Strict Enabled");
    SubArray.push(Subject);
    SubArray.push(MainVerb);
    return SubArray;
  } else {
    if (
      !strict &&
      !(
        humannames[capitalizeFirstLetter(EditSub.trim())] &&
        !except(EditSub.trim())
      ) &&
      !pronouns.some((item) => item.includes(Subject.toLowerCase().trim())) &&
      !["did", "do", "does"].includes(
        EditSub.toLowerCase().trim()
      ) /*TODO: Maybe add is? */
    ) {
      let SubFinRun = new Fin.Run(Subject + " " + MainVerb);
      console.log(SubFinRun);
      if (SubFinRun.sentences.length === 0 || (!!!Subject && !!!MainVerb)) {
        console.error("ERR: SUB FIN RUN NOT VALID; Debug only!");
        return [];
      }
      if (
        SubFinRun.sentences[0].tags[0].includes("DT") ||
        Subject.split(" ").length > 1
      ) {
        if (Subject.split(" ").length > 1) {
          if (
            !humannames[
              capitalizeFirstLetter(
                Subject.split(" ")[0]
                  .trim()
                  .replace(/'s/, "") /* Remove 's, if present */
              )
            ]
          ) {
          } else {
            messages.push(
              `An extracted subject isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('HowToUse').scrollIntoView();" onkeydown="document.getElementById('HowToUse').scrollIntoView();">how to use</a> for more info.`
            );
            messagesLevels.push("warning");
          }
        } else {
          messages.push(
            `An extracted subject isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('HowToUse').scrollIntoView();" onkeydown="document.getElementById('HowToUse').scrollIntoView();">how to use</a> for more info.`
          );
          messagesLevels.push("warning");
        }
      } else if (
        !messages.includes(
          `Subject "${Subject}" isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('HowToUse').scrollIntoView();" onkeydown="document.getElementById('HowToUse').scrollIntoView();">how to use</a> for more info.`
        )
      ) {
        messages.push(
          `Subject "${Subject}" isn't included in our list of human names. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('HowToUse').scrollIntoView();" onkeydown="document.getElementById('HowToUse').scrollIntoView();">how to use</a> for more info.`
        );
        messagesLevels.push("warning");
      }
    }

    const push = (Subj, Pron) => {
      console.log(`Push()ing: Subj: ${Subj}, Pron: ${Pron}`);
      if (pronouns.some((item) => item.includes(Subj))) {
        console.log("Subj = Pron, pushing Pron:", Pron);
        SubArray.push(Pron);
      } else if (Subj.split(" ").length > 1) {
        console.log("Long subj");
        let xs = "";
        xs += Pron;
        for (let i = 1; i < Subj.split(" ").length; ++i) {
          if (Subj.split(" ")[i] === "'s");
          else xs += " " + Subj.split(" ")[i];
        }
        if (
          Subj.split(" ")[0].includes("'s") ||
          Subj.split(" ")[1] === "'s" /* .has('s) */
        ) {
          console.log("Push(): Long Subj");
          if (pronouns.some((elem) => elem[3] === Pron || elem[2] === Pron)) {
            console.log("Pushed!");
            console.log("Push: " + xs);
            SubArray.push(xs);
          } else console.log("Incorrect Pron");
        } else {
          console.log("Long Subj Non-Possesive Push()ed.");
          console.log("Push: " + xs);
          SubArray.push(xs);
        }
      } else {
        console.log("Non-Long Subj Push()ed.");
        SubArray.push(Subj);
      }
    };

    //...
    SubArray.push(Subject);
    for (const it of pronouns) {
      console.log("pronoun extraction: it:", it);
      console.log(
        "pronoun extraction: it.some:",
        it.some(
          (item) =>
            item === Subject.toLowerCase() || item === ExtractSub.toLowerCase()
        )
      );
      if (
        it.some(
          (item) =>
            item === Subject.toLowerCase() || item === ExtractSub.toLowerCase()
        )
      ) {
        for (const sub of it) {
          console.log("pronoun extraction: extracting:", sub);
          push(Subject, sub);
        }
      }
    }

    for (const sub of pronouns[2]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[3]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[4]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[5]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[6]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[7]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }
    for (const sub of pronouns[8]) {
      console.log("pronoun extraction: extracting:", sub);
      push(Subject, sub);
    }

    console.log("MainVerb", MainVerb);
    SubArray.push(MainVerb);
    return SubArray;
  }
}

function TenseTestArray(qarr, r) {
  //AMAZE
  //TODO.
  console.debug("Entering TenseTestArray()");
  console.log("TenseTestArray(): qarr:", qarr);
  let result = false;
  var MainVerb;
  if (
    qarr.includes("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$^&Y@*#&$$$$$$$$$$$$$$")
  ) {
    let xis = qarr.indexOf(
      "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$^&Y@*#&$$$$$$$$$$$$$$"
    );
    let lens = qarr.length - (xis + 1);
    if (lens === 2) {
      MainVerb = qarr[qarr.length - 2];
      var DidVerb = qarr[qarr.length - 1];
    } else if (lens === 1) {
      MainVerb = qarr[qarr.length - 1];
    }
  } else MainVerb = qarr[qarr.length - 1];
  if (!MainVerb) return false;
  console.log("TenseTestArray(): MainVerb:", MainVerb);
  for (let i = 0; i < qarr.length - 1; ++i) {
    console.log("TenseTestArray(): iteration:", i);
    let Sub = qarr[i];
    console.log(`TenseTestArray(): Subject for iteration ${i}:`, Sub);
    if (Sub === "") continue;
    result =
      TenseTest(Sub + " " + MainVerb, r) ||
      TenseTest(MainVerb + " " + Sub, r) ||
      result;
    /* for cases such as 
    Q: How many species of beetles are there?
    R: There are 350,000 species of beetles.
    */
    result = TenseTestR(Sub, MainVerb, r) || result;
    if (DidVerb)
      result =
        TenseTest(Sub + " " + MainVerb + " " + DidVerb, r) ||
        TenseTest(Sub + " " + DidVerb, r) ||
        TenseTest(MainVerb + " " + DidVerb + " " + Sub, r) ||
        TenseTest(MainVerb + " " + Sub, r) ||
        result;
    if (["does"].includes(MainVerb.toLowerCase().trim())) {
      result = result || TenseTest(Sub, r);
    }
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

function TenseTestR(sa, mav, r) {
  console.debug("Entering TenseTestR()");

  let mv = ("" + mav).toLowerCase().trim();
  let s = ("" + sa).toLowerCase().trim();

  if (!(s && mv && s.trim() && mv.trim() && r && r.raw)) return false;

  let sentence = r.raw;
  let infly = new Inflectors(mv);

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

  if (mv.endsWith("s")) {
    versions.push(mv.replace(/s$/, ""));
  }
  if (/(be|am|is|are|was|were|being|been)/.test(mv)) {
    versions.push("be", "am", "is", "are", "was", "were", "being", "been");
  }

  console.info("TenseTestR(): versions:", versions);

  let res = [];

  for (const version of versions) {
    res.push(NegaTestR(version, s, sentence));
  }

  console.info("TenseTestR(): res:", res);

  try {
    return res.some((item) => item === true);
  } finally {
    console.debug("Exiting TenseTestR()");
  }
}
function NegaTestR(mv, s, r) {
  //var negated = negate(g);
  return r.includes(mv) && r.includes(s);
}

function TenseTest(g, r) {
  console.debug("Entering TenseTest()");
  let sentence = allTrim(r.sentences[0].sentence.toLowerCase().trim());
  let generated = allTrim(g.toLowerCase().trim());
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

  if (FirstVerb.endsWith("s")) {
    versions.push(FirstVerb.replace(/s$/, ""));
  }
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

  /*if (["does"].includes(FirstVerb.toLowerCase().trim())) {
    console.log(`DoesTest: g${generated} s${sentence}`);
    console.log("res:", res[res.push(NegaTest(generated, sentence))]);
  }/** */

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
  outputstr += str.toLowerCase();
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

function PrepositionalExceptions(tok) {
  console.log(
    "PrepositionalExceptions:",
    tok,
    "Result:",
    ["of"].includes(tok.toLowerCase().trim())
  );
  return ["of"].includes(tok.toLowerCase().trim());
}

function Verb(posTag) {
  console.info("Verb():", posTag);
  console.info("Verb():", /(IN|TO|VB|MD)/.test(posTag) ? true : false);
  return /(IN|TO|VB|MD)/.test(posTag) ? true : false;
  //console.info("Verb():", /(IN|TO|VB|MD)/.test(posTag) ? true : false);
  //return /(IN|TO|VB|MD)/.test(posTag) ? true : false;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function Adjective(posTag) {
  console.info("Adjective():", posTag);
  console.info("Adjective():", /(JJ|JJR|JJS)/.test(posTag) ? true : false);
  return /(JJ|JJR|JJS)/.test(posTag) ? true : false;
}
