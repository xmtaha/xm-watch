
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "dist");
const PORT = 5177;
const EDGE =
  process.env.EDGE_BIN ||
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".ico": "image/x-icon" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  try {
    const data = await fs.readFile(path.join(ROOT, p));
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    const data = await fs.readFile(path.join(ROOT, "index.html"));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(data);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const profile = path.join(process.env.TEMP || ".", "xmwatch-edge-" + Date.now());
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--disable-features=Translate,MediaRouter", "--autoplay-policy=no-user-gesture-required",
  "--user-data-dir=" + profile, "--remote-debugging-port=9333", "about:blank",
], { stdio: "ignore" });

async function json(url) {
  const res = await fetch(url);
  return res.json();
}
let targets = null;
for (let i = 0; i < 60; i++) {
  try { targets = await json("http://127.0.0.1:9333/json/list"); if (targets.length) break; } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === "page");
if (!page) { console.log("NO PAGE TARGET", JSON.stringify(targets)); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });

let nextId = 1;
const pending = new Map();
let events = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method) events.push(msg);
});
function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (m) => (m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const argText = (a) =>
  a.value !== undefined ? (typeof a.value === "string" ? a.value : JSON.stringify(a.value))
    : a.unserializableValue ?? a.description ?? (a.preview ? a.preview.description : a.type);

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Network.enable");

async function visit(hash, waitMs = 1600) {
  events = [];
  await send("Page.navigate", { url: "http://127.0.0.1:" + PORT + "/" + hash });
  await sleep(waitMs);
  const out = [];
  for (const e of events) {
    if (e.method === "Runtime.consoleAPICalled") {
      const lvl = e.params.type;
      if (lvl === "error" || lvl === "warning" || lvl === "assert") out.push("[" + lvl + "] " + e.params.args.map(argText).join(" "));
    } else if (e.method === "Runtime.exceptionThrown") {
      const d = e.params.exceptionDetails;
      out.push("[exception] " + (d.exception?.description || d.text));
    } else if (e.method === "Log.entryAdded") {
      const en = e.params.entry;
      if (en.level === "error" || en.level === "warning") out.push("[" + en.level + "/" + en.source + "] " + en.text + (en.url ? " @ " + en.url : ""));
    } else if (e.method === "Network.loadingFailed") {
      if (!e.params.canceled && e.params.errorText !== "net::ERR_ABORTED") out.push("[net] " + e.params.errorText + " " + (e.params.type || ""));
    }
  }
  const state = await send("Runtime.evaluate", {
    expression: "JSON.stringify({ title: document.title, raw: [...new Set((document.body.innerText||'').match(/\\{[a-zA-Z_]+\\}/g) || [])], text: (document.body.innerText||'').replace(/\\s+/g,' ').slice(0,240), links: document.querySelectorAll('a').length, imgs: document.images.length, cards: document.querySelectorAll('[data-testid], .poster, article').length, scrollH: document.body.scrollHeight })",
    returnByValue: true,
  });
  return { out, state: JSON.parse(state.result.value) };
}

const routes = process.argv.slice(2).length ? process.argv.slice(2)
  : ["#/", "#/films", "#/series", "#/search?q=dune", "#/library", "#/settings", "#/title/movie/-1", "#/title/tv/-101", "#/watch/movie/-1", "#/watch/tv/-101?season=1&episode=1", "#/nope"];
for (const r of routes) {
  const { out, state } = await visit(r);
  console.log("\n### " + r + "  => " + JSON.stringify(state));
  for (const line of out) console.log("    " + line);
  if (!out.length) console.log("    (no console errors)");
}

ws.close();
edge.kill();
server.close();
setTimeout(() => process.exit(0), 300);
