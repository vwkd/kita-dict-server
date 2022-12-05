import { serve } from "https://deno.land/std@0.167.0/http/server.ts";

const DATA_URL = "https://api.github.com/repos/vwkd/kita-dict-data/contents/src/dict.txt";
const UNTIL_PAGE = Deno.env.get("UNTIL_PAGE") || "1/38";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

console.debug(`Loading dict until page ${UNTIL_PAGE}...`);

if (!UNTIL_PAGE.match(/^[123]\/[123456789]\d{0,2}$/)) {
  throw new Error(`Bad UNTIL_PAGE '${UNTIL_PAGE}'`);
}

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

// beware: trailing hyphen (if any) of last line not deleted
// when concatenated with continued first line on next page
const input = data
  .slice(0, data.indexOf(`## ${UNTIL_PAGE}`))
  .replace(/^##.*/gm, "")
  .replace(/^\n/gm, "")
  .replace(/\n♦︎ /g, "")
  .replace(/(?<=^|[\( ])(([123]\.sg)|([123]\.pl)|(a)|(A)|(ad\.dem\.)|(ad\.int\.)|(ad\.rel\.)|(ad)|(aor)|(attr)|(cd)|(cj\.pr\.)|(cj\.f\.)|(cj\.pt\.)|(cj)|(comp)|(D\/A)|(dekl)|(dim)|(E)|(enkl)|(fig)|(fut)|(f\/sg)|(f\/pl)|(f)|(G)|(3\.Gr\.)|(HV)|(I)|(imp)|(impf)|(inf)|(int)|(interrog\. Possessivpron\.)|(Indefinitpron\.)|(indefinites Possessivpron\.)|(m\/sg)|(m\/pl)|(m)|(N)|(n\/sg)|(n\/pl)|(n)|(opt\.pr)|(opt\.fut)|(opt)|(p\.a\.)|((perf\.))|(p\.f\.)|(p\.n\.)|(p\.p\.)|(pf)|(pl-pf)|(pl)|(pp)|(pp mit G)|(pr\.dem\.)|(pr\.int\.)|(pr\.pers\.)|(pr\.poss\.)|(pr\.rel)|(pr)|(prv)|(rel\. Possessivpron\.)|(S)|(sg)|(spn)|(sub)|(sup)|(V))(?=[ \),;]|$)/gm, "*$1*");

const entries = input.split(/\n(?!  )/);

function handleRequest(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  console.debug(`Handling request for query '${q}'`);

  // note: use case insensitive match
  const r1 = new RegExp(q, "i");

  // filter inhibiting symbols inside line
  const r2 = /[\|\*\(\)]|(\n  )/g;

  const indices = entries.map((str, i) => {
    const line = str.replace(r2, "");

    if (line.match(r1)) {
      return i;
    }
  });

  const matches = entries
    .filter((_, i) => indices.includes(i));

  console.debug(`Found ${matches.length} matches`);

  return Response.json(matches);
}

serve(handleRequest);
