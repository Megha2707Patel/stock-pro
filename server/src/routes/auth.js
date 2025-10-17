import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

router.post("/signup", async (req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({error:"Missing fields"});
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email in use" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, watchlist: [] });
  const token = jwt.sign({ uid:user._id }, process.env.JWT_SECRET, { expiresIn:"7d" });
  res.cookie("token", token, { httpOnly:true, sameSite:"lax" });
  res.json({ ok:true });
});

router.post("/login", async (req,res)=>{
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if(!user) return res.status(401).json({ error:"Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({ error:"Invalid credentials" });
  const token = jwt.sign({ uid:user._id }, process.env.JWT_SECRET, { expiresIn:"7d" });
  res.cookie("token", token, { httpOnly:true, sameSite:"lax" });
  res.json({ ok:true });
});

router.get("/me", async (req,res)=>{
  try{
    const token = req.cookies.token;
    if(!token) return res.status(401).json({ error:"No token" });
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(uid).select("email watchlist");
    res.json(user);
  }catch{
    res.status(401).json({ error:"Bad token" });
  }
});

export default router;
