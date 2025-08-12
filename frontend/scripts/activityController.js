function startNextActivity() {
    const competition = getActiveCompetition();
    if (!competition) return;

    const inputs = model.inputs;
    const newAct = inputs.newActivity;

    if (!newAct.hostId || (!newAct.sportId && !inputs.customSport?.trim()) || !newAct.date || !newAct.time) {
        alert("Vennligst fyll ut alle felter.");
        return;
    }

    let activityData;

    if (inputs.useCustomSport && inputs.customSport?.trim()) {
        const newId = model.data.activities.length > 0
            ? Math.max(...model.data.activities.map(a => a.id)) + 1
            : 1;

        const customSport = inputs.customSport.trim();

      
        const newActivityObj = {
            id: newId,
            sport: customSport,
            image: '', 
        };

        model.data.activities.push(newActivityObj);

        activityData = {
            hostId: newAct.hostId,
            sportId: newId,
            customSport: customSport,
            date: newAct.date,
            time: newAct.time,
        };
    } else {
        activityData = {
            hostId: newAct.hostId,
            sportId: newAct.sportId,
            date: newAct.date,
            time: newAct.time,
        };
    }

    
    competition.nextActivity = activityData;

    
    model.inputs.newActivity = { hostId: null, sportId: null, date: '', time: '' };
    model.inputs.customSport = '';
    model.inputs.useCustomSport = false;
    model.inputs.showPlanActivityForm = false;

    updateView();
}







  

function submitResult() {
    const competition = getActiveCompetition();
    if (!competition) return;

    const { first, second, third, location, weather, summary } = model.inputs.result;
    const next = competition.nextActivity;

    if (!next || !first || !second || !third) {
        alert("Fyll ut alle plasseringer.");
        return;
    }

    competition.results.push({
        activityId: next.sportId,
        customSport: next.customSport || null,
        first,
        second,
        third,
        location,
        weather,
        summary
    });

    
    competition.pastActivities.push(next);

    
    model.inputs.result = {
        first: null,
        second: null,
        third: null,
        location: '',
        weather: '',
        summary: ''
    };
    competition.nextActivity = null;
    model.inputs.showResultForm = false;

    updateView();
}
function endActivity() {
    model.inputs.showPlanActivityForm = false;
    model.inputs.showResultForm = true;
    updateView();
}

