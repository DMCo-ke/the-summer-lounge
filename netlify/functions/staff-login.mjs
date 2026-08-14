import {json,body,getPool,clean} from './db.mjs';
import {sign,verifyPassword} from './auth.mjs';
export default async function(req){
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const x=await body(req), identifier=clean(x.identifier,160).toLowerCase(), password=String(x.password||'');
 if(!identifier||!password)return json({error:'Email/username and password are required.'},400);
 if(identifier==='owner' && process.env.ADMIN_PASSWORD && password===process.env.ADMIN_PASSWORD){return json({ok:true,token:sign({sub:'owner',role:'owner',name:process.env.OWNER_NAME||'Owner',email:process.env.OWNER_EMAIL||''}),user:{id:'owner',name:process.env.OWNER_NAME||'Owner',email:process.env.OWNER_EMAIL||'',role:'owner'}})}
 const p=await getPool(); const r=await p.query(`SELECT id,name,email,username,role,password_hash,active FROM staff_users WHERE active=true AND (LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1)) LIMIT 1`,[identifier]);
 const u=r.rows[0]; if(!u || !(await verifyPassword(password,u.password_hash)))return json({error:'Incorrect login details.'},401);
 await p.query('UPDATE staff_users SET last_login=NOW(),updated_at=NOW() WHERE id=$1',[u.id]);
 return json({ok:true,token:sign({sub:u.id,role:u.role,name:u.name,email:u.email||''}),user:{id:u.id,name:u.name,email:u.email||'',username:u.username||'',role:u.role}});
}
