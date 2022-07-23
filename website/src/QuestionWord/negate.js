import * as Fin from "finnlp";
import { Inflectors } from "en-inflectors";
import "fin-tense";
import "fin-sentence-type";
import stemmer from "en-stemmer";
import pronouns from "./pronouns";

const hasCopula = (vb) => /(is|was|am|are|will|were|be)/.test(vb);
const trav = (deps, word) => {
  if (deps.tokens.includes(word)) return deps;
  else {
    if (deps.left.length === 0) return null;
    return deps.left.find((item) => trav(item, word));
  }
};

const passives = ["got", "was", "were", "had", "have"];
const auxiliaries = ["used", "did", "does", "do"];

function Negate(str) {
  console.debug("Negate()");
  console.debug("Negate(): str:", str);

  let origin = str + "";

  if (str === undefined || str === null)
    throw new TypeError("Undefined parameter 'str'");
  if (typeof str !== "string")
    throw new TypeError(
      `Incorrect type for Negate(); Expected type 'string' but recieved '${typeof str}'.`
    );

  //let instance = new Inflectors("book");

  var Sentence = new Fin.Run(str);
  let depsTree = Sentence.sentences[0].depsTree;

  let FirstVerbIndex = Sentence.sentences[0].tags.findIndex(
    (item) => item.includes("VB") || item.includes("IN")
  );
  let FirstVerb = Sentence.sentences[0].tokens[FirstVerbIndex];
  FirstVerbIndex = str.indexOf(FirstVerb);

  var imperative = Sentence.sentenceType()[0].some(
    (item) => item.type === "imperative" && item.confidence > 50
  );
  let isWantInfinitive = FirstVerb.toLowerCase() === "wants";

  console.log("imperative", imperative);

  console.log("FirstVerb:", FirstVerb);
  console.log("FirstVerbIndex:", FirstVerbIndex);

  var Inflections = new Inflectors(FirstVerb);
  var Tenses = Sentence.tense()[0];

  console.log("Negate: Sentence:", Sentence);
  console.log("Negate: Inflectors:", Inflections);
  console.log("Negate: Tenses:", Tenses);

  //verbs.first() must be negated

  Tenses = Tenses ? Tenses : [];

  if (isWantInfinitive) {
    console.log("want-infinitive");
    let oes = "does";
    str =
      str.slice(0, FirstVerbIndex) +
      oes +
      " not " +
      str.slice(FirstVerbIndex, str.length) +
      "";
    str = str.replace("wants", "want");
  } else if (Tenses.includes("present" && !imperative)) {
    console.log("present");
    if (Tenses.includes("simple")) {
      console.log("simple");
      if (hasCopula(FirstVerb)) {
        console.log("copula");
        // not be
        let IsBe = /be/.test(FirstVerb);
        if (IsBe) {
          str.replace(/be/, "not be");
        } else {
          // will not
          let IsIs = /(is|was|am|are|will|were)/.test(FirstVerb);
          if (IsIs) {
            let ind = str.search(/(is|was|am|are|will|were)/);
            let len = /(is|was|am|are|will|were)/.exec(str).length;
            str =
              str.slice(0, ind + len + 1) + " not" + str.slice(ind + len + 1);
          }
        }
      } else {
        console.log(stemmer);
        let inf = stemmer(FirstVerb);
        console.log("inf version:", inf);
        console.log("doesnot");
        console.log(str.slice(0, FirstVerbIndex + FirstVerb.length));
        console.log(str.slice(FirstVerbIndex + FirstVerb.length + 9));

        let does = doDoes(FirstVerb, depsTree); //implement based on doDoes() at https://github.com/spencermountain/compromise/blob/52fb03e7a26e8caed08bf04d893b0044aab4c538/src/3-three/verbs/api/lib.js#L41

        str =
          str.slice(0, FirstVerbIndex) +
          `${does /* Switch does/do based on context */} not ` +
          str.slice(FirstVerbIndex, str.length);
      }
    }
  } else if (
    Tenses.includes("past") ||
    passives.includes(FirstVerb.toLowerCase())
  ) {
    console.log("past");
    if (
      Tenses.includes("simple") &&
      !passives.includes(FirstVerb.toLowerCase()) &&
      !auxiliaries.includes(FirstVerb.toLowerCase())
    ) {
      console.log("simple");
      if (hasCopula(FirstVerb)) {
        console.log("copula");
        // not be
        let IsBe = /be/.test(FirstVerb);
        if (IsBe) {
          str.replace(/be/, "not be");
        } else {
          // will not
          let IsIs = /(is|was|am|are|will|were)/.test(FirstVerb);
          if (IsIs) {
            let ind = str.search(/(is|was|am|are|will|were)/);
            let len = /(is|was|am|are|will|were)/.exec(str).length;
            str =
              str.slice(0, ind + len + 1) + " not" + str.slice(ind + len + 1);
          }
        }
      } else {
        let inf = stemmer(FirstVerb);
        console.log("inf version:", inf);
        str =
          str.slice(0, FirstVerbIndex) +
          "did not " +
          inf +
          " " +
          str.slice(
            str.slice(0, FirstVerbIndex).length + FirstVerb.length,
            str.length
          );
      }
    } else if (passives.includes(FirstVerb.toLowerCase())) {
      console.log("passive");
      if (FirstVerb.toLowerCase() === "got") {
        console.log("got");
        str =
          str.slice(0, FirstVerbIndex) +
          "did not get" +
          str.slice(
            str.slice(0, FirstVerbIndex).length + FirstVerb.length,
            str.length
          );
      } else {
        console.log("were,was,had,have");
        str =
          str.slice(0, FirstVerbIndex + FirstVerb.length) +
          " not" +
          str.slice(
            str.slice(0, FirstVerbIndex).length + FirstVerb.length,
            str.length
          );
      }
    } else if (auxiliaries.includes(FirstVerb.toLowerCase())) {
      var FirstVerbTree = trav(depsTree, FirstVerb);
      if (trav(FirstVerbTree, "used") !== null) {
        console.log("used aux");
        str =
          str.slice(0, FirstVerbIndex) +
          " did not " +
          str.slice(str.slice(0, FirstVerbIndex).length, str.length);
      } else {
        console.log("modal aux");
        str =
          str.slice(0, FirstVerbIndex + FirstVerb.length) +
          " not " +
          str.slice(FirstVerbIndex + FirstVerb.length + 1, str.length);
      }
    }
  } else if (imperative && /!/g.test(str)) {
    console.log("imperative");
    str = str.replace(/!/g, "");
    str =
      str.slice(0, FirstVerbIndex) +
      "do not " +
      FirstVerb +
      " " +
      str.slice(
        str.slice(0, FirstVerbIndex).length + FirstVerb.length,
        str.length
      );
  } else if (
    Tenses.includes("infinitive") ||
    FirstVerb === stemmer(FirstVerb)
  ) {
    console.log("infinitive");
    if (FirstVerb.includes("want")) {
      console.log("want");
    } else {
      if (hasCopula(FirstVerb)) {
        console.log("copula");
        // not be
        let IsBe = /be/.test(FirstVerb);
        if (IsBe) {
          str.replace(/be/, "not be");
        } else {
          // will not
          let IsIs = /(is|was|am|are|will|were)/.test(FirstVerb);
          if (IsIs) {
            let ind = str.search(/(is|was|am|are|will|were)/);
            let len = /(is|was|am|are|will|were)/.exec(str).length;
            str =
              str.slice(0, ind + len + 1) + " not" + str.slice(ind + len + 1);
          }
        }
      } else {
        console.log("doesnot");
        console.log(str.slice(0, FirstVerbIndex + FirstVerb.length));
        console.log(str.slice(FirstVerbIndex + FirstVerb.length + 9));

        let does = doDoes(FirstVerb, depsTree)
          ? doDoes(FirstVerb, depsTree)
          : "does"; //implement based on doDoes() at https://github.com/spencermountain/compromise/blob/52fb03e7a26e8caed08bf04d893b0044aab4c538/src/3-three/verbs/api/lib.js#L41

        str =
          str.slice(0, FirstVerbIndex) +
          `${does /* Switch does/do based on context */} not ` +
          str.slice(FirstVerbIndex, str.length);
      }
    }
  }

  console.log("origin:", origin);
  console.log("negated:", str);

  try {
    return str.trim();
  } finally {
    console.debug("Exiting Negate()");
  }
}

function Ngate(str) {
  console.log("Ngate()");
  var Sentence = new Fin.Run(str);

  let FirstVerbIndex = Sentence.sentences[0].tags.findIndex(
    (item) => item.includes("VB") || item.includes("IN") || item.includes("MD")
  );
  let FirstVerb = Sentence.sentences[0].tokens[FirstVerbIndex];
  FirstVerbIndex = str.indexOf(FirstVerb);

  FirstVerb = FirstVerb ? FirstVerb : "";
  if (FirstVerb === "") return "";

  if (str.toLowerCase() === "be") {
    return str;
    //m.prepend('not')
  }
  // is/was not
  if (hasCopula(FirstVerb) === true) {
    console.log("copula");
    // not be
    let IsBe = /be/.test(FirstVerb);
    if (IsBe) {
      str.replace(/be/, "not be");
    } else {
      // will not
      let IsIs = /(is|was|am|are|will|were)/.test(FirstVerb);
      if (IsIs) {
        let ind = str.search(/(is|was|am|are|will|were)/);
        let len = /(is|was|am|are|will|were)/.exec(str)[0].length;
        console.log(
          str.slice(0, ind + len) + " not " + str.slice(ind + len + 1)
        );
        return str.slice(0, ind + len) + " not " + str.slice(ind + len + 1);
      }
    }
  }

  // 'would not'
  if (/(will|had|have|has|did|does|do)/.test(str) || Modal(FirstVerb)) {
    console.log("cop false");
    let r =
      str.slice(0, FirstVerbIndex + FirstVerb.length) +
      " not " +
      str.slice(FirstVerbIndex + FirstVerb.length + 1, str.length);
    console.log(r);
    return r;
  }
  return Negate(str);
}

export default Ngate;

function doDoes(word, depsTree) {
  console.log("doDoes");
  let inflectors = new Inflectors(word);

  var depsWord;

  depsWord = trav(depsTree, word);

  if (
    depsWord &&
    depsWord.left.some((item) => {
      return item.tokens.some((item) => {
        return item.toLowerCase() === "i" || item.toLowerCase() === "we";
      });
    })
  ) {
    console.log("we or i");
    return "do";
  }
  if (inflectors.isPlural()) {
    console.log("plural");
    return "do";
  }
  return "does";
}

function Modal(Verb) {
  var sent = new Fin.Run(Verb);
  if (sent.raw === "") return false;
  return sent.sentences[0].tags[0].includes("MD");
}

/* was in simple hascopula else
console.log(stemmer);
        let inf = stemmer(FirstVerb);
        console.log("inf version:", inf);
        if (hasCopula(inf)) {
          console.log("copula");
          // not be
          let IsBe = /be/.test(FirstVerb);
          if (IsBe) {
            str.replace(/be/, "not be");
          } else {
            // will not
            let IsIs = /(is|was|am|are|will|were)/.test(FirstVerb);
            if (IsIs) {
              let ind = str.search(/(is|was|am|are|will|were)/);
              let len = /(is|was|am|are|will|were)/.exec(str).length;
              str =
                str.slice(0, ind + len + 1) + " not" + str.slice(ind + len + 1);
            }
          }
        } else {
          console.log("doesnot");
          console.log(str.slice(0, FirstVerbIndex + FirstVerb.length));
          console.log(str.slice(FirstVerbIndex + FirstVerb.length + 9));

          str =
            str.slice(0, FirstVerbIndex) +
            "does not " +
            str.slice(FirstVerbIndex, str.length);
        } */
