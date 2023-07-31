const express = require("express");

const index = require("./html-template");
const { log } = require("./log");

require("./dayjs");
const dayjs = require("dayjs");

const {
  REALTIME_API_KEY,
  SITE_ID,
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
  JOURNEY_DIRECTION,
  STATION_NAME_REPLACEMENTS,
  DEST_NAME_OPACITY,
  DEST_BLOCK_MARGIN_BOT,
} = require("./config");

const app = express();

async function fetchNextDeparture() {
  const url = new URL("https://api.sl.se/api2/realtimedeparturesV4.json");
  url.searchParams.set("key", REALTIME_API_KEY);
  url.searchParams.set("siteid", SITE_ID);
  url.searchParams.set("timewindow", TIME_WINDOW_MINUTES);
  url.searchParams.set("Bus", "false");

  const response = await fetch(url);
  if (!response.ok) throw Error("Request failed");

  const data = await response.json();
  if (data.Message) throw Error(data.Message);
  // log("fetch respponse", data);
  return data.ResponseData.Metros;
}

const decorateDepartures = (departures = []) =>
  Array.from(departures ?? [])
    .map((d) => ({
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

let metrosCache = {};
let fetchError = null;

const updateDepartures = () =>
  fetchNextDeparture()
    .then((metros) => {
      // log("all metros", metros);
      metrosCache = [...metros];
      fetchError = undefined;
      log("Updated departures (#)", metros.length);
    })
    .catch((err) => {
      fetchError = err;
      log("error", "updateDepartures failed", err);
    });

const render = () => {
  if (fetchError) throw Error(fetchError.message);
  const decoratedDepartures = decorateDepartures(metrosCache);
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
  }, new Map());

  const renderDirection = (departures) => {
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
      const timeMinutes = dayjs(expectedTime).fromNow(true);
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
        .filter(([k]) => k !== String(JOURNEY_DIRECTION))
        .flatMap(([, v]) => v) ?? []
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

setInterval(() => updateDepartures().catch(console.error), FETCH_INTERVAL_MS);
void updateDepartures().catch(console.error);

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (req, res) => {
  log("GET /", req.headers["user-agent"]);
  res.setHeader("Content-Type", "text/html; charset=utf-8").send(index);
});

app.get("/content", (req, res) => {
  log("GET /content", req.headers["user-agent"]);
  res.setHeader("Content-Type", "text/html");
  if (fetchError) {
    res.send(fetchError.message).status(500).end();
    return;
  }
  res.setHeader("Content-Type", "text/html").send(render());
});

log("Testing settings/api access...");

const port = process.env.PORT || 8000;
app.listen(port);
log("Listening on ", port);
