const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require("express-session");
// 若需用 mongodb _id 抓取單筆資料 需 require('mongodb').Objectid
// 再用let _id = new ObjectID(_id);
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config({path:__dirname+'/.env.process'});

let port = process.env.PORT || 5000;

// express-session ---------------
// trust first proxy
app.set('trust proxy', 1);
app.use(session({
  secret: 'toyLottery',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(process.cwd(),"public"),{index:"index.html"}));

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = 'lotteryData';
// response
const responseOk = {'response': 'ok'};
const responseError = {'response': 'error'};

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log('http://locatlost:' + port);
});

// 驗正是否登入
app.get('/', function (req, res) {
  if(req.session.login){
    res.send(responseOk);
  }else{
  res.send(responseError);
  }
});

app.post('/user/checklogin', (req, res) => {
  if(req.session.login) {
    res.send(responseOk);
  } else {
    res.send(responseError);
  }
});


app.post('/test', (req, res) => {
  let data = req.body;
  console.log(data);
  res.send(responseOk);
});
// sign up
app.post('/user/createUser', (req, res) => {
  let data = req.body;

  MongoClient.connect(url,  {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    const col = client.db(dbName).collection('loginCol');
    col.find({role: data.user}).toArray((err,result) => {
        if(result[0]) {
          res.send(responseError);
        } else {
          col.insertMany([{role: data.user, password: data.password}], () => {
              res.send(responseOk);
          });
        }
        client.close();
    });
  });
});

app.post('/user/login', (req, res) => {
  let data = req.body;
  MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}
    , (err, client) => {
    const col = client.db(dbName).collection('loginCol');
    col.find({password: data.password}).toArray((err, result) => {
      if(result[0]) {
        req.session['login'] = true;
        res.send(responseOk);
      } else {
        res.send(responseError);
      }
      client.close();
    });
  });
});   

app.post('/user/logout', (req, res) => {
  req.session.destroy(); // 刪除登入狀態
  res.send(responseOk);
});

// Read lottery list
app.get('/lotteryData',(req, res) => {
  MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    const col = client.db(dbName).collection('lotteryLists');
    col.find().toArray((err, result) => {
      res.send(result);
      client.close();
    });
  });
});
// Create lottery
app.post('/lotteryData', (req, res) => {
  let obj = req.body;

  MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    const col = client.db(dbName).collection('lotteryLists');
    col.insertMany([obj], (result) => {
      res.send(responseOk);
      client.close();
    });
  });
});
// Update lottery
app.put('/lotteryData', (req, res) => {
  let obj = req.body;
  let obj_id = new ObjectId(obj._id);

  MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    const col = client.db(dbName).collection('lotteryLists');
    let setData = {
      $set: {
        item: obj.item,
        price: obj.price,
        time: obj.time,
        date: obj.date,
        url: obj.url,
        isLottery: obj.isLottery,
        notify: obj.notify,
        remarks: obj.remarks
      }
    };
    col.updateOne({'_id':obj_id}, setData, (err, result)=>{
      res.send(responseOk);
      client.close();
    })
  });
});
// Delete lottery
app.delete('/lotteryData', (req, res) => {
  let obj = req.body.obj;
  let obj_id = new ObjectId(obj._id);

  MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    const col = client.db(dbName).collection('lotteryLists');
    col.deleteOne({'_id':obj_id}, (err, result)=>{
      res.send(responseOk);
      client.close();
    })
  });
});