import express, { type Express, type Request, type Response } from "express";

const app: Express = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});