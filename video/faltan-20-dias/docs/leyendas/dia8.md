# Día 8 · El listón rojo · Los Chaneques (Día 8)

> Before she died, the narrator's abuela tied a red listón around their wrist and left warnings about the chaneques. This year the narrator goes down to the river to pick cempasúchil for her altar. In the still water, something small is standing right behind them. The flowers vanish, then the listón, and from the dark something calls in the abuela's voice. The narrator knows she died in March, and answers anyway. Dozens of eyes open. Every path leads back to the same stone, where the chaneques have laid the listón out as an 8 inside a ring of the stolen petals. The narrator wakes on the roadside thinking one night has passed. They had been searched for eight days. The listón becomes the countdown number.

**Duración:** 49 s + outro

## Recurso

FIRST-PERSON FLASHLIGHT + THE ABUELA'S LISTÓN.
(1) THE BEAM IS THE ONLY LIGHT AND THE ONLY ENGRAVER. Every night shot is the narrator's POV. Whatever the cheap flashlight touches becomes a living Posada print: hatch lines appear in the beam's falloff and vanish in its hot core. The rest is cold teal darkness, and the darkness is the monster. The chaneques live where the beam has just been or hasn't reached yet. The on-screen text is lit by the same flashlight and flickers with it.
(2) THE THREE WARNINGS. The abuela's words work as chapter quotes: «Si el monte te llama, no contestes.» / «No te quites el listón.» / «Los chaneques te esconden las cosas para que los sigas.» The story breaks all three.
(3) THE LISTÓN. The red listón is the only saturated red in the film, and it carries the whole story. It is tied (protection), stolen (protection lost), and laid on the stone as an 8 by the chaneques (their count). Its path is the exact medial axis of the Rye '8', so the same object becomes the lockup numeral with no swap.
(4) THE LOOP. The cold-open stone returns three times in identical framing with more tiny footprints each time, so the lost path is felt rather than told.
(5) TIME AS PREY. The abuela's 1 Hz wall-clock tick follows the narrator into the forest. It goes irregular when the crickets stop, accelerates while they are lost, and dies at the scare. The forest learns her lullaby and the narrator's own voice, and sings both back.
(6) THE SPELL LIFTS AT DAWN. The hatch fades to zero, and the dried flowers in the narrator's hand are the first clue that more than one night has passed.

## Dirección de arte

'GRABADO A LA LUZ DE LINTERNA' (engraving by flashlight). The picture is built from flat 2D planes in depth (kit stage.ts, 5–7 parallax planes per shot). Each plane is painted with form (kit shade.ts paintShape: body gradient, inner shadow, moon rim, texture) and lit per plane, then composited far→near so depth order is guaranteed. On top sits the kit's single WebGL post pass: luminance-driven hatch, bloom, grain, vignette, CA on hits.

THREE COLOR REGISTERS, all anchored to the brand palette:
(a) NIGHT FOREST (B1, B4–B7).
- Darkness floor #0B0703 (deep brown #231305 pulled down, never #000, so IG doesn't band it).
- Moonlight is cold teal: ambient #0F2E2F, rim #7FA0A0 mixed with brand green #1F5C48, shown mainly as 2–3 px rims on trunk, fern and silhouette edges and as glitter on the river.
- Flashlight: a cheap-torch cookie with hot core #EDE3CF/bone #D9CDB6, a faint dark ring at r≈0.3, and a wide sand #E0BB8F halo with a faint terracotta #A83A25 fringe (tungsten feel). Post hatch 0.5–0.6 with ink #0B0703, so engraving lines appear in the beam's midtones and vanish both in the hot core and in the dark.
- Chaneque eyes: core #F5C242, cempasúchil #F26D3D rim bloom, pinpoint pupil. They are the only saturated warm color besides the listón and the flowers.
- Listón: terracotta #A83A25 with highlight #C9553B and twist band #6E2416, clearly fabric (twist banding, frayed ends), never liquid.
- Mud and footprints: brown #2A1A0E/#3A2410, olive-brown with wet specular dots, leaf bits. Never red, never terracotta.
(b) MEMORY (B2). Warm candle sepia: shadows #231305, light #F5C242/#E0BB8F, highlights #D9CDB6. Hatch 0.45 in sepia ink, an oval vignette, ±1.5 px gate weave, one gold light leak, 0.4 Hz warmth warble. It reads like an old print brought to life.
(c) DAWN (B9–B10). Slate blue-grey #5E6E78 sky grading to a gold #F5C242 horizon, fog lifting in layers, dew points. Hatch ramps 0.5→0 across B9 (the spell lifts). Dried flowers in desaturated sand to brown.
(d) TITLE AND LOCKUP. Black-brown #231305 with slow fog, drifting embers and fine hatch. The 8 is a gold→cempasúchil gradient with engraved hatch inside the stroke. FALTAN and DÍAS are cempasúchil #F26D3D (kit default); 28 · 10 is sand.

SETTING: a humid Veracruz-style barranca, where the chaneques come from. Amate and ceiba trunks with buttress roots, lianas, tree ferns, platanillo leaves, mossy river stones, a rocky river, low fog in 2–3 fogBand layers. A tecolote is the only animal seen.

FINISH:
- Animated luminance-weighted grain 3–4% (it also dithers banding).
- Vignette 0.35.
- Bloom only on emissives (eyes, fuse, veladora).
- 1-frame chromatic split only on scare hits.
- Subframe motion blur only on whips, the run and the lunge.

COMPOSITION: the subject sits in the lower 2/3; the dark canopy and fog sit in the upper third, where the text lives.

TYPOGRAPHY: Rye and Alike only, DOM above the post pass (never hatched or blurred).
- Alike Regular for narration (bone #D9CDB6). The abuela's words are Alike in sand #E0BB8F, displayed inside « » guillemets (Alike has no italic, so no faux italic is used).
- Rye for the header «Mi abuela decía:», the punch word «Corrí.», the title and the lockup.
- Every narrative line sits between y=420 and y=620 over a 40–45% #231305 scrim (kit Line scrim). Max width 940 px. Nothing outside y 262–1568.
- Reveal: kit Line 'flicker' tied to the beam flicker table in night shots, 'soft' in memory and dawn, 'slam' for Corrí and the title.

NO HALLOWEEN IMAGERY: no bats, cobwebs or pumpkins.

## Personajes

- **name:** El narrador (yo) · **how_shown:** Never seen whole, and the text is gender-neutral (no gendered adjectives). The narrator exists as POV and as 2D hands and wrists: a warm skin gradient, a cold moon rim on one edge, warm flashlight bounce on the other, the cuff of a dark hoodie. The red listón is on the LEFT wrist in B2–B4; afterwards the wrist is bare with a thin pale pressed line where it was. The right hand holds the flashlight. Exactly once (B4) we see a dark hooded head silhouette, as a REFLECTION in still water, backlit by the reflected moonlit sky, so no face is ever readable. · **motion:** The camera is the body.
- Walking: 1.8 Hz vertical bob of 6 px, ±0.5° roll, two-octave simplex drift (0.35 Hz / 1.1 Hz).
- Running: 3 Hz bob of 18 px, ±2° roll, step jolts.
- Head turns: critically damped springs (k 220, c 18, one small overshoot). The 150° turn in B4 uses k 180, c 16, with 6-sample subframe blur.
- Breathing: drift of the beam aim, 0.25 Hz when calm, 1.2 Hz in panic.
- Hands: a 3-segment 2D IK arm (kit ik2 plus a wrist segment). Cubic ease-in-out reaches; finger curls land with a light spring overshoot.
- Fear tremor: 8 Hz noise of 2 px on the reaching hand and ±1.2° on the beam angle.
- Cupping water: both hands rise and lower over 0.9 s with droplet particles under gravity.
- Flower picking: three stems bend, snap, and the rest of the clump springs back (damped 2.2 Hz, 0.8 s decay).
- **name:** La abuela · **how_shown:** Present only in memory and as a voice. Engraving-style wrinkled hands: cross-hatched form shading, stipple age spots, a thin silver band on the ring finger. The fringed edge of a dark rebozo with fine rayado stripes enters at the top-left. Never a face. In the forest her 'voice' (a wordless old-woman hum of the lullaby and a two-syllable call) is the chaneques' imitation. · **motion:** Slow, sure, loving. Each hand is a 2D skeletal rig: wrist, palm and 3 phalanges per finger, each segment a separate path rotating at its joint, with rounded caps hiding the seams. Fingers move with 2–4 frame offsets for overlap, plus a 5 Hz age tremor of 0.8 px.
- Wrapping: the listón follows a spline around the wrist ellipse, twice, 3.0–4.6 s.
- Knot: the hands part with ease-out cubic and the thread snaps taut.
- Thumb: one stroke over the knot, a 0.9 s ease-in-out arc.
- Pats: two (6 frames down, spring back up).
- Rebozo fringe: 12 strands × 8 points (kit simChain), swaying with her arm motion.
- **name:** Los chaneques · **how_shown:** Small beings about 60 cm tall, knee high. Silhouette: a big round head (a third of the body), broad ears, a wide ragged palm-leaf hat, a potbelly, thin long limbs, oversized knotted four-finger hands, bare long-toed feet. Skin is mud and clay #3A2A1A with moss #1F5C48 flecks. They read as forest tricksters and guardians, never as children, demons or goblins.

They are shown in escalating fragments:
- tiny muddy footprints (7 cm, narrow sole, five round toes, wet glint) that pop into existence with no tween;
- a fern still swinging;
- a petal pulled out of the beam;
- a hatted silhouette standing behind the narrator in the river reflection;
- a silhouette darting between trunks at the beam's edge;
- ~40 gold eye pairs at knee height;
- three silhouettes running parallel between trunks;
- ONE engraved face in the jump scare;
- a muddy handprint on the lens.

The face follows the classic description, an old man's face on a child's body: deep hatched wrinkles, a flat broad nose, huge wide-set gold eyes with tapetum glow and pinpoint pupils, a too-wide CLOSED-lip grin (no teeth, no fangs), moss hair with tangled leaves, and the frayed hat brim casting hatched shadow over the brow. It is lit from below by the beam. No blood, no gore. · **motion:** Animal, uncanny 'hold-and-dart'. Total stillness, then a 2–3 frame anticipation squash (5%), a 4–6 frame dart with motion blur, a 1-frame overshoot, and total stillness again. Stillness is the scary part.
- Head: bird-like snaps of 12° in 2 frames with overshoot, then a slow 1 s drift back.
- Blinks: lids close in 2 frames, hold 2, open in 2. They are never in sync except in the collective moment (B5), when ALL pairs blink at once and tilt 15° in unison.
- Parallel run: a crouched gait at 2.5 strides/s, hat brims bouncing (40-strand radial fringe on kit simChain), eyes leaving short gold streaks.
- Jump-scare lunge: scale 0.55→1.04 in 4 frames (ease-out expo), settling to 1.0 in 6. Head snap-tilt 12°. Pupils contract on frame 3. The grin widens 10% through the hold via a mesh warp. Eye bloom flares. Micro-jitter of 1 px.
- **name:** Tecolote (augurio) · **how_shown:** A small dark owl silhouette on a far branch at the top-left of the descent shot, with a cold moon rim. It is the omen, and the only animal seen. · **motion:** Still, then a 90° head turn toward the camera in 5 frames with overshoot and settle. Its two-note hoot is heard just before.

## Beats

| t (s) | Escena | Cámara | Acción | Texto en pantalla | Sonido |
|---|---|---|---|---|---|
| 0.0–3.0 | B1 · COLD OPEN · La piedra (f0–90) · present, night, riverbank | POV looking down ~35° at a river stone ~1.5 m away. Handheld simplex drift (0.35 / 1.1 Hz, ±5 px, ±0.4°). At 1.45 s a spring whip-pan 18° right (k 220, c 18, one overshoot), drifting back to the stone by 2.5 s. | 0.00–0.15: grain over #0B0703. 0.15: a plastic click, and the beam ignites with a cheap-torch flicker (on 2 frames, off 3, on). It reveals a rounded mossy river stone (grey-green #3B4A44, moss #1F5C48) whose wet specular streaks slide as the beam moves. Dark water streams across the bottom of frame (teal highlight streaks flowing left at 40 px/s). Seven tiny muddy footprints climb over the stone and off into the dark at top-right, their wet edges glinting. Inside the beam's falloff the stone and moss turn to engraving hatch. Fog wisps drift through the cone.<br>1.40: a giggle hard right. The beam whips onto a fern frond that is still swinging (damped 1.6 Hz, 1.2 s decay). Nothing there.<br>2.30: as the beam drifts back, at the dark left edge outside the light (x≈150, y≈1180), two gold eyes open, blink once and vanish (6 frames). It teaches the rule: they live where the light isn't.<br>2.80: the beam's hot spot blooms to warm white, which is the match-cut into memory.<br>Layers back→front: water strip → stone → footprint decals (clipped to the stone) → fern → eye slot (behind the fern plane) → per-plane light → volumetric cone (additive) → post → text. | [0.25–2.95 · Rye 46 px · sand #E0BB8F · tracking .08em · y=430 · flicker with the beam] Mi abuela decía:<br>[0.70–2.95 · Alike 66 px · sand #E0BB8F · y=510/595 · flicker with the beam, dissolves in the bloom] «Si el monte te llama, / no contestes.» | 0.00–0.15 digital silence. 0.15: close plastic flashlight click plus a tiny filament buzz on the flicker. Low river murmur, a soft wind-in-fog bed, sparse crickets. 1.40: a short breathy child giggle (formant 'hi-hi-hi', pitched up, wet reverb, hard right) and a fern rustle. 2.30: the eyes make no sound. 2.55–3.0: a soft rising air swell into the bloom. No music. |
| 3.0–8.2 | B2 · MEMORIA · Las manos de la abuela (f90–246) · kitchen table, candlelight | Top-down close over the table. Slow push-in 1.00→1.06 (sine ease-in-out) across the beat. Soft oval vignette, gate weave ±1.5 px at 0.8 Hz, one gold light leak sweeping left→right 5.0–7.0. | The white bloom resolves into warm sepia candlelight. On a worn floral hule oilcloth (muted green and terracotta pattern), a young LEFT wrist rests palm-up.<br>3.0–4.6: the abuela's engraved hands wrap the red listón twice around it. The loose tail is a verlet rope that flicks with each wrap.<br>4.6–5.5: the knot. Both hands pull apart (ease-out cubic), the thread snaps taut, the knot cinches.<br>5.5–6.6: her thumb strokes the knot once, slowly, then pats the wrist twice. The rebozo fringe sways at top-left.<br>Background: a veladora in a glass (flame2D) whose light breathes across everything, a few loose cempasúchil petals, a clay jarro. The shadow of a wall-clock pendulum sweeps across the table (2 s period, a tick on each swing).<br>7.7–8.2: her hand lifts out of frame, and the veladora smoke curls up across the image (transition).<br>Layers: hule → petals and jarro → wrist → listón (under the fingers where they grip, over the wrist) → abuela hands → rebozo fringe → veladora (the flame is emissive after lighting) → smoke → post → text. | [3.40–5.25 · Alike 64 px · sand #E0BB8F · y=440 · soft] «No te quites el listón.»<br>[5.35–8.10 · Alike 62 px · sand #E0BB8F, the word 'chaneques' in cempasúchil #F26D3D · y=420/500/580 · soft] «Los chaneques / te esconden las cosas / para que los sigas.» | Warm room tone with light tape hiss. A wooden wall-clock tick at exactly 1 Hz: THE MOTIF. Veladora crackle, cloth rustle, a thread squeak at 5.4 as the knot cinches, two soft pats (6.15, 6.45). Music: the traditional lullaby 'A la roro niño' (anonymous, public domain), reharmonized in D minor, 3/4 at 66 bpm, on nylon-string guitar with a soft harp counterline, with a ±8 cent memory warble at 0.4 Hz. |
| 8.2–11.6 | B3 · Bajé al río (f246–348) · present, blue hour, descending the barranca | POV walking downhill: a forward dolly through parallax planes (far ridge 0.05, fog A 0.15, far trunks 0.3, mid trunks 0.6, near ferns and platanillo 1.4), step bob 1.8 Hz. At 10.2 a spring tilt-down of 14° onto the riverbank. | 8.2–8.8: the veladora smoke advects the kitchen away (noise-displacement dissolve) and the smoke becomes forest fog. A humid barranca at blue hour: amate and ceiba trunks with buttress roots and moon-rimmed left edges, lianas, tree ferns, a sliver moon high in the dark upper frame, the river glinting far below.<br>9.4: on a far branch at top-left, a tecolote snaps its head 90° to watch the camera (5 frames, overshoot).<br>10.2–11.5: the tilt down finds a wild cempasúchil clump on the bank, the only warm color in frame. The LEFT hand enters bottom-left, red listón on the wrist, grabs three stems and snaps them. The clump springs back, and the hand pulls the bunch out of frame. | [8.45–11.45 · Alike 64 px · bone #D9CDB6 · y=430/512 · soft] Este año bajé al río / por flores para su altar. | Footsteps on dry leaves and gravel, alternating L/R at 1.8 Hz. The river grows louder; crickets and frogs. 9.15: one two-note tecolote hoot, far left, just before the head turn. 11.0: three stems snapping. Music: the lullaby phrase on a lone clay barro flute over a cold cello drone on D. At the phrase end a single requinto jarocho pluck answers, slightly detuned. |
| 11.6–17.4 | B4 · El río · Las flores ya no estaban (f348–522) · night has fallen | Hard cut. POV kneeling at the water's edge, looking down ~50°, locked with breathing micro-drift. 13.75: a whip-turn of 150° right (spring k 180, c 16, 6-sample subframe blur) to the dark bank. 14.30: a whip back. The flashlight is then hand-held and aimed. | 11.6: night. The flashlight lies wedged on a stone at the right edge. Its beam pools on a flat rock at mid-left where the cempasúchil bunch rests (a warm pool, hatched falloff). The bottom 45% of frame is still, black-teal water holding the reflected moonlit sky and canopy.<br>11.8–12.7: both hands enter and cup water, listón visible on the left wrist. They lift out at the bottom of frame (drinking) and drops fall back; the ripples decay over 1.0 s.<br>12.8–13.7: the settled water reflects the sky. The narrator's dark hooded head silhouette sits at center, and just behind its right shoulder a small silhouette with a ragged palm-hat brim and two gold points for eyes stands perfectly still. 13.35: its head snap-tilts 12°.<br>13.75: the reflection's head jerks; whip-turn. The bank behind holds dark buttress roots with moon rims and one fern still swinging. Nobody.<br>14.30: whip back. The right hand snatches up the flashlight (the beam swings up on a spring) and aims it at the rock: EMPTY. A trail of single petals leads from the rock into the trees, one every ~40 cm, shrinking into the dark.<br>15.50: the last petal at the beam's edge jerks 10 cm sideways out of the light (a pop, no tween, no sound).<br>16.0–17.3: the left hand rises into the beam and turns 25° (1.2 s, ease-in-out). The wrist is bare: a thin pale pressed line where the listón was. The fingers spread.<br>Layers: reflected-sky buffer (sky → canopy → narrator head → chaneque silhouette with eyes), flipped, rippled and tinted into the water → water surface glints → bank and rock → bunch / petal trail → hands → flashlight prop → light → post → text. | [14.50–16.00 · Alike 64 px · bone · y=440 · flicker with the beam] Las flores ya no estaban.<br>[16.10–17.35 · Alike 72 px · bone · y=440 · flicker with the beam] Ni el listón. | Close river, crickets, frogs. 11.8: water cupped and drunk, drips. 12.8: a faint low drone swells under the reflection; there is no sting, and the silence of the image does the work. 13.35: a tiny leaf rustle. 13.75: a whip whoosh and cloth. 14.30: the flashlight scrapes on stone. 14.45: ALL crickets and frogs stop at once (hard cut); the river drops to −30 dB. Faint and slightly irregular (±40 ms jitter), the abuela's clock tick returns. 15.50: the petal pop is completely silent. 16.0: a shaky inhale. |
| 17.4–24.6 | B5 · La voz (f522–738) · the imitated voice; the answer; the eyes | POV static, the beam aimed where the petal trail ends. 18.3: a slow search left–right (sinusoidal 0.4 Hz, ±10°). 22.0: a spring whip-pan 30° left. 22.5: a slow tilt down 12° (ease-in-out), as if giving in. 23.75: locked with an 8 Hz tremor. 24.0: a slow push 1.00→1.04. | 17.5: the voice begins in the dark beyond the beam.<br>18.3–19.6: the beam passes over fog-wrapped trunks. 18.90–19.17: at the beam's left edge a knee-high hatted silhouette scampers from behind a mid trunk to behind a near trunk (drawn on its own plane BETWEEN the mid- and near-trunk planes). The beam arrives 0.3 s late: only fog swirling where it passed (a vortex injected into the fog flow along its path, 1.5 s decay).<br>20.2–22.0: total stillness; only the beam trembles.<br>22.0: the call again, close-left. Whip-pan: a low branch still bouncing, and deep behind it two gold eyes blink once (6 frames) and are gone.<br>22.5–23.7: the beam sinks toward the ground.<br>23.75–24.0: dead stillness.<br>24.0: ~40 gold eye pairs open AT ONCE all around in the darkness, all at knee height. They sit at depths of 2–15 m, sized and blurred by depth, each in its own depth slot so nearer trunks and fronds occlude it. The nearest pair, 1 m away at lower right, is half hidden behind a fern frond. 24.25: every pair tilts 15° in unison. 24.45: every pair blinks at once.<br>24.6: hard cut. | [17.60–20.00 · Alike 64 px · bone · y=430/512 · flicker with the beam] Algo me llamó / con la voz de mi abuela.<br>[20.20–22.00 · Alike 66 px · bone · y=470 · soft, held in total silence] Mi abuela murió en marzo.<br>[22.40–23.75 · Alike 66 px · bone · y=470 · flicker] Y aun así, contesté. | 17.5: far in the dark, ahead-right, an old woman's hum (formant 'mm', long wet reverb) of the lullaby's first phrase from B2, slightly off-pitch. 18.6: a two-syllable call (falling minor third, vowels 'a–o', old female timbre, unintelligible). 18.9: a tiny rustle L→R. 20.2–22.0: SILENCE, room tone at −60 dB with a faint 8 kHz tinnitus. 22.0: the call again, close-left and DRY; its second syllable glitches up an octave into a child's giggle (pitch plus formant shift). 22.7: the narrator's shaky inhale and a breathy, unintelligible whispered reply ('¿a…?'). 23.0–23.6: that SAME reply comes back from the dark three times (left, right, behind), each copy pitched up a little. 23.75–24.0: digital zero. 24.0: eruption: a low hit, ~8 giggle voices panned all around, and a music-box cluster chord built from the lullaby's notes. 24.45: a barely audible collective wet blink tick. |
| 24.6–28.3 | B6 · Corrí · La misma piedra (f738–849) · lost path, loop | POV running: 3 Hz bob of 18 px, ±2° roll, a fast forward dolly, near branches and platanillo leaves whipping past with 6-sample subframe blur. Match-cuts at 25.50, 26.40 and 27.30 to the EXACT framing of the B1 stone. From 27.30 the shake decays (ease-out) to stillness by 28.3. | 24.6–25.5: a sprint through trunks; ferns slap across the lens; mud splashes (brown, never red). Gold eye pairs streak at the frame edges, keeping pace.<br>25.50: match-cut to the B1 stone with ~15 footprints.<br>25.85: running again. 26.10: a flash of three knee-high silhouettes running parallel between background trunks, crouched, hat brims bouncing, each occluded by the trunks in front of it.<br>26.40: the stone again, ~40 footprints, some fresh and glistening.<br>26.75: running.<br>27.30: the stone a third time, covered in hundreds of footprints in concentric rings. The beam slows and steadies as the narrator stops. | [24.70–25.45 · Rye 84 px · bone · y=470 · slam on the first footfall] Corrí.<br>[25.55–28.20 · Alike 64 px · bone · y=430/512 · soft, fixed over a 45% #231305 scrim while the shots cut underneath] Y siempre volvía / a la misma piedra. | Running footsteps on leaves at 3 Hz, panting, a heartbeat at 110 bpm that merges into the drums. Teponaztli and huehuetl pulses accelerate under muted jarana scrapes (ostinato). The clock tick accelerates from 1 Hz to 4 Hz. Each match-cut lands a deep wooden teponaztli knock with a reverse swell. A string-cluster glissando rises underneath; giggles circle L↔R; branch whooshes. 28.1: EVERYTHING stops at once. |
| 28.3–31.6 | B7 · El 8 en la piedra · JUMP SCARE (f849–948) | POV standing over the stone. Slow push 1.00→1.16 (ease-in quad) over 2.6 s, minimal handheld. 31.00: a camera-shake impulse (14 px, spring decay 0.4 s) and a 1-frame 10 px chromatic split. | The beam settles to the center of the footprint rings. There lies the red listón, laid out with deliberate care as an upright 8 (top loop smaller, ends tucked, wet, dew beads glinting), seen at a 40° oblique so it reads as a foreshortened 8. Around it, the stolen cempasúchil petals are placed in a careful ring, an eerie imitation of an altar.<br>30.40: the left hand (bare wrist, pale line) enters from the bottom, trembling (8 Hz, 2 px), and reaches slowly for the listón (0.6 s ease-in-out).<br>31.00 JUMP SCARE: from the bottom-right edge, between lens and stone, a chaneque face lunges up into the beam, filling ~70% of frame about 25 cm from the lens. It is the engraved old-man face on a child's head (see the character), lit from below by the beam. Lunge 0.55→1.04→1.0, snap-tilt 12°, pupils contract on frame 3, the grin widens, the eyes flare. Held 31.00–31.43 (13 frames).<br>31.43: the flashlight is dropped. The beam whips down, flickers twice and dies by 31.6.<br>Layers: stone → footprints → petal ring → listón and dew → hand → FACE (in front of everything) → light → post. |  | 28.3: near-total silence. A single water drip every 1.1 s (28.5, 29.6, 30.7) and an 8 kHz tinnitus at −40 dB fading in. 30.90–31.00: 0.1 s of digital zero. 31.00 STAB: a 35–40 Hz sub boom, a noise burst, a detuned string cluster (D–E♭–A♭), a synthesized Aztec death-whistle shriek (resonant noise through high-Q bandpasses sweeping 3.5→1.5 kHz) and a distorted pitched-up giggle. The scare lands BEFORE the expected 31.8 drip. 31.43: the flashlight clatters on stones, with an electric fizz. 31.60: a hard cut of the tail. |
| 31.6–33.8 | B8 · Negro · TÍTULO (f948–1014) | Locked, with a slow push 1.00→1.04. | 31.60–32.00: black #0B0703, grain only.<br>32.00: 'LOS' (small) / 'CHANEQUES' (large) slam from scale 1.3→1.0 in 6 frames (cubic-out, a 1-frame undershoot to 0.98) onto black with slow fog and faint hatch. The impact kicks up mud specks and torn leaves (2D ballistic particles with drag) that settle. Gold letters with a cempasúchil edge glow and engraved hatch inside the strokes; a slow light sweep crosses them at 32.9.<br>32.35: the altar line fades up.<br>33.50–33.80: everything sinks into fog, carrying us into dawn. | [32.00–33.70 · Rye 70 px / 128 px · gold #F5C242 with cempasúchil #F26D3D edge glow · y≈760–960 · slam] LOS / CHANEQUES<br>[32.35–33.70 · Alike 48 px · sand #E0BB8F · y≈1010 · soft] Altar 7 · Ala Norte | 31.60–31.85: silence. 31.85–32.00: a 0.15 s reverse swell. 32.00: a huehuetl hit, a low 'oo' choir in D minor and a saturated D1/D2 saw swell (a short BRAAAM). The tail decays into first dawn birds by 33.8. |
| 33.8–37.4 | B9 · Amanecer · A la orilla del camino (f1014–1122) | Ground-level POV, lying on a dirt road shoulder. Rack focus from the foreground hand to the treeline, 33.8–35.6. 35.9–37.4: a slow rise of 60 px (ease-in-out), as if sitting up. | The fog clears in a 1.0 s exponential fade-in to dawn: a pale blue-grey sky grading to a gold horizon behind a treeline of ceiba and amate silhouettes, fog lifting in layers, dew on the dirt. The hatch amount ramps from 0.5 to 0 across the shot as the spell lifts.<br>Foreground: the narrator's hand clutches the cempasúchil bunch. It came back, and it is DRIED: desaturated sand-to-brown, petals curled (petal shapes at scale-y 0.7). In the breeze, petals crumble off and drift away (tumbling particles with drag and wind). The wrist is still bare. This is the first visual clue that more than one night has passed. | [33.95–35.70 · Alike 62 px · bone · y=430/510 · soft] Desperté a la orilla / del camino.<br>[35.80–37.35 · Alike 62 px · bone · y=470 · soft] Para mí, fue una noche. | Dawn birds (synthesized chirps, sparse), a distant church bell tolling twice, a far dog bark, wind through dry leaves, a papery crumble as the petals break. Music: a solo harp states the lullaby's first phrase gently in D minor. It is relief that doesn't quite feel safe. |
| 37.4–39.6 | B10 · Ocho días (f1122–1188) · back at the stone, at dawn | Cut to a top-down crane over the stone, slowly rising and rotating 8°→0° (ease-out) so the listón 8 becomes perfectly upright and frontal for the first time. | The forest at dawn, empty. The stone still bears hundreds of tiny footprints in rings, and the ring of now-dried petals. At the center sits the listón 8, beaded with dew. A first warm sunbeam (a gold god ray) slants through the trunks toward it. One dried petal falls and lands beside the 8. The audience now understands what the 8 was: their count. | [37.55–39.50 · Alike 66 px · bone, the word 'ocho' in gold #F5C242 · y=430 · soft] Me buscaron ocho días. | The birds cut out at 37.4. Only wind remains, with a low swell and one low nylon-guitar D under the line. |
| 39.6–40.9 | B11 · El listón se vuelve número (f1188–1227) | A top-down push-in until the 8 fills x-center, y≈610–1250, then lock. | 39.6: the sunbeam touches the bottom loop, and light travels along the listón like a fuse. The ember head is #F5C242 with an orange #F26D3D trail, shedding sparks perpendicular to the path, and it traverses the whole closed figure-8 path in 1.0 s (ease-in-out). Behind the head the thread becomes an incandescent gold line with soft bloom, a faint terracotta core still visible. Stone, footprints, petals and fog darken and dissolve into deep brown #231305 with drifting embers.<br>40.55–40.85: the incandescent ribbon swells from its 18 px width outward to the glyph edges, clipped to the Rye '8' outline, into the solid Rye '8' with a gold→cempasúchil gradient and engraved hatch inside the stroke. Because the listón path IS the glyph's medial axis, there is no swap. | [the numeral is the listón itself, becoming the Rye glyph] 8 | A fuse crackle travels along the path, panned to follow the ember head, under a rising whoosh. 40.60: a deep boom with a long tail and a marimba bell note as the loop closes and the glyph forms. |
| 40.9–44.5 | B12 · Lockup + remate (f1227–1335) | Static frontal, breathing scale 1.000→1.015. 44.05: a one-frame 14 px kick. | 'FALTAN' drops in above with the kit's letter stagger, 'DÍAS' appears below, and '28 · 10' fades up. The 8 pulses like an ember at 0.8 Hz; a few embers orbit it.<br>THE STING:<br>42.70–43.60: tiny muddy footprints pop one by one (0.12 s apart) out of the dark at bottom-right, walking toward the camera (imagery only, y≈1600–1820).<br>43.70: two gold eyes open in the dark at lower-left (x≈190, y≈1660) and blink once.<br>43.90: a close, dry giggle.<br>44.05: SLAP. A small four-finger muddy handprint hits the LENS at lower-left (x 70–390, y 1500–1820, clear of all text), refracting and blurring the image behind it. The mud slides 30 px down.<br>44.50: hard cut to black. | [40.95–44.50 · LeyendaLockup] FALTAN (Rye 92 px · cempasúchil #F26D3D · y=470) · 8 (the listón turned into the Rye glyph, ≈640 px tall · gold→cempasúchil · y≈610–1250) · [41.15–44.50] DÍAS (Rye 92 px · cempasúchil · y=1290) · [41.55–44.50] 28 · 10 (Alike 52 px · sand #E0BB8F · tracking .2em · y=1418) | The lullaby's last phrase on a music box, the final note a quarter-tone flat. Tiny pattering footsteps 42.7–43.6. 43.90: a soft giggle, close and centered, completely DRY (no reverb), as if right next to the viewer. 44.05: a wet slap and a low thud. 44.50: a hard cut to silence. |
| 44.5–49.0 | B13 · Outro Westhill estándar (f1335–1470) | Standard outro framing. | The standard 4.5 s animated Westhill logo outro, unchanged: the logo ignites with an irregular fire front, holds inside the cempasúchil and veladora surround, then dissolves into embers and smoke. | (Westhill logo, standard outro) | Standard outro audio: ignition, fire bed, the 4-note marimba signature, a glittering exhale on the fade. Optionally, a faint reversed giggle in the first 0.3 s as a last wink. |

## Sustos

- **t:** 1.4 · **what:** A giggle hard right; the beam whips to find only a fern still swinging. At 2.3 two gold eyes blink once in the dark outside the beam. · **why_it_works:** In under three seconds it sets the visual rule for the whole video: the threat is close, fast, and lives where the light isn't. From here on the viewer scans the dark edges of every frame.
- **t:** 12.8 · **what:** In the still river water, a small hatted silhouette with gold eyes stands just behind the narrator's reflected shoulder. It snap-tilts its head; the narrator whips around, and there is nothing. · **why_it_works:** Hitchcock suspense in POV: the audience sees it a beat before the narrator reacts. A reflection is a primal 'behind you' image, and the empty bank denies release.
- **t:** 14.45 · **what:** The rock is empty and every cricket and frog stops at once. A petal is pulled out of the beam with no sound, and the wrist is bare: «Ni el listón.» · **why_it_works:** Nature going silent is an instinctive danger cue. The untweened, silent petal pop breaks physics without announcing itself. Losing the abuela's protection last makes everything after it feel unguarded.
- **t:** 18.9 · **what:** A small hatted silhouette darts between trunks at the beam's edge; the beam arrives late to swirling fog. · **why_it_works:** It is partial, peripheral and gone before the light lands, so the brain fills in the creature.
- **t:** 20.2 · **what:** «Mi abuela murió en marzo.» held in total silence, right after hearing her voice. · **why_it_works:** A psychological chill that hits the Día de Muertos nerve: everyone wants that voice to be real. So «Y aun así, contesté.» is heartbreaking and terrifying at once.
- **t:** 22 · **what:** The call repeats close and dry, and its second syllable glitches into a child's giggle. Then the narrator's own whispered reply comes back from three directions. · **why_it_works:** The imitation 'slips', which makes the legend's voice-mimicry audible. Hearing your own voice returned from the dark is the most personal form of it.
- **t:** 24 · **what:** After 0.25 s of digital silence, ~40 gold eye pairs open at once all around. They all tilt 15° together, then all blink. · **why_it_works:** It pays off the broken warning. The scale of the threat shows at every depth layer, and the synchronized tilt and blink suggest one mind behind many bodies.
- **t:** 27.3 · **what:** The third return to the identical stone, now covered in hundreds of tiny footprints in rings. · **why_it_works:** Repetition with escalation. The identical framing makes the loop felt, and the multiplying prints say they have been circling you the whole time.
- **t:** 31 · **what:** MAIN JUMP SCARE: as the trembling hand reaches for the listón 8, the engraved chaneque face lunges up from the bottom-right into the beam, underlit, inches from the lens, with a death-whistle shriek. Then the flashlight dies. · **why_it_works:** Attention is locked on the listón and the hand at center, and the face comes from the bottom-right corner nobody is watching. It follows 2.6 s of near silence with a drip rhythm, lands early inside the 0.1 s digital-zero gap, and the dying light denies a second look. Engraved stylization and a closed-lip grin keep it tasteful at 13 frames.
- **t:** 43.7 · **what:** Over the lockup, tiny footprints walk toward the camera, gold eyes blink at lower-left, a dry giggle sounds, and a muddy handprint slaps the lens. · **why_it_works:** A sting after the viewer has relaxed into the golden countdown. The dry giggle and the touch on the lens put the chaneque in the room, and all lockup text stays readable.

## Revelación del número

The 8 is the chaneques' own sign, planted mid-story and explained by the twist.
- 28.3 s: the stolen red listón is found laid out as an 8 at the center of the footprint rings, inside a ring of the stolen petals. It is foreshortened at a 40° POV angle, so the viewer reads it without yet understanding it.
- 37.4 s: after «Para mí, fue una noche.» we cut back to the stone at dawn while «Me buscaron ocho días.» appears (with 'ocho' in gold). A top-down crane rotates the 8 upright and frontal for the first time, and the meaning lands: they were counting.
- 39.6 s: the first sunbeam touches the thread and light runs along the listón like a fuse (ember head, spark trail, 1.0 s), turning it into an incandescent gold line while the stone dissolves into deep brown.
- 40.55 s: the ribbon swells into the solid Rye '8'. The listón path was built from the start as the medial axis of the exact Rye '8' glyph at lockup size, so the object literally becomes the numeral with no swap or jump.
- LeyendaLockup then settles FALTAN above, DÍAS below and 28 · 10 beneath, all inside y 470–1470.

## Música

CONCEPT: the abuela's lullaby, which the forest learns to sing back.

THEME: the traditional Mexican lullaby 'A la roro niño' (anonymous, public domain), reharmonized in D minor, 3/4 at 66 bpm, transcribed from a traditional source. Fallback if recognizability can't be verified: an original 8-bar D-minor cradle melody (A4–F4–A4–F4 | G4–F4–E4–D4) built on the same falling-third call cell. The horror sections use D Phrygian colour (E♭). No modern songs.

BY SECTION:
- B1: no music, only river, wind and silence.
- B2 memory: nylon-string guitar and soft harp (Karplus-Strong plus body filter), a ±8 cent warble at 0.4 Hz, and the 1 Hz wall-clock tick as rhythmic bed.
- B3: the same phrase on a lone clay barro whistle (sine plus breath noise plus vibrato) over a cello drone on D. A detuned requinto jarocho pluck answers the phrase (son jarocho colour for the Veracruz origin of the chaneques).
- B4–B5: the music drops out. The forest's 'voice' is a formant old-woman hum of the lullaby's first phrase, then a falling-minor-third call that glitches into a child's giggle. 24.0: a music-box cluster chord built from the lullaby's notes.
- B6 run: a 110 bpm heartbeat merges into accelerating teponaztli (two modal wood resonators) and huehuetl (membrane sweep 80→45 Hz). Muted jarana scrapes (noise through a comb filter) as ostinato, the clock tick accelerating 1→4 Hz, a rising string-cluster glissando, a low teponaztli knock with a reverse swell on each match-cut, and a hard stop at 28.1.
- B7: a drip rhythm and 8 kHz tinnitus, then the stab: sub boom, noise burst, D–E♭–A♭ string cluster, a synthesized Aztec death whistle and a distorted giggle.
- B8 title: huehuetl hit, low 'oo' choir in D minor, a short saturated saw swell on D1/D2.
- B9: solo harp, lullaby first phrase.
- B10: one low nylon D.
- B11: fuse crackle, whoosh, deep boom and a marimba bell.
- B12: the lullaby's last phrase on a music box, the final note a quarter-tone flat, then a dry giggle and the slap.
- Outro: standard Westhill audio.

MIX: convolution reverb with synthesized IRs (forest: long and dark; kitchen: small and warm). The close call, the final giggle and the slap are fully dry. The silences (31.6–31.85, 23.75–24.0, 30.9–31.0) are true digital zero. Master at −14 LUFS integrated, true peak ≤ −1 dBTP (sfx.master).

## Diseño sonoro

- Plastic flashlight click with filament flicker buzz; a dying flicker and an electric fizz; flashlight clatter on stones and a scrape on stone
- Child giggle variants (formant 'hi-hi-hi'): far and wet, close and dry, shrieking and distorted (scare), an ~8-voice surround eruption, a final dry centered giggle
- Fern and branch rustles; a bouncing branch; leaf rustles darting L→R
- River murmur (layered noise with gurgle grains), frogs, single water drips at 1.1 s intervals
- Crickets bed (3 species) with a hard stop at 14.45
- Wind-in-fog bed; dawn wind through dry leaves
- Wall-clock wooden tick: steady 1 Hz, irregular (±40 ms), accelerating 1→4 Hz, then stopped
- Veladora flame crackle; kitchen room tone with light tape hiss
- Rebozo cloth rustle, the listón thread squeak as the knot cinches, two soft pats
- Footsteps on dry leaves and gravel (walk at 1.8 Hz, run at 3 Hz); mud splashes
- Three cempasúchil stems snapping
- Tecolote two-note hoot (far left)
- Water cupped and drunk, drops falling back into still water
- Whip whooshes with cloth rustle for the head turns
- Old-woman formant hum (lullaby phrase) and a two-syllable call (falling minor third, vowels a–o) that glitches into a child giggle
- The narrator's shaky inhale and breathy unintelligible reply; three pitched-up echoes of that same reply from the dark
- Collective soft wet blink tick (barely audible)
- Panting breath; heartbeat at 110 bpm
- Teponaztli and huehuetl pulses; a deep teponaztli knock with reverse swell on match-cuts
- Muted jarana scrapes (ostinato); a requinto jarocho pluck
- String-cluster glissando riser
- 8 kHz tinnitus sine at −40 dB
- Jump stab: 35–40 Hz sub boom, noise burst, D–E♭–A♭ detuned string cluster, synthesized Aztec death-whistle shriek, distorted giggle
- Reverse swell; title hit (huehuetl, low choir 'oo', saturated saw swell); mud and leaf burst on the title slam
- Dawn birds (sparse), a distant church bell tolling twice, a far dog bark
- Dry petals crumbling
- A fuse crackle travelling along the path (auto-panned), rising whoosh, deep boom with a long tail, marimba bell note
- Music-box notes (lullaby cluster chord; final phrase with a quarter-tone flat last note)
- Tiny pattering bare footsteps
- A wet slap of a small hand on the lens and a low thud
- Standard Westhill outro audio

## Factibilidad

STACK: src/leyendas/d08_chaneques.tsx using the existing leyendas kit. EP08_LEN = 1335 (44.5 s at 30 fps); scripts/leyendas/d08.py has LEN = 1335 and STANDARD_OUTRO = True, so the total is 1470 frames (49.0 s). One Scene (kit/scene.tsx) repaints a 1080×1920 canvas per frame. paint(g, f, t) dispatches to one painter per beat and returns PostOpts per frame: hatch, hatchInk, bloom, grain, vignette, ca, flash, fade. Text is DOM through kit Line and LeyendaLockup, above the post pass. Everything is a pure function of frame. Randomness comes from hash/noise2D. All simulations are precomputed and cached: simChain/simCloth, the spring tables for whip-pans, fern springs, the flicker table, the eye-pair placements and the footprint Poisson sets.

PER-PLANE LIGHTING (this prevents layer errors and makes the emissive eyes occlude correctly):
- Each frame builds a light map once: moon ambient at ~4–6% plus the flashlight cookie (kit flashlight shape: hot core, ring, halo), with aim from springFollow and intensity × flicker table.
- Each depth plane is drawn as albedo into a scratch canvas (kit stage.ts onPlane), multiplied by the light map, then composited onto the main canvas FAR→NEAR.
- Emissive eyes are drawn additively immediately after THEIR OWN plane's composite, so nearer planes painted afterwards occlude them. Eyes never go on a global top layer.
- The volumetric cone is an additive kit beam wedge times fogBand noise, drawn after all planes.
- Moon rims come from paintShape's rim pass.

HATCH: the kit post hatch is luminance-driven, with lines living in the shadows. Night shots use 0.5–0.6 with dark-brown ink, so lines appear in the beam's falloff and midtones and vanish in the hot core and in the darkness. That is the device, with no custom shader needed. Memory uses 0.45 with sepia ink. Dawn ramps 0.5→0. The jump-scare face carries its own drawn hatch strokes, and the post is pushed to 0.7 on those 13 frames.

ENVIRONMENTS:
- Trunks: tapered béziers with noise-displaced edges. Buttress roots are 5–9 fin curves. All of these are cached per plane.
- Ferns: L-system fronds pre-rendered once, swaying by rotation about the base, with spring impulses when brushed (precomputed damped oscillators).
- Platanillo leaves: bézier shapes. Lianas: simChain ropes.
- Stone: paintShape with moss surface textures and a wet specular map that only sparkles inside the beam.
- Footprints: vector decals (oval sole plus 5 toe dots) clipped to the stone Path2D, in sets of 7, 15, 40 and hundreds placed on Poisson rings. They pop on fixed frames with no fades.
- River: horizontal bands with scrolling noise glints.
- Reflection (B4): a separate 'reflected sky' canvas (sky gradient, canopy silhouettes, the hooded head silhouette, the chaneque silhouette with eyes), flipped and drawn into the water area with kit reflect ripple displacement (ripples decay after the drink) and a teal tint.
- Kitchen: hule pattern via kit surface plus a printed-floral tile drawn once, veladora (kit flame2D plus glass), petals (kit marigold sprites), clay jarro (paintShape), pendulum shadow (a blurred rotated rect).
- Smoke transition: kit smoke plus a noise-displacement dissolve.
- Dawn: a gradient sky, treeline silhouettes, 3 fogBand layers lifting, dew speckle, god ray via kit beam.

CHARACTERS (all 2D):
- POV hands: 3-segment IK arm (kit ik2 plus wrist) with finger rigs. Each phalanx is a rounded path rotating at its joint; skin gradient plus rim; tremor from noise.
- Abuela hands: the same rig with engraved fill (hatch strokes clipped to each segment, stipple spots), plus the rebozo fringe (simChain, 12×8).
- Listón wrap: a spline around the wrist ellipse plus a 30-point simChain tail. The ribbon renderer strokes 9–22 px with light and dark bands along arc length to fake twist, and frayed tucked ends.
- Chaneque silhouette: a 10-bone 2D rig (head, hat brim, torso, 2×2 arms, 2×2 legs) with keyframed hold-and-dart timing, a hat fringe of 40 simChain strands, and paintShape with moon rim.
- Jump-scare face: ~60 hand-authored bézier strokes in a JSON constant (wrinkles, brow, nose, lips, cheek folds, ears, hat brim) plus hatch stroke sets, glossy radial-gradient eyes with animated lids and pupils, and an 8×8 mesh warp (drawImage slices) for the grin and tilt. It is underlit with a vertical light gradient and has moss hair on simChain.
- Eyes: layered radial gradients (core, rim, pupil) with lid masks. About 40 pairs are placed in depth slots between trunk planes, with size and blur set by depth (kit dof).
- Tecolote: a single silhouette with a 2-part head rotation.

THE 8 (offline precompute, scripts/leyendas/d08_ocho.py):
- fontTools (with brotli) decodes public/fonts/Rye-Regular.woff2 and extracts the '8' outline at lockup size (≈640 px digit height, centered at x=540, y≈930).
- Rasterize at 2×, build an SDF (scipy distance_transform_edt), skeletonize (Zhang-Suen), prune spurs under 25 px, and order the result into ONE closed figure-8 traversal through the waist crossing.
- Resample at 2 px of arc length and smooth, then export JSON: centerline points, cumulative arc length and the glyph contour commands.
- In the browser:
  - The stone view is the centerline under a 40° perspective homography plus the ribbon renderer.
  - The fuse is an arc-length parameter s(t) with ease-in-out. The ember head is a kit glow plus 20–40 spark particles per frame along the path normal.
  - The swell into the glyph is the centerline stroked with lineWidth growing 18→240 px, clipped to the glyph Path2D, so it fills the glyph exactly with no shader.
  - The glyph fill uses a gold→cempasúchil gradient plus a hatch pattern.
- LeyendaLockup (top=470, bottom=1290, date at 1418) aligns with the same metrics.

CAMERA: kit camPath, handheld and shake. Whip-pans use springFollow with precomputed spring tables. Motion blur is manual subframe accumulation inside paint (6 samples at 1/6 alpha) ONLY for the moving layers during whips, the run and the lunge.

TRANSITIONS: a bloom white-out match cut (B1→B2), a smoke advection dissolve (B2→B3), hard cuts elsewhere, and a fog sink after the title.

PERFORMANCE: static planes are cached (kit cached); fern sprites, the hule, the stone and decals are pre-rendered; fog uses kit fogBand tiles. The only WebGL is the single kit post pass, and there is NO 3D in this episode. An optional small-detail extra, the listón as a thin three.js tube with dew beads, should be skipped if render time exceeds budget; the 2D ribbon is the default.

AUDIO: scripts/leyendas/d08.py score(bus), built from leyendas_sfx (giggle, whisper, owl, crickets, clock_tick, heartbeat_seq, music_box_detuned, stinger, sub_drop, reverse_swell, drone_dark, riser, glottal/formants/vowel_glide for the hum, call and reply echoes, stereo) plus music (Karplus-Strong nylon, harp, requinto, jarana) and new helpers in d08.py: death_whistle, teponaztli, huehuetl, fuse_crackle, barro_flute, drip and slap. Mastered by sfx.master.

## Riesgos

1) SENSITIVITY OF «Mi abuela murió en marzo.» It may touch viewers in recent grief. It is respectful and brief, and the voice is framed as the chaneques' lie, so Día 0 can own the tender 'they really are here' payoff. Flag it to the client. The fallback is «Mi abuela ya no está.»
2) TEXT DENSITY: 16 short cards (~82 words) in 44.5 s, about 2 words/s. Every card meets ≥0.3 s + 0.25 s/word except «Las flores ya no estaban.» (1.5 s for 1.55 s). If a phone test feels rushed, drop «Ni el listón.» (the bare wrist tells it) and give its time to B4's first line.
3) DARKNESS AND IG COMPRESSION: floor the blacks at #0B0703, use 3–4% grain as dither, keep every silhouette moon-rimmed, keep a 45% scrim behind text, and preview on a phone at 50% brightness.
4) EMISSIVE LAYER ERRORS: eyes must be drawn after their own plane's lit composite, never globally. The B5 dart silhouette must sit between the mid- and near-trunk planes, and the nearest eye pair behind its fern. Verify with flat-tint debug stills at 1.4, 2.3, 13.3, 14.6, 19.0, 24.3, 26.1, 27.4, 29.5, 31.1, 32.6, 35.0, 38.5, 40.6, 42.0 and 44.1 s.
5) THE REFLECTION MAY BE MISSED: hold it 0.9 s, give the figure the only warm points in the water (its eyes), and swell the drone under it.
6) JUMP-SCARE TASTE: a stylized engraved face, closed-lip grin, no teeth or fangs, no gore, 13 frames. Prepare a 9-frame variant if the client finds it too strong.
7) THE LISTÓN MUST NEVER READ AS BLOOD: terracotta with twist bands and frayed fabric ends, never a puddle or drip. Mud is brown and olive with leaf bits.
8) THE RYE '8': its skeleton has spurs and an X junction at the waist. The traversal must be custom, with spurs pruned. On the 40° stone view, confirm it reads as an 8, not ∞ (top loop smaller, oblique ≤40°). If the skeleton is unusable, hand-fit two cubic loops to the glyph's medial axis and overlay-check them.
9) LULLABY: 'A la roro niño' has regional variants. If the transcription isn't clearly recognizable, use the original fallback, which keeps the falling-third cell.
10) FONTS: Alike has no italic, so no italic anywhere. The abuela's words go in sand inside « ». Check that the Rye and Alike files include « », ·, Í and á/é/í/ó/ú.
11) THE CHANEQUES MUST NOT READ AS CHILDREN: hat, broad ears, old face, potbelly, knotted four-finger hands. The narrator is found alive and no violence is shown.
12) RENDER TIME: subframe blur only on whips, the run and the lunge; static planes cached; no 3D. Budget a ~15–20 min render on 4 cores.
13) BRAND RULES: none of the three forbidden words appear anywhere. No Halloween imagery (the tecolote is Mexican folklore). Every text line sits inside y 420–1470. The altar line appears with the title; the faculty name (Negocios / Económico Administrativo) can be added as a second Alike line under it if the client wants it.
14) DURATION: the 44.5 s story is right at the ceiling. If it must shrink, trim 0.2 s from B3, 0.2 s from B6 and 0.1 s from the B8 black.

## Especificación de construcción

- **environments:** - ENV-01 PIEDRA DEL RÍO, NIGHT, POV (B1, B6 match-cuts, B7). Planes: dark river strip with teal flowing glints (40 px/s); a rounded mossy stone (paintShape, moss surface texture, wet specular map that sparkles only inside the beam); footprint decal sets clipped to the stone Path2D (7 / 15 / 40 / hundreds on Poisson concentric rings), swappable by frame; a fern frond on a spring (1.6 Hz damped swing); a dark left-edge eye slot; fog wisps (fogBand). B7 adds a ring of placed cempasúchil petals and the listón 8 under a 40° homography with dew beads. All four appearances use the identical camera framing.
- ENV-02 COCINA DE LA ABUELA, MEMORY, TOP-DOWN (B2). Worn floral hule oilcloth tile (muted #1F5C48 and terracotta flowers, crease noise), a veladora in a glass (flame2D plus glass highlights; its light breathes on the scene), loose cempasúchil petals (marigold sprites), a clay jarro (paintShape, terracotta), the wall-clock pendulum shadow sweeping (2 s period, blurred), the rebozo edge at top-left. Sepia grade, oval vignette, gate weave, gold light leak.
- ENV-03 BARRANCA AT BLUE HOUR (B3). Seven parallax planes: sky gradient with a sliver moon; far ridge silhouette; fog A; far amate/ceiba trunks with buttress roots; fog B; mid trunks plus lianas (simChain); tree ferns; near ferns and platanillo leaves (defocused). The river glints far below. A tecolote branch sits at top-left. After the tilt-down, the bank with a wild cempasúchil clump (marigold sprites on spring stems) is the only warm color.
- ENV-04 ORILLA DEL RÍO, NIGHT (B4). The foreground water surface (bottom 45%) holds a REFLECTED-SKY buffer (moonlit sky, canopy silhouettes, the narrator's hooded head silhouette, a chaneque silhouette with gold eye points), flipped, rippled with kit reflect (ripples decaying after the drink) and teal-tinted. A flat rock at mid-left with the cempasúchil bunch, plus an empty variant with a trail of single petals into the dark (shrinking, one every ~40 cm). A flashlight prop wedged on a stone at the right edge casting a side pool of light. A behind-camera variant for the whip-turn: dark bank with buttress roots, moon rims and one swinging fern.
- ENV-05 BOSQUE DE LA VOZ (B5). Six depth planes of fog-wrapped trunks (2–15 m), the end of the petal trail, a low bouncing branch (spring) on the left. Per plane: an eye-pair slot list (~40 pairs total at knee height, depth-scaled size and blur), the nearest pair behind a foreground fern frond, and a dedicated plane for the darting silhouette between the mid and near trunk planes. A fog flow field with an injectable vortex.
- ENV-06 CORREDOR DE LA CARRERA (B6). Forward-scrolling trunk planes; near ferns and platanillo leaves whipping across the lens (blurred); mud splashes; a background lane for three parallel-running silhouettes, occluded by the trunks in front; edge eye-streak slots.
- ENV-07 TÍTULO EN NEGRO (B8). Black-brown #0B0703 with slow fog (fogBand), faint hatch texture, and a burst of mud specks and torn leaves on the slam.
- ENV-08 ORILLA DEL CAMINO AL AMANECER (B9). A ground-level dirt road shoulder with dew speckle (foreground defocus); a treeline of ceiba and amate silhouettes; three fog layers lifting; a slate-to-gold sky gradient; the foreground hand with the dried bunch.
- ENV-09 PIEDRA AL AMANECER, TOP-DOWN (B10–B11). The same stone seen from above: footprint rings, a ring of dried petals, the listón 8 upright and frontal (exact glyph-centerline path), dew beads, a gold god ray slanting in. In B11 everything darkens and dissolves into #231305 with drifting embers.
- ENV-10 LOCKUP GROUND (B12). A deep brown #231305 field with embers and fine grain; a dark ground strip at the bottom (y 1580–1920, imagery only) where tiny footprints pop toward the camera and gold eyes open at lower-left; the lens handprint overlay layer (frontmost canvas layer, below the DOM text).
- ENV-11 OUTRO: the standard Westhill outro component, unchanged (4.5 s).
- **characters_and_rigs:** - RIG-01 POV RIGHT HAND + FLASHLIGHT: a 3-segment 2D IK arm (kit ik2 plus a wrist segment) gripping a small plastic flashlight. Aim from springFollow (whip-pans k 220/c 18; 150° turn k 180/c 16). Tremor noise 8 Hz ±1.2° when afraid. Snatches the flashlight up from the ground in B4 (14.30).
- RIG-02 POV LEFT HAND/WRIST: a finger rig (palm plus 5 fingers × 3 phalanges, rounded joint caps). Skin gradient, moon rim on one edge, warm beam bounce on the other, dark hoodie cuff. Variants: red listón knotted on the wrist (B2–B4) and bare with a pale pressed line (B4 onward). Poses: palm-up (B2), picking three stems (B3), cupping water with both hands (B4), turning 25° with spreading fingers (B4), a trembling slow reach (B7), clutching the dried bunch (B9).
- RIG-03 ABUELA HANDS: two engraved hands with the same skeletal finger rig, hatch strokes clipped per segment, stipple age spots, a silver ring band, a 5 Hz age tremor. Keyed actions: wrap the listón twice, pull the knot taut, one thumb stroke (0.9 s arc), two pats, lift out of frame. Rebozo fringe: simChain 12 strands × 8 points with rayado stripes.
- RIG-04 LISTÓN: wrist-wrap spline plus a 30-point simChain tail (B2–B3). Ribbon renderer: 9–22 px stroke with twist banding (#A83A25 / #C9553B / #6E2416) and frayed tucked ends. A stone-8 version from the Rye-centerline JSON under a 40° homography, with dew beads. An incandescent fuse version (B11). A swell-to-glyph version (lineWidth 18→240 px clipped to the Rye '8' Path2D).
- RIG-05 CHANEQUE SILHOUETTE: a 10-bone 2D rig (head, hat brim, torso, 2×2 arms, 2×2 legs) with knee-high proportions: head = 1/3 of the body, broad ears, potbelly, long knotted four-finger hands, long-toed feet. The hat fringe is 40 radial simChain strands. paintShape with a teal moon rim. Clips: standing still with a 12° head snap-tilt (B4 reflection); a hold-and-dart scamper between trunks (B5, 8 frames); a crouched parallel run at 2.5 strides/s (B6); hold poses.
- RIG-06 CHANEQUE EYES: an emissive pair component (core #F5C242, rim #F26D3D, pinpoint pupil, bloom) with lid masks (close 2 frames, hold 2, open 2) and per-pair head-tilt rotation. A manager places ~40 pairs in depth slots for B5, with a global 'all tilt 15°' event at 24.25 and an 'all blink' at 24.45. Single pairs appear at B1 2.3, B5 22.0 and B12 43.7. Edge-streak variant for B6.
- RIG-07 CHANEQUE JUMP-SCARE FACE: ~60 hand-authored bézier strokes (wrinkles, brow, flat broad nose, closed too-wide lips, cheek folds, ears) plus hatch stroke sets; the frayed palm-hat brim casting hatched shadow; moss hair strands with tangled leaves on simChain; glossy gold eyes with tapetum glow, pupils contracting on frame 3; an 8×8 mesh warp for the 10% grin widening and 12° tilt; underlight via a vertical light gradient. Lunge: scale 0.55→1.04 (4 frames, expo-out) settling to 1.0 (6 frames), 13-frame hold, 1 px micro-jitter.
- RIG-08 CHANEQUE FOOTPRINTS + HANDPRINT: a footprint decal (7 cm narrow sole plus 5 round toes, mud #2A1A0E, wet specular dot that sparkles only in the beam), placed by Poisson sets and popped on fixed frames. A lens handprint decal: four long fingers plus palm in mud, a smear tail and refraction of the frame behind it.
- RIG-09 NARRATOR REFLECTION: a hooded head-and-shoulders silhouette inside the reflected-sky buffer, with a 4-frame head jerk at 13.7.
- RIG-10 TECOLOTE: an owl silhouette on a branch with a cold rim and a 2-part head that rotates 90° in 5 frames with overshoot and settle.
- **effects:** - FX-01 FLASHLIGHT LIGHT MAP: a cheap-torch cookie (hot core, faint dark ring r≈0.3, wide halo) from the kit flashlight shape, aim from springFollow, intensity × a precomputed flicker table (ignite: on 2 frames, off 3, on; dying: two flickers then off). Moon ambient floor 4–6%. Applied PER PLANE (albedo × light map, composited far→near).
- FX-02 VOLUMETRIC BEAM CONE: an additive kit beam wedge multiplied by fog noise, drawn after all planes; in B4 the side-lying flashlight casts its pool on the rock.
- FX-03 ENGRAVING HATCH (post): night 0.5–0.6 with ink #0B0703 (lines in the beam's falloff); memory 0.45 with sepia ink; dawn ramp 0.5→0 across B9; pushed to 0.7 on the jump-scare frames; lockup hatch only inside the glyph (canvas pattern).
- FX-04 FOG: two to three fogBand layers per shot at different parallax speeds; a vortex swirl injected along the B5 dart path (1.5 s decay); fog sink transition after the title.
- FX-05 WATER: river bands with scrolling glints; still-water reflection with kit reflect ripples decaying over 1.0 s; drops falling back after the drink; drip impacts in B7 (tiny ring ripples on the wet stone).
- FX-06 MEMORY LOOK: sepia grade, oval vignette, gate weave ±1.5 px at 0.8 Hz, a gold light-leak sweep 5.0–7.0, 0.4 Hz warmth warble; veladora flame2D and flicker light; pendulum shadow.
- FX-07 TRANSITIONS: bloom white-out match cut (2.8–3.1); veladora smoke-advection dissolve into forest fog (7.7–8.8); fog sink (33.5–33.8); 1.0 s exponential fade-in to dawn.
- FX-08 PETALS: a trail of single petals; an untweened petal pop at 15.5; dried-petal crumble particles at dawn (tumbling with drag and wind); one dried petal falling in B10.
- FX-09 FERN / BRANCH / STEM SPRINGS: precomputed damped oscillators for the swinging fern (B1, B4), the bouncing branch (B5), the cempasúchil clump spring-back (B3) and the near-frond slaps in the run.
- FX-10 MOTION BLUR: manual 6-sample subframe accumulation of the moving layers only during the whips (1.45, 13.75, 14.30, 22.0), the run (24.6–28.3) and the lunge (31.0–31.2).
- FX-11 CAMERA FX: kit handheld (walk and run profiles); a shake impulse of 14 px with 0.4 s decay at 31.0; a 1-frame chromatic split of 10 px at 31.0; a one-frame 14 px kick at the lens slap (44.05).
- FX-12 TITLE SLAM PARTICLES: a mud-speck and torn-leaf burst (ballistic with drag) at 32.0; a light sweep across the letters at 32.9.
- FX-13 DAWN: a gold god ray (kit beam) slanting through the trunks; dew speckle twinkle; fog layers lifting.
- FX-14 FUSE + GLYPH: an ember head (kit glow) travelling the arc length in 1.0 s with ease-in-out; 20–40 spark particles per frame along the path normal; an incandescent trail with bloom and faint terracotta core; the scene darkening to #231305 with embers (kit particles 'embers'); the swell into the Rye '8' clipped to the glyph path; a gold→cempasúchil gradient plus hatch; a 0.8 Hz ember pulse and a few orbiting embers.
- FX-15 LENS HANDPRINT: a mud decal plus a blurred, refracted copy of the frame behind it (clipped), sliding 30 px down; frontmost canvas layer, kept clear of the DOM text.
- FX-16 GLOBAL FINISH: kit post grain 3–4% (luminance-weighted), vignette 0.35, bloom on emissives only, black floor #0B0703.
- FX-17 PRECOMPUTE: scripts/leyendas/d08_ocho.py (Rye '8' outline, SDF, pruned skeleton, closed figure-8 traversal, resampled centerline, contour JSON); spring tables, the flicker table, footprint Poisson sets and eye-pair placements as module-level cached constants.
- **typography_moments:** - T01 · 0.25–2.95 · Rye 46 px · sand #E0BB8F · tracking .08em · y=430 · flicker (beam) · «Mi abuela decía:»
- T02 · 0.70–2.95 · Alike 66 px · sand #E0BB8F · y=510/595 · flicker (beam), dissolves in the bloom · «Si el monte te llama, / no contestes.» (displayed with « »)
- T03 · 3.40–5.25 · Alike 64 px · sand · y=440 · soft · «No te quites el listón.» (displayed with « »)
- T04 · 5.35–8.10 · Alike 62 px · sand, 'chaneques' in #F26D3D · y=420/500/580 · soft · «Los chaneques / te esconden las cosas / para que los sigas.» (displayed with « »)
- T05 · 8.45–11.45 · Alike 64 px · bone #D9CDB6 · y=430/512 · soft · Este año bajé al río / por flores para su altar.
- T06 · 14.50–16.00 · Alike 64 px · bone · y=440 · flicker (beam) · Las flores ya no estaban.
- T07 · 16.10–17.35 · Alike 72 px · bone · y=440 · flicker · Ni el listón.
- T08 · 17.60–20.00 · Alike 64 px · bone · y=430/512 · flicker · Algo me llamó / con la voz de mi abuela.
- T09 · 20.20–22.00 · Alike 66 px · bone · y=470 · soft, held in silence · Mi abuela murió en marzo.
- T10 · 22.40–23.75 · Alike 66 px · bone · y=470 · flicker · Y aun así, contesté.
- T11 · 24.70–25.45 · Rye 84 px · bone · y=470 · slam on the first footfall · Corrí.
- T12 · 25.55–28.20 · Alike 64 px · bone · y=430/512 · soft, fixed over a 45% #231305 scrim while shots cut underneath · Y siempre volvía / a la misma piedra.
- T13 · 32.00–33.70 · Rye 70 px / 128 px · gold #F5C242 with a #F26D3D edge glow, hatch inside the strokes · y≈760–960 · slam (1.3→1.0 in 6 frames) · LOS / CHANEQUES
- T14 · 32.35–33.70 · Alike 48 px · sand · y≈1010 · soft · Altar 7 · Ala Norte
- T15 · 33.95–35.70 · Alike 62 px · bone · y=430/510 · soft · Desperté a la orilla / del camino.
- T16 · 35.80–37.35 · Alike 62 px · bone · y=470 · soft · Para mí, fue una noche.
- T17 · 37.55–39.50 · Alike 66 px · bone, 'ocho' in gold #F5C242 · y=430 · soft · Me buscaron ocho días.
- T18 · 40.55–44.50 · the numeral 8: the Rye '8' glyph (≈640 px digit height, x-centered, y≈610–1250) formed from the listón, gold→cempasúchil gradient plus hatch, 0.8 Hz ember pulse. It is drawn in canvas from the same glyph metrics that LeyendaLockup uses.
- T19 · 40.95–44.50 · LeyendaLockup (dias=8, fecha='28 · 10', top=470, bottom=1290): FALTAN Rye 92 px cempasúchil at y=470; DÍAS Rye 92 px at y=1290 (from 41.15); 28 · 10 Alike 52 px sand, tracking .2em, at y=1418 (from 41.55)
- GLOBAL: Rye and Alike only (no italic, no Domine); nothing outside y 262–1568 (all lines sit at y 420–1470); max width 940 px; every narrative line has a 40–45% #231305 scrim; none of the three forbidden words anywhere.
- **audio_cues:** - A00 · 0.00–0.15 digital silence → 0.15 plastic flashlight click plus filament buzz (synced to the flicker table); river murmur, wind-in-fog bed, sparse crickets from 0.15
- A01 · 1.40 breathy child giggle, hard right, wet reverb; fern rustle; 2.55–3.00 rising air swell into the bloom
- A02 · 3.00–8.20 kitchen room tone plus tape hiss; wall-clock tick at exactly 1 Hz; veladora crackle; cloth rustle; 5.40 thread squeak; pats at 6.15 and 6.45; MUSIC 'A la roro niño' in D minor, 3/4 at 66 bpm, nylon guitar plus harp with a ±8 cent warble
- A03 · 8.20–11.60 downhill footsteps on leaves and gravel at 1.8 Hz, river louder, crickets and frogs; 9.15 tecolote two-note hoot far left; 11.00 three stems snapping; MUSIC: lullaby phrase on barro flute over a D cello drone, plus a requinto jarocho pluck answer
- A04 · 11.60 hard cut to a close river bed; 11.80–12.70 water cupped and drunk, drips; 12.80–13.70 low drone swell (no sting); 13.35 tiny leaf rustle; 13.75 whip whoosh plus cloth; 14.30 flashlight scrape on stone
- A05 · 14.45 ALL crickets and frogs hard stop; river ducks to −30 dB; the clock tick returns faint and irregular (±40 ms); 15.50 silent petal pop (no sound); 16.00 shaky inhale
- A06 · 17.50 far old-woman formant hum of the lullaby's first phrase, ahead-right, long wet reverb; 18.60 two-syllable call (falling minor third, 'a–o'); 18.90 tiny rustle L→R
- A07 · 20.20–22.00 silence: room tone at −60 dB plus 8 kHz tinnitus
- A08 · 22.00 the call again, close-left and DRY, its second syllable glitching up an octave into a child's giggle; 22.70 the narrator's shaky inhale plus a breathy unintelligible reply; 23.00–23.60 three pitched-up echoes of that reply (left, right, behind)
- A09 · 23.75–24.00 digital zero → 24.00 eruption: low hit plus ~8 surround giggles plus a music-box cluster chord (lullaby notes); 24.45 collective wet blink tick
- A10 · 24.60–28.10 run: footsteps at 3 Hz, panting, heartbeat at 110 bpm merging into accelerating teponaztli and huehuetl, muted jarana scrapes, the clock tick accelerating 1→4 Hz, a string-cluster glissando, circling giggles, branch whooshes; a teponaztli knock plus reverse swell at 25.50, 26.40 and 27.30; 28.10 hard stop of everything
- A11 · 28.30–31.00 near silence: drips at 28.5, 29.6 and 30.7; 8 kHz tinnitus at −40 dB fading in; 30.90–31.00 digital zero
- A12 · 31.00 STAB: 35–40 Hz sub boom, noise burst, D–E♭–A♭ detuned string cluster, synthesized Aztec death-whistle shriek, distorted giggle (peak ≤ −1 dBTP); 31.43 flashlight clatter on stones plus electric fizz; 31.60 hard cut of the tail
- A13 · 31.60–31.85 silence; 31.85–32.00 reverse swell; 32.00 title hit: huehuetl, low 'oo' choir in D minor, saturated D1/D2 saw swell, mud and leaf burst; the tail decays into dawn birds by 33.8
- A14 · 33.80–37.40 dawn birds, distant church bell (two tolls), far dog bark, wind through dry leaves, a papery crumble; MUSIC: solo harp, lullaby first phrase in D minor
- A15 · 37.40 birds cut out; wind, a low swell, one low nylon D under «Me buscaron ocho días.»
- A16 · 39.60–40.60 fuse crackle travelling the path (auto-panned with the ember head) plus a rising whoosh; 40.60 deep boom with a long tail plus a marimba bell as the glyph forms
- A17 · 40.90–44.50 music box plays the lullaby's last phrase, the final note a quarter-tone flat; 42.70–43.60 tiny pattering footsteps; 43.90 close DRY centered giggle; 44.05 wet slap plus low thud; 44.50 hard cut to silence
- A18 · 44.50–49.00 standard Westhill outro audio (ignition, fire bed, 4-note marimba signature, glittering exhale); optional faint reversed giggle in the first 0.3 s
- MASTER: scripts/leyendas/d08.py with LEN = 1335, STANDARD_OUTRO = True; convolution reverbs (forest long and dark, kitchen small and warm; dry close voices); true digital-zero silences at 0.00–0.15, 23.75–24.00, 30.90–31.00 and 31.60–31.85; −14 LUFS integrated, true peak ≤ −1 dBTP via sfx.master

## Injertos de los otros tratamientos

The spine is B: first-person POV, the abuela's warnings, the red listón, the dead-grandmother voice and the eight-days twist. It is the only treatment with a real emotional stake, the most Mexican of the three, and tied to the altar theme. What I took from the runners-up:

FROM A:
(1) The device rule that the flashlight beam is the only light and turns whatever it touches into a living Posada engraving. Hatch lives in the beam's falloff. In the dark it is ink on ink, so it disappears. At dawn it fades out as the spell lifts. This gives B a sharper visual identity than its generic 'hatch by luminance'.
(2) The 'stolen while you weren't looking' suspense, adapted to POV. While the narrator drinks from the river, the still water reflects a small hatted figure standing right behind their shoulder. Then come the whip-turn, nothing there, and the empty rock. B4 is the dead zone of B, and this gives it a visible creature.
(3) After «Y aun así, contesté.» comes dead silence, then dozens of gold eye pairs open at every depth layer at once. B had no payoff for the answer.
(4) The listón path is the medial axis of the exact Rye '8' used in the lockup, precomputed from the font. The incandescent ribbon swells into the Rye glyph with no swap, which keeps series typography consistent.
(5) A title slam «LOS CHANEQUES» plus «Altar 7 · Ala Norte» in the post-scare black, so the legend and the altar are unmistakable.
(6) The Veracruz humid forest (amate and ceiba buttress roots, tree ferns, platanillo, lianas) instead of an oyamel barranca, and son jarocho color: requinto answers and muted jarana scrapes in the run.
(7) A synthesized Aztec death-whistle shriek in the jump stab.
(8) A muddy four-finger handprint slapping the lens as the final sting, placed clear of all text.
(9) The mud-never-red palette rule and the text scrims.

FROM C:
(1) All the eye pairs tilt 15° in unison and blink at once: one mind, many bodies.
(2) The forest repeats your own voice. The narrator's breathy reply comes back from three directions, pitched up, just before the eruption. This is audio-only, so it adds no text.
(3) Eye pairs streak at the frame edges, keeping pace during the run.

DROPPED:
- A's 3D watch: B's wall-clock tick already carries time.
- A's second title card.
- C's camcorder look: low-res, and it conflicts with 'premium'.
- C's abduction image.
- Italic for the abuela's quotes, because Alike has no italic. Her words are set in sand inside « » instead.

Text is rewritten for natural Mexican Spanish and wrapped to fit 940 px:
- «Los chaneques / te esconden las cosas / para que los sigas.»
- «Algo me llamó…»
- «Las flores ya no estaban.» / «Ni el listón.», ordered so the loss of protection lands last.
- «Desperté a la orilla / del camino.»

Runtime is 44.5 s story plus the 4.5 s outro.
