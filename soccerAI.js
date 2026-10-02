// Reliable soccer controller. The AI prioritizes the actual ball position,
// the correct team goal, interception timing, and a clean kick when in range.
// Difficulty changes prediction/reaction/error; it never changes the physics.

const W = 1280, GROUND_Y = 620, WALL_TOP = 80, GOAL_TOP = 480;
const LEFT_GOAL = 20, RIGHT_GOAL = 1260, BALL_R = 12;
const GRAVITY = .35, AIR_DRAG = .992, GROUND_BOUNCE = .6, GROUND_FRICTION = .85;

const DIFF = {
  newcomer:{react:12,predict:8,error:48,aggression:.55}, beginner:{react:10,predict:12,error:38,aggression:.62},
  easy:{react:8,predict:16,error:30,aggression:.7}, amateur:{react:7,predict:22,error:22,aggression:.78},
  regular:{react:6,predict:28,error:15,aggression:.84}, pro:{react:5,predict:36,error:9,aggression:.9},
  hard:{react:4,predict:45,error:5,aggression:.94}, insane:{react:3,predict:55,error:2,aggression:.98},
  honored:{react:2,predict:70,error:0,aggression:1},
};

function predict(ball, frames) {
  let x=ball.x,y=ball.y,vx=ball.vx,vy=ball.vy;
  for(let i=0;i<frames;i++){
    vy+=GRAVITY; vy=Math.min(vy,15); vx*=AIR_DRAG; vy*=.996; x+=vx; y+=vy;
    if(y+BALL_R>=GROUND_Y){y=GROUND_Y-BALL_R;vy=-vy*GROUND_BOUNCE;vx*=GROUND_FRICTION;if(Math.abs(vy)<1.5)vy=0;}
    if(y<WALL_TOP){y=WALL_TOP;vy=Math.abs(vy)*.3;}
    if(y-BALL_R<480&&y+BALL_R>80){
      if(x-BALL_R<40){x=40+BALL_R;vx=Math.abs(vx)*.6;}
      if(x+BALL_R>1240){x=1240-BALL_R;vx=-Math.abs(vx)*.6;}
    }
  }
  return {x,y,vx,vy};
}

function shotWouldScore(ball, vx, vy, goalX) {
  let x=ball.x,y=ball.y;
  for(let i=0;i<100;i++){
    vy+=GRAVITY; vy=Math.min(vy,15); vx*=AIR_DRAG; vy*=.996; x+=vx; y+=vy;
    if(y+BALL_R>=GROUND_Y){y=GROUND_Y-BALL_R;vy=-vy*GROUND_BOUNCE;vx*=GROUND_FRICTION;}
    if(y<WALL_TOP){y=WALL_TOP;vy=Math.abs(vy)*.3;}
    if(y>GOAL_TOP&&y<GROUND_Y){ if(goalX>640&&x>=RIGHT_GOAL) return true; if(goalX<640&&x<=LEFT_GOAL) return true; }
  }
  return false;
}

function chooseKick(fighter, ball, goalX, opponent, difficulty) {
  const d=DIFF[difficulty]||DIFF.regular;
  const face=goalX>fighter.x?1:-1;
  const power=6.4*(fighter.statPowerMul||1)*(ball.damage||1);
  const options=[
    {type:'normal',vx:face*power+fighter.vx*.45,vy:-Math.max(6,power*.85),score:shotWouldScore(ball,face*power+fighter.vx*.45,-Math.max(6,power*.85),goalX)?100:0},
    {type:'driven',vx:face*power*1.15+fighter.vx*.35,vy:5,score:shotWouldScore(ball,face*power*1.15+fighter.vx*.35,5,goalX)?94:20},
  ];
  if(fighter.powerCooldown<=0) options.push({type:'power',vx:face*24*(fighter.statPowerMul||1)+fighter.vx*.3,vy:-14,score:shotWouldScore(ball,face*24*(fighter.statPowerMul||1)+fighter.vx*.3,-14,goalX)?120:35});
  if(fighter.superMeter>=fighter.maxSuper) options.push({type:'super',vx:face*10+fighter.vx*.2,vy:-16,score:shotWouldScore(ball,face*10+fighter.vx*.2,-16,goalX)?125:55});
  // If an opponent is directly between us and the goal, prefer a high arc.
  if(opponent && Math.abs(opponent.x-ball.x)<100 && ((goalX>ball.x&&opponent.x>ball.x)||(goalX<ball.x&&opponent.x<ball.x))) options.forEach(o=>{if(o.type==='normal'||o.type==='power')o.score+=15;});
  options.sort((a,b)=>b.score-a.score);
  return options[0];
}

export function soccerAI(fighter, ball, opponent, difficultyKey='regular', personality='balanced', gameCtx={}) {
  if(!fighter||!ball) return {left:false,right:false,jump:false,up:false,down:false,sig:false,power:false,superMove:false,heavy:false};
  const d=DIFF[difficultyKey]||DIFF.regular;
  const team=fighter.team===2?2:1;
  const attackGoal=team===1?RIGHT_GOAL:LEFT_GOAL;
  const defendGoal=team===1?LEFT_GOAL:RIGHT_GOAL;
  const out={left:false,right:false,jump:false,up:false,down:false,sig:false,power:false,superMove:false,heavy:false};

  fighter._soccerAiTick=(fighter._soccerAiTick||0)+1;
  if(fighter._soccerAiTick % Math.max(1,d.react)!==0 && fighter.aiAction) return {...fighter.aiAction};

  const dx=ball.x-fighter.x, dy=ball.y-(fighter.y-38), dist=Math.hypot(dx,dy);
  const towardOwn=(team===1&&ball.vx< -2)||(team===2&&ball.vx>2);
  const predicted=predict(ball,d.predict);
  const goalThreat=towardOwn && Math.abs(ball.x-defendGoal)<420;

  // 1. Defend the goal first. Move to where the ball will actually be, not to its current X.
  if(goalThreat){
    let target=predicted.x;
    target=team===1?Math.max(55,Math.min(430,target)):Math.min(1225,Math.max(850,target));
    if(Math.abs(fighter.x-target)>10){ if(fighter.x<target)out.right=true; else out.left=true; }
    fighter.facing=target>fighter.x?1:-1;
    if(predicted.y < fighter.y-48 && fighter.grounded) out.jump=true;
    if(dist<66){ const kick=chooseKick(fighter,ball,attackGoal,opponent,difficultyKey); fighter.facing=attackGoal>fighter.x?1:-1; if(kick.type==='super')out.superMove=true; else if(kick.type==='power')out.power=true; else out.sig=true; }
    fighter.aiAction=out; return out;
  }

  // 2. Get onto the scoring side of the ball. Never reverse team identity based on position.
  const correctSide=attackGoal>ball.x?fighter.x<ball.x:fighter.x>ball.x;
  const sideTarget=attackGoal>ball.x?ball.x-42:ball.x+42;
  if(!correctSide && Math.abs(fighter.x-sideTarget)>12){
    if(fighter.x<sideTarget)out.right=true; else out.left=true;
    if(Math.abs(dx)<85 && ball.y < fighter.y-45 && fighter.grounded) out.jump=true;
    fighter.facing=attackGoal>fighter.x?1:-1;
    fighter.aiAction=out; return out;
  }

  // 3. Intercept the predicted ball landing/meeting point.
  const targetX = Math.abs(ball.vx)>1.5 ? predicted.x : ball.x;
  if(dist>54){
    if(fighter.x<targetX-9)out.right=true; else if(fighter.x>targetX+9)out.left=true;
    if(ball.y < fighter.y-42 && fighter.grounded) out.jump=true;
    if(ball.y > fighter.y+40 && !fighter.grounded) out.down=true;
  }

  // 4. If we are actually in contact range, kick immediately. This removes the
  // old behavior where the bot could stand beside the ball waiting for a random roll.
  if(dist<68 && Math.abs(dy)<90){
    const kick=chooseKick(fighter,ball,attackGoal,opponent,difficultyKey);
    fighter.facing=attackGoal>fighter.x?1:-1;
    if(Math.random()>d.aggression) out.sig=true;
    else if(kick.type==='super') out.superMove=true;
    else if(kick.type==='power') out.power=true;
    else { out.sig=true; if(ball.y>fighter.y+18)out.down=true; }
  }

  // 5. Chase high balls instead of walking underneath them forever.
  if(ball.y < fighter.y-70 && fighter.grounded && Math.abs(dx)<150) out.jump=true;

  // 6. Small difficulty-based aim error only for lower tiers.
  // Do not randomly reverse movement after choosing a shot. That causes the
  // controller to walk away from the ball/goal even when its prediction is right.

  fighter.aiAction=out;
  return out;
}

export function penaltyKeeperAI(keeper, ball, difficultyKey='regular') {
  const d=DIFF[difficultyKey]||DIFF.regular; const out={jump:false,left:false,right:false,down:false,sig:false,power:false,superMove:false,heavy:false};
  const targetX=ball?.x||keeper.x; if(Math.abs(keeper.x-targetX)>8){if(keeper.x<targetX)out.right=true;else out.left=true;}
  if(ball&&ball.y<keeper.y-40&&d.predict>12)out.jump=true;
  return out;
}
export function penaltyShooterAI(shooter, goalX, difficultyKey='regular') {
  const d=DIFF[difficultyKey]||DIFF.regular; return {up:d.predict>20,down:d.predict<20,target:goalX};
}
