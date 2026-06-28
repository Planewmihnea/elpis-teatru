(function () {
  const CHEIE = 'elpis_cortina_v3';

  function creeaza() {
    // Bara aurie sus
    const bara = document.createElement('div');
    bara.id = 'cortina-bara';
    document.body.appendChild(bara);

    // Logo PE CORTINA (nu hero) - dispare înainte să se tragă cortina
    const logo = document.createElement('div');
    logo.id = 'cortina-logo';
    logo.innerHTML = `
      <div class="cortina-logo-linie"></div>
      <span class="cortina-logo-elpis">ELPIS</span>
      <span class="cortina-logo-sub">Trupa de Teatru · Constanța</span>
      <div class="cortina-logo-linie"></div>`;
    document.body.appendChild(logo);

    // Cele două jumătăți
    const overlay = document.createElement('div');
    overlay.id = 'cortina-overlay';

    let cute = '<div class="cortina-cute">';
    for (let i = 0; i < 14; i++) cute += '<div class="cortina-cuta"></div>';
    cute += '</div>';

    const h = [22,30,18,34,26,20,28,16,24,32];
    let fr = '<div class="cortina-franjuri">';
    for (let i = 0; i < 10; i++) fr += `<div class="cortina-franj" style="height:${h[i%h.length]}px"></div>`;
    fr += '</div>';

    overlay.innerHTML = `
      <div id="cortina-stanga">${cute}${fr}</div>
      <div id="cortina-dreapta">${cute}${fr}</div>`;
    document.body.appendChild(overlay);

    // Blochează scroll
    document.body.style.overflow = 'hidden';
  }

  function trage() {
    // 1. Pauza dramatică (logo vizibil)
    setTimeout(() => {
      const logo = document.getElementById('cortina-logo');

      // 2. Logo dispare COMPLET
      if (logo) {
        logo.style.transition = 'opacity .5s ease';
        logo.style.opacity = '0';
      }

      // 3. Cortina se trage DUPĂ ce logo-ul a dispărut complet
      setTimeout(() => {
        // Elimină logo-ul din DOM ca să nu se suprapună cu hero
        logo?.remove();

        document.getElementById('cortina-stanga')?.classList.add('trasa');
        document.getElementById('cortina-dreapta')?.classList.add('trasa');

        // 4. Curăță tot după animație
        setTimeout(() => {
          const ov   = document.getElementById('cortina-overlay');
          const bara = document.getElementById('cortina-bara');
          if (ov)   ov.classList.add('ascuns');
          if (bara) bara.style.opacity = '0';
          document.body.style.overflow = '';

          setTimeout(() => {
            ov?.remove();
            bara?.remove();
          }, 500);
        }, 2400);

      }, 550); // logo dispare 550ms, apoi cortina pleacă
    }, 950);   // pauza inițială
  }

  function init() {
    if (sessionStorage.getItem(CHEIE)) return;
    sessionStorage.setItem(CHEIE, '1');
    creeaza();
    trage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
