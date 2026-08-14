import {json,body,getPool,clean} from './db.mjs';
import {requireRole,hashPassword} from './auth.mjs';
const roles=['manager','staff'];
const canManage=(u,targetRole)=>u?.role==='owner'||(u?.role==='manager'&&targetRole==='staff');
export default async function(req){
 const user=requireRole(req,['owner','manager']); if(!user)return json({error:'Unauthorized'},401); if(user===false)return json({error:'Forbidden'},403);
 const p=await getPool();
 if(req.method==='GET'){const {rows}=await p.query(`SELECT id,name,email,username,role,active,last_login,created_at,updated_at FROM staff_users ORDER BY CASE role WHEN 'manager' THEN 1 ELSE 2 END,name`); return json({users:rows});}
 if(req.method==='POST'){
  const x=await body(req),name=clean(x.name,120),email=clean(x.email,160).toLowerCase(),username=clean(x.username,60).toLowerCase(),password=String(x.password||''),role=clean(x.role,20);
  if(!name||!email||!username||password.length<8||!roles.includes(role))return json({error:'Name, email, username, role and a password of at least 8 characters are required.'},400);
  if(!canManage(user,role))return json({error:'Managers can only create Staff accounts.'},403);
  try{const hash=await hashPassword(password);const r=await p.query(`INSERT INTO staff_users(name,email,username,password_hash,role,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,email,username,role,active,created_at`,[name,email,username,hash,role,user.sub==='owner'?null:user.sub]);return json({ok:true,user:r.rows[0]},201)}catch(e){if(e.code==='23505')return json({error:'That email or username is already in use.'},409);console.error(e);return json({error:'Could not create account.'},500)}
 }
 if(req.method==='PATCH'){
  const x=await body(req),id=clean(x.id,80),targetRole=clean(x.role,20),name=x.name!==undefined?clean(x.name,120):null,email=x.email!==undefined?clean(x.email,160).toLowerCase():null,username=x.username!==undefined?clean(x.username,60).toLowerCase():null,active=x.active===undefined?null:Boolean(x.active),newPassword=x.password===undefined?'':String(x.password);
  if(!id)return json({error:'Account id required.'},400); const existing=(await p.query('SELECT * FROM staff_users WHERE id=$1',[id])).rows[0]; if(!existing)return json({error:'Account not found.'},404); if(!canManage(user,targetRole||existing.role))return json({error:'You do not have permission to change this account.'},403);
  if(user.sub===id)return json({error:'Use your profile/password controls to change your own account.'},400);
  if(targetRole && !roles.includes(targetRole))return json({error:'Invalid role.'},400);
  if(newPassword && newPassword.length<8)return json({error:'New passwords must be at least 8 characters.'},400);
  try{let q=`UPDATE staff_users SET name=COALESCE($1,name),email=COALESCE($2,email),username=COALESCE($3,username),role=COALESCE($4,role),active=COALESCE($5,active),updated_at=NOW()`;const vals=[name,email,username,targetRole||null,active]; if(newPassword){q+=`,password_hash=$6`;vals.push(await hashPassword(newPassword));} q+=' WHERE id=$'+(vals.length+1)+' RETURNING id,name,email,username,role,active,last_login,created_at,updated_at'; vals.push(id);const r=await p.query(q,vals);return json({ok:true,user:r.rows[0]});}catch(e){if(e.code==='23505')return json({error:'That email or username is already in use.'},409);console.error(e);return json({error:'Could not update account.'},500)}
 }
 return json({error:'Method not allowed'},405);
}
