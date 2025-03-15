import { FetchParams } from "../types";

export class FetchDeparturesError extends Error {
  constructor(
    message: string,
    public readonly params: Readonly<FetchParams>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FetchDeparturesError";
  }
}
