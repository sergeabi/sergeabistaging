(()=>{
  const button=document.querySelector('.text-magnifier');
  const page=document.querySelector('main');
  if(!button||!page)return;
  const badge=button.querySelector('.zoom-level');
  const factors=[1,1.2,1.4];
  const labels={
    en:['Magnification 0x, normal size. Click for 1x (+20%).','Magnification 1x (+20%). Click for 2x (+40%).','Magnification 2x (+40%). Click to reset.'],
    fr:['Grossissement 0x, taille normale. Cliquez pour passer à 1x (+20 %).','Grossissement 1x (+20 %). Cliquez pour passer à 2x (+40 %).','Grossissement 2x (+40 %). Cliquez pour réinitialiser.'],
    es:['Aumento 0x, tamaño normal. Pulsa para pasar a 1x (+20 %).','Aumento 1x (+20 %). Pulsa para pasar a 2x (+40 %).','Aumento 2x (+40 %). Pulsa para restablecer.'],
    ar:['تكبير ٠x، الحجم الطبيعي. اضغط للانتقال إلى ١x (+٢٠٪).','تكبير ١x (+٢٠٪). اضغط للانتقال إلى ٢x (+٤٠٪).','تكبير ٢x (+٤٠٪). اضغط لإعادة الضبط.']
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
