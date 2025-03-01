import { Elysia } from "elysia";
import getIndex from "./html-template";
import { log } from "./log";

import dayjs from "dayjs";

import "./init-dayjs.ts";

import {
  DEST_BLOCK_MARGIN_BOT,
  DEST_NAME_OPACITY,
  FETCH_INTERVAL_MS,
  PAGE_INFO,
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
import { createVtClient } from "./providers/vt";
import { DepartureClient } from "./providers/types";

const config = conf.fromEnv;

const startTime = new Date();

type Provider = "SL" | "VT";
const providers: Record<
  Provider,
  { client: DepartureClient; direction: string }
> = {
  SL: {
    client: createSlTransportApiClient(config),
    direction: config.getString("SL_JOURNEY_DIRECTION", false) ?? "1",
  },
  VT: {
    client: createVtClient(config),
    direction: "-",
  },
};

const chosenProvider: Provider = "SL";

function forProvider<T>(fn: (client: DepartureClient) => T): T {
  const p = providers[chosenProvider];
  return fn(p.client);
}

function mainDirection(): string {
  return providers[chosenProvider].direction;
}
console.log("mainDirection", mainDirection());

/////////////////////////////

let timeOffsetSeconds = 0;

let lastDeparturesRaw: any[] = [];
let fetchError: Error | null = null;

const clampTime = (time: Date) => {
  const now = new Date();
  if (time < now) return now;
  return time.toISOString();
};

/////////////////////////////

async function fetchNextDeparture() {
  return await forProvider((client) => client.fetch());
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
      if (Math.abs(diffSeconds) > Math.abs(timeOffsetSeconds)) {
        timeOffsetSeconds = diffSeconds;
      }
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
    const key = dep.direction ?? providers[chosenProvider].direction;
    if (map.has(key)) map.get(key)!.push(dep);
    else map.set(key, [dep]);
    return map;
  }, new Map<string, DepartureExt[]>());

  log.debug("[render] departuresByDirection", departuresByDirection);

  const renderDirection = (departures: DepartureExt[]) => {
    if (!departures.length) {
      return [`(none for  ${TIME_WINDOW_MINUTES} minutes)`];
    }
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

      let timeLeft = "";
      if (departure.displayTime) timeLeft = departure.displayTime;
      else {
        const timeLeftMinutes = dayjs(expectedTime).diff(new Date(), "minutes");
        timeLeft = timeLeftMinutes < 1 ? "<1 min" : `${timeLeftMinutes} min`;
      }

      const destStr =
        STATION_NAME_REPLACEMENTS.get(departure.destination) ??
        departure.destination;
      return `${hurryStr} ${timeLeft} <span style="opacity: ${DEST_NAME_OPACITY}">${destStr}</span>`;
    });
    return lines;
  };

  const mainDirectionDepartures = departuresByDirection.get(mainDirection());
  log.info("mainDirectionDepartures", mainDirectionDepartures);

  const topLevelLines = renderDirection(mainDirectionDepartures ?? []);

  const otherDirectionKeys = Array.from(departuresByDirection.keys()).filter(
    (k) => k !== mainDirection()
  );
  const otherDirections = otherDirectionKeys.flatMap((k) =>
    renderDirection(departuresByDirection.get(k) ?? [])
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

if (FETCH_INTERVAL_MS && typeof FETCH_INTERVAL_MS === "number") {
  setInterval(doUpdate, FETCH_INTERVAL_MS);
}

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
  .listen(conf.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
