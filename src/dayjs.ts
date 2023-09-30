// Time settings
// const dayjs = require("dayjs");
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import localeData from "dayjs/plugin/localeData.js";
import updateLocale from "dayjs/plugin/updateLocale.js";

dayjs.extend(relativeTime);
dayjs.extend(localeData);
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
