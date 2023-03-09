const router = require("express").Router();
const cors = require("cors");
const verify = require("../utils/verifyToken");
const { registerUser, loginUser } = require("../controllers/userController");

const User = require("../model/user");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

router.use(cors());

//Register new user
router.post("/register", async (req, res) => {
  try {
    const authToken = await registerUser(
      req.body.name,
      req.body.email,
      req.body.password
    );
    res.header("auth-token", authToken).send("User successfully registered");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Login
router.post("/login", async (req, res) => {
  try {
    const authToken = await loginUser(req.body.email, req.body.password);
    res.header("auth-token", authToken).send("User successfully logged in");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Update user details
router.post("/", verify, async (req, res) => {
  try {
    const user = await User.findOne({
      userId: req.user._id,
    });

    user.name = req.body.name;
    const updatedUser = await user.save();
    res.status(200).send(updatedUser);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Delete user
router.post("/", verify, async (req, res) => {
  try {
    const deletedUser = await User.deleteOne({
      userId: req.user._id,
    });
    res.status(200).send(deletedUser);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
