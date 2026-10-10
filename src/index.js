import "dotenv/config";
import express from "express";

import memberRoutes from "./routes/memberRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "REST API Perpustakaan berjalan",
    endpoints: ["/members", "/books", "/loans"]
  });
});

app.use("/members", memberRoutes);
app.use("/books", bookRoutes);
app.use("/loans", loanRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan"
  });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

export default app;