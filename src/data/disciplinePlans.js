// Discipline-specific plans: a second matching layer inside a broad category.
// Each discipline names its parent category, the words that identify it, and a
// tailored plan in the same shape as activityDatabase plans.
// Keyword rule: words of 4+ letters also match by prefix (e.g. "gymnast" ~ "gymnastics").

const sec = (category, icon, rows) => ({
  category,
  icon,
  activities: rows.map(([name, frequency, duration]) => ({ name, frequency, duration })),
});

export const DISCIPLINES = {
  gymnastics: {
    category: 'sports',
    keywords: ['gymnast', 'gymnastics', 'tumbling', 'acrobatics', 'trampoline', 'rhythmic gymnastics'],
    plan: [
      sec('Skills Training', '🤸', [
        ['Gymnastics Classes (club or gym)', '2-3x/week', '90 mins'],
        ['Tumbling & Floor Skills', '2x/week', '45 mins'],
        ['Balance Beam Drills', '2x/week', '30 mins'],
        ['Bars & Vault Practice (coached)', '2x/week', '45 mins'],
      ]),
      sec('Strength & Flexibility', '💪', [
        ['Core & Upper-Body Strength', '3x/week', '30 mins'],
        ['Splits & Flexibility Routine', 'Daily', '15 mins'],
        ['Handstand & Balance Practice', 'Daily', '10 mins'],
        ['Conditioning Circuits', '2x/week', '30 mins'],
      ]),
      sec('Competition & Progress', '🏆', [
        ['Skill Level Assessments', 'Seasonal', '2 hours'],
        ['Local Meets & Showcases', 'Monthly', '4 hours'],
        ['Watch Gymnastics Meets', 'Monthly', '1 hour'],
        ['Video Review of Routines', 'Weekly', '20 mins'],
      ]),
      sec('Recovery & Nutrition', '🍎', [
        ['Recovery Stretching', '2x/week', '20 mins'],
        ['Healthy Meal & Hydration Planning', 'Weekly', '30 mins'],
      ]),
    ],
  },

  swimming: {
    category: 'sports',
    keywords: ['swim', 'swimming', 'swimmer', 'lifeguard', 'water polo', 'synchronized swimming'],
    plan: [
      sec('Pool Training', '🏊', [
        ['Swim Lessons / Squad Training', '3x/week', '60 mins'],
        ['Stroke Technique Drills', '2x/week', '30 mins'],
        ['Endurance Sets', '2x/week', '45 mins'],
        ['Water Safety & Treading', 'Weekly', '30 mins'],
      ]),
      sec('Dryland & Fitness', '💪', [
        ['Core & Shoulder Strength', '2x/week', '30 mins'],
        ['Mobility & Stretching', 'Daily', '15 mins'],
      ]),
      sec('Competition', '🏆', [
        ['Swim Meets', 'Monthly', '4 hours'],
        ['Timed Trials', 'Monthly', '1 hour'],
        ['Watch Swim Races', 'Monthly', '1 hour'],
      ]),
    ],
  },

  soccer: {
    category: 'sports',
    keywords: ['soccer', 'footballer', 'striker', 'goalkeeper', 'futsal'],
    plan: [
      sec('Skills Training', '⚽', [
        ['Team Practice', '2-3x/week', '90 mins'],
        ['Dribbling & Ball Control', '4x/week', '20 mins'],
        ['Passing & Shooting Drills', '2x/week', '30 mins'],
        ['Goalkeeping Basics', 'Weekly', '30 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Sprint & Agility Work', '2x/week', '30 mins'],
        ['Endurance Running', '2x/week', '30 mins'],
      ]),
      sec('Games & Progress', '🏆', [
        ['League Games', 'Weekly', '90 mins'],
        ['Tournaments', 'Seasonal', '1 day'],
        ['Watch Professional Matches', 'Weekly', '90 mins'],
      ]),
    ],
  },

  basketball: {
    category: 'sports',
    keywords: ['basketball', 'hoops', 'nba', 'wnba'],
    plan: [
      sec('Skills Training', '🏀', [
        ['Team Practice', '2-3x/week', '90 mins'],
        ['Ball Handling Drills', 'Daily', '20 mins'],
        ['Shooting Form & Free Throws', '4x/week', '30 mins'],
        ['Defense & Footwork', '2x/week', '30 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Jump & Agility Training', '2x/week', '30 mins'],
        ['Conditioning Runs', '2x/week', '30 mins'],
      ]),
      sec('Games & Progress', '🏆', [
        ['League Games', 'Weekly', '90 mins'],
        ['Pickup Games', 'Weekly', '1 hour'],
        ['Skills Camp', 'Seasonal', '1 week'],
      ]),
    ],
  },

  tennis: {
    category: 'sports',
    keywords: ['tennis', 'pickleball', 'squash', 'badminton', 'racquet', 'racket'],
    plan: [
      sec('Skills Training', '🎾', [
        ['Group or Private Lessons', '2x/week', '60 mins'],
        ['Forehand & Backhand Drills', '3x/week', '30 mins'],
        ['Serve Practice', '3x/week', '20 mins'],
        ['Rally & Footwork Drills', '2x/week', '30 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Agility & Speed Training', '2x/week', '30 mins'],
        ['Core & Shoulder Strength', '2x/week', '25 mins'],
      ]),
      sec('Match Play', '🏆', [
        ['Practice Matches', 'Weekly', '1 hour'],
        ['Junior Tournaments', 'Monthly', '4 hours'],
        ['Watch Professional Matches', 'Monthly', '2 hours'],
      ]),
    ],
  },

  running: {
    category: 'sports',
    keywords: ['runner', 'running', 'sprinter', 'sprint', 'marathon', 'track and field', 'cross country', 'jogging', 'triathlon', 'hurdles'],
    plan: [
      sec('Running Training', '🏃', [
        ['Easy Runs', '3x/week', '30 mins'],
        ['Speed Intervals', 'Weekly', '40 mins'],
        ['Long Run', 'Weekly', '45 mins'],
        ['Running Form & Drills', '2x/week', '20 mins'],
      ]),
      sec('Strength & Mobility', '💪', [
        ['Leg & Core Strength', '2x/week', '30 mins'],
        ['Stretching & Foam Rolling', 'Daily', '10 mins'],
      ]),
      sec('Racing', '🏆', [
        ['Join a Youth Track or Running Club', 'Weekly', '90 mins'],
        ['Fun Runs & Races', 'Monthly', '3 hours'],
        ['Track Meets', 'Seasonal', '1 day'],
      ]),
    ],
  },

  skating: {
    category: 'sports',
    keywords: ['skater', 'skating', 'figure skating', 'ice skating', 'roller skating', 'rollerblading', 'speed skating'],
    negativeKeywords: ['skateboard', 'skateboarding'],
    plan: [
      sec('On-Ice / Wheels Training', '⛸️', [
        ['Skating Lessons', '2x/week', '45 mins'],
        ['Edges, Turns & Stops Drills', '3x/week', '30 mins'],
        ['Jumps & Spins Practice', '2x/week', '30 mins'],
        ['Free Skate Sessions', 'Weekly', '1 hour'],
      ]),
      sec('Strength & Balance', '💪', [
        ['Leg & Core Strength', '2x/week', '30 mins'],
        ['Balance & Flexibility', 'Daily', '15 mins'],
      ]),
      sec('Performance', '🏆', [
        ['Skill Tests', 'Seasonal', '2 hours'],
        ['Shows & Competitions', 'Seasonal', '1 day'],
        ['Watch Professional Skating', 'Monthly', '1 hour'],
      ]),
    ],
  },

  cycling: {
    category: 'sports',
    keywords: ['cyclist', 'cycling', 'bike', 'biking', 'bicycle', 'bmx', 'mountain biking'],
    plan: [
      sec('Riding Skills', '🚴', [
        ['Bike Skills Class', 'Weekly', '60 mins'],
        ['Road Safety & Signals', 'Weekly', '20 mins'],
        ['Cornering & Braking Drills', '2x/week', '20 mins'],
        ['Group or Family Ride', 'Weekly', '90 mins'],
      ]),
      sec('Fitness & Care', '💪', [
        ['Leg Strength & Endurance', '2x/week', '30 mins'],
        ['Basic Bike Maintenance', 'Monthly', '45 mins'],
      ]),
      sec('Events', '🏆', [
        ['Local Rides & Charity Events', 'Monthly', '3 hours'],
        ['Youth Cycling Club', 'Weekly', '90 mins'],
      ]),
    ],
  },

  climbing: {
    category: 'sports',
    keywords: ['climber', 'climbing', 'bouldering', 'rock climbing'],
    plan: [
      sec('Climbing Skills', '🧗', [
        ['Indoor Climbing Gym Sessions', '2x/week', '90 mins'],
        ['Bouldering Technique', 'Weekly', '60 mins'],
        ['Rope Safety & Belay Skills (supervised)', 'Weekly', '45 mins'],
      ]),
      sec('Strength & Flexibility', '💪', [
        ['Grip, Core & Pull Strength', '2x/week', '30 mins'],
        ['Hip & Shoulder Flexibility', 'Daily', '15 mins'],
      ]),
      sec('Progress', '🏆', [
        ['Youth Climbing Team or Club', 'Weekly', '2 hours'],
        ['Outdoor Climbing Trips', 'Seasonal', '1 day'],
        ['Climbing Comps', 'Seasonal', '1 day'],
      ]),
    ],
  },

  golf: {
    category: 'sports',
    keywords: ['golf', 'golfer'],
    plan: [
      sec('Skills Training', '⛳', [
        ['Junior Golf Lessons', 'Weekly', '60 mins'],
        ['Putting Practice', '3x/week', '20 mins'],
        ['Driving Range Session', 'Weekly', '45 mins'],
        ['Short Game (Chipping & Pitching)', 'Weekly', '30 mins'],
      ]),
      sec('Play & Etiquette', '🏌️', [
        ['Play 9 Holes', 'Weekly', '2 hours'],
        ['Golf Rules & Etiquette', 'Monthly', '30 mins'],
      ]),
      sec('Competition', '🏆', [
        ['Junior Tournaments', 'Seasonal', '1 day'],
        ['Watch Professional Golf', 'Monthly', '2 hours'],
      ]),
    ],
  },

  hockey: {
    category: 'sports',
    keywords: ['hockey', 'nhl', 'goalie'],
    plan: [
      sec('Skills Training', '🏒', [
        ['Team Practice', '2-3x/week', '60 mins'],
        ['Skating & Edge Work', '2x/week', '30 mins'],
        ['Stickhandling & Shooting', '4x/week', '20 mins'],
        ['Goalie Training (if a goalie)', 'Weekly', '45 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Leg & Core Strength', '2x/week', '30 mins'],
        ['Agility & Balance', '2x/week', '20 mins'],
      ]),
      sec('Games', '🏆', [
        ['League Games', 'Weekly', '90 mins'],
        ['Tournaments', 'Seasonal', '1 weekend'],
        ['Watch Professional Games', 'Weekly', '2 hours'],
      ]),
    ],
  },

  baseball: {
    category: 'sports',
    keywords: ['baseball', 'softball', 'mlb', 'pitcher', 'batting'],
    plan: [
      sec('Skills Training', '⚾', [
        ['Team Practice', '2x/week', '90 mins'],
        ['Throwing & Catching Drills', '4x/week', '20 mins'],
        ['Batting Practice', '3x/week', '30 mins'],
        ['Fielding & Base Running', '2x/week', '30 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Arm Care & Shoulder Mobility', '3x/week', '15 mins'],
        ['Agility & Speed', '2x/week', '25 mins'],
      ]),
      sec('Games', '🏆', [
        ['League Games', 'Weekly', '2 hours'],
        ['Tournaments', 'Seasonal', '1 weekend'],
        ['Watch Professional Games', 'Monthly', '3 hours'],
      ]),
    ],
  },

  volleyball: {
    category: 'sports',
    keywords: ['volleyball', 'beach volleyball'],
    plan: [
      sec('Skills Training', '🏐', [
        ['Team Practice', '2-3x/week', '90 mins'],
        ['Serving & Passing Drills', '4x/week', '20 mins'],
        ['Setting & Hitting Practice', '2x/week', '30 mins'],
      ]),
      sec('Fitness', '💪', [
        ['Jump Training', '2x/week', '25 mins'],
        ['Core & Shoulder Strength', '2x/week', '25 mins'],
      ]),
      sec('Games', '🏆', [
        ['League Matches', 'Weekly', '2 hours'],
        ['Tournaments', 'Seasonal', '1 day'],
      ]),
    ],
  },

  equestrian: {
    category: 'sports',
    keywords: ['equestrian', 'horse', 'horseback', 'pony', 'jockey', 'horse riding', 'show jumping'],
    plan: [
      sec('Riding Skills', '🐎', [
        ['Riding Lessons', 'Weekly', '60 mins'],
        ['Stable Care & Grooming', 'Weekly', '60 mins'],
        ['Horse Safety & Handling', 'Monthly', '45 mins'],
      ]),
      sec('Rider Fitness', '💪', [
        ['Core & Balance Training', '2x/week', '25 mins'],
        ['Leg Strength & Flexibility', '2x/week', '20 mins'],
      ]),
      sec('Shows & Learning', '🏆', [
        ['Local Riding Shows', 'Seasonal', '1 day'],
        ['Pony Club / Riding Camp', 'Seasonal', '1 week'],
      ]),
    ],
  },

  ballet: {
    category: 'performingArts',
    keywords: ['ballet', 'ballerina', 'pointe'],
    plan: [
      sec('Technique', '🩰', [
        ['Ballet Classes', '2-3x/week', '75 mins'],
        ['Barre & Center Practice', 'Daily', '20 mins'],
        ['Pointe Preparation (when instructor-cleared)', 'Weekly', '30 mins'],
      ]),
      sec('Strength & Flexibility', '💪', [
        ['Core & Leg Strength', '2x/week', '30 mins'],
        ['Stretching & Flexibility', 'Daily', '15 mins'],
      ]),
      sec('Performance', '🎭', [
        ['Recitals & Showcases', 'Seasonal', '1 day'],
        ['Watch Ballet Performances', 'Monthly', '2 hours'],
        ['Summer Ballet Intensive', 'Seasonal', '1-2 weeks'],
      ]),
    ],
  },
};
