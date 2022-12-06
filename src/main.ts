import { serve } from "std/http/server.ts";
import { entries, book, last_page } from "./import.ts";

function handleRequest(req) {
  console.debug("Handling request");

  const url = new URL(req.url);
  const path = url.pathname;

  if (path == "/status") {
    console.debug("Status");
    return Response.json({ book, last_page });
  } else if (path == "/results") {
    const q = url.searchParams.get("q");
    console.debug(`Query '${q}'`);

    if (!q) {
      return Response.json([]);
    }

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
  } else {
    console.debug(`Invalid path '${path}'`);
    return new Response("Invalid path.", { status: 404 });
  }
}

serve(handleRequest);
