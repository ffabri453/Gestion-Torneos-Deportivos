const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "1234",
  database: "torneos_db",
});

const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      ok: true,
      message: "PostgreSQL conection successful",
      time: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "PostgreSQL connection failed",
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

