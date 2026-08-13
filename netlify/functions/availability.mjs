import { getPool, json, clean, validDate, validTime, to24, addMinutes } from './db.mjs';
export default async function(req){
  if(req.method!=='GET') return json({error:'Method not allowed'},405);
  const u=new URL(req.url); const date=clean(u.searchParams.get('date'),10); const time=to24(u.searchParams.get('time')); const guests=Math.max(1,Math.min(30,Number(u.searchParams.get('guests')||2)));
  if(!validDate(date)||!time||!validTime(time)) return json({error:'Valid date and time are required.'},400);
  const end=addMinutes(time,90); const p=await getPool();
  const {rows}=await p.query(`
    SELECT t.id,t.name,t.capacity,
      NOT EXISTS(SELECT 1 FROM reservations r WHERE r.table_id=t.id AND r.status IN ('pending','confirmed') AND r.reservation_date=$1::date AND r.start_time < $3::time AND r.end_time > $2::time) AS available
    FROM restaurant_tables t WHERE t.active=true AND t.capacity >= $4 ORDER BY t.capacity,t.name`,[date,time,end,guests]);
  return json({date,time,endTime:end,guests,available:rows.some(r=>r.available),tables:rows.map(r=>({name:r.name,capacity:r.capacity,available:r.available}))});
}
