import express, { type Express, type Request, type Response } from "express";
import app from "./app.js";
import { env } from "./config/env.js";


const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});