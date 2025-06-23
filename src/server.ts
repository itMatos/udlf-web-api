import app from "./app";
import express from "express";

const port = process.env.PORT || 8080;

app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
