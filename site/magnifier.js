(()=>{
  const button=document.querySelector('.text-magnifier');
  const page=document.querySelector('main');
  if(!button||!page)return;
  const badge=button.querySelector('.zoom-level');
  const factors=[1,1.5,2];
  const labels={
    en:['Magnification 0x. Click to zoom in.','Magnification 1x. Click to zoom further.','Magnification 2x. Click to reset.'],
    fr:['Grossissement 0x. Cliquez pour agrandir.','Grossissement 1x. Cliquez pour agrandir davantage.','Grossissement 2x. Cliquez pour réinitialiser.'],
    es:['Aumento 0x. Pulsa para ampliar.','Aumento 1x. Pulsa para ampliar más.','Aumento 2x. Pulsa para restablecer.'],
    ar:['تكبير ٠x. اضغط للتكبير.','تكبير ١x. اضغط لمزيد من التكبير.','تكبير ٢x. اضغط لإعادة الضبط.']
  };
  let level=0;
  try{level=Number(localStorage.getItem('serge-zoom-level')||0)}catch{}
  if(!Number.isInteger(level)||level<0||level>2)level=0;
  function applyZoom(next){
    level=next;
    page.style.zoom=String(factors[level]);
    badge.textContent=level+'x';
    button.setAttribute('aria-label',(labels[document.documentElement.lang]||labels.en)[level]);
    button.setAttribute('aria-pressed',String(level>0));
    try{localStorage.setItem('serge-zoom-level',String(level))}catch{}
  }
  button.addEventListener('click',()=>applyZoom((level+1)%3));
  new MutationObserver(()=>{
    button.setAttribute('aria-label',(labels[document.documentElement.lang]||labels.en)[level]);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  applyZoom(level);
})();
