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

// RUTA 3: BORRAR RECETA (Y AVISAR A ORACLE)
app.delete("/recetas/:titulo", async (req, res) => {
  const tituloReceta = req.params.titulo;
  // Simulamos que el usuario 1 (Admin) está borrando. En una app real esto vendría del login.
  const usuarioId = 1; 

  try {
    await client.connect();
    const database = client.db("saporedicasa_db");
    const collection = database.collection("recetas");

    // 1. Intentamos borrar de MongoDB
    const result = await collection.deleteOne({ "titulo": tituloReceta });

    if (result.deletedCount === 1) {
      // 2. SI SE BORRÓ, AVISAMOS A ORACLE (AUDITORÍA)
      const oracleUrl = "https://g2dab4e0dd88467-basedatosdavid.adb.sa-santiago-1.oraclecloudapps.com/ords/apex_dev/seguridad/auditoria"; 
      
      // Enviamos el aviso
      const response = await fetch(oracleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuarioId,
          detalle: `Se elimino la receta '${tituloReceta}' desde la Web`
        })
      });

      console.log("Aviso enviado a Oracle. Estado:", response.status);
      res.json({ message: "Receta eliminada y auditoría registrada", oracle_status: response.status });

    } else {
      res.status(404).json({ message: "No encontré esa receta para borrar" });
    }

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