// Fetch a source's terms page and keep it beside its raw responses, so the licence and attribution
// copied into the manifest can be checked against the page as it was on the day.
import { writeBytes } from './files';
import type { Http } from './http';

export const keepTermsPage = async (http: Http, rawDir: string, name: string, url: string): Promise<string> => {
  const path = `${rawDir}/terms/${name}`;
  await writeBytes(path, await http.get(url));
  return path;
};
