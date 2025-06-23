import executionRoutes from "./routes/execution.routes";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", executionRoutes);

export default app;
