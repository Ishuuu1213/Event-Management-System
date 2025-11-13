const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const DATA_FILE = path.join(__dirname, 'data.json');

function readData(){
  if(!fs.existsSync(DATA_FILE)) return {users:[],vendors:[],items:[],orders:[],memberships:[]};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeData(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

// Simple seed
if(!fs.existsSync(DATA_FILE)){
  writeData({
    users: [{id:'admin', username:'admin', password:'admin', role:'admin'}],
    vendors: [],
    items: [],
    orders: [],
    memberships: []
  });
}

// Auth (very basic - for demo only)
app.post('/api/login', (req,res)=>{
  const { username, password } = req.body;
  const d = readData();
  const user = d.users.find(u=>u.username===username && u.password===password) || d.vendors.find(v=>v.username===username && v.password===password);
  if(user) return res.json({ success:true, user });
  res.status(401).json({ success:false, message:'Invalid credentials' });
});

// Admin endpoints
app.get('/api/admin/data', (req,res)=>{
  const d = readData();
  res.json(d);
});

app.post('/api/admin/addUser', (req,res)=>{
  const d = readData();
  const u = {...req.body, id: uuidv4()};
  d.users.push(u);
  writeData(d);
  res.json({success:true, user:u});
});

app.post('/api/admin/addVendor', (req,res)=>{
  const d = readData();
  const v = {...req.body, id: uuidv4()};
  d.vendors.push(v);
  writeData(d);
  res.json({success:true, vendor:v});
});

app.post('/api/admin/addMembership', (req,res)=>{
  const d = readData();
  const m = {...req.body, id: uuidv4()};
  d.memberships.push(m);
  writeData(d);
  res.json({success:true, membership:m});
});

// Vendor endpoints
app.post('/api/vendor/addItem', (req,res)=>{
  const d = readData();
  const it = {...req.body, id: uuidv4(), createdAt: new Date().toISOString()};
  d.items.push(it);
  writeData(d);
  res.json({success:true, item:it});
});

app.get('/api/vendor/items', (req,res)=>{
  const d = readData();
  res.json(d.items);
});

app.post('/api/vendor/requestItem', (req,res)=>{
  const d = readData();
  // simplistic: create an order request
  const order = { id: uuidv4(), ...req.body, status:'requested', createdAt:new Date().toISOString() };
  d.orders.push(order);
  writeData(d);
  res.json({success:true, order});
});

// User endpoints (cart/payment)
app.post('/api/user/createOrder', (req,res)=>{
  const d = readData();
  const order = { id: uuidv4(), items: req.body.items||[], user:req.body.user||null, status:'pending', total: req.body.total||0, createdAt:new Date().toISOString() };
  d.orders.push(order);
  writeData(d);
  res.json({success:true, order});
});

app.get('/api/user/orders', (req,res)=>{
  const d = readData();
  res.json(d.orders);
});

app.post('/api/user/updateOrderStatus', (req,res)=>{
  const d = readData();
  const o = d.orders.find(x=>x.id===req.body.id);
  if(!o) return res.status(404).json({success:false});
  o.status = req.body.status;
  writeData(d);
  res.json({success:true, order:o});
});

// Simple search endpoints
app.get('/api/items', (req,res)=>{
  const d = readData();
  res.json(d.items);
});

app.get('/api/vendors', (req,res)=>{
  const d = readData();
  res.json(d.vendors);
});

// Serve frontend index
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server started on', PORT));