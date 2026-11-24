const sectorTerms = {
  technique: ['Pilotage technique','Résolution de problèmes','Optimisation des performances','Conception robuste'],
  commercial: ['Développement du chiffre d’affaires','Prospection qualifiée','Fidélisation client','Négociation'],
  marketing: ['Stratégie omnicanale','Analyse des performances','Génération de leads','Positionnement de marque'],
  santé: ['Accompagnement patient','Évaluation clinique','Collaboration pluridisciplinaire','Qualité des soins'],
  finance: ['Analyse financière','Maîtrise des risques','Prévision budgétaire','Conformité'],
  gestion: ['Coordination d’équipe','Planification opérationnelle','Amélioration continue','Livraison mesurable']
}

export function detectSector(text = '') {
 const value = text.toLowerCase()
 if (/dev|data|logiciel|informat|technique|ingénieur/.test(value)) return 'technique'
 if (/vente|commercial|négociat|client/.test(value)) return 'commercial'
 if (/marketing|communication|contenu|media/.test(value)) return 'marketing'
 if (/santé|patient|médical|soin/.test(value)) return 'santé'
 if (/finance|budget|audit|comptab/.test(value)) return 'finance'
 return 'gestion'
}

export function getAiCareerAdvice({position='', description='', summary=''}) {
 const sector = detectSector(`${position} ${description}`)
 const terms = sectorTerms[sector]
 return {
  sector,
  atsScore: Math.min(96, 68 + terms.length * 5 + (description.length > 80 ? 8 : 0)),
  keywords: terms,
  summary: `Professionnel${sector === 'gestion' ? ' opérationnel' : ' spécialisé'} avec une approche orientée résultats, reconnu pour sa capacité à ${terms[0].toLowerCase()}, à collaborer efficacement et à livrer des solutions à forte valeur ajoutée.`,
  improvements: [
   `Place les mots-clés « ${terms.slice(0,2).join(' » • « ')} » dans votre titre et votre profil.`,
   'Utilisez des verbes d’action forts et quantifiez au moins 3 résultats professionnels.',
   'Limitez votre CV à une page si vous avez moins de 10 ans d’expérience.',
   'Conservez uniquement les compétences demandées dans l’offre.'
  ]
 }
}

export function createCoverLetter({position='le poste proposé', company='Votre entreprise', motivation=''}) {
 const mission = motivation.trim() || 'contribuer efficacement aux objectifs de votre équipe'
 return `Madame, Monsieur,

Je souhaite vivement rejoindre ${company} au poste de ${position}. Fort(e) d’une expérience professionnelle concrète et d’une approche orientée résultats, je suis prêt(e) à ${mission}.

Grâce à mon sens des priorités, ma capacité d’adaptation et mon engagement, je souhaite mettre mes compétences au service de vos projets tout en développant une collaboration durable.

Convaincu(e) que mon profil répond aux exigences du poste, je serais ravi(e) d’échanger avec vous lors d’un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

Maya Kouamé`
}
