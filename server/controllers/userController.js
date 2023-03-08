const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation");

//Register user Logic
const registerUser = async (name, email, password) => {
  //Validate register data
  const { error } = registerValidation({ name, email, password });
  if (error) throw new Error(error.details[0].message);

  //Check if user is already in the database
  const emailExist = await User.findOne({ email: email });
  if (emailExist) throw new Error("Email already exists");

  //Hash password
  const salt = await bcrypt.genSalt(10); //Generate salt, number in genSalt() function sets how complex(?) salt is
  const hashedPassword = await bcrypt.hash(password, salt); //Use salt to generate a hashed password

  //Creates a new user
  const user = new User({
    name: name,
    email: email,
    password: hashedPassword,
  });

  try {
    const savedUser = await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    return token;
  } catch (err) {
    throw new Error(err.message);
  }
};

//Login user logic
const loginUser = async (email, password) => {
  //Validate register data
  const { error } = loginValidation({ email, password });
  if (error) throw new Error(error.details[0].message);

  //Check if user is already in the database
  let user;
  try {
    user = await User.findOne({ email: email });
    if (!user) throw new Error("Email not found");
  } catch (err) {
    throw new Error(err.message);
  }

  //Check if passwords match
  try {
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) throw new Error("Invalid password");
  } catch (err) {
    throw new Error(err.message);
  }

  //Create and assign web token
  //JWT - JSON web tokens, make requests as a logged in user
  try {
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    return token;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  registerUser,
  loginUser,
};
