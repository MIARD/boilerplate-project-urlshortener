require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const url = require('url'); 
const dns = require('dns');
const sha1 = require('sha1');


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  url:{type:String, required:true},
  key:{type:String, required:true}
})

const UrlModel= mongoose.model('url',urlSchema);
// console.log(mongoose.connection.readyState)
// console.log(process.env.MONGO_URI)
// console.log(mongoose)
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new',(req,res)=>{
  let original_url = req.body.url;
  let parseUrl = url.parse(original_url);
  let reg = /http(s)?\:\/\/[a-zA-Z0-9-]{3,}\.[a-zA-Z0-9-]{3,}(\.[a-zA-Z0-9-]{3,})+(\/[a-zA-Z0-9&?=_-]{1,})*/;
  if(!reg.test(original_url)){
     res.json({ error: 'invalid url'});
  }
  else{
  dns.lookup(parseUrl.hostname,(err,address, family)=>{
    if(err){
      res.json({ error: 'invalid url' });
    }
    else{
      // let short_url = Math.floor(Math.random()*10000).toString();
      let short_url = sha1(original_url);
      var newUrl = new UrlModel({url:original_url,key:short_url});
      newUrl.save((err,data)=>{
        if(err) return console.error(err)
        res.json({original_url:original_url,short_url:short_url});
      })
    }
  })

}
})

app.get('/api/shorturl/:key',(req,res)=>{
  UrlModel.findOne({key:req.params.key},(err,data)=>{
    if(err) return console.error(err);
    res.redirect(data.url);

  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
