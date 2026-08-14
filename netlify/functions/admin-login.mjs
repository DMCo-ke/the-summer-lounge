import crypto from 'node:crypto';
import { json, body, getPool } from './db.mjs';
import { sign } from './auth.mjs';

const scryptAsync=(password,salt)=>new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,{N:16384,r:8,p:1},(e,d)=>e?reject(e):resolve(d)));
async function verifyPassword(password,stored){
  try{const [salt,b64]=String(stored||'').split('$'); if(!salt||!b64)return false; const derived=await scryptAsync(password,salt); return crypto.timingSafeEqual(derived,Buffer.from(b64,'base64'));}catch{return false}
}
export default async function(req){
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  const x=await body(req); const identifier=String(x.identifier||x.username||x.email||'').trim().toLowerCase(); const password=String(x.password||'');
  if(!process.env.ADMIN_SECRET)return json({error:'Authentication is not configured.'},503);
  const pool=await getPool();
  try{
    // The existing Netlify ADMIN_PASSWORD remains the emergency/owner bootstrap login.
    if(process.env.ADMIN_PASSWORD && password===process.env.ADMIN_PASSWORD && (!identifier || identifier==='owner' || identifier==='admin')){
      return json({ok:true,token:sign({role:'owner',userId:null,fullName:'Owner',username:'owner'}),user:{role:'owner',fullName:'Owner',username:'owner',mustChangePassword:false}});
    }
    if(!identifier||!password)return json({error:'Enter your username/email and password.'},400);
    const {rows}=await pool.query(`SELECT * FROM staff_users WHERE active=true AND (LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($1)) LIMIT 1`,[identifier]);
    const user=rows[0]; if(!user||!user.password_hash||!(await verifyPassword(password,user.password_hash)))return json({error:'Incorrect login details.'},401);
    await pool.query('UPDATE staff_users SET last_login_at=NOW(),updated_at=NOW() WHERE id=$1',[user.id]);
    return json({ok:true,token:sign({role:user.role,userId:user.id,fullName:user.full_name,username:user.username,mustChangePassword:user.must_change_password}),user:{id:user.id,role:user.role,fullName:user.full_name,username:user.username,email:user.email,mustChangePassword:user.must_change_password}});
  }catch(e){console.error(e);return json({error:'Could not sign in.'},500)}
}
