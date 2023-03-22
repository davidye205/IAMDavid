const router = require("express").Router();
const verify = require("../utils/verifyToken");
const { upsertPermission } = require("../controllers/permissionController");
const {
  registerNewResource,
  getAllResourcesForUser,
  getAllUsersForResource,
  updateResource,
  deleteResourceAndPermissions,
} = require("../controllers/resourceController");

//Create new resource
router.post("/", verify, async (req, res) => {
  try {
    const resource = await registerNewResource(
      req.user._id,
      req.body.resourceName
    );
    res.status(200).send({
      _id: resource._id,
      ownerId: resource.ownerId,
      resourceName: resource.resourceName,
      permission: resource.permission,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Get all resources for a user (As long as user has access - read, write, manage)
router.get("/", verify, async (req, res) => {
  try {
    const resources = await getAllResourcesForUser(req.user._id);
    res.status(200).send(resources);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Get all users with a permission on a resource as an owner of a resource
router.get("/:resourceId/users", verify, async (req, res) => {
  try {
    const users = await getAllUsersForResource(
      req.user._id,
      req.params.resourceId
    );
    res.status(200).send(users);
  } catch (err) {
    res.status(400).send(err.nmessage);
  }
});

//update/edit resource
router.post("/:resourceId", verify, async (req, res) => {
  try {
    const savedResource = await updateResource(
      req.user._id,
      req.params.resourceId,
      req.body.resourceName
    );
    res.status(200).send(savedResource);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Delete a resource and all its associated permissions
router.delete("/:resourceId", verify, async (req, res) => {
  try {
    const resourcePermissions = await deleteResourceAndPermissions(
      req.user._id,
      req.params.resourceId
    );
    res.status(200).send(resourcePermissions);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//Post new permission for owned resource
router.post("/:resourceId/permissions", verify, async (req, res) => {
  try {
    const permission = upsertPermission(
      req.user._id,
      req.body.userId,
      req.params.resourceId,
      req.body.permission
    );
    res.status(200).send(permission);
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
