const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
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
    await client.connect();
    const productCollection = client.db("productsDB").collection("products");

    app.get("/allProducts", async (req, res) => {
      const query = req.query.value || "";
      const category = req.query.category || "";
      const name = req.query.search || "";
      const range = req.query.range || "";

      let result = [];

      // Sort by price or date
      if (query) {
        if (query === "low") {
          result = await productCollection.find().sort({ price: 1 }).toArray();
        } else if (query === "high") {
          result = await productCollection.find().sort({ price: -1 }).toArray();
        } else if (query === "date") {
          result = await productCollection.find().sort({ date: -1 }).toArray();
        }
      }

      // Filter by category
      if (category && category !== "all") {
        result = await productCollection.find({ category }).toArray();
      } else if (category === "all" || !category) {
        result = await productCollection.find().toArray();
      }

      // Filter by price range
      if (range) {
        let priceFilter = {};
        if (range === "lowest") {
          priceFilter = { price: { $gte: 0, $lte: 50 } };
        } else if (range === "middle") {
          priceFilter = { price: { $gte: 50, $lte: 100 } };
        } else if (range === "highest") {
          priceFilter = { price: { $gte: 100, $lte: 150 } };
        }

        result = await productCollection.find(priceFilter).toArray();
      }

      // Search by name using regex
      if (name) {
        result = await productCollection
          .find({
            productName: { $regex: name, $options: "i" },
          })
          .toArray();
      }

      // Default: return all products if no query, category, or name is provided
      if (!query && !category && !name && !range) {
        result = await productCollection.find().toArray();
      }

      return res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
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
