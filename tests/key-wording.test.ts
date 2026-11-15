// The app must describe the user's key truthfully: it is saved on the device
// and sent with each run (to call OpenAI), never "never sent to our servers".
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

describe("API key wording", () => {
  it("never claims the key is not sent to our servers", () => {
    const offenders = files("src").filter((file) =>
      /never sent to our servers|key is stored locally|never stored on our servers/i.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
