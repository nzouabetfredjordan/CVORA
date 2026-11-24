const makeModels=(prefix,count)=>Array.from({length:count},(_,i)=>({
 id:`${prefix}-${i+1}`,
 name:`${prefix==='lettre'?'Modèle':prefix==='emploi'?'Demande':'Stage'} ${String(i+1).padStart(2,'0')}`,
 type:prefix,
 accent:['#1266D6','#071B35','#56B4FF','#2B9D78','#C67A52','#7C5CFC'][i%6],
 subject:['Candidature spontanée','Poste correspondant à votre profil','Requête professionnelle','Opportunité de collaboration','Candidature motivée','Proposition de candidature'][i%6]
}))

export const documentCollections={
 lettre:makeModels('lettre',20),
 emploi:makeModels('emploi',20),
 stage:makeModels('stage',20)
}
