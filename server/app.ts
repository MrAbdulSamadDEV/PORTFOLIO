import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { IS_PRODUCTION, PATHS, PORT } from "./config/env.js";
import { cacheControl, canonicalRedirects } from "./middleware/seo.js";
import { pagesRouter } from "./routes/pages.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  next();
});

app.use(compression({ threshold: 1024, level: 6 }));

app.use(canonicalRedirects);
app.use(cacheControl);

const publicStatic = express.static(PATHS.public, {
  etag: true,
  maxAge: "7d",
  dotfiles: "ignore",
  index: false,
  fallthrough: true,
});
app.use(publicStatic);
app.use("/css", express.static(PATHS.styles, { etag: true, maxAge: "7d", index: false }));
app.use("/data", express.static(PATHS.data, { etag: true, maxAge: 0, index: false }));

app.use(pagesRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] unhandled error:", err);
  res.status(500).type("html").send("Internal server error. Please try again later.");
});

app.listen(PORT, () => {
  console.log(`[server] ${IS_PRODUCTION ? "production" : "development"} mode`);
  console.log(`[server] Abdul Samad portfolio running at http://localhost:${PORT}`);
});
