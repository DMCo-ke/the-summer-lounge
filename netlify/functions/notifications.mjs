const RESEND_ENDPOINT='https://api.resend.com/emails';

export async function sendEmail({to,subject,html,text}){
  const key=process.env.RESEND_API_KEY;
  const from=process.env.RESEND_FROM || 'The Summer Lounge <reservations@thesummerlounge.co.ke>';
  if(!key || !to) return {sent:false,reason:!key?'missing_resend_key':'missing_recipient'};
  const r=await fetch(RESEND_ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to,subject,html,text})});
  if(!r.ok){const detail=await r.text(); console.error('Resend error',r.status,detail); return {sent:false,reason:'provider_error'};}
  return {sent:true};
}

export function reservationEmail({reservation,manageUrl,action='confirmed'}){
  const date=new Date(`${reservation.reservation_date}T00:00:00`).toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const time=(reservation.start_time||'').slice(0,5);
  const status=action==='cancelled'?'Cancelled':action==='rescheduled'?'Rescheduled':action==='pending'?'Received':'Confirmed';
  const table=reservation.table_name?`<p><strong>Table:</strong> ${esc(reservation.table_name)}</p>`:'';
  const html=`<!doctype html><html><body style="margin:0;background:#f3f0e9;font-family:Arial,sans-serif;color:#183d36"><div style="max-width:620px;margin:30px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e6dfd2"><div style="padding:28px;text-align:center;background:#173f37"><img src="${process.env.PUBLIC_LOGO_URL||''}" alt="The Summer Lounge" style="max-width:220px;max-height:80px;object-fit:contain;background:#fff;border-radius:10px;padding:8px"><h1 style="color:#f7f0e4;font-size:25px;margin:18px 0 4px">${status}</h1><p style="color:#d8c9aa;margin:0">The Summer Lounge · Nairobi</p></div><div style="padding:30px"><p>Hello ${esc(reservation.name)},</p><p>Your reservation details are below.</p><div style="background:#f7f3eb;border-radius:14px;padding:18px;margin:20px 0"><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Guests:</strong> ${reservation.guests}</p>${table}<p><strong>Confirmation:</strong> ${esc(reservation.confirmation_code)}</p></div>${manageUrl?`<p style="text-align:center;margin:26px 0"><a href="${manageUrl}" style="display:inline-block;background:#c4a46b;color:#173f37;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">Manage reservation</a></p>`:''}<p style="font-size:13px;color:#687872">Need to cancel or change your booking? Use the manage button above.</p><p>We look forward to welcoming you.</p></div></div></body></html>`;
  const text=`The Summer Lounge — ${status}\n\nHello ${reservation.name},\nDate: ${date}\nTime: ${time}\nGuests: ${reservation.guests}\nConfirmation: ${reservation.confirmation_code}\n${manageUrl?`Manage reservation: ${manageUrl}`:''}`;
  return {html,text};
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
