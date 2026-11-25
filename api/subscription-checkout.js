import { randomUUID } from 'node:crypto'
const URL = process.env.VITE_SUPABASE_URL, ANON = process.env.VITE_SUPABASE_ANON_KEY
const PLANS = { day1:{amount:1500}, day2:{amount:2500}, month4:{amount:9500} }
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'})
 const key=process.env.NOTCHPAY_PUBLIC_KEY,token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'')
 if(!key||/^hsk_/i.test(key)||!URL||!ANON)return res.status(503).json({error:'NotchPay ou Supabase n’est pas configuré.'})
 if(/test/i.test(key))return res.status(503).json({error:'Les souscriptions sont suspendues tant que NotchPay est en mode test. Activez la production et configurez la clé Live dans Vercel.'})
 if(!token)return res.status(401).json({error:'Connectez-vous pour souscrire.'})
 try{
  const auth=await fetch(`${URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:`Bearer ${token}`}});if(!auth.ok)return res.status(401).json({error:'Session expirée.'})
  const user=await auth.json(),plan=String(req.body?.plan||''),entry=PLANS[plan];if(!entry)return res.status(400).json({error:'Formule inconnue.'})
  const reference=`CVORA-SUB-${user.id}-${plan}-${randomUUID()}`,host=String(req.headers['x-forwarded-host']||req.headers.host||'cvora-ten.vercel.app').split(',')[0],protocol=req.headers['x-forwarded-proto']||'https'
  const response=await fetch('https://api.notchpay.co/payments',{method:'POST',headers:{Authorization:key,'Content-Type':'application/json'},body:JSON.stringify({amount:entry.amount,currency:'XAF',customer:{name:user.user_metadata?.full_name||user.user_metadata?.name||user.email,email:user.email},description:`Abonnement CVORA ${plan}`,reference,callback:`${protocol}://${host}/dashboard?subscription_payment=${encodeURIComponent(reference)}`,metadata:{user_id:user.id,type:'subscription',plan}})})
  const data=await response.json();if(!response.ok)return res.status(response.status).json({error:'NotchPay a refusé le paiement. Vérifiez que le compte marchand et le moyen de paiement sont actifs.'})
  const payment=data.payment||data.transaction||data.data?.payment||data.data?.transaction||data.data||{}
  const checkout=data.authorization_url||payment.authorization_url;if(!checkout)return res.status(502).json({error:'Lien de paiement manquant.'})
  return res.status(200).json({authorization_url:checkout})
 }catch{return res.status(502).json({error:'Impossible de joindre NotchPay.'})}
}
