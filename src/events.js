import * as definitions from "./definitions";
import { IsRestatement, GetHint } from "../src/index";
import $ from "jquery";
import Quill from "quill";
import { GetFeedback } from "./spellcheck";
//import spellcheck

//toplevel
const DEBUG = false;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ServiceWorker Registration

if ("serviceWorker" in navigator || navigator.serviceWorker) {
  navigator.serviceWorker
    .register("../serviceworker.js")
    .then((registration) => {
      // Registration was successful
      console.log(
        "ServiceWorker registration successful with scope: ",
        registration.scope
      );
    })
    .catch((err) => {
      // registration failed :(
      console.log("ServiceWorker registration failed: ", err);
    })
    .finally(() => {});
}

function PerformActionsOnDebug() {
  if (DEBUG) {
    console.debug(
      "*******************  DEBUGGING ENABLED  *******************"
    );
  } else {
    console.warn("******************** PRODUCTION ********************");
    let x = document.getElementsByClassName("debug_log");
    for (let i = 0; i < x.length; ++i) {
      if (x.item(i)) if (x.item(i).remove) x.item(i).remove();
    }
  }

  //let DEBUG = true;
  //let DEBUG = false;
  if (!DEBUG) {
    console = console || {};
    console.log = function () {};
    console.debug = function () {};
    console.warn = function () {};
    console.error = function () {};
    console.info = function () {};
    console.success = function () {};
  } /**/
}
function MakeQueryablePromise(promise) {
  // Don't create a wrapper for promises that can already be queried.
  if (promise.isResolved) return promise;

  var isResolved = false;
  var isRejected = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  var result = promise.then(
    function (v) {
      isResolved = true;
      return v;
    },
    function (e) {
      isRejected = true;
      throw e;
    }
  );
  result.isFulfilled = function () {
    return isResolved || isRejected;
  };
  result.isResolved = function () {
    return isResolved;
  };
  result.isRejected = function () {
    return isRejected;
  };
  return result;
}

const removeWatermark = () => {
  const ids = [];
  const iframes = document.body.querySelectorAll("iframe");
  for (const iframe of iframes) {
    if (iframe.id.startsWith("sb__open-sandbox")) ids.push(iframe.id);
  }
  for (const id of ids) {
    const node = document.createElement("div");
    node.style.setProperty("display", "none", "important");
    node.id = id;
    document.getElementById(id).remove();
    document.body.appendChild(node);
  }
};

setTimeout(removeWatermark, 1000);
/* */
let w = function () {
  if ($("#logg")) {
    var logg = $("#logg");
    /*console.log = function (msg) {
      var former = console.log;
      former(msg);
      
      CreateAlert(msg, "secondary", $("#mylog"));
    };*/

    /*
    function hookLogType(logType) {
    const original= console[logType].bind(console)
    return function(){
      console.everything.push({ 
        type: logType, 
        timeStamp: TS(), 
        value: Array.from(arguments) 
      })
      original.apply(console, arguments)
    }
  } 
  */

    function hookLogType(logType) {
      const original = console[logType].bind(console);
      console.info("Hooking: console." + logType);
      let color =
        logType === "log"
          ? "secondary"
          : logType === "error"
          ? "danger"
          : logType === "debug"
          ? "primary"
          : logType === "warn"
          ? "warning"
          : logType;

      return function () {
        //alert("Hooked console." + logType + ", logging '" + arguments[0] + "'");
        if (
          document.getElementById("logg") &&
          document.getElementById("logg").textContent === "Nothing to see here!"
        )
          document.getElementById("logg").textContent = "";
        var concat = "";
        for (
          var i = 0;
          arguments[i] !== null && arguments[i] !== undefined;
          ++i
        ) {
          if (
            typeof arguments[i] === "string" ||
            arguments[i] instanceof String
          )
            concat += arguments[i] + "\t";
          else if (typeof arguments[i] === "boolean" && arguments[i] !== true)
            concat += "false";
          else concat += JSON.stringify(arguments[i]) + "\t";
        }
        CreateAlertA(concat, color, logg, false);
        original.apply(console, arguments);
      };
    }

    const deflog = console.log;
    console.success = function () {
      let starguments = "";
      arguments.forEach((arg) => (starguments += arg + "\t"));
      console.info("✅ %c" + starguments, "color:#71C174;");
    }; //make sure declared
    ["log", "error", "warn", "debug", "info", "success"].forEach((logType) => {
      console[logType] = hookLogType(logType);
    });
    console.success = function () {
      var concat = "";
      for (
        var i = 0;
        arguments[i] !== null && arguments[i] !== undefined;
        ++i
      ) {
        if (typeof arguments[i] === "string" || arguments[i] instanceof String)
          concat += arguments[i] + "\t";
        else if (typeof arguments[i] === "boolean" && arguments[i] !== true)
          concat += "false";
        else concat += JSON.stringify(arguments[i]) + "\t";
      }
      CreateAlertA(concat, "success", logg, false);
      deflog.apply(console, arguments);
    };
  }
};
w();
PerformActionsOnDebug();
let x = LoadEditorsIfAvailable();
let y = LoadLogo();
let z = LoadEvents();
let a = MakeQueryablePromise(ExecuteOnLoadFinish(x, y, z));

async function ExecuteOnLoadFinish(x, y, z) {
  await Promise.all([x, y, z]);
  $(".loading-overlay").fadeOut(500);
  if (window.location.href.includes("/demo.html")) {
  }
}

var quill = null;
/*var quillToolbarOptions = [
  [{ font: [] }, { size: ["small", false, "large", "huge"] }], // custom dropdown

  ["bold", "italic", "underline", "strike"],

  [{ color: [] }, { background: [] }],

  [{ script: "sub" }, { script: "super" }],

  [{ header: 1 }, { header: 2 }, "blockquote", "code-block"],

  [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],

  [{ direction: "rtl" }, { align: [] }],

  ["link", "image", "video", "formula"],

  ["clean"]
];*/

async function LoadEditorsIfAvailable() {
  if (document.getElementById("editor")) {
    console.log("Creating Quill");
    quill = new Quill("#editor", {
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"], // toggled buttons
          ["blockquote", "code-block"],

          [{ header: 1 }, { header: 2 }], // custom button values
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }], // superscript/subscript
          [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
          [{ direction: "rtl" }], // text direction

          [{ font: [] }],
          [{ size: ["small", false, "large", "huge"] }], // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],

          ["link", "image", "video", "formula"]
          //["clean"] // remove formatting button
        ]
        /*[
          [{ font: [] }, { size: ["small", false, "large", "huge"] }], // custom dropdown

          ["bold", "italic", "underline", "strike"],

          [{ color: [] }, { background: [] }],

          [{ script: "sub" }, { script: "super" }],

          [{ header: 1 }, { header: 2 }, "blockquote", "code-block"],

          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" }
          ],

          [{ direction: "rtl" }, { align: [] }],

          ["link", "image", "video", "formula"],

          ["clean"]
        ]*/
      },
      theme: "snow"
    });
    console.log("Quill Created:", quill);
    quill.root.setAttribute("spellcheck", false);
  }
}

async function analyzeQuill() {
  document.getElementById("loaderrr").src += "";
  $(".loading-overlay").fadeIn(500);
  await delay(500);
  console.log("Quill:", quill);
  if (!quill) {
    console.log("Quilly");
    var container = document.querySelector("#editor");
    quill = Quill.find(container);
    console.log("Quill Found?:", quill);
  }
  let text = quill?.getText() ? quill.getText() : "";
  let feedback = await GetFeedback(text);
  let feedbacklayer = document.getElementById("QuillFeedSnack");
  for (let i = 0; i < feedback.messages.length; ++i) {
    let piece = feedback.messages[i];
    let level = feedback.messageLevels[i];
    CreateAlertA(piece, level, feedbacklayer);
  }
  if (feedback.messages.length > 0)
    CreateAlertA(
      `${feedback.messages.length} Warnings!`,
      "info",
      feedbacklayer
    );
  else
    CreateAlertA(
      `We don't have any feedback right now! Good job!`,
      "success",
      feedbacklayer
    );
  $(".loading-overlay").fadeOut(500);
}

window.onload = () => {
  $(".loading-overlay").fadeOut(500);
};

async function LoadLogo() {
  $("#logg").children().remove();
  console.info("Loading Logo!");
  var num = Math.floor(Math.random() * 6 + 1);
  var path = "src/Logo" + num + ".svg";
  var heroimg = document.getElementById("heroimg");
  //console.warn(path);
  if (heroimg) heroimg.src = path;

  var favi = document.getElementById("favicon");
  favi.href = path;
  console.info("Logo Loaded!");
}

async function LoadEvents() {
  console.info("Loading Events!");
  var demo = document.getElementById("demo");
  if (demo) {
    demo.onclick = Calculate;
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop)
    });
    let question = params.question; //document.getElementById("questionInput").value;
    let response = params.response; //document.getElementById("responseInput").value;
    let strict = params.strict; //document.getElementById("strictCheck").checked;
    let autosubmit = params.as;
    if (question) {
      document.getElementById("questionInput").value = question;
    }
    if (response) {
      document.getElementById("responseInput").value = response;
    }
    if (strict) {
      document.getElementById("strictCheck").checked =
        strict.toLowerCase() === "true" ? true : false;
    }
    if (autosubmit) {
      if (autosubmit.toLowerCase() === "true" ? true : false) {
        Calculate();
        $(".loading-overlay").fadeOut(500);
      }
    }
  }
  var hint = document.getElementById("hint");
  if (hint) {
    var output = document.getElementById("result");
    hint.onclick = DoHint;
    var observer = new MutationObserver(function (mutationList, observer) {
      UpdateHint();
    });
    observer.observe(output, {
      characterData: false,
      childList: true,
      attributes: false
    });
    UpdateHint();
  }
  var checkEdits = document.getElementById("checkEdits");
  if (checkEdits) {
    checkEdits.onclick = analyzeQuill;
  }
  console.info("Events Loaded!");
  document.addEventListener("scroll", function () {
    // get the active element and call blur
    document.activeElement.blur();
  });
}

function UpdateHint() {
  console.info("Updating Hint!");
  var hint = document.getElementById("hint");
  var input = document.getElementById("questionInput");
  //console.log(output.innerHTML);

  if (hint && input && input.value && input.value !== "") {
    console.log("UpdateHint(): Enabling!");
    //console.log("false");
    hint.disabled = false;
    hint.innerHTML = "Show Hint";
  } else if (hint) {
    //console.log("true");
    console.log("UpdateHint(): Disabling!");
    HideHint();
    hint.disabled = true;
    hint.innerHTML = "Unavailable";
  } else {
    console.log("UpdateHint(): None!");
  }
}

function DoHint() {
  console.info("Doing Hint!");
  var hint = document.getElementById("hint");
  if (hint.innerHTML === "Show Hint") {
    hint.innerHTML = "Hide Hint";
    ShowHint();
  } else if (hint.innerHTML === "Hide Hint") {
    hint.innerHTML = "Show Hint";
    HideHint();
  }
}

function ShowHint() {
  console.info("ShowHint()");
  var question = document.getElementById("questionInput").value;
  var response = document.getElementById("responseInput").value;
  var hintcontainer = document.getElementById("hintcontainer");
  ///var hintcont = document.getElementById("hintcont");
  hintcontainer.innerHTML = GetHint(question, response);
  hintcontainer.style.display = "initial";
}

function HideHint() {
  console.info("HideHint()");
  document.getElementById("hintcontainer").style.display = "none";
}

async function Calculate() {
  console.log("Calculate()");
  var question = document.getElementById("questionInput").value;
  var response = document.getElementById("responseInput").value;
  var strict = document.getElementById("strictCheck").checked;
  console.log("Calculate(): Strict Enabled? :", strict);
  console.log(`Calculate(): Question: ${question}, Response: ${response}`);
  var output = document.getElementById("result");
  if (!(question || response)) {
    console.warn("Calculate(): Null Params");
    output.innerHTML = "Undefined";
    return;
  }
  if (question === "" || response === "") {
    console.warn("Calculate(): Empty Params");
    output.innerHTML = "Undefined";
    return;
  }

  if (strict) {
    CreateAlertA(
      `Strict Mode enabled. See <a class="link-primary" role="button" tabindex="0" onclick="document.getElementById('HowToUse').scrollIntoView();" onkeydown="document.getElementById('HowToUse').scrollIntoView();">how to use</a>`,
      "primary",
      document.getElementById("liveAlertPlaceholder")
    );
  }
  //check for noun is name. if not, send message technically true but not really
  $(".loading-overlay").fadeToggle(500);
  await delay(500);
  let waserror = false;
  try {
    console.success("IsRestatement(): Launching!");
    output.innerHTML = IsRestatement(question, response, {
      QWordStrict: strict
    });
  } catch (e) {
    if (!(e.name && e.name === "MessageError")) {
      waserror = true;
      throw e;
    } else output.innerHTML = e.result;
    console.log("MessageError:", JSON.stringify(e));
    for (let i = 0; i < e.issues.length; ++i) {
      console.log(i);
      CreateAlertA(
        e.issues[i],
        e.issueLevels[i],
        document.getElementById("liveAlertPlaceholder")
      );
    }
  } finally {
    if (!waserror)
      console.success("IsRestatement(): Finished Successfully! (No Errors!)");
  }
  $(".loading-overlay").fadeToggle(500);
}

// addMethod - By John Resig (MIT Licensed)
/*function addMethod(object, name, fn) {
  var old = object[name];
  object[name] = function () {
    if (fn.length == arguments.length) return fn.apply(this, arguments);
    else if (typeof old == "function") return old.apply(this, arguments);
  };
}*/

function CreateAlertA(Text, Color, WhereToAppend, isdismissible = true) {
  var sick = isdismissible ? " alert-dismissible" : "";
  var btns = isdismissible
    ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    : "";
  //window.alert(sick);
  var alert = document.createElement("div");
  alert.innerHTML =
    '<div style="overflow-wrap: break-word" class="alert alert-' +
    Color +
    sick +
    ' role="alert" ' +
    (isdismissible ? "" : 'tabindex="0"') +
    " >" +
    Text +
    btns +
    "</div>";
  WhereToAppend.append(alert);
  return alert;
}
function CreateAlertB(Text, Color, WhereToAppend, CRES, isdismissible = true) {
  var sick = isdismissible ? " alert-dismissible" : "";
  var btns = isdismissible
    ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    : "";
  //window.alert(sick);
  var alert = document.createElement("div");
  alert.innerHTML =
    '<div class="alert alert-' + Color + sick + ' role="alert" ' + isdismissible
      ? ""
      : +" >" + Text + btns + "</div>";
  WhereToAppend.append(alert);
  return alert;
}
