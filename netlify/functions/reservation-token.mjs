import crypto from 'node:crypto';

export function createReservationToken(payload){
  const secret=process.env.RESERVATION_SECRET || process.env.ADMIN_SECRET;
  if(!secret) throw new Error('RESERVATION_SECRET missing');
  const data=Buffer.from(JSON.stringify({...payload,exp:Date.now()+1000*60*60*24*30})).toString('base64url');
  const sig=crypto.createHmac('sha256',secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyReservationToken(token){
  try{
    const [data,sig]=String(token||'').split('.');
    const secret=process.env.RESERVATION_SECRET || process.env.ADMIN_SECRET;
    if(!data||!sig||!secret)return null;
    const expected=crypto.createHmac('sha256',secret).update(data).digest('base64url');
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const p=JSON.parse(Buffer.from(data,'base64url').toString());
    return p.exp>Date.now()?p:null;
  }catch{return null}
}
