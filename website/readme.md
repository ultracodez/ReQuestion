> The `testing` directory and the `testing.html` are for my internal use and will fail if you try to use them. If you are cloning this repo, delete those files, as well as the reference in `index.html` with the id of "`invisible-href-to-testing`."

I am aware that there are probably hundreds of improvements that could be made to this. Feel free to contribute.

Main ordering of files:

`/` - root
all `html`s, including `index`, as well as `serviceworker.js` and `package.json`

`src` - where most everything is

`src/Exceptions` - I use Exceptions to transfer fail and warnings from the processors back to the interface

`src/Modifiers` - This includes only `AllTrim.js`, which basically removes spaces from the front and back of a string, as well as repeated spaces. A better version of `String.trim().`

`src/Processors` - idk

`src/QuestionWord` - The 100% messy and unorganized as well as brute-forced
`QuestionWord` processor, which handles all QuestionWord questions and reorganizes them, then recursively testing all forms of the reorganized question, then all the tenses of the form, and finally all of the negations of that tense. It is very messy...

> Note, the QuestionWord processor also handles some edge cases of YesNo questions

`src/Tag` - This is the relatively simple Tag Processor, which handles tag Questions.

`src/YesNo` - In the middle of Tag and QuestionWord, this is relatively complicated uses the same `TenseTest()` and `Negate()` functions as QuestionWord.

`src/events.js` - basically it handles the UI, like initializing Quill, turning off debug messages if debug is off to improve speed. (Debug is REALLY slow) Handles all UI events like buttons and calls the Prosessor.

`src/index.js` - groups all the Processors and feedback Exceptions to give to `events.js`

`src/all.test.js` - I tried to use a testing library. I DID! (it didn't work, don't look at me like that)

`src/spellcheck.js` - A special spellchecker that also uses `alex.js` for the Analyzer side project.

`src/*.txt` - old messy versions of the new processors, very inaccurate and slow. These used compromise.js, the old version of it. they're just there `cause I wanted to keep them just in case I messed something up...

`the two .json files` - I tried to make routing on frontend parcel. It didn't work.

`img` - where I originally thought to put my images, you can delete it I honestly don't know what I was doing with it.