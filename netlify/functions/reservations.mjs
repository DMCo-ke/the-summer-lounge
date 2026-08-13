import { getPool, json, body, clean, validDate, to24, addMinutes, confirmation } from './db.mjs';
function err(msg,status=400){return json({ok:false,error:msg},status)}
export default async function(req){
  if(req.method!=='POST') return err('Method not allowed',405);
  const x=await body(req);
  const name=clean(x.name,120), phone=clean(x.phone,40), email=clean(x.email,160), notes=clean(x.notes,1000), date=clean(x.date,10), time=to24(x.time), guests=Math.max(1,Math.min(30,Number(x.guests||0)));
  if(!name||!phone||!validDate(date)||!time||!guests) return err('Please complete name, phone, date, time and number of guests.');
  const today=new Date(); today.setHours(0,0,0,0); const requested=new Date(date+'T00:00:00'); if(requested<today) return err('Please choose a future date.');
  const p=await getPool(); const client=await p.connect();
  try{
    await client.query('BEGIN');
    const settings=(await client.query(`SELECT key,value FROM restaurant_settings WHERE key IN ('reservation_duration_minutes','opening_time','closing_time','auto_confirm')`)).rows.reduce((a,r)=>(a[r.key]=r.value,a),{});
    const duration=Number(settings.reservation_duration_minutes||90); const end=addMinutes(time,duration);
    if(time < settings.opening_time || end > settings.closing_time) {await client.query('ROLLBACK'); return err(`Reservations are available between ${settings.opening_time} and ${settings.closing_time}.`);}
    // Retry table allocation if a concurrent reservation wins the same table first.
    let assigned=null, status='waitlist';
    for(let attempt=0;attempt<3 && !assigned;attempt++){
      const tables=(await client.query(`SELECT t.id,t.name,t.capacity FROM restaurant_tables t WHERE t.active=true AND t.capacity >= $1 AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.table_id=t.id AND r.status IN ('pending','confirmed') AND r.reservation_date=$2::date AND r.start_time < $4::time AND r.end_time > $3::time) ORDER BY t.capacity,t.name LIMIT 1 FOR UPDATE SKIP LOCKED`,[guests,date,time,end])).rows;
      if(!tables[0]) break;
      try{const code=confirmation(); const ins=await client.query(`INSERT INTO reservations(confirmation_code,name,phone,email,guests,reservation_date,start_time,end_time,table_id,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,confirmation_code,name,phone,email,guests,reservation_date,start_time,end_time,status,notes`,[code,name,phone,email||null,guests,date,time,end,tables[0].id,settings.auto_confirm==='true'?'confirmed':'pending',notes||null]); assigned={...ins.rows[0],table_name:tables[0].name}; status=ins.rows[0].status;}catch(e){if(e.code!=='23P01') throw e;}
    }
    if(!assigned){const code=confirmation(); const ins=await client.query(`INSERT INTO reservations(confirmation_code,name,phone,email,guests,reservation_date,start_time,end_time,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'waitlist',$9) RETURNING id,confirmation_code,status`,[code,name,phone,email||null,guests,date,time,end,notes||null]); assigned=ins.rows[0];}
    await client.query('COMMIT');
    return json({ok:true,reservation:assigned,message:assigned.status==='waitlist'?'No table is currently available at that time. You have been added to the waitlist.':'Your table is reserved.'},201);
  }catch(e){await client.query('ROLLBACK'); console.error(e); return err('We could not complete the reservation. Please try again.',500)}finally{client.release()}
}
