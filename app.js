require('dotenv').config()
const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")
const app = express();
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');
app.use(express.urlencoded())
app.use(express.static("public"));
mongoose.set('strictQuery', false)

const connectDB = async() => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch(err) {
    console.log(err)
    process.exit(1)
  }
}

const {Schema, model} = mongoose

const itemsSchema = new Schema({
  name: {
    type: String,
    required: [1, "Please enter your item name"]
  }
})

const listsSchema = new Schema({
  name: String,
  items: [itemsSchema]
})

const Item = model("Item", itemsSchema)
const List = model("List", listsSchema)

const item1 = new Item({
  name: "Welcome to your to do list!"
})

const item2 = new Item({
  name: "Enter your new item and hit +"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item!"
})

const defaultItems = [item1, item2, item3]
const day = date.getDate();

//if it's the first time render the page, it insert default items into database
//if it's not the first time, fetch data from database and render
app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {
    if (!err) {
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err)
          } else {
            console.log("Items inserted")
          }
        })
        res.redirect("/")
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    }
  })

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list
  const newItem = new Item({
    name: item
  })
  if (listName == day) {
    newItem.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      if (!err) {
          foundList.items.push(newItem)
          foundList.save()
      }
      res.redirect(`/${listName}`)
    })
  }
});

//implement the delete item function based on the id
app.post("/delete", (req, res) => {
  const itemId = req.body.checkbox
  const listName = req.body.listName
  if (listName == day) {
    Item.findByIdAndRemove(itemId, (err) => {
      if (!err) {
        console.log("Successfully deleted")
      }
      res.redirect("/")
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, (err) => {
      if (!err) {
        res.redirect(`/${listName}`)
      }
    })
  }
})

//implement several pages for todo list, if there is a page exits, render the page
// otherwise, create a new one
app.get("/:listName", function(req,res){
  const listName = _.capitalize(req.params.listName)
  List.findOne({name: listName}, (err, foundList) => {
    if (!err) {
      if (foundList) {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        const newList = new List({
          name: listName,
          items: defaultItems
        })
        newList.save()
        res.redirect(`/${listName}`)
      }
    }
  })
});

connectDB().then(() => {
  app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}`);
  });
}) 
