import { log } from "../../log";
import { StopLookupError } from "../../utils/StopLookupError";
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
    }>,
  ) {
    this.conf = { ...defaultConfig, ...conf };
  }

  private async lookupRemote(name: string): Promise<Sl.TransportApi.Site> {
    const response = await fetch(this.conf.apiUrl);

    if (!response.ok) {
      throw Error(
        "[sl site] Request failed: " +
          response.statusText +
          "\n" +
          JSON.stringify(
            { url: response.url, responseHeaders: response.headers },
            null,
            2,
          ),
      );
    }

    const data = (await response.json()) as Sl.TransportApi.SitesResponse;
    const nameLower = name.toLowerCase();
    const exactMatch = data.find(
      (site) => site.name.toLowerCase() === nameLower,
    );
    if (exactMatch) {
      return exactMatch;
    }

    const siteMatcher = (site: Sl.TransportApi.Site) =>
      site.name.toLowerCase().startsWith(nameLower);
    const matchingSites = data.filter(siteMatcher);
    if (matchingSites.length === 0) {
      throw new StopLookupError(`No site found for ${name}`);
    }
    if (matchingSites.length > 1) {
      throw new StopLookupError(
        `Multiple sites found for ${name}`,
        matchingSites.map((s) => ({ id: String(s.id), name: s.name })),
      );
    }

    return matchingSites[0];
  }

  public async lookup(name: string): Promise<Result> {
    if (Number.isInteger(Number(name))) {
      log.trace("[sl site] Numeric site id", name);
      return { id: name };
    }
    const nameLower = name.toLowerCase();
    if (this.lookupCache.has(nameLower)) {
      log.debug("[sl site] Cache hit", nameLower);
      return this.lookupCache.get(nameLower)!;
    }
    log.debug("[sl site] Cache miss", nameLower);
    const remoteResult = await this.lookupRemote(name);
    const result = { id: String(remoteResult.id) };
    this.lookupCache.set(nameLower, result);
    return result;
  }
}
