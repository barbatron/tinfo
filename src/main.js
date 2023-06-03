require("dotenv").config();

const dayjs = require("dayjs");
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

const REALTIME_API_KEY = process.env.SL_REALTIME_API_KEY;
const SITE_ID = process.env.SL_SITE_ID;
const JOURNEY_DIRECTION = Number(process.env.SL_JOURNEY_DIRECTION);
const TIME_WINDOW_MINUTES = Number(process.env.TIME_WINDOW_MINUTES || 20);

const WALK_TIME_SECONDS = Number(process.env.WALK_TIME_SECONDS || 300);
const RUSH_SECONDS_GAINED = Number(process.env.RUSH_SECONDS_GAINED || 90);

async function fetchNextDeparture() {
  const url = new URL("https://api.sl.se/api2/realtimedeparturesV4.json");
  url.searchParams.set("key", REALTIME_API_KEY);
  url.searchParams.set("siteid", SITE_ID);
  url.searchParams.set("timewindow", TIME_WINDOW_MINUTES);
  url.searchParams.set("Bus", "false");

  const response = await fetch(url);
  if (!response.ok) throw Error("Request failed");
  const data = await response.json();

  const metros = data.ResponseData.Metros;
  const metrosRightDirection = metros.filter(
    (metroDeparture) =>
      isNaN(JOURNEY_DIRECTION) ||
      metroDeparture.JourneyDirection === JOURNEY_DIRECTION
  );
  return metrosRightDirection;
}

const decorateDepartures = (departures) =>
  (departures ?? {})
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

fetchNextDeparture()
  .then(decorateDepartures)
  .then((departures) => {
    if (!departures.length) return;
    const realisticDepartures = departures; //.filter((d) => d.canMakeIt);

    realisticDepartures.forEach((departure) => {
      const expectedTime = departure.ExpectedDateTime;
      const hurryStr = departure.successProbPow < 1 ? "!!!" : "   ";
      const timeMinutes = dayjs(expectedTime).fromNow();
      console.log(
        `${hurryStr} ${departure.Destination}: ${timeMinutes} (${Math.round(
          departure.successProbPow * 100
        )}% chance to make it)`
      );
    });
  })
  .catch((err) => console.error(err));
