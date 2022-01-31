const mongoose = require('mongoose'),
  bcrypt = require('bcrypt-nodejs'),
  Schema = mongoose.Schema;

require('mongoose-type-email');

const userSchema = new Schema({
  userName: {
    type: String,
    //unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: 'profile.png'
  },
  role: {
    type: String,
    enum: ['admin', 'artist', 'user'],
    default: 'user'
  },
  status: {
    type: Number, // 0 - not activated, 1 - active 2 - inactive 3 - delete
    enum: [0, 1, 2, 3],
    default: 1
  }

}, {
    timestamps: true
  });

//method to encrypt password
userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//method to decrypt password
userSchema.methods.validPassword = function (password) {
  let userData = this;
  return bcrypt.compareSync(password, userData.password);
};

// creating index 
userSchema.index({
  'createdAt': 1,
  'updatedAt': 1,
  'userName': 1
});

const user = mongoose.model('users', userSchema);

module.exports = user;