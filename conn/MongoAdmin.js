const { MongoClient } = require("mongodb");

const uri = process.env.basemongo;

let client;
let clientPromise;

export const getMongoClient = async () => {
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
};
