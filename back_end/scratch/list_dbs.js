const mongoose = require("mongoose");

async function check() {
  try {
    const client = await mongoose.connect("mongodb://127.0.0.1:27017/admin");
    const admin = new mongoose.mongo.Admin(client.connection.db);
    const dbs = await admin.listDatabases();
    
    console.log("Databases on local MongoDB:");
    for (const db of dbs.databases) {
      if (db.name === "admin" || db.name === "local" || db.name === "config") continue;
      
      const conn = mongoose.createConnection(`mongodb://127.0.0.1:27017/${db.name}`);
      await new Promise((resolve) => conn.once("open", resolve));
      
      // Try to see if Product collection exists and has documents
      let count = 0;
      try {
        const collections = await conn.db.listCollections().toArray();
        if (collections.some(c => c.name === "products")) {
          count = await conn.db.collection("products").countDocuments();
        }
      } catch (err) {}
      
      console.log(`- DB: ${db.name} | Has 'products' count: ${count}`);
      await conn.close();
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
