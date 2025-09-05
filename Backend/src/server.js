import express from "express";
import dotenv from "dotenv";
import { initDB, sql } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import router from "./routes/route.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(rateLimiter);

const PORT = process.env.PORT || 5001;

app.use("/api/transactions", router);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
