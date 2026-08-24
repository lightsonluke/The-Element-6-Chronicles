// Personal Community — life-sim data. "Heroes have lives between battles."
// Completely separate from every other mode; no progression leaks in or out.

// Exact hero creation order (Green MUST appear before Pink).
export const PC_HERO_ORDER = [
  'yellow','blue','purple','orange','green','pink','grey','turquoise','olive',
  'copper','emerald','pearl','red','lavender','amber','black','magenta','indigo',
  'maroon','crimson','scarlet','white','silver',
];
export const PC_VILLAIN_ORDER = ['corpent','magneto','willow','cable','snodvor','kirsten','volt','temple','nightmare','hazel','whami','controller'];
export const PC_GUARDIAN_ORDER = ['life','mercy','death','evil'];

// gender + personality + category per character id
export const PC_TRAITS = {
  yellow:  { gender:'boy',  personality:'outgoing',  category:'Hero' },
  blue:    { gender:'boy',  personality:'chill',    category:'Hero' },
  purple:  { gender:'girl', personality:'hardworking', category:'Hero' },
  orange:  { gender:'boy',  personality:'oblivious', category:'Hero' },
  green:   { gender:'boy',  personality:'shy',      category:'Hero' },
  pink:    { gender:'girl', personality:'lovergirl', category:'Hero' },
  grey:    { gender:'boy',  personality:'tough',    category:'Hero' },
  turquoise:{ gender:'boy', personality:'popular',  category:'Hero' },
  olive:   { gender:'boy',  personality:'solo',     category:'Hero' },
  copper:  { gender:'boy',  personality:'popular',  category:'Hero' },
  emerald: { gender:'girl', personality:'popular',  category:'Hero' },
  pearl:   { gender:'girl', personality:'popular',  category:'Hero' },
  red:     { gender:'boy',  personality:'selective',category:'Hero' },
  lavender:{ gender:'girl', personality:'easygoing', category:'Hero' },
  amber:   { gender:'girl', personality:'popular',  category:'Hero' },
  black:   { gender:'boy',  personality:'cool',     category:'Hero' },
  magenta: { gender:'girl', personality:'outgoing',  category:'Hero' },
  indigo:  { gender:'girl', personality:'shy',      category:'Hero' },
  maroon:  { gender:'boy',  personality:'feared',   category:'Hero' },
  crimson: { gender:'boy',  personality:'feared',   category:'Hero' },
  scarlet: { gender:'girl', personality:'selective',category:'Hero' },
  white:   { gender:'boy',  personality:'popular',  category:'Hero' },
  silver:  { gender:'boy',  personality:'leader',   category:'Hero' },
  corpent:   { gender:'boy',  personality:'disliked', category:'Villain' },
  magneto:   { gender:'boy',  personality:'disliked', category:'Villain' },
  willow:    { gender:'girl', personality:'popular',  category:'Villain' },
  cable:     { gender:'boy',  personality:'chill',    category:'Villain' },
  snodvor:   { gender:'girl', personality:'anger',    category:'Villain' },
  kirsten:   { gender:'girl', personality:'anger',    category:'Villain' },
  volt:      { gender:'boy',  personality:'popular',  category:'Villain' },
  temple:    { gender:'boy',  personality:'chill',    category:'Villain' },
  nightmare: { gender:'boy',  personality:'chill',    category:'Villain' },
  hazel:     { gender:'girl', personality:'shy',      category:'Villain' },
  whami:     { gender:'boy',  personality:'popular',  category:'Villain' },
  controller:{ gender:'boy',  personality:'solo',     category:'Villain' },
  life:  { gender:'girl', personality:'chill',   category:'Guardian' },
  mercy: { gender:'girl', personality:'outgoing',category:'Guardian' },
  death: { gender:'boy',  personality:'cool',   category:'Guardian' },
  evil:  { gender:'boy',  personality:'hates',   category:'Guardian' },
};

// Personality behavior profiles (0..1-ish weights)
export const PC_PROFILES = {
  outgoing:    { social:0.9, romance:0.5, anger:0.3, shy:0.1, solo:0.2 },
  chill:       { social:0.5, romance:0.3, anger:0.2, shy:0.2, solo:0.4 },
  hardworking: { social:0.4, romance:0.3, anger:0.4, shy:0.2, solo:0.3 },
  oblivious:   { social:0.6, romance:0.2, anger:0.2, shy:0.1, solo:0.3 },
  shy:         { social:0.3, romance:0.4, anger:0.2, shy:0.8, solo:0.5 },
  lovergirl:   { social:0.7, romance:0.9, anger:0.3, shy:0.2, solo:0.2 },
  tough:       { social:0.4, romance:0.3, anger:0.3, shy:0.3, solo:0.4 },
  popular:     { social:0.85,romance:0.5, anger:0.3, shy:0.1, solo:0.2 },
  solo:        { social:0.2, romance:0.2, anger:0.3, shy:0.4, solo:0.9 },
  selective:   { social:0.25,romance:0.3, anger:0.4, shy:0.3, solo:0.5 },
  easygoing:   { social:0.6, romance:0.4, anger:0.15,shy:0.2, solo:0.3 },
  cool:        { social:0.5, romance:0.4, anger:0.2, shy:0.2, solo:0.4 },
  leader:      { social:0.7, romance:0.3, anger:0.3, shy:0.1, solo:0.3 },
  feared:      { social:0.35,romance:0.3, anger:0.5, shy:0.3, solo:0.5 },
  disliked:    { social:0.4, romance:0.3, anger:0.5, shy:0.3, solo:0.5, startNeg:-20 },
  anger:       { social:0.5, romance:0.3, anger:0.8, shy:0.3, solo:0.4 },
  hates:       { social:0.05,romance:0.0, anger:0.7, shy:0.3, solo:0.95, startNeg:-50 },
};

// Personality compatibility matrix — strongly influences friendships & romance.
// Higher = more likely to bond; negative = likely to clash.
export const PC_COMPAT = {
  outgoing:    { outgoing:0.9, chill:0.6, hardworking:0.5, oblivious:0.7, shy:0.4, lovergirl:0.7, tough:0.5, popular:0.9, solo:0.2, selective:0.4, easygoing:0.8, cool:0.6, leader:0.6, feared:0.3, disliked:0.3, anger:0.4, hates:-0.4 },
  chill:       { outgoing:0.6, chill:0.8, hardworking:0.5, oblivious:0.6, shy:0.7, lovergirl:0.5, tough:0.5, popular:0.6, solo:0.6, selective:0.5, easygoing:0.8, cool:0.8, leader:0.6, feared:0.4, disliked:0.4, anger:0.2, hates:-0.3 },
  hardworking: { outgoing:0.5, chill:0.5, hardworking:0.9, oblivious:0.3, shy:0.5, lovergirl:0.3, tough:0.7, popular:0.4, solo:0.4, selective:0.6, easygoing:0.6, cool:0.5, leader:0.7, feared:0.4, disliked:0.2, anger:0.5, hates:-0.4 },
  oblivious:   { outgoing:0.7, chill:0.6, hardworking:0.3, oblivious:0.7, shy:0.5, lovergirl:0.6, tough:0.5, popular:0.7, solo:0.4, selective:0.3, easygoing:0.7, cool:0.5, leader:0.4, feared:0.4, disliked:0.5, anger:0.5, hates:-0.2 },
  shy:         { outgoing:0.4, chill:0.7, hardworking:0.5, oblivious:0.5, shy:0.9, lovergirl:0.5, tough:0.4, popular:0.4, solo:0.7, selective:0.5, easygoing:0.7, cool:0.6, leader:0.5, feared:0.3, disliked:0.2, anger:0.1, hates:-0.3 },
  lovergirl:   { outgoing:0.7, chill:0.5, hardworking:0.3, oblivious:0.6, shy:0.5, lovergirl:0.8, tough:0.6, popular:0.7, solo:0.3, selective:0.5, easygoing:0.7, cool:0.6, leader:0.5, feared:0.4, disliked:0.4, anger:0.4, hates:-0.3 },
  tough:       { outgoing:0.5, chill:0.5, hardworking:0.7, oblivious:0.5, shy:0.4, lovergirl:0.6, tough:0.7, popular:0.6, solo:0.4, selective:0.5, easygoing:0.6, cool:0.6, leader:0.7, feared:0.5, disliked:0.3, anger:0.5, hates:-0.2 },
  popular:     { outgoing:0.9, chill:0.6, hardworking:0.4, oblivious:0.7, shy:0.4, lovergirl:0.7, tough:0.6, popular:0.9, solo:0.3, selective:0.5, easygoing:0.8, cool:0.7, leader:0.7, feared:0.4, disliked:0.4, anger:0.4, hates:-0.3 },
  solo:        { outgoing:0.2, chill:0.6, hardworking:0.4, oblivious:0.4, shy:0.7, lovergirl:0.3, tough:0.4, popular:0.3, solo:0.9, selective:0.6, easygoing:0.5, cool:0.6, leader:0.4, feared:0.5, disliked:0.4, anger:0.4, hates:0.2 },
  selective:   { outgoing:0.4, chill:0.5, hardworking:0.6, oblivious:0.3, shy:0.5, lovergirl:0.5, tough:0.5, popular:0.5, solo:0.6, selective:0.8, easygoing:0.5, cool:0.6, leader:0.5, feared:0.5, disliked:0.4, anger:0.5, hates:-0.2 },
  easygoing:   { outgoing:0.8, chill:0.8, hardworking:0.6, oblivious:0.7, shy:0.7, lovergirl:0.7, tough:0.6, popular:0.8, solo:0.5, selective:0.5, easygoing:0.9, cool:0.7, leader:0.7, feared:0.4, disliked:0.5, anger:0.3, hates:-0.3 },
  cool:        { outgoing:0.6, chill:0.8, hardworking:0.5, oblivious:0.5, shy:0.6, lovergirl:0.6, tough:0.6, popular:0.7, solo:0.6, selective:0.6, easygoing:0.7, cool:0.9, leader:0.6, feared:0.5, disliked:0.5, anger:0.4, hates:-0.2 },
  leader:      { outgoing:0.6, chill:0.6, hardworking:0.7, oblivious:0.4, shy:0.5, lovergirl:0.5, tough:0.7, popular:0.7, solo:0.4, selective:0.5, easygoing:0.7, cool:0.6, leader:0.9, feared:0.5, disliked:0.3, anger:0.4, hates:-0.3 },
  feared:      { outgoing:0.3, chill:0.4, hardworking:0.4, oblivious:0.4, shy:0.3, lovergirl:0.4, tough:0.5, popular:0.4, solo:0.5, selective:0.5, easygoing:0.4, cool:0.5, leader:0.5, feared:0.6, disliked:0.5, anger:0.4, hates:-0.2 },
  disliked:    { outgoing:0.3, chill:0.4, hardworking:0.2, oblivious:0.5, shy:0.2, lovergirl:0.4, tough:0.3, popular:0.4, solo:0.4, selective:0.4, easygoing:0.5, cool:0.5, leader:0.3, feared:0.5, disliked:0.6, anger:0.6, hates:-0.2 },
  anger:       { outgoing:0.4, chill:0.2, hardworking:0.5, oblivious:0.5, shy:0.1, lovergirl:0.4, tough:0.5, popular:0.4, solo:0.4, selective:0.5, easygoing:0.3, cool:0.4, leader:0.4, feared:0.4, disliked:0.6, anger:0.7, hates:-0.3 },
  hates:       { outgoing:-0.4, chill:-0.3, hardworking:-0.4, oblivious:-0.2, shy:-0.3, lovergirl:-0.3, tough:-0.2, popular:-0.3, solo:0.2, selective:-0.2, easygoing:-0.3, cool:-0.2, leader:-0.3, feared:-0.2, disliked:-0.2, anger:-0.3, hates:0.3 },
};

// Sleep schedule per personality (bed hour, wake hour)
export const PC_SLEEP = {
  outgoing:{bed:23,wake:7}, chill:{bed:1,wake:10}, hardworking:{bed:22,wake:5},
  oblivious:{bed:0,wake:9}, shy:{bed:22,wake:8}, lovergirl:{bed:0,wake:8},
  tough:{bed:23,wake:6}, popular:{bed:1,wake:9}, solo:{bed:2,wake:10},
  selective:{bed:23,wake:7}, easygoing:{bed:0,wake:8}, cool:{bed:1,wake:9},
  leader:{bed:22,wake:6}, feared:{bed:23,wake:6}, disliked:{bed:1,wake:10},
  anger:{bed:0,wake:9}, hates:{bed:3,wake:11},
};

export function isSleeping(hour, personality) {
  const s = PC_SLEEP[personality] || PC_SLEEP.chill;
  const bed = s.bed, wake = s.wake;
  if (bed > wake) return hour >= bed || hour < wake;
  if (bed < wake) return hour >= bed && hour < wake;
  return false;
}

export const PC_LIKES = {
  outgoing:'parties, sports, meeting people', chill:'beaches, parks, quiet music',
  hardworking:'training, studying, tasks', oblivious:'snacks, wandering, surprises',
  shy:'gardening, books, small groups', lovergirl:'romance, flowers, dates',
  tough:'protecting others, weightlifting', popular:'events, trends, groups',
  solo:'solitude, quiet places, reading', selective:'close friends, privacy, training',
  easygoing:'cooperation, calm, rules', cool:'style, composure, music',
  leader:'organizing, helping, planning', feared:'respect, space, close allies',
  disliked:'control, schemes, being right', anger:'winning, alone time, venting',
  hates:'nothing — he dislikes everything',
};
export const PC_DISLIKES = {
  outgoing:'being alone, silence', chill:'arguments, crowds, rushing',
  hardworking:'laziness, interruptions', oblivious:'confusing hints, rules',
  shy:'big crowds, strangers, spotlight', lovergirl:'rejection, sadness',
  tough:'bullies, danger to friends', popular:'being ignored, drama',
  solo:'crowds, noise, forced socializing', selective:'strangers, small talk',
  easygoing:'conflict, chaos', cool:'desperation, attention-seeking',
  leader:'unfinished problems, chaos', feared:'disrespect, betrayal',
  disliked:'kindness, teamwork', anger:'losing, insults, interruptions',
  hates:'everyone, invitations, kindness',
};

// ── MASSIVE DIALOGUE LIBRARY ──
// Organized by category × personality + context (location/time/weather/holiday).
// Selection combines a personality line + optional context line for combinatorial variety.

const PERS = ['outgoing','chill','hardworking','oblivious','shy','lovergirl','tough','popular','solo','selective','easygoing','cool','leader','feared','disliked','anger','hates'];

export const PC_DIALOGUE = {
  // Idle personality lines (walking alone)
  idle: {
    outgoing:['Time to find some people!','I wonder who\'s around.','Let\'s make today exciting!','Bored already—let\'s go!'],
    chill:['Nice day...','Just gonna take it easy.','Mm, peaceful.','Where to next...'],
    hardworking:['No time to waste.','Gotta stay productive.','Focus.','Another task done, on to the next.'],
    oblivious:['Ooh what\'s that?','Wait, where am I?','Is it snack time?','Hehe, this is fun!'],
    shy:['...maybe I\'ll just watch.','I hope no one talks to me...','Quiet is nice.','I\'ll stay over here.'],
    lovergirl:['Sigh... I hope I see someone special today.','Love is in the air!','Wonder if anyone\'s thinking of me~','I feel pretty today.'],
    tough:['Stay alert.','Nothing gets past me.','I\'ll protect this place.','Keep moving.'],
    popular:['Everyone\'s gonna love today!','Where\'s the party?','I know everyone will be there!','Let\'s make it happen!'],
    solo:['...alone is good.','Don\'t need anyone.','Quiet.','I\'ll go where it\'s empty.'],
    selective:['Hmm.','Maybe.','Not sure I care.','Whatever.'],
    easygoing:['Whatever happens, happens!','Sure is a nice day!','Let\'s see where this goes!','No worries!'],
    cool:['Cool.','Whatever.','No big deal.','Just vibing.'],
    leader:['Time to check on everyone.','What needs doing today?','I\'ll keep things organized.','Community comes first.'],
    feared:['...','Stay back.','Don\'t bother me.','I\'ll be watching.'],
    disliked:['Tch.','These people.','Hmph.','Whatever.'],
    anger:['Tch.','Annoying.','Whatever.','Don\'t test me.'],
    hates:['...','Leave me alone.','No one worth talking to.','Silence is better.'],
  },

  // Casual conversation starters (per starter personality)
  casual: {
    outgoing:['Hey! Great to see you!','Wanna hang out today?','What\'s the plan? I\'m in!','How\'s your day going?','Let\'s do something fun!'],
    chill:['Hey. How\'s it going?','Just passing by—sup?','Taking it easy?','Good to see you.'],
    hardworking:['How\'s the training going?','Staying productive I hope?','No time to waste—what\'s up?','Let\'s keep at it.'],
    oblivious:['Oh! Hi there!','Wait—when did you get here?','Is it lunch yet?','Did I miss something fun?'],
    shy:['Oh... hi.','Um, hello.','I-I guess I can talk a bit.','H-hi there.'],
    lovergirl:['Hi sweetie! You look great today~','Thinking about you!','Want to spend time together?','You always make me smile~'],
    tough:['Yo. You good?','Stay safe out there.','Need anything?','I\'ve got your back.'],
    popular:['Heyyy! So glad you\'re here!','What\'s up? Missed you!','This is gonna be great!','Everyone\'s been asking about you!'],
    solo:['...oh. Hi.','Mm. You.','...hey.','...you\'re here.'],
    selective:['...','What is it?','Make it quick.','...you again.'],
    easygoing:['Hey! How are you?','Whatever you\'re up to, sounds good!','Nice seeing you!','How\'s it going?'],
    cool:['Hey. Cool seeing you.','Sup.','No big deal, just saying hi.','You\'re around.'],
    leader:['How can I help today?','How\'s everything with you?','Community\'s looking good—thanks for being part of it.','What can we do together?'],
    feared:['...you.','Speak.','...what.','Don\'t waste my time.'],
    disliked:['What do you want?','Hmph. You.','...what is it?','Make it quick.'],
    anger:['...what?','Ugh, you.','What do you want now?','Make it fast.'],
    hates:['Go away.','No.','Stop talking to me.','I don\'t care.'],
  },

  // Friendly (deeper friendship)
  friendly: {
    outgoing:['Haha, remember that time? Classic!','We should totally hang more!','You\'re the best, you know that?','Let\'s make more memories together!'],
    chill:['Good having you around, friend.','We go way back, huh?','Always nice talking with you.','You\'re alright. I mean that.'],
    hardworking:['I appreciate your dedication. Let\'s keep pushing.','You\'re reliable. That matters.','We make a good team.','Proud of how far you\'ve come.'],
    oblivious:['Hehe, you\'re fun!','Let\'s do something silly again!','I like hanging with you!','You never get bored of me, right?'],
    shy:['I... I\'m glad we\'re friends.','You\'re one of the few I feel safe around.','Thank you for being patient with me.','I... I really value you.'],
    lovergirl:['You\'re such a dear friend!','I adore spending time with you~','You always know how to make me smile.','We have the best times together!'],
    tough:['I\'ve got your back, always.','You can count on me, friend.','Nobody messes with you on my watch.','We\'ve been through a lot.'],
    popular:['You\'re my favorite person to be around!','Everyone loves you—and I get why!','We\'re the dream team!','Let\'s keep this friendship going strong!'],
    solo:['...you\'re okay. For company.','...I don\'t mind you being around.','...you\'re one of the few I tolerate.','...thanks. For being here.'],
    selective:['You\'re one of the few I trust.','Glad we\'re close.','I don\'t say this often—I value you.','You\'re alright. Truly.'],
    easygoing:['You\'re such a good friend!','I always feel better around you!','We should do this more often!','You make everything nicer!'],
    cool:['You\'re solid. Respect.','Good to have you around.','You\'re one of the good ones.','We\'re cool. Always.'],
    leader:['I\'m grateful for your friendship.','You make this community better.','Thank you for standing with me.','We\'ll keep building something great.'],
    feared:['...you\'re tolerable.','...you\'ve earned some respect.','...I don\'t mind you.','...stay close. You\'re useful.'],
    disliked:['Hmph. You\'re... acceptable.','Don\'t make me regret trusting you.','You\'re less annoying than most.','...fine. You\'re okay.'],
    anger:['...you\'re not terrible.','Hmph. You\'re alright I guess.','Don\'t make me regret this.','...whatever. You\'re fine.'],
    hates:['...you\'re the least awful one.','...I don\'t hate you entirely.','...you\'re almost tolerable.','...don\'t push it.'],
  },

  // Competitive (trash talk, challenges)
  competitive: {
    outgoing:['I could beat you in any sport!','Let\'s settle this on the field!','You think you\'re faster? Prove it!','I\'ve been training—watch out!'],
    chill:['Wanna train a bit? No pressure.','I could probably take you... casually.','Let\'s see who\'s got more stamina.','Low-key challenge accepted.'],
    hardworking:['Your form needs work. Train with me.','I\'ve logged more hours than you.','Let\'s compare notes—and records.','Discipline beats talent. Watch.'],
    oblivious:['Race you! Wait, where\'s the finish?','I bet I can eat more than you!','Who\'s stronger? Let\'s find out!','I\'m definitely gonna win... at something!'],
    shy:['M-maybe we could... train together?','I-I\'ve actually gotten stronger...','Um, if you want to spar...','I-I won\'t lose easily.'],
    lovergirl:['If you win, you get a reward~','Let\'s make this interesting!','Loser buys dinner!','I\'m tougher than I look~'],
    tough:['I\'ll show you what training gets you.','Bring it. I won\'t hold back.','You ready? Really ready?','Let\'s see what you\'ve got.'],
    popular:['Everyone\'s watching—don\'t disappoint me!','I\'m the champ around here!','Let\'s give them a show!','I\'ve got a reputation to keep!'],
    solo:['...I train alone. But I\'ll prove it.','...you wouldn\'t last with my routine.','...fine. One match.','...don\'t expect me to go easy.'],
    selective:['You think you\'re better? Show me.','I\'ve been training. Quietly.','Let\'s settle this.','I won\'t lose to you.'],
    easygoing:['Let\'s keep it friendly, okay?','Fun match, no hard feelings!','I\'ll try my best!','Whoever wins, we both get ice cream!'],
    cool:['Don\'t embarrass yourself.','This\'ll be quick.','You\'re going down. Casually.','Cool. You\'re losing.'],
    leader:['I lead by example—watch closely.','Let\'s push each other to improve.','A good challenge builds character.','Show me your best.'],
    feared:['You don\'t want to challenge me.','...I\'d break you.','Don\'t push it.','...you\'d regret it.'],
    disliked:['I\'ll enjoy beating you.','You\'re going down.','This\'ll be satisfying.','Don\'t cry when you lose.'],
    anger:['Bring it! I\'ve been waiting!','I\'ll crush you!','Finally, a real fight!','You\'re going down!'],
    hates:['...pathetic challenge.','...you\'d lose.','...not worth my time.','...no.'],
  },

  // Romantic — Interested (light compliments, hints, shyness)
  interested: [
    'You look... nice today. I mean—just noticed!','I always feel better when you\'re around.','You have a really great smile, you know?','I was hoping I\'d run into you today.','There\'s something about you I can\'t quite place...','You\'re different from everyone else. In a good way.','I keep thinking about our last conversation.','You smell really nice... is that weird to say?','I get a little nervous around you, honestly.','You\'re more fun to talk to than I expected.','I saved a seat next to me—just in case.','I wonder if you think about me too, sometimes.','You\'ve been on my mind lately.','You always know what to say. I like that.',
  ],
  // Romantic — Crushing (more obvious flirting, trying to impress)
  crushing: [
    'I planned my whole day hoping I\'d see you.','Want to—maybe—go somewhere? Just us?','I think about you more than I should.','You\'re honestly the most interesting person here.','I get butterflies when you walk by.','I\'d drop everything if you asked me to hang out.','You make everyone else seem boring.','I\'ve been training harder just to impress you...','I can\'t stop staring. Sorry. Not sorry.','Want to watch the sunset together? I\'ve been thinking about it.','Every song reminds me of you lately.','I drew you something. I mean—it\'s nothing!','I saved the best seat for you. Always do.','I rehearsed what to say and now I forgot it all.',
  ],
  // Romantic — Dating (affectionate, planning together)
  dating: [
    'How was your day, love? I missed you.','Let\'s grab dinner together—my treat.','I was thinking about our future today.','Walking with you is my favorite part of the day.','You make everywhere feel like home.','Let\'s watch the sunset again—like our first time.','I made plans for us. I think you\'ll love them.','Just being near you makes everything better.','I love how we can talk for hours about nothing.','You\'re my favorite person in the whole city.','I saved you the last bite. Always.','Let\'s stay up late together tonight.','I told everyone about us. I\'m proud to be yours.','Wherever you go, I want to be there too.',
  ],

  // Awkward moments
  awkward: [
    'Oh! I—sorry, I didn\'t see you there!','Wait, were you talking to me? My bad!','I, uh, totally forgot what I was saying.','Did I just walk into you? Sorry!','I\'ve been waving at you for like a minute. Awkward.','I thought you were someone else—this is embarrassing.','I rehearsed this conversation and it\'s going terribly.','I said your name wrong last time. I\'m so sorry.','I bumped into a door on my way here. Don\'t ask.','My stomach just growled. Loudly. Pretend you didn\'t hear.','I think I have something on my face, don\'t I?','I waved back at someone who wasn\'t waving at me. Classic.',
  ],

  // Arguments (personality-driven disagreements)
  argument: [
    'That\'s not how I remember it at all.','You\'re not listening to me.','Why do you always have to be right?','I disagree. Strongly.','That\'s a terrible idea and I won\'t pretend otherwise.','You\'re being unreasonable right now.','I can\'t believe you\'d say that.','This is exactly why we clash.','You never consider my side.','That\'s the last straw.','I\'m done discussing this.','You\'re impossible sometimes.',
  ],
  // Reconciliation
  reconciliation: [
    'Hey... I\'m sorry about earlier.','I shouldn\'t have said that. Can we move on?','I was out of line. Forgive me?','Let\'s not let this come between us.','I\'ve been thinking—it wasn\'t worth the fight.','I\'d rather be friends than be right.','Sorry. I mean it. Let\'s start over.','I don\'t even remember why we argued. Truce?','You matter more to me than being right.','Let\'s just put this behind us.',
  ],

  // Location-specific lines
  location: {
    cafe:['This coffee hits the spot.','I could sit here all day.','Best café in town, honestly.','Want to grab a table?','The smell in here is amazing.'],
    grocery:['Stocking up today?','I keep buying snacks I don\'t need.','The produce is fresh today.','Grabbing essentials as usual.','This place is busier than I thought.'],
    clothing:['Check out this outfit!','I could spend all my coins here.','Does this color suit me?','New season, new look.','I\'m just browsing... mostly.'],
    school:['Learning never stops, huh?','I always liked this place.','Study buddies?','The chalkboards still smell the same.','Education is important—even for heroes.'],
    library:['Shh—just kidding. But also, shh.','I could read here forever.','Found a good book?','Silence and books. Perfect.','The quiet here is healing.'],
    hospital:['Hope everyone\'s okay in there.','Be careful out there—don\'t end up here.','Good people work here.','Quick checkup, nothing serious.','Take care of yourself.'],
    plaza:['This is where everyone gathers!','The plaza\'s alive today!','Perfect spot to people-watch.','Community heart right here.','Something\'s always happening here.'],
    center:['Community meeting soon?','This place brings us together.','I always feel welcome here.','Good things happen at the center.','Let\'s organize something here.'],
    gym:['No pain no gain!','Feel the burn!','Let\'s spot each other.','Training never stops.','This is where champions are made.'],
    field:['Game on!','Who\'s up for a match?','I love the energy out here.','Run a few laps with me?','Perfect weather for sports.'],
    theater:['What\'s playing?','Movie night!','I\'ll get the popcorn.','Best seat in the house.','I love the smell of this place.'],
    restaurant:['Table for two?','I\'m starving—let\'s eat.','Best food in town.','Let me treat you.','Everything on the menu looks good.'],
    park:['Beautiful day for a walk.','The trees are gorgeous right now.','Let\'s sit on that bench.','Fresh air does wonders.','I could nap under that tree.'],
    playground:['Careful on the swings!','Kids have the right idea.','I haven\'t been on a slide in years.','This place is pure joy.','Let\'s just... play.'],
    police:['Stay safe, citizen.','Nothing but order today.','Reporting anything?','We keep the peace here.','Good to see patrols out.'],
    forest:['It\'s so peaceful out here.','I love the quiet of the woods.','Nature is the best therapy.','Listen to the birds.','I come here to think.'],
    beach:['The waves are perfect today.','Sand between my toes... bliss.','Let\'s watch the water.','I could live here.','Salt air is the best air.'],
    festival:['Something\'s always happening here!','Let\'s join the fun!','Best vibes in town.','I love a good festival.','Everyone\'s here tonight!'],
    villain_hall:['...cozy enough, I guess.','Not as bad as people say.','I keep to myself here.','It\'s quiet. I like that.','Don\'t judge a hall by its cover.'],
    g_life:['Life\'s garden—so full of growth.','The flowers here respond to me.','Peace among the petals.','I tend to all living things.','This garden is my heart.'],
    g_mercy:['Mercy\'s sanctuary—feel the calm.','Compassion lives here.','I offer peace to all who seek it.','The light here heals.','Welcome, friend.'],
    g_death:['Death\'s quiet—not fearsome, just still.','All things find rest here.','I watch over the passage.','Quiet is not the same as gone.','I am not what you fear.'],
    g_evil:['...evil\'s isle. Mine alone.','Even here, there is... something.','Don\'t linger.','I keep my distance. By choice.','This is my domain.'],
  },

  // Time-of-day lines
  time: {
    morning:['Morning! Ready for the day?','I had a good breakfast today.','Early bird gets the worm!','Sunrise really is beautiful.','Fresh start today!'],
    afternoon:['What a busy afternoon!','Time for a snack break?','The sun\'s perfect right now.','Got a lot done today!','Afternoon\'s my favorite.'],
    evening:['Evening already? Where\'d the day go?','Dinner soon—I\'m starving.','The sunset\'s gorgeous tonight.','Winding down nicely.','Evenings are for relaxing.'],
    night:['Getting late... I should head home.','The stars are out tonight.','I\'m so tired.','Night\'s peaceful, isn\'t it?','Almost bedtime.'],
  },

  // Weather lines
  weather: {
    sunny:['Perfect sunny day!','Can\'t waste weather like this!','Sunshine makes everything better.','I should be outside all day.'],
    cloudy:['Cloudy, but still nice.','Diffused light is calmer.','Kinda cozy with these clouds.'],
    rain:['Love the sound of rain.','Rain\'s nice if you\'re indoors.','Perfect weather for coffee.','I should\'ve brought an umbrella.'],
    snow:['Snow! It\'s so pretty.','Let\'s catch snowflakes!','Everything\'s so quiet in the snow.'],
    wind:['Wind\'s really picking up!','My hair\'s a mess now.','The wind feels nice though.'],
    fog:['Can barely see in this fog.','Spooky... but kind of cool.','Walk carefully out there.'],
    storm:['Storm\'s rolling in! Stay safe.','I love a good storm—from inside.','This thunder is something.'],
    heat:['It is SO hot today.','I\'m melting.','Ice cream weather for sure.'],
  },

  // Holiday-specific lines
  holiday: {
    newyear:['Happy New Year! Let\'s make it count!','New year, new adventures!','Cheers to a fresh start!','New Year\'s resolutions—anyone keeping theirs?'],
    valentine:['Happy Valentine\'s Day~','You\'re my Valentine, you know.','Love is everywhere today!','Valentine\'s always makes me hopeful.'],
    easter:['Happy Easter! Found any eggs?','Spring is here at last!','Easter egg hunts never get old.','Pastels everywhere today!'],
    halloween:['Happy Halloween! Spooky!','Nice costume!','Trick or treat!','This is my favorite holiday!'],
    thanksgiving:['Happy Thanksgiving! So much to be grateful for.','Grateful for friends like you.','Let\'s eat way too much!','Thanksgiving is about being together.'],
    christmas:['Merry Christmas!','The decorations are magical.','Best time of the year!','Christmas cheer all around!'],
    hanukkah:['Happy Hanukkah! Light the candles!','Eight nights of light!','Hanukkah sameach!','Festival of lights—beautiful.'],
    birthday:['Happy Birthday!! Make a wish!','It\'s your special day!','Cake time!','Everyone\'s here for you today!'],
  },

  // Idle mutterings (walking alone, occasional)
  mutter: [
    'I\'m getting hungry.','I wonder where everyone is.','I should train today.','It\'s beautiful outside.','I haven\'t seen some people today.','I\'m a little tired.','I\'m going shopping later.','Where should I go next?','Nice weather today.','I could use some coffee.','Maybe I\'ll visit the park.','I wonder what\'s happening at the plaza.',
  ],

  // Guardian wisdom lines
  guardian: [
    'The world finds balance, even when we cannot see it.','I have watched over this city for a long, long time.','Protect what matters. The rest will follow.','Every life is a thread in a greater tapestry.','Patience is the first lesson of the old.','Do not fear endings. They are also beginnings.','I remember when these streets were fields.','Encourage the young. They carry the future.','Balance is not stillness—it is motion held in harmony.','Responsibility is a privilege, not a burden.','Even darkness serves a purpose in the whole.','I am always watching. Always.','The city grows. That is enough.','Wisdom is knowing how little you know.',
  ],

  // Villain normal-life lines (they live normal lives mostly)
  villainLife: [
    'Just picking up groceries. Normal stuff.','Even I need a coffee break.','Day off. Don\'t tell anyone.','I\'m just here to relax.','Don\'t make it weird—I live here too.','Reading a good book. Yes, I read.','Evening stroll. Sue me.','I\'m people-watching. It\'s a hobby.','Sometimes I just want a quiet meal.','Not everything is a scheme, you know.','I\'m allowed to enjoy the beach.','Even I watch movies sometimes.',
  ],

  // Friend invitations
  invitation: {
    ask: ['Want to grab lunch?','Let\'s go train together!','Want to watch a movie?','Let\'s visit the beach!','Care to take a walk?','Want to grab coffee?','Let\'s hit the park!','Want to go shopping?','Let\'s watch the sunset!','Care to visit my place?','Let\'s train at the gym!','Want to read together at the library?'],
    accept: ['Sure! Let\'s go!','I\'d love to!','Count me in!','Absolutely!','Yes! Great idea.','Sounds perfect.','I\'m in!','Let\'s do it!'],
    decline: ['Maybe another time.','I\'ll pass, thanks.','Not today, sorry.','Mm, no thanks.','Some other time?','I\'m not really up for it.'],
    busy: ['I\'m in the middle of something—later?','Can\'t right now, sorry!','Maybe after this?','Busy at the moment!','Rain check?'],
  },

  // Group conversation lines
  group: [
    'So great to have everyone here!','This is a good crew.','Who\'s got the next round?','I love group hangouts.','We should do this more often!','Everyone\'s in a good mood—love it.','So what\'s everyone been up to?','This is the best group.','Let\'s make this a regular thing!','I\'m glad we all get along.',
  ],
};

// ── Reputation definitions ──
export const PC_REPUTATIONS = [
  { id:'friendly', label:'Friendly', desc:'Known for warmth and kindness.' },
  { id:'helpful', label:'Helpful', desc:'Always lending a hand.' },
  { id:'funny', label:'Funny', desc:'Makes everyone laugh.' },
  { id:'competitive', label:'Competitive', desc:'Always up for a challenge.' },
  { id:'quiet', label:'Quiet', desc:'Keeps to themselves mostly.' },
  { id:'popular', label:'Popular', desc:'Loved by many.' },
  { id:'athletic', label:'Athletic', desc:'Trains and plays constantly.' },
  { id:'smart', label:'Smart', desc:'Reads and studies often.' },
  { id:'kind', label:'Kind', desc:'Genuinely good-hearted.' },
  { id:'mischievous', label:'Mischievous', desc:'Stirs up trouble.' },
  { id:'serious', label:'Serious', desc:'Focused and composed.' },
  { id:'brave', label:'Brave', desc:'Protects others.' },
  { id:'lazy', label:'Lazy', desc:'Relaxes a lot.' },
  { id:'energetic', label:'Energetic', desc:'Always on the move.' },
  { id:'leader', label:'Leader', desc:'Organizes the community.' },
  { id:'reliable', label:'Reliable', desc:'Can always be counted on.' },
];

// ── Achievements ──
export const PC_ACHIEVEMENTS = [
  { id:'first_bff', name:'First Best Friend', emoji:'🤝', desc:'Reached Best Friends with someone.' },
  { id:'first_date', name:'First Date', emoji:'💕', desc:'Started dating someone.' },
  { id:'ten_friends', name:'10 Friends', emoji:'👥', desc:'Became Friends with 10 characters.' },
  { id:'movie_lover', name:'Movie Lover', emoji:'🎬', desc:'Watched 5 movies at the theater.' },
  { id:'birthday_host', name:'Birthday Host', emoji:'🎂', desc:'Celebrated your birthday.' },
  { id:'community_favorite', name:'Community Favorite', emoji:'⭐', desc:'Reached Friends with 15 characters.' },
  { id:'early_bird', name:'Early Bird', emoji:'🌅', desc:'Visited the plaza at dawn.' },
  { id:'night_owl', name:'Night Owl', emoji:'🦉', desc:'Stayed out past midnight.' },
  { id:'fitness_fanatic', name:'Fitness Fanatic', emoji:'💪', desc:'Trained at the gym 10 times.' },
  { id:'social_butterfly', name:'Social Butterfly', emoji:'🦋', desc:'Had 50 conversations.' },
  { id:'matchmaker', name:'Matchmaker', emoji:'💘', desc:'Saw a couple start dating.' },
  { id:'peacemaker', name:'Peacemaker', emoji:'🕊️', desc:'Reconciled after an argument.' },
];

// Moods
export const PC_MOODS = ['Happy','Calm','Excited','Nervous','Embarrassed','Sad','Angry','Relaxed','Tired','Motivated'];

// Community buildings — placed in a single front row (coords computed in component)
export const PC_GROUND_BUILDINGS = [
  { id:'cafe', name:'Sunrise Café', emoji:'☕', type:'cafe' },
  { id:'grocery', name:'Market Basket', emoji:'🛒', type:'grocery' },
  { id:'clothing', name:'Thread Shop', emoji:'👕', type:'clothing' },
  { id:'school', name:'Community School', emoji:'🏫', type:'school' },
  { id:'library', name:'Library', emoji:'📚', type:'library' },
  { id:'hospital', name:'Clinic', emoji:'🏥', type:'hospital' },
  { id:'plaza', name:'Community Plaza', emoji:'⛲', type:'plaza' },
  { id:'center', name:'Community Center', emoji:'🏛️', type:'center' },
  { id:'gym', name:'Power Gym', emoji:'🏋️', type:'gym' },
  { id:'field', name:'Sports Field', emoji:'⚽', type:'field' },
  { id:'theater', name:'Movie Theater', emoji:'🎬', type:'theater' },
  { id:'restaurant', name:'Lantern Restaurant', emoji:'🍽️', type:'restaurant' },
  { id:'park', name:'Greenleaf Park', emoji:'🌳', type:'park' },
  { id:'playground', name:'Playground', emoji:'🛝', type:'playground' },
  { id:'police', name:'Police Station', emoji:'🚓', type:'police' },
  { id:'forest', name:'Whispering Forest', emoji:'🌲', type:'forest' },
  { id:'beach', name:'Coral Beach', emoji:'🏖️', type:'beach' },
  { id:'festival', name:'Festival Grounds', emoji:'🎪', type:'festival' },
  { id:'villain_hall', name:'Villain Hall', emoji:'🏚️', type:'villain' },
  { id:'rooftop', name:'Rooftops', emoji:'🏙️', type:'rooftop' },
  { id:'bridge', name:'City Bridge', emoji:'🌉', type:'bridge' },
];

// Guardian district (floating, above the town in the clouds) — single row
export const PC_GUARDIAN_BUILDINGS = [
  { id:'g_life', name:'Life\'s Garden', emoji:'🌸', type:'guardian' },
  { id:'g_mercy', name:'Mercy\'s Sanctuary', emoji:'✨', type:'guardian' },
  { id:'g_death', name:'Death\'s Quiet', emoji:'🌑', type:'guardian' },
  { id:'g_evil', name:'Evil\'s Isle', emoji:'💜', type:'guardian_evil' },
];

export const PC_JOBS = {
  outgoing:['Athlete','Coach','Reporter'], chill:['Café Worker','Librarian','Gardener'],
  hardworking:['Teacher','Doctor','Coach'], oblivious:['Delivery Worker','Shopkeeper','Artist'],
  shy:['Gardener','Librarian','Artist'], lovergirl:['Event Planner','Florist','Reporter'],
  tough:['Police Officer','Construction Worker','Coach'], popular:['Athlete','Musician','Reporter'],
  solo:['Artist','Gardener','Delivery Worker'], selective:['Athlete','Construction Worker'],
  easygoing:['Shopkeeper','Nurse','Teacher'], cool:['Musician','Artist','Chef'],
  leader:['Teacher','Police Officer','Doctor'], feared:['Construction Worker','Police Officer'],
  disliked:['Construction Worker','Delivery Worker'], anger:['Construction Worker','Chef'],
  hates:['None','None','None'],
};

export const PC_HOME_STYLES = {
  outgoing:'bright energetic home with sports gear', chill:'peaceful water-themed cozy home',
  hardworking:'organized training & work space', oblivious:'messy, strangely arranged home',
  shy:'quiet natural private cottage', lovergirl:'romantic flowers and comfy seating',
  tough:'strong practical furniture', popular:'open social home for visitors',
  solo:'small minimalist private home', selective:'private training den',
  easygoing:'neat friendly home', cool:'stylish dark modern home',
  leader:'organized leader-style home', feared:'sturdy imposing home',
  disliked:'dim cluttered hideout', anger:'sturdy home with a punching post',
  hates:'isolated dark floating island',
};

export const PC_SEASONS = ['Spring','Summer','Autumn','Winter'];

// Month names for birthday formatting ("November 29" not "Month 11 Day 29")
export const PC_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function formatBirthday(b) {
  if (!b) return '';
  return `${PC_MONTHS[b.m - 1]} ${b.d}`;
}

// ── Furniture shop (decorates a resident's home) ──
export const PC_FURNITURE = [
  { id:'bed', name:'Cozy Bed', emoji:'🛏️', price:40 },
  { id:'sofa', name:'Plush Sofa', emoji:'🛋️', price:70 },
  { id:'tv', name:'TV Set', emoji:'📺', price:90 },
  { id:'plant', name:'Potted Plant', emoji:'🪴', price:25 },
  { id:'lamp', name:'Floor Lamp', emoji:'💡', price:30 },
  { id:'rug', name:'Soft Rug', emoji:'🟫', price:50 },
  { id:'desk', name:'Work Desk', emoji:'🗄️', price:65 },
  { id:'bookshelf', name:'Bookshelf', emoji:'📚', price:80 },
  { id:'fridge', name:'Fridge', emoji:'❄️', price:110 },
  { id:'painting', name:'Painting', emoji:'🖼️', price:60 },
];

// ── Clothing shop (changes a resident's accent color) ──
export const PC_CLOTHING = [
  { id:'hat_red', name:'Red Cap', emoji:'🧢', price:45, accent:'#ff3333' },
  { id:'hat_blue', name:'Blue Beanie', emoji:'🧢', price:45, accent:'#3388ff' },
  { id:'dress', name:'Summer Dress', emoji:'👗', price:70, accent:'#ff66aa' },
  { id:'jacket', name:'Leather Jacket', emoji:'🧥', price:85, accent:'#8a5a2a' },
  { id:'shoes', name:'Sneakers', emoji:'👟', price:55, accent:'#eeeeee' },
  { id:'scarf', name:'Winter Scarf', emoji:'🧣', price:40, accent:'#66ccff' },
  { id:'glasses', name:'Sunglasses', emoji:'🕶️', price:60, accent:'#222222' },
  { id:'crown', name:'Golden Crown', emoji:'👑', price:150, accent:'#FFD700' },
];

// ── Holiday events & decorations (real holidays only) ──
export const PC_HOLIDAYS = {
  newyear:     { name:'New Year', emoji:'🎆', decor:'🎆', color:'#FFD700' },
  valentine:   { name:"Valentine's Day", emoji:'💝', decor:'💕', color:'#ff66aa' },
  easter:      { name:'Easter', emoji:'🥚', decor:'🥚', color:'#88ddaa' },
  halloween:   { name:'Halloween', emoji:'🎃', decor:'🎃', color:'#ff8833' },
  thanksgiving:{ name:'Thanksgiving', emoji:'🦃', decor:'🍂', color:'#cc7733' },
  christmas:   { name:'Christmas', emoji:'🎄', decor:'🎄', color:'#33aa44' },
  hanukkah:    { name:'Hanukkah', emoji:'🕯️', decor:'🕎', color:'#4488cc' },
};
export function currentHoliday() {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  if (m === 1 && day <= 3) return 'newyear';
  if (m === 2 && day >= 13 && day <= 15) return 'valentine';
  // Easter 2026 is April 5; approximate window
  if (m === 4 && day >= 3 && day <= 7) return 'easter';
  if (m === 10) return 'halloween';
  if (m === 11 && day >= 24 && day <= 30) return 'thanksgiving';
  if (m === 12 && day <= 27) return 'christmas';
  if (m === 12 && day >= 28) return 'hanukkah';
  return null;
}

// Weather for the community (derived from season + daily random)
export const PC_WEATHER_TYPES = ['sunny','cloudy','rain','snow','wind','fog','storm','heat'];
export const PC_WEATHER_LABELS = {
  sunny:'☀️ Sunny', cloudy:'☁️ Cloudy', rain:'🌧️ Rain', snow:'❄️ Snow',
  wind:'💨 Wind', fog:'🌫️ Fog', storm:'⛈️ Storm', heat:'🔥 Heat',
};
export function weatherForSeason(seasonIdx) {
  const r = Math.random();
  if (seasonIdx === 3) return r < 0.4 ? 'snow' : r < 0.7 ? 'cloudy' : r < 0.9 ? 'wind' : 'sunny';
  if (seasonIdx === 1) return r < 0.4 ? 'heat' : r < 0.7 ? 'sunny' : r < 0.85 ? 'storm' : 'cloudy';
  if (seasonIdx === 0) return r < 0.35 ? 'rain' : r < 0.65 ? 'sunny' : r < 0.85 ? 'cloudy' : 'fog';
  return r < 0.3 ? 'cloudy' : r < 0.55 ? 'sunny' : r < 0.75 ? 'rain' : r < 0.9 ? 'wind' : 'fog';
}

// Time-of-day label from minutes
export function timeOfDayLabel(minutes) {
  const h = (minutes / 60) | 0;
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export const PERS_LIST = PERS;