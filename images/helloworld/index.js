const http = require("http");

const hostname = "0.0.0.0";
const port = 80;

const server = http.createServer((_req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

process.on("SIGINT", function () {
  console.log("Caught interrupt signal");

  process.exit();
});
