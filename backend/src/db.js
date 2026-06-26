const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/productbrowser';

  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');
};

module.exports = connectDB;
