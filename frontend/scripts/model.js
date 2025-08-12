const model = {
  app: {
    currentPage: localStorage.getItem('loggedInUser') ? 'competitionSelect' : 'login',
    activeCompetitionId: 1,
    loggedInUser: JSON.parse(localStorage.getItem('loggedInUser')) || null,
  },
  


  inputs: {
      login: { 
        username: '',
         password: '' 
        },
        
  register: {
     username: '',
      password: '' 
    },
    viewOption: 'players',
    selectedPlayerId: null,
    selectedActivityId: null,
    useCustomSport: false,
    customSport: '',
    showPlanActivityForm: false,
    showResultForm: false,
    newActivity: {
      hostId: null,
      sportId: null,
      date: '',
      time: ''
    },
    result: {
      first: null,
      second: null,
      third: null,
      location: '',
      weather: '',
      summary: ''
    }
  },

  data: {
    competitions: [
      {
        id: 1,
        name: "Sommermesterskap 2025",
        players: [
          { id: 1, username: 'Kenneth' },
          { id: 2, username: 'Ola' },
          { id: 3, username: 'Vujan' },
        ],
        results: [
          { activityId: 1, first: 2, second: 3, third: 1, location: "Sandefjord, Bugården DiscGolf Bane", weather: "Sol", summary: "Ola viser tydelig at han har noen timer mer enn oss i DG, utklassing!" },
          { activityId: 2, first: 3, second: 2, third: 1, location: "Sandefjord,Fjellsport`s lokaler", weather: "Husker ikke,var inne..", summary: "Tett kamp mellom Vujan og Ola, Ola mistet hode og tapte på slutten" },
          { activityId: 3, first: 2, second: 1, third: 3, location: "Sandefjord,Corner Pub", weather: "Sol da vi kom,mørkt da vi dro..", summary: "Vujan ga opp, Mellom Ola og Kenneth var det første man som traff Dobbel 2 som ble vinner." },
          { activityId: 4, first: 2, second: 3, third: 1, location: "Sandefjord, Metro Bowling hall", weather: "Var vel sol,men inne aktivitet", summary: "Her kom Ola sine mange timer i bowlinghallen til gode, dette var utklassing" },
          { activityId: 5, first: 2, second: 3, third: 1, location: "Sandefjord,Vujans hage", weather: "Sol og litt god vind", summary: "Ola og Kenneth spilte jevnt,desverre tapte Kenneth  begge mot Vujan og Ola tok begge mot Vujan" },
          { activityId: 6, first: 2, second: 1, third: 3, location: "Sandefjord,Ranvik Svømmehall", weather: "Inne aktivitet", summary: "Her var Kenneth desidert den beste svømmeren, Men Ola viste hvem som var det største barnet, og tok runde seier med lek i vannet" },
          { activityId: 7, first: 2, second: 1, third: 3, location: "Sandefjord,Ola`s hage", weather: "Sol", summary: "Ola var skuffet over egen skyting, men Vujan og Kenneth følte seg som Indianere å gjorde så godt vi kunne å traff som regel Blink!" },
          { activityId: 8, first: 3, second: 2, third: 1, location: "Vujans residence", weather: "Overskyet", summary: "Her var det jevnt mellom Vujan og Ola lenge, Men da det gjaldt tapte Ola den avgjørnde kampen mot Kenneth" },
          { activityId: 1, first: 2, second: 3, third: 1, location: "Bugården DiscGolf bane.", weather: "Sol og litt overskyet", summary: "Ola var overlegen, men Vujan og Kenneth kjempet om andre plass!" },
          { activityId: 9, first: 2, second: 1, third: 3, location: "Jotun Hallen,Bugården.", weather: "Vi var inne i hallen, så var vanskelig å se..", summary: "Her var det konkuranse om den gjeve andre plassen! Vujan tok første stikk mot Kenneth, men de neste 2 rundene visste Kenneth: At han har drevet med strand spill før!" },
          { activityId: 10, first: 3, second: 2, third: 1, location: "Bugården MiniGolf bane.", weather: "Sol og litt overskyet", summary: "Ola var cocky, men gikk desverre ikke for han denne gangen!!" },
          { activityId: 11, first: 2, second: 0, third: 1, location: "Ranvik Bocca bane.", weather: "Sol og litt overskyet", summary: "" },
          { activityId: 12, first: 2, second: 1, third: 3, location: "Åsane, Tennis Court", weather: "Mye sol", summary: "" }
        ],
        nextActivity: null,
        pastActivities: []
      }
    ],

    activities: [
      { id: 1, sport: "Discgolf", image: "" },
      { id: 2, sport: "Bordtennis", image: "" },
      { id: 3, sport: "Dart", image: "" },
      { id: 4, sport: "Bowling", image: "" },
      { id: 5, sport: "Kubb", image: "" },
      { id: 6, sport: "Lek i vannet", image: "" },
      { id: 7, sport: "Bueskyting", image: "images/BIB_bue.png" },
      { id: 8, sport: "Worms", image: "" },
      { id: 9, sport: "Badmington", image: "images/BIB_badmington.png" },
      { id: 10, sport: "MiniGolf", image: "images/BIB_badmington.png" },
      { id: 11, sport: "Bocca", image: "images/BIB_badmington.png" },
      { id: 12, sport: "Tennis", image: "" },
    ]
  }
};
model.inputs = model.inputs || {};
model.inputs.newActivity = model.inputs.newActivity || {
  hostId: null,
  sportId: null,
  date: '',
  time: ''
};
model.inputs.useCustomSport = !!model.inputs.useCustomSport;
model.inputs.customSport = model.inputs.customSport || '';
model.inputs.result = model.inputs.result || {
  first: null, second: null, third: null,
  location: '', weather: '', summary: ''
};

