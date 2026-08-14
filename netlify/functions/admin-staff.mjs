import crypto from 'node:crypto';
import {getPool,json,body,clean} from './db.mjs';
import {authUser,hasRole} from './auth.mjs';
const scryptAsync=(password,salt)=>new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,{N:16384,r:8,p:1},(e,d)=>e?reject(e):resolve(d)));
async function hashPassword(password){const salt=crypto.randomBytes(16).toString('hex');const d=await scryptAsync(password,salt);return `${salt}$${d.toString('base64')}`}
function deny(){return json({error:'You do not have permission to manage staff accounts.'},403)}
export default async function(req){
 const user=authUser(req); if(!user)return json({error:'Unauthorized'},401); if(!hasRole(user,['owner','manager']))return deny();
 const p=await getPool();
 if(req.method==='GET'){
  const q=await p.query(`SELECT id,full_name,username,email,role,active,must_change_password,last_login_at,created_at FROM staff_users ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END, full_name`);
  return json({staff:q.rows});
 }
 if(req.method==='POST'){
  const x=await body(req); const fullName=clean(x.fullName,120),username=clean(x.username,80).toLowerCase(),email=clean(x.email,160).toLowerCase()||null,password=String(x.password||''),role=clean(x.role,20);
  if(!fullName||!username||!password||!['manager','staff'].includes(role))return json({error:'Name, username, password and a valid role are required.'},400);
  if(user.role==='manager'&&role!=='staff')return deny();
  if(password.length<8)return json({error:'Temporary password must be at least 8 characters.'},400);
  try{const h=await hashPassword(password);const r=await p.query(`INSERT INTO staff_users(full_name,username,email,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,$5,true) RETURNING id,full_name,username,email,role,active,must_change_password,created_at`,[fullName,username,email,h,role]);return json({ok:true,staff:r.rows[0]},201)}catch(e){if(e.code==='23505')return json({error:'That username or email is already in use.'},409);console.error(e);return json({error:'Could not create account.'},500)}
 }
 if(req.method==='PATCH'){
  const x=await body(req);const id=String(x.id||'');if(!id)return json({error:'Account id required.'},400);
  const existing=(await p.query('SELECT * FROM staff_users WHERE id=$1',[id])).rows[0];if(!existing)return json({error:'Account not found.'},404);
  if(existing.role==='owner')return deny(); if(user.role==='manager'&&existing.role!=='staff')return deny();
  const updates=[];const vals=[];const add=(sql,v)=>{vals.push(v);updates.push(sql.replace('?',`$${vals.length}`))};
  if(x.fullName!==undefined)add('full_name=?',clean(x.fullName,120)); if(x.email!==undefined)add('email=?',clean(x.email,160).toLowerCase()||null); if(x.active!==undefined)add('active=?',Boolean(x.active));
  if(x.role!==undefined){const role=clean(x.role,20);if(!['manager','staff'].includes(role)||(user.role==='manager'&&role!=='staff'))return deny();add('role=?',role)}
  if(x.password){if(String(x.password).length<8)return json({error:'Password must be at least 8 characters.'},400);add('password_hash=?',await hashPassword(String(x.password)));add('must_change_password=?',true)}
  if(!updates.length)return json({ok:true}); vals.push(id); const r=await p.query(`UPDATE staff_users SET ${updates.join(',')},updated_at=NOW() WHERE id=$${vals.length} RETURNING id,full_name,username,email,role,active,must_change_password,last_login_at,created_at`,vals);return json({ok:true,staff:r.rows[0]});
 }
 return json({error:'Method not allowed'},405)
}
