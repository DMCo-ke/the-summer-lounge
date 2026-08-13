import { getConnectionString } from '@netlify/database';
import pg from 'pg';
const { Pool } = pg;
let pool;
export async function getPool(){
  if(!pool){ pool = new Pool({ connectionString: await getConnectionString(), max: 4, idleTimeoutMillis: 10000 }); }
  return pool;
}
export async function withClient(fn){
  const p=await getPool(); const client=await p.connect();
  try{return await fn(client);} finally{client.release();}
}
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}})}
export function method(req,m){return req.method.toUpperCase()===m}
export async function body(req){try{return await req.json()}catch{return {}}}
export function clean(v,max=500){return String(v??'').trim().slice(0,max)}
export function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v+'T00:00:00').getTime())}
export function validTime(v){return /^\d{2}:\d{2}$/.test(v)}
export function to24(v){
  const s=String(v||'').trim(); if(validTime(s)) return s;
  const m=s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if(!m) return null;
  let h=Number(m[1]); const min=m[2]; const ap=m[3].toUpperCase(); if(h===12)h=0; if(ap==='PM')h+=12; return `${String(h).padStart(2,'0')}:${min}`;
}
export function addMinutes(time,mins){const [h,m]=time.split(':').map(Number); const total=h*60+m+mins; return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
export function confirmation(){return 'TSL-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-4).toUpperCase()}
