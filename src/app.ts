import executionRoutes from "./routes/execution.routes";
import directoryRoutes from "./routes/directory.routes";
import express from "express";
import cors from "cors";

const app = express();

// Configure CORS to allow requests from Vercel deployment and localhost
const corsOptions = {
  origin: [
    'https://udlf-web.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://front:3000' // Docker internal network
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/", executionRoutes);
app.use("/api/directory", directoryRoutes);

export default app;
