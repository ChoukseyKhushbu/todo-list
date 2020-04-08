const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

mongoose.connect("mongodb+srv://admin:test123@cluster0-vahgv.mongodb.net/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = new mongoose.Schema({
  name : String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do list."
});

const item2 = new Item({
  name: "Hit the + button to add a new Item."
});

const item3 = new Item({
  name: "<--- Check the box to delete the item."
});

const defaultItems = [item1,item2,item3];

const listSchema = mongoose.Schema({
  name : String,
  items : [itemsSchema]
});

const List = mongoose.model("List",listSchema);


app.get("/favicon.ico", function(req, res){
    res.sendStatus(204);
});

app.get('/',function(req,res){

  Item.find({},function(err,itemsFound){
    if(err){
        console.log(err);
    }else{

      if(itemsFound.length ===0){
        Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          }else{
            console.log("successfully added");
          }
        });
        res.redirect("/");
      }
      console.log(itemsFound);
      res.render('list',{listTitle:"Today",newListItems:itemsFound});
    }
  });
});

app.get('/:customlistName',function(req,res){
  const customlistName = _.capitalize(req.params.customlistName);

  List.findOne({name:customlistName},function(err,listFound){
    if(!err){
      if(!listFound){
        const list = new List({
          name: customlistName,
          items: defaultItems
        });
        list.save();
        res.redirect('/'+customlistName);
      }
      else{
          if(listFound.items.length==0){
            console.log(listFound.items.length);
            listFound.items.push(...defaultItems);
            listFound.save(function(){
              res.redirect("/"+customlistName);
            });
            
          }
          else{
            console.log(listFound);
            res.render('list',{listTitle:listFound.name,newListItems: listFound.items});
          }
        
      }
    }
  });


});

app.post('/',function(req,res){

  const itemName =req.body.newItem;
  const listName =req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save(function(){
      res.redirect("/");
    }) 
    
  }
  else{
    // List.findOne({name: listName}, function(err, listFound){
    //   if(!err){
    //     listFound.items.push(newItem);
    //     listFound.save();
    //     res.redirect("/"+listName)
    //   }
    // })
    List.findOneAndUpdate({name:listName},{$push: {items: newItem}},function(err){
      if(!err){
            res.redirect("/"+listName);
      }
    })
  }
})

app.post("/delete",function(req,res){
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedId,function(err){
      if(err){
        console.log(err)
      }else{
        console.log("success");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedId}}},function(err){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

})


app.listen(process.env.PORT || 3000,function(){
  console.log("Server started listening at port 3000.");
});
