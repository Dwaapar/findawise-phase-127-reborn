import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (!res.headersSent) {
    res.status(status).json({ message });
  }
  next(err);
});

(async () => {
  const port = process.env.PORT || 5000;
  
  console.log(`🚀 Starting simplified server on port ${port}`);
  
  // Test database connection
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  // Serve static PWA files
  const publicPath = path.resolve(import.meta.dirname, "..", "public");
  app.use(express.static(publicPath));
  
  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    const server = await setupVite(app, undefined as any);
    
    if (server && typeof server.listen === 'function') {
      server.listen({
        port: Number(port),
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${port}`);
        console.log('✅ Server started successfully');
        console.log(`🌐 Health check: http://localhost:${port}/api/health`);
        console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
      });
    } else {
      app.listen(Number(port), "0.0.0.0", () => {
        log(`serving on port ${port}`);
        console.log('✅ Server started successfully (fallback)');
        console.log(`🌐 Health check: http://localhost:${port}/api/health`);
        console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
      });
    }
  } else {
    serveStatic(app);
    
    app.listen(Number(port), "0.0.0.0", () => {
      log(`serving on port ${port}`);
      console.log('✅ Server started successfully');
      console.log(`🌐 Health check: http://localhost:${port}/api/health`);
      console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
    });
  }
})();