import { PAGES } from "./constants.ts";

const UNTIL_PAGE = Deno.env.get("UNTIL_PAGE");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

const CONTENTS_URL = "https://api.github.com/repos/vwkd/kita-dict-data/contents/";
const DICT_URL = "src/dict.txt";
const ABBREVIATIONS_URL = "src/abbreviations.txt";
const SYMBOLS_URL = "src/symbols.txt";

console.debug(`Loading dict until page ${UNTIL_PAGE}...`);

// page number in header e.g. `1/71`
const PAGE_NUMBER = /^([123])\/([123456789]\d{0,2})$/;

if (!UNTIL_PAGE || !UNTIL_PAGE.match(PAGE_NUMBER)) {
  throw new Error(`Bad UNTIL_PAGE '${UNTIL_PAGE}'`);
}

export const pages = PAGES.indexOf(UNTIL_PAGE) - 1;
export const pagesTotal = PAGES.length;
export const progress = (pages / pagesTotal * 100).toFixed(2);

const [dictRaw, abbreviationsRaw, symbolsRaw] = await Promise.all([
  fetchData(CONTENTS_URL + DICT_URL),
  fetchData(CONTENTS_URL + ABBREVIATIONS_URL),
  fetchData(CONTENTS_URL + SYMBOLS_URL),
]);

// two-or-more-space separated key-value, e.g. `abc   def`
const SSV_REGEX = /(^.+)(?<!\s)\s{2,}(.+$)/;

export const abbreviations = abbreviationsRaw
  .split("\n")
  .map(l => l.match(SSV_REGEX).slice(1));

export const symbols = symbolsRaw
  .split("\n")
  .map(l => l.match(SSV_REGEX).slice(1));

const HEADER_LINES = /^##.*/gm;
const EMPTY_LINES = /(^\n)/gm;
const CONTINUED_LINES = /\n♦︎/g;
const ENTRY_SEPARATOR = /\n(?!  )/;

const CURSIVE = /(?<=^\*).+(?=\*$)/;
// note: reverse such that longer are first, e.g. `prv` before `pr`
const cursive_abbreviations = abbreviations
  .map(([key, _]) => key.match(CURSIVE)?.[0])
  .filter(k => k)
  .toReversed();

// make cursive if surrounded by space, parentheses, or followed by semicolon, comma
// todo: needs `^`? is ever at beginning of line?
const CURSIVE_ABBREVIATIONS = new RegExp(`(?<=^|[\( ])((${cursive_abbreviations.map(c => escapeRegex(c)).join(")|(")}))(?=[ \),;]|$)`, "gm");

// make connection words `mit`, `od.` also cursive, e.g. `pp mit G`
const PATCH1 = /\* ((mit)|(od\.)) \*/g;

// make `sg` and `pl` numbers also cursive, e.g. `1.pl`
const PATCH2 = /([123]\.)\*(sg|pl)/g;

// todo: make missing cursive, e.g. `Indefinitpron.`, etc.

/*
- cut off after header on UNTIL_PAGE
- remove header lines
- remove empty lines
- join continued lines
- tag cursive abbreviations
- tag cursive abbreviations left over
- split entries (but not verbs)
*/
export const dict = dictRaw
  .slice(0, dictRaw.indexOf(UNTIL_PAGE))
  .replace(HEADER_LINES, "")
  .replace(EMPTY_LINES, "")
  .replace(CONTINUED_LINES, "")
  .replace(CURSIVE_ABBREVIATIONS, "*$1*")
  .replace(PATCH1, " $1 ")
  .replace(PATCH2, "*$1$2")
  .split(ENTRY_SEPARATOR);

function escapeRegex(str) {
  return str.replace(/[\/.()]/g, '\\$&');
}

async function fetchData(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.raw",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    }
  });

  const data = await res.text();

  if (data.startsWith("{") && data.endsWith("}")) {
    const error = JSON.parse(data);
    throw new Error(error.message);
  }

  return data;
}