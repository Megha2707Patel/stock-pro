import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const router = Router();

function auth(req,res,next){
  try{
    const token = req.cookies.token;
    if(!token) return res.status(401).json({ error:"No token" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch{ res.status(401).json({ error:"Bad token" }); }
}

router.get("/", auth, async (req,res)=>{
  const me = await User.findById(req.user.uid).select("watchlist");
  res.json(me.watchlist || []);
});

router.post("/", auth, async (req,res)=>{
  const { symbol } = req.body;
  if(!symbol) return res.status(400).json({ error:"symbol required" });
  const me = await User.findById(req.user.uid);
  if(!me.watchlist.includes(symbol)) me.watchlist.push(symbol);
  await me.save();
  res.json({ ok:true });
});

export default router;
