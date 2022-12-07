const express = require("express");
const router = express.Router();
const { itemsDL, userDL } = require("../data");
const { checkId, helpers, validations } = require("../utils/helpers");
const { itemImageUpload } = require("../utils/multer");
const { ObjectId } = require("mongodb");

router.route("/listing").get(async (req, res) => {
  // item listing page - paginated
  return res.send("NOT IMPLEMENTED");
});

router.route("/my-listings").get(async (req, res) => {
  // my listing page - paginated
  return res.send("NOT IMPLEMENTED");
});

router
  .route("/add")
  .get(async (req, res) => {
    // create item page
    return res.render("item/create", {
      action: `/items/add`,
      metaData: {
        dateLostOrFound: {
          max: helpers.getDate(new Date()),
          min: helpers.getDate(
            new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          ),
        },
      },
    });
  })
  .post(
    (req, res, next) => itemImageUpload(req, res, next),
    async (req, res) => {
      let itemObj;
      try {
        itemObj = req.body;
        itemObj.picture = req?.file?.path;
      } catch (e) {
        console.log(e);
        return res.status(500).send(new Error(e.message));
      }

      try {
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
      } catch (e) {
        console.log(e);
        return res.status(400).send(new Error(e.message));
      }

      try {
        const newItem = await itemsDL.createItem(itemObj);
        return res.send({
          success: true,
          message: "Item created!",
          data: newItem,
        });
      } catch (e) {
        console.log(e);
        return res.status(500).send(new Error(e.message));
      }
    }
  );

router
  .route("/edit/:id")
  .get(async (req, res) => {
    // edit item page
    let itemId;
    try {
      id = checkId(req.params.id, "Item ID");
    } catch (e) {
      return res.status(400).send(new Error(e.message));
    }

    try {
      // TODO replace dummy
      // let item = await itemsDL.getItemById(itemId);
      let item = {
        type: "found",
        name: "Pear Dao",
        description: "abcd",
        picture: "uploads/1669571684253_ReadyPlayerMe-Avatar.png",
        dateLostOrFound: helpers.getDate(new Date(1667580840000)),
        lostOrFoundLocation: "babio",
        comments: [],
        isClaimed: false,
        createdAt: 1669571707850,
        createdBy: "",
        updatedAt: 1669571707850,
        updatedBy: "",
      };

      return res.render("item/edit", {
        action: `/items/edit/${itemId}`,
        item,
        metaData: {
          dateLostOrFound: {
            max: helpers.getDate(new Date()),
            min: helpers.getDate(
              new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            ),
          },
        },
      });
    } catch (e) {
      res.status(404).json({ error: "Item not found" });
    }
  })
  .put(
    (req, res, next) => itemImageUpload(req, res, next),
    async (req, res) => {
      itemImageUpload(req, res, function (err) {
        if (err) {
          console.log("cs " + err);
          return;
        }
      });

      let itemId, itemObj;

      try {
        itemObj = req.body;
        itemObj.picture = req?.file?.path;
      } catch (e) {
        console.log(e);
        return res.status(500).send(new Error(e.message));
      }

      try {
        itemId = checkId(req.params.id, "Item ID");

        if (!validations.isNameValid(itemObj?.name)) {
          throw new Error("Name field needs to have valid value");
        }
        if (!validations.isDateValid(itemObj?.dateLostOrFound)) {
          throw new Error("Date field needs to have valid value");
        }
        if (!validations.isLocationValid(itemObj?.lostOrFoundLocation)) {
          throw new Error("Location field needs to have valid value");
        }
      } catch (e) {
        console.log(e);
        return res.status(400).send(new Error(e.message));
      }

      try {
        itemById = await itemsDL.getMovieById(movieId);
      } catch (e) {
        return res.status(404).json({ error: "Item not found" });
      }

      // TODO uncomment
      // if (helpers.compareItemObjects(itemById, itemObj)) {
      //   return res
      //     .status(400)
      //     .json({ error: "Please change atleast 1 value to update" });
      // }

      try {
        const updatedItem = await itemsDL.updateItem(itemId, itemObj);
        return res.json({
          success: true,
          message: "Item updated!",
          data: updatedItem,
        });
      } catch (e) {
        return res.status(500).send(new Error(e.message));
      }
    }
  );

router.route("/:id/comment").post(async (req, res) => {
  let id = req.params.id;
  let comment = req.body.comment;
  try {
    id = checkId(id, "Item ID");
  } catch (e) {
    return res.status(400).send(new Error(e.message));
  }
  try {
    let item = await itemsDL.createComment(comment, id);
    return res.redirect("/items/" + id);
  } catch (e) {
    console.log(e);
    return res.status(500).send(new Error(e.message));
  }
});

router.route("/:id/status").put(async (req, res) => {
  // update isClaimed status
});

router
  .route("/:id")
  .get(async (req, res) => {
    // item page
    let id = req.params.id;
    let user;
    try {
      id = checkId(id, "Item ID");
    } catch (e) {
      return res.status(400).send(new Error(e.message));
    }

    let item;
    try {
      item = await itemsDL.getItemById(id);
      let allUsers = await userDL.getAllUsers();
      item.comments = item.comments.map((c) => {
        for (u of allUsers) {
          if (u._id === c.createdBy.toString()) {
            c = { ...c, userInfo: u };
            break;
          }
        }
        return { ...c, createdAt: new Date(c.createdAt).toUTCString() };
      });

      let userId = item.createdBy.toString();
      userId = checkId(userId, "User ID");
      user = await userDL.getUserById(userId);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Internal Server Error");
    }

    return res.render("item/view", {
      title: "Item Page",
      item: item,
      user: user,
      date: new Date(item.dateLostOrFound),
      action: `/items/${id}/comment`,
    });
  })
  .delete(async (req, res) => {
    // delete item
    let id = req.params.id;
    try {
      id = checkId(id, "Item ID");
    } catch (e) {
      return res.status(400).send(new Error(e.message));
    }
    try {
      let item = await itemsDL.getItemById(id);
    } catch (e) {
      return res.status(404).send("item not found");
    }

    try {
      let item = await itemsDL.deleteItem(id);
      return res.send(item);
    } catch (e) {
      return res.status(500).send("Internal server errror");
    }
  });

module.exports = router;
