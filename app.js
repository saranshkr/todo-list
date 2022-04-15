
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");

const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);

// const item1 = new Item ({
//     name: "First Task"
// });
// const item2 = new Item ({
//     name: "Second Task"
// });
// const item3 = new Item ({
//     name: "Third Task"
// });

// const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems, (err) => {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log("Successfully saved items to database");
//     }
// });

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

const today = date.getDate();

app.get("/", function(req, res) {    
    Item.find({}, function(err, foundItems) {
        res.render("list", {listTitle: today, newListItems: foundItems});
    });

});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item ({
        name: itemName
    });

    if (listName === today) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });        
    }
});


app.post("/checkOff", function(req, res) {
    const listName = req.body.listName;
    const checkedItemId = req.body.checkbox;
    if (listName === today) {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});


app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: []
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
    // res.render("list", {listTitle: req.params.customListName, newListItems: [{}]});
});

// app.post("/work", function(req, res) {
//     const item = req.body.newItem;
//     workItems.push(item);
//     res.redirect("/work");
// })


app.get("/about", function(req, res) {
    res.render("about");
})


app.listen(3000, function() {
    console.log("Server running on port 3000.");
});