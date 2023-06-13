const log = (...args) => {
  const hasLevelArg =
    args[0] in console && typeof console[args[0]] == "function";
  const logFn = hasLevelArg ? console[args[0]] : console.log;
  const logArgs = hasLevelArg ? args.slice(1) : args;

  logFn.apply(console, [new Date().toTimeString(), ...logArgs]);
};

module.exports = { log };
