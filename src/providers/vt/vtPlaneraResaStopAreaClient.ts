import { log } from "../../log";
import {
  StopAreasApi,
  StopAreasGetRequest,
  VTApiPlaneraResaWebV4ModelsStopAreasStopAreaApiModel,
} from "./client";
import { Vt } from "./types";

type Config = {
  api: StopAreasApi;
};

type Result = { gid: string };

export class VtPlaneraResaStopAreaClient
  implements Vt.PlaneraResaApi.StopAreaClient
{
  private readonly cache = new Map<string, Result>();

  public constructor(private readonly conf: Config) {}

  private async lookupRemote(
    name: string
  ): Promise<VTApiPlaneraResaWebV4ModelsStopAreasStopAreaApiModel> {
    const results = await this.conf.api.stopAreasGet();
    log.trace("[vt stoparea] Response");

    const exactMatch = results.find((stopArea) => stopArea.name === name);
    if (exactMatch) {
      return exactMatch;
    }

    const matcher = (
      stopArea: VTApiPlaneraResaWebV4ModelsStopAreasStopAreaApiModel
    ) => stopArea.name?.startsWith(name);
    const matches = results.filter(matcher);
    if (matches.length === 0) {
      throw Error(`No site found for ${name}`);
    }
    if (matches.length > 1) {
      log.warn("Multiple sites found for", name, matches);
    }
    if (!matches[0].gid) {
      throw Error(`No gid found for ${name}`);
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
    const stopArea = await this.lookupRemote(name);
    const result = { gid: stopArea.gid! };
    this.cache.set(name, result);
    return result;
  }
}
