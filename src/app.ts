import executionRoutes from "./routes/execution.routes";
import directoryRoutes from "./routes/directory.routes";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", executionRoutes);
app.use("/api/directory", directoryRoutes);

export default app;
