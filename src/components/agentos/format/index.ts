// src/components/agentos/format/index.ts
//
// Barrel for the shared AgentOS formatting helpers.
//
// WHY A FOLDER AND NOT A FILE
//   Relative time and byte size are two independent rules. Keeping them in
//   separate files lets each carry its own reasoning, and this barrel is the
//   single import surface every surface uses.

export { relativeTime, absoluteTime, machineTime } from "./relativeTime";
export { formatBytes, formatBytesTotal } from "./bytes";
