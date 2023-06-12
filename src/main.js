const express = require("express");
const index = require("./html-template");

require("dotenv").config();
require("./dayjs");
const dayjs = require("dayjs");

const {
  REALTIME_API_KEY,
  SITE_ID,
  TIME_WINDOW_MINUTES,
  FETCH_INTERVAL_MS,
  WALK_TIME_SECONDS,
  RUSH_SECONDS_GAINED,
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
      // console.log("all metros", metros);
      metrosCache = [...metros];
      // console.log("Updated metros", decorateDepartures(metros));
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
    // console.log(`renderDict`, { departures });
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

  const topLevelLines = Array.from(
    renderDirection(departuresByDirection.get("1") ?? []) ?? []
  );
  const otherDirection = Array.from(
    renderDirection(departuresByDirection.get("2") ?? []) ?? []
  );
  // console.log(
  //   "toplevel lines",
  //   topLevelLines,
  //   typeof topLevelLines,
  //   topLevelLines instanceof Array
  // );
  const arrJoinApply = topLevelLines.join(`<br/>`);
  return (
    '<div style="display: block; height: 100vh; font-size: 35px;">' +
    arrJoinApply +
    "</div>"
  );
};

setInterval(() => updateDepartures().catch(console.error), FETCH_INTERVAL_MS);
void updateDepartures().catch(console.error);

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (req, res) => {
  console.log("GET /", req.headers["user-agent"]);
  res.setHeader("Content-Type", "text/html; charset=utf-8").send(index);
});

app.get("/content", (req, res) => {
  console.log("GET /content", req.headers["user-agent"]);
  res.setHeader("Content-Type", "text/html").send(render());
});

const port = process.env.PORT || 8000;
app.listen(port);
console.log("Listening on ", port);
