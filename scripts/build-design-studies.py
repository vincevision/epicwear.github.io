"""Build original, dependency-free SVG garment studies. Never recolour photos.
Run from the repository root: python3 scripts/build-design-studies.py
The 12 supplied photo references remain separate from these 108 illustrations.
"""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'assets/data/flash-sale.json'
OUT = ROOT / 'assets/img/sale/designs'
OUT.mkdir(parents=True, exist_ok=True)

# Each entry specifies a different cut, not another colour listing of one garment.
# name / garment / neckline / sleeve / lower shape / detail
GROUPS = {
'Dresses': [
('Petal Picnic','Puff-sleeve tiered mini dress','square','puff','mini','tiers'),
('Midnight Slip','Cowl-neck satin midi slip','cowl','strap','midi','slit'),
('Garden Party','Wrap-front flutter midi dress','wrap','flutter','midi','wrap'),
('City Muse','One-shoulder column maxi','one','none','maxi','slit'),
('Sweetheart Hour','Sweetheart corset skater dress','heart','strap','skater','corset'),
('Tennis Date','Collared pleated mini dress','collar','short','mini','pleats'),
('Weekend Bloom','Halter-neck flared sundress','halter','none','skater','floral'),
('Ribbon Romance','Tie-strap smocked midi dress','square','bow','midi','smock'),
('Cocoa Evening','Long-sleeve ruched bodycon mini','round','long','bodycon','ruche'),
('Linen Letter','Button-front belted shirt dress','collar','short','midi','buttons'),
('Disco Daisy','Asymmetric ruffle-hem mini dress','one','none','asym','ruffle'),
('Moonlit Walk','High-neck open-side maxi dress','high','none','maxi','cutout'),
('Paris Morning','Boat-neck A-line mini dress','boat','long','skater','stripe'),
('Tulle Wishes','Bardot layered party dress','bardot','puff','mini','tiers'),
('Sunset Sway','Cross-halter handkerchief dress','halter','none','asym','wrap'),
('Cherry Soda','V-neck peplum mini dress','v','flutter','mini','peplum'),
('Gallery Girl','Zip-front utility mini dress','high','short','mini','pockets'),
('Velvet Crush','Scoop-neck fluted midi dress','scoop','long','mermaid','ruche')],
'Knitwear': [
('Oat Milk','Cable-knit cropped crew sweater','round','long','crop','cable'),
('Daisy Chain','Embroidered V-neck cardigan','v','long','regular','floral'),
('Honeycomb','Ribbed sleeveless knit vest','v','none','regular','rib'),
('Marshmallow','Bardot balloon-sleeve sweater','bardot','balloon','crop','rib'),
('Matcha Moment','Collared zip-up knit jacket','collar','long','regular','zip'),
('Pearl Button','Round-neck pocket cardigan','round','long','regular','pockets'),
('Cosy Orbit','Roll-neck oversized jumper','high','long','tunic','rib'),
('Bow & Tell','Tie-front cropped knit bolero','v','balloon','crop','bow'),
('Almond Haze','Hooded knitted tunic','hood','long','tunic','pockets'),
('Soft Signal','Striped polo knit tee','collar','short','regular','stripe'),
('Lily Layer','Scalloped scoop-neck knit tank','scoop','strap','crop','scallop'),
('Sunday Letters','Longline buttoned knit coat','v','long','tunic','buttons'),
('Rose Quartz','Heart-neck puff-sleeve knit top','heart','puff','crop','rib'),
('Cloud Ballet','Wrap-front ballet knit','wrap','long','crop','wrap'),
('Apricot Knit','Boat-neck batwing sweater','boat','batwing','regular','cable'),
('Winter Kiss','High-neck sleeveless sweater','high','none','regular','cable'),
('Button Bloom','Square-neck knitted peplum top','square','short','peplum','buttons'),
('Moon Thread','One-shoulder ribbed knit top','one','single','regular','rib')],
'Bottoms': [
('Cargo Crush','Wide-leg cargo trousers','none','none','wide','cargo'),
('Ballet Errands','Tie-waist parachute trousers','none','none','parachute','bow'),
('Denim Daydream','Flared high-waist jeans','none','none','flare','denim'),
('Studio Pleat','Knife-pleated tennis skirt','none','none','skirt','pleats'),
('City Stroll','Paperbag tailored shorts','none','none','shorts','belt'),
('Satin Story','Bias-cut slip midi skirt','none','none','midi','slit'),
('Dune Drifter','Cuffed linen barrel trousers','none','none','barrel','cuffs'),
('Pocket Poetry','Utility mini cargo skirt','none','none','mini','cargo'),
('Cherry Kick','Side-split bootcut trousers','none','none','bootcut','slit'),
('Cloud Commute','Pin-tuck tapered trousers','none','none','taper','pleats'),
('Garden Glide','Tiered cotton maxi skirt','none','none','maxi','tiers'),
('Pretty Practical','Wrap-front tailored skort','none','none','skort','wrap'),
('Track Sweet','Side-stripe cuffed joggers','none','none','jogger','stripe'),
('Summer Station','Belted Bermuda shorts','none','none','bermuda','belt'),
('Muse Motion','Asymmetric wrap midi skirt','none','none','asym','wrap'),
('Floral Frequency','Scalloped embroidered shorts','none','none','shorts','floral'),
('Afterglow Lane','Front-slit flared maxi skirt','none','none','mermaid','slit'),
('Pocket Sunshine','Patch-pocket cropped culottes','none','none','culotte','pockets')],
'Matching sets': [
('Brunch Bestie','Tie-front blouse & tiered skirt','v','puff','mini','tiers'),
('Linen Leisure','Camp-collar shirt & shorts','collar','short','shorts','buttons'),
('Ballet Break','Wrap crop & flared trousers','wrap','long','flare','wrap'),
('Sweet Escape','Halter top & wrap midi skirt','halter','none','midi','wrap'),
('Campus Cutie','Sweater vest & pleated skirt','v','none','skirt','pleats'),
('Cool Girl Club','Zip crop jacket & cargo trousers','high','long','wide','cargo'),
('Daisy Weekend','Peplum cami & scalloped shorts','heart','bow','shorts','floral'),
('Coastal Letter','Boat-neck top & linen culottes','boat','flutter','culotte','stripe'),
('Velour Crush','Hooded crop & cuffed joggers','hood','long','jogger','zip'),
('Night Bloom','Corset top & mermaid skirt','heart','strap','mermaid','corset'),
('Easy Espresso','Button cardigan & knit shorts','round','long','shorts','rib'),
('Sunday Market','Puff crop & barrel trousers','square','puff','barrel','belt'),
('Sunbeam Social','Bardot top & handkerchief skirt','bardot','flutter','asym','ruffle'),
('Study Date','Collared tank & Bermuda shorts','collar','none','bermuda','pockets'),
('Lavender Letter','Bell-sleeve blouse & mini skirt','v','bell','mini','bow'),
('Tailored Love','Long waistcoat & tapered trousers','v','none','taper','buttons'),
('Ribbon Runway','One-shoulder crop & skort','one','none','skort','wrap'),
('Festival Friend','Tie-strap top & tiered maxi skirt','square','bow','maxi','tiers')],
'Activewear': [
('Pilates Princess','Cross-back bra & flared leggings','scoop','strap','flare','cross'),
('Court Crush','Racerback tank & tennis skirt','halter','none','skirt','pleats'),
('Morning Miles','Zip-neck tee & running shorts','high','short','shorts','zip'),
('Peach Pace','Long-sleeve crop & cycling shorts','round','long','bermuda','seams'),
('Studio Sculpt','Square-neck unitard','square','strap','unitard','seams'),
('Off Duty Ace','Polo crop & athletic skort','collar','short','skort','wrap'),
('Flex Appeal','One-shoulder bra & leggings','one','none','leggings','panel'),
('Recovery Ritual','Oversized hoodie & joggers','hood','long','jogger','pockets'),
('Dawn Circuit','Halter bra & track trousers','halter','none','wide','stripe'),
('Power Petal','Zip-front athletic dress','high','none','skater','zip'),
('Move With Me','Thumbhole crop & capri leggings','high','long','capri','seams'),
('Stretch Story','Wrap sports top & yoga shorts','wrap','long','shorts','wrap'),
('Sprint Sweet','Racerback athletic romper','halter','none','romper','panel'),
('Cool Down Club','Sleeveless hoodie & cargo shorts','hood','none','bermuda','cargo'),
('Trail Darling','Windbreaker & tapered track pants','high','batwing','taper','zip'),
('Flow State','Scoop-neck bodysuit & dance skirt','scoop','long','mini','ruche'),
('Match Point','Pleated-back tank & warm-up shorts','boat','none','shorts','pleats'),
('Spin Sweetheart','Heart-neck bra & bootcut leggings','heart','strap','bootcut','panel')],
'Swim & resort': [
('Coral Crush','Triangle bikini & tie-side brief','triangle','strap','brief','ties'),
('Island Letter','Ring-front bandeau & high-waist brief','bandeau','none','highbrief','ring'),
('Palm Promise','Halter one-piece swimsuit','halter','none','onepiece','wrap'),
('Lagoon Love','One-shoulder cut-out swimsuit','one','none','onepiece','cutout'),
('Sandy Sweet','Ruffled bikini & swim skirt','heart','strap','swimskirt','ruffle'),
('Seashell Social','Square-neck belted one-piece','square','strap','onepiece','belt'),
('Beach Ballet','Long-sleeve rashguard & briefs','round','long','brief','stripe'),
('Tropic Muse','Cross-halter bikini & sarong','halter','none','sarong','wrap'),
('Aqua Ribbon','Tie-front crop bikini & boyshorts','v','bow','boyshort','bow'),
('Ocean Postcard','Zip-front surf suit','high','long','onepiece','zip'),
('Sun Club','Scoop-neck tankini & high-rise briefs','scoop','strap','highbrief','panel'),
('Golden Tide','Scalloped balconette & brief','heart','strap','brief','scallop'),
('Holiday Honey','Off-shoulder bikini & ruffle skirt','bardot','flutter','swimskirt','ruffle'),
('Cove Cutie','Asymmetric wrap-front one-piece','wrap','strap','onepiece','ruche'),
('Saltwater Story','Crochet cover-up mini dress','v','bell','mini','crochet'),
('Sunset Letter','Tie-waist kaftan cover-up','v','batwing','midi','belt'),
('Riviera Girl','Collared beach shirt & shorts','collar','short','shorts','stripe'),
('Paradise Petal','Floral halter top & wrap maxi skirt','halter','none','maxi','floral')]
}
PALETTE = [('Blush','#e6a4b5'),('Sage','#a8b795'),('Lilac','#b6a4d4'),('Sky','#88b9d7'),('Mocha','#b38e76'),('Butter','#e4cd8f'),('Cherry','#b84b65'),('Cobalt','#5a7dba'),('Cloud','#e4dfd3')]

def path(d, fill='url(#fabric)', stroke='#514a49', width=1.5):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>'
def line(d):
    return path(d, 'none', '#655656', 1.2)
def circle(x,y,r=3,fill='#f8ead5'):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="#655656" stroke-width="1"/>'

def top(neck, sleeve, hem='crop', detail=''):
    bottom = {'crop':222,'regular':262,'tunic':305,'peplum':265}.get(hem,222)
    pieces=''
    # Sleeves are independently drafted: fitted, bell, gathered, flutter, batwing.
    shapes={
      'long':'M138 117 L113 128 L75 267 L103 276 L146 174 Z',
      'single':'M138 117 L113 128 L75 267 L103 276 L146 174 Z',
      'short':'M138 117 L112 130 L94 177 L124 190 L146 158 Z',
      'puff':'M138 117 Q96 101 83 148 Q77 175 112 183 L133 167 L146 142 Z',
      'balloon':'M138 117 Q95 105 90 160 L70 234 Q62 267 103 274 L117 253 L146 160 Z',
      'flutter':'M138 117 L111 124 L73 175 Q105 197 131 182 L146 148 Z',
      'bell':'M138 117 L113 129 L70 268 Q101 286 126 268 L135 191 L146 156 Z',
      'batwing':'M138 117 L110 127 L61 236 L99 258 L153 208 Z'}
    if sleeve in shapes:
        pieces+=path(shapes[sleeve])
        if sleeve!='single': pieces+=f'<g transform="translate(360 0) scale(-1 1)">{path(shapes[sleeve])}</g>'
    start = {'strap':135,'bow':135,'none':138}.get(sleeve,138)
    necks={
      'round':'Q180 156 222 117','scoop':'Q180 193 222 117','v':'L180 177 L222 117',
      'square':'L150 153 L210 153 L222 117','heart':'Q154 129 163 148 Q180 128 197 148 Q210 129 222 117',
      'boat':'Q180 137 222 117','high':'L158 117 L158 92 L202 92 L202 117 L222 117',
      'collar':'L158 117 L180 149 L202 117 L222 117',
      'wrap':'L201 180 L222 117','cowl':'Q180 188 222 117',
      'bardot':'Q180 143 222 117','halter':'L166 94 L194 94 L222 117',
      'one':'L149 147 L222 107','triangle':'L165 114 L180 150 L195 114 L222 164',
      'bandeau':'L222 147','hood':'Q148 77 180 73 Q212 77 222 117'}
    starty=147 if neck=='bandeau' else 117
    left=f'M{start} {starty} '
    end=f' L222 168 L215 {bottom} Q180 {bottom+7} 145 {bottom} L138 168 Z'
    if hem=='peplum':end=f' L222 168 L211 220 L235 265 Q180 282 125 265 L149 220 L138 168 Z'
    pieces+=path(left+necks[neck]+end)
    if neck=='collar':pieces+=path('M158 117 L180 149 L165 160 L150 124 Z', '#eee4d5')+path('M202 117 L180 149 L195 160 L210 124 Z','#eee4d5')
    if neck=='cowl':pieces+=line('M148 133 Q180 170 212 133 M151 143 Q180 182 209 143')
    if neck=='hood':pieces+=line('M180 80 L180 130 M153 114 Q180 143 207 114 M162 132 L158 167 M198 132 L202 167')
    if neck=='bardot':pieces+=path('M130 117 Q180 137 230 117 L229 137 Q180 157 131 137 Z')
    if sleeve=='bow':
        for x in (142,218):pieces+=line(f'M{x} 127 Q{x-25} 96 {x-15} 104 Q{x+6} 106 {x} 127 Q{x+25} 96 {x+15} 104 Q{x-6} 106 {x} 127 L{x-6} 151 M{x} 127 L{x+8} 150')
    pieces+=decor(detail,153,165,54,bottom-175)
    pieces+=line(f'M146 {bottom-5} Q180 {bottom+1} 214 {bottom-5}')
    return pieces

def decor(kind,x,y,w,h):
    result='';cx=x+w/2
    if kind in ('rib','cable','pleats','crochet','smock'):
        for i in range(0,int(w)+1,9):
            if kind=='cable':result+=line(f'M{x+i} {y} q-6 10 0 20 t0 20 t0 20')
            elif kind=='crochet':result+=line(f'M{x+i} {y} l4 10 -4 10 4 10 -4 10')
            else:result+=line(f'M{x+i} {y} l0 {max(h,25)}')
    if kind in ('zip','buttons','corset'):
        result+=line(f'M{cx} {y-7} L{cx} {y+h}')
        if kind=='buttons':
            for n in range(4):result+=circle(cx,y+n*max(12,h/4),2)
        if kind=='zip':result+=path(f'M{cx-3} {y} h6 v9 h-6 Z','#eee4d5')
        if kind=='corset':
            for n in range(4):result+=line(f'M{cx-10} {y+n*12} l20 12 m0 -12 l-20 12')
    if kind in ('bow','ties'):
        result+=line(f'M{cx} {y+5} q-30 -24 -23 -4 Q{cx-10} {y+15} {cx} {y+5} q30 -24 23 -4 Q{cx+10} {y+15} {cx} {y+5} l-12 25 m12 -25 l15 25')
    if kind=='floral':
        for dx,dy in ((0,0),(24,18),(5,39)):
            fx=x+10+dx;fy=y+10+dy
            for a,b in ((-4,0),(4,0),(0,-4),(0,4)):result+=circle(fx+a,fy+b,3,'#f5e6df')
            result+=circle(fx,fy,2,'#e2bc75')
    if kind=='stripe':
        for i in range(0,max(1,int(h)),18):result+=line(f'M{x} {y+i} h{w}')
    if kind=='ring':result+=circle(cx,y+15,9,'none')
    if kind=='cross':result+=line(f'M{x} {y} l{w} {h} M{x+w} {y} l{-w} {h}')
    if kind=='panel':result+=path(f'M{x} {y} L{x+18} {y+10} L{x+w} {y+h} L{x+w-18} {y+h} Z','#eee4d5')
    if kind=='seams':result+=line(f'M{x} {y} Q{cx} {y+10} {cx} {y+h} M{x+w} {y} Q{cx} {y+10} {cx} {y+h}')
    if kind=='ruche':
        for i in range(0,max(1,int(h)),9):result+=line(f'M{x} {y+i} Q{cx} {y+i+7} {x+w} {y+i}')
    if kind=='cutout':result+=path(f'M{cx-16} {y+5} Q{cx} {y+30} {cx+16} {y+5} Q{cx} {y+45} {cx-16} {y+5} Z','#eae5dd')
    if kind in ('pockets','cargo'):
        result+=path(f'M{x-8} {y+10} h22 v25 q-11 8 -22 0 Z')+path(f'M{x+w-14} {y+10} h22 v25 q-11 8 -22 0 Z')
    if kind=='wrap':result+=line(f'M{x} {y-10} L{x+w} {y+h} M{x} {y+h} L{x+w} {y+h}')
    if kind=='belt':result+=path(f'M{x-10} {y} h{w+20} v10 h{-w-20} Z','#eee4d5')+path(f'M{cx-7} {y-2} h14 v14 h-14 Z','none')
    return result

PANTS={
'wide':('M132 255 L228 255 L241 407 L193 407 L180 300 L167 407 L119 407 Z',407),
'flare':('M139 255 L221 255 L215 335 L244 407 L193 407 L180 300 L167 407 L116 407 L145 335 Z',407),
'bootcut':('M139 255 L221 255 L216 355 L233 407 L193 407 L180 300 L167 407 L127 407 L144 355 Z',407),
'jogger':('M134 255 L226 255 Q244 309 215 399 L190 399 L180 300 L170 399 L145 399 Q116 309 134 255 Z',399),
'parachute':('M133 255 L227 255 Q257 329 222 400 L190 400 L180 300 L170 400 L138 400 Q103 329 133 255 Z',400),
'barrel':('M140 255 L220 255 Q257 322 212 401 L190 401 L180 301 L170 401 L148 401 Q103 322 140 255 Z',401),
'taper':('M135 255 L225 255 L208 407 L189 407 L180 296 L171 407 L152 407 Z',407),
'leggings':('M143 255 L217 255 L206 407 L189 407 L180 297 L171 407 L154 407 Z',407),
'capri':('M143 255 L217 255 L208 370 L188 370 L180 295 L172 370 L152 370 Z',370),
'shorts':('M137 255 L223 255 L232 317 L188 317 L180 286 L172 317 L128 317 Z',317),
'bermuda':('M136 255 L224 255 L231 349 L188 349 L180 292 L172 349 L129 349 Z',349),
'culotte':('M133 255 L227 255 L241 370 L187 370 L180 296 L173 370 L119 370 Z',370),
'boyshort':('M141 255 L219 255 L225 294 L186 294 L180 281 L174 294 L135 294 Z',294)}
SKIRTS={'mini':(318,124,236),'skirt':(328,112,248),'midi':(381,120,240),'maxi':(414,100,260),'skater':(335,98,262),'bodycon':(333,137,223),'mermaid':(414,100,260),'asym':(375,107,253),'skort':(322,119,241),'swimskirt':(309,122,238),'sarong':(351,130,240)}

def lower(shape,detail):
    if shape in PANTS:
        d,hem=PANTS[shape];result=path(d)+line('M133 262 L227 262 M180 263 L180 297')
        if shape in ('jogger','parachute','barrel'):
            result+=line(f'M145 {hem-7} L169 {hem-7} M191 {hem-7} L215 {hem-7}')
        if detail in ('cargo','pockets'):result+=decor(detail,139,278,81,35)
        elif detail=='denim':result+=line('M142 265 Q142 290 168 280 M218 265 Q218 290 192 280 M150 300 L150 389 M210 300 L210 389')
        elif detail=='stripe':result+=line(f'M137 267 L129 {hem-3} M223 267 L231 {hem-3}')
        elif detail in ('bow','belt','ties'):result+=decor(detail,148,262,64,40)
        else:result+=decor(detail,145,278,70,min(70,hem-290))
        return result
    if shape in ('brief','highbrief'):
        y=245 if shape=='highbrief' else 263
        return path(f'M135 {y} Q180 {y+12} 225 {y} L197 302 L163 302 Z')+line(f'M144 {y+5} L166 296 M216 {y+5} L194 296')+decor(detail,154,y+5,52,22)
    hem,l,r=SKIRTS[shape];end=hem-35 if shape=='asym' else hem
    if shape=='mermaid':d=f'M142 255 L218 255 L210 340 Q216 381 {r} {hem} Q180 {hem+10} {l} {hem} Q144 381 150 340 Z'
    else:d=f'M140 255 L220 255 L{r} {end} Q180 {hem+12} {l} {hem} Z'
    result=path(d)+line('M141 261 L219 261')
    if detail=='tiers':
        for y in range(280,hem,33):result+=line(f'M{l+8} {y} Q180 {y+12} {r-8} {y}')
    elif detail=='pleats':
        for i in range(7):result+=line(f'M{145+i*12} 264 L{l+8+i*(r-l-16)/6:.1f} {hem-5}')
    elif detail=='slit':result+=path(f'M201 {hem} L206 {hem-47} L214 {hem} Z','#eae5dd')
    elif detail=='wrap' or shape=='skort':result+=line(f'M213 266 L{l+8} {hem-4}')
    elif detail=='ruffle' or detail=='scallop':result+=line(f'M{l} {hem-8} q10 15 20 0 t20 0 t20 0 t20 0 t20 0')
    else:result+=decor(detail,151,280,58,45)
    return result

def full_garment(neck,sleeve,shape,detail):
    if shape in ('onepiece','unitard','romper'):
        # Joined torso rather than two separated garments.
        short=shape!='unitard'
        d='M144 205 Q131 235 143 267 L163 295 L197 295 L217 267 Q229 235 216 205 Z'
        if shape!='onepiece':d='M144 205 L216 205 L220 310 L188 310 L180 281 L172 310 L140 310 Z' if short else 'M144 205 L216 205 L208 407 L189 407 L180 286 L171 407 L152 407 Z'
        return path(d)+top(neck,sleeve,'crop',detail)
    hem,l,r=SKIRTS.get(shape,SKIRTS['mini'])
    # One-piece dresses share shoulder construction, then join seamlessly at waist.
    skirt=lower(shape,detail)
    torso=top(neck,sleeve,'crop',detail)
    bridge=path('M145 210 L215 210 L220 258 L140 258 Z')
    return skirt+torso+bridge+decor('belt' if detail=='belt' else '',151,234,58,12)

def illustration(name,subtitle,category,neck,sleeve,shape,detail,colour,swatch,number):
    if category=='Bottoms':art=f'<g transform="translate(-42 -130) scale(1.24)">{lower(shape,detail)}</g>'
    elif category=='Knitwear':art=f'<g transform="translate(-36 -24) scale(1.2)">{top(neck,sleeve,shape,detail)}</g>'
    elif category=='Dresses' or shape in ('onepiece','unitard','romper') or shape=='skater' and category=='Activewear':art=full_garment(neck,sleeve,shape,detail)
    elif category=='Swim & resort' and shape in ('mini','midi'):art=full_garment(neck,sleeve,shape,detail)
    else:art=top(neck,sleeve,'crop',detail)+lower(shape,detail)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480" role="img" aria-labelledby="title desc">
<title id="title">{escape(name)} — original garment illustration</title><desc id="desc">{escape(subtitle)}. {escape(colour)} design study, not a product photograph.</desc>
<defs><linearGradient id="fabric" x2="1" y2=".6"><stop stop-color="{swatch}"/><stop offset=".5" stop-color="{swatch}"/><stop offset="1" stop-color="#a58c83"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#79615b" flood-opacity=".16"/></filter></defs>
<path fill="#eae5dd" d="M0 0H360V480H0Z"/>
<path d="M24 72H336 M24 432H336 M180 72V425" stroke="#c7beb3" stroke-width=".7" stroke-dasharray="3 6"/>
<text x="24" y="38" font-family="monospace" font-size="9" letter-spacing="2" fill="#675d54">EPIC / ATELIER</text><text x="336" y="38" text-anchor="end" font-family="monospace" font-size="9" fill="#675d54">{number:03}</text>
<g filter="url(#shadow)">{art}</g>
<circle cx="28" cy="453" r="4" fill="{swatch}" stroke="#79615b" stroke-width=".5"/><text x="40" y="456" font-family="monospace" font-size="8" fill="#675d54">{escape(colour.upper())} / DESIGN STUDY</text><path d="M311 449h18m-9-6 9 6-9 6" stroke="#675d54" fill="none"/>
</svg>'''

existing=json.loads(CATALOG.read_text())
photos=[p for p in existing if p['id'] in [f'EW-{n:03}' for n in range(1,13)]]
# On first run collapse the ten duplicate cards into a single style with variants.
for p in photos:
    if 'variants' not in p:
        p['variants']=[{'id':v['id'],'colour':v['colour'],'swatch':v['swatch']} for v in existing if v['name']==p['name']]
    p['imageKind']='photo'
    default_colour = ['Blush','Cloud','Cloud','Onyx','Cloud','Cloud','Onyx','Cloud','Cloud','Blush','Blush','Cobalt'][int(p['id'].split('-')[1])-1]
    variant = next(v for v in p['variants'] if v['colour'] == default_colour)
    p['colour'], p['swatch'] = variant['colour'], variant['swatch']
new=[]
for group_index,(category,designs) in enumerate(GROUPS.items()):
    for i,(name,subtitle,neck,sleeve,shape,detail) in enumerate(designs):
        number=group_index*18+i+1
        colour,swatch=PALETTE[(i+group_index*2)%len(PALETTE)]
        image=f'assets/img/sale/designs/design-{number:03}.svg'
        (ROOT/image).write_text(illustration(name,subtitle,category,neck,sleeve,shape,detail,colour,swatch,number))
        new.append(dict(id=f'EW-D{number:03}',name=name,subtitle=subtitle,category=category,image=image,imageKind='illustration',colour=colour,swatch=swatch,price=500+50*((i+group_index*3)%11),sizes=['XS','S','M','L','XL','XXL'],description=f'{subtitle}. An original EPIC design study with its own cut and detailing. This illustration proposes a look; fabric, fit, stock and the final garment must be confirmed before purchasing.'))
# Interleave categories, so the opening grid is as varied as the whole edit.
ordered=photos[:]
for i in range(18):
    ordered.extend(new[g*18+i] for g in range(6))
CATALOG.write_text(json.dumps(ordered,indent=2)+'\n')
print(f'{len(photos)} photo-reference styles + {len(new)} original illustrated designs = {len(ordered)} unique listings')
