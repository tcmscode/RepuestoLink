import { describe } from "vitest";

/** Siempre registra suites de integración; el skip ocurre en beforeAll si no hay DB. */
export const describeIntegration = describe;
