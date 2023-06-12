// Time settings
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
