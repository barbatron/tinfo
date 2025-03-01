export const log = {
  ...console,
  debug: (...args: unknown[]) =>
    process.env.DEBUG && console.debug.apply(console, args),
}; // pino({ ...prettyOpts });
