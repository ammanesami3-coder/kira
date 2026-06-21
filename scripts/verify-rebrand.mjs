/**
 * Redeploy-playbook smoke test: prove a new agency is a CONFIG-ONLY change.
 *
 * It loads `config/site.config.ts` twice under two different `NEXT_PUBLIC_*`
 * environment profiles (the default "Kira" agency and a fictional second
 * client) and asserts the resolved identity — name, URL, colors, currency,
 * default locale + direction — follows the environment with no code edits.
 *
 * This validates the core promise of the redeploy playbook. A full production
 * build under a second profile is exercised separately by `pnpm build`.
 *
 * Run: pnpm verify:rebrand
 */
import { spawnSync } from "node:child_process";

const SECOND_AGENCY = {
  NEXT_PUBLIC_SITE_NAME: "Atlas Wheels",
  NEXT_PUBLIC_SITE_URL: "https://atlaswheels.ma",
  NEXT_PUBLIC_DEFAULT_LOCALE: "fr",
  NEXT_PUBLIC_CURRENCY: "EUR",
  NEXT_PUBLIC_PRIMARY_COLOR: "#1D4ED8",
  NEXT_PUBLIC_SECONDARY_COLOR: "#F59E0B",
};

// Resolve the config inside a child `tsx` process with a given env profile and
// print the resolved values as JSON so we can assert on them here.
function resolveConfig(envProfile) {
  const code = `
    import { siteConfig, localeDirection } from "./config/site.config.ts";
    process.stdout.write(JSON.stringify({
      name: siteConfig.name,
      url: siteConfig.url,
      defaultLocale: siteConfig.defaultLocale,
      currency: siteConfig.currency,
      primary: siteConfig.colors.primary,
      secondary: siteConfig.colors.secondary,
      dir: localeDirection[siteConfig.defaultLocale],
    }));
  `;
  const res = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", code],
    {
      // Start from a clean slate so a developer's .env.local can't mask the test.
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        ...envProfile,
      },
      encoding: "utf8",
    },
  );
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error("Failed to resolve site.config under the given profile");
  }
  return JSON.parse(res.stdout.trim());
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

console.log("Agency #1 — defaults (no env):");
const a = resolveConfig({});
assert(a.name === "Kira", `name falls back to "Kira" (got "${a.name}")`);
assert(a.defaultLocale === "ar", `default locale is "ar"`);
assert(a.dir === "rtl", `direction is RTL for Arabic`);
assert(a.currency === "MAD", `currency falls back to "MAD"`);

console.log("\nAgency #2 — second client profile (env only):");
const b = resolveConfig(SECOND_AGENCY);
assert(b.name === "Atlas Wheels", `name rebrands to "Atlas Wheels"`);
assert(b.url === "https://atlaswheels.ma", `canonical URL follows env`);
assert(b.defaultLocale === "fr", `default locale switches to "fr"`);
assert(b.dir === "ltr", `direction switches to LTR for French`);
assert(b.currency === "EUR", `currency switches to "EUR"`);
assert(b.primary === "#1D4ED8", `primary color follows env`);
assert(b.secondary === "#F59E0B", `secondary color follows env`);

console.log("\nIsolation:");
assert(a.name !== b.name, `the two agencies resolve to different identities`);

if (process.exitCode) {
  console.error("\n✗ Rebrand verification FAILED — config is not env-driven.");
} else {
  console.log(
    "\n✓ Rebrand verification PASSED — a new agency is configuration-only.",
  );
}
