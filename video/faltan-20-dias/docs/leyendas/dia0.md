# Día 0 · Ya llegaron

> It is the first year a granddaughter sets up her abuela's altar, and she talks to her while she does it. At midnight the house starts to move on its own: a flame leans, the water trembles, the old dog growls at the door. Then the door slams open. After eight days of legends the audience braces for a monster, but what walks in over the petals is her. She blows on her café and sits in her rocking chair. When her granddaughter's voice breaks on their song, she finishes it from the empty chair. Seen only as a shadow on the wall, she wraps her in the rebozo. Then, as she did every morning, she tears off the calendar page. It is the 28th. HOY.

**Duración:** 60 s + outro

## Recurso

What the light can't see, the wall can. (1) An invisible protagonist built as one coherent force field. The abuela is a presence point moving at an old woman's pace along a spline: door, petal trail, café, rocking chair, behind the girl, calendar. Every element samples that one field, with delays based on distance: candle flames, copal, steam, petals, papel picado, the water, the mecedora, the rebozo, the girl's hair, the calendar page, even the glyphs (2 px nudge at most). The viewer's brain assembles a body. (2) The series' own scare grammar, turned into love. The first half uses exactly the grammar of the eight legend episodes: an animal senses something, a glass trembles, flames lean in a wave, a door creaks open, 0.7 s of digital silence, then a SLAM. What comes through the door is grandma. (3) She becomes visible only as a shadow on the wall, and only when she touches the living: 8 subliminal frames in the opening match flare, then 4 seconds at the climax when her shadow wraps the real rebozo around her granddaughter and strokes her hair. (4) The song that answers. The girl hums «Ay, ay, ay, ay…» and breaks. After absolute silence, the empty chair hums back «…canta y no llores». The 1882 lyric becomes the grandmother's consolation. (5) Second-person intimacy. After quoting her once, the granddaughter talks to her, and every line is a setup that pays off without text: the photo (rack focus), the petals (footprints), the café she always blew on (two puffs), the page she always tore (HOY). The first flame leaning toward an unseen door is answered by the last flame leaning toward the viewer.

## Dirección de arte

'Claroscuro de veladora': an intimate, painterly 2D night interior of a CDMX colonia home, like a candlelit oil painting brought to life. It is built as a 2.5D theatre of 9 parallax planes, a deliberate break from Season 2's 3D look.

LIGHT: practical lights only. The altar's nine veladoras are the warm key. Three glass veladoras sit on the floor about a meter in front of the altar; this low light throws big soft shadows up the wall to the right of the altar. The cold teal blade of night comes from the door ajar (#16303A to #2B5560, highlights #BFD6DA). Darkness is a full-frame #231305 layer with soft radial holes cut per light (destination-out), plus an additive warm pass. Every light shares one deterministic flicker that drives flame shape, falloff and shadow jitter, so the room breathes as one.

GRADE ARC: warm against cold carries the story. Teal grows to about 40% of the frame in the dread. When she enters, the door's blade turns from teal to gold over 2.5 s. From the turn on the frame is fully warm: flame cores #F5C242, falloff #F26D3D to #A83A25, shadows sinking into #231305.

SET (master wide, 1080x1920):
- Lime-washed sand wall #E0BB8F with a terracotta #A83A25 guardapolvo (y 1250–1430).
- Mosaico de pasta floor from y 1430 in perspective (green #1F5C48 and bone #D9CDB6 tiles, terracotta border, soft wear).
- Green door at left (x 60–330, y 560–1440), peeling to brown, iron latch, ajar 10 cm. Outside: fog and one far streetlamp.
- Corner-store tear-off calendar beside the door (x 360–520, y 640–860): bone paper; a flat volcano-silhouette vignette in terracotta and green, no text; the pad printed in Rye with terracotta numerals and a letterpress impression.
- Papel picado (orange, gold, green, terracotta) across y 560–720.
- Three-tier altar at center (x 360–840, tiers at y≈840/1020/1200, cloth drape to y 1430). Bone cloth with a cross-stitch border; cempasúchil pompon arch; nine veladoras; pan de muerto; a vidrio soplado water glass with a cobalt rim; salt; a clay sahumador with copal; a terracotta jarrito of café de olla with canela; her folded reading glasses; a rosary.
- Her photo in a punched-tin (hojalata) frame: a sepia engraving of her laughing behind her hand, eyes as closed crescents, gray braids with an orange listón.
- Right of the altar: a Michoacán mecedora with a woven tule seat (x 780–1060, y 1000–1640), with a green rebozo de bolita (bone speckles, long rapacejo fringe) over its back. A sand petate for the dog.
- The petal trail curves from the threshold to the altar's foot.

SHADOWS: projected for real from the floor veladoras onto the wall plane, multiplied #231305 at about 55%, blurred by penumbra, and clipped to the wall mask, never across the open doorway. The abuela's shadow is small, slightly stooped, with a chongo, soft-edged and warm. It is tender, never elongated, never with eyes.

RENDER: flat vector shapes with soft gradients through paintShape. Edges domain-warped by 2–3 px of static noise (no boiling). Brush grain (fBm at 6–10% multiply); paper.png at 8%; film grain 3%; vignette 18–35%; occluder-masked bloom and halation on flames; per-plane DOF for rack focus; copal haze catching both lights.

OUTRO: the same palette opens onto a CDMX valley at night: teal-brown mist (#16303A to #231305), thousands of warm windows, orange petal paths, and the gold-to-cream logo.

There are no calaveritas and no Halloween imagery. The only lettering inside the picture is the calendar print, typeset in Rye.

## Personajes

- **name:** La abuela (never seen in the light; only her shadow) · **how_shown:** Pure absence in the light, present through one coherent force field: flames leaning, petals pressed into oval footprints (12x26 cm), the water rippling, steam bending under two puffs, the tule seat dipping 3 px, the chair rocking, the rebozo carried through the air, hair smoothed down, the calendar page torn, and a wordless hum. She becomes visible ONLY as a shadow on the wall, twice: 8 subliminal frames in the opening match flare (0.33–0.60 s), and the climax (42.7–46.6 s), when her shadow wraps the real rebozo around her granddaughter and strokes her hair. Her photo is a stylized sepia engraving: she laughs behind her hand, so no mouth is drawn, and her eyes are closed crescents. Her voice is the gold text: the saying in the hook, «…canta y no llores.» and «—Tápate, mija.» · **motion:** A presence point P(t) on a floor spline, at human pace:
- 18.4–24.7: waits outside.
- 24.7: enters with the gust.
- 26.5–29.5: walks the trail, stride 0.45 m, ±9 cm lateral, cadence 0.72/0.80 s (an old woman's slight limp).
- 29.9: pauses at hand height for the dog.
- 31.0 and 31.8: blows on the café (impulses at mouth height, 1.45 m).
- 33.5: sits (a downward impulse, then a push every 1.6 s).
- From 40.6: hums, with a breath impulse toward the girl on each note.
- 42.6: stands.
- 42.9–43.9: carries the rebozo along two arcs.
- 44.8–46.0: strokes the hair twice (an elliptical force pass from crown to nape, 0.6 s each).
- 46.0–47.6: drifts to the calendar, where a steady left-to-right pull tears the page.
All effects lag by distance / 3 m/s, so the air seems to move outward from a real body. Behind the field sits a full invisible 2D rig: stooped standing and seated poses, a chongo head path, and two ik2 arms whose hand targets coincide with the rebozo pins. Only its projected shadow is ever rendered, so the shadow, the cloth and the field always agree.
- **name:** La nieta (about 20) · **how_shown:** 2D only. In macros we see her hands: young, a warm sand-to-brown gradient, a red thread bracelet, candle rim light, five simple fingers in a few blended poses. Otherwise she is a back or three-quarter silhouette: a long dark braid tied with an orange listón (the same listón as in the photo), a sand sweatshirt. Her cheek line is lit only by the rim; no facial features are ever drawn. Her big soft shadow on the wall is planted from the master wide onward. · **motion:** Arms on ik2 from an off-screen shoulder. Reaches follow minimum-jerk curves with 3–4 frames of finger follow-through and a 2 px settle on every placement. Braid: simChain (12); flyaways: 40 strands of 6 segments at crown and temples; constant micro-tremor of 0.6 px. Key moves:
- Calendar: pinch, a 0.6 s hesitation, release, turn away.
- Dread: a slow 1.0 s head turn to the door (springFollow).
- Slam: flinch, shoulders up 12 px in 3 frames.
- Chair: her temple rests on the arm and rides the rocking.
- Song: her chest rises on each note. On the break her shoulders shake 3× at 2 Hz and a hand rises to her mouth (0.5 s). Then she turns toward the seat (0.8 s).
- Rebozo: a startled inhale (+6 px), one sob (3 damped shakes), both hands clutch the rebozo; her head tilts 4° into the stroke and stays.
- **name:** El Chato (old adopted street dog, criollo) · **how_shown:** Deliberately not a xolo. Tan-and-white short coat with a darker saddle, one ear up and one folded, gray muzzle and thin white eyebrows (he grew old with her). Flat 2D shapes with soft gradients, an orange candle rim along the back, dark oval eyes with one warm catch-light. · **motion:** 2D skeletal rig: a 6-bone spine, neck and head, four legs with ik2 paws on hand-keyed poses (stand, two steps, circle, lie down; no procedural gait). Ears are damped springs (k 120, ζ 0.35) and the folded ear flicks. The tail is a simChain (8) with a driven base. Breathing scales the ribcage 1.2% at 0.35 Hz asleep, 0.9 Hz when alert. Key moves:
- Head snap: a 2-frame anticipation dip, then a rise with overshoot (ζ 0.55).
- Growl: lips closed, body rigid.
- Happy wag: base drive 0 to 28° over 0.8 s at 3.4 Hz, hips counter-swaying 2°, ears folding back.
- Head under the invisible hand: chin up 15°, eyelids squint shut, the wag slows to a wide sweep.
- Lie-down: front legs first, then hips, a big exhale (ribcage −3%), chin on paws.

## Beats

| t (s) | Escena | Cámara | Acción | Texto en pantalla | Sonido |
|---|---|---|---|---|---|
| 0.0–4.4 | GANCHO · La flama: black room, one veladora on the altar cloth | Locked macro (85 mm feel), flame at x 540, y 900. Handheld micro-drift ±2 px (noise at 0.2 Hz). From 2.6 s, a 6% push-in (easeInOutSine). | 0.0–0.3: black with grain.<br>0.3: a match flares from the lower right (12 ballistic sparks with drag; exposure +1.2 stops, decaying over 0.4 s). The girl's hand silhouette (red thread bracelet) brings it to the wick.<br>SUBLIMINAL, frames 10–18 (0.33–0.60 s): the flare lights the far wall, deep in bokeh at the top of frame, and casts TWO soft shadows. One is the girl's (head, shoulders, braid). Beside it is a smaller, slightly stooped one with a chongo, its head tilted toward hers. As the flare decays only hers remains, then darkness. No sound marks it.<br>0.5: the wick catches. The flame grows from 0 to 110 px over 0.5 s (spring ζ 0.7), barely revealing the bone cloth and the cobalt rim of the water glass.<br>1.3: in total stillness the flame leans 55° LEFT toward an unseen door over 8 frames (easeOutCubic), stretching 1.3× and thinning. Its smoke thread bends the same way and the pool of light slides left.<br>1.3–3.4: it holds there, quivering, then snaps upright with a damped wobble (ζ 0.35, three oscillations).<br>TEXT: 'Mi abuela decía:' from 0.8 to 2.0 at y 430. It cross-dissolves into the abuela's saying, in her gold voice color, from 1.9 to 4.4 at y 470. While the flame leans, the glyphs lean 2 px with it. | Mi abuela decía: → «Si la flama se mueve sola, / es que ya llegaron.» | Room tone at −50 dB. 0.3: match scratch, flare whoosh, wick crackle. 1.3: everything drops to near silence except a faint wet-glass-rim tone on D6, fading in over 0.6 s at −32 dB. 3.4: a soft flutter as the flame recovers. No music. |
| 4.4–7.2 | La casa y el altar: master wide of a small CDMX sala at night | Dolly back from the flame to the master wide (scale 3.2 to 1.0 over 2.4 s, easeInOutQuart). Parallax: foreground bokeh at 1.6×, back wall at 0.6×. Locked from 6.8 s with 1 px drift. | The room is revealed as we pull back. The three-tier altar with nine veladoras, papel picado, the cempasúchil arch, and her photo in the tin frame on the top tier. The green door at left, ajar, its teal blade on the mosaico floor. The calendar beside the door. The mecedora at right with the rebozo over its back. The petal trail, and the three floor veladoras in front of the altar. The girl (back view, braid with an orange listón) kneels at the altar's left and sets a veladora (ik2 arm, finger follow-through). Chato sleeps on the petate (breathing at 0.35 Hz). Her soft shadow sits on the wall above the chair. TEXT 4.7–7.1 at y 390, above the papel picado. | Este año, abuela, / el altar te lo puse yo. | A nylon guitar enters: four rubato notes of the Cielito Lindo verse in D, left unresolved. A bed of candle flutter, a distant city hush (filtered pink noise at −46 dB), crickets outside very low. |
| 7.2–9.8 | La foto: close-up on the top tier | Close-up at altar height, shallow depth of field, slow 3% push-in; candle bokeh behind. | The girl's hand turns the tin frame a centimeter toward the room and lets go (minimum-jerk, 2 px settle). The thumb lingers on the edge, then withdraws. The portrait is a sepia engraving: the abuela laughing with her hand over her mouth, eyes two closed crescents with laugh lines, gray braids tied with the same orange listón as the girl's. A candle-glare streak slides across the glass and the punched-tin stars twinkle. Out of focus behind it sits the water glass with its cobalt rim, planted for the dread. TEXT 7.5–9.6 at y 390. | Tu foto, esa donde / decías que saliste fea. | A soft metallic tock as the tin frame settles. At 8.6, a short nasal breath-laugh from the girl (formant 'hm', no words). A guitar note. |
| 9.8–12.3 | Los pétalos: floor level, the trail toward the door | 12 cm above the tiles, wide lens. The tile perspective converges on the door ajar and its teal blade. Rack focus from the foreground petals (sharp at 10.2) to the door (sharp at 12.0). | The hand opens over the floor again and again, fingers releasing little finger first with a 40 ms stagger. Each petal flips in pseudo-3D (scaleX = cos(spin)), flutters down, bounces once and settles. The trail grows toward the door in precomputed handfuls. The floor veladoras glow out of focus at frame right, and the petals at the threshold catch the teal light. TEXT 10.0–12.1 at y 390. | Pétalos desde la puerta, / para que sepas llegar. | Light granular petal patter, a guitar note, a thin wind whistling through the gap in the door. |
| 12.3–14.8 | El café: macro on the jarrito | Macro looking down 20°, pan de muerto out of focus at left, slow 5% push-in. This framing is saved for an exact match in the payoff beat (30.6 s). | The hand sets a terracotta jarrito with a white dashed rim on a clay plate: dark café de olla, a canela stick. Three thin steam wisps rise in S-curls (curl-noise ribbons, alpha 0.25, sand-tinted). The steam rises perfectly VERTICAL: this is the baseline for the payoff. TEXT 12.5–14.6 at y 390. | Tu café de olla. / Siempre le soplabas. | A two-mode ceramic clink, a faint steam hiss, a guitar note over a soft low D. |
| 14.8–18.4 | El calendario: the corner-store calendar beside the door | Medium shot at eye level. The calendar is sharp in the upper center (x 380–700, y 520–1020), with the door edge and teal light at left. 4% push-in. | The tear-off pad reads OCTUBRE / 27 / MARTES in Rye: terracotta numerals with a letterpress impression, under the volcano vignette. The girl enters from the right. Her fingertips pinch the page corner, which lifts 4 px. She holds 0.6 s, then lets go, and the page flattens with a tiny bounce. Her hand curls and withdraws, and she turns away with a swing of the braid. Leaving frame, she nudges the door from 10 to 15 cm ajar and the teal blade widens. TEXT 15.3–18.2 at y 1180, below the calendar, over the dark wall. | Arrancar la hoja / siempre te tocaba a ti. | The guitar holds one long, unresolved A that decays to nothing by 18.2. Paper rustle at the pinch; a small hinge squeak at the nudge. |
| 18.4–24.0 | Están llegando (DREAD): master wide at midnight | Master wide, darker. Locked, with a very slow 5% push-in toward the door (easeInSine). Micro-drift is cut to 1 px: the tension comes from stillness. | Exposure −0.4 stop, teal +15%; the flames shrink 10% and gutter. The girl sits on the floor beside the mecedora, back to us. Her large shadow, cast by the floor veladoras, looms on the wall above the chair.<br>19.2: Chato's head SNAPS toward the door. The upright ear springs up, the folded one flicks twice, and his body goes rigid.<br>19.6: a low growl, lips closed.<br>20.8: concentric ripples spread across the water glass with no cause, and it ticks against its plate three times, faster each time.<br>21.8: the flames lean one after another from the door side across the altar (0.12 s stagger, 30°). Smoke threads bend, the papel picado stirs in a traveling wave, and copal smoke is drawn OUT toward the door gap. Outside, the crickets stop all at once.<br>22.8: the door creaks open by itself from 15 to 40 cm (1.0 s, easeInOut). The teal blade widens over the petals and climbs the girl's back. Outside there is only fog and a far streetlamp.<br>23.3: the girl slowly turns her head to the door (profile silhouette, teal rim).<br>No text. |  | Low D drone (cello harmonics plus a 36 Hz sub, swelling from −30 to −22 dB). A distant parish bell tolls the last strokes of midnight at 18.6, 20.0, 21.4 and 22.8. Wind builds outside. Growl from 19.6 to 21.0. Glass ticks over a rising rim tone, 20.8–21.6. Staggered flame flutters at 21.8, and the crickets cut dead at the same moment. Long hinge creak from 22.8 to 23.8. Everything cuts at 24.0. |
| 24.0–24.7 | Silencio: held breath | Absolutely locked: no drift, no zoom. | The frame holds: flames still leaning, Chato frozen and staring, the girl in profile. The only movement: at 24.35 a single petal at the threshold slowly rolls over in the teal blade. |  | True digital silence (every bus muted) for 0.7 s. |
| 24.7–26.2 | ¡PORTAZO! (jump scare) | HARD CUT on the impact frame to a low over-the-shoulder angle behind the girl toward the door (center-left). Shake of 14 px decaying at 9 Hz with ±0.6° roll over 0.6 s. A 2% zoom punch with a 10-frame recovery. 4-subframe motion blur only from 24.7 to 25.2. | The door BANGS fully open to 95° in 4 frames (easeInQuad), hits the wall and bounces back 6° (spring ζ 0.3). A cold flash (#BFD6DA, +1.2 stops for 3 frames, decaying over 10) floods the floor. The gust flattens every flame 70° toward the altar and stretches them 1.4×; two nearly die, then recover. The papel picado whips upward. About 150 petals near the door burst up and swirl into the room in a precomputed vortex. The calendar pad flaps but the 27 page holds. The rebozo lifts off the chair back and drops. The girl flinches, shoulders up 12 px in 3 frames. Chato barks ONCE and hops back. From 25.4 to 26.2 everything settles: the flames bob upright (ζ 0.4), the petals drift down, and the door stays wide open on the night. |  | Wood slam (a noise burst through a wood modal filter bank), latch rattle, 40 Hz sub boom with a 1.2 s tail, gust whoosh, papel picado snap, petal swirl, one sharp bark, roaring flame flutter. All of it decays to a hush by 26.2. The peak sits about 4 dB below the legend episodes' scares, with no horror stinger. |
| 26.2–30.6 | Pasos sobre los pétalos (THE TURN) | Low lateral dolly, camera 40 cm above the floor, tracking the trail from the door (left) toward the altar (right) over 4.4 s (easeInOutSine). Foreground petals parallax at 1.4×. | Hush. Invisible steps land at 26.5, 27.22, 28.02, 28.74 and 29.54: an old woman's slightly limping walk. Each one presses an oval footprint flat and 25% darker, and 4–6 petals puff up 10–25 cm, spin and resettle. The steps are coming toward the girl. Chato stands rigid; a growl starts at 26.8, then stops.<br>28.02 (third step): his tail gives ONE wag…<br>28.4: a full wag, hips swaying, ears folding back, a happy whine. He trots two keyed steps beside the footprints with his nose raised to hand height.<br>29.9: he stops and pushes his head up under an invisible hand: chin up 15°, eyes squinting shut, the wag slowing to a wide sweep.<br>Meanwhile the door's light blade warms from teal to gold (28.0–30.5). TEXT 28.8–30.5 at y 400. | El Chato te vio primero. | Soft steps on petals (a shff plus petal crunch, alternating left and right in the pan, −28 dB). The growl fragment cuts off. 28.0: an upward harp glissando in D major, a warm string pad fades in, and the D minor drone resolves to D major. A dog whine gliding from 700 to 1300 Hz; two tail thumps on the tile. |
| 30.6–33.4 | Le sopló: the café again | Macro matching the earlier café shot (12.3 s) exactly. A slow rack focus to the photo at 32.4. | The steam rises vertically, as before.<br>31.0: a gentle first puff. All three wisps bend 35° sideways, stretch thin and curl back up over 0.7 s, and a tiny ring ripples across the café.<br>31.8: a smaller second puff (20°).<br>32.4: the focus racks to the photo behind. Candle glints slide across the glass over her laughing face, and the tin stars twinkle.<br>No text: the setup pays off on its own. |  | Two warm, very close breaths (filtered noise with a soft 'fu' formant, −30 dB), steam hiss. At 32.0 the guitar starts the Cielito Lindo verse melody in a slow, rubato 3/4. |
| 33.4–37.4 | La mecedora | Medium-wide on the chair, the girl and the dog, at seated eye level. Slow 6% push-in. | 33.5: one creak. The empty tule seat dips 3 px: someone sat down. The chair starts to rock on its rockers (rolling contact, x = R·θ). The amplitude ramps from 0 to 5° over 2 s, with a period of 1.6 s, one bar of the waltz. The rebozo on its back swings with a lag, and the chair's shadow rocks on the wall.<br>34.0–35.6: Chato walks two steps, circles once and lies down at the chair's foot, right where her feet would be: front legs, then hips, a big exhale, chin on his paws, eyes half-closed.<br>34.6: the girl, sitting on the floor beside the chair, turns and rests her temple on its arm; her head rides the rocking.<br>TEXT 34.8–37.2 at y 400. | No alcancé a decirte adiós. | A soft wood creak on each downbeat (two alternating pitches) under the guitar verse. A dog sigh as he lies down. |
| 37.4–42.6 | La canción que contesta | Medium close on the girl's profile silhouette resting on the chair arm. Gold rim light from the floor veladoras, whose flames are bokeh in the foreground. 3% push-in, then at 41.2 a 2% ease toward the empty seat. | 37.5: she hums her abuela's song, her chest rising on each note. TEXT (her voice) 37.6–39.9.<br>39.5: her voice breaks on the fourth 'ay'. Her shoulders shake three times and a hand rises to her mouth.<br>39.6: the chair slows and stops at the end of a swing.<br>39.9–40.6: NOTHING moves; even the flames stand still.<br>40.6: the chair rocks once again, and from the empty seat an old woman's hum picks up the melody exactly where the girl broke off. With each hummed note the foreground flames pulse gently toward the girl. TEXT (the abuela's voice) 40.7–42.5.<br>41.2: the girl lifts her head and turns toward the seat (0.8 s, easeInOutCubic). Her hand slides from her mouth to her chest, and one laughing sob lifts her shoulders. | «Ay, ay, ay, ay…» → «…canta y no llores.» | 37.4: the guitar drops out, and the girl's hum is heard alone (young female formant 'mm', D4 to A4, 5.5 Hz vibrato, tremulous). 39.5: her voice cracks into a caught sob. 39.9–40.6: absolute silence; the pad cuts too. 40.6: an elderly female hum (lower, breathier, 4.8 Hz vibrato, jitter and shimmer), panned 30% toward the chair in a small room reverb; the downbeat creaks return. 41.6: nylon guitar arpeggios come back in pp under her hum. |
| 42.6–46.6 | Tápate, mija (EMOTIONAL PEAK) | Close three-quarter from behind-left of the girl. Her shoulders, braid and the chair arm fill the lower frame (y 1150–1920). The warm wall above (y 300–1100) carries her big soft shadow and the chair's. Floor-veladora bokeh at lower left. An imperceptible 3% push-in. | 42.6: the rocking stops within half a period, as if a foot touched the floor.<br>42.7: on the wall, a second shadow rises from the chair's shadow: a small, slightly stooped old woman with a chongo. It is the only way we ever see her; in the real light, nothing is there.<br>42.9: the real rebozo lifts off the chair back while, on the wall, her shadow hands hold its shadow. It is carried in two arcs over the girl's head and settles around her shoulders at 43.9, the fringe swinging (the cloth collides with head and shoulder capsules).<br>44.0: a startled inhale, then one sob (three small damped shakes). She clutches the rebozo at her chest with both hands.<br>TEXT 44.4–46.4 at y 320, above the shadows.<br>44.8–46.0: on the wall, the shadow hand strokes the girl's shadow head from crown to nape, twice. In the real light her loose strands smooth down in sync. Her head tilts 4° into the touch and stays.<br>46.0: the shadow tilts its head 6° toward hers, then turns and walks out of the light to the left, thinning and gone by 46.6. | —Tápate, mija. | Her hum carries on into the chorus ('porque cantando se alegran…') over the guitar. The strings swell as the rebozo settles at 43.9, then drop away at 44.4, leaving only hum and guitar. A cloth whisper as the rebozo travels; the girl's wordless breath catch; a harp sparkle at 44.8 on the first stroke. |
| 46.6–49.2 | La última hoja: the calendar tears itself | Slow pan left (1.2 s, easeInOut) from the girl across the altar to the calendar by the door, with a rack focus. Locked from 47.8. | A warm draft travels ahead of the pan. The papel picado sways in a slow wave toward the door and the altar flames lean gently left in sequence: warm and unhurried, the opposite of the dread wave.<br>47.6: the lower corner of the 27 page lifts and quivers.<br>48.0: it TEARS along the perforation from left to right in 0.7 s: clean, practiced, her morning gesture. It slips free and flutters down out of frame through the candlelight, swaying like a falling leaf (±25°). The pad now reads OCTUBRE / 28 / MIÉRCOLES. | (diegetic Rye print on the calendar) OCTUBRE · 27 · MARTES → OCTUBRE · 28 · MIÉRCOLES | The hum ends on a held note at 46.9. A slow, crisp paper tear (granular, 0.7 s, panning left to right), a soft flutter, one far bell. |
| 49.2–51.6 | HOY: the lockup grows from the calendar | Push into the pad (scale 1 to 2.4, easeOutExpo, 1.0 s) until the page fills the frame with paper-fiber texture. Locked from 50.2 with a 1% breathing scale. | The printed 28 catches the candlelight and glows from inside like an ember (terracotta to gold). OCTUBRE and MIÉRCOLES fade. HOY rises above the 28 in gold Rye, its letters lifting off the paper on a soft spring (ζ 0.85, 3-frame stagger). The 28 eases down and resolves into Alike '28 · 10' as '· 10' fades in. HOY is centered at y≈820 and the date at y≈1080. It holds until 51.6, with candle flicker in the glow. | HOY / 28 · 10 | The guitar resolves on D add9, the first full cadence of the film, with a harp arpeggio and a soft low bell. |
| 51.6–55.8 | Alguien vuelve a casa (special outro I) | One continuous pull-back (easeInOutQuint, 9 parallax planes): back across the room, out through the open door (its frame passes the lens at 53.0), along the callejón, then a crane up over the rooftops to the whole valley of the city. | The lockup thins into embers that drift up. In the room: the torn 27 page lies on the altar's lower tier beside her café; the girl sleeps against the chair, wrapped in the rebozo; Chato sleeps at its foot; the chair rocks once more. Outside, every doorway has its own petal path and a glowing threshold. Rooftops with tinacos, antennas and tendederos strung with papel picado; thousands of candlelit windows; low mist. From a panteón on a hillside, thin glowing orange paths draw themselves into the streets, and gold motes travel along them into doorways; each window brightens as its mote arrives. On the far Santa Fe ridge, seven warmer points: the university's seven altars. TEXT 53.2–55.6 at y 400, in the sky. | Hoy, en cada altar, / alguien vuelve a casa. | The gentlest full chorus: guitar, harp, string pad, and for the first time BOTH hums together, the girl's and the abuela's, in unison and then in thirds. Night ambience: the crickets return, wind, distant bells from several churches. |
| 55.8–60.0 | Westhill (special outro II) | Locked high wide with a slow 2% drift up. | From every window, every path and the seven ridge points, a gold mote lifts. About 6000 motes stream along curl-noise paths to the center and land on the Westhill logo's pixels (targets sampled from the logo alpha, centered at y≈930, 880 px wide, the same placement as Outro.tsx). Each pixel ignites from gold to cream as its mote arrives. The logo is complete at 57.2 and the city dims to 30%. 58.0: in the lower-right foreground, a single veladora on a rooftop ledge leans its flame gently TOWARD THE CAMERA (25°), holds 0.8 s and straightens, as if someone had just passed beside the viewer too. The logo holds to the last frame. |  | Final cadence (D add9 resolving to D). A single guitar harmonic at 58.0 on the candle lean. The abuela's last hummed note dissolves; the reverb tail runs to silence by 59.9. |

## Sustos

- **t:** 0.33 · **what:** For eight frames, the match flare shows two shadows on the far wall: the girl's, and a smaller, stooped one with a chongo beside it. Then only hers remains. · **why_it_works:** Something the eye catches but the mind can't confirm, in the first second. It plants unease, rewards rewatching, and pays off at 42.7 when the same shadow returns and stays.
- **t:** 1.3 · **what:** In total silence, the freshly lit flame leans 55° toward an unseen door and holds there. · **why_it_works:** Something impossible happens in the first 2 seconds, and the saying that follows gives the viewer the rule of the whole film: watch for invisible signs. From then on they scan every frame.
- **t:** 19.2 · **what:** The sleeping dog's head snaps toward the door, followed by a low, closed-mouth growl. · **why_it_works:** An animal seeing what we can't is a primal horror cue. The anticipation and overshoot make the snap startlingly alive inside a still frame.
- **t:** 20.8 · **what:** The water glass ripples and ticks against its plate with no cause, faster each time. The flames lean in a wave across the altar, copal is pulled toward the door, and the crickets outside stop dead. · **why_it_works:** The staggered lean gives the disturbance a direction: something is crossing the room along a path no one is on. Taking away the cricket bed is felt physically.
- **t:** 22.8 · **what:** The door creaks open by itself, the cold blade of light climbs the girl's back, and she slowly turns her head toward it. · **why_it_works:** The viewer is waiting for the reveal through the door and gets only fog and a far streetlamp. The empty threshold is scarier than any figure.
- **t:** 24.7 · **what:** After 0.7 s of digital silence, the door SLAMS open on a hard cut: a gust, a cold flash, flames flattened, a burst of petals, a single bark, camera shake. · **why_it_works:** It uses the jump-scare grammar the series has taught for eight days, landing exactly where viewers expect a monster. Because they really flinch, the turn into love two seconds later hits much harder.
- **t:** 26.5 · **what:** Invisible footsteps crush the petals one by one, walking toward the girl, while the dog stands rigid. · **why_it_works:** Footprints with no body are pure dread, and the limping old cadence is oddly specific. For two seconds it could still be anything, until the dog's single wag flips fear into recognition.
- **t:** 39.9 · **what:** The girl's voice breaks, everything freezes in absolute silence, and then the empty chair rocks and hums the next line of the song. · **why_it_works:** Call and response from an empty space is at once the most chilling and the most moving moment of the film. The silence makes the audience hold its breath, and the lyric «canta y no llores» turns the chill into tears.

## Revelación del número

It is planted at 14.8–18.4 s. The girl reaches to tear the 27 page off the corner-store calendar, hesitates and pulls back: «Arrancar la hoja / siempre te tocaba a ti.» The bells tolling through the dread are midnight. After the rebozo and the caress, the presence drifts to the calendar. At 48.0 the page tears itself along the perforation, left to right, slow and practiced: her daily gesture done one more time. The page flutters away, revealing the Rye print OCTUBRE / 28 / MIÉRCOLES (verified: 27 Oct 2026 is a Tuesday, 28 Oct 2026 a Wednesday). The camera pushes into the 28, which glows like an ember. HOY rises above it in gold Rye (240 px, centered y≈820), and the 28 settles into Alike '28 · 10' (88 px, sand, tracking 0.2 em, centered y≈1080), all inside the 262–1568 safe zone. The lockup lands on the first full cadence (D add9) and holds until 51.6, then thins into embers that carry the camera into the special outro. The day's number is literally the page she turned.

## Música

Original score built on 'Cielito Lindo' (Quirino Mendoza y Cortés, 1882, public domain; transcribe the melody from a public-domain edition). It is the abuela's song.

KEY AND TEMPO: D major, matching the series' Re drone. A rubato 3/4 waltz at about 112 BPM, so one bar is 1.607 s, exactly one rock of the mecedora.

INSTRUMENTS (numpy synthesis):
- Nylon guitar: Karplus-Strong with body resonance and a little fret noise.
- Harp: plucks with a long decay.
- Cello harmonics plus a 36 Hz sub drone.
- A soft string pad.
- A wet-glass-rim tone for the uncanny moments.
- A distant parish bell: additive inharmonic partials.
- Two wordless hums, both glottal source through nasal 'mm' formants:
  - THE GIRL: young, D4 to A4, 5.5 Hz vibrato, low jitter, tremulous; it cracks into a sob at 39.5.
  - THE ABUELA: lower, breathier (about 30% breath noise), 4.8 Hz wider vibrato, age jitter and shimmer, a small room reverb panned toward the chair, doubled very softly by a low flute.

MAP:
- 0–4.4: no music; room tone, plus a glass-rim tone on the flame lean.
- 4.4–14.8: sparse rubato verse fragments on guitar, one phrase per text line, never resolved.
- 14.8–18.2: a hanging A that decays away.
- 18.4–24.0: D minor drone, sub and midnight bells, no melody; the crickets cut at 21.8.
- 24.0–24.7: digital silence.
- 24.7: the slam, sound design only.
- 28.0: on the dog's first wag, a harp glissando and a warm pad; the drone turns from D minor to D major.
- 32.0–37.4: the guitar plays the verse, with chair creaks on the downbeats.
- 37.4: the girl's hum alone («Ay, ay, ay, ay…»), breaking at 39.5.
- 39.9–40.6: absolute silence.
- 40.6: the abuela's hum continues «canta y no llores»; guitar arpeggios return at 41.6. It carries on into 'porque cantando se alegran…'. The strings swell at 43.9 and drop out at 44.4 so «Tápate, mija» sits on hum and guitar; a harp sparkle at 44.8.
- 46.9: the hum ends on a held note; the paper tear follows.
- 49.2: the first full cadence, D add9, on HOY.
- 51.6–55.8: the gentlest full chorus. For the first time the two hums sing together, unison then thirds: grandmother and granddaughter.
- 55.8–60.0: final cadence to D, a single guitar harmonic at 58.0 on the last candle lean, and a reverb tail to silence at 59.9.

MASTER: −14 LUFS integrated, true peak ≤ −1 dBTP. The slam sits about 4 dB below the legend episodes' scares.

## Diseño sonoro

- match scratch and flare whoosh; wick crackle
- wet-glass-rim tone on D6 (uncanny)
- room tone (low pink noise, −50 dB) and a candle-flutter bed
- distant city hush; crickets outside (cut dead at 21.8, return in the outro)
- tin frame setting down on cloth (soft metallic tock)
- girl's nasal breath-laugh 'hm' (formant, no words)
- light granular petal patter; thin wind through the door gap
- ceramic jarrito set-down (two-mode clink); steam hiss
- paper rustle at the calendar pinch; small hinge squeak
- cello harmonic drone and 36 Hz sub
- distant parish bell tolling midnight (four strokes)
- outdoor wind building
- dog growl, lips closed (low glottal source plus noise, formants near 400/1100 Hz)
- glass ticking against its plate, accelerating, with a rising rim tone
- staggered flame flutters
- long slow door-hinge creak
- true digital silence (0.7 s)
- door slam (wood modal bank), latch rattle, 40 Hz sub boom with a 1.2 s tail
- gust whoosh; papel picado snap and flutter; petal swirl
- single sharp bark
- invisible footsteps on petals (shff plus crunch, alternating pan)
- harp glissando up
- happy dog whine (700 to 1300 Hz glide); tail thumps on tile
- two warm close breaths blowing on the café ('fu' formant)
- rocking-chair creaks on each downbeat (two alternating pitches)
- dog sigh as he lies down
- girl's wordless hum, cracking into a caught sob
- elderly female wordless hum from the chair (small room reverb, panned)
- rebozo cloth whisper
- girl's soft wordless breath catch
- slow crisp paper tear (left to right), flutter
- soft low bell under the HOY cadence
- night ambience: crickets, wind, distant multi-church bells
- final guitar harmonic on the candle lean

## Factibilidad

Remotion 4, one composition of 1800 frames (60 s at 30 fps) in src/leyendas/d00_hoy.tsx with EP00_LEN = 1800. CAPS[0].outro is already false in Capitulo.tsx, so the special outro lives inside the episode. Audio lives in scripts/leyendas/d00.py with LEN = 1800 and STANDARD_OUTRO = False.

Rendering is 100% Canvas2D through kit/scene (Scene, paint, post). There is no 3D, and no WebGL beyond the kit's post pass. The kit is not modified; everything new is episode-local: presence field, shadow projector, nieta/Chato/abuela rigs, mecedora, calendar, city, logo motes, SungLine and the HOY lockup.

DETERMINISM: every visual is a pure function of the frame. Stateful sims are precomputed once at module scope with cached(), a fixed dt of 1/120 s and the hash RNG, then stored in typed arrays indexed by frame:
- the rebozo: simCloth 14x22, two pins driven by the invisible rig's hands, capsule colliders for head and shoulders;
- the braid: simChain 12, plus 40 flyaway chains;
- Chato's tail: simChain 8, plus ear springs;
- petals: about 600 on the trail and 150 for the gust, ballistic with drag. Footprints are closed-form impulse responses, impulse·(1 − e^(−10(t − ti))), so no per-frame state is kept;
- the outro motes.

PRESENCE FIELD: presence(t) returns position, height, velocity and the active impulses. F(x,t) is a Gaussian body push (σ 0.35 m) along the velocity plus impulse kernels, delayed by distance / 3 m/s. It is sampled by:
- flames: lean = clamp(atan(k·F)), fed to the lean parameter of flame2D and candle2D;
- smoke and copal (shear) and the steam ribbons (blow shear);
- papel picado (angular impulse per flag);
- the water ripple amplitude, sin(kr − ωt)·e^(−r/λ);
- the chair torque, the cloth pins and the hair force pass;
- the calendar tear front;
- a glyph nudge of 2 px at most.

LIGHT: a #231305 darkness layer with a radial hole per light (destination-out), plus an additive warm pass, all driven by one shared noise2D flicker.

SHADOWS: the wall point is L + (P − L)·(Zw − zL)/(z − zL) for each floor veladora. The projected silhouettes are the girl, the chair, Chato and the rebozo, plus the abuela rig only at 0.33–0.60 s and 42.7–46.6 s. Each is filled #231305 at about 55% in multiply and blurred by its penumbra (flame radius × (Zw − z)/(z − zL)) with blurred() on half-resolution buffers. The three lights are summed and the result is clipped to the wall mask.

MECEDORA: a rigid drawing rotating about the rolling contact point (amplitude ramp, x = R·θ, period 1.6 s); the creak timestamps are exported to the audio script.

DOOR: the plank texture is cached once, then drawn as depth-scaled vertical strips on a spring angle curve. The light blade uses beam(), with its color lerping from teal to gold.

CALENDAR: drawn in 2D, with the Rye print rasterized by fillText into the page canvas. The tear is a front moving along the perforation. The free page is a strip mesh bent by a cylinder-curl approximation, then a falling-leaf glide with scaleY = cos(flip).

PHOTO: about 30 closed paths filled with clipped sepia engraving hatch, cached.

HANDS: a Catmull-Rom palm plus tapered-capsule fingers, 4 blended poses, paintShape shading with a rim light.

TEXT: kit Line in soft and whisper modes, with the safeY clamp to 262–1568. SungLine wraps Line in a skewX(−8°) span with a shimmer mask. The HOY lockup cross-fades the canvas '28' into the DOM '28 · 10' at matching coordinates.

OUTRO:
- 9 valley and skyline planes with fBm ridgelines, cached;
- instanced window rects with a per-window flicker hash;
- the panteón as 120 candle points;
- about 20 paths as smoothPath polylines stroked twice (core plus glow) and revealed by dash offset, with about 200 motes advected along them;
- the logo formation reuses the logo pixel data from scenes/Outro.tsx (loadLogo: px, a), with precomputed arrival times written through ImageData.

AUDIO: numpy, using leyendas_sfx (glottal, formants and vowel_glide for the two hums and the growl; creak, dog_bark, crickets, wind, glass_rattle, drone_dark, sub_drop, stereo) and music.py (pluck and strum guitar, choir pad). New pieces: additive bells, a granular paper tear and petal steps. sfx.master brings it to −14 LUFS / −1 dBTP.

RENDER: shadows, blur and bloom at half resolution, static layers cached. Expect about 0.6–1.0 s per frame on 4 cores, roughly 20–30 minutes in total.

## Riesgos

1) TONE: Day 0 must make people cry, not jump out of their seats. The slam stays a gust (no figure, no face), sits about 4 dB under the legend scares, settles within 1.5 s and turns into love by the dog's wag at 28.0. If the client wants no scare at all, swap the slam for a soft gust that swings the door open; nothing else changes.

2) THE SHADOW CLIMAX must read on a phone and read as tender. It needs a large shadow at high contrast on the warm wall, a stooped silhouette with a chongo, soft penumbra, no eyes, no glow, no elongation, and text kept above it. Validate with stills at 43.5 and 45.2 s. Clip the shadow to the wall mask so it never crosses the doorway.

3) HUMS: a sterile synthesized hum kills the peak. Add jitter, shimmer and breath, crack the girl's voice audibly at 39.5, double the abuela's hum softly with a low flute, and keep it in a small room reverb. Fallback: a soft ocarina line in place of the abuela's hum.

4) SOUND-OFF VIEWERS: every key sound has a visual and text. The lyric is on screen; the flames pulse with each hummed note; the footprints, the steam and the chair all show what is heard.

5) THE PORTRAIT: keep the face stylized. Her hand covers her mouth, her eyes are crescents, and a glare streak crosses the glass. If it looks uncanny, let the glare cover more of it.

6) READING LOAD: 13 short lines of 8 words or fewer, with gold and bone separating the two voices. Test at 540x960. If the setup montage reads as rushed, cut the photo beat (7.2–9.8) and give its 2.6 s to the outro.

7) LAYER ORDER:
- Floor actors are y-sorted by foot line every frame: petals, floor veladoras, rockers, Chato, the girl.
- Each candle draws its own flame in its own depth slot, never on a global top layer.
- Inside the girl: body, then rebozo, then braid, then flyaways.
- The wall shadow layer sits above the wall and calendar and below the papel picado.
- The petal trail ends before the door's swing arc.
- Check stills at 0.4, 6.5, 21.9, 24.8, 27.5, 29.9, 35.5, 38.5, 41.5, 43.5, 45.2, 48.3, 50.5, 53.0, 57.5 and 58.4 s with scripts/stills.mjs.

8) CLOTH: the rebozo can interpenetrate the head or shoulders. Use capsule colliders and pins driven by the same rig that casts the shadow, and check frame by frame from 42.6 to 44.4.

9) CALENDAR FACTS: 27 Oct 2026 is MARTES and 28 Oct 2026 is MIÉRCOLES (verified). Rye covers É. The header vignette has no text.

10) CULTURE: in many regions the 28th welcomes those who left suddenly. 'No alcancé a decirte adiós' is consistent with that and never states a cause. No calaveritas, no Halloween imagery. The only words used are altar, foto, pétalos, hoja; never the three banned words.

11) LENGTH: exactly 1800 frames. Instagram Stories splits anything over 60.0 s.

12) RENDER COST: the soft shadows and the outro glows are the heavy passes. Use half-resolution buffers and cached sprites, and skip shadow projection on frames where the wall is out of view.

## Especificación de construcción

- **environments:** - HOOK MACRO (0–4.4): black room, one glass veladora on the bone altar cloth, the cobalt rim of the water glass in soft focus. The far wall exists only as a bokeh plane that the match flare lights for 8 frames, catching two projected shadows. The flame's light pool slides on the cloth when it leans.
- SALA MASTER WIDE (4.4–7.2, 18.4–24.7, part of 51.6–53.0): 2.5D planes, back to front:
- L0: exterior night through the door (teal sky gradient, fogBand, one far streetlamp glow).
- L1: back wall (sand lime-wash via surface('adobe'), terracotta guardapolvo y 1250–1430, door opening cut out) with the calendar mounted on it.
- L2: door leaf (green, peeling; hinged strip quad; ajar at 10, then 15, then 40 cm, then 95°).
- L3: wall-shadow layer (multiply, clipped to the wall mask).
- L4: papel picado strings (y 560–720).
- L5: altar boxes and cloth (cross-stitch border).
- L6: altar objects by tier, each candle with its own flame.
- L7: mosaico floor in perspective (green/bone tiles, terracotta border), teal-to-gold light blade, petate.
- L8: floor actors y-sorted (petal trail, floor veladoras, mecedora rockers, Chato, girl).
- L9: additive haze and occluder-masked bloom.
- L10: foreground bokeh.
- L11: grade, paper, grain, vignette.
- L12: DOM text.
- ALTAR CLOSE-UPS: (a) top tier with the punched-tin frame and engraving portrait, glare streak, tin stars twinkling, water glass out of focus (7.2–9.8; rack target at 32.4); (b) café macro on the lower tier: jarrito with a white dashed rim on a clay plate, canela stick, three steam ribbons, pan de muerto out of focus at left; identical framing at 12.3 and 30.6.
- CALENDAR WALL (14.8–18.4, 46.6–51.6): medium shot of the corner-store calendar beside the door. Bone paper; a flat volcano vignette (terracotta/green) with no text; tear-off pad with perforation; Rye print OCTUBRE / 27 / MARTES under it, OCTUBRE / 28 / MIÉRCOLES on the next sheet; letterpress impression and paper-fiber texture for the 2.4× push-in.
- FLOOR LEVEL, PETAL TRAIL: (a) a camera 12 cm above the tiles looking at the door ajar, with handfuls of petals falling and rack focus (9.8–12.3); (b) a low lateral dolly at 40 cm from the open door to the altar, with footprints, Chato and the door blade warming (26.2–30.6); (c) the slam angle: low over-the-shoulder behind the girl toward the door (24.7–26.2).
- MECEDORA CORNER (33.4–46.6): medium-wide of the chair, the girl on the floor and Chato. Medium close of the girl's profile on the chair arm with floor-veladora bokeh. Close three-quarter from behind-left with the warm wall above holding the girl's and chair's shadows, and the abuela's shadow at 42.7–46.6.
- CALLEJÓN AND ROOFTOPS (52.6–54.2): open door frame passing the lens; a narrow street with its own petal path and glowing thresholds; adobe and block façades; tinacos, antennas and tendederos strung with papel picado.
- CDMX VALLEY AT NIGHT (53.8–60.0): 9 planes with fBm ridgelines and fog bands; thousands of instanced candlelit windows; a hillside panteón (120 candle points) with about 20 glowing orange paths drawn into the streets; the Santa Fe ridge with seven warmer points (the seven altars); a lower-right rooftop ledge with one veladora; the logo formation space centered at y≈930.
- **characters_and_rigs:** - ABUELA PRESENCE FIELD: presence(t) is a spline path with keyed pace (waits outside, enters at 24.7, footsteps at 26.5/27.22/28.02/28.74/29.54, blows at 31.0/31.8, sits at 33.5, hum breath impulses from 40.6, stands at 42.6, rebozo arcs 42.9–43.9, strokes 44.8–46.0, tears the page 47.6–48.7). F(x,t) is a Gaussian body push (σ 0.35 m) plus impulse kernels with a distance/3 m/s delay. Exported helpers: leanAt(x,t), shearAt(x,t), impulseAt(x,t).
- ABUELA INVISIBLE RIG (shadow only): a 2D stooped old woman: torso path, chongo head path, two ik2 arms, standing and seated poses. Hand targets coincide with the rebozo cloth pins and the hair-stroke force pass. Never drawn directly. It is projected through the wall-shadow projector at 0.33–0.60 s and 42.7–46.6 s (fade in 0.3 s; it walks out of the light to the left and fades by 46.6).
- NIETA RIG: back and three-quarter silhouette (sand sweatshirt, long dark braid with an orange listón), drawn with paintShape and a rim light from the nearest flame.
- Hair: braid simChain 12; 40 flyaway chains of 6 segments, smoothed by the field pass at 44.8–46.0.
- Arms: ik2 from an off-screen shoulder; minimum-jerk reaches with a 2 px settle.
- Springs (springFollow): head turn to the door at 23.3, turn to the chair at 41.2, 4° tilt into the stroke.
- Flinch: +12 px in 3 frames. Sob: 3 damped shakes. Hand to mouth: 0.5 s. Chest rises per hummed note. Her temple rides the chair arm.
- HAND MACRO RIG (match, frame, petals, jarrito, calendar pinch): a Catmull-Rom palm polygon (8 points), tapered-capsule fingers (3 phalanges), 4 blended poses (relaxed, pinch, grip, open-release with a 40 ms little-finger-first stagger), red thread bracelet, micro-tremor of 0.6 px, paintShape skin gradient with a candle rim.
- CHATO RIG: 2D skeleton (6-bone spine, neck, head, four ik2 legs on hand-keyed poses: asleep, head snap, stand, two steps, trot two steps, head-up-under-hand, two steps, circle, lie down). Ear springs (k 120, ζ 0.35) with a folded-ear flick. Tail simChain 8 with a driven base (0 to 28° at 3.4 Hz). Ribcage breathing at 0.35/0.9 Hz. Eyelid squint. Bark hop-back at 24.7.
- MECEDORA: a rigid bentwood and tule drawing on rockers of radius R. θ(t) = A(t)·sin(2π(t − t0)/1.6), with an amplitude ramp from 0 to 5° over 2 s, a stop within half a period at 39.6 and 42.6, and a restart at 40.6. It translates x = R·θ and rotates about the moving contact point. The seat dips 3 px at 33.5. Its shadow is projected on the wall. Downbeat creak timestamps are exported to the audio.
- REBOZO CLOTH: simCloth 14x22, green de bolita with bone speckles and a rapacejo fringe (simChain strands). Rest state: draped on the chair back. 24.7: gust lift and drop. 42.9–43.9: two corners pinned to the abuela rig's hands along two arcs. Settles on the girl's shoulders with head and shoulder capsule colliders, clutched by her hands from 44.0. It is projected as a shadow too.
- DOOR: cached plank texture drawn as depth-scaled vertical strips around the hinge. Angle curve: 10 cm ajar, nudged to 15 at 17.6, creaks open to 40 cm at 22.8–23.8, slams to 95° at 24.7 in 4 frames with a 6° spring rebound (ζ 0.3). Iron latch.
- CALENDAR PAGE: pad canvas with the Rye print; the 27 page as a strip mesh. 15.9: pinch lift of 4 px with a bounce on release. 24.7: flap. 47.6: corner quiver. 48.0–48.7: tear front along the perforation, left to right. Then a cylinder-curl free page and a falling-leaf glide out of frame (pendulum ±25°, scaleY = cos(flip)). The page lies on the lower altar tier beside the café in the outro pull-back.
- PORTRAIT: about 30 closed paths (chongo, braids with orange listón, rebozo, face oval, closed crescent eyes with laugh lines, the hand covering the mouth) filled with clipped sepia engraving hatch and left unhatched in the highlights, cached; a moving glare streak and tin-star glints.
- **effects:** - LIGHTING SYSTEM: a full-frame #231305 darkness layer with a radial hole per light (destination-out); an additive warm pass; one shared deterministic noise2D flicker driving flame shape, intensity, falloff and shadow jitter. Grade arc in post: teal shadows during the dread (exposure −0.4, teal +15%), lerping to a full candle grade from 28.0.
- FLAMES: candle2D/flame2D for nine altar veladoras plus three floor veladoras, with lean from the presence field.
- 1.3 s: a 55° lean held to 3.4, then a damped wobble (ζ 0.35).
- 18.4: guttering.
- 21.8: a staggered dread wave (30°, 0.12 s).
- 24.7: gust flatten (70°, 1.4× stretch), two nearly die, ζ 0.4 recovery.
- 39.9–40.6: frozen still.
- From 40.6: gentle pulses on each hummed note.
- 46.6: a warm, slow wave toward the door.
- 58.0: a 25° lean toward the camera.
- WALL SHADOW PROJECTOR: for each floor veladora, the wall point is L + (P − L)·(Zw − zL)/(z − zL). Silhouettes: the girl, the chair, Chato, the rebozo, and the abuela rig (only at 0.33–0.60 and 42.7–46.6). Filled #231305 at about 55% multiply, blurred by penumbra on half-resolution cached buffers, summed over three lights, clipped to the wall mask (never across the door opening), with scale flicker tied to the flames.
- MATCH: strike with 12 ballistic sparks with drag, a flare at +1.2 stops decaying over 0.4 s, a smoke curl on shake-out.
- STEAM: three curl-noise ribbons per cup (kit smoke, sand-tinted, alpha 0.25), vertical at baseline. Blow shear impulses at 31.0 (35°) and 31.8 (20°) with a ring ripple on the café surface.
- COPAL AND SMOKE THREADS: kit smoke with field shear. At 21.8 copal is drawn out toward the door gap.
- WATER GLASS: ellipse surface with a radial ripple sin(kr − ωt)·e^(−r/λ) and amplitude ramp at 20.8; a wobbling highlight; the glass ticks three times (a 1 px offset per tick) against the plate.
- PETALS: about 600 instanced trail petals (marigold petal sprites, hash rotation). Handful falls (pseudo-3D flip scaleX = cos(spin), flutter, one bounce) at 9.8–12.3. Footprints: oval flatten (scaleY 0.7, 25% darker), radial push of 8–14 px in closed form, 4–6 petals puffing up 10–25 cm. A 150-petal gust vortex at 24.7. A single petal rolling over at 24.35.
- PAPEL PICADO: kit papelPicado with gust() and per-flag angular impulses: a traveling wave at 21.8, an upward whip at 24.7, a slow warm wave at 46.6.
- DOOR LIGHT BLADE: beam() wedge on the floor, widening with the door angle. Cold flash #BFD6DA at +1.2 stops for 3 frames at 24.7. Color lerps from teal to gold over 28.0–30.5. Fog particles at the threshold.
- SLAM CAMERA: hard cut on the impact frame; shake(t, 24.7, 14) at 9 Hz with ±0.6° roll over 0.6 s; a 2% zoom punch with a 10-frame recovery; 4-subframe motion blur only 24.7–25.2.
- CAMERA LANGUAGE: camPath (Catmull-Rom) moves (dolly back at 4.4, lateral dolly at 26.2, pan at 46.6, push at 49.2, outro pull-back and crane at 51.6); handheld at 1–2 px everywhere except the locked silence (24.0–24.7); per-plane dof() rack focus at 9.8–12.3, 32.4 and 46.6.
- GLYPH NUDGE: on-screen glyphs offset by at most 2 px by the presence field (hook lean, dread wave).
- EMBER 28: a radial glow inside the printed 28 (terracotta to gold) with candle flicker. The lockup thins into rising embers (kit particles 'embers') at 51.6–52.2.
- CITY OUTRO: instanced window rects with a per-window flicker hash; the panteón as 120 candle points; about 20 paths as smoothPath polylines stroked twice (2 px core, 6 px blurred glow), revealed by dash offset from 53.8; about 200 gold motes advected along the paths; windows brightening on mote arrival; seven warmer ridge points; low mist bands; petals drifting up.
- LOGO FORMATION: about 6000 gold motes rise from the windows, paths and ridge points along curl-noise paths, attracted to logo pixels sampled from the logo alpha (loadLogo data from scenes/Outro.tsx; centered y≈930, 880 px wide). Per-pixel ignition at the precomputed arrival time, from gold to cream, written through ImageData; complete at 57.2; the city dims to 30%.
- POST (kit Post): grain 0.03; vignette 0.18–0.35; occluder-masked bloom on flames; halation 0.4; paper.png overlay at 8%; shadow and highlight tints per act (teal in the dread, brown and gold after 28.0); exposure keys (−0.4 in the dread, the flash at 24.7, +1.2 for the match flare).
- **typography_moments:** - 0.8–2.0 · 'Mi abuela decía:' · Alike 46 px, sand #E0BB8F, soft mode, y 430, scrim 0.3.
- 1.9–4.4 · «Si la flama se mueve sola, / es que ya llegaron.» · Alike 62 px, gold #F5C242 with #F26D3D glow (the abuela's voice color), whisper mode, y 470. Glyphs lean 2 px with the flame.
- 4.7–7.1 · 'Este año, abuela, / el altar te lo puse yo.' · Alike 60 px, bone #D9CDB6, soft (fade, 6 px rise, blur to sharp), y 390, scrim 0.35.
- 7.5–9.6 · 'Tu foto, esa donde / decías que saliste fea.' · Alike 60 px, bone, soft, y 390.
- 10.0–12.1 · 'Pétalos desde la puerta, / para que sepas llegar.' · Alike 60 px, bone, soft, y 390.
- 12.5–14.6 · 'Tu café de olla. / Siempre le soplabas.' · Alike 60 px, bone, soft, y 390.
- 15.3–18.2 · 'Arrancar la hoja / siempre te tocaba a ti.' · Alike 60 px, bone, soft, y 1180 (below the calendar).
- DIEGETIC CALENDAR PRINT (canvas, inside the safe zone in every framing) · Rye, terracotta numerals with letterpress impression: OCTUBRE / 27 / MARTES (14.8–48.0), then OCTUBRE / 28 / MIÉRCOLES revealed by the tear at 48.0–48.7.
- 28.8–30.5 · 'El Chato te vio primero.' · Alike 60 px, bone, soft, y 400.
- 34.8–37.2 · 'No alcancé a decirte adiós.' · Alike 60 px, bone, soft, y 400.
- 37.6–39.9 · «Ay, ay, ay, ay…» · episode-local SungLine: Alike 60 px, bone, skewX(−8°), letters appearing with the hummed notes. On the break (39.5) the last 'ay' trembles 2 px and dims.
- 40.7–42.5 · «…canta y no llores.» · SungLine: Alike 62 px, gold #F5C242 with #F26D3D glow, skewX(−8°), letters 2 frames apart, slow shimmer from left to right, y 400.
- 44.4–46.4 · '—Tápate, mija.' (with the raya, as live dialogue) · Alike 66 px, gold with warm glow, whisper mode with letters 2 frames apart like a breath, y 320 (above the wall shadows).
- 49.6–51.6 · HOY lockup (episode-local, grown from the calendar) · HOY in Rye 240 px, gold #F5C242 with #F26D3D glow, centered y≈820, letters lifting off the paper on a spring (ζ 0.85, 3-frame stagger). '28 · 10' in Alike 88 px, sand, tracking 0.2 em, centered y≈1080: the canvas Rye 28 cross-fades into the DOM date at matching coordinates as '· 10' fades in. It thins into embers at 51.6–52.2.
- 53.2–55.6 · 'Hoy, en cada altar, / alguien vuelve a casa.' · Alike 64 px, bone, soft, y 400 in the sky band, light scrim 0.3.
- GLOBAL: only Rye and Alike. Every line is clamped with safeY to 262–1568, at most 2 lines on screen. None of the three banned words appears anywhere.
- **audio_cues:** - 0.0–0.3 silence; 0.3 match scratch and flare whoosh; 0.5 wick crackle; room tone at −50 dB.
- 1.3 the room drops to near silence; a wet-glass-rim tone on D6 fades in over 0.6 s at −32 dB; 3.4 flame-recovery flutter.
- 4.4 guitar enters: four rubato notes of the Cielito Lindo verse in D, unresolved; candle bed; city hush at −46 dB; crickets outside, low.
- 8.6 the girl's nasal breath-laugh 'hm' (formant); the tin frame's soft metallic tock just before.
- 9.8–12.3 granular petal patter; thin wind through the door gap; a guitar note per line.
- 12.6 jarrito clink (two modes); steam hiss; a guitar note over a soft low D.
- 15.9 paper rustle at the pinch; 17.6 small hinge squeak; a hanging guitar A that decays by 18.2.
- 18.4 D minor drone (cello harmonics plus 36 Hz sub, −30 to −22 dB); bell tolls at 18.6, 20.0, 21.4, 22.8; wind builds.
- 19.6–21.0 dog growl, lips closed (glottal plus noise, formants near 400/1100 Hz).
- 20.8–21.6 glass ticks against its plate, accelerating, over a rising rim tone.
- 21.8 staggered flame flutters; the crickets cut dead.
- 22.8–23.8 long door-hinge creak.
- 24.0–24.7 true digital silence (all buses muted).
- 24.7 SLAM: wood modal slam, latch rattle, 40 Hz sub boom (1.2 s tail), gust whoosh, papel picado snap, petal swirl, single bark, flame roar. Peak about 4 dB under the legend scares; hush by 26.2.
- 26.5, 27.22, 28.02, 28.74, 29.54 invisible footsteps on petals (shff plus crunch, alternating pan, −28 dB); 26.8 a growl fragment that cuts off.
- 28.0 upward harp glissando in D major; warm string pad; the drone resolves from D minor to D major; 28.4–29.2 happy whine (700 to 1300 Hz); two tail thumps.
- 31.0 and 31.8 two warm close breaths ('fu' formant, −30 dB); steam hiss; 32.0 the guitar begins the verse, slow rubato 3/4.
- 33.5 first chair creak; then a creak on every downbeat (period 1.6 s, two alternating pitches); 35.4 dog sigh.
- 37.4 guitar out; the girl's wordless hum alone (young formant 'mm', D4 to A4, vibrato 5.5 Hz).
- 39.5 her voice cracks into a caught sob; 39.9–40.6 absolute silence (pad cut).
- 40.6 the elderly wordless hum from the chair continues 'canta y no llores' (breathy, vibrato 4.8 Hz, jitter and shimmer, small room reverb, panned 30% toward the chair, doubled by a low flute at −12 dB under it); downbeat creaks resume; 41.6 guitar arpeggios return, pp.
- 42.6 the rocking stops (last creak); 42.9–43.9 rebozo cloth whisper; 43.9 strings swell; 44.0 the girl's breath catch; 44.4 strings drop away, leaving hum and guitar; 44.8 harp sparkle on the first stroke.
- 46.9 the hum ends on a held note; 48.0–48.7 slow crisp paper tear (granular, panning left to right) and flutter; one far bell.
- 49.2 first full cadence on D add9 with a harp arpeggio and a soft low bell under HOY.
- 51.6–55.8 the gentlest full chorus: guitar, harp, string pad, and both hums together (unison, then thirds). Night ambience returns: crickets, wind, distant multi-church bells.
- 55.8–57.2 rising shimmer as the motes form the logo; final cadence D add9 to D.
- 58.0 a single guitar harmonic on the last candle lean; the abuela's last hummed note dissolves; reverb tail to silence by 59.9.
- MASTER: −14 LUFS integrated, true peak ≤ −1 dBTP (sfx.master); LEN = 1800 frames, STANDARD_OUTRO = False in scripts/leyendas/d00.py.

## Injertos de los otros tratamientos

The base is B: the hook that sets the rule, the plants and payoffs, the dread built in the series' own grammar, 0.7 s of digital silence and the slam, invisible footsteps with the dog recognizing her, the café blown twice, the mecedora, «Tápate, mija», the calendar tearing itself into HOY, the city outro with the seven altars on the Santa Fe ridge, motes forming the logo, and the last flame leaning toward the viewer.

From A:
(1) The song that answers. In A the living voice breaks and the dead finishes the song. Here it is sharpened: the granddaughter hums «Ay, ay, ay, ay…» and breaks, there is a beat of absolute silence, and the empty chair hums back «…canta y no llores». The lyric itself becomes the grandmother's consolation, and the gold text keeps it legible with the sound off.
(2) The invisible rig that is rendered only as its projected shadow. At the climax she becomes visible for 4 seconds, only as a shadow on the wall, wrapping the real rebozo around her granddaughter and stroking her hair. That gives B the single image of 'she is here' that it lacked.
(3) The subliminal second shadow in the opening match flare (frames 10–18), which pays off at the climax.
(4) A's lighting method: a darkness layer with radial light holes, one shared flicker, and shadows projected from real light positions.
(5) Both voices singing the chorus together in the outro.

From C:
(1) The second-person voice. After quoting her once, the granddaughter talks to her («Este año, abuela, el altar te lo puse yo»), which makes every plant intimate.
(2) The lines «Tu foto, esa donde decías que saliste fea» and «Pétalos desde la puerta, para que sepas llegar», plus the stylized engraving portrait of her laughing behind her hand (no mouth to draw, no uncanny face).
(3) The crickets that stop dead during the dread and return in the outro.
(4) Glowing paths from a hillside panteón into every house, with gold motes traveling along them, so 'alguien vuelve a casa' is literally visible.
(5) The rule that she casts a shadow only when she touches the living.

Cut or simplified from B for polish and feasibility:
- Third-person narration becomes second person.
- «El Chato no se echaba ahí» is dropped, to make room for «No alcancé a decirte adiós» and the song.
- The dog uses hand-keyed poses only (stand, two steps, circle, lie down) instead of a procedural gait.
- The rebozo cloth drops to 14x22, with its pins driven by the same invisible rig that casts the shadow, so shadow and cloth always agree.
- The calendar tear is done in 2D strips (no WebGL).
- A hard cut lands on the slam frame.
- Floor veladoras are added in front of the altar so the wall shadows are physically correct.
