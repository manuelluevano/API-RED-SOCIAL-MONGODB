const mongoose = require("mongoose");
require("dotenv").config({ path: "variables.env" });

const connection = async () => {
  mongoose.Promise = global.Promise;
  mongoose
    .connect(process.env.MONGO_DB_URL || process.env.DB_URL)
    .then((res) => console.log("Conectado a la base de datos", res.connections[0].db.s.namespace.db))
    .catch((error) => console.log(error));
};


module.exports =  connection;
