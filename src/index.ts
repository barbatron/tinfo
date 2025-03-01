import { Elysia } from "elysia";
import getIndex from "./html-template";
import { log } from "./log";

import dayjs from "dayjs";

import "./init-dayjs.ts";

import {
  DEST_BLOCK_MARGIN_BOT,
  DEST_NAME_OPACITY,
  FETCH_INTERVAL_MS,
  RUSH_SECONDS_GAINED,
  // Esthetic
  STATION_NAME_REPLACEMENTS,
  // General API
  TIME_WINDOW_MINUTES,
  // Emoji calcs
  WALK_TIME_SECONDS,
} from "./config";
import { createSlTransportApiClient } from "./providers/sl";
import { Departure, DepartureExt } from "./types";

import * as conf from "./config";

const config = conf.fromEnv;

const startTime = new Date();

const client = createSlTransportApiClient(config);

let timeOffsetSeconds = 0;

async function fetchNextDeparture() {
  return await client.fetch();
}

const decorateDepartures = (departures: Departure[] = []): DepartureExt[] =>
  Array.from(departures ?? []).map(decorateDeparture);

const decorateDeparture = (d: Departure): DepartureExt => {
  const d1 = {
    ...d,
    expectedInSeconds: dayjs(d.expectedTime).diff(new Date(), "seconds"),
    scheduleDriftSeconds: dayjs(d.expectedTime).diff(
      d.scheduledTime,
      "seconds"
    ),
  };
  const d2 = {
    ...d1,
    secondsToSpare: d1.expectedInSeconds - WALK_TIME_SECONDS,
    successProb: d1.expectedInSeconds / WALK_TIME_SECONDS,
  };
  const d3 = {
    ...d2,
    successProbPow: Math.pow(d2.successProb, 2),
    canMakeIt: d2.secondsToSpare >= -RUSH_SECONDS_GAINED,
  };
  return d3;
};

let lastDeparturesRaw: any[] = [];
let fetchError: Error | null = null;

const clampTime = (time: Date) => {
  const now = new Date();
  if (time < now) return now;
  return time.toISOString();
};

const updateDepartures = () =>
  fetchNextDeparture()
    .then((metros) => {
      lastDeparturesRaw = [...metros];
      fetchError = null;
      log.info(
        "Updated departures (#)",
        new Date().toISOString(),
        metros.length
      );
      log.debug(
        metros.map((m: Departure) => ({
          destination: m.destination,
          scheduledTime: m.scheduledTime,
          expectedTime: m.expectedTime,
          displayTime: m.displayTime,
        }))
      );
      const minExpectedTimeInThePast = metros.reduce((min, m) => {
        const expectedTime = dayjs(m.expectedTime);
        return expectedTime.isBefore(min) ? expectedTime : min;
      }, dayjs());
      const diffSeconds = minExpectedTimeInThePast.diff(dayjs(), "seconds");
      if (Math.abs(diffSeconds) > Math.abs(timeOffsetSeconds))
        timeOffsetSeconds = diffSeconds;
      log.debug("minExpectedTimeInThePast", {
        diffSeconds,
        timeOffsetSeconds,
      });
    })
    .catch((err) => {
      fetchError = err;
      log.error("updateDepartures failed", err);
    });

const render = () => {
  if (fetchError) throw Error(fetchError.message);
  const decoratedDepartures = decorateDepartures(lastDeparturesRaw);
  const departuresByDirection = decoratedDepartures.reduce((map, dep) => {
    const key = String(dep.direction) ?? "-";
    if (map.has(key)) map.get(key)!.push(dep);
    else map.set(key, [dep]);
    return map;
  }, new Map<string, DepartureExt[]>());

  const renderDirection = (departures: DepartureExt[]) => {
    if (!departures.length)
      return [`(none for  ${TIME_WINDOW_MINUTES} minutes)`];
    const realisticDepartures = departures; //.filter((d) => d.canMakeIt);

    // format line strings
    const lines = realisticDepartures.map((departure) => {
      const expectedTime = clampTime(departure.expectedTime);
      const hurryStr =
        departure.successProbPow < 1
          ? departure.successProb < 0
            ? "😵"
            : "😱"
          : "✨";

      const timeLeft =
        departure.displayTime ??
        dayjs(expectedTime).diff(new Date(), "minutes");

      const destStr =
        STATION_NAME_REPLACEMENTS.get(departure.destination) ??
        departure.destination;
      return `${hurryStr} ${timeLeft} <span style="opacity: ${DEST_NAME_OPACITY}">${destStr}</span>`;
    });
    return lines;
  };

  const JOURNEY_DIRECTION = "1";
  const topLevelLines = Array.from(
    renderDirection(departuresByDirection.get(JOURNEY_DIRECTION) ?? []) ?? []
  );

  const otherDirections = Array.from(
    renderDirection(
      Array.from(departuresByDirection.entries())
        // @ts-ignore
        .filter(([k]: [any]) => k !== String(JOURNEY_DIRECTION))
        // @ts-ignore
        .flatMap(([, v]: [any, any]) => v) ?? []
    ) ?? []
  );
  const topLevelLinesHtml =
    `<div style="display: block; margin-bottom: ${DEST_BLOCK_MARGIN_BOT}; white-space: nowrap">` +
    topLevelLines.join(`<br/>`) +
    "</div>";
  const otherDirectionsHtml = Array.from(departuresByDirection.entries())
    ? '<div style="display: block; margin-bottom: 3rem; opacity: 0.3">' +
      otherDirections.join(`<br/>`) +
      "</div>"
    : "";
  return topLevelLinesHtml + "\n" + otherDirectionsHtml;
};

const doUpdate = () => {
  void updateDepartures().catch((err) =>
    log.error({ err }, "updateDepartures failed")
  );
};

if (FETCH_INTERVAL_MS && typeof FETCH_INTERVAL_MS === "number")
  setInterval(doUpdate, FETCH_INTERVAL_MS);

doUpdate();

const getServerVersion = () => startTime.valueOf().toString();

// @ts-ignore
const checkVersionMiddleware = (req, res, next) => {
  const clientsServerVersion = req.headers["x-server-version"];
  if (!clientsServerVersion) {
    console.log("No x-server-version in client request - welcome!");
    next();
    return;
  }

  const serverVersion = getServerVersion();
  if (serverVersion !== clientsServerVersion) {
    console.log("Client vs Server version mismatch - redirecting", {
      clientsServerVersion,
      serverVersion,
    });

    res.set("location", "/");
    res.status(302).send();
    return;
  }
  next();
};

const app = new Elysia()
  .get("/", ({ set, headers }) => {
    log.info("GET /", headers["user-agent"]);
    if (fetchError) {
      throw fetchError;
    }
    set.headers["content-type"] = "text/html";
    return getIndex(render());
  })
  .get("/content", ({ headers, set }) => {
    log.info("GET /content", headers["user-agent"]);
    set.headers["content-type"] = "text/html";
    return render();
  })
  .listen(8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
