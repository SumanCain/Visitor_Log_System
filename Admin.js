const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: String,
  password: String // plain for now, we can hash later
});

module.exports = mongoose.model('Admin', adminSchema);
