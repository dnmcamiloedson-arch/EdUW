# Día 4 · Gaveta 4

> Guanajuato, 1833. You wake up inside your coffin. Outside, the mourners sing 'Las Golondrinas' to see you off, and a gravedigger hears you knocking and says it's only the dead settling. Brick by brick the light and the song go out. With one match left, something in the next niche knocks back in your own rhythm. In 1865 they open the niches and you are still screaming. Then niche 4 knocks four times, and the number lights up.

**Duración:** 48.5 s + outro

## Recurso

THE SCREEN IS THE COFFIN LID. The camera is the eyes of someone lying on their back under the lid. The 9:16 frame matches the narrow hexagonal coffin (narrow at the head, widest at the shoulders), so the phone in the viewer's hand becomes the coffin, with no establishing shot.

Rules of the device:
(1) Every light source has a motive: our first match, lantern beams through cracks in the head board, a starved last match with a blue fringe, a thread of moonlight through the mortar, and the gravedigger's lantern in 1865. Losing light is losing hope.
(2) The camera breathes. Bob and micro-roll follow breathing and panic, freeze while we hold our breath, and stop for good when the heart stops at 32.0 s. From then on, stillness means death.
(3) Hands are the only body we ever see: ours, with a rosary on the wrist, and later the same hands mummified.
(4) Sound is filtered by the coffin. Everything outside is low-passed, and each brick laid outside removes more of the world: the farewell song 'Las Golondrinas' dies one brick at a time.
(5) Knocks are dialogue. We knock, the neighbor answers, and in the end niche 4 knocks four times to light the number.
(6) We leave the coffin exactly once: when it is broken open in 1865, we cut outside to the niche wall and the carved '4'.

## Dirección de arte

OVERALL LOOK: candle-lit chiaroscuro horror inside the coffin. It slides into a 19th-century Mexican broadside-engraving look (kit post hatch) for the mummy face, the 1865 opening and the panteón exterior. No calaveras, no Catrinas, no Halloween props.

PALETTE ANCHORS:
- Shadows are always deep brown #231305.
- True near-black (#050302 plus grain) appears only in the deliberate silence beats, never flat #000.
- Wood midtones run from terracotta #A83A25 darkened toward #3B2412.
- Scratches, bevels and highlights are sand #E0BB8F. Sleeve cloth and teeth are bone #D9CDB6.
- Flames have a gold #F5C242 core and a cempasúchil #F26D3D mid glow.
- Cold light (last-match fringe, moon thread, exterior moon) is teal built from #1F5C48 lifted toward #2F6F74. It always falls off into #231305.

LIGHT STATES (one PostOpts preset per act):
(1) First match: warm amber pool, radius about 900 px, quadratic falloff, flicker of ±6% radius and ±10% intensity (noise at 7 and 13 Hz), halation 0.4, bloom 0.6.
(2) Lantern beams: five thin gold beams raking down the lid from the head board, dust sparkling only inside them, bloom 0.9, bloomThr 0.6, shadows tinted warm.
(3) Last match: 40 px flame with a blue-teal fringe, light radius 420 px, saturation 0.7, grade pushed cold brown-teal.
(4) The years: one teal moon thread, saturation 0.6, teal shadows.
(5) 1865 lantern: warm flood from the top, exposure ramps 0.3 to 1.1, bloom 1.2, dust clouds, hatch 0.2.
(6) Exterior: hatch 0.3 (hatchScale 6, hatchAngle 0.52 rad, hatchInk #231305), cold moon from top-left, warm lantern from bottom-right.
Global: grain 0.10, vignette 0.65, ca 0.6 (4 only on the scare). Blue-noise dither on every gradient.

COFFIN GEOMETRY (POV straight up):
- Three vertical lid planks, seams at x≈370 and x≈710: 3 px dark gap plus a 1 px sand chamfer.
- Square iron nail heads every 220 px along the seams.
- Hexagonal lid outline: 840 px wide at the head end (top), widest at 1020 px around y≈1250 (shoulders), narrowing below.
- Inner side boards are dark slanted strips 30 to 70 px wide.
- The head board is a 120 px trapezoid at the top edge. It grows to 520 px when the POV pitches up, done with a 2D scale and skew.
- Wood grain: a cached noiseTile stretched 8x vertically, plus sinusoidal ring lines.

SCRATCHES: each groove is a dark 2 px stroke plus a 1 px sand stroke offset toward the current light. The offset vector follows the flame, so the grooves read in relief.

HAND SHADOWS: the light source is low near the chest, so every hand throws a giant soft shadow up onto the lid (scaled about 1.6x from the light point, blurred, multiplied). This is the most expressive layer in the coffin.

COMPOSITION:
- The text band lives at y 560 to 1000, in the dark middle of the lid. Text is bone with the kit scrim; beam intensity drops 30% under text.
- Hands occupy the lower frame and beams the upper frame.
- Story points (knothole, carved 4) sit in the central third, away from the Instagram UI.

TYPOGRAPHY:
- Rye for stamps, punches, the title and the lockup. Alike for narration.
- Every line is pre-broken to fit the kit's 940 px box.
- All text sits between y=560 and y≈1340, well inside the 250/340 px margins.

## Personajes

- **name:** Tú (the person buried alive, POV) · **how_shown:** Never seen except as two hands and forearms in bone-white camisa de manta sleeves, entering from the bottom of the frame. They are 2D silhouettes painted with paintShape: brown body gradient, warm rim light on the flame side, fingertips that blanch when pressed to wood. A rosary of 12 dark wooden beads and a small cross is wrapped around the left wrist; this is the identity marker.
After the time-lapse the same hands are mummified: fingers 30% thinner, sharp knuckle bumps, long bone nails, skin from sand #E0BB8F to #3A2414 with crosshatch, sleeve yellowed and frayed, rosary cord slack but still there, tiny mineral sparkles.
The face is never shown; the viewer is the face. · **motion:** Two-bone IK arms (ik2) from off-screen shoulders at (±300, 2150) toward keyed targets on smoothPath curves.
- PRESS: a 16-frame cycle. Ease-in approach, contact squash (palm scaleY 0.96, finger splay 3°), 4-frame hold, ease-out release.
- CLAW: four fingertips drag 150 px down over 12 frames with a 1-2 frame stagger, each spawning a groove along its path.
- FIST POUND: every 14 frames, ease-in strike with a 2-frame squash.
- TREMBLE: noise2D at 9 Hz, 1.5-2 px.
- BREATHING drives the camera: bob 8 px at 0.5 Hz when calm, 10 px at 0.7 Hz in panic, 0 while holding breath, and 0 forever after 32.0 s.
- The rosary is a looped simChain that swings with every hit.
- The mummified hands never move; that is the horror. The final claw pose at 20.6 s is stored as data and reused exactly at 32.2-38.0 s and in the exterior.
- **name:** El de la gaveta vecina (the neighbor, buried alive before us) · **how_shown:** Heard first: three knocks, then knocks that copy ours.
Seen for 3 subliminal frames (642-644) as a pale, leathery hand flat on the right side board, lit only by the sparks of a failed match.
At the scare, seen through the knothole as an engraving-style face that is not modeled on any real mummy:
- one deep empty eye socket above the mouth
- a taut cheekbone ridge with a bone highlight
- about 30 dark wrinkle strokes radiating from a mouth stretched wide in a frozen scream (vertical oval 1:1.4, interior #0A0604)
- six irregular bone upper teeth with brown stains, a quiet nod to Odontología.
Then a thin, leathery hand bursts through. In the exterior: a second pair of raised hands in the opened niche next to ours. · **motion:** The expression never changes.
- LUNGE: rigid body only, scale 1 to 1.35 over 5 frames, ease-out-back, rotation 4°.
- HAND BURST: toward the lens, scale 0.6 to 1.9 over 6 frames, ease-out expo. Fingers splay with a 1-frame stagger and the hand defocuses as it nears the camera.
- Before the scare, its presence is only physical: dust jumping off the side board on each knock.
- **name:** El sepulturero de 1833 · **how_shown:** Never seen directly. A soft-edged shadow of a head and sombrero brim slides into lantern beam 3 and blocks it: he is leaning in to listen at the crack. He is also heard as a muffled, unintelligible male murmur through wood and brick, with his words given as an em-dash caption. · **motion:** The shadow enters over 10 frames (ease-out) and holds. It nods 2 px while he speaks, then withdraws over 8 frames as the bell tolls. The trowel stops and then resumes.
- **name:** El sepulturero de 1865 · **how_shown:** A backlit 2D silhouette framed in the jagged broken opening at the top of the frame: palm sombrero (brim ellipse about 300x60 px plus crown), head and shoulders in shadow, sarape over the left shoulder, right arm raising a tin farol (frame, glass panes, flame2D candle, warm halo). The face is unlit except for the paintShape rim and two 2 px eye glints. Outside, he appears only as a huge lantern shadow sliding off the niche wall. · **motion:** springFollow lean-in, freeze for 0.4 s, then recoil: the spring target jumps back 160 px, giving natural overshoot and settle. The sarape is a precomputed simCloth 12x14 pinned at the shoulder line and swings with the recoil. The lantern hangs on a 2-link simChain pendulum, and its angle drives the light pool that sweeps across the scratched lid. Breath vapor comes from smoke() particles.
- **name:** Los dolientes (the mourners) · **how_shown:** Never seen. Only their lantern light through the head-board cracks, and their farewell song 'Las Golondrinas' (requinto plus a wordless choir) heard through wood and brick. · **motion:** Their lantern sways at 0.6 Hz, rocking the five beams ±3°. They stop singing when the gravedigger listens and start again, thinner, after his excuse.

## Beats

| t (s) | Escena | Cámara | Acción | Texto en pantalla | Sonido |
|---|---|---|---|---|---|
| 0.0–0.4 | HOOK 1: black inside the coffin | POV lying on the back, locked, invisible. | Frames 0-11: #050302 with grain only. Nothing is visible; the sound carries the hook. |  | An extremely close fingernail scratch on wood through a boxy coffin impulse response (8 ms dense early reflections, RT60 0.15 s). A ragged inhale (formant). Heartbeat thuds at 96 BPM. |
| 0.4–2.0 | HOOK 2: the match. The lid 30 cm from your face | POV straight up. Breathing bob ±8 px at 0.5 Hz plus 1.5 px handheld jitter. On the palm slam (frame 24), a 10 px shake decaying over 6 frames. | Frame 12: a match strikes at lower right (760, 1500). 14 sparks spray upward (2-5 frame life). The flame blooms from 0 to 70 px over 5 frames (ease-out). Post: flash 0.7 to 0 over 8 frames, exposure overshoot 1.4 to 1.0.<br>This reveals the hexagonal lid: three planks, nail-studded seams, side-board strips, and the head-board trapezoid at the top.<br>The left hand, in a manta sleeve with the rosary on its wrist, shoots up from the bottom-left (ease-out-back, 7 frames) and slams flat at (420, 980) on frame 24. The palm squashes, the fingertips blanch, and its giant shadow jumps onto the lid above. Dust sifts from the seam at x=370 and falls toward camera, particles growing 1x to 3x and defocusing.<br>Layers: lid, then hand shadow (multiply), hand, match and flame, dust, text. | Despiertas. | Match strike (rasp, phosphor pop, ignition hiss), flame crackle, a dull resonant palm slam on wood, dust sifting, a gasp. Heartbeat rises to 110 BPM. |
| 2.0–6.4 | Pushing and clawing at the lid | Slow push from scale 1.00 to 1.05. The bob quickens to 10 px at 0.7 Hz. | The left hand presses three times in 16-frame cycles. The lid creaks and a seam opens 1 px, then closes: it won't give.<br>Then the fingers claw: four fingertips drag 150 px down with a staggered start and leave four fresh pale grooves. This repeats at a slightly different x.<br>The right hand stays low, pinching the match. The flame leans toward camera on each inhale and away on each exhale (lean = breath phase × 12°). The giant hand shadow mirrors every claw on the lid. | GUANAJUATO · 1833<br>Con el cólera, a los muertos<br>los enterraban el mismo día. | Wood creaks, a four-voice nail scratch (slightly detuned), muffled palm pushes, panicked breathing in the boxy reverb. A low D drone fades in at -30 dB; it plays only while there is fire. |
| 6.4–9.4 | The match burns down | A panic head-shake roll of ±4° that returns to 0. A small dip as the match falls. | A black char front climbs the 90 px stick toward the fingertips while the stick curls. The flame shrinks from 70 to 30 px and the light radius from 900 to 520 px.<br>At 8.6 s the fingers flinch open. The match tumbles (540° rotation, falling under gravity out of the bottom of the frame) and dies at 9.2 s. A thin smoke curl rises through the last glow and an ember dot lingers for 8 frames. Darkness eats the lid from the edges inward. | Te sepultaron<br>con vida. | Rising match hiss, a fingertip sizzle and a pained hiss (formant), the flame puffing out. The drone swells, then hard-cuts at 9.2 s. |
| 9.4–10.8 | Darkness. Footsteps. | Black. The POV pitch is reset invisibly during the dark. | Pure black with grain from 9.4 to 10.0 s. At 10.4 s a hairline of warm gold appears along the very top edge (a crack in the head board) and widens to 3 px. |  | Dead silence from 9.4 to 10.0 s, with no room tone. Then distant muffled footsteps on gravel (low-passed at 600 Hz) and the creak of a tin lantern's handle. |
| 10.8–15.0 | Light through the cracks: they are seeing you off | The POV tilts up toward the head end over 1.2 s (ease-in-out), as if straining the neck. The head-board trapezoid grows from 120 to 520 px. 6 px shake on each fist hit. | Five irregular cracks in the head board leak lantern light. Five thin gold beams fan down across the lid in raking light, revealing the grain and our fresh grooves. Dust motes sparkle only inside the beams. The beams sway ±3° at 0.6 Hz with the lantern outside.<br>From 12.4 s both fists pound the head board alternately every 14 frames, and each hit shakes dust from the seams. | Afuera, alguien canta.<br>Te están despidiendo. | Outside, muffled through wood: a requinto guitar (Karplus-Strong) and a wordless 'oo' choir sing 'Las Golondrinas' (Serradell, 1862, public domain) in D major, rubato, through a 2.2 kHz low-pass and a distant reverb. Heavy close fist thumps. A muffled wordless wail into the lid. The footsteps stop. |
| 15.0–17.2 | They start sealing the niche. Someone stops to listen | Holds pitched up. Slow push from 1.00 to 1.04. Very fast, shallow bob, which freezes to 0 at 16.8 s. | A trowel scrapes. Brick 1 at 15.3 s wipes out beam 1 (a horizontal wipe of its emission over 8 frames, plus a dust puff from that crack). Brick 2 at 16.0 s wipes out beam 2. Our fists pound frantically.<br>At 16.5 s the trowel stops. At 16.7 s a soft dark shape, a head with a sombrero brim, slides into beam 3 and blocks most of it: someone has leaned in to listen at the crack. Our fists freeze mid-air; we hold our breath. |  | Trowel scrape, wet mortar slap, brick thunks. Each brick drops the song's low-pass (2.2 kHz, then 1.2 kHz, then 700 Hz) and lowers it 4 dB. At 16.5 s the singing stops too. Silence except our held breath and the faint creak of the lantern handle outside. |
| 17.2–19.0 | The excuse | Locked, no bob. | The shadow in beam 3 nods slightly as he speaks. At 18.4 s it withdraws and beam 3 returns. At 18.4 s our fists explode against the head board again, landing exactly under the bell toll. The trowel resumes at 18.6 s. | —Nomás son los muertos<br>acomodándose. | A muffled male murmur through brick (formant babble low-passed at 400 Hz, unintelligible) from 17.3 to 18.2 s. At 18.4 s one heavy church bell toll (doble de difuntos) masks our pounding. At 18.6 s the trowel scrapes again and 'Las Golondrinas' resumes, thinner. |
| 19.0–21.0 | The last brick | Push continues to 1.08. Tiny, rapid breathing bob. | Brick 3 at 19.1 s wipes out beam 3; brick 4 at 19.8 s wipes out beam 4. The last beam narrows from 6 px to 1 px. The left hand presses flat against the head board, fingers spread, and its fingertips and rosary beads catch the last thread of gold. At 20.6 s the thread closes and the frame goes completely black. |  | Brick thunks drop the song's low-pass to 400 Hz, then 200 Hz, and its gain 4 dB each. At 20.6 s the final thunk cuts every exterior sound to dead silence, held until 21.0 s. |
| 21.0–24.2 | The last match | Back to looking straight up (reset in the dark). The lid feels closer (scale 1.12). The bob is shallow and fast. | Black from 21.0 to 21.4 s. At 21.4 s the first strike fails: sparks on frames 642-644 subliminally light a pale, leathery hand pressed flat on the RIGHT side board. It is not ours, and it is gone on the next frame.<br>At 22.0 s the second strike catches: a weak 40 px flame with a blue-teal fringe (oxygen running out). The light radius is only 420 px and the grade goes cold brown-teal. The left hand trembles in frame, the rosary visible. | Te queda un cerillo.<br>Y casi nada de aire. | A failed-strike rasp with crackle, then a thinner successful strike. The weak flame hisses at a higher pitch. Short rapid breaths, heartbeat at 120 BPM. The drone returns with a sustained high string harmonic on A5. |
| 24.2–27.8 | Knocks from the next niche | At 24.6 s the head turns right in a 9-frame whip pan (smear made from 4 offset draws at 25% alpha). It lands on the right side board, seen at a raked angle filling 75% of the frame, with the lid as a perspective strip on the left. | At 24.2 s, three knocks from the right; dust jumps off the side board with each one.<br>At eye level on the board is a dark knot: a vertical ellipse 110x150 px centered at (600, 940), with grain lines swirling around it.<br>At 25.6 s our knuckles knock back twice. Nothing from 26.0 to 26.8 s. At 26.8 s two knocks answer from behind the knot, copying our rhythm to the frame. | Alguien te responde. | Three hollow, heavy knocks panned right (modal wood synthesis). Our two lighter knocks. 0.8 s of silence as the drone and heartbeat drop out. Then the answer, matching our timing exactly. |
| 27.8–29.2 | The knothole | Dead still, holding breath (bob 0). A slow push toward the knot, scale 1.0 to 2.6, ease-in cubic, centered on (600, 940), so the hole ends up about 286x390 px on screen. | The right hand brings the weak flame toward the knot. At 28.1 s the knot plug pops out and drops, leaving a black hole with a lit wooden bevel ring (the board's 2 cm thickness). Inside, a void. At 28.8 s a single 2 px bone glint appears deep in the hole and vanishes 4 frames later. |  | Knot pop and a tiny clatter. Near silence: only the thin flame hiss. At 28.6 s a faint, dry breath rattle from inside the hole (formant, -40 dB). |
| 29.2–29.6 | JUMP SCARE: the frozen scream | Frame 876: hard shake of 36 px decaying over 10 frames, 3° roll, scale recoils from 2.6 to 2.2 in 3 frames. | Frame 876: a mummified face slams against the hole from the other side. Through the hole: one empty eye socket above a mouth stretched wide in a frozen scream, irregular teeth, engraving crosshatch, a cold rim light from the flame.<br>Frame 879: the board splits radially and the hole tears open to about 640x820 px, showing more of the rigid face, while a thin leathery hand bursts through toward the lens (fingers splaying and defocusing) with splinters flying at camera.<br>Frame 882: the gust snuffs the flame.<br>Frame 888: hard cut to black.<br>Post: flash 0.5 on frame 876; ca 4, glitch 0.25 and hatch 0.45 on frames 876-888.<br>Layers: face plate (behind), board with even-odd hole, splinters, hand burst (front), near dust. |  | Sting on frame 876: a white-noise burst, a dissonant choir cluster (D, E-flat, A-flat 'aah' formants), a wood splinter crack, a sub boom sweeping 60 to 38 Hz, and the flame snuff at frame 882. Everything ends abruptly at 29.6 s into total silence. |
| 29.6–32.2 | Aftermath in the dark | Black. | 0.7 s of black and silence, then the text. Death is implied only by the heartbeat slowing and stopping at 32.0 s. | No eres el primero. | Silence until 30.3 s. Then a slow, weak heartbeat (60 BPM falling to 40) that stops at 32.0 s. A distant water drip in a cavity at 31.0 s. |
| 32.2–35.2 | The years: the earth dries them | POV straight up and absolutely still. The camera no longer breathes, and that stillness is the signal. | A hairline crack in the head-board mortar lets in a thread of cold teal moonlight. Nights pass as soft swells of light: one every 0.8 s at first, accelerating, and merging into a steady shimmer by 34.4 s. The luminance change is capped at 20% and never exceeds 3 swells per second.<br>In each swell we see our two hands still raised in claws against the lid, darkening and tightening as morph m goes from 0 to 1. The rosary stays on the wrist. Mineral crystals bloom as tiny bone and gold sparkles on the knuckles and wood. The lid is now dense with claw marks. | La tierra los secó.<br>Pero guardó sus gritos. | Distant church bell tolls accelerating from 0.9 s to 0.12 s intervals until they blur into one metallic drone. Crystalline mineral ticks. A thin wind through the crack. A slow descending string glissando. |
| 35.2–38.0 | 1865: the niche is opened | POV. 8 px shake on each chisel blow. At 35.9 s a startled 10-frame pitch-up toward the head end as light floods in. | Chisel blows at 35.2, 35.5 and 35.8 s: crack lines branch across the head board with each hit and dust jets out. At 35.9 s the bricks and head board collapse inward. A jagged rectangle of warm lantern light bursts in at the top (exposure 0.3 to 1.1, bloom 1.2) and dust billows.<br>At 36.3 s the gravedigger leans into the opening: sombrero silhouette, sarape, lantern raised beside his head, eye glints, breath vapor. He freezes for 0.4 s, then at 36.9 s recoils with a spring overshoot. The lantern swings on its handle and the light pool sweeps down the coffin, revealing hundreds of claw scratches and our mummified hands still raised in claws, the rosary on the wrist. | 1865. Abrieron las gavetas.<br>Seguían gritando. | Chisel strikes (metal on stone), the rumble of collapsing brick, a dust whoosh. As the seal breaks, a long, dry exhale comes out of the coffin (formant, ambiguous). The gravedigger gasps and stumbles on gravel. The lantern creaks as it swings. Outside, crickets and wind fade in as the low-pass opens fully. |
| 38.0–40.4 | Outside: the niche wall of the Panteón de Santa Paula at night | Cut on the lantern swing to a low-angle exterior wide. Slow 2.5D dolly-in (camPath, z 1200 to 950) with a 40 px crane up, ease-in-out. At 40.2 s the push accelerates toward the lintel. | Planes, far to near:<br>- Night sky (#0B1F22 to teal haze) with a clouded moon glow.<br>- The Guanajuato cerros in silhouette with a few warm window dots.<br>- Two cypress silhouettes.<br>- The stone niche wall: 4 columns × 6 rows, engraving hatch, cold moon from top-left, warm lantern from bottom-right.<br>- The center niche, open and black. Our two mummified hands protrude slightly, frozen in claws, catching the lantern; the faint shape of an open mouth lies deeper inside. Carved into the stone lintel above it: '4'.<br>- The niche beside it, also opened, with a second pair of raised hands at the edge of the light.<br>- The gravedigger's huge lantern shadow sliding off the wall to the right.<br>- A ground fog band at the foot of the wall, behind the lantern.<br>- In the foreground, the dropped lantern still rocking (damped pendulum, 8° down to 2°), and a few dry cempasúchil petals on the flagstones. | LAS MOMIAS<br>DE GUANAJUATO | A tecolote hoots twice at 38.2 s. Crickets, wind, the lantern creaking. A solo harp plays the first half-phrase of 'Las Golondrinas' in D minor, slow and soft, stopping on a suspended A at 40.3 s. |
| 40.4–41.9 | Niche 4 knocks four times: the numeral lights up | The push settles (ease-out) with the carved '4' centered at y≈900, about 330 px tall. A 3 px kick on each knock. | The wall dims to 30% and defocuses, except the carved 4. Four knocks come from inside niche 4 at 40.50, 40.90, 41.30 and 41.70 s. Nothing visible moves; the hands below stay frozen.<br>On each knock, a puff of mortar dust drops from the lintel and ember-orange light runs through the next quarter of the carved groove like a lit fuse (#F26D3D core, #F5C242 additive halo). Order: up the stem, then down the diagonal, then across the crossbar, then the stem's foot. After the fourth knock the whole 4 glows. |  | The harp holds silence; only wind. Four dry knocks filtered through stone, each with an ember crackle and a rising bowed-metal tone (D, F, A, then D an octave up). |
| 41.9–44.0 | Lockup: FALTAN 4 DÍAS, with a veladora on niche 4 | Static, with a breathing micro-push from 1.00 to 1.01. | At 41.85 s the 4 flares and lifts off the stone (scale 1 to 1.12, slight forward parallax), becoming the glowing Rye numeral, about 400 px tall and centered at y≈900. LeyendaLockup: FALTAN at 41.9 s, DÍAS at 42.1 s, and 28 · 10 following automatically.<br>At 42.2 s a veladora ignites on the ledge of niche 4 at the bottom of the frame (y≈1560-1700, image only). Six to eight fresh cempasúchil petals drift down through its glow (2D flutter-fall) and settle on the ledge: niche 4 is finally remembered. 6-frame crossfade into the outro from 43.8 to 44.0 s. | FALTAN<br>4<br>DÍAS<br>28 · 10 | A low D boom as the 4 lifts. The harp resumes and resolves the phrase over a soft choir pad, but holds back its final note. A match strike and soft flame whoosh for the veladora at 42.2 s. A petal whisper. One last knock at 43.6 s, barely audible at -30 dB: they are still there. |
| 44.0–48.5 | Standard Westhill logo outro | As in the series component. | The standard 4.5 s animated Westhill logo outro, unchanged. |  | The withheld last harp note (D) lands on the outro's first logo frame, then hands over to the outro's own audio. |

## Sustos

- **t:** 0.4 · **what:** A match flares and reveals a coffin lid 30 cm from your face as a hand slams against it. · **why_it_works:** There is no establishing shot. The phone in the viewer's hand becomes the coffin, which stops the scroll in under half a second with instant claustrophobia.
- **t:** 16.7 · **what:** The trowel stops, the singing stops, and the shadow of a sombrero slides into a beam: someone is listening. Then comes the muffled excuse «—Nomás son los muertos acomodándose», and the bell drowns out our pounding. · **why_it_works:** An almost-rescue. Hope is handed to the viewer and taken away by a single bell toll. It also shows how people were buried alive by mistake: hurry, fear and someone who chose not to open the niche.
- **t:** 20.6 · **what:** The last brick goes in. The final thread of light and the muffled 'Las Golondrinas' cut to dead silence together. · **why_it_works:** Dread through loss. Each brick took away some of the light and the song. A Mexican audience knows Las Golondrinas as the farewell song, so they understand that the mourners were saying goodbye to someone still alive.
- **t:** 21.4 · **what:** For 3 subliminal frames, the sparks of a failed match light a pale, leathery hand flat on the side board that isn't ours. · **why_it_works:** It is read subconsciously and never confirmed. It plants the neighbor, makes the knocks feel inevitable, and rewards rewatching ('¿lo viste?'), which helps Reels retention.
- **t:** 26.8 · **what:** The knocks from the next niche answer ours in exactly the same rhythm. · **why_it_works:** Uncanny intelligence: something on the other side is listening. The 0.8 s of total silence before the answer turns the pause into suspense.
- **t:** 29.2 · **what:** MAIN JUMP SCARE: a mummified face frozen in a scream slams into the knothole, the board tears open, a leathery hand bursts toward the lens, and the gust kills the last flame. · **why_it_works:** A held breath, near silence and a slow push narrow the eye to one point, so the hit lands exactly where the viewer is staring. The flame dies with the hit, so the image vanishes before the brain resolves it and is reconstructed as worse. It also reads on muted autoplay (shake, flash, burst).
- **t:** 36.9 · **what:** The 1865 gravedigger recoils, and his swinging lantern reveals hundreds of claw scratches and our own mummified hands still raised, the rosary on the wrist. · **why_it_works:** Tragic horror. We see how long the fight lasted in the dark, and the 'monster' he fears is us. It shows the legend's 'expresiones de terror y desesperación' without a drop of gore.
- **t:** 40.5 · **what:** After the title, with nothing moving on screen, niche 4 knocks four times and each knock sets a quarter of the carved 4 alight. · **why_it_works:** The closing sting: the story seemed over, and it knocks again. The scare and the countdown number are the same moment, and the viewer counts the four knocks themselves.

## Revelación del número

The 4 is the number of the niche where 'you' were sealed: Gaveta 4.

It is carved into the stone lintel above the niche, drawn as a Rye glyph on the canvas: dark groove offset (+3, +3), bone bevel highlight (-2, -2), stone texture clipped inside the glyph. We first see it when we finally leave the coffin in 1865 and look back at the wall.

After the title, the camera settles with the carved 4 at y≈900, about 330 px tall, and the wall dims and defocuses. Four knocks come from inside the niche (40.50, 40.90, 41.30, 41.70 s); our mummified hands below never move. Each knock lights the next quarter of the groove like a burning fuse (#F26D3D core, #F5C242 halo): stem, diagonal, crossbar, stem foot.

At 41.85 s the complete numeral flares and lifts off the stone (scale 1 to 1.12, forward parallax) to become the hero numeral of the lockup, about 400 px tall. LeyendaLockup adds FALTAN above (top=560), DÍAS below (bottom=1150) and '28 · 10' (≈y 1278). A veladora lights on the niche ledge and fresh cempasúchil petals settle there.

The episode draws the numeral the whole time, so there is no swap between the carved 4 and the lockup 4.

## Música

For 38 seconds the soundtrack is the coffin; score only enters where the story allows it. Key: D.

(1) DRONE: a low D drone (sine plus a slightly detuned saw, low-passed at 300 Hz, -30 dB) that sounds only while there is fire, so its absence becomes a cue. In the last-match act it adds a sustained high string harmonic on A5.

(2) DIEGETIC FAREWELL: 'Las Golondrinas' (Narciso Serradell, 1862, public domain) in our own synthesized performance, as the mourners would play it: Karplus-Strong requinto plus a wordless 8-voice 'oo' formant choir, D major, rubato at about 66 BPM, behind a 2.2 kHz low-pass and a distant hall reverb.
- Each brick drops the cutoff (2.2 kHz, 1.2 kHz, 700 Hz, 400 Hz, 200 Hz) and the gain by 4 dB, with 50 ms crossfades.
- The singing stops at 16.5 s when the gravedigger listens and resumes, thinner, at 18.6 s.
- The last brick cuts it to silence at 20.6 s.

(3) BELL: one doble de difuntos toll at 18.4 s (additive inharmonic partials 0.5/1/1.19/1.5/2/2.5/2.67/3, long tail) masks our pounding. In the time-lapse, bell tolls accelerate from 0.9 s to 0.12 s intervals and blur into a metallic drone over a descending string glissando.

(4) PAYOFF REPRISE: from 38.2 s a solo harp (plucked synthesis with body resonance) plays the first half-phrase of 'Las Golondrinas' reharmonized in D minor. It stops on a suspended A for the four knocks, which come with bowed-metal tones D-F-A-D. It resumes on the lift over a soft choir pad and withholds its last note (D) until the first logo frame of the outro.

SCORED SILENCES: 9.4-10.0 s, 16.5-17.3 s (near silence), 20.6-21.0 s, 26.0-26.8 s, near silence 27.8-29.2 s, and 29.6-30.3 s.

MASTER: -14 LUFS integrated, true peak ≤ -1 dBTP via sfx.master. The scare sting is the loudest moment, about 6 dB above its surroundings before the master stage. The digital silences must survive the limiter and dither.

## Diseño sonoro

- Fingernail scratch on wood, extremely close, through a boxy coffin impulse response (single and four-voice detuned versions)
- Ragged inhale, gasp, panicked breathing, held breath, short rapid breaths (formant synthesis in the confined reverb)
- Heartbeat: 96 BPM rising to 120; later a weak 60 to 40 BPM that stops at 32.0 s
- Match strike (rasp, phosphor pop, ignition hiss); a weaker variant; a failed strike with spark crackle
- Match flame crackle; thin starved flame hiss; fingertip sizzle; flame puff-out; gust snuff
- Palm slam and palm pushes on a wooden lid; fist thumps on the head board
- Wood creaks under pressure; seam tick as the lid flexes 1 px
- Dust sifting and settling
- Muffled wordless wail into the lid (formant 'aah')
- Distant muffled footsteps on gravel; tin lantern handle creak
- Trowel scrape, wet mortar slap, four brick thunks plus the final thunk, each step lowering the exterior low-pass
- Muffled unintelligible male murmur through brick (formant babble, low-passed at 400 Hz)
- Single doble de difuntos bell toll; accelerating bell tolls that blur into a metallic drone
- Wooden knocks from the neighboring niche (modal synthesis about 180/420/950 Hz, hollow, panned right) and our lighter knuckle knocks
- Knot plug pop and tiny clatter; faint dry breath rattle inside the hole
- Jump-scare sting: white-noise burst, dissonant choir cluster (D, E-flat, A-flat), wood splinter crack, sub boom sweeping 60 to 38 Hz
- Water drip in a cavity
- Crystalline mineral ticks; thin wind through a crack; descending string glissando
- Chisel strikes on brick (metal on stone), brick collapse rumble, dust whoosh
- Long dry exhale as the seal breaks (formant, ambiguous)
- Gravedigger gasp and stumble on gravel; lantern swing creak
- Night crickets and wind outside; tecolote two-note hoot
- Four stone-filtered knocks with ember crackle and bowed-metal tones D-F-A-D
- Low D boom on the numeral lift
- Match strike and soft flame whoosh for the veladora; petal whisper
- Final barely audible knock at -30 dB

## Factibilidad

FILES: video/faltan-20-dias/src/leyendas/d04_momias.tsx with EP04_LEN = 1320 (44.0 s at 30 fps), and scripts/leyendas/d04.py with LEN = 1320 and STANDARD_OUTRO = True. Everything is drawn inside the kit's Scene paint(g, f, t) on Canvas2D, with per-frame PostOpts returned for grade, bloom, hatch, flash, ca and glitch. The kit is not modified; any missing helper lives in the episode file. No 3D is needed.

STRUCTURE: one paint function per shot (lidStraight, lidPitched, sideBoard, opening1865, exterior, lockup), selected by time. Shared state is pure functions of f.

COFFIN:
- Cached wood tile (noiseTile stretched 8x vertically plus sinusoidal rings, tinted()).
- Hexagonal lid outline as a clip path; seams and nail heads as strokes and small radial gradients; side boards and head board as trapezoids shaded with paintShape.
- The pitch-up lerps the head-board height from 120 to 520 px and compresses the lid with setTransform scale and skew.

LIGHTING: draw the lit scene, then multiply a per-frame lightmap: a radial gradient at the flame position (radius 900 or 420 px), flicker from noise2D at 7 and 13 Hz, color stops per act.

SCRATCHES:
- Pre-existing grooves are hash-generated.
- Dynamic grooves are spawned along the fingertip paths and stored as a frame-indexed array computed from the keyed claw timeline, so they are deterministic and render-order independent.
- Each groove is a dark stroke plus a sand stroke offset toward the light.
- The 1865 'hundreds of scratches' are about 400 hash-placed four-groove clusters revealed by the lantern light pool.

HANDS:
- A palm polygon plus 5 fingers of 3 tapered capsule segments, ik2 from off-screen shoulders toward smoothPath targets, finger curls keyed with 1-2 frame stagger, tremble from noise2D.
- paintShape gives the body gradient, rim light toward the flame and the blanch tint.
- The rosary is a looped simChain.
- The mummified version is the same rig with morph m (width, knuckles, color, nails); the frozen claw pose is stored as data and reused.

SHADOWS: draw the hand silhouettes into a 270x480 offscreen canvas projected from the light point (scale ≈1.6), blur it, upscale and multiply onto the lid before drawing the hands, so the layer order stays correct.

BEAMS:
- The kit's beam() from 5 crack points, additive gold, swaying ±3°.
- A brick wipe is a horizontal mask on a beam's emission.
- The gravedigger's listening shadow is a soft blurred head-and-brim mask that attenuates beam 3.
- Dust brightness comes from the beam mask.

FLAMES: kit flame2D and candle2D. The match is a rect with an advancing char gradient and curl. Sparks, dust and splinters use deterministic seeds; the smoke curl uses kit smoke().

KNOTHOLE:
- An ellipse with grain lines displaced radially.
- After the pop, the board is drawn with an even-odd hole path.
- At the scare the hole polygon expands along precomputed radial splinter cracks.
- Order: face plate first (behind), then the board with the hole, then splinters and the hand burst in front, then near dust.

MUMMY FACE: bezier paths (skin plate, socket, cheekbone ridge, open mouth, 6 teeth as irregular rounded rects, about 30 wrinkle strokes) plus post hatch 0.45 for frames 876-888. The lunge is a rigid scale and rotation; the hand burst is the mummified hand rig scaled 0.6 to 1.9 with a blurred() copy as it nears the lens.

TIME-LAPSE: one thin teal beam whose intensity follows an accelerating raised-cosine swell (frequency capped at 3 Hz, delta capped at 20%) crossfading into a steady shimmer. Morph m eases from 0 to 1; crystals come from speckle() with growing density.

GRAVEDIGGER 1865:
- Silhouette paths with paintShape rim light.
- simCloth 12x14 sarape pinned at the shoulder; simChain 2-link lantern pendulum.
- springFollow for lean, freeze and recoil; breath vapor from smoke().
- The jagged opening is a polygon of bricks with rim-lit edges.
- The lantern angle drives the light-pool position inside the coffin.

EXTERIOR: stage.ts onPlane layers, far to near:
- sky gradient plus moon glow()
- cerros with window dots
- cypresses
- niche wall (surface() stone, niche rectangles, blank plaques)
- open niches (black interiors, mummified hand rigs at m=1, faint mouth shape)
- carved 4 (Rye fillText into a cached offscreen canvas with bevel offsets, stone clip and ember fuse mask plus glow())
- fogBand
- dropped lantern and petals
The gravedigger's wall shadow is a blurred silhouette translated right. Depth of field uses stage dof(); post hatch 0.3.

EMBER FUSE: an authored 4-segment skeleton polyline matched to the Rye '4'. A thick round-capped stroke along it, advanced per knock, is used as a destination-in mask over the glyph's ember fill, so the glow stays inside the carved shape.

TEXT: kit Line in the DOM (modes soft, flicker, burn, whisper, slam; accent per word) with only Rye and Alike, every line pre-broken to fit 940 px. Lockup: LeyendaLockup (top=560, bottom=1150) with the episode's canvas 4. Load Rye for the canvas with delayRender plus document.fonts.load('300px Rye') before the first paint that uses it.

PERFORMANCE (software WebGL, 4 cores): wood, stone and noise tiles cached; blurs at quarter resolution; at most 600 particles; cloth and chain sims precomputed once via cached keys; a single post pass. Estimated 0.6-1.2 s per frame, so about 8-12 minutes for 1320 frames plus the outro.

AUDIO: numpy in d04.py plus leyendas_sfx blocks. Synthetic boxy impulse response convolved with every in-coffin sound; Karplus-Strong requinto and formant choir for 'Las Golondrinas'; a piecewise Butterworth low-pass with 50 ms crossfades at each brick; modal synthesis for knocks; additive inharmonic bells; noise-burst match strikes; formant breaths, wail, murmur and rattle; sting from noise, choir cluster and sub sweep; plucked harp. Cue times come from the same frame constants as the TSX. Master via sfx.master.

DETERMINISM: hash and noise2D only, never Math.random.

## Riesgos

1) DARK-FRAME COMPRESSION: Instagram crushes near-black into blocks and banding. Use grain 0.10 and dithering on all gradients, keep key subjects at 12-15% luma or above, reserve near-black for the silence beats, and do a test upload before final.

2) POV READABILITY: the hexagonal outline, nail heads and the hand entering from below must say 'inside a coffin' within 0.5 s. Test with 3 cold viewers at phone size; if it doesn't read, widen the visible side boards.

3) PHOTOSENSITIVITY: the time-lapse stays at or below 3 swells per second and a 20% luminance change. The scare flash is a single frame group, not a strobe.

4) INTENSITY AND RESPECT: these were real people. Keep every mummy a stylized engraving, never photoreal. No decomposition, fluids, blood or wounds. The face is on screen for under 0.4 s and death is implied only by the heartbeat stopping. Do not imitate any recognizable museum mummy or famous case. Never show the modern museum. The ending (veladora and petals) frames them as people to remember, not monsters.

5) HISTORICAL FRAMING: the 1833 cholera and the 1865 exhumations are the commonly told version; no further claims are made on screen. Friction matches in 1833 are a slight stretch; 'cerillo' reads instantly. A yesquero (flint and steel) is the strict alternative if the client objects.

6) NEIGHBOR LOGIC: knocks and a knothole between niches are legend logic. The subliminal hand, the copied rhythm and the second pair of hands in the exterior carry it.

7) THE SCARE MUST READ: the hole must reach about 286x390 px before the hit and tear to about 640x820 px. If the face still reads small in stills, push to 3.0x.

8) TEXT AGAINST LIGHT: the 1865 flood and the beams can wash out bone text. Keep the kit scrim and drop beam intensity 30% under the text band.

9) LAYER ORDER:
- Hand shadows go under the hands.
- The face goes behind the board with the hole; the hand burst and splinters go in front.
- The listening shadow attenuates only beam 3, never the lid.
- Outside: sky, cerros, cypresses, wall, niche interiors, lintel, fog, lantern, petals, text.
- Lockup: dimmed wall, glowing 4, veladora, petals, text.
Check with a contact sheet at frames 30, 120, 330, 420, 520, 600, 640, 700, 820, 860, 877, 880, 1000, 1100, 1130, 1160, 1230, 1260 and 1300.

10) FONT LOADING: the canvas Rye needs the delayRender guard, or the first frames fall back to a default serif.

11) READING TIME: the cards at 26.9-27.8 s and 37.0-38.0 s are short. If review finds them rushed, take frames from the black beats, never from the scare build-up.

12) SERIES OVERLAP: if Día 0 or Día 2 also uses 'Las Golondrinas' as its main theme, keep it here only as the diegetic farewell. If needed, replace the harp reprise with an original D-minor alabado so the melody's emotional peak is saved for Día 0.

13) GENDER: second person stays neutral except 'No eres el primero' (a generic masculine, acceptable in Mexican Spanish).

14) WORDING: checked. No 'ofrenda', 'evento' or 'concurso' anywhere. 'Gaveta', 'panteón', 'cerillo' and 'nomás' are natural Mexican usage. The music is public domain in our own synthesized performance.

## Especificación de construcción

- **environments:** - COFFIN LID, POV straight up (lidStraight).
- Geometry: hexagonal clip path, 840 px wide at the head end (top), 1020 px at y≈1250 (shoulders), narrowing below. Three planks; seams at x≈370 and x≈710 (3 px dark gap plus 1 px sand chamfer); square iron nail heads every 220 px; inner side-board strips 30-70 px wide; 120 px head-board trapezoid at the top.
- Wood: cached grain tile (noiseTile stretched 8x vertically plus sinusoidal ring lines, tinted #A83A25 toward #3B2412).
- Scratches: hash-placed pre-existing grooves plus a frame-indexed dynamic groove store.
- Light states it must support: warm match pool (900 px radius), starved teal-fringed match (420 px radius), teal moon thread (time-lapse), and darkness.
- COFFIN LID, pitched up toward the head end (lidPitched).
- Geometry: head-board trapezoid lerps from 120 to 520 px; the lid compressed with setTransform scale and skew.
- Five irregular crack polygons that act as beam origins.
- Brick-wipe masks per crack.
- A mortar hairline crack that admits the moon thread.
- Chisel crack lines branching across the head board on 3 blows, then a collapse into a jagged opening (used in 1865).
- RIGHT SIDE BOARD, raked view (sideBoard, the whip-pan destination).
- The board fills 75% of the frame, with the lid as a perspective strip on the left.
- The knot: a vertical ellipse 110x150 px at (600, 940) with grain lines displaced radially around it, and a knot plug sprite.
- After the pop: an even-odd hole path with a lit bevel ring (2 cm board thickness).
- Precomputed radial splinter crack polygons that tear the hole open to about 640x820 screen px at the scare.
- NEIGHBOR CAVITY behind the knothole: a near-black #0A0604 space where the face plate is drawn before the board, so the board occludes it.
- 1865 BROKEN OPENING (opening1865).
- A jagged polygon of bricks along the top edge, with rim-lit brick edges.
- A warm lantern-light flood (exposure 0.3 to 1.1, bloom 1.2) and a dust billow.
- The gravedigger silhouette framed in the opening.
- The light pool on the lid, driven by the lantern pendulum, revealing about 400 four-groove scratch clusters.
- EXTERIOR: niche wall of the Panteón de Santa Paula at night (exterior, built with stage.ts onPlane). Planes, far to near:
- Sky gradient #0B1F22 to teal haze, with a clouded moon glow().
- Guanajuato cerros silhouette with warm window dots.
- Two cypresses.
- Stone niche wall: 4 columns × 6 rows, surface() stone texture, blank plaques.
- Center niche open and black, with our mummified hands protruding and a faint open-mouth shape inside.
- Adjacent niche open, with a second pair of raised hands at the edge of the light.
- Stone lintel with the carved Rye '4': groove offset (+3, +3), bevel highlight (-2, -2), stone clip.
- Flagstones with a few dry cempasúchil petals.
- fogBand at the foot of the wall.
- The dropped lantern in the foreground.
- The gravedigger's wall shadow.
- Post hatch 0.3, moon light from top-left, lantern light from bottom-right, dof() by depth.
Camera path: camPath z 1200 to 950 plus a 40 px crane, then a push in to frame the lintel 4 at y≈900, about 330 px tall.
- LOCKUP COMPOSITION.
- The exterior wall dimmed to 30% and blurred.
- The glowing lifted 4 (about 400 px, centered y≈900).
- The niche ledge at y≈1560-1700 holding a veladora (candle2D in a glass cylinder drawn in 2D).
- Fresh petals settling on the ledge.
- LeyendaLockup text on top.
- SILENCE/BLACK CARDS: #050302 plus grain 0.10 (beats at 0-0.4, 9.4-10.0, 20.6-21.4 and 29.6-32.2 s). Never flat #000.
- **characters_and_rigs:** - POV HANDS (left and right).
- Structure: palm polygon plus 5 fingers × 3 tapered capsule segments.
- Solver: ik2 from off-screen shoulders at (±300, 2150) toward smoothPath targets; finger curls keyed with a 1-2 frame stagger.
- Actions: press cycle 16 frames (palm scaleY 0.96, splay 3°); claw drag 150 px over 12 frames with groove spawning; fist pound every 14 frames with a 2-frame squash.
- Tremble: noise2D at 9 Hz, 1.5-2 px.
- Shading: paintShape body gradient, rim light toward the current light, fingertip blanch on contact.
- Sleeve: camisa de manta, bone, frayed edge.
- Rosary: 12 wooden beads plus a small cross, a looped simChain on the left wrist.
- Morph m 0 to 1 into the mummified version: width ×0.7, knuckle bumps, long bone nails, sand to #3A2414, crosshatch, yellowed and frayed sleeve, mineral sparkles.
- The frozen claw pose is stored as data and reused at 32.2-38.0 s and in the exterior.
- MATCH PROP: a 90 px stick with an advancing char-front gradient and curl; flame2D (70 px down to 30 px, lean = breath phase × 12°); a tumble of 540° under gravity; an ember dot; a smoke() curl. Starved variant: 40 px flame with a blue-teal fringe.
- NEIGHBOR'S SUBLIMINAL HAND: a static pale, leathery flat hand on the right side board, shown only on frames 642-644, lit by spark flashes.
- NEIGHBOR FACE PLATE (engraving):
- Bezier skin plate, one deep empty socket above the mouth, cheekbone ridge with bone highlight.
- Mouth oval 1:1.4 with a #0A0604 interior and 6 irregular bone teeth with brown stains.
- About 30 radiating wrinkle strokes and a cold rim from the flame.
- Rigid lunge: scale 1 to 1.35 over 5 frames, ease-out-back, rotation 4°. No expression change ever.
- Drawn with post hatch 0.45 for frames 876-888.
- NEIGHBOR'S HAND BURST: the mummified hand rig scaled 0.6 to 1.9 over 6 frames (ease-out expo), fingers splaying with a 1-frame stagger, a blurred() copy crossfaded in as it nears the lens, splinter particles traveling with it.
- 1833 GRAVEDIGGER SHADOW: a soft blurred silhouette mask of a head plus sombrero brim that slides into beam 3 over 10 frames (ease-out), attenuating that beam's emission. 2 px nods while he speaks; withdraws over 8 frames at 18.4 s.
- 1865 GRAVEDIGGER:
- Silhouette paths: sombrero brim ellipse 300x60 plus crown, head, shoulders, sarape on the left shoulder, right arm raising a tin farol.
- paintShape rim light; two 2 px eye glints; breath vapor via smoke().
- simCloth 12x14 sarape pinned along the shoulder line.
- simChain 2-link lantern pendulum whose angle drives the light-pool position.
- springFollow for lean-in, a 0.4 s freeze, and recoil (target jumps back 160 px, giving natural overshoot).
- TIN FAROL (1865 and the dropped exterior lantern): rectangular frame, glass panes, flame2D candle inside, warm glow() halo. In the exterior, a damped pendulum rocking from 8° down to 2°.
- EXTERIOR MUMMIFIED HANDS: the hand rig at m=1, static claw pose, in niche 4 (ours, with the rosary) and in the adjacent niche (the neighbor's), lit by the lantern.
- GRAVEDIGGER WALL SHADOW (exterior): his silhouette, blurred, projected large onto the wall and translated right until it slides off frame.
- **effects:** - LIGHTMAP MULTIPLY: a per-frame radial gradient at the light position, with radius per act (900, 520 or 420 px), flicker from noise2D at 7 and 13 Hz, and color stops per act.
- HAND SHADOW PROJECTION: hand silhouettes drawn into a 270x480 offscreen canvas projected from the light point (scale ≈1.6), blurred at low resolution, upscaled and multiplied onto the lid before the hands are drawn.
- SCRATCH GROOVES IN RELIEF: a dark 2 px stroke plus a 1 px sand stroke offset along the normalized vector toward the light. Dynamic grooves spawn along fingertip paths; about 400 hash-placed clusters are revealed by the 1865 light pool.
- MATCH STRIKE: 14 sparks (2-5 frame life), flame bloom from 0 to 70 px over 5 frames, post flash 0.7 to 0 and exposure 1.4 to 1.0 over 8 frames. Failed-strike spark burst for frames 642-644.
- DUST: seam sifting that falls toward camera (particles grow 1x to 3x and defocus); motes that are bright only inside the beams; jumps off the side board on each knock; puffs per brick; chisel jets; the 1865 billow; lintel puffs on the four final knocks.
- LANTERN BEAMS: 5 kit beam() shafts from the head-board cracks, additive gold, swaying ±3° at 0.6 Hz. Per-brick horizontal wipe masks over 8 frames. Beam 3 attenuated by the listening shadow. The last thread narrows from 6 to 1 px and closes at 20.6 s.
- STARVED-MATCH COLD GRADE: saturation 0.7, a blue-teal fringe on the flame, light radius 420 px.
- WHIP PAN SMEAR: 4 offset draws at 25% alpha over 9 frames, landing on the raked side board.
- KNOTHOLE: plug pop and drop, an even-odd hole with a lit bevel ring, a 2 px bone glint for 4 frames, radial splinter tear-open, and splinter particles flying at the lens.
- JUMP-SCARE POST (frames 876-888): flash 0.5 on frame 876, ca 4, glitch 0.25 on frames 876-880, hatch 0.45, a 36 px shake decaying over 10 frames, 3° roll, scale recoil from 2.6 to 2.2. Flame snuffed by the gust on frame 882; hard cut to black on frame 888.
- CAMERA BODY: breathing bob (8 px at 0.5 Hz, 10 px at 0.7 Hz, 0 while holding breath, 0 forever after 32.0 s), 1.5 px handheld jitter, kit shake() on hits, pitch-up transitions done as 2D skew.
- TIME-LAPSE MOON THREAD: a thin teal beam whose intensity follows an accelerating raised-cosine swell (frequency ≤3 Hz, Δluminance ≤20%), crossfading into a steady shimmer. Mineral crystals from speckle() with growing density (bone and gold sparkles).
- 1865 OPENING: branching crack lines per chisel blow, brick collapse, light burst (exposure 0.3 to 1.1, bloom 1.2), a light pool sweeping along the lantern pendulum, breath vapor.
- EXTERIOR ATMOSPHERE: moon glow(), warm window dots, fogBand at the foot of the wall, engraving hatch 0.3, depth of field by dof().
- CARVED 4 AND EMBER FUSE: a Rye glyph rendered to a cached offscreen canvas with a groove and bevel, stone texture clipped inside. A 4-segment authored skeleton polyline; a thick round-capped stroke advanced per knock acts as a destination-in mask over the ember fill (#F26D3D core, #F5C242 additive glow). Mortar puff and a 3 px camera kick on each knock.
- NUMERAL LIFT: scale 1 to 1.12 with forward parallax at 41.85 s; the wall dims to 30% and blurs; a gentle ±6% candle flicker on the glowing 4.
- VELADORA AND PETALS: a candle2D veladora ignites at 42.2 s (match flare, then a steady flame with a warm glow on the ledge). 6-8 fresh cempasúchil petals in 2D flutter-fall (scaleX = cos ωt, 0.6 Hz sway, about 90 px/s) settle on the ledge. Dry petals sit on the exterior flagstones.
- GLOBAL POST: grain 0.10, vignette 0.65, blue-noise dither on gradients, per-act shadow and highlight tints anchored to #231305. A 6-frame crossfade into the standard outro at 43.8-44.0 s.
- **typography_moments:** - 1.1-3.3 s: «Despiertas.» Rye 96, bone #D9CDB6, y=700, mode flicker (beam synced to the flame intensity).
- 3.6-6.3 s: «GUANAJUATO · 1833» Rye 56, gold #F5C242, y=600, soft. From 4.0-6.3 s: «Con el cólera, a los muertos\nlos enterraban el mismo día.» Alike 52, bone, y=700, soft, scrim 0.45.
- 6.7-9.2 s: «Te sepultaron\ncon vida.» Rye 76, cempasúchil #F26D3D, y=700, mode burn.
- 11.4-14.7 s: «Afuera, alguien canta.» Alike 54, bone, y=820, soft. Second line «Te están despidiendo.» enters at 12.6 s at y=900, same style. Both out at 14.7 s. Beam intensity drops 30% under the text band.
- 17.3-18.9 s: «—Nomás son los muertos\nacomodándose.» Alike 54, sand #E0BB8F, y=800, mode whisper. Em-dash dialogue for the overheard gravedigger.
- 22.1-24.1 s: «Te queda un cerillo.\nY casi nada de aire.» Alike 52, bone, y=700, mode whisper.
- 26.9-27.8 s: «Alguien te responde.» Rye 56, bone, y=600, mode whisper. Cleared before the knothole push.
- 30.3-32.2 s: «No eres el primero.» Rye 64, bone, y=880, soft with a faint flicker, on black.
- 32.8-35.1 s: «La tierra los secó.\nPero guardó sus gritos.» Alike 54, bone, accent «gritos» in #F26D3D, y=720, soft.
- 36.3-38.0 s: «1865. Abrieron las gavetas.» Alike 52, bone, y=880, soft. From 37.0-38.0 s: «Seguían gritando.» Rye 68, bone, y=960, mode slam.
- 38.4-40.2 s: «LAS MOMIAS\nDE GUANAJUATO» Rye 80, gold #F5C242, y=420, soft, tracking 0.04 em. Must fit within 940 px.
- 41.9-44.0 s: LeyendaLockup with dias=4, fecha='28 · 10', top=560, bottom=1150 (FALTAN at 41.9 s, DÍAS at 42.1 s, date at about 42.5 s, y≈1278). The episode draws the canvas Rye '4' (about 400 px, centered y≈900) between them.
- Global typography checks: only Rye and Alike; every line pre-broken to fit the kit's 940 px box; no text above y=262 or below y=1568; no 'ofrenda', 'evento' or 'concurso'; Rye loaded for the canvas via delayRender plus document.fonts.load('300px Rye').
- **audio_cues:** - 0.00: close fingernail scratch through the coffin impulse response; ragged inhale; heartbeat starts at 96 BPM.
- 0.40: match strike (rasp, pop, hiss); flame crackle starts.
- 0.80: palm slam on the lid (frame 24); dust sift; gasp; heartbeat to 110 BPM.
- 2.0-6.4: three palm presses with lid creaks and a seam tick; two four-voice claw scratches; panicked breathing; low D drone fades in at -30 dB from 3.0.
- 6.4-9.2: match hiss rises; fingertip sizzle and pained hiss at 8.6; flame puff-out at 9.2; drone hard-cuts at 9.2.
- 9.4-10.0: dead digital silence.
- 10.0-10.8: distant footsteps on gravel (low-pass 600 Hz); lantern handle creak.
- 11.0: 'Las Golondrinas' starts outside (requinto plus 'oo' choir, D major, low-pass 2.2 kHz, distant reverb). Footsteps stop.
- 12.4-15.0: alternating fist thumps every 14 frames; muffled wordless wail at about 13.5.
- 15.3: trowel scrape, mortar slap, brick thunk 1; song low-pass to 1.2 kHz, -4 dB.
- 16.0: brick thunk 2; song low-pass to 700 Hz, -4 dB.
- 16.5: trowel stops; singing stops. Only held breath and a faint lantern creak until 17.3.
- 17.3-18.2: muffled unintelligible male murmur through brick (formant babble, low-pass 400 Hz).
- 18.4: doble de difuntos bell toll masking our renewed fist pounding.
- 18.6: trowel resumes; 'Las Golondrinas' resumes, thinner.
- 19.1: brick thunk 3; song low-pass to 400 Hz, -4 dB.
- 19.8: brick thunk 4; song low-pass to 200 Hz, -4 dB.
- 20.6: final brick thunk; every exterior sound cuts to dead silence until 21.4.
- 21.4: failed match strike with spark crackle.
- 22.0: thin successful strike; high starved-flame hiss; rapid breaths; heartbeat at 120 BPM; drone returns with a sustained A5 string harmonic.
- 24.2: three hollow heavy knocks panned right, with dust patter.
- 24.6: whip-pan whoosh (soft).
- 25.6: our two lighter knuckle knocks.
- 26.0-26.8: drone and heartbeat drop out; silence.
- 26.8: two knocks answer, copying our rhythm to the frame.
- 28.1: knot plug pop and tiny clatter; only flame hiss remains.
- 28.6: faint dry breath rattle from inside the hole (-40 dB).
- 29.2 (frame 876): sting with white-noise burst, choir cluster D/E-flat/A-flat 'aah', splinter crack, sub boom sweeping 60 to 38 Hz. Flame snuff at frame 882. Hard stop at 29.6 into silence.
- 30.3-32.0: weak heartbeat slowing from 60 to 40 BPM, stopping at 32.0; water drip at 31.0.
- 32.2-35.2: bell tolls accelerating from 0.9 s to 0.12 s intervals, blurring into a metallic drone; mineral ticks; thin wind; descending string glissando.
- 35.2 / 35.5 / 35.8: chisel strikes on brick.
- 35.9: brick collapse rumble and dust whoosh; long dry exhale from the coffin; exterior low-pass opens fully (crickets and wind fade in).
- 36.3-36.9: gravedigger leans in with lantern creaks; gasp and gravel stumble at 36.9; lantern swing creaks.
- 38.2: tecolote two-note hoot; crickets, wind, the dropped lantern creaking.
- 38.2-40.3: solo harp, first half-phrase of 'Las Golondrinas' in D minor, stopping on a suspended A.
- 40.50 / 40.90 / 41.30 / 41.70: four stone-filtered knocks, each with ember crackle and a bowed-metal tone (D, F, A, D an octave up).
- 41.85: low D boom on the numeral lift; harp resumes over a soft choir pad, withholding the final note.
- 42.2: match strike and soft flame whoosh (veladora); petal whisper.
- 43.6: final knock at -30 dB.
- 43.8-44.0: crossfade into the standard outro; the withheld harp D lands on the outro's first logo frame, then the outro's own audio.
- MASTER: -14 LUFS integrated, true peak ≤ -1 dBTP via sfx.master. The sting is the loudest event. The digital silences at 9.4-10.0, 20.6-21.4 and 29.6-30.3 must survive the limiter and dither.

## Injertos de los otros tratamientos

The base is C: the first-person coffin lid, motivated light, sound filtered by the coffin, the knothole scare, and the cut outside in 1865. Grafts:
(1) From B, the mason's almost-rescue, rebuilt for POV. At 16.5 s the trowel stops, the mourners stop singing, and the shadow of a sombrero slides into one of the light beams: someone is leaning in to listen. We stop pounding and hold our breath.
(2) From A, the gravedigger's excuse, now heard as muffled, unintelligible speech with an em-dash caption: «—Nomás son los muertos / acomodándose.» Then, from B, the bell tolls right on top of our renewed pounding and masks it, the trowel starts again, and the song comes back. This adds the negligence behind 'sepultadas vivas por error' and the cruelty of a rescue that never comes.
(3) From A, the knock as the series' language, turned into the countdown. After the title, four knocks come from inside niche 4 while nothing on screen moves. Each knock lights one quarter of the carved 4 like a fuse, and on the fourth the numeral lifts. A faint final knock at -30 dB under the lockup says they are still there. Viewers count toc-toc-toc-toc: 4.
(4) From B, remembrance as the resolution: a veladora lights on the ledge of niche 4 and fresh cempasúchil petals fall. The harp reprise of Las Golondrinas withholds its last note until the Westhill logo appears. This turns horror into altar.
(5) From B and A, the engraved, stylized treatment of the mummy faces and the explicit rule against copying any real or famous mummy.
(6) New, for clarity: a rosary of wooden beads on our wrist, visible from the first slam. It is still on the mummified hand in 1865, which proves without text that the remains are ours.
(7) New: in the exterior, the neighboring niche is also open, with a second pair of raised hands. This replaces C's ambiguous hole, confirms «No eres el primero», and shows the 'muchas personas' of the legend.
Fixes: the knothole is enlarged and torn open during the scare so the face reads; every line is re-broken to fit the 940 px text box; the pre-outro length goes to 44.0 s so the lockup can breathe; the B museum twist is dropped for respect.
