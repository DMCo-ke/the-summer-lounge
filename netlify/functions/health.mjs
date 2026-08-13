import { getPool, json } from './db.mjs';
export default async function(){try{const p=await getPool(); await p.query('select 1'); return json({ok:true,service:'reservations',time:new Date().toISOString()});}catch(e){console.error(e);return json({ok:false,error:'Database unavailable'},503)}}
