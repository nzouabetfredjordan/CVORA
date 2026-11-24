export const industries = ['Tous','Ingénierie','Commerce','Santé','Finance','Technologie','Éducation','Créatif','Communication','Ressources humaines','Logistique','Droit','Hôtellerie','Administration']

const palettes = ['#1266D6','#071B35','#56B4FF','#2B9D78','#C67A52','#7C5CFC','#E05D75','#0F8D92','#C99700','#435A64']
const names = ['Azuré','Élégance','Créatif','Executive','Minimal','Digital','Premium','Nimbus','Studio','Nova','Impact','Vision','Expert','Clarté','Atlas','Signature','Élite','Modernis','Corporate','Saphir','Bordeaux','Confiance','Rhythm','Horizon','Opale','Prisme','Urban','Essential','Pulsar','Solar']

export const templateData = names.map((name, i) => ({
  id: `cv-2026-${i + 1}`,
  name,
  color: palettes[i % palettes.length],
  category: industries[1 + (i % (industries.length - 1))],
  tag: i % 5 === 0 ? 'Le plus demandé' : i % 3 === 0 ? 'ATS 2026' : 'Nouveau',
  layout: ['classic','split','top','creative','minimal'][i % 5]
}))
