import mongoose from 'mongoose';

// Define an interface for the connection object
interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connect(): Promise<void> {
  if (connection.isConnected) {
    console.log('already connected to DB');
    return;
  }

  if (mongoose.connections.length > 0) {
    connection.isConnected = mongoose.connections[0].readyState;

    if (connection.isConnected === 1) {
      console.log('use previous connection DB');
      return;
    }
    await mongoose.disconnect();
  }

  const db = await mongoose.connect(process.env.MONGODB_URI!, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  });

  console.log('new DB connection');
  connection.isConnected = db.connections[0].readyState;
}

async function disconnect(): Promise<void> {
  if (connection.isConnected) {
    if (process.env.NODE_ENV === 'production') {
      await mongoose.disconnect();
      connection.isConnected = 0;
    } else {
      console.log('not disconnected DB');
    }
  }
}

const db = {
  connect,
  disconnect,
};

export default db;
