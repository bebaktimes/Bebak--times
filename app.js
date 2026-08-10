const defaultNews=[{title:"बेबाक टाइम्स में आपका स्वागत है",category:"राष्ट्रीय",body:"यह डेमो खबर है। Admin पेज से नई खबरें जोड़कर होमपेज पर प्रदर्शित करें।",breaking:false}];
function getNews(){try{return JSON.parse(localStorage.getItem('bebakNews'))||defaultNews}catch(e){return defaultNews}}
function render(){const box=document.getElementById('newsList'); if(!box)return; box.innerHTML=getNews().map((n,i)=>`<article class="card"><div class="meta">${n.category}${n.breaking?' • BREAKING':''}</div><h3>${n.title}</h3><p>${n.body}</p></article>`).join('')}
render();