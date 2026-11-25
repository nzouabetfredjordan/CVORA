const stopWords = new Set('avec dans pour sur par une des les aux leur leurs cette votre vous nous sont etre avoir plus moins chez comme quand alors aussi depuis entre vers sans peut faire fait cela ceci offre poste profil experience professionnelle professionnel equipe entreprise recherche candidat candidature mission missions competences'.split(' '))

export function detectSector(text = '') {
 const value = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
 if (/develop|logiciel|informat|technique|ingenieur|reseau|cyber|systeme|data|donnee/.test(value)) return 'Technologie et informatique'
 if (/vente|commercial|negociat|client|prospect/.test(value)) return 'Commerce et relation client'
 if (/marketing|communication|contenu|media|marque/.test(value)) return 'Marketing et communication'
 if (/sante|patient|medical|soin|infirmier|pharma/.test(value)) return 'Sante'
 if (/finance|budget|audit|comptab|banque/.test(value)) return 'Finance et comptabilite'
 if (/enseign|formation|pedagog|ecole/.test(value)) return 'Education et formation'
 if (/stage|etudiant|universit|academ/.test(value)) return 'Stage et debut de carriere'
 return 'Gestion et operations'
}

export function extractKeywords(text = '', limit = 8) {
 const words = text.toLocaleLowerCase('fr').match(/[\p{L}\p{N}+#.-]{3,}/gu) || []
 const counts = new Map()
 for (const word of words) {
  const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (stopWords.has(normalized) || /^\d+$/.test(normalized)) continue
  counts.set(word, (counts.get(word) || 0) + 1)
 }
 return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([word])=>word)
}

export function generateCareerDocument({type='CV', position='', sector='', offer=''}) {
 const target = position.trim() || 'Poste a preciser'
 const focus = sector.trim() || detectSector(target + ' ' + offer)
 const keywords = extractKeywords(target + ' ' + focus + ' ' + offer)
 const skills = keywords.length ? keywords.slice(0,6).map(word=>'- '+word[0].toLocaleUpperCase('fr')+word.slice(1)).join('\n') : '- Competences a preciser selon votre parcours'
 const context = offer.trim().slice(0,1800)
 const summary = 'Profil oriente vers le poste de '+target+' dans le secteur '+focus+'. Les priorites relevees dans l’offre sont : '+(keywords.slice(0,4).join(', ')||focus)+'. Ajoutez vos annees d’experience et vos resultats verifies pour personnaliser ce profil.'
 let text
 if (type === 'CV') {
  text = '[VOTRE NOM COMPLET]\n'+target.toLocaleUpperCase('fr')+'\n[Ville] | [Telephone] | [E-mail]\n\nPROFIL PROFESSIONNEL\n'+summary+'\n\nCOMPETENCES CLES\n'+skills+'\n\nEXPERIENCE PROFESSIONNELLE\n[Poste] - [Entreprise] - [Dates]\n- Decrivez une responsabilite liee a : '+(keywords.slice(0,2).join(', ')||target)+'.\n- Ajoutez un resultat chiffre que vous pouvez justifier.\n\nFORMATION\n[Diplome] - [Etablissement] - [Annee]\n\nLANGUES\n[Langue et niveau]'
 } else if (type === 'Lettre de motivation') {
  text = 'Objet : Candidature au poste de '+target+'\n\nMadame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de '+target+'. Votre besoin porte notamment sur '+(keywords.slice(0,4).join(', ')||focus)+'. Mon parcours en '+focus+' m’a permis de developper des competences que je souhaite mettre au service de votre equipe.\n\nJe peux contribuer a vos missions de '+(keywords.slice(0,3).join(', ')||target)+'. Je serais heureux(se) de vous presenter des exemples concrets de mes realisations et des resultats obtenus.\n\nJe reste disponible pour un entretien et vous prie d’agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Votre nom]'
 } else if (type === 'Demande d’emploi') {
  text = 'OBJET : DEMANDE D’EMPLOI - '+target.toLocaleUpperCase('fr')+'\n\nMonsieur/Madame le/la Responsable,\n\nJ’ai l’honneur de solliciter un emploi au poste de '+target+' au sein de votre organisation. Les missions recherchees concernent '+(keywords.slice(0,4).join(', ')||focus)+'. Ma formation et mon experience, a preciser selon votre parcours, me permettront de contribuer serieusement a ces activites.\n\nJe suis disponible pour un entretien afin de vous presenter mes qualifications et mes references.\n\nVeuillez agreer, Monsieur/Madame, l’expression de ma consideration distinguee.\n\n[Votre nom]'
 } else {
  text = 'OBJET : DEMANDE DE STAGE - '+target.toLocaleUpperCase('fr')+'\n\nMonsieur/Madame le/la Responsable,\n\nActuellement [formation et niveau] a [etablissement], je sollicite un stage dans le domaine '+focus+'. Cette experience me permettrait de mettre en pratique mes connaissances et de contribuer aux missions liees a '+(keywords.slice(0,4).join(', ')||target)+'.\n\nJe suis disponible pour un entretien et vous remercie de l’attention portee a ma demande.\n\nVeuillez agreer, Monsieur/Madame, mes salutations respectueuses.\n\n[Votre nom]'
 }
 return {type, position:target, sector:focus, keywords, score:Math.min(96,68+keywords.length*3+(context.length>100?8:0)), summary, text, offer:context}
}

export function getAiCareerAdvice({position='', description='', summary=''}) {
 const keywords = extractKeywords(position+' '+description+' '+summary)
 const sector = detectSector(position+' '+description)
 return {sector, atsScore:Math.min(96,68+keywords.length*3), keywords, summary:generateCareerDocument({position,sector,offer:description}).summary, improvements:['Ajoutez des resultats mesurables et verifiables.','Reprenez les competences pertinentes de l’offre.','Completez vos coordonnees, dates et diplomes avant export.']}
}
