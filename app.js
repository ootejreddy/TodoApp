//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const _ = require("lodash");

mongoose
  .connect("mongodb://localhost:27017/todolistDB")
  .then((res) => {
    console.log("CONNECTED to database");
  })
  .catch((err) => {
    console.log(err);
  });

const todoSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", todoSchema);
const defaultItems = [
  { name: "Hit + button to add the new item" },
  { name: "<--- Hit button to add the new item" },
];

const listSchema = mongoose.Schema({
  name: String,
  items: [todoSchema],
});

const List = mongoose.model("List", listSchema);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const items = await Item.find({});
  // console.log(items.length);
  // if (items.length === 0) {
  //   Item.insertMany(defaultItems)
  //     .then((res) => {
  //       console.log("successfully save to the database");
  //       console.log(res);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  //   res.redirect("/");
  // } else {
  //   res.render("list", { listTitle: "Today", newListItems: items });
  // }
  res.render("list", { listTitle: "Today", newListItems: items });
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, async (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        await list.save();
        res.redirect(`/${customListName}`);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
        console.log("exists");
      }
    }
  });
  // console.log(list);
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list.slice(0, -1);
  console.log(listName);

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    await item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, async (err, foundList) => {
      foundList.items.push(item);
      await foundList.save();
      res.redirect(`/${listName}`);
    });
  }
  // console.log(item);
});

app.post("/delete", async (req, res) => {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  if (listName == "Today") {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect(`/${listName}`);
  }
});

app.listen(4000, function () {
  console.log("Server started on port 4000");
});
