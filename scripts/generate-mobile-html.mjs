/**
 * generate-mobile-html.mjs
 * Post-build: generates dist/client/index.html for Capacitor.
 * Picks the largest index-*.js as the main entry bundle.
 */
import { readdirSync, writeFileSync, existsSync, statSync } from "node:fs";

const CLIENT_DIR = "dist/client";
const ASSETS_DIR = `${CLIENT_DIR}/assets`;

if (!existsSync(ASSETS_DIR)) {
  console.error(
    `[generate-mobile-html] ERROR: ${ASSETS_DIR} not found. Run 'npm run build' first.`,
  );
  process.exit(1);
}

const files = readdirSync(ASSETS_DIR);
const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

// Pick the largest index-*.js � that is the main entry bundle
const jsFile = files
  .filter((f) => f.startsWith("index-") && f.endsWith(".js"))
  .sort((a, b) => statSync(`${ASSETS_DIR}/${b}`).size - statSync(`${ASSETS_DIR}/${a}`).size)[0];

if (!jsFile) {
  console.error("[generate-mobile-html] ERROR: No index-*.js found.");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="theme-color" content="#5a2d1a" />
    <title>PocketMeeple</title>
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <link rel="manifest" href="/manifest.json" />
  </head>
  <body>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>
`;

writeFileSync(`${CLIENT_DIR}/index.html`, html, "utf-8");
console.log(`[generate-mobile-html] Generated ${CLIENT_DIR}/index.html`);
console.log(`  CSS  : ${cssFile ?? "(none)"}`);
console.log(
  `  JS   : ${jsFile} (${Math.round(statSync(`${ASSETS_DIR}/${jsFile}`).size / 1024)} KB)`,
);
