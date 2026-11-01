import re,json,sys
txt=''.join(open(f'/home/claude/work/gen/roster{i}.txt').read()+'\n' for i in (1,2,3))
roster={}; cur=None
order=[]
for ln in txt.splitlines():
    ln=ln.strip()
    if not ln or ln.startswith('#'): continue
    if ln.startswith('@'):
        id_,name,skin,col,reach=ln[1:].split('|'); cur={'name':name,'skin':skin,'col':col,'reach':reach,'moves':{}}; roster[id_]=cur; order.append(id_); continue
    slot,arch,fr,dmg,mods=ln.split()
    s,a,e=map(int,fr.split('/'))
    cur['moves'][slot]={'arch':f'{slot}.{arch}','fr':[s,a,e],'dmg':int(dmg),'mods':mods}
for k,v in roster.items():
    assert set(v['moves'])=={'us','ds','ss','uh','dh','sh','rc','sp','gp'},(k,set(v['moves']))
gen=lambda i: 'g1' if i.startswith('g1_') else 'g2' if i.startswith('g2_') else 'g3' if i.startswith('g3_') else 'g4' if i.startswith('g4_') else 'g5'
out=['// GENERATED from gen/roster*.txt — the authored frame data / damage / choreography assignment for every',
     '// playable Gen I–V fighter.  slot keys: us ds ss (signatures) uh dh sh (heavies) rc (recovery) sp (super) gp (ground pound)',
     '// mods: first letter = how the element rides the motion, second = its timing/behaviour (see mvArt.js).',
     'export const ROSTER = '+json.dumps(roster,separators=(',',':'))+';',
     'export const GEN_OF = '+json.dumps({k:gen(k) for k in order})+';',
     'export const ROSTER_ORDER = '+json.dumps(order)+';']
open('/home/claude/work/src/mvRoster.js','w').write('\n'.join(out)+'\n')
archs=sorted({m['arch'] for v in roster.values() for m in v['moves'].values()})
print(len(roster),'chars',len(archs),'archetypes used')
from collections import Counter
c=Counter(m['arch'] for v in roster.values() for m in v['moves'].values())
for a in archs: print(a,c[a],end=' | ')
