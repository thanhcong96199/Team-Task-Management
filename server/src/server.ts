import express, { type Express, type Request, type Response } from "express";
import app from "./app.js";


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});