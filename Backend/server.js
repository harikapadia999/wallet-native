import experess from "express";
import cors from "cors";

const app = experess();

app.use(experess.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
