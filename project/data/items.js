const { ObjectId } = require("mongodb");
const { helpers, validations, checkId } = require("../utils/helpers");
const { Item } = require("./models/item.model");
const { Comment } = require("./models/comment.model");
const { itemsCollection } = require("../config/mongoCollections");

const getItemById = async (id) => {
  // TODO
  var itemId = checkId(id, "invalid item id");

  var items = await itemsCollection();
  var obj = await items.findOne({ _id: ObjectId(itemId) });
  if (obj === null) throw new Error("No item with that id");

  return obj;
};

const createItem = async (itemObj) => {
  if (!validations.isNameValid(itemObj?.name)) {
    throw new Error("Name field needs to have valid value");
  }
  itemObj.type = validations.isTypeValid(itemObj?.type);
  if (!itemObj.type) {
    throw new Error("Type field needs to have valid value");
  }
  if (!validations.isDateValid(itemObj?.dateLostOrFound)) {
    throw new Error("Date field needs to have valid value");
  }
  if (!validations.isLocationValid(itemObj?.lostOrFoundLocation)) {
    throw new Error("Location field needs to have valid value");
  }

  const newItem = new Item(itemObj);
  const itemDB = await itemsCollection();
  const insertInfo = await itemDB.insertOne(newItem);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw "Could not add item";

  const added = { ...newItem, _id: insertInfo.insertedId.toString() };
  return new Item().deserialize(added);
};

const updateItem = async (id, itemObj) => {
  if (!validations.isNameValid(itemObj?.name)) {
    throw new Error("Name field needs to have valid value");
  }
  if (!validations.isDateValid(itemObj?.dateLostOrFound)) {
    throw new Error("Date field needs to have valid value");
  }
  if (!validations.isLocationValid(itemObj?.lostOrFoundLocation)) {
    throw new Error("Location field needs to have valid value");
  }
  if (!validations.isPictureValid(itemObj?.picture)) {
    delete itemObj.picture;
  }

  // TODO uncomment
  // const itemById = await getItemById(id);
  // if (helpers.compareItemObjects(itemById, itemObj)) {
  //   throw "Please change atleast 1 value to update";
  // }

  const itemDB = await itemsCollection();
  const updateInfo = await itemDB.updateOne(
    { _id: ObjectId(id) },
    { $set: itemObj }
  );
  if (!updateInfo.matchedCount && !updateInfo.modifiedCount)
    throw "Update failed";

  return await getItemById(id);
};

const deleteItem = async (id) => {
  var itemId = checkId(id, "invalid item id");

  var items = await itemsCollection();
  var deletionInfo = await items.deleteOne({ _id: ObjectId(itemId) });

  if (deletionInfo.deletedCount === 0) {
    throw new Error("error in delete");
  }
  return true;
};

const createComment = async (comment, id) => {
  id = checkId(id, "ID");
  const item = await getItemById(id);

  if (!helpers.isStringValid(comment)) {
    throw new Error("comment field needs to have valid value");
  }

  let obj = new Comment(comment);
  item.comments.push(obj);

  const items = await itemsCollection();
  const updateInfo = await items.updateOne(
    { _id: ObjectId(id) },
    { $set: { comments: item.comments } }
  );

  if (!updateInfo.matchedCount && !updateInfo.modifiedCount)
    throw "Update failed";

  return await getItemById(id);
};

module.exports = {
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  createComment,
};
