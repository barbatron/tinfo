import { log } from "./log";

type ConfigAccessor<T, TReq extends boolean> = (
  key: string,
  required: TReq
) => TReq extends true ? T : T | null;

export interface Config {
  getString: ConfigAccessor<string, boolean>;
  getNumber: ConfigAccessor<number, boolean>;
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const TIME_WINDOW_MINUTES: number = !!process.env.TIME_WINDOW_MINUTES
  ? Number(process.env.TIME_WINDOW_MINUTES)
  : 20;
const FETCH_INTERVAL_MS = !!process.env.FETCH_INTERVAL_MS
  ? Number(process.env.FETCH_INTERVAL_MS)
  : 15000;
const REFRESH_INTERVAL_MS = !!process.env.REFRESH_INTERVAL_MS
  ? Number(process.env.REFRESH_INTERVAL_MS)
  : 5000;

const WALK_TIME_SECONDS = Number(process.env.WALK_TIME_SECONDS || 300);
const RUSH_SECONDS_GAINED = Number(process.env.RUSH_SECONDS_GAINED || 90);

const STATION_NAME_REPLACEMENTS = new Map([
  ["Hässelby strand", "Hässelby str"],
]);

const DEST_FONT_SIZE = "45pt";
const DEST_NAME_OPACITY = "0.25";
const DEST_BLOCK_MARGIN_BOT = "2.5rem";

log.info(
  {
    PORT,
    TIME_WINDOW_MINUTES,
    FETCH_INTERVAL_MS,
    REFRESH_INTERVAL_MS,
    WALK_TIME_SECONDS,
    RUSH_SECONDS_GAINED,
  },
  "CONFIG"
);

const env = Bun.env;

export const fromEnv: Config = {
  getString: function <T extends boolean>(key: string, required?: T) {
    const isPresent = key in env && !!env[key];
    if (required && !isPresent) throw Error("Missing/empty config: " + key);
    const value = String(env[key]!);
    return value;
  },
  getNumber: function (key: string, required = true) {
    const isPresent = key in env && !!env[key];
    if (required && !isPresent) throw Error("Missing/empty config: " + key);
    const str = this.getString(key, required);
    return Number(str);
  },
};

export const getConfig = fromEnv.getString.bind(fromEnv);

if (getConfig("DEBUG", false)) console.log("DEBUG enabled");

type PROVIDER = "SL" | "VT";

export const SL_PAGE_INFO = {
  PROVIDER: "SL" as PROVIDER,
  STOP_NAME: "Hökis",
  preferredMot: "METRO",
};

export const VT_PAGE_INFO = {
  PROVIDER: "VT" as PROVIDER,
  STOP_NAME: "Marklandsgatan",
  preferredMot: "tram",
};

export const PAGE_INFO = SL_PAGE_INFO;

export {
  DEST_BLOCK_MARGIN_BOT,
  DEST_FONT_SIZE,
  DEST_NAME_OPACITY,
  FETCH_INTERVAL_MS,
  PORT,
  REFRESH_INTERVAL_MS,
  RUSH_SECONDS_GAINED,
  STATION_NAME_REPLACEMENTS,
  TIME_WINDOW_MINUTES,
  WALK_TIME_SECONDS,
};
