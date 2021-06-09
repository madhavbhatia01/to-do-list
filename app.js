//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(process.env.SECRET, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const day = date.getDate();

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist !"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1 , item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length == 0){
      Item.insertMany(defaultItems , function(err){
        if(err){console.log(err);}
        else{
          console.log("Saved default items ");
        }
      });
      res.redirect("/");
        }else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }

  })

});

app.get("/:newList" , function(req,res){

  const newListName = _.capitalize(req.params.newList);

List.findOne({name: newListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      const list = new List({
        name: newListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+ newListName);
    }else{
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
})

})

app.post("/", function(req, res){
  const item = new Item({
    name : req.body.newItem
  });

  if(req.body.list == day){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: req.body.list}, function(err, foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + req.body.list);
      }
    })
  }

});

app.post("/delete", function(req,res){
  const listName  = req.body.listName;

  if(listName == day){
    Item.deleteOne({_id: req.body.checkbox}, function(err){
      if(err){console.log(err);}
      else{
        console.log("Succesfully deleted !");
        res.redirect("/");
      }
    })
  }else{
     List.findOneAndUpdate({name: listName}, {$pull :{items: {_id: req.body.checkbox}}}, function(err, foundList){
       if(!err){
         res.redirect("/"+ listName);
       }
     })
  }
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
