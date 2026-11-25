import React from 'react'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

const supportEmail = 'startapp113@gmail.com'
const supportPhone = '+237 680 409 437'
const pages = {
  conditions: {
    title: 'Conditions générales d’utilisation et de vente',
    intro: 'Les présentes conditions décrivent les services CVORA, les prix, les abonnements, les achats et le portefeuille.',
    sections: [
      ['Éditeur et service', 'CVORA est un service numérique indépendant exploité par NZOUABET Fred Jordan. Il permet de préparer des CV, lettres de motivation, demandes d’emploi et demandes de stage. CVORA ne garantit ni embauche ni réponse d’un recruteur.'],
      ['Prix et abonnements', 'Les abonnements proposés sont : 1 500 FCFA pour 24 heures (1 document de chaque catégorie), 2 500 FCFA pour 24 heures (2 de chaque catégorie) et 9 500 FCFA pour 30 jours (4 de chaque catégorie). La période commence après confirmation du paiement. Les quotas inutilisés expirent à la fin de la période. Les prix à l’unité sont affichés avant paiement.'],
      ['Paiements et portefeuille', 'Les paiements sont traités par Notch Pay, notamment via MTN Mobile Money et Orange Money. Une recharge est créditée au portefeuille CVORA après confirmation du prestataire. Le solde interne n’est pas transférable entre utilisateurs ni retirable et sert uniquement à payer les services CVORA. N’envoyez jamais votre code secret Mobile Money à CVORA.'],
      ['Compte et documents', 'L’utilisateur est responsable de l’exactitude des informations saisies, de ses identifiants et de la conservation de ses documents. Il peut demander la fermeture de son compte et la suppression de ses données par e-mail, sous réserve des obligations légales de conservation.'],
      ['Disponibilité et contenu', 'Les modèles et outils aident à rédiger ; l’utilisateur doit relire et vérifier son document avant usage. Une interruption technique peut survenir. Contactez le support en cas de paiement confirmé sans accès au service.'],
      ['Droit applicable', 'Ces conditions s’adressent aux utilisateurs de CVORA au Cameroun et s’appliquent sous réserve des règles impératives applicables. Elles ne limitent pas les droits prévus par la loi.']
    ]
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    intro: 'CVORA traite les données nécessaires à la création de documents, à la gestion des comptes et aux paiements.',
    sections: [
      ['Responsable et contact', `Le service est exploité par NZOUABET Fred Jordan. Pour toute question sur vos données, écrivez à ${supportEmail}.`],
      ['Données utilisées', 'Selon les fonctions utilisées : adresse e-mail, nom de profil, documents et informations que vous saisissez, événements de connexion et d’export, solde et références de transactions. Notch Pay collecte les informations nécessaires au paiement Mobile Money. CVORA ne demande ni ne conserve votre code secret Orange Money ou MTN.'],
      ['Utilisation', 'Ces données servent à fournir les documents, maintenir votre compte, vérifier les paiements et le portefeuille, assurer le support, prévenir les abus et produire des statistiques d’usage pour l’administration de CVORA.'],
      ['Prestataires', 'L’authentification et les données applicatives utilisent Supabase ; le site et ses fonctions serveur utilisent Vercel ; les encaissements utilisent Notch Pay. Ces prestataires traitent certaines données pour fournir leurs services, selon leurs propres conditions.'],
      ['Conservation et demandes', `Les données sont conservées pendant l’utilisation du compte et aussi longtemps que nécessaire au service, au traitement des litiges et au respect des obligations applicables. Vous pouvez demander l’accès, la rectification ou la suppression de vos données à ${supportEmail}.`],
      ['Sécurité', 'CVORA applique des contrôles d’accès et des mesures de sécurité adaptés au service. Aucun service Internet ne peut garantir un risque nul.']
    ]
  },
  remboursements: {
    title: 'Politique de remboursement',
    intro: 'Une recharge en attente ou échouée n’est pas créditée au portefeuille. Les paiements sont vérifiés auprès de Notch Pay.',
    sections: [
      ['Recharge non créditée', `Si Notch Pay confirme le paiement mais que le portefeuille CVORA n’est pas crédité, écrivez à ${supportEmail} avec l’adresse e-mail du compte, le montant, la date et la référence de transaction. Ne transmettez jamais de code PIN ou de mot de passe Mobile Money.`],
      ['Paiement en double ou erreur technique', 'Les paiements dupliqués, débités sans délivrance du service ou affectés par une erreur technique sont examinés avec le justificatif de transaction. Si un remboursement est dû, CVORA coordonne son traitement avec Notch Pay et le moyen de paiement d’origine.'],
      ['Documents et abonnements', 'Une demande concernant un document déjà exporté ou un abonnement déjà utilisé est examinée au cas par cas. Les droits impératifs de l’utilisateur restent applicables. Les quotas non utilisés expirent à la fin de la période affichée.'],
      ['Délais et contact', `Envoyez votre demande à ${supportEmail} en indiquant la référence Notch Pay. Le délai dépend des vérifications du prestataire et de l’opérateur Mobile Money.`]
    ]
  },
  contact: {
    title: 'Contact et assistance',
    intro: 'CVORA est un service indépendant de création de documents professionnels.',
    sections: [
      ['Support par e-mail', `Écrivez à ${supportEmail} pour les questions de compte, documents, facturation, portefeuille, remboursements ou données personnelles.`],
      ['WhatsApp', `Vous pouvez joindre le support au ${supportPhone}. Ne partagez jamais vos mots de passe ni le code secret de votre portefeuille Mobile Money.`],
      ['Responsable du service', 'NZOUABET Fred Jordan — exploitant indépendant de CVORA.']
    ]
  }
}

export default function LegalPage({ page, navigate }) {
  const entry = pages[page] || pages.contact
  return <main className="legal-page"><div className="legal-wrap"><button className="outline-btn" onClick={() => navigate('home')}><ArrowLeft size={16}/> Retour à CVORA</button><div className="legal-kicker">CVORA · Informations officielles</div><h1>{entry.title}</h1><p className="legal-intro">{entry.intro}</p>{entry.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}{page === 'contact' && <div className="legal-contact-links"><a href={`mailto:${supportEmail}`}><Mail size={17}/> Envoyer un e-mail</a><a href="https://wa.me/237680409437" target="_blank" rel="noreferrer"><MessageCircle size={17}/> Contacter sur WhatsApp</a></div>}<small className="legal-updated">Mis à jour le 25 novembre 2026.</small></div></main>
}
