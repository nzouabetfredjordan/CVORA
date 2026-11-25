import { Mail, Phone, MessageCircle, Camera, Music2 } from 'lucide-react'

export default function Footer(){
 return <footer className="site-footer">
  <div className="footer-grid">
   <div><div className="footer-brand"><img src="/logo.jpeg" alt="CVORA"/><b>CVORA</b></div><p>Construisez une candidature professionnelle, claire et adaptée aux exigences des recruteurs.</p><div className="socials"><a href="https://www.tiktok.com/@StartApp89" aria-label="TikTok"><Music2/></a><a href="https://www.instagram.com/StartApp89" aria-label="Instagram"><Camera/></a></div></div>
   <div><h3>Plateforme</h3><a href="/cvs">Créer un CV</a><a href="/cvs">Modèles de CV</a><a href="/letters">Lettres de motivation</a><a href="/ai">Assistant IA</a></div>
   <div><h3>Informations</h3><a href="/pricing">Tarifs et abonnements</a><a href="/contact">Contact</a><a href="/conditions">Conditions générales</a><a href="/confidentialite">Confidentialité</a><a href="/remboursements">Remboursements</a></div>
   <div><h3>Nous contacter</h3><a href="tel:+237680409437"><Phone/> +237 680 409 437</a><a href="https://wa.me/237680409437"><MessageCircle/> WhatsApp : 680 409 437</a><a href="mailto:startapp113@gmail.com"><Mail/> startapp113@gmail.com</a></div>
  </div>
  <div className="footer-bottom"><span>© 2026 CVORA. Tous droits réservés.</span><span>TikTok & Instagram : @StartApp89</span></div>
 </footer>
}
