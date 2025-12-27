require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const loginRouter = require("./routes/loginRouter");
const appRouter = require("./routes/appRoute");
const utilityRouter = require("./routes/utilityRouter");
const paymentRouter = require("./routes/paymentRouter");
const mpinRouter = require("./routes/mpinRouter");

const app = express();
const PORT = process.env.PORT || 8120;

app.use(
  cors({
    origin: ["https://custprod.aadharhousing.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://custprod.aadharhousing.com",
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https://custprod.aadharhousing.com"],
        "frame-ancestors": ["'self'"],
        // Add any other domains your app relies on here
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" }, // Prevent clickjacking
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true,
    dnsPrefetchControl: { allow: false },
  })
);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json());
app.use("/assets", express.static("assets"));

app.use(require("./middlewares/consoller"));

app.get("/health", (req, res) => {
  return res.status(200).json({
    message: "Your application is working fine",
  });
});

app.use("/", loginRouter);
app.use("/api", appRouter);
app.use("/api", utilityRouter);
app.use("/payment/", paymentRouter);
app.use("/mpin/", mpinRouter);

app.use(require("./middlewares/gErrorHandler"));
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
