import { Elysia, type Context } from "elysia";

import getIndex from "./html-template.js";
import { log } from "./log.js";
import dayjs from "dayjs";

import "./init-dayjs.ts";

import { createSlRealtimeClient } from "./providers/sl/index.js";
import type { Departure, DepartureExt } from "./types.ts";

import * as conf from "./config.js";
const {
  PORT,
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
  STATION_NAME_REPLACEMENTS,
  DEST_NAME_OPACITY,
  DEST_BLOCK_MARGIN_BOT,
} = conf;

const config = conf.fromEnv;

const startTime = new Date();

const client = createSlRealtimeClient(config);

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

const updateDepartures = () =>
  fetchNextDeparture()
    .then((metros) => {
      lastDeparturesRaw = [...metros];
      fetchError = null;
      log.info(
        "Updated departures (#)",
        metros.map((m: any) => ({
          expectedTime: m.ExpectedDateTime,
          destination: m.Destination,
        }))
      );
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
      const expectedTime = departure.expectedTime;
      const hurryStr =
        departure.successProbPow < 1
          ? departure.successProb < 0
            ? "😵"
            : "😱"
          : "✨";
      const timeLeft = dayjs(expectedTime).fromNow(true); // .diff(new Date(), "minutes");

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
const checkVersionMiddleware = ({ request, set }) => {
  const clientsServerVersion = request.headers["x-server-version"];
  if (!clientsServerVersion) {
    console.log("No x-server-version in client request - welcome!");
    return;
  }

  const serverVersion = getServerVersion();
  if (serverVersion !== clientsServerVersion) {
    console.log("Client vs Server version mismatch - redirecting", {
      clientsServerVersion,
      serverVersion,
    });

    set.redirect("/");
    set.status(302).send();
  }
};

function sendContent({ set, body }: Context, content: string) {
  set.headers["Content-Type"] = "text/html";
  set.headers["x-server-version"] = getServerVersion();
  if (fetchError) {
    set.status = 500;
    return fetchError.message;
  }
  set.headers["Content-Type"] = "text/html";
  body = content;
  return content;
}

const app = new Elysia();

app.get("/content", (context) => {
  log.info("GET /content", context.request.headers.get("user-agent"));
  return sendContent(context, render());
});

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (context) => {
  log.info("GET /", context.request.headers.get("user-agent"));
  return sendContent(context, getIndex(render()));
});

app.listen(PORT);
log.info("Listening on " + String(PORT));

process.on("SIGINT", function () {
  log.info("Caught interrupt signal");
  process.exit();
});
