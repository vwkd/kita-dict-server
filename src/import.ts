import { CURSIVES, PAGES } from "./constants.ts";

const DATA_URL = "https://api.github.com/repos/vwkd/kita-dict-data/contents/src/dict.txt";
const UNTIL_PAGE = Deno.env.get("UNTIL_PAGE");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

console.debug(`Loading dict until page ${UNTIL_PAGE}...`);

const matches = UNTIL_PAGE && UNTIL_PAGE.match(/^([123])\/([123456789]\d{0,2})$/);

if (!matches) {
  throw new Error(`Bad UNTIL_PAGE '${UNTIL_PAGE}'`);
}

export const pages = PAGES.indexOf(UNTIL_PAGE) - 1;
export const pagesTotal = PAGES.length;
export const progress = (pages / pagesTotal * 100).toFixed(2);

const res = await fetch(DATA_URL, {
  headers: {
    Accept: "application/vnd.github.raw",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  }
})

const data = await res.text();

if (data.startsWith("{")) {
  const error = JSON.parse(data);
  throw new Error(error.message);
}

const input = data
  .slice(0, data.indexOf(UNTIL_PAGE))
  .replace(/^##.*/gm, "")
  .replace(/^\n/gm, "")
  .replace(/\n♦︎/g, "")
  .replace(new RegExp(`(?<=^|[\( ])((${CURSIVES.map(c => escapeRegex(c)).join(")|(")}))(?=[ \),;]|$)`, "gm"), "*$1*");

export const entries = input.split(/\n(?!  )/);

function escapeRegex(str) {
  return str.replace(/[\/.()]/g, '\\$&');
}