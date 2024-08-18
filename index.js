const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://solemate-cb250.web.app"],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sahed96.5o5zjc5.mongodb.net/?retryWrites=true&w=majority&appName=Sahed96`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const productCollection = client.db("productsDB").collection("products");

    app.get("/allProducts", async (req, res) => {
      const sortQuery = req.query.value || "";
      const category = req.query.category || "";
      const name = req.query.search || "";
      const range = req.query.range || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 6;

      let query = {};

      if (category && category !== "all") {
        query.category = category;
      }

      if (range) {
        if (range === "lowest") {
          query.price = { $gte: 0, $lte: 50 };
        } else if (range === "middle") {
          query.price = { $gte: 50, $lte: 100 };
        } else if (range === "highest") {
          query.price = { $gte: 100, $lte: 150 };
        }
      }

      if (name) {
        query.productName = { $regex: name, $options: "i" };
      }

      let sort = {};
      if (sortQuery === "low") {
        sort.price = 1;
      } else if (sortQuery === "high") {
        sort.price = -1;
      } else if (sortQuery === "date") {
        sort.creationDateTime = -1;
      }

      const skip = (page - 1) * limit;

      const result = await productCollection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalItems = await productCollection.countDocuments(query);

      res.send({
        products: result,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      });
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Solemate server running");
});

app.listen(port, () => {
  console.log(`Solemate running on ${port}`);
});
