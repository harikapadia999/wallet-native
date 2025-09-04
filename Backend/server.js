import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5001;

async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

app.get("/api/transactions/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const transactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${user_id} ORDER BY date DESC
    `;
    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/transactions", async (req, res) => {
  try {
    const { user_id, title, amount, category } = req.body;
    if (!user_id || !title || amount === undefined || !category) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const transactions = await sql`
      INSERT INTO transactions (user_id, title, amount, category) 
      VALUES (${user_id}, ${title}, ${amount}, ${category}) 
      RETURNING *`;

    console.log(transactions);
    res.status(201).json(transactions[0]);
  } catch (error) {
    console.log("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required." });
    }
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID." });
    }
    const result =
      await sql`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
    if (result.length === 0) {
      return res.status(404).json({ error: "Transaction not found." });
    }
    res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error) {
    console.log("Error deleting transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// income +expense - amount >0====income
// amount<0====expense
app.get("/api/transactions/summary/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount),0) AS balance FROM transactions WHERE user_id = ${user_id}
    `;
    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount),0) AS income FROM transactions WHERE user_id = ${user_id} AND amount > 0
    `;
    const expenseResult = await sql`
      SELECT COALESCE(SUM(amount),0) AS expense FROM transactions WHERE user_id = ${user_id} AND amount < 0
    `;
    res.status(200).json({
      balance: parseFloat(balanceResult[0].balance),
      income: parseFloat(incomeResult[0].income),
      expense: parseFloat(expenseResult[0].expense),
    });
  } catch (error) {
    console.log("Error fetching summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
