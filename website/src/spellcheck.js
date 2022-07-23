import * as alex from "alex";
import * as Fin from "finnlp";

let test = async () => {
  //console.error("tes", await IsMisspelled("misspelled"));
  //console.error(GetAlexWarnings("He is fine."));
  //console.error(await GetFeedback("mispelled"));
};
test();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function GetFeedback(paragraph) {
  const messages = [];
  const messageLevels = [];

  let caught = true;
  while (caught && window.navigator.onLine) {
    caught = false;
    console.log("Checking....");
    await fetch("https://84sml3.sse.codesandbox.io/spellcheck").catch((e) => {
      caught = true;
      console.log("err:", e);
    });
  }
  console.log("nerr");

  for (const mes of GetAlexWarnings(paragraph)) {
    messages.push(mes);
    messageLevels.push("warning");
  }

  if (!window.navigator.onLine) {
    messages.push("Spellchecking requires an active internet connection.");
    messageLevels.push("error");
    return { messages, messageLevels };
  }

  let processed = new Fin.Run(paragraph);
  for (const sentence of processed.sentences) {
    for (const wordy of sentence.tokens) {
      let regex = /(#|\$|SYM|EM|\.|:|,|FW|LS|CD|\(|\))/;
      let clindex = sentence.tokens.indexOf(wordy);
      if (regex.test(sentence.tags[clindex])) continue;
      let word = (" " + wordy).trim();
      word = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (!word || word === "") continue;
      if (await IsMisspelled(word)) {
        if (!word || word === "") continue;
        let missMessage = `'${word}' seems to be misspelled. Have you tried `;
        let respellings = await CheckSpelling(word);
        if (respellings.length < 1) continue;
        let iteration = 0;
        for (const respelling of respellings) {
          if (iteration === respellings.length - 1) {
            missMessage += "or '" + respelling + "'";
          } else {
            missMessage += "'" + respelling + "', ";
          }
          iteration++;
        }
        missMessage += "?";
        messages.push(missMessage);
        messageLevels.push("warning");
      }
    }
  }

  return { messages, messageLevels };
}

export function GetAlexWarnings(sentence) {
  const { messages } = alex.text(sentence, {} /* Empty config */);
  console.log(
    messages.map((message) => {
      return message.message;
    })
  );
  return messages.map((message) => {
    return message.message;
  });
}

export async function IsMisspelled(word) {
  let err = null;
  let res = await fetch(
    "https://84sml3.sse.codesandbox.io/spellcheck?word=" +
      encodeURIComponent(word)
  )
    .then((res) => res.json())
    .catch((e) => (err = e));
  if (err) return false;
  if (res.misspelled) return res.misspelled;
  else return false;
}

export async function CheckSpelling(word) {
  let err = null;
  let res = await fetch(
    "https://84sml3.sse.codesandbox.io/spellcheck?word=" +
      encodeURIComponent(word)
  )
    .then((res) => res.json())
    .catch((e) => (err = e));
  if (err) return [];
  if (res.suggestions) return res.suggestions;
  else return [];
}
