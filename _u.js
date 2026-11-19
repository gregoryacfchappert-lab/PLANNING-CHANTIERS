
/* ================= LOGO ================= */
const DEFAULT_LOGO = "data:image/svg+xml;base64," + btoa(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 210'>
<g fill='none' stroke-width='11' stroke-linecap='round'>
<path d='M60 18 C15 55 15 155 60 192' stroke='#1b3a8c'/><path d='M60 18 C40 30 28 40 22 55' stroke='#e2231a'/>
<path d='M240 18 C285 55 285 155 240 192' stroke='#1b3a8c'/><path d='M240 18 C260 30 272 40 278 55' stroke='#e2231a'/></g>
<text x='150' y='78' text-anchor='middle' font-family='Arial' font-weight='800' font-size='40' fill='#1b3a8c'>ACF</text>
<text x='150' y='120' text-anchor='middle' font-family='Arial' font-weight='800' font-size='40' fill='#1b3a8c'>CHAPPERT</text>
<text x='150' y='150' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#1b3a8c'>Froid - <tspan fill='#e2231a'>Climat</tspan>isation</text>
<text x='150' y='172' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#1b3a8c'>Ventilation - Chauffage</text>
<text x='150' y='194' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#e2231a'>Cuisines professionnelles</text></svg>`);

/* ================= BASE DE DONNÉES (localStorage) ================= */
const DBKEY = 'acf_devis_db_v1';
let db = load();
function load(){
  try{ const d = JSON.parse(localStorage.getItem(DBKEY)); if(d && d.clients && d.devis){ if(!d.commerciaux)d.commerciaux=[]; if(!d.products)d.products=[]; if(!d.factures)d.factures=[]; if(d.facSeq==null)d.facSeq=0; if(d.cmdSeq==null)d.cmdSeq=0; if(d.fcSeq==null)d.fcSeq=0; if(!d.techniciens)d.techniciens=[]; if(!d.poses)d.poses=[]; if(d.pagesBase==null)d.pagesBase='https://gregoryacfchappert-lab.github.io/FICHES-CHANTIERS/'; return d; } }catch(e){}
  return {seq:0, facSeq:0, cmdSeq:0, fcSeq:0, clients:[], commerciaux:[], techniciens:[], products:[], devis:[], factures:[], poses:[], logo:DEFAULT_LOGO, lastComId:'', pagesBase:'https://gregoryacfchappert-lab.github.io/FICHES-CHANTIERS/'};
}
function persist(){ try{ localStorage.setItem(DBKEY, JSON.stringify(db)); }catch(e){ alert('Sauvegarde impossible : espace saturé (photos trop lourdes). Réduisez la taille des photos.'); } }
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const eur = n => (isFinite(n)?n:0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const esc = s => (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* logo global */
let logoData = db.logo || DEFAULT_LOGO;
document.getElementById('logoImg').src = logoData;
function setLogo(e){ const f=e.target.files[0]; if(!f)return; const r=new FileReader();
  r.onload=ev=>{ logoData=ev.target.result; db.logo=logoData; document.getElementById('logoImg').src=logoData; persist(); }; r.readAsDataURL(f); }

/* ================= NAVIGATION ================= */
function showView(v){
  ['list','clients','produits','commerciaux','techniciens','aplanifier','planning','plantech','editor','invoice','fiche'].forEach(x=>document.getElementById('view-'+x).classList.toggle('active', x===v));
  document.querySelector('.topnav').style.display = (v==='plantech') ? 'none' : 'flex';
  document.getElementById('nav-list').classList.toggle('active', v==='list');
  document.getElementById('nav-clients').classList.toggle('active', v==='clients');
  document.getElementById('nav-produits').classList.toggle('active', v==='produits');
  document.getElementById('nav-commerciaux').classList.toggle('active', v==='commerciaux');
  document.getElementById('nav-techniciens').classList.toggle('active', v==='techniciens');
  document.getElementById('nav-aplanifier').classList.toggle('active', v==='aplanifier');
  document.getElementById('nav-planning').classList.toggle('active', v==='planning');
  if(v==='list') renderList();
  if(v==='clients') renderClients();
  if(v==='produits') renderProducts();
  if(v==='commerciaux') renderCommerciaux();
  if(v==='techniciens') renderTechniciens();
  if(v==='aplanifier') renderAPlanifier();
  if(v==='planning') renderPlanning();
  if(v==='plantech') renderPlanTech();
  updateAplanBadge();
  window.scrollTo(0,0);
}

/* ================= CLIENTS ================= */
function clientName(c){
  if(!c) return '';
  return c.type==='pro' ? (c.societe||'(sans nom)') : [c.civ,c.nom,c.prenom].filter(Boolean).join(' ')||'(sans nom)';
}
function renderClients(){
  const q=(document.getElementById('searchClient').value||'').toLowerCase();
  const list=db.clients.filter(c=>clientName(c).toLowerCase().includes(q)||(c.ville||'').toLowerCase().includes(q));
  const wrap=document.getElementById('clientTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun client. Cliquez sur « ＋ Nouveau client » pour en créer un.</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Nom</th><th>Type</th><th>Ville</th><th>Téléphone</th><th>Email</th><th></th></tr></thead><tbody>'+
    list.map(c=>`<tr>
      <td class="clic" onclick="openClientModal('${c.id}')"><b>${esc(clientName(c))}</b></td>
      <td><span class="tag ${c.type}">${c.type==='pro'?'Pro':'Particulier'}</span></td>
      <td>${esc(c.ville||'')}</td><td>${esc(c.tel||'')}</td><td>${esc(c.email||'')}</td>
      <td class="row-act"><button class="small" onclick="openClientModal('${c.id}')">✎</button>
        <button class="small rouge" onclick="deleteClient('${c.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingClientId=null;
function openClientModal(id){
  editingClientId = id||null;
  const c = id ? db.clients.find(x=>x.id===id) : null;
  document.getElementById('clientModalTitle').textContent = c ? 'Modifier le client' : 'Nouveau client';
  setClientType(c ? c.type : 'particulier');
  cVal('cCiv', c&&c.civ||'M.'); cVal('cNom', c&&c.nom||''); cVal('cPrenom', c&&c.prenom||'');
  cVal('cSociete', c&&c.societe||''); cVal('cSiret', c&&c.siret||''); cVal('cTvaIntra', c&&c.tvaIntra||''); cVal('cContact', c&&c.contact||'');
  cVal('cAdresse', c&&c.adresse||''); cVal('cCP', c&&c.cp||''); cVal('cVille', c&&c.ville||''); cVal('cTel', c&&c.tel||''); cVal('cEmail', c&&c.email||'');
  document.getElementById('clientModalBg').classList.add('open');
}
function cVal(id,v){ document.getElementById(id).value=v; }
function closeClientModal(){ document.getElementById('clientModalBg').classList.remove('open'); }
function setClientType(t){
  document.getElementById('clientModal').dataset.type=t;
  document.getElementById('segPart').classList.toggle('on', t==='particulier');
  document.getElementById('segPro').classList.toggle('on', t==='pro');
}
function saveClient(){
  const t=document.getElementById('clientModal').dataset.type;
  const c={ id: editingClientId||uid(), type:t,
    civ:document.getElementById('cCiv').value, nom:document.getElementById('cNom').value.trim(), prenom:document.getElementById('cPrenom').value.trim(),
    societe:document.getElementById('cSociete').value.trim(), siret:document.getElementById('cSiret').value.trim(),
    tvaIntra:document.getElementById('cTvaIntra').value.trim(), contact:document.getElementById('cContact').value.trim(),
    adresse:document.getElementById('cAdresse').value.trim(), cp:document.getElementById('cCP').value.trim(), ville:document.getElementById('cVille').value.trim(),
    tel:document.getElementById('cTel').value.trim(), email:document.getElementById('cEmail').value.trim() };
  if(!clientName(c)||clientName(c)==='(sans nom)'){ alert(t==='pro'?'Indiquez la raison sociale.':'Indiquez au moins le nom.'); return; }
  if(editingClientId){ const i=db.clients.findIndex(x=>x.id===editingClientId); db.clients[i]=c; }
  else db.clients.push(c);
  persist(); closeClientModal();
  if(document.getElementById('view-editor').classList.contains('active')){ selectClient(c.id); }
  if(document.getElementById('view-clients').classList.contains('active')) renderClients();
}
function deleteClient(id){
  if(!confirm('Supprimer ce client ?')) return;
  db.clients=db.clients.filter(c=>c.id!==id); persist(); renderClients();
}

/* ================= COMMERCIAUX ================= */
function renderCommerciaux(){
  const q=(document.getElementById('searchCom').value||'').toLowerCase();
  const list=db.commerciaux.filter(c=>(c.nom||'').toLowerCase().includes(q));
  const wrap=document.getElementById('comTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun commercial. Cliquez sur « ＋ Nouveau commercial ».</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Email</th><th>Couleur</th><th></th></tr></thead><tbody>'+
    list.map(c=>`<tr>
      <td class="clic" onclick="openComModal('${c.id}')"><b>${esc(c.nom)}</b></td>
      <td>${esc(c.fonction||'')}</td><td>${esc(c.tel||'')}</td><td>${esc(c.mail||'')}</td>
      <td><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${esc(c.couleur||'#1b3a8c')};vertical-align:middle"></span></td>
      <td class="row-act"><button class="small" onclick="openComModal('${c.id}')">✎</button>
        <button class="small rouge" onclick="deleteCommercial('${c.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingComId=null;
function openComModal(id){
  editingComId=id||null; const c=id?db.commerciaux.find(x=>x.id===id):null;
  document.getElementById('comModalTitle').textContent=c?'Modifier le commercial':'Nouveau commercial';
  cVal('mcNom',c&&c.nom||''); cVal('mcTel',c&&c.tel||''); cVal('mcMail',c&&c.mail||''); cVal('mcFonction',c&&c.fonction||''); cVal('mcCouleur',c&&c.couleur||'#1b3a8c');
  document.getElementById('comModalBg').classList.add('open');
}
function closeComModal(){ document.getElementById('comModalBg').classList.remove('open'); }
function saveCommercial(){
  const c={ id:editingComId||uid(), nom:document.getElementById('mcNom').value.trim(),
    tel:document.getElementById('mcTel').value.trim(), mail:document.getElementById('mcMail').value.trim(), fonction:document.getElementById('mcFonction').value.trim(),
    couleur:document.getElementById('mcCouleur').value };
  if(!c.nom){ alert('Indiquez le nom du commercial.'); return; }
  if(editingComId){ const i=db.commerciaux.findIndex(x=>x.id===editingComId); db.commerciaux[i]=c; } else db.commerciaux.push(c);
  persist(); closeComModal();
  if(document.getElementById('view-editor').classList.contains('active')){ fillComSelect(c.id); onComChange(); }
  if(document.getElementById('view-commerciaux').classList.contains('active')) renderCommerciaux();
}
function deleteCommercial(id){ if(!confirm('Supprimer ce commercial ?')) return; db.commerciaux=db.commerciaux.filter(c=>c.id!==id); persist(); renderCommerciaux(); }
function fillComSelect(sel){
  const s=document.getElementById('comSelect');
  s.innerHTML='<option value="">— Sélectionner un commercial —</option>'+
    db.commerciaux.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nom)}</option>`).join('');
  document.getElementById('editComBtn').style.display=sel?'inline-flex':'none';
}
function onComChange(){ cur.commercialId=document.getElementById('comSelect').value; db.lastComId=cur.commercialId;
  document.getElementById('editComBtn').style.display=cur.commercialId?'inline-flex':'none'; renderComView(); scheduleSave(); }
function editSelectedCom(){ if(cur.commercialId) openComModal(cur.commercialId); }
function renderComView(){
  const c=db.commerciaux.find(x=>x.id===cur.commercialId); const el=document.getElementById('comView');
  if(!c){ el.innerHTML='<span style="color:var(--muted)">Aucun commercial sélectionné.</span>'; return; }
  const l=[`<span class="cname">${esc(c.nom)}</span>`];
  if(c.fonction) l.push(esc(c.fonction));
  const cont=[]; if(c.tel)cont.push('Tél. '+esc(c.tel)); if(c.mail)cont.push(esc(c.mail)); if(cont.length)l.push(cont.join(' · '));
  el.innerHTML=l.join('<br>');
}

/* ================= PRODUITS ================= */
function renderProducts(){
  const q=(document.getElementById('searchProd').value||'').toLowerCase();
  const list=db.products.filter(p=>(p.desc||'').toLowerCase().includes(q)||(p.ref||'').toLowerCase().includes(q));
  document.getElementById('prodInfo').textContent = db.products.length ? db.products.length+' produit(s) au catalogue.' : '';
  const wrap=document.getElementById('prodTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun produit. Ajoutez-en un ou importez un fichier Excel/CSV.</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Désignation</th><th>Réf./Catégorie</th><th>Unité</th><th style="text-align:right">P.U. HT</th><th>TVA</th><th></th></tr></thead><tbody>'+
    list.map(p=>`<tr>
      <td class="clic" onclick="openProdModal('${p.id}')"><b>${esc(p.desc)}</b></td>
      <td>${esc(p.ref||'')}</td><td>${esc(p.unit||'')}</td>
      <td style="text-align:right" class="ttc-mono">${eur(+p.pu||0)}</td>
      <td>${(''+(p.tva!=null?p.tva:20)).replace('.',',')} %</td>
      <td class="row-act"><button class="small" onclick="openProdModal('${p.id}')">✎</button>
        <button class="small rouge" onclick="deleteProduct('${p.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingProdId=null;
function openProdModal(id){
  editingProdId=id||null; const p=id?db.products.find(x=>x.id===id):null;
  document.getElementById('prodModalTitle').textContent=p?'Modifier le produit':'Nouveau produit';
  cVal('mpDesc',p&&p.desc||''); cVal('mpUnit',p&&p.unit||'u'); cVal('mpPu',p&&p.pu!=null?p.pu:0);
  cVal('mpTva',p&&p.tva!=null?p.tva:20); cVal('mpRef',p&&p.ref||'');
  document.getElementById('prodModalBg').classList.add('open');
}
function closeProdModal(){ document.getElementById('prodModalBg').classList.remove('open'); }
function saveProduct(){
  const p={ id:editingProdId||uid(), desc:document.getElementById('mpDesc').value.trim(), unit:document.getElementById('mpUnit').value.trim()||'u',
    pu:parseFloat(document.getElementById('mpPu').value)||0, tva:parseFloat(document.getElementById('mpTva').value), ref:document.getElementById('mpRef').value.trim() };
  if(!p.desc){ alert('Indiquez la désignation.'); return; }
  if(editingProdId){ const i=db.products.findIndex(x=>x.id===editingProdId); db.products[i]=p; } else db.products.push(p);
  persist(); closeProdModal(); renderProducts();
}
function deleteProduct(id){ if(!confirm('Supprimer ce produit ?')) return; db.products=db.products.filter(p=>p.id!==id); persist(); renderProducts(); }

/* ---- Import Excel / CSV ---- */
function parseCSV(text){
  // détecte le séparateur (; ou , ou tab)
  const first=text.split(/\r?\n/)[0]||'';
  const sep = (first.match(/;/g)||[]).length >= (first.match(/,/g)||[]).length ? (first.includes('\t')&&!first.includes(';')?'\t':';') : ',';
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else { if(c==='"') q=true; else if(c===sep){ row.push(cur); cur=''; } else if(c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; } else if(c==='\r'){} else cur+=c; }
  }
  if(cur.length||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(c=>(c||'').trim()!==''));
}
function rowsToProducts(rows){
  if(!rows.length) return [];
  const norm=s=>(s||'').toString().toLowerCase().replace(/[éè]/g,'e').replace(/[^a-z0-9]/g,'');
  const H={desc:['designation','description','libelle','libelledarticle','article','intitule','nom','produit'],
    unit:['unite','unit','unitede','u'], pu:['pu','prix','prixunitaire','prixunitaireht','puht','prixht','prixhtunitaire','montantht','tarif','prixvente'],
    tva:['tva','tauxdetva','tauxtva','taux'], ref:['ref','reference','code','categorie','famille']};
  const head=rows[0].map(norm);
  const find=keys=>{ for(const k of keys){ const idx=head.indexOf(k); if(idx>=0) return idx; } return -1; };
  let idx={desc:find(H.desc),unit:find(H.unit),pu:find(H.pu),tva:find(H.tva),ref:find(H.ref)};
  let start=1;
  if(idx.desc<0){ // pas d'en-tête reconnu -> positionnel : désignation, unité, PU, TVA, réf
    idx={desc:0,unit:1,pu:2,tva:3,ref:4}; start=0;
  }
  const toNum=v=>{ if(v==null) return 0; return parseFloat((''+v).replace(/[^0-9,.-]/g,'').replace(',','.'))||0; };
  const out=[];
  for(let i=start;i<rows.length;i++){ const r=rows[i]; const desc=(r[idx.desc]||'').toString().trim(); if(!desc) continue;
    let tva=idx.tva>=0?toNum(r[idx.tva]):20; if(![20,10,5.5,0].includes(tva)) tva=[20,10,5.5,0].includes(Math.round(tva*10)/10)?Math.round(tva*10)/10:20;
    out.push({ id:uid(), desc, unit:idx.unit>=0?((r[idx.unit]||'u').toString().trim()||'u'):'u',
      pu:idx.pu>=0?toNum(r[idx.pu]):0, tva, ref:idx.ref>=0?(r[idx.ref]||'').toString().trim():'' });
  }
  return out;
}
function mergeProducts(items){
  let added=0, updated=0;
  items.forEach(it=>{ const k=it.desc.toLowerCase();
    const ex=db.products.find(p=>p.desc.toLowerCase()===k);
    if(ex){ ex.unit=it.unit; ex.pu=it.pu; ex.tva=it.tva; if(it.ref)ex.ref=it.ref; updated++; }
    else { db.products.push(it); added++; }
  });
  persist(); return {added,updated};
}
function importFile(e){
  const f=e.target.files[0]; if(!f) return; const name=f.name.toLowerCase();
  const done=items=>{ if(!items.length){ alert('Aucun produit détecté dans le fichier. Vérifiez qu\'il contient une colonne « Désignation ».'); return; }
    const r=mergeProducts(items); renderProducts(); alert(`Import terminé : ${r.added} ajouté(s), ${r.updated} mis à jour.`); e.target.value=''; };
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    if(typeof XLSX==='undefined'){ alert('Le lecteur Excel n\'a pas pu se charger (hors ligne ?). Enregistrez votre fichier en CSV et réimportez-le.'); e.target.value=''; return; }
    const rd=new FileReader(); rd.onload=ev=>{ try{ const wb=XLSX.read(ev.target.result,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}); done(rowsToProducts(rows)); }
      catch(err){ alert('Fichier Excel illisible : '+err.message); } }; rd.readAsArrayBuffer(f);
  } else {
    const rd=new FileReader(); rd.onload=ev=>done(rowsToProducts(parseCSV(ev.target.result))); rd.readAsText(f,'UTF-8');
  }
}
function downloadTemplate(){
  const csv='Désignation;Unité;Prix unitaire HT;TVA;Référence\n'+
    'Climatiseur mural 3,5 kW;u;850;10;CLIM-35\n'+
    'Pose et mise en service;forfait;350;10;POSE\n'+
    'Gaine isolée Ø160 (le mètre);ml;12,50;20;GAINE-160\n';
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='modele-produits-acf.csv'; a.click();
}

/* ================= LISTE DES DEVIS ================= */
function variantTTC(v){
  let ht=0; const map={}; (v.lines||[]).forEach(l=>{ if(l.type)return; const t=(+l.qte||0)*(+l.pu||0); ht+=t; map[l.tva]=(map[l.tva]||0)+t;});
  const rem = v.remiseType==='pct' ? ht*(+v.remise||0)/100 : (+v.remise||0);
  const net = Math.max(0, ht-rem); const ratio = ht>0?net/ht:0;
  let tva=0; Object.keys(map).forEach(r=> tva+=map[r]*ratio*(+r)/100);
  return net+tva;
}
function devisTTC(d){ const v=d.variants[d.active||0]||d.variants[0]; return v?variantTTC(v):0; }
function renderList(){
  const q=(document.getElementById('searchDevis').value||'').toLowerCase();
  const list=db.devis.filter(d=>{
    const c=db.clients.find(x=>x.id===d.clientId); const cn=clientName(c).toLowerCase();
    return cn.includes(q)||(d.num||'').toLowerCase().includes(q)||(d.objet||'').toLowerCase().includes(q);
  }).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const wrap=document.getElementById('devisTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun devis'+(q?' pour cette recherche':'')+'. Cliquez sur « ＋ Nouveau devis ».</div>'; return; }
  const stLabel=ST_LABEL;
  wrap.innerHTML='<table class="grid"><thead><tr><th>N°</th><th>Client</th><th>Objet</th><th>Date</th><th>Variantes</th><th>Statut</th><th style="text-align:right">Total TTC</th><th></th></tr></thead><tbody>'+
    list.map(d=>{ const c=db.clients.find(x=>x.id===d.clientId);
      return `<tr>
        <td class="clic num-mono" onclick="openDevis('${d.id}')">${esc(d.num)}</td>
        <td class="clic" onclick="openDevis('${d.id}')">${esc(clientName(c))||'<span style=color:#aab>—</span>'}</td>
        <td class="clic" onclick="openDevis('${d.id}')">${esc(d.objet||'')}</td>
        <td>${d.date?new Date(d.date).toLocaleDateString('fr-FR'):''}</td>
        <td>${d.variants.length>1?d.variants.length+' variantes':'—'}</td>
        <td>${statusSelect(d)}</td>
        <td class="ttc-mono" style="text-align:right">${eur(devisTTC(d))}</td>
        <td class="row-act"><button class="small" title="Ouvrir le devis" onclick="openDevis('${d.id}')">Ouvrir</button>
          <button class="small" title="Créer une facture" onclick="openInvoiceModal('${d.id}')">💶 Facturer</button>
          <button class="small" title="Dupliquer le devis" onclick="duplicateDevis('${d.id}')">⧉ Dupliquer</button>
          <button class="small rouge" title="Supprimer" onclick="deleteDevis('${d.id}')">🗑</button></td></tr>`;
    }).join('')+'</tbody></table>';
}
const ST_LABEL={brouillon:'Brouillon',envoye:'Envoyé',accepte:'Accepté',refuse:'Refusé'};
function statusSelect(d){ const s=d.statut||'brouillon';
  return `<select class="st st-sel ${s}" onclick="event.stopPropagation()" onchange="setDevisStatut('${d.id}',this.value)">`+
    Object.keys(ST_LABEL).map(k=>`<option value="${k}" ${k===s?'selected':''}>${ST_LABEL[k]}</option>`).join('')+`</select>`;
}
function setDevisStatut(id,val){ const d=db.devis.find(x=>x.id===id); if(!d) return; const prev=d.statut; d.statut=val; persist(); renderList();
  if(val==='accepte' && prev!=='accepte') proposeOrderConfirmation(id); }
function onStatutChange(){ const val=document.getElementById('devStatut').value; const prev=cur.statut; cur.statut=val; scheduleSave();
  if(val==='accepte' && prev!=='accepte') proposeOrderConfirmation(cur.id); }
function proposeOrderConfirmation(id){ const d=db.devis.find(x=>x.id===id); if(!d) return;
  if(confirm('Le devis '+d.num+' est passé en « Accepté ».\n\nGénérer une confirmation de commande à envoyer au client ?')) generateOrderConfirmation(id); }
function generateOrderConfirmation(id){ const d=db.devis.find(x=>x.id===id); if(!d) return;
  if(!d.orderConfirm){ const y=new Date().getFullYear(); db.cmdSeq=(db.cmdSeq||0)+1; d.orderConfirm={num:`CC-${y}-${String(db.cmdSeq).padStart(3,'0')}`, date:new Date().toISOString().slice(0,10)}; }
  d.statut='accepte'; persist(); renderOrderConfirmation(d); showView('invoice');
  setTimeout(()=>downloadDocPDF('Confirmation_commande_'+d.orderConfirm.num+'.pdf'), 400);
}
function duplicateDevis(id){
  const d=db.devis.find(x=>x.id===id); if(!d) return;
  const copy=JSON.parse(JSON.stringify(d)); copy.id=uid(); copy.num=nextNum(); copy.createdAt=Date.now(); copy.statut='brouillon';
  db.devis.push(copy); persist(); renderList();
}
function deleteDevis(id){ if(!confirm('Supprimer ce devis ?')) return; db.devis=db.devis.filter(x=>x.id!==id); persist(); renderList(); }

/* ---- Import OBAT (liste de devis) ---- */
function parseFrDate(v){ if(!v) return ''; v=(''+v).trim();
  let m=v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if(m){ let y=m[3]; if(y.length===2)y='20'+y; return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'); }
  m=v.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[1]+'-'+m[2]+'-'+m[3]; return ''; }
function findOrCreateClient(name){ if(!name) return ''; const ex=db.clients.find(c=>clientName(c).toLowerCase()===name.toLowerCase()); if(ex) return ex.id;
  const c={id:uid(), type:'particulier', nom:name}; db.clients.push(c); return c.id; }
function obatRowsToDevis(rows){
  if(!rows.length) return []; const norm=s=>(s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
  const H={num:['numero','ndevis','reference','ref','devis','piece','numeropiece','ndoc'],
    client:['client','nomclient','societe','raisonsociale','tiers','nomdutiers'],
    date:['date','datedevis','dateemission','datecreation','datedudevis'],
    objet:['objet','libelle','description','titre','designation','nom','intitule'],
    ht:['montantht','totalht','ht','totalhorstaxe','montanthorstaxes','prixht'],
    ttc:['montantttc','totalttc','ttc','montanttoutestaxes','net','montantnet','totalttcnet'],
    tva:['tva','tauxtva','montanttva','totaltva'], statut:['statut','etat','status']};
  const head=rows[0].map(norm); const find=keys=>{ for(const k of keys){ const i=head.indexOf(k); if(i>=0) return i; } return -1; };
  const idx={}; for(const k in H) idx[k]=find(H[k]);
  const toNum=v=>parseFloat((''+(v==null?'':v)).replace(/[^0-9,.-]/g,'').replace(',','.'))||0;
  const mapSt=s=>{ s=(s||'').toString().toLowerCase(); if(/accept|sign|valid|gagn/.test(s))return'accepte'; if(/refus|perdu|annul/.test(s))return'refuse'; if(/envoy|attente|cours|relance/.test(s))return'envoye'; return'brouillon'; };
  const out=[];
  for(let r=1;r<rows.length;r++){ const row=rows[r]; if(!row.some(c=>(c||'').toString().trim())) continue;
    const num=idx.num>=0?(''+row[idx.num]).trim():''; const clientNom=idx.client>=0?(''+row[idx.client]).trim():'';
    if(!num && !clientNom) continue;
    let ht=idx.ht>=0?toNum(row[idx.ht]):0, ttc=idx.ttc>=0?toNum(row[idx.ttc]):0; let rate=20;
    if(ht>0 && ttc>ht){ const rr=Math.round((ttc/ht-1)*1000)/10; if([20,10,5.5,0].includes(rr)) rate=rr; }
    if(!ht && ttc>0){ ht=Math.round(ttc/(1+rate/100)*100)/100; }
    out.push({ num, clientNom, date:idx.date>=0?parseFrDate(row[idx.date]):'', objet:idx.objet>=0?(''+row[idx.objet]).trim():'', ht, rate, statut:mapSt(idx.statut>=0?row[idx.statut]:'') });
  }
  return out;
}
function importObat(e){
  const f=e.target.files[0]; if(!f) return; const name=f.name.toLowerCase();
  const done=items=>{ e.target.value=''; if(!items.length){ alert('Aucun devis détecté. Vérifiez que l\'export contient au moins une colonne « N° » ou « Client » (et de préférence Date, Objet, Montant HT/TTC, TVA, Statut).'); return; }
    let added=0, skipped=0;
    items.forEach(it=>{ if(it.num && db.devis.some(d=>d.num===it.num)){ skipped++; return; }
      const clientId=findOrCreateClient(it.clientNom);
      const v={ id:uid(), name:'Base', remise:0, remiseType:'pct', acompte:30,
        lines: it.ht>0?[{desc:(it.objet||'Prestation (import OBAT)'), qte:1, unit:'u', pu:it.ht, tva:it.rate, photo:'', size:'medium'}]:[] };
      db.devis.push({ id:uid(), num:it.num||nextNum(), createdAt: it.date?new Date(it.date).getTime():Date.now(), statut:it.statut,
        clientId, commercialId:db.lastComId||'', annexes:[], date:it.date||'', valid:'', objet:it.objet||'',
        conditions:'', garantie:'', note:'', variants:[v], active:0, imported:true });
      added++;
    });
    persist(); renderList(); updateAplanBadge();
    alert('Import OBAT terminé : '+added+' devis ajouté(s)'+(skipped?', '+skipped+' déjà présent(s) ignoré(s)':'')+'.');
  };
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){ if(typeof XLSX==='undefined'){ alert('Lecteur Excel indisponible (hors ligne ?). Exportez votre liste OBAT en CSV.'); e.target.value=''; return; }
    const rd=new FileReader(); rd.onload=ev=>{ try{ const wb=XLSX.read(ev.target.result,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; done(obatRowsToDevis(XLSX.utils.sheet_to_json(ws,{header:1,defval:''}))); }catch(err){ alert('Fichier illisible : '+err.message); } }; rd.readAsArrayBuffer(f);
  } else { const rd=new FileReader(); rd.onload=ev=>done(obatRowsToDevis(parseCSV(ev.target.result))); rd.readAsText(f,'UTF-8'); }
}
/* ---- Sauvegarde / restauration de toute la base ---- */
function exportData(){
  const blob=new Blob([JSON.stringify(db)],{type:'application/json;charset=utf-8'});
  saveBlob(blob, 'acf-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json');
}
function importData(e){
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=ev=>{ e.target.value='';
    let obj; try{ obj=JSON.parse(ev.target.result); }catch(err){ alert('Fichier JSON illisible : '+err.message); return; }
    if(!obj || !obj.devis){ alert('Ce fichier ne semble pas être une sauvegarde valide.'); return; }
    if(!confirm('Restaurer ces données ?\n\nATTENTION : cela REMPLACE toutes les données actuelles de l\'application par le contenu du fichier.')) return;
    ['clients','commerciaux','techniciens','products','devis','factures','poses'].forEach(k=>{ if(!Array.isArray(obj[k])) obj[k]=[]; });
    ['seq','facSeq','cmdSeq','fcSeq'].forEach(k=>{ if(obj[k]==null) obj[k]=0; });
    obj.logo = obj.logo || db.logo || DEFAULT_LOGO;
    obj.pagesBase = obj.pagesBase || db.pagesBase || '';
    db = obj; logoData = db.logo; try{ document.getElementById('logoImg').src=logoData; }catch(_){}
    persist(); updateAplanBadge(); showView('list');
    alert('Restauration terminée : '+db.devis.length+' devis, '+db.techniciens.length+' technicien(s), '+db.poses.length+' entrée(s) de planning.');
  };
  rd.readAsText(f,'UTF-8');
}
function downloadObatTemplate(){
  const csv='Numéro;Client;Date;Objet;Montant HT;TVA;Montant TTC;Statut\n'+
    'DEV-2025-014;Restaurant Le Sud;12/03/2025;Chambre froide positive;3500;10;3850;Accepté\n'+
    'DEV-2025-015;M. Martin;18/03/2025;Climatisation bureau;1200;20;1440;Envoyé\n';
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='modele-import-devis.csv'; a.click();
}

/* ================= FACTURATION ================= */
const FAC_TITLE={acompte:"Facture d'acompte", situation:"Facture de situation", totale:"Facture"};
function computeTotals(v){
  let ht=0; const map={};
  (v.lines||[]).forEach(l=>{ if(l.type) return; const t=(+l.qte||0)*(+l.pu||0); ht+=t; map[l.tva]=(map[l.tva]||0)+t; });
  const rem=v.remiseType==='pct'?ht*(+v.remise||0)/100:(+v.remise||0); const remise=Math.min(rem,ht);
  const net=ht-remise, ratio=ht>0?net/ht:0; const tvaRows=[]; let tva=0;
  Object.keys(map).map(Number).sort((a,b)=>b-a).forEach(rate=>{ const base=map[rate]*ratio, m=base*rate/100; tva+=m; if(rate!==0) tvaRows.push({rate,base,m}); });
  return {ht, remise, net, tvaRows, tva, ttc:net+tva};
}
function nextFacNum(){ const y=new Date().getFullYear(); db.facSeq=(db.facSeq||0)+1; return `FAC-${y}-${String(db.facSeq).padStart(3,'0')}`; }
function dejaFacture(id){ return (db.factures||[]).filter(f=>f.devisId===id).reduce((s,f)=>s+(f.montantTTC||0),0); }
let invDevisId=null;
function openInvoiceModal(id){ invDevisId=id; const d=db.devis.find(x=>x.id===id);
  document.getElementById('invDevNum').textContent=d?d.num:'';
  const v=d.variants[d.active||0]||d.variants[0];
  document.getElementById('invType').value='acompte';
  document.getElementById('invPct').value=(v&&v.acompte!=null?v.acompte:30);
  invTypeChange();
  document.getElementById('invoiceModalBg').classList.add('open');
}
function closeInvoiceModal(){ document.getElementById('invoiceModalBg').classList.remove('open'); }
function invTypeChange(){ const type=document.getElementById('invType').value;
  const row=document.getElementById('invPctRow'), lbl=document.getElementById('invPctLabel'), pct=document.getElementById('invPct');
  if(type==='acompte'){ row.style.display=''; lbl.textContent="Pourcentage d'acompte (%)"; if(!pct.value)pct.value=30; }
  else if(type==='situation'){ row.style.display=''; lbl.textContent="Avancement cumulé (%)"; }
  else { row.style.display='none'; }
  invRecalcInfo();
}
function invAmounts(){
  const d=db.devis.find(x=>x.id===invDevisId); const v=d.variants[d.active||0]||d.variants[0]; const t=computeTotals(v);
  const type=document.getElementById('invType').value; const pct=parseFloat(document.getElementById('invPct').value)||0;
  const deja=dejaFacture(invDevisId); let target, montant;
  if(type==='acompte'){ target=t.ttc*pct/100; montant=target; }
  else if(type==='situation'){ target=t.ttc*pct/100; montant=Math.max(0,target-deja); }
  else { target=t.ttc; montant=Math.max(0,target-deja); }
  const prop=t.ttc>0?montant/t.ttc:0; const htPart=t.net*prop, tvaPart=t.tva*prop;
  return {d,v,t,type,pct,deja,target,montant,htPart,tvaPart};
}
function invRecalcInfo(){
  const a=invAmounts(); const el=document.getElementById('invInfo');
  let h=`Total TTC du devis : <b>${eur(a.t.ttc)}</b>`;
  if(a.type==='situation') h+=`<br>Avancement demandé : ${eur(a.target)}`;
  if(a.deja>0 && a.type!=='acompte') h+=`<br>Déjà facturé : − ${eur(a.deja)}`;
  h+=`<br><span style="color:var(--bleu); font-weight:700">Net à payer de cette facture : ${eur(a.montant)}</span>`;
  el.innerHTML=h;
}
function doGenerateInvoice(){
  const a=invAmounts();
  const fac={ id:uid(), num:nextFacNum(), devisId:invDevisId, type:a.type, pct:a.type==='totale'?100:a.pct,
    montantTTC:a.montant, htPart:a.htPart, tvaPart:a.tvaPart, deja:a.deja, date:new Date().toISOString().slice(0,10), createdAt:Date.now() };
  db.factures.push(fac); persist(); closeInvoiceModal();
  renderInvoice(fac); showView('invoice');
}
function renderInvoice(fac){
  const d=db.devis.find(x=>x.id===fac.devisId); const v=d.variants[d.active||0]||d.variants[0]; const t=computeTotals(v);
  const c=db.clients.find(x=>x.id===d.clientId); const com=db.commerciaux.find(x=>x.id===d.commercialId);
  const title=FAC_TITLE[fac.type]||'Facture';
  document.getElementById('invoiceTitleBar').textContent=title+' '+fac.num;
  // bloc client (adresse)
  let cli='<span style="color:var(--muted)">—</span>';
  if(c){ const L=[`<div class="cname">${esc(clientName(c))}</div>`];
    if(c.type==='pro'&&c.contact) L.push(`<div>À l'attention de ${esc(c.contact)}</div>`);
    if(c.adresse) L.push(`<div>${esc(c.adresse)}</div>`);
    if(c.cp||c.ville) L.push(`<div>${esc([c.cp,c.ville].filter(Boolean).join(' '))}</div>`);
    if(c.type==='pro'&&c.siret) L.push(`<div class="addr-muted">SIRET ${esc(c.siret)}</div>`);
    cli=L.join(''); }
  // lignes (référence)
  let n=0; const lines=(v.lines||[]).map(l=>{
    if(l.type==='texte'){ return `<tr><td class="col-num"></td><td colspan="6" style="padding:6px 8px">${l.content||''}</td></tr>`; }
    if(l.type){ const cls=l.type==='section'?'row-section':'row-subsection';
      return `<tr class="${cls}"><td colspan="7"><div class="sec-bar"><input class="sec-title" value="${esc(l.title||'')}" readonly></div></td></tr>`; }
    n++; const lt=(+l.qte||0)*(+l.pu||0);
    return `<tr><td class="col-num">${n}</td><td class="col-desc">${l.cat?'<span class="line-cat cat-'+l.cat+'">'+CAT_LABEL[l.cat]+'</span> ':''}<div class="desc">${l.desc||''}</div></td>
      <td class="col-qte" style="text-align:right">${(+l.qte||0).toLocaleString('fr-FR')}</td>
      <td class="col-unit">${esc(l.unit||'')}</td>
      <td class="col-pu" style="text-align:right">${eur(+l.pu||0)}</td>
      <td class="col-tva" style="text-align:right">${(''+l.tva).replace('.',',')} %</td>
      <td class="col-tot" style="text-align:right">${eur(lt)}</td></tr>`;
  }).join('');
  // totaux facture
  const tvaLines=t.tvaRows.map(r=>`<div class="row sub"><span>TVA ${(''+r.rate).replace('.',',')} %</span><span>${eur(r.m)}</span></div>`).join('');
  let facBlock='';
  if(fac.type==='acompte') facBlock=`<div class="row"><span class="lbl">Acompte ${fac.pct} % (HT ${eur(fac.htPart)} + TVA ${eur(fac.tvaPart)})</span><span>${eur(fac.montantTTC)}</span></div>`;
  else if(fac.type==='situation') facBlock=`<div class="row"><span class="lbl">Avancement ${fac.pct} %</span><span>${eur(t.ttc*fac.pct/100)}</span></div>`+
     (fac.deja>0?`<div class="row"><span class="lbl">Déjà facturé</span><span>− ${eur(fac.deja)}</span></div>`:'');
  else facBlock=`<div class="row"><span class="lbl">Total du marché TTC</span><span>${eur(t.ttc)}</span></div>`+
     (fac.deja>0?`<div class="row"><span class="lbl">Déjà facturé</span><span>− ${eur(fac.deja)}</span></div>`:'');
  document.getElementById('invoicePage').innerHTML=`
    <div class="head">
      <div class="logo-box"><img src="${logoData}" alt="Logo"></div>
      <div class="company"><div class="name">SAS ACF CHAPPERT</div><div class="line">9 Rue Jacques Monod</div>
        <div class="line">81000 ALBI</div><div class="line">Tél. 05.63.47.11.88</div><div class="line">contact@acfchappert.fr</div>
        <div class="line">TVA FR90405243619</div></div>
    </div>
    <h2 class="doc-title">${esc(title)}</h2>
    <div class="envelope">
      <div class="env-left"><div class="card"><h3>Facture</h3>
        <div class="field"><label>N° de facture</label><div>${esc(fac.num)}</div></div>
        <div class="field"><label>Date</label><div>${new Date(fac.date).toLocaleDateString('fr-FR')}</div></div>
        <div class="field"><label>Réf. devis</label><div>${esc(d.num)}</div></div>
        ${d.objet?`<div class="field"><label>Objet</label><div>${esc(d.objet)}</div></div>`:''}
        ${com?`<div class="field"><label>Interlocuteur</label><div>${esc(com.nom)}</div></div>`:''}
      </div></div>
      <div class="env-right"><div class="addr-block"><div class="addr-tag">Client</div><div class="client-view">${cli}</div></div></div>
    </div>
    <table class="lines"><thead><tr><th class="col-num">#</th><th>Désignation</th><th class="col-qte">Qté</th>
      <th class="col-unit">Unité</th><th class="col-pu">P.U. HT</th><th class="col-tva">TVA</th><th class="col-tot">Total HT</th></tr></thead>
      <tbody>${lines}</tbody></table>
    <div class="totals-wrap"><div class="notes-col"><div class="card"><h3>Règlement</h3>
      <div style="font-size:13px">${esc(d.conditions||'')}</div></div></div>
      <div class="totals">
        <div class="row"><span class="lbl">Total HT devis</span><span>${eur(t.ht)}</span></div>
        ${t.remise>0?`<div class="row"><span class="lbl">Remise</span><span>− ${eur(t.remise)}</span></div>`:''}
        ${tvaLines}
        <div class="row"><span class="lbl">Total TTC devis</span><span>${eur(t.ttc)}</span></div>
        <div style="height:8px"></div>
        ${facBlock}
        <div class="row ttc"><span class="lbl">NET À PAYER</span><span>${eur(fac.montantTTC)}</span></div>
      </div>
    </div>
    <div class="page-footer">ACF CHAPPERT - 9 rue Jacques Monod, 81000 Albi, France - SAS au capital de 200000 € - 40524361900013
RCS ALBI - APE : 3320B   Qualipac : QPAC/35973
Immatriculé au Répertoire des métiers sous le N° 405 243 619 R.C.S ALBI
Tél : 05 63 47 11 88 - Email : contact@acfchappert.fr - https://acfchappert.com/
Garantie décennale - GROUPAMA - 14 Rue de Vidailhan, 31130 Balma, France - Couverture : NATIONALE</div>`;
  currentDoc={ email:c?c.email:'', name:c?clientName(c):'', filename:title.replace(/[^A-Za-z0-9]+/g,'_')+'_'+fac.num+'.pdf',
    subject:title+' '+fac.num+' – SAS ACF CHAPPERT',
    body:`Bonjour,\n\nVeuillez trouver ci-joint la ${title.toLowerCase()} ${fac.num} relative au devis ${d.num}${d.objet?' ('+d.objet+')':''}, d'un montant de ${eur(fac.montantTTC)} TTC.\n\nNous restons à votre disposition.\n\nCordialement,\n${com?com.nom:''}\nSAS ACF CHAPPERT\nTél. 05 63 47 11 88 – contact@acfchappert.fr` };
}

/* ---- Confirmation de commande ---- */
let currentDoc=null;
function sendDocByEmail(){
  if(!currentDoc){ alert('Aucun document à envoyer.'); return; }
  window.location.href='mailto:'+encodeURIComponent(currentDoc.email||'')+'?subject='+encodeURIComponent(currentDoc.subject||'')+'&body='+encodeURIComponent(currentDoc.body||'');
}
// Envoi du devis par mail (pièce jointe à ajouter manuellement)
function sendDevisByEmail(){
  if(!cur) return; saveDevis(false);
  const c=db.clients.find(x=>x.id===cur.clientId); const com=db.commerciaux.find(x=>x.id===cur.commercialId);
  const to=c?c.email:''; const subj='Devis '+cur.num+(cur.objet?' – '+cur.objet:'')+' – SAS ACF CHAPPERT';
  const body=`Bonjour,\n\nVeuillez trouver ci-joint votre devis ${cur.num}${cur.objet?' ('+cur.objet+')':''}.\n\n(N'oubliez pas de joindre le PDF du devis à ce message.)\n\nNous restons à votre disposition.\n\nCordialement,\n${com?com.nom:''}\nSAS ACF CHAPPERT\nTél. 05 63 47 11 88 – contact@acfchappert.fr`;
  window.location.href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
}
function renderOrderConfirmation(d){
  const v=d.variants[d.active||0]||d.variants[0]; const t=computeTotals(v);
  const c=db.clients.find(x=>x.id===d.clientId); const com=db.commerciaux.find(x=>x.id===d.commercialId);
  const acPct=(v&&v.acompte!=null?v.acompte:30); const acompte=t.ttc*acPct/100;
  document.getElementById('invoiceTitleBar').textContent='Confirmation de commande '+d.orderConfirm.num;
  let cli='<span style="color:var(--muted)">—</span>';
  if(c){ const L=[`<div class="cname">${esc(clientName(c))}</div>`];
    if(c.type==='pro'&&c.contact) L.push(`<div>À l'attention de ${esc(c.contact)}</div>`);
    if(c.adresse) L.push(`<div>${esc(c.adresse)}</div>`);
    if(c.cp||c.ville) L.push(`<div>${esc([c.cp,c.ville].filter(Boolean).join(' '))}</div>`);
    cli=L.join(''); }
  let n=0; const lines=(v.lines||[]).map(l=>{
    if(l.type==='texte'){ return `<tr><td class="col-num"></td><td colspan="6" style="padding:6px 8px">${l.content||''}</td></tr>`; }
    if(l.type){ const cls=l.type==='section'?'row-section':'row-subsection';
      return `<tr class="${cls}"><td colspan="7"><div class="sec-bar"><input class="sec-title" value="${esc(l.title||'')}" readonly></div></td></tr>`; }
    n++; const lt=(+l.qte||0)*(+l.pu||0);
    return `<tr><td class="col-num">${n}</td><td class="col-desc">${l.cat?'<span class="line-cat cat-'+l.cat+'">'+CAT_LABEL[l.cat]+'</span> ':''}<div class="desc">${l.desc||''}</div></td>
      <td class="col-qte" style="text-align:right">${(+l.qte||0).toLocaleString('fr-FR')}</td>
      <td class="col-unit">${esc(l.unit||'')}</td>
      <td class="col-pu" style="text-align:right">${eur(+l.pu||0)}</td>
      <td class="col-tva" style="text-align:right">${(''+l.tva).replace('.',',')} %</td>
      <td class="col-tot" style="text-align:right">${eur(lt)}</td></tr>`;
  }).join('');
  const tvaLines=t.tvaRows.map(r=>`<div class="row sub"><span>TVA ${(''+r.rate).replace('.',',')} %</span><span>${eur(r.m)}</span></div>`).join('');
  document.getElementById('invoicePage').innerHTML=`
    <div class="head">
      <div class="logo-box"><img src="${logoData}" alt="Logo"></div>
      <div class="company"><div class="name">SAS ACF CHAPPERT</div><div class="line">9 Rue Jacques Monod</div>
        <div class="line">81000 ALBI</div><div class="line">Tél. 05.63.47.11.88</div><div class="line">contact@acfchappert.fr</div></div>
    </div>
    <h2 class="doc-title">Confirmation de commande</h2>
    <div class="envelope">
      <div class="env-left"><div class="card"><h3>Commande</h3>
        <div class="field"><label>N° de commande</label><div>${esc(d.orderConfirm.num)}</div></div>
        <div class="field"><label>Date</label><div>${new Date(d.orderConfirm.date).toLocaleDateString('fr-FR')}</div></div>
        <div class="field"><label>Réf. devis</label><div>${esc(d.num)}</div></div>
        ${d.objet?`<div class="field"><label>Objet</label><div>${esc(d.objet)}</div></div>`:''}
        ${com?`<div class="field"><label>Interlocuteur</label><div>${esc(com.nom)}</div></div>`:''}
      </div></div>
      <div class="env-right"><div class="addr-block"><div class="addr-tag">Client</div><div class="client-view">${cli}</div></div></div>
    </div>
    <div style="margin:14px 0; padding:10px 14px; border:1px solid var(--orange); background:#fff7e8; border-radius:8px; color:#8a5a00; font-weight:600; text-align:center">
      Commande ferme et définitive — <u>sous réserve de réception de l'acompte de ${acPct} % (${eur(acompte)} TTC)</u>.
    </div>
    <table class="lines"><thead><tr><th class="col-num">#</th><th>Désignation</th><th class="col-qte">Qté</th>
      <th class="col-unit">Unité</th><th class="col-pu">P.U. HT</th><th class="col-tva">TVA</th><th class="col-tot">Total HT</th></tr></thead>
      <tbody>${lines}</tbody></table>
    <div class="totals-wrap"><div class="notes-col"><div class="card"><h3>Conditions</h3>
      <div style="font-size:13px">${esc(d.conditions||'')}</div></div></div>
      <div class="totals">
        <div class="row"><span class="lbl">Total HT</span><span>${eur(t.ht)}</span></div>
        ${t.remise>0?`<div class="row"><span class="lbl">Remise</span><span>− ${eur(t.remise)}</span></div>`:''}
        ${tvaLines}
        <div class="row ttc"><span class="lbl">TOTAL TTC</span><span>${eur(t.ttc)}</span></div>
        <div class="row"><span class="lbl">Acompte ${acPct} % à réception</span><span>${eur(acompte)}</span></div>
        <div class="row sub"><span>Solde à la livraison</span><span>${eur(t.ttc-acompte)}</span></div>
      </div>
    </div>
    <div class="sign-grid">
      <div class="sign-box"><h3>Bon pour accord</h3><div class="hint">Date et signature du client précédées de « Bon pour accord »</div></div>
      <div class="sign-box"><h3>SAS ACF CHAPPERT</h3><div class="hint">Cachet et signature</div></div>
    </div>
    <div class="page-footer">ACF CHAPPERT - 9 rue Jacques Monod, 81000 Albi, France - SAS au capital de 200000 € - 40524361900013
RCS ALBI - APE : 3320B   Qualipac : QPAC/35973
Immatriculé au Répertoire des métiers sous le N° 405 243 619 R.C.S ALBI
Tél : 05 63 47 11 88 - Email : contact@acfchappert.fr - https://acfchappert.com/
Garantie décennale - GROUPAMA - 14 Rue de Vidailhan, 31130 Balma, France - Couverture : NATIONALE</div>`;
  currentDoc={ email:c?c.email:'', name:c?clientName(c):'', filename:'Confirmation_commande_'+d.orderConfirm.num+'.pdf',
    subject:'Confirmation de commande '+d.orderConfirm.num+' – SAS ACF CHAPPERT',
    body:`Bonjour,\n\nNous vous remercions de votre confiance. Suite à votre acceptation du devis ${d.num}${d.objet?' ('+d.objet+')':''}, veuillez trouver ci-joint notre confirmation de commande ${d.orderConfirm.num}, d'un montant de ${eur(t.ttc)} TTC.\n\nLa commande deviendra ferme et définitive à réception de l'acompte de ${acPct} % (${eur(acompte)} TTC).\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\n${com?com.nom:''}\nSAS ACF CHAPPERT\nTél. 05 63 47 11 88 – contact@acfchappert.fr` };
}

/* ================= NUMÉROTATION AUTO ================= */
function nextNum(){ const y=new Date().getFullYear(); db.seq=(db.seq||0)+1; return `DEV-${y}-${String(db.seq).padStart(3,'0')}`; }

/* ================= ÉDITEUR ================= */
let cur=null;  // devis en cours d'édition
function emptyVariant(name){ return {id:uid(), name:name||'Base', lines:[], remise:0, remiseType:'pct', acompte:30}; }
function newDevis(){
  cur={ id:uid(), num:nextNum(), createdAt:Date.now(), statut:'brouillon', clientId:'', commercialId:db.lastComId||'', annexes:[],
    date:new Date().toISOString().slice(0,10), valid:new Date(Date.now()+30*864e5).toISOString().slice(0,10),
    objet:'',
    conditions:'Acompte de 30 % à la commande, solde à la fin des travaux. Règlement par virement ou chèque à réception de facture.',
    garantie:'Matériel neuf garanti 1 an pièces contre tout vice de fabrication, à compter de la livraison, selon les conditions constructeur (voir Article 5 des CGV).', note:'',
    variants:[ (()=>{const v=emptyVariant('Base'); v.lines=[{desc:'',qte:1,unit:'u',pu:0,tva:20,photo:'',size:'medium'},{desc:'',qte:1,unit:'u',pu:0,tva:10,photo:'',size:'medium'}]; return v;})() ],
    active:0 };
  db.devis.push(cur); persist();
  loadEditor();
}
function openDevis(id){ cur=db.devis.find(x=>x.id===id); if(!cur) return; if(cur.active==null)cur.active=0; loadEditor(); }
function loadEditor(){
  showView('editor');
  document.getElementById('devNum').value=cur.num;
  document.getElementById('devDate').value=cur.date||'';
  document.getElementById('devValid').value=cur.valid||'';
  document.getElementById('devObjet').value=cur.objet||'';
  document.getElementById('devStatut').value=cur.statut||'brouillon';
  document.getElementById('conditions').value=cur.conditions||'';
  document.getElementById('garantie').value=cur.garantie||'';
  document.getElementById('note').value=cur.note||'';
  blockToggle('garantieBlock','garantie'); blockToggle('noteBlock','note');
  fillComSelect(cur.commercialId||''); renderComView();
  fillClientSelect(cur.clientId); renderClientView();
  if(!cur.annexes) cur.annexes=[];
  renderVariantTabs(); renderLines(); recalc(); renderAnnexes(); renderCGV();
}
function fillClientSelect(id){ // met à jour le champ de saisie client
  cur.clientId=id||'';
  const c=db.clients.find(x=>x.id===cur.clientId);
  document.getElementById('clientInput').value = c ? clientName(c) : '';
  document.getElementById('editClientBtn').style.display = cur.clientId ? 'inline-flex':'none';
  renderClientView();
}
function selectClient(id){ fillClientSelect(id); hideClientAC(); scheduleSave(); }
function hideClientAC(){ document.getElementById('clientAC').classList.remove('open'); }
function clientSuggest(){
  const inp=document.getElementById('clientInput'); const q=(inp.value||'').toLowerCase().trim();
  const box=document.getElementById('clientAC');
  // si le champ ne correspond plus au client choisi, on désélectionne
  const sel=db.clients.find(x=>x.id===cur.clientId);
  if(sel && clientName(sel).toLowerCase()!==q){ cur.clientId=''; document.getElementById('editClientBtn').style.display='none'; renderClientView(); scheduleSave(); }
  const list=db.clients.filter(c=>clientName(c).toLowerCase().includes(q)||(c.ville||'').toLowerCase().includes(q))
    .sort((a,b)=>clientName(a).localeCompare(clientName(b))).slice(0,8);
  if(!list.length){ box.innerHTML='<div class="ac-item" style="color:var(--muted)">Aucun client — cliquez sur « ＋ Client » pour le créer.</div>'; box.classList.add('open'); return; }
  box.innerHTML=list.map(c=>`<div class="ac-item" onmousedown="event.preventDefault();selectClient('${c.id}')">
    <div class="ac-desc">${esc(clientName(c))} <span class="tag ${c.type}" style="font-size:9px">${c.type==='pro'?'Pro':'Part.'}</span></div>
    <div class="ac-meta">${esc([c.cp,c.ville].filter(Boolean).join(' '))}${c.tel?' · '+esc(c.tel):''}</div></div>`).join('');
  box.classList.add('open');
}
document.addEventListener('mousedown', e=>{ const b=document.getElementById('clientAC');
  if(b && b.classList.contains('open') && !(e.target.closest && (e.target.closest('#clientAC')||e.target.id==='clientInput'))) hideClientAC(); });
function editSelectedClient(){ if(cur.clientId) openClientModal(cur.clientId); }
function renderClientView(){
  const c=db.clients.find(x=>x.id===cur.clientId); const el=document.getElementById('clientView');
  if(!c){ el.innerHTML='<span style="color:var(--muted)">Aucun client sélectionné.</span>'; return; }
  const L=[];
  L.push(`<div class="cname">${esc(clientName(c))}</div>`);
  if(c.type==='pro'&&c.contact) L.push(`<div>À l'attention de ${esc(c.contact)}</div>`);
  if(c.adresse) L.push(`<div>${esc(c.adresse)}</div>`);
  if(c.cp||c.ville) L.push(`<div>${esc([c.cp,c.ville].filter(Boolean).join(' '))}</div>`);
  const cont=[]; if(c.tel)cont.push('Tél. '+esc(c.tel)); if(c.email)cont.push(esc(c.email));
  if(cont.length) L.push(`<div class="addr-muted">${cont.join(' · ')}</div>`);
  const fisc=[]; if(c.type==='pro'&&c.siret)fisc.push('SIRET '+esc(c.siret)); if(c.type==='pro'&&c.tvaIntra)fisc.push('TVA '+esc(c.tvaIntra));
  if(fisc.length) L.push(`<div class="addr-muted">${fisc.join(' · ')}</div>`);
  el.innerHTML=L.join('');
}

/* ---- Variantes ---- */
function renderVariantTabs(){
  const el=document.getElementById('variantTabs');
  el.innerHTML=cur.variants.map((v,i)=>`<span class="vtab ${i===cur.active?'active':''}" onclick="switchVariant(${i})">
    <span ondblclick="renameVariant(${i},event)">${esc(v.name)}</span>
    ${cur.variants.length>1?`<span class="vx" title="Supprimer" onclick="delVariant(${i},event)">×</span>`:''}</span>`).join('');
  document.getElementById('docVariantLabel').textContent = cur.variants.length>1 ? '— '+cur.variants[cur.active].name : '';
}
function switchVariant(i){ syncActiveVariant(); cur.active=i; renderVariantTabs(); renderLines(); recalc(); }
function addVariant(){ syncActiveVariant();
  const base=cur.variants[cur.active]; const v=JSON.parse(JSON.stringify(base)); v.id=uid();
  v.name='Variante '+String.fromCharCode(65+cur.variants.length-1);
  cur.variants.push(v); cur.active=cur.variants.length-1; renderVariantTabs(); renderLines(); recalc(); persist();
}
function delVariant(i,e){ e.stopPropagation(); if(cur.variants.length<2) return;
  if(!confirm('Supprimer la variante « '+cur.variants[i].name+' » ?')) return;
  cur.variants.splice(i,1); if(cur.active>=cur.variants.length) cur.active=cur.variants.length-1;
  renderVariantTabs(); renderLines(); recalc(); persist();
}
function renameVariant(i,e){ e.stopPropagation();
  const n=prompt('Nom de la variante :', cur.variants[i].name); if(n){ cur.variants[i].name=n.trim()||cur.variants[i].name; renderVariantTabs(); } }

/* ---- Lignes ---- */
const TVA_RATES=[20,10,5.5,0];
function tvaOptions(sel){ return TVA_RATES.map(r=>`<option value="${r}" ${r===sel?'selected':''}>${(''+r).replace('.',',')} %</option>`).join(''); }
const CAT_LABEL={fourniture:'Fourniture', materiel:'Matériel', mo:'Main d\'œuvre'};
function changeCat(sel){ const cell=sel.closest('.col-desc'); const tag=cell.querySelector('.line-cat'); const v=sel.value;
  tag.dataset.cat=v; tag.className='line-cat cat-'+(v||'none'); tag.textContent=CAT_LABEL[v]||''; scheduleSave(); }
const SIZES={petit:'small',moyen:'medium',grand:'large'};
function sizeOptions(sel){ return Object.entries(SIZES).map(([lbl,cls])=>`<option value="${cls}" ${cls===sel?'selected':''}>${lbl.charAt(0).toUpperCase()+lbl.slice(1)}</option>`).join(''); }

function renderLines(){ document.getElementById('lineBody').innerHTML='';
  (cur.variants[cur.active].lines||[]).forEach(l=> (l.type==='section'||l.type==='subsection') ? addSection(l.type,l) : (l.type==='texte' ? addTextRow(l) : addLine(l)));
  if(!cur.variants[cur.active].lines.length) addLine({});
  document.getElementById('remise').value=cur.variants[cur.active].remise||0;
  document.getElementById('remiseType').value=cur.variants[cur.active].remiseType||'pct';
  document.getElementById('acompte').value=cur.variants[cur.active].acompte!=null?cur.variants[cur.active].acompte:30;
}
function moveCellHTML(){
  return `<td class="col-move no-print"><div class="mv">
    <span class="drag" draggable="true" title="Glisser pour déplacer">⠿</span>
    <button class="arw" title="Monter" onclick="moveRow(this,-1)">▲</button>
    <button class="arw" title="Descendre" onclick="moveRow(this,1)">▼</button>
  </div></td>`;
}
function menuCellHTML(){ return `<td class="col-act no-print"><button class="menu-btn" title="Actions" onclick="openRowMenu(this)">⋯</button></td>`; }
function placeRow(tr, ref, pos){ const tb=document.getElementById('lineBody');
  if(pos==='before'&&ref) tb.insertBefore(tr,ref);
  else if(pos==='after'&&ref) tb.insertBefore(tr, ref.nextSibling);
  else tb.appendChild(tr); }
function addLine(data={}, ref, pos){
  const size=data.size||'medium';
  const tr=document.createElement('tr');
  tr.innerHTML=`
    ${moveCellHTML()}
    <td class="col-num idx"></td>
    <td class="col-desc">
      <div class="fmt-bar no-print">
        <button type="button" class="fmt" title="Gras" data-cmd="bold"><b>G</b></button>
        <button type="button" class="fmt" title="Italique" data-cmd="italic"><i>I</i></button>
        <button type="button" class="fmt" title="Souligné" data-cmd="underline"><u>S</u></button>
        <button type="button" class="fmt" title="Barré" data-cmd="strikeThrough"><s>B</s></button>
        <button type="button" class="fmt" title="Liste" data-cmd="insertUnorderedList">•</button>
        <input type="color" class="fmt-color" title="Couleur" value="#1f2733">
        <span class="fmt-sep"></span>
        <select class="cat-sel" title="Catégorie de ligne" onchange="changeCat(this)">
          <option value="">Catégorie…</option>
          <option value="fourniture" ${data.cat==='fourniture'?'selected':''}>Fourniture</option>
          <option value="materiel" ${data.cat==='materiel'?'selected':''}>Matériel</option>
          <option value="mo" ${data.cat==='mo'?'selected':''}>Main d'œuvre</option>
        </select>
        <span class="fmt-sep"></span>
        <label style="font-size:11px;color:var(--muted)">Photo</label>
        <select class="size-sel" title="Taille de la photo" onchange="changeSize(this)">${sizeOptions(size)}</select>
      </div>
      <span class="line-cat cat-${data.cat||'none'}" data-cat="${data.cat||''}">${CAT_LABEL[data.cat]||''}</span>
      <div class="desc" contenteditable="true" data-ph="Désignation / description…">${data.desc||''}</div>
      <div class="photo-cell photo-${size}">
        <div class="photo-drop" onclick="this.parentNode.querySelector('input[type=file]').click()"><span>＋ Ajouter une photo</span></div>
        <button class="photo-del no-print" title="Retirer" onclick="delPhoto(this)">×</button>
        <input type="file" accept="image/*" style="display:none" onchange="setPhoto(this)">
      </div>
    </td>
    <td class="col-qte"><input class="num qte" type="number" min="0" step="0.01" value="${data.qte!=null?data.qte:1}" oninput="recalc()"></td>
    <td class="col-unit"><input class="unit" list="unitList" value="${data.unit||'u'}" oninput="scheduleSave()"></td>
    <td class="col-pu"><input class="num pu" type="number" min="0" step="0.01" value="${data.pu!=null?data.pu:0}" oninput="recalc()"></td>
    <td class="col-tva"><select class="tva" onchange="recalc()">${tvaOptions(data.tva!=null?data.tva:20)}</select></td>
    <td class="col-tot lineTot">0,00 €</td>
    ${menuCellHTML()}`;
  tr.classList.add('row-item');
  placeRow(tr, ref, pos);
  if(data.photo) setPhotoData(tr,data.photo);
  renumber();
  return tr;
}
function addSection(type,data={}, ref, pos){
  const tr=document.createElement('tr'); tr.className='row-'+type;
  const tag = type==='section' ? 'Section' : 'Sous-section';
  tr.innerHTML=`${moveCellHTML()}
    <td colspan="7">
    <div class="sec-bar">
      <span class="sec-tag no-print">${tag}</span>
      <input class="sec-title" value="${esc(data.title||'').replace(/"/g,'&quot;')}" placeholder="Titre de la ${type==='section'?'section':'sous-section'}…" oninput="scheduleSave()">
      <span class="sec-sub" data-sub></span>
    </div></td>
    ${menuCellHTML()}`;
  placeRow(tr, ref, pos);
  renumber();
  return tr;
}
function addTextRow(data={}, ref, pos){
  const tr=document.createElement('tr'); tr.className='row-texte';
  tr.innerHTML=`${moveCellHTML()}
    <td colspan="7">
      <div class="fmt-bar no-print">
        <button type="button" class="fmt" title="Gras" data-cmd="bold"><b>G</b></button>
        <button type="button" class="fmt" title="Italique" data-cmd="italic"><i>I</i></button>
        <button type="button" class="fmt" title="Souligné" data-cmd="underline"><u>S</u></button>
        <button type="button" class="fmt" title="Liste" data-cmd="insertUnorderedList">•</button>
        <input type="color" class="fmt-color" title="Couleur" value="#1f2733">
        <span style="font-size:11px;color:var(--muted);margin-left:4px">Texte libre</span>
      </div>
      <div class="txt-libre desc" contenteditable="true" data-ph="Texte libre (paragraphe, mention, précision…)">${data.content||''}</div>
    </td>
    ${menuCellHTML()}`;
  placeRow(tr, ref, pos);
  renumber();
  return tr;
}
function renumber(){ let n=0; document.querySelectorAll('#lineBody tr.row-item').forEach(tr=>{ n++; const idx=tr.querySelector('.idx'); if(idx) idx.textContent=n; }); }

/* ---- Déplacement par flèches ---- */
function moveRow(btn,dir){ const tr=btn.closest('tr'); const tb=tr.parentNode;
  if(dir<0){ const p=tr.previousElementSibling; if(p) tb.insertBefore(tr,p); }
  else { const n=tr.nextElementSibling; if(n) tb.insertBefore(n,tr); }
  renumber(); recalc(); }

/* ---- Glisser-déposer ---- */
let dragRow=null;
function setupDnD(){
  const tb=document.getElementById('lineBody');
  tb.addEventListener('dragstart', e=>{ const hn=e.target.closest && e.target.closest('.drag'); if(!hn){ return; }
    dragRow=hn.closest('tr'); dragRow.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain','');}catch(_){} });
  tb.addEventListener('dragend', ()=>{ if(dragRow) dragRow.classList.remove('dragging'); tb.querySelectorAll('.drop-target').forEach(r=>r.classList.remove('drop-target')); dragRow=null; renumber(); recalc(); });
  tb.addEventListener('dragover', e=>{ if(!dragRow) return; e.preventDefault();
    const tr=e.target.closest('tr'); if(!tr||tr===dragRow) return;
    const r=tr.getBoundingClientRect(); const after=(e.clientY-r.top)/r.height>0.5;
    tb.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target')); tr.classList.add('drop-target');
    tb.insertBefore(dragRow, after? tr.nextSibling : tr); });
  tb.addEventListener('drop', e=>{ e.preventDefault(); tb.querySelectorAll('.drop-target').forEach(r=>r.classList.remove('drop-target')); });
}

/* ---- Menu contextuel de ligne ---- */
let menuRow=null;
function openRowMenu(btn){
  menuRow=btn.closest('tr'); const menu=document.getElementById('rowMenu');
  const r=btn.getBoundingClientRect();
  menu.classList.add('open');
  let left=r.right+window.scrollX-menu.offsetWidth; if(left<8) left=8;
  menu.style.left=left+'px'; menu.style.top=(r.bottom+window.scrollY+4)+'px';
}
function closeRowMenu(){ document.getElementById('rowMenu').classList.remove('open'); menuRow=null; }
function readItemData(tr){
  const cell=tr.querySelector('.photo-cell'); const size=(cell.className.match(/photo-(small|medium|large)/)||[])[1]||'medium';
  const catSel=tr.querySelector('.cat-sel');
  return { desc:tr.querySelector('.desc').innerHTML, cat:catSel?catSel.value:'', qte:tr.querySelector('.qte').value, unit:tr.querySelector('.unit').value,
    pu:tr.querySelector('.pu').value, tva:parseFloat(tr.querySelector('.tva').value), photo:cell.dataset.photo||'', size };
}
function rowMenuAction(action, what){
  if(!menuRow) return; const tr=menuRow;
  const isSec=tr.classList.contains('row-section'), isSub=tr.classList.contains('row-subsection');
  const isTexte=tr.classList.contains('row-texte');
  if(action==='delete'){ tr.remove(); }
  else if(action==='duplicate'){
    if(isSec||isSub){ const t=isSec?'section':'subsection'; addSection(t,{title:tr.querySelector('.sec-title').value}, tr, 'after'); }
    else if(isTexte){ addTextRow({content:tr.querySelector('.desc').innerHTML}, tr, 'after'); }
    else addLine(readItemData(tr), tr, 'after');
  }
  else if(action==='above'||action==='below'){
    const pos = action==='above'?'before':'after';
    if(what==='line') addLine({}, tr, pos);
    else if(what==='texte') addTextRow({}, tr, pos);
    else addSection(what, {}, tr, pos);
  }
  closeRowMenu(); renumber(); recalc();
}
document.addEventListener('mousedown', e=>{ const m=document.getElementById('rowMenu');
  if(m.classList.contains('open') && !(e.target.closest && (e.target.closest('#rowMenu')||e.target.closest('.menu-btn')))) closeRowMenu(); });
function changeSize(sel){ const cell=sel.closest('.col-desc').querySelector('.photo-cell');
  cell.className='photo-cell photo-'+sel.value; scheduleSave(); }
function setPhoto(input){ const f=input.files[0]; if(!f)return; const r=new FileReader();
  r.onload=ev=>{ setPhotoData(input.closest('tr'),ev.target.result); recalc(); }; r.readAsDataURL(f); }
function setPhotoData(tr,src){ const cell=tr.querySelector('.photo-cell');
  cell.querySelector('.photo-drop').innerHTML=`<img src="${src}">`; cell.classList.add('has-img'); cell.dataset.photo=src; }
function delPhoto(btn){ const cell=btn.closest('.photo-cell'); cell.classList.remove('has-img'); delete cell.dataset.photo;
  cell.querySelector('.photo-drop').innerHTML='<span>＋ Ajouter une photo</span>'; cell.querySelector('input[type=file]').value=''; scheduleSave(); }

/* ---- Mise en forme désignation ---- */
document.addEventListener('mousedown', e=>{ const b=e.target.closest && e.target.closest('.fmt'); if(!b)return;
  e.preventDefault(); const cell=b.closest('.col-desc')||b.closest('td'); const d=cell&&cell.querySelector('.desc'); if(!d)return; d.focus(); document.execCommand(b.dataset.cmd,false,null); });
document.addEventListener('input', e=>{ if(e.target.classList && e.target.classList.contains('fmt-color')){
  const cell=e.target.closest('.col-desc')||e.target.closest('td'); const d=cell&&cell.querySelector('.desc'); if(d){ d.focus(); document.execCommand('foreColor',false,e.target.value); } }
  if(e.target.classList && e.target.classList.contains('desc')){ scheduleSave(); const tr=e.target.closest('tr'); if(tr&&tr.classList.contains('row-item')) showAC(e.target); } });
try{ document.execCommand('styleWithCSS',false,true); }catch(_){}

/* ---- Autocomplétion produit (à partir des devis précédents) ---- */
function htmlToText(h){ const d=document.createElement('div'); d.innerHTML=h||''; return (d.textContent||'').replace(/\s+/g,' ').trim(); }
function buildCatalog(){
  const seen={};
  // 1) produits du catalogue importé/saisi
  (db.products||[]).forEach(p=>{ if(!p.desc)return; seen[p.desc.toLowerCase()]={desc:p.desc, unit:p.unit||'u', pu:+p.pu||0, tva:p.tva!=null?p.tva:20}; });
  // 2) produits déjà saisis dans des devis (écrasent avec la valeur la plus récente)
  db.devis.forEach(d=>d.variants.forEach(v=>(v.lines||[]).forEach(l=>{
    if(l.type||!l.desc) return; const plain=htmlToText(l.desc); if(plain.length<2) return;
    seen[plain.toLowerCase()]={desc:plain, unit:l.unit||'u', pu:l.pu||0, tva:l.tva!=null?l.tva:20};
  })));
  return Object.values(seen);
}
let acActive=null, acItems=[], acIndex=-1;
function showAC(desc){
  const q=htmlToText(desc.innerHTML).toLowerCase(); const box=document.getElementById('acBox');
  if(q.length<2){ hideAC(); return; }
  const cat=buildCatalog().filter(p=>{const d=p.desc.toLowerCase(); return d.includes(q)&&d!==q;}).slice(0,8);
  if(!cat.length){ hideAC(); return; }
  acActive=desc; acItems=cat; acIndex=-1;
  box.innerHTML=cat.map((p,i)=>`<div class="ac-item" data-i="${i}"><div class="ac-desc">${esc(p.desc)}</div><div class="ac-meta">${eur(+p.pu)} / ${esc(p.unit)} · TVA ${(''+p.tva).replace('.',',')} %</div></div>`).join('');
  const r=desc.getBoundingClientRect();
  box.style.left=(r.left+window.scrollX)+'px'; box.style.top=(r.bottom+window.scrollY+4)+'px'; box.style.width=Math.max(280,r.width)+'px';
  box.classList.add('open');
}
function hideAC(){ document.getElementById('acBox').classList.remove('open'); acActive=null; acItems=[]; acIndex=-1; }
function pickAC(i){
  const p=acItems[i]; if(!p||!acActive) return; const tr=acActive.closest('tr');
  acActive.textContent=p.desc;
  tr.querySelector('.unit').value=p.unit; tr.querySelector('.pu').value=p.pu;
  const sel=tr.querySelector('.tva'); if([...sel.options].some(o=>+o.value===+p.tva)) sel.value=p.tva;
  hideAC(); recalc();
}
function updACSel(){ document.querySelectorAll('#acBox .ac-item').forEach((el,i)=>el.classList.toggle('sel',i===acIndex)); }
document.addEventListener('mousedown', e=>{ const it=e.target.closest && e.target.closest('#acBox .ac-item'); if(it && it.dataset.i!==undefined){ e.preventDefault(); pickAC(+it.dataset.i); }
  else if(!(e.target.closest && e.target.closest('#acBox')) && !(e.target.classList&&e.target.classList.contains('desc'))) hideAC(); });
document.addEventListener('keydown', e=>{
  if(!document.getElementById('acBox').classList.contains('open')) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); acIndex=Math.min(acItems.length-1,acIndex+1); updACSel(); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); acIndex=Math.max(0,acIndex-1); updACSel(); }
  else if(e.key==='Enter' && acIndex>=0){ e.preventDefault(); pickAC(acIndex); }
  else if(e.key==='Escape'){ hideAC(); }
});

/* ---- Calculs ---- */
function recalc(){
  let totalHT=0; const map={};
  const rows=[...document.querySelectorAll('#lineBody tr')];
  // total par ligne + cumul
  rows.forEach(tr=>{
    if(!tr.classList.contains('row-item')) return;
    const q=parseFloat(tr.querySelector('.qte').value)||0, p=parseFloat(tr.querySelector('.pu').value)||0, t=parseFloat(tr.querySelector('.tva').value)||0;
    const lt=q*p; tr.querySelector('.lineTot').textContent=eur(lt); totalHT+=lt; map[t]=(map[t]||0)+lt;
  });
  // sous-totaux de sections
  rows.forEach((tr,i)=>{
    const isSec=tr.classList.contains('row-section'), isSub=tr.classList.contains('row-subsection');
    if(!isSec && !isSub) return;
    const level=isSec?1:2; let sum=0;
    for(let j=i+1;j<rows.length;j++){
      const r=rows[j];
      const rl=r.classList.contains('row-section')?1:(r.classList.contains('row-subsection')?2:3);
      if(rl<=level) break;
      if(!r.classList.contains('row-item')) continue;
      const q=parseFloat(r.querySelector('.qte').value)||0, p=parseFloat(r.querySelector('.pu').value)||0;
      sum+=q*p;
    }
    tr.querySelector('[data-sub]').textContent = sum>0 ? 'Sous-total : '+eur(sum) : '';
  });
  const remV=parseFloat(document.getElementById('remise').value)||0, remT=document.getElementById('remiseType').value;
  let remise=remT==='pct'?totalHT*remV/100:remV; if(remise>totalHT)remise=totalHT;
  const net=totalHT-remise, ratio=totalHT>0?net/totalHT:0;
  let totalTVA=0;
  const tvaHtml=Object.keys(map).map(Number).sort((a,b)=>b-a).map(rate=>{
    const base=map[rate]*ratio, m=base*rate/100; totalTVA+=m;
    return rate===0?'':`<div class="row sub"><span>TVA ${(''+rate).replace('.',',')} % (sur ${eur(base)})</span><span>${eur(m)}</span></div>`;
  }).join('');
  const ttc=net+totalTVA, acP=parseFloat(document.getElementById('acompte').value)||0, ac=ttc*acP/100;
  document.getElementById('tHT').textContent=eur(totalHT);
  document.getElementById('tRemise').textContent=(remise>0?'– ':'')+eur(remise);
  document.getElementById('tvaRows').innerHTML=tvaHtml;
  document.getElementById('tTVA').textContent=eur(totalTVA);
  document.getElementById('tTTC').textContent=eur(ttc);
  document.getElementById('tAcompte').textContent=eur(ac);
  document.getElementById('tReste').textContent=eur(ttc-ac);
  scheduleSave();
}

/* ---- Sauvegarde ---- */
function syncActiveVariant(){
  if(!cur) return; const v=cur.variants[cur.active]; if(!v) return;
  v.lines=[]; document.querySelectorAll('#lineBody tr').forEach(tr=>{
    if(tr.classList.contains('row-section')||tr.classList.contains('row-subsection')){
      v.lines.push({ type: tr.classList.contains('row-section')?'section':'subsection', title: tr.querySelector('.sec-title').value }); return;
    }
    if(tr.classList.contains('row-texte')){ v.lines.push({ type:'texte', content: tr.querySelector('.desc').innerHTML }); return; }
    const cell=tr.querySelector('.photo-cell'); const size=(cell.className.match(/photo-(small|medium|large)/)||[])[1]||'medium';
    const catSel=tr.querySelector('.cat-sel');
    v.lines.push({ desc:tr.querySelector('.desc').innerHTML, cat:catSel?catSel.value:'', qte:tr.querySelector('.qte').value, unit:tr.querySelector('.unit').value,
      pu:tr.querySelector('.pu').value, tva:parseFloat(tr.querySelector('.tva').value), photo:cell.dataset.photo||'', size });
  });
  v.remise=parseFloat(document.getElementById('remise').value)||0;
  v.remiseType=document.getElementById('remiseType').value;
  v.acompte=parseFloat(document.getElementById('acompte').value)||0;
}
let saveTimer=null;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveDevis(false),600); }
/* Ajoute au catalogue les lignes non encore connues (à l'enregistrement du devis) */
function autoAddProducts(){
  if(!cur) return 0; let added=0;
  cur.variants.forEach(v=>(v.lines||[]).forEach(l=>{
    if(l.type) return; const plain=htmlToText(l.desc||''); if(plain.length<2) return;
    if(!db.products.some(p=>(p.desc||'').toLowerCase()===plain.toLowerCase())){
      db.products.push({id:uid(), desc:plain, unit:l.unit||'u', pu:parseFloat(l.pu)||0, tva:l.tva!=null?l.tva:20, ref:''}); added++;
    }
  }));
  if(added) persist();
  return added;
}
function saveDevis(notify){
  if(!cur) return; syncActiveVariant();
  cur.date=document.getElementById('devDate').value; cur.valid=document.getElementById('devValid').value;
  cur.objet=document.getElementById('devObjet').value; cur.statut=document.getElementById('devStatut').value;
  cur.commercialId=document.getElementById('comSelect').value;
  cur.conditions=document.getElementById('conditions').value;
  cur.garantie=document.getElementById('garantie').value;
  cur.note=document.getElementById('note').value;
  const i=db.devis.findIndex(d=>d.id===cur.id); if(i<0) db.devis.push(cur);
  document.getElementById('docVariantLabel').textContent = cur.variants.length>1 ? '— '+cur.variants[cur.active].name : '';
  persist();
  if(notify){ const added=autoAddProducts();
    const b=event&&event.target; if(b){ const t=b.textContent; b.textContent = added?('✓ Enregistré (+'+added+' produit'+(added>1?'s':'')+')'):'✓ Enregistré'; setTimeout(()=>b.textContent=t,1600); } }
}
function backToList(){ saveDevis(false); autoAddProducts(); showView('list'); }

/* ================= TECHNICIENS ================= */
function techName(id){ const t=db.techniciens.find(x=>x.id===id); return t?t.nom:''; }
function techColor(id){ const t=db.techniciens.find(x=>x.id===id); return t&&t.couleur||'#1b3a8c'; }
function renderTechniciens(){
  const q=(document.getElementById('searchTech').value||'').toLowerCase();
  const list=db.techniciens.filter(t=>(t.nom||'').toLowerCase().includes(q));
  const wrap=document.getElementById('techTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun technicien. Cliquez sur « ＋ Nouveau technicien ».</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Email</th><th>Couleur</th><th></th></tr></thead><tbody>'+
    list.map(t=>`<tr>
      <td class="clic" onclick="openTechModal('${t.id}')"><b>${esc(t.nom)}</b></td>
      <td>${esc(t.fonction||'')}</td><td>${esc(t.tel||'')}</td><td>${esc(t.mail||'')}</td>
      <td><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${esc(t.couleur||'#1b3a8c')};vertical-align:middle"></span></td>
      <td class="row-act"><button class="small" onclick="openTechModal('${t.id}')">✎</button>
        <button class="small rouge" onclick="deleteTechnicien('${t.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingTechId=null;
function openTechModal(id){
  editingTechId=id||null; const t=id?db.techniciens.find(x=>x.id===id):null;
  document.getElementById('techModalTitle').textContent=t?'Modifier le technicien':'Nouveau technicien';
  cVal('mtNom',t&&t.nom||''); cVal('mtTel',t&&t.tel||''); cVal('mtMail',t&&t.mail||''); cVal('mtFonction',t&&t.fonction||''); cVal('mtCouleur',t&&t.couleur||'#1b3a8c');
  document.getElementById('techModalBg').classList.add('open');
}
function closeTechModal(){ document.getElementById('techModalBg').classList.remove('open'); }
function saveTechnicien(){
  const t={ id:editingTechId||uid(), nom:document.getElementById('mtNom').value.trim(), tel:document.getElementById('mtTel').value.trim(),
    mail:document.getElementById('mtMail').value.trim(), fonction:document.getElementById('mtFonction').value.trim(), couleur:document.getElementById('mtCouleur').value };
  if(!t.nom){ alert('Indiquez le nom du technicien.'); return; }
  if(editingTechId){ const i=db.techniciens.findIndex(x=>x.id===editingTechId); db.techniciens[i]=t; } else db.techniciens.push(t);
  persist(); closeTechModal();
  if(document.getElementById('view-techniciens').classList.contains('active')) renderTechniciens();
}
function deleteTechnicien(id){ if(!confirm('Supprimer ce technicien ?')) return; db.techniciens=db.techniciens.filter(t=>t.id!==id); persist(); renderTechniciens(); }

/* ================= PLANNING DE POSE ================= */
const JOURS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
function mondayOf(dt){ const d=new Date(dt); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function isoWeek(date){ const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())); const day=(d.getUTCDay()+6)%7;
  d.setUTCDate(d.getUTCDate()-day+3); const ft=new Date(Date.UTC(d.getUTCFullYear(),0,4));
  return 1+Math.round(((d-ft)/86400000-3+((ft.getUTCDay()+6)%7))/7); }
function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
let planWeekStart=mondayOf(new Date());   // conservé pour l'export "page technicien"
let planYear=new Date().getFullYear();
function planWeekShift(n){ planYear+=n; refreshPlanning(); }
function planWeekToday(){ planYear=new Date().getFullYear(); refreshPlanning(); setTimeout(()=>{ const el=document.getElementById('curWeek'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },80); }
function posesAt(dateStr, techId){ return db.poses.filter(p=>p.date===dateStr && p.techId===techId); }
function weeksOfYear(y){ const start=mondayOf(new Date(y,0,4)); const out=[];
  for(let i=0;i<54;i++){ const mon=new Date(start); mon.setDate(mon.getDate()+i*7); const thu=new Date(mon); thu.setDate(thu.getDate()+3);
    if(thu.getFullYear()>y) break; if(thu.getFullYear()<y) continue; out.push(mon); } return out; }
function planLegendHtml(){ let leg='<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:12px;font-size:12px"><b style="color:var(--muted)">Légende :</b>';
  db.commerciaux.forEach(c=>{ leg+=`<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:13px;height:13px;border-radius:3px;background:${esc(c.couleur||'#1b3a8c')}"></span>${esc(c.nom)}</span>`; });
  Object.values(POSE_STATUS).forEach(s=>{ leg+=`<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:13px;height:13px;border-radius:3px;background:${s.color}"></span>${s.label}</span>`; });
  return leg+'</div>'; }
function buildWeekGrid(monday, ro, todayStr){
  const wk=isoWeek(monday); const end=new Date(monday); end.setDate(end.getDate()+5);
  const isCur = ymd(monday)<=todayStr && todayStr<=ymd(end);
  let html='<div class="week-block'+(isCur?' current':'')+'"'+(isCur?' id="curWeek"':'')+'>'+
    '<div class="week-title">Semaine '+wk+' <small>· du '+monday.toLocaleDateString('fr-FR')+' au '+end.toLocaleDateString('fr-FR')+'</small></div>'+
    '<table class="plan-table"><thead><tr><th class="plan-corner"><div class="wl">Sem.</div><div class="wk">'+wk+'</div></th>'+
    db.techniciens.map(t=>`<th class="plan-th-tech">${esc(t.nom)}</th>`).join('')+'</tr></thead><tbody>';
  for(let i=0;i<6;i++){ const d=new Date(monday); d.setDate(d.getDate()+i); const ds=ymd(d);
    html+='<tr class="'+(ds===todayStr?'plan-today':'')+'"><td class="plan-day"><div class="dname">'+JOURS[i]+'</div><div class="ddate">'+d.toLocaleDateString('fr-FR')+'</div></td>';
    html+=db.techniciens.map(t=>{ const ps=posesAt(ds,t.id);
      return `<td class="plan-cell" ${ro?'':`onclick="openPoseModal('${ds}','${t.id}')"`}>`+
        ps.map(p=>{ const col=poseColor(p); const isSt=p.type&&p.type!=='pose';
          const titre=isSt?(p.type==='astreinte'&&p.note?p.note:(POSE_STATUS[p.type]||{}).label||p.type):(p.client||'Pose');
          const sub=isSt?(p.type==='astreinte'?'':(p.note||'')):((p.heure?p.heure+' ':'')+(p.note||'')).trim();
          const clic = ro ? `openFicheFromPose('${p.id}')` : `event.stopPropagation();openPoseModal('${ds}','${t.id}','${p.id}')`;
          return `<div class="plan-chip" style="background:${col};color:${textOn(col)}" onclick="${clic}"><b>${esc(titre)}</b>${sub?esc(sub.slice(0,40)):''}</div>`;
        }).join('')+
        (ro?'':'<span class="addp">＋</span>')+'</td>'; }).join('');
    html+='</tr>';
  }
  return html+'</tbody></table></div>';
}
function renderPlanning(){ renderPlanningInto('planningWrap', planReadonly, true); }
function renderPlanTech(){ renderPlanningInto('planTechWrap', true, false); }
function refreshPlanning(){ if(document.getElementById('view-plantech').classList.contains('active')) renderPlanTech(); else renderPlanning(); }
function renderPlanningInto(wrapId, ro, showEst){
  const wrap=document.getElementById(wrapId);
  if(!db.techniciens.length){ wrap.innerHTML='<div class="empty">Ajoutez d\'abord des techniciens (menu « Techniciens ») pour construire le planning.</div>'; return; }
  const todayStr=ymd(new Date());
  let html = (ro&&showEst?'<div style="background:var(--bleu);color:#fff;padding:8px 14px;border-radius:8px;margin-bottom:10px;font-weight:600">👁 Vue technicien — lecture seule. Cliquez une tâche pour ouvrir sa fiche de chantier.</div>':'')
    +'<div style="font-size:18px;font-weight:800;color:var(--bleu);margin-bottom:8px">Année '+planYear+'</div>'
    +planLegendHtml();
  weeksOfYear(planYear).forEach(mon=> html+=buildWeekGrid(mon, ro, todayStr));
  wrap.innerHTML=html;
}
const POSE_STATUS={entretien:{label:'Entretien',color:'#f97316'},astreinte:{label:'Astreinte',color:'#7c3aed'},sav:{label:'SAV',color:'#1e3a8a'},conge:{label:'Congé',color:'#eaff00'},maladie:{label:'Maladie',color:'#e2231a'}};
function textOn(hex){ const c=(hex||'').replace('#',''); if(c.length<6) return '#fff';
  const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
  return (0.299*r+0.587*g+0.114*b)>150 ? '#1f2733' : '#fff'; }
function comColor(id){ const c=db.commerciaux.find(x=>x.id===id); return c&&c.couleur||'#1b3a8c'; }
function poseColor(p){ if(p.type&&p.type!=='pose') return (POSE_STATUS[p.type]||{}).color||'#94a3b8';
  let comId=p.commercialId; if(!comId&&p.devisId){ const d=db.devis.find(x=>x.id===p.devisId); comId=d?d.commercialId:''; } return comColor(comId); }
function comOptions(sel){ return '<option value="">— Aucun —</option>'+db.commerciaux.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nom)}</option>`).join(''); }
let editingPoseId=null;
function openPoseModal(date, techId, poseId){
  editingPoseId=poseId||null; const p=poseId?db.poses.find(x=>x.id===poseId):null;
  document.getElementById('poseModalTitle').textContent=p?'Modifier l\'entrée':'Nouvelle entrée';
  document.getElementById('mpoType').value=p&&p.type||'pose';
  cVal('mpoDate', p?p.date:date); cVal('mpoHeure', p&&p.heure||'');
  document.getElementById('mpoTech').innerHTML=db.techniciens.map(t=>`<option value="${t.id}" ${t.id===(p?p.techId:techId)?'selected':''}>${esc(t.nom)}</option>`).join('');
  document.getElementById('mpoDevis').innerHTML='<option value="">— Aucun —</option>'+db.devis.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(d=>{const c=db.clients.find(x=>x.id===d.clientId); return `<option value="${d.id}" ${p&&p.devisId===d.id?'selected':''}>${esc(d.num)} — ${esc(clientName(c))}</option>`;}).join('');
  document.getElementById('mpoCom').innerHTML=comOptions(p?p.commercialId:'');
  cVal('mpoClient', p&&p.client||''); cVal('mpoNote', p&&p.note||''); cVal('mpoDateFin','');
  document.getElementById('poseDelBtn').style.display=p?'inline-flex':'none';
  poseTypeChange();
  document.getElementById('poseModalBg').classList.add('open');
}
function poseTypeChange(){ const t=document.getElementById('mpoType').value; const range=(t==='conge'||t==='maladie');
  document.getElementById('poseChantierFields').style.display = t==='pose'?'block':'none';
  document.getElementById('mpoFinRow').style.display = range?'block':'none';
  document.getElementById('mpoHeureRow').style.display = range?'none':'block';
  document.getElementById('mpoDateLbl').textContent = range?'Date de début':'Date';
  document.getElementById('mpoNoteLbl').textContent = t==='astreinte' ? 'Texte affiché sur le planning (remplace « Astreinte »)' : 'Détail / note'; }
function poseDevisChange(){ const id=document.getElementById('mpoDevis').value; const d=db.devis.find(x=>x.id===id); if(!d) return;
  if(d.commercialId) document.getElementById('mpoCom').value=d.commercialId;
  const c=db.clients.find(x=>x.id===d.clientId); const cl=document.getElementById('mpoClient'); if(!cl.value&&c) cl.value=clientName(c); }
function closePoseModal(){ document.getElementById('poseModalBg').classList.remove('open'); }
function savePose(){
  const type=document.getElementById('mpoType').value;
  const devId=document.getElementById('mpoDevis').value; let client=document.getElementById('mpoClient').value.trim();
  if(type==='pose' && !client && devId){ const d=db.devis.find(x=>x.id===devId); const c=d&&db.clients.find(x=>x.id===d.clientId); client=c?clientName(c):''; }
  const p={ id:editingPoseId||uid(), type, date:document.getElementById('mpoDate').value, heure:document.getElementById('mpoHeure').value,
    techId:document.getElementById('mpoTech').value,
    devisId:type==='pose'?devId:'', commercialId:type==='pose'?document.getElementById('mpoCom').value:'',
    client:type==='pose'?client:'', note:document.getElementById('mpoNote').value.trim() };
  if(!p.date||!p.techId){ alert('Date et technicien requis.'); return; }
  // Période (congé/maladie) à la création : une entrée par jour (hors dimanche)
  if((type==='conge'||type==='maladie') && !editingPoseId){
    const fin=document.getElementById('mpoDateFin').value;
    if(fin){ if(fin<p.date){ alert('La date de fin doit être postérieure à la date de début.'); return; }
      const gid=uid(); let cur=new Date(p.date+'T00:00:00'); const endD=new Date(fin+'T00:00:00'); let n=0;
      while(cur<=endD){ if(cur.getDay()!==0){ db.poses.push({id:uid(), groupId:gid, type, date:ymd(cur), heure:'', techId:p.techId, devisId:'', commercialId:'', client:'', note:p.note}); n++; } cur.setDate(cur.getDate()+1); }
      persist(); closePoseModal(); renderPlanning(); alert(n+' jour(s) ajouté(s) au planning.'); return;
    }
  }
  if(editingPoseId){ const i=db.poses.findIndex(x=>x.id===editingPoseId); db.poses[i]=p; } else db.poses.push(p);
  persist(); closePoseModal(); renderPlanning();
}
function deletePose(){ if(!editingPoseId) return; const p=db.poses.find(x=>x.id===editingPoseId);
  if(p && p.groupId){ if(confirm('Cette entrée fait partie d\'une période (congé/maladie). Cliquez OK pour supprimer TOUTE la période, Annuler pour ce seul jour.')) db.poses=db.poses.filter(x=>x.groupId!==p.groupId); else db.poses=db.poses.filter(x=>x.id!==editingPoseId); }
  else { if(!confirm('Supprimer cette entrée ?')) return; db.poses=db.poses.filter(x=>x.id!==editingPoseId); }
  persist(); closePoseModal(); renderPlanning(); updateAplanBadge(); }
/* ---- Vue technicien (miroir lecture seule) ---- */
let planReadonly=false;
function planToggleReadonly(){ planReadonly=!planReadonly;
  const b=document.getElementById('planRoBtn'); if(b){ b.classList.toggle('primary',planReadonly); b.textContent=planReadonly?'✎ Mode édition':'👁 Vue technicien'; }
  renderPlanning(); }
function openFicheFromPose(id){ const p=db.poses.find(x=>x.id===id); if(!p){ return; }
  if(!p.devisId){ alert('Aucune fiche de chantier liée à cette tâche.'); return; }
  const d=db.devis.find(x=>x.id===p.devisId); if(!d){ alert('Devis introuvable.'); return; }
  if(!d.chantier) d.chantier=defaultChantier(d); ficheDevisId=p.devisId; persist(); renderFicheEditor(d); showView('fiche'); }
function ficheUrlFor(d){ if(!d||!d.chantier||!d.chantier.slug) return ''; const base=(db.pagesBase||'').replace(/\/?$/,'/'); return base+'fiches/'+d.chantier.slug+'.html'; }
function exportPlanningPage(){
  const html=buildPlanningStandaloneHTML(planYear);
  saveBlob(new Blob([html],{type:'text/html;charset=utf-8'}), 'planning-'+planYear+'.html'); }
function buildPlanningStandaloneHTML(year){
  const techs=db.techniciens; const todayStr=ymd(new Date());
  const weekTable=(monday)=>{ const wk=isoWeek(monday); const end=new Date(monday); end.setDate(end.getDate()+5);
    let rows='';
    for(let i=0;i<6;i++){ const d=new Date(monday); d.setDate(d.getDate()+i); const ds=ymd(d);
      rows+=`<tr class="${ds===todayStr?'today':''}"><td class="day"><b>${JOURS[i]}</b><br><small>${d.toLocaleDateString('fr-FR')}</small></td>`;
      rows+=techs.map(t=>{ const ps=posesAt(ds,t.id);
        return '<td>'+ps.map(p=>{ const col=poseColor(p); const isSt=p.type&&p.type!=='pose';
          const titre=isSt?(p.type==='astreinte'&&p.note?p.note:((POSE_STATUS[p.type]||{}).label||p.type)):(p.client||'Pose');
          const dev=p.devisId?db.devis.find(x=>x.id===p.devisId):null; const url=ficheUrlFor(dev);
          const showNote=p.note && p.type!=='astreinte';
          const inner=`<b>${esc(titre)}</b>${p.heure?' '+esc(p.heure):''}${showNote?'<br><small>'+esc(p.note)+'</small>':''}`;
          return url?`<a class="chip" style="background:${col};color:${textOn(col)}" href="${esc(url)}">${inner}</a>`
                   :`<div class="chip" style="background:${col};color:${textOn(col)}">${inner}</div>`;
        }).join('')+'</td>'; }).join('');
      rows+='</tr>';
    }
    return `<div class="wblock${ds0(monday,todayStr)?' cur':''}"><h2>Semaine ${wk} <small>· du ${monday.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}</small></h2>
      <table><thead><tr><th class="day">Sem. ${wk}</th>${techs.map(t=>`<th>${esc(t.nom)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  function ds0(mon,today){ const end=new Date(mon); end.setDate(end.getDate()+5); return ymd(mon)<=today && today<=ymd(end); }
  const blocks=weeksOfYear(year).map(weekTable).join('');
  let leg=db.commerciaux.map(c=>`<span><i style="background:${esc(c.couleur||'#1b3a8c')}"></i>${esc(c.nom)}</span>`).join('')+
    Object.values(POSE_STATUS).map(s=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Planning ${year}</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f5f7;color:#1f2733}
.wrap{max-width:1100px;margin:0 auto;padding:14px}h1{color:#1b3a8c;font-size:20px}.wblock{margin-bottom:18px}.wblock h2{color:#1b3a8c;font-size:14px;margin:14px 0 6px}.wblock h2 small{color:#66707e;font-weight:400}.wblock.cur{outline:2px solid #1b3a8c;outline-offset:4px;border-radius:6px}
.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;margin:8px 0;position:sticky;top:0;background:#f4f5f7;padding:6px 0;z-index:2}.legend span{display:inline-flex;align-items:center;gap:5px}.legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d8dce4;border-radius:12px;overflow:hidden;table-layout:fixed}
th,td{border:1px solid #d8dce4;vertical-align:top;padding:5px;font-size:13px}th{background:#f4f5f7}.day{width:110px;background:#f4f5f7}tr.today .day{background:#e8eefb}
.chip{display:block;text-decoration:none;border-radius:6px;padding:4px 7px;margin-bottom:4px;font-size:12px;line-height:1.3}small{opacity:.85}</style></head><body><div class="wrap">
<h1>Planning de pose ${year} — SAS ACF CHAPPERT</h1><div style="color:#66707e">Lecture seule · cliquez une tâche pour ouvrir sa fiche de chantier.</div>
<div class="legend">${leg}</div>${blocks}
</div></body></html>`;
}
function openPoseModalFromDevis(id){ const d=db.devis.find(x=>x.id===id); const c=db.clients.find(x=>x.id===d.clientId);
  if(!db.techniciens.length){ alert('Ajoutez d\'abord un technicien (menu Techniciens).'); return; }
  showView('planning'); openPoseModal(ymd(new Date()), db.techniciens[0].id);
  document.getElementById('mpoDevis').value=id; document.getElementById('mpoClient').value=c?clientName(c):''; }

/* ================= CHANTIERS À PLANIFIER ================= */
function isPlanned(d){ return db.poses.some(p=>p.devisId===d.id); }
function aPlanifierList(){ return db.devis.filter(d=>d.statut==='accepte' && !isPlanned(d)); }
function updateAplanBadge(){ const b=document.getElementById('aplanBadge'); if(b){ const n=aPlanifierList().length; b.textContent=n||''; } }
function monthKey(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
function monthLabel(key){ const p=key.split('-'); return new Date(p[0],p[1]-1,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}); }
function nextMonths(n){ const out=[]; const d=new Date(); d.setDate(1); for(let i=0;i<n;i++){ out.push(monthKey(d)); d.setMonth(d.getMonth()+1); } return out; }
function chHours(d){ const cfg=d.chantierConfig; if(!cfg) return 0;
  if(cfg.heuresParMois) return Object.values(cfg.heuresParMois).reduce((s,h)=>s+(+h||0),0);
  return +cfg.heures||0; }
function chHoursMonth(d,m){ const cfg=d.chantierConfig; if(cfg&&cfg.heuresParMois&&cfg.heuresParMois[m]!=null) return +cfg.heuresParMois[m]||0; return 0; }
function isConfigured(d){ const cfg=d.chantierConfig; return !!(cfg && cfg.mois && cfg.mois.length); }
let aplanCurTab='config';
function aplanTab(which){ aplanCurTab=which;
  document.getElementById('aplanTabConfig').classList.toggle('active', which==='config');
  document.getElementById('aplanTabBoard').classList.toggle('active', which==='board');
  document.getElementById('aplanConfig').style.display = which==='config'?'block':'none';
  document.getElementById('aplanBoard').style.display = which==='board'?'block':'none';
}
function renderAPlanifier(){
  updateAplanBadge();
  const list=aPlanifierList();
  const toCfg=list.filter(d=>!isConfigured(d));
  const done=list.filter(isConfigured);
  const badge=document.getElementById('aplanCfgCount'); if(badge) badge.textContent=toCfg.length||'';
  const prioTag={haute:'#e2231a',normale:'#66707e',basse:'#1a9d5a'};

  // Onglet 1 : Chantiers à configurer (sans mois défini)
  const cfgEl=document.getElementById('aplanConfig');
  if(!toCfg.length){ cfgEl.innerHTML='<div class="empty">Tous les chantiers validés ont un mois de pose. 🎉<br><span style="font-size:12px">Retrouvez-les dans l\'onglet « À planifier ».</span></div>'; }
  else { cfgEl.innerHTML='<p class="sub">Devis validés sans mois de pose défini. Configurez le(s) mois et les heures, puis créez la fiche technicien.</p>'+
    '<table class="grid"><thead><tr><th>N°</th><th>Client</th><th>Objet</th><th style="text-align:right">TTC</th><th>Priorité</th><th></th></tr></thead><tbody>'+
    toCfg.map(d=>{ const c=db.clients.find(x=>x.id===d.clientId); const cfg=d.chantierConfig||{};
      return `<tr>
        <td class="num-mono clic" onclick="openDevis('${d.id}')">${esc(d.num)}</td>
        <td>${esc(clientName(c))}</td><td>${esc(d.objet||'')}</td>
        <td class="ttc-mono" style="text-align:right">${eur(devisTTC(d))}</td>
        <td><span style="color:${prioTag[cfg.priorite||'normale']};font-weight:600">${(cfg.priorite||'normale')}</span></td>
        <td class="row-act">
          <button class="small primary" onclick="openChConfig('${d.id}')">🗓 Configurer</button>
          <button class="small" onclick="planChantier('${d.id}')">👷 Créer fiche technicien</button>
          <button class="small" onclick="openPoseModalFromDevis('${d.id}')">＋ Planning</button></td></tr>`;
    }).join('')+'</tbody></table>'; }

  // Onglet 2 : À planifier (board mensuel des chantiers configurés)
  const boardEl=document.getElementById('aplanBoard');
  if(!done.length){ boardEl.innerHTML='<div class="empty">Aucun chantier configuré. Configurez un chantier dans l\'onglet « Chantiers à configurer ».</div>'; }
  else { const byMonth={};
    done.forEach(d=>((d.chantierConfig.mois)||[]).forEach(m=>{(byMonth[m]=byMonth[m]||[]).push(d);}));
    const months=Object.keys(byMonth).sort();
    let board='<p class="sub">Chantiers configurés répartis par mois. Total d\'heures estimé en pied de colonne.</p><div class="month-board">';
    months.forEach(m=>{ const items=byMonth[m]; const total=items.reduce((s,d)=>s+chHoursMonth(d,m),0);
      board+=`<div class="month-col"><div class="month-head">${esc(monthLabel(m))}</div>`+
        items.map(d=>{ const c=db.clients.find(x=>x.id===d.clientId); const hm=chHoursMonth(d,m); return `<div class="month-item" onclick="openChConfig('${d.id}')"><b>${esc(clientName(c))}</b><span>${esc(d.num)}${d.objet?' · '+esc(d.objet):''}</span><span class="mh">${hm?hm+' h':'— h'}</span></div>`; }).join('')+
        `<div class="month-foot">Total : ${total} h</div></div>`;
    });
    board+='</div>'; boardEl.innerHTML=board; }

  aplanTab(aplanCurTab);
}
let cfgDevisId=null;
function openChConfig(id){ cfgDevisId=id; const d=db.devis.find(x=>x.id===id); if(!d) return;
  document.getElementById('chCfgNum').textContent=d.num; const cfg=d.chantierConfig||{mois:[],heuresParMois:{},priorite:'normale',note:''};
  const hpm=cfg.heuresParMois||{};
  document.getElementById('chCfgMonths').innerHTML=nextMonths(12).map(m=>{ const on=(cfg.mois||[]).includes(m); const hv=hpm[m]!=null?hpm[m]:'';
    return `<label class="cfg-month-row"><input type="checkbox" value="${m}" ${on?'checked':''} onchange="chCfgToggle(this)"><span style="flex:1">${esc(monthLabel(m))}</span><input type="number" class="cfg-h" min="0" step="0.5" value="${hv}" placeholder="h" ${on?'':'disabled'} oninput="chCfgTotal()"><span style="color:var(--muted)">h</span></label>`; }).join('');
  document.getElementById('chCfgPrio').value=cfg.priorite||'normale'; document.getElementById('chCfgNote').value=cfg.note||'';
  chCfgTotal();
  document.getElementById('chConfigBg').classList.add('open');
}
function chCfgToggle(cb){ const inp=cb.closest('.cfg-month-row').querySelector('.cfg-h'); inp.disabled=!cb.checked; if(cb.checked&&!inp.value) inp.focus(); chCfgTotal(); }
function chCfgTotal(){ let t=0; document.querySelectorAll('#chCfgMonths .cfg-month-row').forEach(r=>{ if(r.querySelector('input[type=checkbox]').checked) t+=parseFloat(r.querySelector('.cfg-h').value)||0; });
  document.getElementById('chCfgTotal').textContent='Total : '+t+' h'; }
function closeChConfig(){ document.getElementById('chConfigBg').classList.remove('open'); }
function saveChConfig(){ const d=db.devis.find(x=>x.id===cfgDevisId); if(!d) return;
  const mois=[], heuresParMois={}; let total=0;
  document.querySelectorAll('#chCfgMonths .cfg-month-row').forEach(r=>{ const cb=r.querySelector('input[type=checkbox]'); if(cb.checked){ const m=cb.value; const h=parseFloat(r.querySelector('.cfg-h').value)||0; mois.push(m); heuresParMois[m]=h; total+=h; } });
  d.chantierConfig={ mois, heuresParMois, heures:total, priorite:document.getElementById('chCfgPrio').value, note:document.getElementById('chCfgNote').value.trim() };
  persist(); closeChConfig();
  if(document.getElementById('view-aplanifier').classList.contains('active')) renderAPlanifier();
  if(document.getElementById('view-list').classList.contains('active')) renderList();
}

/* ================= FICHE DE CHANTIER ================= */
let ficheDevisId=null;
function slugify(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'fiche'; }
function curFiche(){ const d=db.devis.find(x=>x.id===ficheDevisId); return d?d.chantier:null; }
function defaultChantier(d){
  const c=db.clients.find(x=>x.id===d.clientId); const v=d.variants[d.active||0]||d.variants[0];
  const y=new Date().getFullYear(); db.fcSeq=(db.fcSeq||0)+1;
  return { num:`FC-${y}-${String(db.fcSeq).padStart(3,'0')}`, clientNom:c?clientName(c):'',
    adresse:c?[c.adresse,[c.cp,c.ville].filter(Boolean).join(' ')].filter(Boolean).join(', '):'', tel:c?(c.tel||''):'',
    date:'', heure:'', duree:'', techniciens:[],
    materiel:(v.lines||[]).filter(l=>!l.type&&htmlToText(l.desc)).map(l=>({desc:htmlToText(l.desc), qte:((l.qte||'1')+' '+(l.unit||'')).trim()})),
    travaux:d.objet||'', infos:[], consignes:'', annexes:[], slug:slugify((c?clientName(c):'chantier')+'-'+d.num) };
}
function planChantier(id){ const d=db.devis.find(x=>x.id===id); if(!d) return;
  if(d.statut!=='accepte'){ alert('Le devis doit être au statut « Accepté » pour planifier le chantier.'); return; }
  if(!d.chantier) d.chantier=defaultChantier(d);
  ficheDevisId=id; persist(); renderFicheEditor(d); showView('fiche');
}
function mRow(m){ return `<tr class="mrowline"><td><input class="m-desc" value="${esc(m.desc||'')}" oninput="scheduleFicheSave()" placeholder="Matériel / fourniture"></td>
  <td style="width:130px"><input class="m-qte" value="${esc(m.qte||'')}" oninput="scheduleFicheSave()" placeholder="Qté"></td>
  <td class="no-print" style="width:28px"><button class="small rouge" onclick="this.closest('tr').remove();scheduleFicheSave()">×</button></td></tr>`; }
function tRow(t){ t=t||{}; return `<tr class="trowline">
  <td><select class="t-sel" onchange="ficheTechPick(this)">
    <option value="">— Choisir un technicien —</option>
    ${db.techniciens.map(x=>`<option value="${x.id}" ${x.id===t.techId?'selected':''}>${esc(x.nom)}</option>`).join('')}
  </select></td>
  <td style="width:150px"><input class="t-phone" value="${esc(t.phone||'')}" oninput="scheduleFicheSave()" placeholder="Téléphone (SMS)"></td>
  <td class="no-print" style="width:28px"><button class="small rouge" onclick="this.closest('tr').remove();scheduleFicheSave()">×</button></td></tr>`; }
function ficheTechPick(sel){ const t=db.techniciens.find(x=>x.id===sel.value); if(t){ const ph=sel.closest('tr').querySelector('.t-phone'); if(ph&&!ph.value) ph.value=t.tel||''; } scheduleFicheSave(); }
function iRow(i){ return `<tr class="irowline"><td style="width:180px"><input class="i-label" value="${esc(i.label||'')}" oninput="scheduleFicheSave()" placeholder="Intitulé (ex. Accès)"></td>
  <td><input class="i-val" value="${esc(i.value||'')}" oninput="scheduleFicheSave()" placeholder="Détail"></td>
  <td class="no-print" style="width:28px"><button class="small rouge" onclick="this.closest('tr').remove();scheduleFicheSave()">×</button></td></tr>`; }
function renderFicheEditor(d){
  const ch=d.chantier; ficheTitleSet(ch);
  document.getElementById('fichePage').innerHTML=`
    <div class="head">
      <div class="logo-box"><img src="${logoData}" alt="Logo"></div>
      <div class="company"><div class="name">SAS ACF CHAPPERT</div><div class="line">9 Rue Jacques Monod – 81000 ALBI</div>
        <div class="line">Tél. 05.63.47.11.88</div><div class="line">contact@acfchappert.fr</div></div>
    </div>
    <h2 class="doc-title">Fiche de chantier</h2>
    <div class="fiche-actions no-print">
      <button class="ghost small" onclick="ficheCall()">📞 Appeler le client</button>
      <button class="ghost small" onclick="ficheGPS()">🧭 Navigation GPS</button>
    </div>
    <div class="meta-grid">
      <div class="card"><h3>Chantier</h3>
        <div class="field"><label>N° fiche</label><input value="${esc(ch.num)}" readonly></div>
        <div class="field"><label>Client</label><input id="fcClientNom" value="${esc(ch.clientNom||'')}" oninput="scheduleFicheSave()"></div>
        <div class="field"><label>Adresse</label><input id="fcAdresse" value="${esc(ch.adresse||'')}" oninput="scheduleFicheSave()"></div>
        <div class="field"><label>Téléphone</label><input id="fcTel" value="${esc(ch.tel||'')}" oninput="scheduleFicheSave()"></div>
        <div class="field"><label>Réf. devis</label><input value="${esc(d.num)}" readonly></div>
      </div>
      <div class="card"><h3>Intervention</h3>
        <div class="field"><label>Date</label><input id="fcDate" type="date" value="${esc(ch.date||'')}" oninput="scheduleFicheSave()"></div>
        <div class="field"><label>Heure</label><input id="fcHeure" type="time" value="${esc(ch.heure||'')}" oninput="scheduleFicheSave()"></div>
        <div class="field"><label>Durée estimée</label><input id="fcDuree" value="${esc(ch.duree||'')}" placeholder="ex. 1 journée" oninput="scheduleFicheSave()"></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px"><h3>Techniciens intervenants</h3>
      <table class="fiche-table"><tbody id="fcTechs">${(ch.techniciens||[]).map(tRow).join('')}</tbody></table>
      <button class="ghost small no-print" onclick="document.getElementById('fcTechs').insertAdjacentHTML('beforeend', tRow({}));">＋ Technicien</button>
    </div>

    <div class="card" style="margin-top:16px"><h3>Matériel / fournitures</h3>
      <table class="fiche-table"><tbody id="fcMateriel">${(ch.materiel||[]).map(mRow).join('')}</tbody></table>
      <button class="ghost small no-print" onclick="document.getElementById('fcMateriel').insertAdjacentHTML('beforeend', mRow({}));">＋ Matériel</button>
    </div>

    <div class="card" style="margin-top:16px"><h3>Travaux à réaliser</h3>
      <textarea class="print-ta" id="fcTravaux" rows="3" oninput="scheduleFicheSave()" style="width:100%">${esc(ch.travaux||'')}</textarea>
    </div>

    <div class="card" style="margin-top:16px"><h3>Informations complémentaires</h3>
      <table class="fiche-table"><tbody id="fcInfos">${(ch.infos||[]).map(iRow).join('')}</tbody></table>
      <button class="ghost small no-print" onclick="document.getElementById('fcInfos').insertAdjacentHTML('beforeend', iRow({}));">＋ Information</button>
    </div>

    <div class="card" style="margin-top:16px"><h3>Consignes / sécurité / accès</h3>
      <textarea class="print-ta" id="fcConsignes" rows="2" oninput="scheduleFicheSave()" style="width:100%">${esc(ch.consignes||'')}</textarea>
    </div>

    <div class="card no-print" style="margin-top:16px"><h3>Documents joints</h3>
      <p style="color:var(--muted); font-size:12px; margin:2px 0 10px">Fiches produits, plans, comptes rendus, notices… (images et PDF). Ils sont ajoutés à la fiche (PDF et page web).</p>
      <button class="ghost small" onclick="document.getElementById('ficheAnnexInput').click()">＋ Ajouter un document</button>
      <input type="file" id="ficheAnnexInput" multiple accept="image/*,application/pdf" style="display:none" onchange="addFicheAnnex(event)">
      <span id="ficheAnnexStatus" style="margin-left:10px; color:var(--muted); font-size:12px"></span>
      <div id="ficheAnnexList" style="margin-top:10px"></div>
    </div>

    <div class="page-footer">ACF CHAPPERT - 9 rue Jacques Monod, 81000 Albi, France - Tél : 05 63 47 11 88 - contact@acfchappert.fr - https://acfchappert.com/</div>

    <div class="annexes-print" id="ficheAnnexPrint"></div>`;
  renderFicheAnnexes();
}
function ficheTitleSet(ch){ document.getElementById('ficheTitleBar').textContent='Fiche de chantier '+ch.num; }
function collectFiche(){ const d=db.devis.find(x=>x.id===ficheDevisId); if(!d||!d.chantier) return; const ch=d.chantier;
  const g=id=>{const e=document.getElementById(id); return e?e.value:'';};
  ch.clientNom=g('fcClientNom'); ch.adresse=g('fcAdresse'); ch.tel=g('fcTel');
  ch.date=g('fcDate'); ch.heure=g('fcHeure'); ch.duree=g('fcDuree'); ch.travaux=g('fcTravaux'); ch.consignes=g('fcConsignes');
  ch.techniciens=[...document.querySelectorAll('#fcTechs .trowline')].map(r=>{ const sel=r.querySelector('.t-sel'); const techId=sel?sel.value:''; const t=db.techniciens.find(x=>x.id===techId);
    return {techId, name:t?t.nom:'', phone:r.querySelector('.t-phone').value}; }).filter(t=>t.techId||t.phone);
  ch.materiel=[...document.querySelectorAll('#fcMateriel .mrowline')].map(r=>({desc:r.querySelector('.m-desc').value, qte:r.querySelector('.m-qte').value})).filter(m=>m.desc);
  ch.infos=[...document.querySelectorAll('#fcInfos .irowline')].map(r=>({label:r.querySelector('.i-label').value, value:r.querySelector('.i-val').value})).filter(i=>i.label||i.value);
}
let ficheSaveTimer=null;
function scheduleFicheSave(){ clearTimeout(ficheSaveTimer); ficheSaveTimer=setTimeout(()=>{ collectFiche(); persist(); },600); }
function backFromFiche(){ collectFiche(); persist(); showView('list'); }
function ficheLink(){ const ch=curFiche(); const base=(db.pagesBase||'').replace(/\/?$/,'/'); return base+'fiches/'+ch.slug+'.html'; }
function ficheCall(){ collectFiche(); const ch=curFiche(); if(!ch.tel){ alert('Aucun téléphone client renseigné.'); return; } window.location.href='tel:'+ch.tel.replace(/[^0-9+]/g,''); }
function ficheGPS(){ collectFiche(); const ch=curFiche(); if(!ch.adresse){ alert('Aucune adresse renseignée.'); return; } window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(ch.adresse),'_blank'); }
function ficheGenerate(){ collectFiche(); persist(); downloadDocPDF('Fiche_chantier_'+curFiche().num+'.pdf','fichePage'); }
function ficheCopyLink(){ collectFiche(); persist(); const link=ficheLink();
  const done=()=>alert('Lien copié :\n'+link+'\n\n(Déposez d\'abord la page web générée dans votre dépôt FICHES-CHANTIERS/fiches/ pour qu\'il soit actif.)');
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(link).then(done,()=>prompt('Copiez le lien :',link)); } else prompt('Copiez le lien :',link);
}
function ficheSMS(){ collectFiche(); persist(); const ch=curFiche(); const link=ficheLink();
  const maps='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(ch.adresse||'');
  const body=`CHANTIER ${ch.clientNom||''}\n${ch.date?('Le '+ch.date+(ch.heure?' à '+ch.heure:'')):''}\nAdresse : ${ch.adresse||''}\nTél client : ${ch.tel||''}\nItinéraire : ${maps}\nFiche complète : ${link}`;
  const phone=(ch.techniciens&&ch.techniciens.find(t=>t.phone))?ch.techniciens.find(t=>t.phone).phone.replace(/[^0-9+]/g,''):'';
  window.location.href='sms:'+phone+'?&body='+encodeURIComponent(body);
}
function ficheToPlanning(){ collectFiche(); persist(); const ch=curFiche();
  if(!ch.date){ alert('Renseignez la date d\'intervention pour l\'ajouter au planning.'); return; }
  const techs=(ch.techniciens||[]).filter(t=>t.techId); if(!techs.length){ alert('Sélectionnez au moins un technicien.'); return; }
  let added=0; techs.forEach(t=>{ if(!db.poses.some(p=>p.date===ch.date&&p.techId===t.techId&&p.devisId===ficheDevisId)){
    db.poses.push({id:uid(), date:ch.date, heure:ch.heure||'', techId:t.techId, devisId:ficheDevisId, client:ch.clientNom||'', note:ch.travaux||''}); added++; } });
  persist(); updateAplanBadge(); alert(added+' pose(s) ajoutée(s) au planning (semaine du '+new Date(ch.date).toLocaleDateString('fr-FR')+').'); }
function ficheDownloadHTML(){ collectFiche(); persist(); const html=buildFicheStandaloneHTML(db.devis.find(x=>x.id===ficheDevisId));
  saveBlob(new Blob([html],{type:'text/html;charset=utf-8'}), 'fiche-'+curFiche().slug+'.html'); }
function buildFicheStandaloneHTML(d){
  const ch=d.chantier; const maps='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(ch.adresse||'');
  const tel=(ch.tel||'').replace(/[^0-9+]/g,'');
  const mat=(ch.materiel||[]).map(m=>`<tr><td>${esc(m.desc)}</td><td style="text-align:right;white-space:nowrap">${esc(m.qte||'')}</td></tr>`).join('');
  const techs=(ch.techniciens||[]).map(t=>`<li>${esc(t.name)}${t.phone?` — <a href="tel:${esc(t.phone.replace(/[^0-9+]/g,''))}">${esc(t.phone)}</a>`:''}</li>`).join('');
  const infos=(ch.infos||[]).map(i=>`<tr><td style="font-weight:600">${esc(i.label)}</td><td>${esc(i.value)}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fiche chantier ${esc(ch.clientNom||'')}</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2733;background:#f4f5f7}
.wrap{max-width:760px;margin:0 auto;padding:16px}.card{background:#fff;border:1px solid #d8dce4;border-radius:12px;padding:14px 16px;margin-bottom:14px}
h1{color:#1b3a8c;font-size:20px;margin:6px 0}h2{color:#1b3a8c;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px}
.act{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.act a{flex:1;text-align:center;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;font-size:16px}
.call{background:#1a9d5a;color:#fff}.gps{background:#1b3a8c;color:#fff}
table{width:100%;border-collapse:collapse}td{padding:6px 4px;border-bottom:1px solid #eef0f3;vertical-align:top}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1b3a8c;padding-bottom:10px;margin-bottom:12px}
.hdr img{max-height:70px}.meta div{margin:2px 0}.badge{display:inline-block;background:#e8eefb;color:#1b3a8c;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600}
a{color:#1b3a8c}</style></head><body><div class="wrap">
<div class="hdr"><img src="${logoData}" alt="ACF CHAPPERT"><div style="text-align:right"><h1>Fiche de chantier</h1><span class="badge">${esc(ch.num)}</span></div></div>
<div class="act">${tel?`<a class="call" href="tel:${esc(tel)}">📞 Appeler le client</a>`:''}${ch.adresse?`<a class="gps" href="${esc(maps)}">🧭 Navigation GPS</a>`:''}</div>
<div class="card"><h2>Chantier</h2><div class="meta">
  <div><b>${esc(ch.clientNom||'')}</b></div>${ch.adresse?`<div>📍 ${esc(ch.adresse)}</div>`:''}${ch.tel?`<div>📞 <a href="tel:${esc(tel)}">${esc(ch.tel)}</a></div>`:''}
  ${(ch.date||ch.heure)?`<div>🗓 ${esc(ch.date||'')}${ch.heure?' à '+esc(ch.heure):''}${ch.duree?' · '+esc(ch.duree):''}</div>`:''}
  <div style="color:#66707e;font-size:13px">Réf. devis ${esc(d.num)}</div></div></div>
${techs?`<div class="card"><h2>Techniciens</h2><ul>${techs}</ul></div>`:''}
${mat?`<div class="card"><h2>Matériel / fournitures</h2><table>${mat}</table></div>`:''}
${ch.travaux?`<div class="card"><h2>Travaux à réaliser</h2><div>${esc(ch.travaux).replace(/\n/g,'<br>')}</div></div>`:''}
${infos?`<div class="card"><h2>Informations complémentaires</h2><table>${infos}</table></div>`:''}
${ch.consignes?`<div class="card"><h2>Consignes / sécurité / accès</h2><div>${esc(ch.consignes).replace(/\n/g,'<br>')}</div></div>`:''}
${(ch.annexes&&ch.annexes.length)?`<div class="card"><h2>Documents joints</h2>${ch.annexes.map(a=>`<div style="margin-bottom:10px"><div style="font-weight:600;font-size:13px;margin-bottom:4px">${esc(a.name)}</div>${a.images.map(src=>`<img src="${src}" style="max-width:100%;border:1px solid #d8dce4;border-radius:8px;margin-bottom:6px">`).join('')}</div>`).join('')}</div>`:''}
<div style="text-align:center;color:#66707e;font-size:11px;margin:16px 0">SAS ACF CHAPPERT — 9 rue Jacques Monod, 81000 Albi — 05 63 47 11 88 — contact@acfchappert.fr</div>
</div></body></html>`;
}

/* ================= NOTE / GARANTIE ================= */
function blockToggle(blockId, taId){ const ta=document.getElementById(taId);
  document.getElementById(blockId).classList.toggle('is-empty', !ta.value.trim()); }

/* ================= EXPORT PDF (téléchargement + choix d'emplacement) ================= */
async function saveBlob(blob, filename){
  if(window.showSaveFilePicker){
    try{ const handle=await window.showSaveFilePicker({suggestedName:filename, types:[{description:'Document PDF', accept:{'application/pdf':['.pdf']}}]});
      const w=await handle.createWritable(); await w.write(blob); await w.close(); return true; }
    catch(e){ if(e && e.name==='AbortError') return false; }
  }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000); return true;
}
async function elementToPDFBlob(el){
  const canvas=await html2canvas(el,{scale:2, useCORS:true, backgroundColor:'#ffffff'});
  const {jsPDF}=window.jspdf; const pdf=new jsPDF('p','mm','a4');
  const pw=210, ph=297, iw=pw, ih=canvas.height*pw/canvas.width;
  const img=canvas.toDataURL('image/jpeg',0.92);
  let heightLeft=ih, position=0;
  pdf.addImage(img,'JPEG',0,position,iw,ih); heightLeft-=ph;
  while(heightLeft>0){ position-=ph; pdf.addPage(); pdf.addImage(img,'JPEG',0,position,iw,ih); heightLeft-=ph; }
  return pdf.output('blob');
}
async function downloadDocPDF(filename, elId){
  if(typeof html2canvas==='undefined' || !window.jspdf){ alert('Le générateur PDF n\'a pas pu se charger (hors ligne ?). Utilisez « Imprimer » puis « Enregistrer au format PDF ».'); return; }
  try{ const blob=await elementToPDFBlob(document.getElementById(elId||'invoicePage')); await saveBlob(blob, filename||'document.pdf'); }
  catch(e){ alert('Échec de la génération du PDF : '+e.message+'\nUtilisez « Imprimer ».'); }
}
function downloadCurrentDoc(){ downloadDocPDF(currentDoc && currentDoc.filename || 'document.pdf'); }

/* ================= CONDITIONS GÉNÉRALES DE VENTE ================= */
const CGV_ARTICLES=[
 ["ARTICLE 1","L'acheteur est engagé dès la signature du bon de commande ou du bon de travail, accompagné ou non de chèques, espèces ou traites acceptées. Nos marchandises et services étant réputés, connus et agréés par nos clients résultent des indications portées sur le bon de commande ou le bon de travail."],
 ["ARTICLE 1 bis","L'acheteur non professionnel a la faculté de renoncer dans les sept jours par lettre recommandée avec accusé de réception. Passé ce délai l'acheteur est engagé."],
 ["ARTICLE 2","Nos ventes et interventions de service après-vente s'entendent payables au comptant. Une échéance par traite à 30 jours pourra être consentie, majorée de frais d'escomptes habituels. Tout défaut de paiement à échéance entraînera la facturation de pénalités de retard d'un montant au moins égal à 1,5 fois le taux d'intérêt légal. Le client est, dans ce cas, tenu d'accepter les effets dès réception de la facture. Le paiement des traites ne peut être différé ou refusé sous prétexte qu'il y aurait lieu à l'application des clauses de garanties."],
 ["ARTICLE 3","Les délais de livraison ne sont donnés qu'à titre de simple indication, tout retard ne peut donner lieu à résiliation de la commande ou indemnité. Les marchandises voyagent aux risques et périls du client auquel il appartient de vérifier le bon état au moment de la livraison. Dans tout contrat non professionnel, la date limite de livraison sera indiquée."],
 ["ARTICLE 4","Toute annulation de contrat de vente due à l'acheteur pourra entraîner la perte de l'acompte ou l'exécution forcée du contrat ou une indemnité d'au moins 25 % du montant de la commande. Nous nous réservons le droit d'annuler ou d'ajourner une commande si des évènements de force majeure nous y obligent. À nous d'en aviser l'acheteur dans la huitaine qui suit la naissance de l'évènement de force majeure."],
 ["ARTICLE 5","Le matériel livré neuf est garanti un an contre tous vices de fabrication selon les clauses des constructeurs, à dater de sa livraison. Toutefois, cette garantie ne pourra en aucun cas donner droit par nous à une indemnité sous quelque forme que ce soit. La garantie est suspendue dans le cas où l'acheteur ne tiendrait pas ses engagements en matière de règlement. La garantie ne s'étend ni aux conséquences d'un mauvais établissement des fondations, ni aux travaux d'adaptation des locaux, ni aux raccordements (cheminée, eau, électricité, mazout, gaz, prise de terre), ni aux conséquences de toute faute d'utilisation ou de surveillance des matériels. L'intervention d'un tiers sur l'installation annule la garantie. La responsabilité du vendeur est expressément limitée à la garantie ci-dessus, à l'exclusion de tous accidents causés aux personnes et aux choses, aux incendies, privation de jouissance et pertes de denrées pour quelque cause que ce soit."],
 ["ARTICLE 6","Tous travaux de bâtiment nécessaires pour la livraison et l'installation de nos matériels ainsi que la construction des cheminées, des raccordements d'eau, d'électricité, par gaz, fuel, prise de terre, vidange sont à la charge du client. Les énergies devront être préparées au droit de chaque appareil."],
 ["ARTICLE 7","Réserve de propriété en application de la loi n° 80335 du 12/05/1980. La propriété de nos marchandises n'est transférée à l'acheteur qu'à compter du paiement intégral du prix. À défaut de règlement du prix à l'échéance convenue, l'entreprise pourra reprendre les marchandises et la vente sera résolue de plein droit si bon lui semble. Les acomptes versés resteront acquis à notre entreprise à titre de dédommagement."],
 ["ARTICLE 8","En cas de contestation, le Tribunal de Commerce d'Albi est seul compétent de convention expresse, même s'il y a pluralité de défenses ou appel en garantie."]
];
const CGV_MEDIATEUR="Conformément à l'article L611-1 du code de la consommation, le consommateur est informé qu'il a la possibilité de saisir un médiateur de la consommation dans les conditions prévues aux articles L611-1 et suivants du code de la consommation, dont les coordonnées administratives sont : Association MEDIMMOCONSO, 1 Allée du Parc de Mesemena – Bât A – CS25222 – 44505 LA BAULE CEDEX ; Site internet : https://www.economie.gouv.fr";
function renderCGV(){
  const el=document.getElementById('cgvPage'); if(!el) return;
  el.innerHTML='<h2>Conditions générales de vente</h2>'+
    CGV_ARTICLES.map(a=>`<div class="cgv-art"><b>${a[0]} :</b> ${esc(a[1])}</div>`).join('')+
    `<div class="cgv-med"><b>MÉDIATEUR DE LA CONSOMMATION</b><br>${esc(CGV_MEDIATEUR)}</div>`;
}

/* ================= ANNEXES (documents joints) ================= */
if(typeof pdfjsLib!=='undefined'){ try{ pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }catch(_){} }
function annexStatus(t){ const s=document.getElementById('annexStatus'); if(s) s.textContent=t||''; }
function downscaleImage(dataURL, maxPx){ return new Promise(res=>{ const img=new Image();
  img.onload=()=>{ let {width:w,height:h}=img; const m=Math.max(w,h); if(m>maxPx){ const r=maxPx/m; w=Math.round(w*r); h=Math.round(h*r); }
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h);
    res(cv.toDataURL('image/jpeg',0.85)); };
  img.onerror=()=>res(dataURL); img.src=dataURL; }); }
async function pdfToImages(arrbuf){
  if(typeof pdfjsLib==='undefined') throw new Error('pdfjs indisponible');
  const pdf=await pdfjsLib.getDocument({data:arrbuf}).promise; const out=[];
  for(let p=1;p<=pdf.numPages;p++){ const page=await pdf.getPage(p); const vp=page.getViewport({scale:1.6});
    const cv=document.createElement('canvas'); cv.width=vp.width; cv.height=vp.height;
    await page.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise;
    out.push(cv.toDataURL('image/jpeg',0.82)); annexStatus('Traitement PDF… page '+p+'/'+pdf.numPages); }
  return out;
}
async function filesToAnnexes(files, statusFn){
  const out=[];
  for(const f of files){
    try{
      if(f.type==='application/pdf' || f.name.toLowerCase().endsWith('.pdf')){
        statusFn&&statusFn('Lecture du PDF « '+f.name+' »…');
        if(typeof pdfjsLib==='undefined'){ alert('Le lecteur PDF n\'a pas pu se charger (hors ligne ?). Les images fonctionnent, ou convertissez le PDF en images.'); continue; }
        const buf=await f.arrayBuffer(); const imgs=await pdfToImages(new Uint8Array(buf));
        out.push({id:uid(), name:f.name, images:imgs});
      } else if(f.type.startsWith('image/')){
        statusFn&&statusFn('Ajout de l\'image « '+f.name+' »…');
        const dataURL=await new Promise(r=>{ const rd=new FileReader(); rd.onload=ev=>r(ev.target.result); rd.readAsDataURL(f); });
        out.push({id:uid(), name:f.name, images:[await downscaleImage(dataURL,1600)]});
      } else { alert('Type de fichier non pris en charge : '+f.name+' (images et PDF uniquement).'); }
    }catch(err){ alert('Impossible d\'ajouter « '+f.name+' » : '+err.message); }
  }
  return out;
}
async function addAnnex(e){
  const files=[...e.target.files]; if(!files.length) return; e.target.value='';
  if(!cur.annexes) cur.annexes=[];
  const added=await filesToAnnexes(files, annexStatus); cur.annexes.push(...added);
  annexStatus(''); renderAnnexes(); saveDevis(false);
}
/* Annexes de la fiche de chantier */
function ficheAnnexStatus(t){ const s=document.getElementById('ficheAnnexStatus'); if(s) s.textContent=t||''; }
async function addFicheAnnex(e){
  const files=[...e.target.files]; if(!files.length) return; e.target.value='';
  const ch=curFiche(); if(!ch) return; if(!ch.annexes) ch.annexes=[];
  const added=await filesToAnnexes(files, ficheAnnexStatus); ch.annexes.push(...added);
  ficheAnnexStatus(''); renderFicheAnnexes(); persist();
}
function removeFicheAnnex(id){ const ch=curFiche(); if(!ch) return; ch.annexes=(ch.annexes||[]).filter(a=>a.id!==id); renderFicheAnnexes(); persist(); }
function renderFicheAnnexes(){
  const ch=curFiche(); if(!ch) return; const ax=ch.annexes||[];
  const list=document.getElementById('ficheAnnexList'); const printBox=document.getElementById('ficheAnnexPrint');
  if(list) list.innerHTML = ax.length ? ax.map(a=>`<div style="display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid var(--bord); border-radius:8px; margin-bottom:6px">
      <span style="font-size:16px">${a.images.length>1?'📄':'🖼'}</span>
      <span style="flex:1"><b>${esc(a.name)}</b> <span style="color:var(--muted); font-size:12px">— ${a.images.length} page(s)</span></span>
      <button class="small rouge" onclick="removeFicheAnnex('${a.id}')">Retirer</button></div>`).join('')
    : '<span style="color:var(--muted); font-size:12px">Aucun document joint.</span>';
  if(printBox) printBox.innerHTML = ax.map(a=> a.images.map((src,i)=>`<div class="annex-page">
      <div class="annex-title">Document — ${esc(a.name)}${a.images.length>1?' ('+(i+1)+'/'+a.images.length+')':''}</div>
      <div class="annex-img"><img src="${src}"></div></div>`).join('')).join('');
}
function removeAnnex(id){ cur.annexes=(cur.annexes||[]).filter(a=>a.id!==id); renderAnnexes(); saveDevis(false); }
function renderAnnexes(){
  const list=document.getElementById('annexList'); const printBox=document.getElementById('annexesPrint');
  const ax=cur&&cur.annexes||[];
  list.innerHTML = ax.length ? ax.map(a=>`<div style="display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid var(--bord); border-radius:8px; margin-bottom:6px">
      <span style="font-size:16px">${a.images.length>1?'📄':'🖼'}</span>
      <span style="flex:1"><b>${esc(a.name)}</b> <span style="color:var(--muted); font-size:12px">— ${a.images.length} page(s)</span></span>
      <button class="small rouge" onclick="removeAnnex('${a.id}')">Retirer</button></div>`).join('')
    : '<span style="color:var(--muted); font-size:12px">Aucun document joint.</span>';
  printBox.innerHTML = ax.map(a=> a.images.map((src,i)=>`<div class="annex-page">
      <div class="annex-title">Annexe — ${esc(a.name)}${a.images.length>1?' ('+(i+1)+'/'+a.images.length+')':''}</div>
      <div class="annex-img"><img src="${src}"></div></div>`).join('')).join('');
}

/* ================= INIT ================= */
setupDnD();
renderList();
updateAplanBadge();
