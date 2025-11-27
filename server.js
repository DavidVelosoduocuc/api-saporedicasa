const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANTE: Render nos dará la conexión por una "Variable de Entorno"
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

app.get("/", (req, res) => {
  res.send("¡API SaporeDiCasa funcionando en la nube! 🚀");
});

app.get("/recetas", async (req, res) => {
  try {
    await client.connect();
    // Asegúrate que el nombre de la DB sea exacto al de Mongo Atlas
    const database = client.db("saporedicasa_db");
    const collection = database.collection("recetas");
    const recetas = await collection.find({}).toArray();
    res.json(recetas);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error: " + error.message);
  }
});

// Render nos asigna un puerto automáticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});