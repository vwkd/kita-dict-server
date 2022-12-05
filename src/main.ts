import { serve } from "https://deno.land/std@0.167.0/http/server.ts";

// beware: uses whole page if not provided or in wrong format!
const until_page = Deno.env.get("UNTIL_PAGE");

console.debug(`Loading dict until page ${until_page}...`);

const data = await Deno.readTextFile("dict.md");

// beware: trailing hyphen (if any) of last line not deleted
// when concatenated with continued first line on next page
const input = data
  .slice(0, data.indexOf(`## ${until_page}`))
  .replace(/^##.*/gm, "")
  .replace(/^\n/gm, "")
  .replace(/\n♦︎/g, "");

const entries = input.split(/\n(?!  )/);

function handleRequest(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  console.debug(`Handling request for query '${q}'`);

  // note: use case insensitive match
  const r1 = new RegExp(`.*${q}.*`, "i");

  // filter any symbols inside words for search to work at least somewhat okay
  const r2 = /[\-\|\*\(\)]/g;

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
