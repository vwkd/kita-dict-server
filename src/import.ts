import { CURSIVES, PAGES } from "./constants.ts";

const UNTIL_PAGE = Deno.env.get("UNTIL_PAGE");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

const CONTENTS_URL = "https://api.github.com/repos/vwkd/kita-dict-data/contents/";
const DICT_URL = "src/dict.txt";
const ABBREVIATIONS_URL = "src/abbreviations.txt";
const SYMBOLS_URL = "src/symbols.txt";

// two-or-more space separated key-value, e.g. `abc   def`
const SSV_REGEX = /(^.+)(?<!\s)\s{2,}(.+$)/;
const CURSIVE_REGEX = new RegExp(`(?<=^|[\( ])((${CURSIVES.map(c => escapeRegex(c)).join(")|(")}))(?=[ \),;]|$)`, "gm");

console.debug(`Loading dict until page ${UNTIL_PAGE}...`);

const matches = UNTIL_PAGE && UNTIL_PAGE.match(/^([123])\/([123456789]\d{0,2})$/);

if (!matches) {
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

export const abbreviations = abbreviationsRaw
  .split("\n")
  .map(l => l.match(SSV_REGEX).slice(1));

export const symbols = symbolsRaw
  .split("\n")
  .map(l => l.match(SSV_REGEX).slice(1));

export const dict = dictRaw
  .slice(0, dictRaw.indexOf(UNTIL_PAGE))
  .replace(/^##.*/gm, "")
  .replace(/^\n/gm, "")
  .replace(/\n♦︎/g, "")
  .replace(CURSIVE_REGEX, "*$1*")
  .split(/\n(?!  )/);

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