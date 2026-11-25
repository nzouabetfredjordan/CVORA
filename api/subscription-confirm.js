const URL=process.env.VITE_SUPABASE_URL,ANON=process.env.VITE_SUPABASE_ANON_KEY,SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY
const PRICES={day1:1500,day2:2500,month4:9500}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'})
 const key=process.env.NOTCHPAY_PUBLIC_KEY,token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''),reference=String(req.body?.reference||'')
 if(!key||!URL||!ANON||!SERVICE)return res.status(503).json({error:'Variables serveur incomplètes : NotchPay, Supabase Auth et Service Role sont requis.'})
 try{
  const auth=await fetch(`${URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:`Bearer ${token}`}});if(!auth.ok)return res.status(401).json({error:'Session expirée.'})
  const user=await auth.json(),match=reference.match(new RegExp(`^CVORA-SUB-${user.id}-(day1|day2|month4)-[a-f0-9-]{36}$`,'i'));if(!match)return res.status(403).json({error:'Cette souscription ne correspond pas à votre compte.'})
  const plan=match[1],response=await fetch(`https://api.notchpay.co/payments/${encodeURIComponent(reference)}`,{headers:{Authorization:key}}),result=await response.json();if(!response.ok)return res.status(response.status).json({error:result.message||'Paiement introuvable.'})
  const payment=result.payment||result.transaction||result.data?.payment||result.data?.transaction||result.data||{};if(String(payment.status||'').toLowerCase()!=='complete')return res.status(409).json({error:'Le paiement de l’abonnement n’est pas confirmé.'})
  if(Number(payment.amount)!==PRICES[plan])return res.status(400).json({error:'Le montant vérifié ne correspond pas à la formule.'})
  const activated=await fetch(`${URL}/rest/v1/rpc/cvora_activate_subscription`,{method:'POST',headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,'Content-Type':'application/json'},body:JSON.stringify({p_user:user.id,p_plan:plan,p_reference:reference,p_amount:Number(payment.amount)})}),subscription=await activated.json();if(!activated.ok)return res.status(502).json({error:'Paiement confirmé mais activation impossible. Contactez le support avec la référence.'})
  return res.status(200).json({active:true,subscription})
 }catch{return res.status(502).json({error:'Erreur pendant la vérification de la souscription.'})}
}
