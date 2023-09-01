import express from "express";
import { URL } from "url";

import getIndex from "./html-template.js";
import { log } from "./log.ts";

// import "./dayjs.ts";
import dayjs from "dayjs";

import {
  // SL stuff
  REALTIME_API_KEY,
  SITE_ID,
  JOURNEY_DIRECTION,
  // General API
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  // Emoji calcs
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
  // Esthetic
  STATION_NAME_REPLACEMENTS,
  DEST_NAME_OPACITY,
  DEST_BLOCK_MARGIN_BOT,
  PORT,
} from "./config.ts";
import fetch from "node-fetch";

const app = express();
const startTime = new Date();

const required = [REALTIME_API_KEY, SITE_ID, TIME_WINDOW_MINUTES];
if (required.some((r) => !r)) throw Error("Required config missing");

async function fetchNextDeparture() {
  const url = new URL("https://api.sl.se/api2/realtimedeparturesV4.json");
  url.searchParams.set("Key", REALTIME_API_KEY);
  url.searchParams.set("SiteId", SITE_ID);
  url.searchParams.set("TimeWindow", String(TIME_WINDOW_MINUTES));
  // url.searchParams.set("Bus", "false");

  // @ts-ignore
  const response = await fetch<any>(url);
  if (!response.ok) throw Error("Request failed");

  const data = (await response.json()) as any;
  log.info(data, "fetch respponse", data);
  if (data.Message) throw Error(data.Message);

  return data.ResponseData.Metros;
}

const decorateDepartures = (departures: object[] = []) =>
  Array.from(departures ?? [])
    .map((d: any) => ({
      ...d,
      expectedInSeconds: dayjs(d.ExpectedDateTime).diff(new Date(), "seconds"),
      scheduleDriftSeconds: dayjs(d.ExpectedDateTime).diff(
        d.TimeTabledDateTime,
        "seconds"
      ),
    }))
    .map((d) => ({
      ...d,
      secondsToSpare: d.expectedInSeconds - WALK_TIME_SECONDS,
      successProb: d.expectedInSeconds / WALK_TIME_SECONDS,
    }))
    .map((d) => ({
      ...d,
      successProbPow: Math.pow(d.successProb, 2),
      canMakeIt: d.secondsToSpare >= -RUSH_SECONDS_GAINED,
    }));

let lastDeparturesRaw: any[] = [];
let fetchError: Error | null = null;

const updateDepartures = () =>
  fetchNextDeparture()
    .then((metros) => {
      // log("all metros", metros);
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
    const key = String(dep.JourneyDirection);
    map.set(
      key,
      // concat into existing array
      map.has(key)
        ? [...map.get(key), dep]
        : // otherwise new array with dep as 1st
          [dep]
    );
    return map;
  }, new Map<string, object>());

  const renderDirection = (departures: any[]) => {
    // log(`renderDict`, { departures });
    if (!departures.length)
      return [`(none for  ${TIME_WINDOW_MINUTES} minutes)`];
    const realisticDepartures = departures; //.filter((d) => d.canMakeIt);

    // format line strings
    const lines = realisticDepartures.map((departure) => {
      const expectedTime = departure.ExpectedDateTime;
      const hurryStr =
        departure.successProbPow < 1
          ? departure.successProb < 0
            ? "😵"
            : "😱"
          : "✨";
      const timeMinutes = dayjs(expectedTime).diff(new Date(), "minutes");
      const destStr =
        STATION_NAME_REPLACEMENTS.get(departure.Destination) ??
        departure.Destination;
      return `${hurryStr} ${timeMinutes} <span style="opacity: ${DEST_NAME_OPACITY}">${destStr}</span>`;
    });
    return lines;
  };

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
  const otherDirectionsHtml = departuresByDirection.entries().length
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

function sendContent(res: express.Response, content: string) {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("x-server-version", getServerVersion());
  if (fetchError) {
    res.send(fetchError.message).status(500).end();
    return;
  }
  res.setHeader("Content-Type", "text/html").send(content);
}

app.get(
  "/content",
  checkVersionMiddleware,
  (req: express.Request, res: express.Response) => {
    log.info("GET /content", req.headers["user-agent"]);
    sendContent(res, render());
  }
);

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (req: express.Request, res: express.Response) => {
  log.info("GET /", req.headers["user-agent"]);
  sendContent(res, getIndex(render()));
});

app.listen(PORT);
log.info("Listening on " + String(PORT));

process.on("SIGINT", function () {
  log.info("Caught interrupt signal");
  process.exit();
});
