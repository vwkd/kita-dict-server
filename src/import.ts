import { PAGES } from "./constants.ts";

const DATA_URL = "https://api.github.com/repos/vwkd/kita-dict-data/contents/src/dict.txt";
const LAST_PAGE = Deno.env.get("LAST_PAGE");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

console.debug(`Loading dict until last page ${LAST_PAGE}...`);

const matches = UNTIL_PAGE && LAST_PAGE.match(/^([123])\/([123456789]\d{0,2})$/);

if (!matches) {
  throw new Error(`Bad LAST_PAGE '${LAST_PAGE}'`);
}

export const pages = PAGES.indexOf(LAST_PAGE);
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
  .slice(0, data.indexOf(PAGES[PAGES.indexOf(LAST_PAGE) + 1]))
  .replace(/^##.*/gm, "")
  .replace(/^\n/gm, "")
  .replace(/\n♦︎/g, "")
  .replace(/(?<=^|[\( ])(([123]\.sg)|([123]\.pl)|(a)|(A)|(ad\.dem\.)|(ad\.int\.)|(ad\.rel\.)|(ad)|(aor)|(attr)|(cd)|(cj\.pr\.)|(cj\.f\.)|(cj\.pt\.)|(cj)|(comp)|(D\/A)|(dekl)|(dim)|(E)|(enkl)|(fig)|(fut)|(f\/sg)|(f\/pl)|(f)|(G)|(3\.Gr\.)|(HV)|(I)|(imp)|(impf)|(inf)|(int)|(interrog\. Possessivpron\.)|(Indefinitpron\.)|(indefinites Possessivpron\.)|(m\/sg)|(m\/pl)|(m)|(N)|(n\/sg)|(n\/pl)|(n)|(opt\.pr)|(opt\.fut)|(opt)|(p\.a\.)|((perf\.))|(p\.f\.)|(p\.n\.)|(p\.p\.)|(pf)|(pl-pf)|(pl)|(pp)|(pp mit G)|(pr\.dem\.)|(pr\.int\.)|(pr\.pers\.)|(pr\.poss\.)|(pr\.rel)|(pr)|(prv)|(rel\. Possessivpron\.)|(S)|(sg)|(spn)|(sub)|(sup)|(V))(?=[ \),;]|$)/gm, "*$1*");

export const entries = input.split(/\n(?!  )/);