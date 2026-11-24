import { Mail, Phone, MessageCircle, Camera, Music2 } from 'lucide-react'

export default function Footer(){
 return <footer className="site-footer">
  <div className="footer-grid">
   <div><div className="footer-brand"><img src="/logo.jpeg" alt="CVORA"/><b>CVORA</b></div><p>Construisez une candidature professionnelle, claire et adaptée aux exigences des recruteurs.</p><div className="socials"><a href="https://www.tiktok.com/@StartApp89" aria-label="TikTok"><Music2/></a><a href="https://www.instagram.com/StartApp89" aria-label="Instagram"><Camera/></a></div></div>
   <div><h3>Plateforme</h3><a href="#">Créer un CV</a><a href="#">Modèles 2026</a><a href="#">Lettres de motivation</a><a href="#">Analyse ATS</a></div>
   <div><h3>Entreprise</h3><a href="#">À propos</a><a href="#">Tarifs</a><a href="#">Contact</a><a href="#">Confidentialité</a></div>
   <div><h3>Nous contacter</h3><a href="tel:+237680409437"><Phone/> 680409437</a><a href="https://wa.me/237680409437"><MessageCircle/> WhatsApp : 680409437</a><a href="mailto:startapp113@gmail.com"><Mail/> startapp113@gmail.com</a></div>
  </div>
  <div className="footer-bottom"><span>© 2026 CVORA — StartApp. Tous droits réservés.</span><span>TikTok & Instagram : @StartApp89</span></div>
 </footer>
}
