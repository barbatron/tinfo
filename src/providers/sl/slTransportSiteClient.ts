import { log } from "../../log";
import { Sl } from "./types";

const API_URL = "https://transport.integration.sl.se/v1/sites?expand=false";

type Config = {
  apiUrl: string;
};

const defaultConfig: Config = {
  apiUrl: API_URL,
};
type Result = { id: string };

export class SlTransportSiteClient {
  private readonly lookupCache = new Map<string, Result>();
  private readonly conf: Config;

  public constructor(
    conf?: Partial<{
      apiUrl: string;
    }>
  ) {
    this.conf = { ...defaultConfig, ...conf };
  }

  private async lookupRemote(name: string): Promise<Sl.TransportApi.Site> {
    const response = await fetch(this.conf.apiUrl);

    if (!response.ok)
      throw Error(
        "[sl site] Request failed: " +
          response.statusText +
          "\n" +
          JSON.stringify(
            { url: response.url, responseHeaders: response.headers },
            null,
            2
          )
      );

    const data = (await response.json()) as Sl.TransportApi.SitesResponse;

    const exactMatch = data.find((site) => site.name === name);
    if (exactMatch) {
      return exactMatch;
    }

    const siteMatcher = (site: Sl.TransportApi.Site) =>
      site.name.startsWith(name);
    const matchingSites = data.filter(siteMatcher);
    if (matchingSites.length === 0) {
      throw Error(`No site found for ${name}`);
    }
    if (matchingSites.length > 1) {
      log.warn("Multiple sites found for", name, matchingSites);
    }

    return matchingSites[0];
  }

  public async lookup(name: string): Promise<Result> {
    if (Number.isInteger(Number(name))) {
      return { id: name };
    }
    if (this.lookupCache.has(name)) {
      log.debug("[sl site] Cache hit", name);
      return this.lookupCache.get(name)!;
    }
    log.debug("[sl site] Cache miss", name);
    const remoteResult = await this.lookupRemote(name);
    const result = { id: String(remoteResult.id) };
    this.lookupCache.set(name, result);
    return result;
  }
}
