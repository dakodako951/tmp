const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png"
};

http.createServer((req, res) => {
  const urlPath = decodeURI(new URL(req.url, "http://localhost").pathname);
  const target = path.resolve(root, urlPath === "/" ? "index.html" : `.${urlPath}`);

  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  fs.readFile(target, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("not found");
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(5173, "127.0.0.1", () => {
  console.log("http://127.0.0.1:5173/");
});
