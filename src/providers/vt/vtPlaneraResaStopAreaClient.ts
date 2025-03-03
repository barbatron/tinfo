import { log } from "../../log";
import { Vt } from "./types";

type Config = {
  apiUrl: string;
};

const defaultConfig: Config = {
  apiUrl:
    "https://ext-api.vasttrafik.se/pr/v4/locations/by-text?q={name}&types=stoparea&limit=10&offset=0&bodSearch=false",
};

type Result = { gid: string };

export class VtPlaneraResaStopAreaClient
  implements Vt.PlaneraResaApi.StopAreaClient
{
  private readonly conf: { apiUrl: string };
  private readonly cache = new Map<string, Vt.PlaneraResaApi.Location>();

  public constructor(conf?: Partial<Config>) {
    this.conf = { ...defaultConfig, ...conf };
  }

  private async lookupRemote(
    name: string
  ): Promise<Vt.PlaneraResaApi.Location> {
    const response = await fetch(this.conf.apiUrl.replace("{name}", name));
    if (!response.ok)
      throw Error(
        "Request failed: " +
          response.statusText +
          "\n" +
          JSON.stringify(
            { url: response.url, responseHeaders: response.headers },
            null,
            2
          )
      );
    const data = (await response.json()) as Vt.PlaneraResaApi.LocationResponse;
    log.trace("[vt stoparea] Response", data);

    const { results } = data;

    const exactMatch = results.find((location) => location.name === name);
    if (exactMatch) {
      return exactMatch;
    }

    const matcher = (location: Vt.PlaneraResaApi.Location) =>
      location.name.startsWith(name);
    const matches = results.filter(matcher);
    if (matches.length === 0) {
      throw Error(`No site found for ${name}`);
    }
    if (matches.length > 1) {
      log.warn("Multiple sites found for", name, matches);
    }

    return matches[0];
  }

  public async lookup(name: string): Promise<Result> {
    if (Number.isInteger(Number(name))) {
      log.debug("[vt stoparea] Numeric stop id", name);
      return { gid: name };
    }

    if (this.cache.has(name)) {
      log.debug("[vt stoparea] Cache hit", name);
      return this.cache.get(name)!;
    }

    log.debug("[vt stoparea] Cache miss", name);
    const location = await this.lookupRemote(name);
    this.cache.set(name, location);
    return { gid: location.gid };
  }
}
