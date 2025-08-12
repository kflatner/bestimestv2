function resultsView() {
    const competition = getActiveCompetition();
    if (!competition) return '<p>Ingen aktiv konkurranse.</p>';

    const points = {};

   
    for (let player of competition.players) {
        points[player.id] = 0;
    }

    
    for (let result of competition.results) {
        if (result.first) points[result.first] += 3;
        if (result.second) points[result.second] += 2;
        if (result.third) points[result.third] += 1;
    }

    
    let html = `
        <h2>Poengtavle</h2> 
        <br>
        <table>
            <tr>
                ${competition.players.map(p => `<th>${p.username}</th>`).join('')}
            </tr>
            <tr>
                ${competition.players.map(p => `<td>${points[p.id]}</td>`).join('')}
            </tr>
        </table>

        <br>
        <h3>Resultatliste</h3>
        <ul>
    `;

    for (let result of competition.results) {
        let activityName = 'Ukjent aktivitet';

        if (result.customSport && result.customSport.trim()) {
            activityName = result.customSport;
        } else if (result.activityId) {
            const found = model.data.activities.find(a => a.id === result.activityId);
            if (found) activityName = found.sport;
        }

        const first = getPlayerNameFromCompetition(result.first, competition);
        const second = getPlayerNameFromCompetition(result.second, competition);
        const third = getPlayerNameFromCompetition(result.third, competition);

        html += `
            <li>
                <strong>${activityName}</strong> – 1: ${first}, 2: ${second}, 3: ${third}
            </li>
        `;
    }

    html += `</ul>
        <button onclick="model.app.currentPage='players'; updateView()">⬅ Tilbake</button>
    `;

    return html;
}

function getPlayerNameFromCompetition(id, competition) {
    return competition.players.find(p => p.id === id)?.username || 'Ukjent';
}

function getPlayerName(id) {
    return model.data.players.find(p => p.id === id)?.username || 'Ukjent';
}
