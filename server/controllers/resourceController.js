//imports
const Resource = require("../model/resource");
const { Permissions } = require("../enums/permissions");
const {
  upsertPermission,
  getPermissionForResource,
  getAllPermissionsForUser,
  getUsersForResource,
  deletePermissionsForResource,
} = require("../controllers/permissionController");

//register new resource as an owner
const registerNewResource = async (userId, resourceName) => {
  const resource = new Resource({
    ownerId: userId,
    resourceName: resourceName,
  });
  try {
    const savedResource = await resource.save();
    //Upsert permission checks if resource does not have an owner or if user owns resource, then upserts a MANAGE permission for the user creating the resource
    const savedPermission = await upsertPermission(
      userId,
      userId,
      savedResource._id,
      Permissions.MANAGE
    );

    let permission = savedPermission.permission;
    return { ...savedResource._doc, permission };
  } catch (err) {
    throw new Error(err);
  }
};

//get all resources user has permission on
const getAllResourcesForUser = async (userId) => {
  // [{resourceId: 1, userId: 1, type: read}, {resourceId: 2, userId: 1, type: write}, ]
  //Fetch all permissions relevant to logged in user
  const permissions = await getAllPermissionsForUser(userId);
  // [1, 2]
  //Get all resourceIds for all resources user has permissions for
  const resourceIds = permissions.map((permission) => permission.resourceId);

  /**
   * {
   *    1: "read",
   *    2: "write"
   * }
   */

  //Added permissions and resourceIds to a key value pair, resourceId: permission
  const resourceIdsToPermission = permissions.reduce((map, permission) => {
    map[permission.resourceId] = permission.permission;
    return map;
  }, {});
  try {
    const resources = await Resource.find().where("_id").in(resourceIds).exec();
    //convert storage resource to client facing resource to contain permission type
    const resourcesWithType = resources.map((resource) => {
      return {
        _id: resource._id,
        ownerId: resource.ownerId,
        resourceName: resource.resourceName,
        permission: resourceIdsToPermission[resource._id],
      };
    });
    return resourcesWithType;
  } catch (err) {
    throw new Error(err);
  }
};

//Get all users with a permission on a resource (user must be manager)
const getAllUsersForResource = async (userId, resourceId) => {
  try {
    const usersWithPermission = await getUsersForResource(userId, resourceId);
    const users = usersWithPermission.map((permission) => {
      return { userId: permission.userId, permission: permission.permission };
    });

    return users;
  } catch (err) {
    throw new Error(err);
  }
};

//edit resource
const updateResource = async (userId, resourceId, resourceName) => {
  const resource = await Resource.findOne({
    _id: resourceId,
  });

  //Check if user has write permission, getPermissionForResource(userId, resourceId, READ) is false
  const readOnlyPermission = await getPermissionForResource(
    userId,
    resourceId,
    Permissions.READ
  );
  if (readOnlyPermission) {
    throw new Error("User does not have permission to edit this resource");
  }

  resource.resourceName = resourceName;

  try {
    const savedResource = await resource.save();
    return savedResource;
  } catch (err) {
    throw new Error(err);
  }
};

//delete resource
const deleteResourceAndPermissions = async (userId, resourceId) => {
  const resource = await Resource.findOne({
    _id: resourceId,
  });

  if (!resource) {
    return res.status(404).send("Resource not found");
  }

  try {
    const deletedResource = await resource.remove();
    const deletedPermissions = await deletePermissionsForResource(
      userId,
      resourceId
    );
    return {
      message: "Resource and all its permissions successfully deleted",
      resource: deletedResource,
      permissions: deletedPermissions,
    };
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  registerNewResource,
  getAllResourcesForUser,
  getAllUsersForResource,
  updateResource,
  deleteResourceAndPermissions,
};
