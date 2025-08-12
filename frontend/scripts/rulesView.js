

function rulesView() {
  return `
    <div class="content-section">
      <h1>Regler</h1>
      <p>Aktivitetsdag skal settes minimum 2 dager før Game day.</p>
      <p>For sen til oppmøte tid gir -2 poeng.</p>

      <h2>Rematch</h2>
      <p>Rematch kan kun brukes av en som ikke har vunnet gjeldende aktivitet.</p>

      <h2>Poengregning ved rematch</h2>
      <p><strong>Utfordrer (ba om rematch):</strong></p>
      
        Forbedrer plassering = +1 poeng
        Samme plassering = 0 poeng
        Dårligere plassering = -2 poeng
     
      <p><strong>De andre deltakerne:</strong></p>
      
        Forbedrer plassering = +1 poeng
        Samme plassering = 0 poeng
        Dårligere plassering = -1 poeng
      

      <button onclick="goToPage('competitionSelect')">⬅ Tilbake</button>
    </div>
  `;
}
window.rulesView = rulesView;

