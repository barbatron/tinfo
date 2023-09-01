import { log } from "./log.ts";
import { config } from "dotenv";
config();

// Config
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const REALTIME_API_KEY = process.env.SL_REALTIME_API_KEY!;
const SITE_ID = process.env.SL_SITE_ID!;
const JOURNEY_DIRECTION = process.env.SL_JOURNEY_DIRECTION;
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
    REALTIME_API_KEY,
    JOURNEY_DIRECTION,
    TIME_WINDOW_MINUTES,
    FETCH_INTERVAL_MS,
    REFRESH_INTERVAL_MS,
    WALK_TIME_SECONDS,
    RUSH_SECONDS_GAINED,
  },
  "CONFIG"
);

export {
  PORT,
  REALTIME_API_KEY,
  SITE_ID,
  JOURNEY_DIRECTION,
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  REFRESH_INTERVAL_MS,
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
  STATION_NAME_REPLACEMENTS,
  DEST_FONT_SIZE,
  DEST_NAME_OPACITY,
  DEST_BLOCK_MARGIN_BOT,
};
