import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const srcEntry = resolve(root, "widget/src/main.tsx");
const outJs = resolve(root, "widget/dist/widget.js");
const outCss = resolve(root, "widget/dist/widget.css");
const outHtml = resolve(root, "widget/dist/widget.html");

await mkdir(dirname(outJs), { recursive: true });

await build({
  entryPoints: [srcEntry],
  bundle: true,
  sourcemap: false,
  format: "iife",
  target: ["es2022"],
  outfile: outJs,
  loader: {
    ".css": "css",
  },
});

const js = await readFile(outJs, "utf8");
const css = await readFile(outCss, "utf8");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${js}</script>
  </body>
</html>`;

await writeFile(outHtml, html, "utf8");
console.log("Widget built:", outHtml);
