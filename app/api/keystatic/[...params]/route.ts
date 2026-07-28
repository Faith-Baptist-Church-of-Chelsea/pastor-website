// API route the Keystatic admin panel talks to for reading/writing
// the files under content/. Generated per Keystatic's Next.js docs.
import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "@/keystatic.config";

export const { POST, GET } = makeRouteHandler({ config });
