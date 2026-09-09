/**
 * Fail the build if a bundle points at localhost.
 *
 * Vite inlines VITE_* at BUILD time, so a developer's .env.local silently
 * becomes the shipped configuration. That happened: the portal was built
 * with VITE_API_BASE=http://localhost:4000 present and deployed, and every
 * request it made went nowhere. Nothing caught it — .gitignore keeps
 * .env.local out of the repo, so there was no diff to notice, and the app
 * builds and loads perfectly. It only failed in the one place nobody was
 * looking: a partner's browser.
 *
 * A grep of the output is the check that would have caught it, so it runs
 * on every build rather than depending on anyone remembering.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error(`assert-no-localhost: no such directory ${dir}`);
  process.exit(1);
}
const bad = [];
for (const f of readdirSync(dir)) {
  if (!/\.(js|css)$/.test(f)) continue;
  const hit = readFileSync(join(dir, f), "utf8").match(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g);
  if (hit) bad.push(`${f}: ${[...new Set(hit)].join(", ")}`);
}
if (bad.length) {
  console.error(
    "\n✗ BUILD BLOCKED — bundle points at localhost:\n  " +
      bad.join("\n  ") +
      "\n\n  A .env.local is almost certainly present. Move it aside before" +
      "\n  building for deploy:  mv .env.local .env.local.disabled\n"
  );
  process.exit(1);
}
console.log(`✓ no localhost URLs in ${dir}`);
