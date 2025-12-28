const { MongoClient } = require("mongodb");

const uri = process.env.basemongo;

if (!uri) {
  throw new Error("MongoDB URI (basemongo) not found in environment variables");
}

let client;
let clientPromise;

const getMongoClient = async () => {
  if (!clientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10 // optional but recommended
    });

    clientPromise = client.connect();
  }

  return clientPromise;
};

module.exports = { getMongoClient };
