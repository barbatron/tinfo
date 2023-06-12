require("dotenv").config();

const dayjs = require("dayjs");
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
var updateLocale = require("dayjs/plugin/updateLocale");
dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds",
    m: "a minute",
    mm: "%d min",
    h: "an h",
    hh: "%d hrs",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
});
const REALTIME_API_KEY = process.env.SL_REALTIME_API_KEY;
const SITE_ID = process.env.SL_SITE_ID;
const JOURNEY_DIRECTION = Number(process.env.SL_JOURNEY_DIRECTION);
const TIME_WINDOW_MINUTES = Number(process.env.TIME_WINDOW_MINUTES || 20);
const FETCH_INTERVAL_MS = Number(process.env.FETCH_INTERVAL_MS || 15000);
const REFRESH_INTERVAL_MS = Number(process.env.REFRESH_INTERVAL_MS || 5000);

const WALK_TIME_SECONDS = Number(process.env.WALK_TIME_SECONDS || 300);
const RUSH_SECONDS_GAINED = Number(process.env.RUSH_SECONDS_GAINED || 90);

console.log("CONFIG", {
  JOURNEY_DIRECTION,
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  REFRESH_INTERVAL_MS,
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
});

async function fetchNextDeparture() {
  const url = new URL("https://api.sl.se/api2/realtimedeparturesV4.json");
  url.searchParams.set("key", REALTIME_API_KEY);
  url.searchParams.set("siteid", SITE_ID);
  url.searchParams.set("timewindow", TIME_WINDOW_MINUTES);
  url.searchParams.set("Bus", "false");

  const response = await fetch(url);
  if (!response.ok) throw Error("Request failed");
  const data = await response.json();
  // console.log("fetch respponse", data.ResponseData.Metros);
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

const updateDepartures = () =>
  fetchNextDeparture()
    .then((metros) => {
      console.log("all metros", metros);
      metrosCache = [...metros];
      console.log("Updated metros", decorateDepartures(metros));
    })
    .catch((err) => {
      console.error("updateDepartures failed", err);
    });

const render = () => {
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
    console.log(`renderDict`, { departures });
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
          : "👍";
      const timeMinutes = dayjs(expectedTime).fromNow(true);
      return `${hurryStr} ${timeMinutes} (${departure.Destination})`;
    });
    return lines;
  };

  console.log("keys", departuresByDirection.keys());
  const topLevelLines = Array.from(
    renderDirection(departuresByDirection.get("1") ?? []) ?? []
  );
  const otherDirection = Array.from(
    renderDirection(departuresByDirection.get("2") ?? []) ?? []
  );
  console.log(
    "toplevel lines",
    topLevelLines,
    typeof topLevelLines,
    topLevelLines instanceof Array
  );
  const arrJoinApply = topLevelLines.join(`<br/>`);
  return (
    '<div style="display: block; font-size: 35px;">' + arrJoinApply + "</div>"
  );
};

setInterval(() => updateDepartures().catch(console.error), FETCH_INTERVAL_MS);
void updateDepartures().catch(console.error);

const express = require("express");
const app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (req, res) => {
  console.log("GET /");
  const refreshScript = `<script>setInterval(() => window.location.reload(), ${REFRESH_INTERVAL_MS});</script>`;
  res.send(render() + refreshScript /*+ "<br/>" + new Date().toISOString()*/);
});

const port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on ", port);
