import {getPool,json,body,clean,to24,validDate,addMinutes} from './db.mjs';
import {verifyReservationToken} from './reservation-token.mjs';
import {sendEmail,reservationEmail} from './notifications.mjs';

function fail(msg,status=400){return json({ok:false,error:msg},status)}
function tokenFrom(req){const u=new URL(req.url);return u.searchParams.get('token')||''}
async function getReservation(client,id){const r=await client.query(`SELECT r.*,t.name AS table_name FROM reservations r LEFT JOIN restaurant_tables t ON t.id=r.table_id WHERE r.id=$1`,[id]);return r.rows[0]||null}
function manageUrl(token){const base=process.env.PUBLIC_SITE_URL || ''; return `${base.replace(/\/$/,'')}/manage-reservation.html?token=${encodeURIComponent(token)}`}

export default async function(req){
  const token=tokenFrom(req); const p=verifyReservationToken(token);
  if(!p?.id)return fail('This reservation link is invalid or has expired.',401);
  const pool=await getPool();
  if(req.method==='GET'){
    const c=await pool.connect(); try{const r=await getReservation(c,p.id); if(!r)return fail('Reservation not found.',404); return json({ok:true,reservation:safe(r)});}finally{c.release()}
  }
  if(req.method!=='POST')return fail('Method not allowed',405);
  const x=await body(req); const action=clean(x.action,20);
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    const r=await getReservation(c,p.id); if(!r){await c.query('ROLLBACK');return fail('Reservation not found.',404)}
    if(['cancelled','completed','no_show'].includes(r.status)){await c.query('ROLLBACK');return fail(`This reservation is already ${r.status.replace('_',' ')}.`)}
    if(action==='cancel'){
      const upd=await c.query(`UPDATE reservations SET status='cancelled',updated_at=NOW() WHERE id=$1 RETURNING *`,[p.id]);
      await c.query('COMMIT');
      if(r.email){const u=manageUrl(token); const mail=reservationEmail({reservation:{...r,...upd.rows[0]},manageUrl:u,action:'cancelled'}); await sendEmail({to:r.email,subject:`Reservation ${r.confirmation_code} cancelled`,...mail});}
      return json({ok:true,message:'Your reservation has been cancelled.'});
    }
    if(action==='reschedule'){
      const date=clean(x.date,10), time=to24(x.time); if(!validDate(date)||!time){await c.query('ROLLBACK');return fail('Please choose a valid date and time.')}
      const settings=(await c.query(`SELECT key,value FROM restaurant_settings WHERE key IN ('reservation_duration_minutes','opening_time','closing_time')`)).rows.reduce((a,z)=>(a[z.key]=z.value,a),{});
      const duration=Number(settings.reservation_duration_minutes||90), end=addMinutes(time,duration);
      if(time<settings.opening_time||end>settings.closing_time){await c.query('ROLLBACK');return fail(`Reservations are available between ${settings.opening_time} and ${settings.closing_time}.`)}
      const table=(await c.query(`SELECT t.id,t.name,t.capacity FROM restaurant_tables t WHERE t.active=true AND t.capacity >= $1 AND NOT EXISTS(SELECT 1 FROM reservations z WHERE z.table_id=t.id AND z.status IN ('pending','confirmed') AND z.id<>$2 AND z.reservation_date=$3::date AND z.start_time < $5::time AND z.end_time > $4::time) ORDER BY t.capacity,t.name LIMIT 1 FOR UPDATE SKIP LOCKED`,[r.guests,r.id,date,time,end])).rows[0];
      if(!table){await c.query('ROLLBACK');return fail('No suitable table is available at that time. Please choose another time.')}
      const upd=await c.query(`UPDATE reservations SET reservation_date=$1,start_time=$2,end_time=$3,table_id=$4,status='confirmed',updated_at=NOW() WHERE id=$5 RETURNING *`,[date,time,end,table.id,r.id]);
      await c.query('COMMIT');
      const fresh={...r,...upd.rows[0],table_name:table.name};
      if(r.email){const u=manageUrl(token); const mail=reservationEmail({reservation:fresh,manageUrl:u,action:'rescheduled'}); await sendEmail({to:r.email,subject:`Reservation ${r.confirmation_code} rescheduled`,...mail});}
      return json({ok:true,reservation:safe(fresh),message:'Your reservation has been rescheduled.'});
    }
    await c.query('ROLLBACK'); return fail('Unsupported action.');
  }catch(e){try{await c.query('ROLLBACK')}catch{} console.error(e);return fail('We could not update your reservation. Please try again.',500)}finally{c.release()}
}
function safe(r){return {id:r.id,confirmation_code:r.confirmation_code,name:r.name,phone:r.phone,email:r.email,guests:r.guests,reservation_date:r.reservation_date,start_time:r.start_time,end_time:r.end_time,table_name:r.table_name,status:r.status,notes:r.notes}}
