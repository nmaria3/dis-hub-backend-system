const { saveLog } = require("../utils/logHelper");

// middlewares/logger.middleware.js
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    let result = "UNKNOWN";
    if (status >= 200 && status < 300) result = "SUCCESS";
    else if (status >= 300 && status < 400) result = "REDIRECT";
    else if (status >= 400 && status < 500) result = "CLIENT ERROR";
    else if (status >= 500) result = "SERVER ERROR";

    const auth = req.auth(); // Clerk auth object
    const userStatus = auth && auth.userId ? `SIGNED-IN (UserID: ${auth.userId})` : "GUEST";

    const logMessage = `[${new Date().toISOString()}] ${method} ${url} - Status: ${status} (${result}) - ${duration}ms - IP: ${ip} - ${userStatus}`;
    console.log(logMessage); // display in console
    saveLog(logMessage); // save to logs.json
  });

  next();
};

module.exports = loggerMiddleware;