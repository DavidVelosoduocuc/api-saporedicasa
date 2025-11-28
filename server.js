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

  // Express decodifica el título (ej: "Lomo Saltado")

  const tituloReceta = req.params.titulo;

  const usuarioId = 1;



  try {

    await client.connect();

    const database = client.db("saporedicasa_db");

    const collection = database.collection("recetas");



    // 1.Usamos $regex y $options: 'i' para ignorar mayúsculas y espacios.

    const result = await collection.deleteOne({

      "titulo": { $regex: tituloReceta, $options: 'i' }

    });



    if (result.deletedCount === 1) {

      // 2. AVISAMOS A ORACLE (AUDITORÍA)

      // Asegúrate que tu link de ORDS esté aquí y sea correcto

      const oracleUrl = "https://g2dab4e0dd88467-basedatosdavid.adb.sa-santiago-1.oraclecloudapps.com/ords/apex_dev/seguridad/auditoria";



      await fetch(oracleUrl, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          usuario_id: usuarioId,

          detalle: `Se eliminó la receta '${tituloReceta}' desde la App`

        })

      });



      console.log(`✅ Borrado '${tituloReceta}' y auditado.`); // Se verá en los logs de Render

      res.json({ message: "Eliminado de Mongo y auditoría registrada" });

    } else {

      console.log(` No se encontró la receta: ${tituloReceta}.`);

      res.status(404).json({ message: "Error: La receta no se encontró." });

    }

  } catch (error) {

    console.error(` ERROR AL BORRAR O AUDITAR: ${error.message}`);

    res.status(500).send("Error interno del servidor.");

  }

});



// Render nos asigna un puerto automáticamente

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Servidor escuchando en puerto ${PORT}`);

});