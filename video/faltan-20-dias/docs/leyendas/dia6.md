# Día 6 · Lo que vio el espejo

> On the night her granddaughter is born, an abuela hangs an old tin mirror facing the cradle and stands open scissors in a cross on the windowsill. We see everything from inside that mirror, which cannot close its eyes. On the hill a woman leaves her legs by the fogón and becomes fire. The brujas cross the roofs. One is driven off by the scissors, then comes in through the reed ceiling to feed on the baby's light. The abuela wakes, rips the mirror off the wall and makes the witch look at her own face. At dawn her breath fogs the glass and reveals the mark the witch's finger left on it: a 6. That night, six lights watch the house.

**Duración:** 49 s + outro

## Recurso

LO QUE VIO EL ESPEJO. The camera is the abuela's amulet mirror, governed by five rules.
(1) THE SCREEN IS THE GLASS. Anything on the glass (breath fog, the rebozo wipe, foxing, scratches, the soot print, the crack, the slammed hand of fire, the abuela's fingers) is locked to the screen, sharp, and in front of everything. The reflected room sits behind it with real depth.
(2) IT MOVES ONLY LIKE A HANGING OBJECT. It swings on its nail as a damped pendulum, and the reflected world turns at twice the mirror's angle around the nail pivot above the frame (540, −180). It cannot pan, tilt up or zoom, so threats come from space it cannot see (under the sill, above the reeds): we hear them and see only their light.
(3) IT SPEAKS. First-person lines in Alike: «Soy el espejo de la abuela.», «Yo no puedo cerrar los ojos.»
(4) IT IS THE LEGEND'S OWN AMULET, SO THE CLIMAX IS THE CAMERA. The abuela tears it off the nail (the view drops and tilts, her fingers grip the screen edges), whips it round and aims it at the witch, and the payoff happens inside the lens.
(5) THE GLASS REMEMBERS. The witch's fingertip leaves an invisible trace that the abuela's breath turns into the countdown number.
Two quiet tells stay on all the way through so we never forget we are a mirror. Old rear-silvered glass ghost-doubles every bright light (5 px right, 9 px down, 18%). The image always turns at twice the mirror's angle.

## Dirección de arte

Painterly 2D 'grabado nocturno'. Silhouettes are shaded with paintShape (gradient body, inner shadow, warm rim). Post adds a light engraving hatch (0.12, rising to 0.30 in the face beat), grain 0.06 and vignette 0.35. Because the hatch is screen-space, it reads as engraving on the glass itself, which suits the device.

GRABADO DE LUMBRE: the hatch ink lerps from deep brown (#231305) toward a burnt gold (~#7A4A16) in proportion to how much of the frame's light comes from the brujas, so the engraving 'catches fire' whenever they are near.

THREE LIGHTS TELL THE STORY.
(1) THE VELADORA is the warm interior: #F5C242 core falling to #F26D3D. Shadows rest on #231305, adobe is sand #E0BB8F, the abuela's rebozo is terracotta #A83A25 with green #1F5C48 stripes, and cloth highlights are bone #D9CDB6.
(2) THE NIGHT through the window is cold teal: sky #071A22 to #12343C; hills #0B2228 / #0F2D31 / #13383A; valley fog tinted with #1F5C48; a bone half moon behind a cloud band; a few warm village windows.
(3) THE BRUJAS' FIRE is the only saturated colour: white-gold core #FFF3D6, then #F5C242, #F26D3D and a #A83A25 edge. Bloom is 1.1 and orange halation 0.5 during attacks, when fire takes over as the room's key light.
DAWN: violet-teal at the top, melting into gold and sand, with soft beams and dust motes.

THE OLD MIRROR LOOK: a warm-silver multiply (#EFE7D7); brown-black foxing (#1A0F07) creeping from the corners; about 120 hairline scratches that sparkle only when a light passes behind them; ghost doubles; a 24 px bevel darkening with a prismatic fringe.

COMPOSITION, in reflection space at 1080×1920:
- Vigas and carrizo (reed) ceiling band: y 0–320. No cobwebs.
- Window opening: x 300–1000, y 330–1030, with two open plank shutters. Scissors stand on the sill at x≈820.
- Hanging cradle: 360 px wide, centred x 690, y 1040–1260, on four mecate ropes that cross in front of the window.
- Abuela's chair: left, x 180–420.
- Veladora: large and soft in the lower-left foreground (x 130, y 1650).
- Dark floor band: y 1280–1580, kept clean as the home for all narrative text, inside the safe zone.

MATERIAL CULTURE: adobe, vigas and carrizo, mecate, rebozo, sarape swaddle, petate under the chair, hojalata (punched-tin) petal frame, iron tailor's scissors, a fogón hut on the hill, magueyes, tile roofs, a chapel bell at dawn, a tecolote.

No pointed hats, brooms, cauldrons, green flames, bats, pumpkins or cobwebs. No red glowing eyes (that look belongs to Día 3).

## Personajes

- **name:** El espejo (narrator and camera) · **how_shown:** Never seen from outside. It exists only as its glass surface (foxing, scratches, ghost doubles, bevel fringe, breath fog, wipe streaks, soot, the crack) and as the first-person lines in Alike. · **motion:** A damped pendulum on its nail: θ(t) = Σ A·e^(−(t−t_i)/τ)·sin(2π(t−t_i)/P), with P = 2.8 s.
Impulses:
- abuela's touch at 2.3 s (0.5°, τ 2.5 s)
- drafts at 14.5 s (0.2°), 23.5 s (0.15°) and 26.2–31 s (irregular 0.3–0.4°)
- re-hang at 36.2 s (settles crooked at 3°)
- straightening at 38.5 s (→0° over 0.4 s)
The reflection turns by 2θ around (540, −180); the glass layer never moves. It is completely still from 20 to 22 s.
Handheld mode, 31.75–36.2 s: drop 40 px and tilt −8° (easeOut 0.2 s); whip 0.3 s with 6-sample directional blur; 5% spring overshoot; then a 6 px / 9 Hz old-hands tremor.
- **name:** La abuela · **how_shown:** 2D only.
- Hook and dawn: an engraving-style extreme close-up of one eye and cheekbone (hand-drawn outline, iris with two catchlights, wrinkles hatched; candle under-light at night, dawn backlight at the end). This is the only part of her face ever shown.
- Otherwise: a back or profile silhouette with the rebozo over her head and a warm rim.
- Hands: partial silhouettes with a silver ring.
- Climax: four fingers per side gripping the screen edges, dark, out of focus, warm rim. · **motion:** Six-part silhouette (hood, torso, skirt, upper arm, forearm, hand). Arms use ik2 with springFollow lag (0.12 s), so gestures settle.
Walk: 1.1 s per step, 10° forward lean, 5 px head bob.
Cloth: rebozo simCloth 10×14 pinned at crown and shoulders; 18 fringe simChains; skirt hem as a cloth strip.
Scissors: open 0→90° in 0.5 s (easeOutBack, 4° overshoot).
Dozing: angular damped spring with falling stiffness. Nod 10° (back in 0.4 s), nod 18° (slower), final drop 25°. The hand slides off the rope over 0.8 s (easeIn). Sleeping breath lifts the shoulders 3 px every 3.4 s.
Waking: head jerk in 0.1 s; she rises and her silhouette fills the frame in 0.4 s.
Eye: blink closes in 4 frames and opens in 5; widen at the dawn reveal (lid +30% over 0.6 s).
- **name:** La niña recién nacida · **how_shown:** A swaddled bundle in a faded orange/green striped sarape inside the hanging cradle. Only her tiny 2D hand is seen: a palm ellipse and five rounded two-segment fingers with a soft rim. In the feeding beat, bone-white motes of vital energy rise from her. She is never touched or harmed. · **motion:** Swaddle breathes (+1.5% every 1.2 s) and wriggles on each whimper. The hand rises 60 px (easeInOut 0.8 s) with phase-offset finger curls. At 37.0 s she grasps the abuela's finger (curl 0→1 over 0.3 s).
The cradle is a precomputed damped pendulum:
- pushed at 4.6 s (3°, P 2.4 s)
- rocked by rope at 9–17 s (P 2.6 s)
- dies out by 21 s
- swings by itself from draft impulses during 27–31 s
Ropes are simChains.
- **name:** La Bruja de Fuego · **how_shown:** FIVE FORMS.
(a) Human form, seen once and only as a shadow: a kneeling woman projected about 3× inside the fogón's light fan on the hillside mist (9.6–12.0 s). Her face and body are never shown.
(b) Orb: white-gold core, turbulent orange shell, six noise-deformed flame lobes streaming like hair against its motion, an ember trail. Two darker oval hollows in the core flicker for single frames, and at the window they are held as eyes.
(c) Feeding form above the cradle: the orb's lower half with seven hanging flame tendrils that curl like fingers.
(d) True face, revealed only by the mirror: an ageless woman from the village drawn in glowing ember lines, with strong brow and cheekbones, hatching in the hollows, hair of rising flame and two white-gold coal eyes. Not a crone, no hooked nose.
(e) Hand of fire: her tendrils snapping into a five-fingered hand of flame that chars into a soot print on the glass. · **motion:** FLIGHT: Catmull-Rom paths; y = base − rise·easeOutCubic(t) + 6·sin(2π·0.7t) px; darts at 2.5× speed for 0.15 s. Lobes bank into turns and lag the velocity on a spring.
SHELL: r(θ,t) = R(1 + 0.18·fbm(θ, 1.7t)). The core pulses 1 + 0.08·sin in time with a heartbeat that speeds up.
IGNITION: point → flare to r70 → settle in 8 frames, with a spark puff.
AT THE WINDOW: it flinches at the scissors' plane, the shell crumpling inward on a spring (ζ 0.4) as 150 sparks burst out.
TENDRILS: 7 simChains (14 links) with springFollow tip targets that stop 40 px short of the bundle.
FACE: the shell parts from the centre outward like a curtain (0.4 s). Expression morphs hungry → recognition → horror over 0.7 s (three keyframes with identical topology, eased, 2 px tremble).
LUNGE: scale 1.0→3.2 in 5 frames (easeInExpo).
HAND: tendrils converge into the hand shape in 3 frames, slam, flatten to a soot print. Ember cracks cool over 1.5 s. The index fingertip drags for 0.6 s.
EXIT: hurled back, scale 3→0.05 over 0.9 s into a comet streak, ending in a spark burst.
- **name:** Las otras brujas · **how_shown:** Distant orbs, 30–50 px, ghost-doubled. There are two in the flyover. In the final sting, six small fire points sit on the dark ridge, two of them inside the loop of the 6 like a pair of eyes. · **motion:** Flyover: rise from far-left and far-right hills at 14.6 s and 15.1 s, cross the village roofs with a 0.7 Hz bob and darts, dip behind the near hill at 16.9 s, then dart away and wink out at 35.6 s.
Sting: six ignitions in an 80 ms ripple at 42.6 s; breathe (scale 1±0.06 at 0.8 Hz); blink out right to left, 60 ms apart, at 43.9 s.
- **name:** El tecolote (false scare) · **how_shown:** A 2D owl silhouette landing on the sill: 380 px wingspan, moon rim on the feathers, two amber #F5C242 eye discs that catch the candle. · **motion:** Four wing keyposes (up, spread, down, folded), eased, with primary feathers as fluttering chains. Lands with 3 settling flaps (0.5 s). Head snaps 90° and back on a spring (0.15 s). Launches up-left with a downward wing sweep (easeIn).

## Beats

| t (s) | Escena | Cámara | Acción | Texto en pantalla | Sonido |
|---|---|---|---|---|---|
| 0.0–2.2 | HOOK. Breath on the glass. | Mirror POV, locked. The screen is the glass: fog and cloth are sharp and fixed to the screen. In the reflection the abuela's face is about 15 cm away and the window about 4 m behind her, soft. | 0.00–0.10: near-black frame; only the reflected veladora as a big soft bokeh at lower left.<br>0.10–0.60: a breath-fog bloom grows from screen centre (r 0→520 px, easeOutCubic, ragged fbm edge): a 60% grey-white veil that blurs and lifts what is behind it.<br>0.60–1.25: a rebozo corner (terracotta/green stripes, fringe as 8 simChains, directional blur) wipes across the glass in a rising arc from lower left to upper right. It clears the fog along its path and leaves streaky edges. Through the cleared arc, an engraving-style extreme close-up of the abuela's eye and cheekbone (candle under-light, two catchlights) fills about 55% of the frame, centred at y≈820.<br>1.35: far behind her shoulder, through the window, a tiny orange point (18 px plus bloom) comes loose from a black hill line like a star that moves, ghost-doubled by the old glass. It pauses 0.3 s, pulsing.<br>1.70: she blinks (4 frames closed, 5 open) and misses it.<br>1.90: she begins to lean back.<br>TEXT: Alike 64 px, bone, centred, block top y=1410, soft fade-up as if surfacing through the fog, 0.30–2.10. | Soy el espejo de la abuela. | 0.00–0.10 digital silence.<br>0.10: an intimate warm exhale on glass (pink noise through an 'haa' formant, LP 3 kHz, 0.5 s).<br>0.60–1.25: cloth squeak on glass (band-passed noise, 18 Hz stick-slip).<br>0.70: the mirror's voice fades in, a glass-harmonica drone (D4 + A4 sines beating at 0.7 Hz, −24 dB).<br>1.35: a tiny distant crackle over a 40 Hz sub swell (−30 dB).<br>1.60: distant tecolote, two low hoots with long reverb. |
| 2.2–5.9 | The room. | Mirror POV on its nail. Her touch starts a swing (A 0.5°, P 2.8 s, τ 2.5 s). The reflection turns at 2θ about (540, −180) while the glass holds still. Focus racks from her face to the room. | Her face recedes (scale 3.2→1.0 over 1.1 s, easeInOut) and slides out frame right, revealing the room.<br>- The window shows teal night: half moon behind clouds, three hill layers, village roofs with a few lit windows, valley fog. The light from the hook is gone, dipped behind the hill.<br>- The adobe wall glows in candlelight; vigas and carrizo run along the top.<br>- Under the window the wooden cradle hangs from four ropes with the swaddled newborn. The veladora is large and soft in the lower-left foreground.<br>The abuela, now a back-view silhouette with the rebozo over her head, takes two steps to the cradle (rebozo and fringe swinging), leans in and pushes it: 3° on a 2.4 s period. The swaddle breathes.<br>TEXT: Alike 56 px, bone, two lines, block top y=1410, soft, 2.60–5.60. | Me colgó frente a la cuna<br>la noche que nació la niña. | Very low brown-noise room tone, candle flutter, crickets far outside (−30 dB). Two soft huarache scuffs on the dirt floor (3.0, 3.9). Rope-and-wood creak at each end of the swing.<br>3.40: the abuela begins humming 'A la roro niño' (traditional), wordless 'mmm': formant voice of an older woman, f0≈220 Hz, breathy, 5 Hz / 20-cent vibrato, D major, rubato around 60 BPM. The glass drone continues under it. |
| 5.9–9.0 | Scissors in a cross. | Mirror POV; the swing has died to nearly zero. Focus holds on the window. | The abuela crosses to the window and lifts big iron tailor's scissors (silhouette, thin cold moon rim on the blades). She opens them 0→90° (0.5 s, easeOutBack, 4° overshoot) and stands them on the sill at x≈820: a crisp black cross against the moonlit sky. She taps them once, steps back and settles into the chair at left in profile, one hand on a cradle rope.<br>TEXT: Alike 56 px, bone, two lines, block top y=1410, 6.00–8.80. | Abrió unas tijeras en cruz<br>y las puso en la ventana. | 6.90: the scissors open with a metal slide and a bright inharmonic ring (partials 2.1 / 3.4 / 5.9 kHz, 1.2 s decay). This ring becomes the PROTECTION MOTIF.<br>7.60: an iron 'tock' on the wooden sill.<br>The hum moves into phrase 2.<br>8.40: one harp pluck (Karplus-Strong, D3) doubles her cadence note. |
| 9.0–12.0 | The fogón on the hill. | Mirror POV. Focus racks from the room (goes soft) to the hills in the window (sharp). Exposure −0.15 as the candle gutters. | In the chair the abuela rocks the cradle by its rope (2.6 s period).<br>On the middle hill a lone hut (120×80 px, x≈640, y≈850) has a doorway glowing orange. The fogón inside throws a fan of warm light out of the doorway across the ground mist. Inside that fan, enlarged about 3×, is the shadow of a kneeling woman (≈260 px tall), the only time we see her human form.<br>9.6–10.8: the shadow's arms rise (shoulder 20°→150°, easeInOutSine) and its hair lifts as if in an updraft; the light fan pulses brighter.<br>10.8–11.9: the lower half of the shadow (knees, legs, skirt) frays away into the mist from the ground up. An fbm threshold climbs, its edge sparkling gold, and the lower half is gone. The upper half hangs in the light with arms raised.<br>Two fog bands drift across the valley in opposite directions.<br>TEXT: Alike 54 px, bone, two lines, block top y=1410, 9.10–11.80. | Dicen que, al caer la noche,<br>dejan sus piernas junto al fogón… | Wind gust and a shutter creak; distant fogón crackle with long reverb. The glass drone slides down a semitone (D→C#).<br>9.6–11.4: a distant low female hum gliding up 150→300 Hz (formant 'mmm', heavy reverb, −28 dB), rising with the shadow's arms.<br>In the room the abuela's hum continues, low and unaware. |
| 12.0–14.5 | They become fire (title). | Mirror POV with the window sharp; bloom rises with the ignition and the hatch ink warms. | 12.00: the shadow collapses into a point. The doorway flares white, then goes dark for good: the body is left behind, implied.<br>12.20: a spark leaves the smoke hole and blooms into a sphere of fire (0→50 px in 0.8 s): white-gold core, orange shell, six flame lobes, trailing sparks. It climbs (easeOutCubic, 0.7 Hz / 6 px bob), ghost-doubled. Its core shows two dark hollows for single frames, a subliminal face.<br>TITLE: Rye 84 px, cempasúchil with gold glow, burn mode (letters ignite left to right with charring edges and shedding sparks), lineHeight 1.1, block top y=1265, 12.10–14.40.<br>CREDIT: Alike 34 px, sand #E0BB8F, two lines, block top y=1465, 12.70–14.40. | LAS BRUJAS<br>DE FUEGO<br>Altar 1 · Ala Sur<br>Psicología y Ciencias de la Educación | 12.20: a low ignition 'whumpf' (40 Hz sub plus noise burst), then a soft distant roar.<br>A crackle sweeps left to right as the title letters ignite.<br>A female choir pad enters (formant 'aah', D–F–A with a dissonant E♭, −22 dB).<br>The abuela keeps humming over it, unaware. |
| 14.5–17.2 | Over the rooftops. | Mirror POV; a draft gives a 0.2° swing (0.4° in the image). | Two more orbs ignite on hills far left (14.6) and far right (15.1): point, flare, settle. All three fly over the hills and across the village roofs on Catmull-Rom paths with bobs and sudden darts, lobes streaming, each ghost-doubled. A warm light pool slides across every tile roof they cross.<br>As they pass, the lit village windows go dark one by one as families shutter their homes.<br>The orbs converge and grow, heading for this house, then dip behind the nearest hill at 16.9.<br>TEXT: Alike 56 px, bone, whisper mode, two lines, block top y=1410, 14.60–17.00. | Vuelan sobre los techos<br>buscando recién nacidos. | Village dogs: three voices, distant and staggered; one yelps and goes silent.<br>A soft band-pass whoosh as each orb passes, panned to its x.<br>A tiny distant wooden shutter clack for each window that goes dark.<br>A low tom heartbeat enters at 60 BPM, barely audible. |
| 17.2–20.0 | The abuela nods off. | Mirror POV; focus racks back to the room. Still. | The window holds only dark hill and thickening fog. The abuela rocks the cradle and begins to doze: nod 1 (10°, back in 0.4 s), nod 2 (18°, slower back), final drop (25°) and it stays. Her hand slides off the rope (0.8 s, easeIn) and hangs. Her shoulders keep a slow sleeping breath, and the cradle's swing dies away. The hatch ink cools back to brown.<br>TEXT: Alike 58 px, bone, 'reflejo' accented in gold #F5C242, two lines, block top y=1410, 17.30–19.90. This line plants the payoff. | Pero ninguna soporta<br>ver su propio reflejo. | The hum slows and sags flat (−30 cents), then breaks off mid-note at 19.40 into a sleepy exhale. The tom stops. The creaks spread out as the cradle slows. |
| 20.0–22.0 | I can't close my eyes. | Mirror POV, completely still (no swing, no tremor). The vignette creeps in +15%. | Stillness. The candle flame stands perfectly straight. Fog swallows the hills in the window. Only the swaddle breathes.<br>TEXT: Alike 60 px, bone, soft, block top y=1410, 20.10–21.60, gone before the scare. | Yo no puedo cerrar los ojos. | Near silence: room tone at −45 dB and a thin high glass tone (3.2 kHz sine, −42 dB).<br>20.30: the crickets stop all at once. |
| 22.0–23.4 | Tecolote (false scare). | Mirror POV. On the landing: 4 px shake for 0.2 s and a 0.12 flash as a startle accent. | 22.00: a tecolote drops onto the sill from above, wings spread (380 px span, moon rim on the feathers), and settles in three flaps (0.5 s). Its eyes catch the candle as two amber discs. It stares straight into the mirror, head snapping 90° and back.<br>22.90: an orange underlight rises from below the sill and paints its belly. It shrieks and launches up-left out of frame. |  | 22.00: out of the silence, a burst of heavy wing flaps, the owl's harsh alarm scream (noise band 2–7 kHz with AM, 0.5 s) and bill clacks.<br>22.90: two alarm hoots and fading flaps. Underneath, a low fire rumble begins below the window. |
| 23.4–26.2 | The window. | Mirror POV. Exposure climbs as orange fills the window; bloom 1.1, halation 0.5; 0.15° heat-draft swing; the hatch ink warms to gold. | The orb rises into the window from below the sill (1.0 s, easeOut). It is huge (≈300 px) and sits behind the window plane, painted before the frame, the shutters and the scissors. Its shell swirls and throws sparks. Inside the flame, two darker oval hollows hold steady as eyes aimed at the mirror, which means at us. Its light overpowers the candle.<br>CROSS SHADOW: the scissors' outline is projected outward from the orb centre by the depth ratio into a giant cross shadow. It sweeps across the floor toward camera, over the cradle and the sleeping abuela, and up onto the glass. For 8 frames a soft dark cross covers the whole screen (35% darker, wide soft edge).<br>24.90: the orb pushes toward the window and flinches at the scissors' plane: the shell crumples inward, 150 sparks spray, the blades flash bone-white.<br>25.40: it drops below the sill (0.5 s, easeIn). The glow recedes and the candle returns. The abuela does not wake. |  | Close fire crackle rising in wide stereo; roar; choir swells.<br>24.90: the scissors' ring motif (bell ping at 2.8 kHz with inharmonic partials), a hiss and a guttural reversed inhale.<br>25.40: near silence, with only fire moving beneath the window, panned left to right and then upward. |
| 26.2–28.8 | The roof. | Mirror POV. It cannot look up, so the threat stays at the top edge (vigas and reeds). A draft from above starts a slow, irregular 0.3° swing. | 26.60: a dull clay knock on the roof. Fine grit trickles between the reeds through the candlelight (40 grains, gravity plus sway).<br>27.20: another knock, closer, right above the cradle. Thin orange lines of light leak between the reeds and slide along them. About 25 gold embers drift slowly down toward the cradle. The candle flame leans toward the ceiling. The cradle starts to swing by itself.<br>28.30: the baby whimpers and the swaddle wriggles. |  | Two clay roof-tile knocks (26.60, 27.20); a sand trickle; a low fire rumble panning across the ceiling left to right; ember ticks; rope creak.<br>28.30: newborn whimper (formant, f0≈480 Hz, 'eh-eh', 0.6 s).<br>The tom heartbeat returns at 70 BPM and speeds up. |
| 28.8–31.2 | What it came for. | Mirror POV with an irregular draft swing (0.4°); bloom up, slight halation. | The orb's light pours through a gap in the reeds above the cradle. Then its lower half enters the top of frame and descends 240 px over 2.2 s in a slow heave (easeInOut).<br>Seven flame tendrils hang from it like hair and reach toward the bundle, tips curling like fingers. They never come closer than 40 px.<br>Bone-white motes, the baby's vital energy, rise from the swaddle in slow spirals and are drawn up into the orb. Its core pulses brighter with each one, in heartbeat rhythm.<br>The tiny hand rises from the swaddle, fingers opening toward the light. Nothing touches the baby.<br>Draw order: cradle back rim, bundle, baby hand, tendrils, cradle front rim. |  | The low choir swells. The harp plays 'A la roro' in D minor, detuned, with notes missing. Airy reverse-whoosh grains sync to each mote.<br>30.40: a second whimper, weaker than the first.<br>Tom at 110 BPM. |
| 31.2–32.6 | The abuela wakes. | Mirror POV pulled off the wall.<br>31.75: the view drops 40 px and tilts −8° as it leaves the nail (easeOut 0.2 s).<br>31.95–32.25: whip turn. The room canvas translates fast under 6-sample directional blur and cross-dissolves into the close set, settling on the orb with a 5% spring overshoot.<br>From here on, a 6 px / 9 Hz tremor from her old hands. | 31.20: the abuela's head jerks up and a glint of orb light catches her eye. She rises (the chair tips back) and lunges at the mirror. Her rebozo silhouette fills the frame in 0.4 s (3 frames of near-black). Her fingers, four per side, dark, out of focus and warm-rimmed, grip the left and right screen edges, drawn above the glass layer. She swings the mirror round to face the orb. |  | A sharp gasp (formant inhale); the chair scraping and clattering; fast huarache steps. The nail scrapes out of the adobe and the glass rattles in its tin frame.<br>31.95: whip whoosh. |
| 32.6–34.2 | She sees herself. | Handheld mirror POV, close. The orb is about 40 cm from the glass and fills 70% of the frame; the abuela's trembling fingers are at the edges. Post hatch rises to 0.30. | The orb faces its own reflection. Its flame shell parts from the centre outward like a curtain (0.4 s), revealing the witch's true face drawn in glowing ember lines: a woman from the village, ageless, with a strong brow and cheekbones, hatching in the hollows, hair of rising flame and two white-gold coal eyes.<br>She sees herself. Over 0.7 s her expression morphs from hungry (lids 40% open, thin closed mouth) to recognition to horror (eyes wide, brows up 24 px, mouth stretched into a 90 px-tall O). The ember lines flare hotter and the hatching trembles.<br>33.80: everything freezes, the face held mid-horror. |  | Close fire roar, choir and a rising string-like cluster. A thin pained exhale from the face at 33.30.<br>33.80–34.10: digital zero.<br>34.10: a single ember tick. |
| 34.2–36.2 | THE SLAM (main jump scare). | Handheld. On impact: 30 px shake decaying over 0.5 s, a 2-frame flash at 0.9, and a chromatic-aberration spike of 12 px decaying over 0.4 s. Then the view holds steady while the orb is ripped away. | 34.20: the face lunges at the glass (scale 1.0→3.2 in 5 frames, easeInExpo). Its seven tendrils snap together into a five-fingered hand of FIRE that slams flat onto the glass layer, the nearest plane in the film. On contact the flame flattens and chars into a soot print: black palm and fingers with a glowing #F26D3D ember-crack network, covering 60% of the frame. A crack spiders out from the palm (branching, revealed over 4 frames, with a 3 px refraction offset along it).<br>34.40–35.00: she is yanked backward as if on a rope. The print smokes and blurs, and the index fingertip drags across the glass, leaving a smoking soot curve that hooks down and loops: the spine of the 6. It is broken by the crack, smeared into the palm print and veiled by smoke, so it cannot be read.<br>35.00–36.00: the orb is hurled back across the room and out of the window. As it passes the scissors the blades flash and the cross shadow sweeps the screen once. It shrinks into a comet over the hills and bursts into sparks. On the far hills the other two lights dart away and wink out. |  | 34.20 SLAM: 35 Hz sub boom, body thump, glass impact and crackling crack (granular ticks), together with a shriek (formant scream with vocal fry and tanh saturation; energy at 80–200 Hz and 1–3 kHz), 34.20–35.00.<br>34.40–35.00: fingernail-on-glass screech (FM 2.8–3.6 kHz) synced to the drag.<br>35.30: the scissors' ring motif as she passes them.<br>35.00–36.00: the roar recedes with a doppler drop; a distant pop at 35.9; one far-off dog bark. |
| 36.2–38.4 | Silence, then dawn. | Mirror POV re-hung on its nail, crooked 3°, so the world hangs tilted 6° with a small fading swing. From 37.40, a time-lapse dissolve. | 36.20: the abuela slams the mirror back onto its nail. Her fingers withdraw from the screen edges (36.30–36.60).<br>36.60–37.00: dead stillness. Smoke curls in the window. The crack and the soot smear sit on the glass, an illegible stain.<br>37.00: the baby coos and her tiny hand closes around the abuela's finger at the cradle rim. She is safe.<br>37.40–38.40, time-lapse: the candle burns down to a stub; the window sky goes from black-teal through violet to warm gold; beams and dust motes come in; the abuela sleeps beside the cradle with her hand on its rim. |  | 36.20: clack of the mirror on the nail; the glass ring dies away.<br>37.00: baby coo (two soft syllables) and the abuela's shaky exhale.<br>37.20: the harp plays the first phrase of 'A la roro' in D major, warm.<br>Crickets cross-fade to dawn birds (FM chirps).<br>38.20: a distant chapel bell tolls once. |
| 38.4–41.8 | The breath reveals it. | Mirror POV, locked. At 38.50 she straightens the mirror (rotation eases to 0 over 0.4 s). In the reflection her face is close, backlit by dawn. | 38.50–39.00: her rebozo wipes away the soot smear, leaving a faint grey haze.<br>39.10: she breathes on the glass to polish it, and fog spreads over the centre. One line stays clear, the hidden trace of the witch's finger, which now reads unmistakably as a 6. It is the Rye '6' glyph at exact lockup size and position (≈580 px tall, centre x=540, y 540–1120), edges roughened as if by a fingertip. Through the clear stroke we see sharp slices of the abuela's eye widening, rhyming with the hook. Her wiping hand freezes at the frame edge.<br>40.20: the stroke's edges warm to a faint ember glow (#F26D3D), as if still hot.<br>TEXT: Alike 56 px, bone, soft, single line, block top y=1240 (below the 6), 39.90–41.60. | Ella también está contando. | 38.50: cloth squeak on glass. 39.10: a close exhale for the fog.<br>39.50: the harp stops mid-phrase. The glass drone returns on a minor second (D + E♭).<br>40.60: a faint, far-off female giggle (formant risita, long reverb, panned left), over a low swell. |
| 41.8–44.5 | Countdown lockup and sting: night comes back. | Locked, with a slow push of 1.00→1.02 on the reflected world only; the glass and the 6 stay fixed. | 41.80: the fog evaporates from the edges inward (0.5 s). In the reflection, dawn drains back to night in 0.8 s: sky gold → violet → teal-black, room down to #231305, vignette. The next night has come.<br>The clear 6 fills in place with a solid gold → cempasúchil gradient, a smouldering ember rim and a few sparks rising from its top. The crack stays faintly on the glass.<br>LOCKUP (LeyendaLockup, top=380, bottom=1170, words bone #D9CDB6, date gold #F5C242):<br>- 'FALTAN' Rye 92 at 41.90<br>- the fire 6 at y 540–1120<br>- 'DÍAS' Rye 92 at 42.10<br>- '28 · 10' Alike 52 at ≈y 1298, 42.40<br>42.60: on the dark ridge in the reflected window, six small fire points ignite in an 80 ms ripple. Two sit inside the loop of the 6 at (500, 945) and (585, 945), like a pair of eyes looking out of the number. Four more sit to the right along the ridge. They breathe.<br>43.90: they blink out right to left, 60 ms apart, like eyes closing.<br>44.20–44.50: everything dips to deep brown; cut to the outro. | FALTAN<br>6<br>DÍAS<br>28 · 10 | 41.80: a deep tom hit with the scissors' ring motif and the choir holding a D minor (add9) chord.<br>Night wind returns.<br>42.60: six soft distant ignitions ('fff') rippling within 80 ms.<br>43.90: six soft 'pff' extinguishes and a faint giggle.<br>44.30: a short reverse swell into the outro. |
| 44.5–49.0 | OUTRO. Standard 4.5 s animated Westhill logo (existing outro component). | As built in the standard outro. | The standard Westhill logo outro: the logo ignites along a fire front, holds, then dissolves into embers. |  | Standard outro audio. The glass drone's E♭ resolves to D under the logo ignition. |

## Sustos

- **t:** 1.35 · **what:** In the hook, a tiny fire point comes loose from the hill behind the abuela's shoulder like a star that moves, and she blinks without seeing it. · **why_it_works:** Dramatic irony in the first two seconds: the viewer knows more than the character. It also teaches the legend's camouflage, that a 'star' can be a witch.
- **t:** 10.8 · **what:** On the hillside mist, the giant shadow of a kneeling woman raises her arms and her legs fray away into the fog. Only the upper half hangs in the light, then collapses into fire. · **why_it_works:** Uncanny body horror by implication: no limbs, no blood, only a shadow losing its lower half. It makes «dejan sus piernas» visible and unforgettable while staying family-safe.
- **t:** 20.3 · **what:** The abuela's lullaby breaks off mid-note as she falls asleep, then the crickets stop dead under «Yo no puedo cerrar los ojos.» · **why_it_works:** Taking away comforting sound is the strongest dread cue. The mirror's line puts the viewer in its place, unable to look away, during two seconds of near silence.
- **t:** 22 · **what:** A tecolote slams onto the sill with spread wings and an alarm scream, stares into the mirror, then flees from an orange glow rising below the window. · **why_it_works:** A false jump scare at the midpoint releases tension, and the owl fleeing turns the release straight into escalation. The tecolote is a Mexican omen, not a Halloween prop.
- **t:** 23.8 · **what:** A huge fire orb rises into the window with eye-like hollows aimed at the mirror, and the scissors' cross shadow sweeps over the whole screen. · **why_it_works:** The threat looks at the camera, which means at us. The amulet's shadow lands on the glass and so protects the viewer too. The flinch at 24.9 shows the legend's rule working.
- **t:** 26.6 · **what:** Clay knocks cross the roof; grit and embers fall, the candle leans upward and the cradle starts to swing by itself. · **why_it_works:** Fear of what we cannot see. The fixed device turns the space above the frame into the threat, tracked only through sound and falling light.
- **t:** 29.5 · **what:** Flame tendrils reach down toward the swaddle like fingers while bone-white motes are drawn up out of the baby; a second, weaker whimper. · **why_it_works:** The highest stakes, shown as light rather than harm (the legend's 'energía vital'). The weakening whimper is quiet, unbearable suspense that pays off when the abuela wakes.
- **t:** 33.8 · **what:** The witch's true face, revealed by the mirror, freezes mid-horror, followed by 0.3 s of digital silence and one ember tick. · **why_it_works:** A held, readable face followed by dead air primes the startle. The audience expects her to flee, as the planted rule promised.
- **t:** 34.2 · **what:** MAIN JUMP SCARE: she lunges instead, and a hand of fire slams flat onto the glass, charring into a soot print as the glass cracks, with a flash and a shriek. · **why_it_works:** It lands on the glass, the plane that is the viewer's own screen, with a full-frame change, broadband sound and a flash after silence, so the startle is involuntary. Using fire rather than flesh keeps it true to a witch who has left her body behind.
- **t:** 40.2 · **what:** At dawn the abuela's breath reveals the clear 6 the witch's finger wrote, its edges glowing like embers, with a far-off giggle and «Ella también está contando.» · **why_it_works:** Relief turns into a lingering chill: the series countdown becomes her countdown.
- **t:** 42.6 · **what:** Night returns and six lights ignite on the ridge, two of them inside the loop of the 6 like a pair of eyes. At 43.9 they blink out like closing eyes. · **why_it_works:** The classic post-reveal sting, that it is not over, ties six witches to six days and sends the viewer into the logo with dread rather than relief.

## Revelación del número

The witch writes the number herself.
During the slam (34.4–35.0 s), as she is ripped away, her index fingertip of fire drags across the glass. It leaves a smoking soot curve that hooks down and loops: the spine of a 6. It is smeared into her palm print, broken by the crack and veiled by smoke, so nobody can read it.
At dawn (38.5–41.8 s) the abuela wipes the smear away with her rebozo and breathes on the glass to polish it. Fog forms everywhere except where the finger passed, the real way breath reveals a fingertip trace, and a crisp clear 6 appears in the middle of the frame. It is the Rye '6' glyph at its exact lockup size and position (≈580 px tall, x=540, y 540–1120), edges roughened as if finger-drawn. Through it we see slices of the abuela's widening eye. Its edges smoulder orange and «Ella también está contando.» appears.
Then the fog evaporates, dawn drains back to night, and the same 6 fills in solid gold-to-cempasúchil where it stands, becoming the lockup numeral: FALTAN / 6 / DÍAS / 28 · 10. Six lights ignite on the reflected ridge, two inside the 6's loop like eyes, and blink out before the standard Westhill outro.
One mask drives all four states (soot trail, clear stroke in the fog, ember edge, solid numeral), so they align to the pixel.

## Música

An original score built on the traditional Mexican lullaby 'A la roro niño'. The melody is anonymous and public domain; we write our own arrangement and imitate no recorded version. The hum is always wordless.
(1) THE ABUELA'S HUM: formant voice ('mmm', older woman, f0≈220 Hz, breathy, 5 Hz vibrato) in D major, rubato around 60 BPM, from 3.4 s. It carries on, unaware, while the bruja ignites on the hill (tenderness against threat), sags flat as she dozes, and breaks off mid-note at 19.4 s.
(2) THE MIRROR'S VOICE: a glass-harmonica drone (D4 + A4 sines, slow swells, 0.7 Hz beating). It slides to C# at the fogón, returns on a D + E♭ minor second at the 6 reveal, and resolves to D under the logo.
(3) THE BRUJAS: a female choir pad (six detuned formant 'aah' voices) on D–F–A with a dissonant E♭. It swells at each attack and rises into a string-like cluster before the face reveal. A distant low female hum gliding up 150→300 Hz accompanies the shadow's transformation.
(4) HEARTBEAT: a low tom at 60 BPM over the flyover; gone during the dread; back at 70 rising to 110 BPM through the roof and feeding beats.
(5) HARP (Karplus-Strong, arpa style): one pluck doubling the hum's cadence. Then the lullaby in D minor, detuned with missing notes, while the orb feeds. Then its first phrase in warm D major at dawn, cut off mid-phrase when the 6 appears.
(6) THE SCISSORS' RING (modal partials 2.1 / 3.4 / 5.9 kHz) is the PROTECTION MOTIF: when they open, when they repel the orb, when she flies past them, and on the lockup hit.
SCORED SILENCE: 0.0–0.1; 20.0–22.0 (crickets stop); 33.8–34.1 (digital zero before the slam); 36.6–37.0 (aftermath).
Lockup: deep tom, scissors ring and a choir D minor (add9) chord, then six ignitions and six extinguishes into the standard outro.
Master −14 LUFS integrated, true peak ≤ −1 dBTP via sfx.master. The slam's braam and shriek carry energy at 80–200 Hz so they land on phone speakers.

## Diseño sonoro

- warm close exhale on glass (hook and dawn)
- cloth-on-glass squeak and rub (rebozo wipes)
- glass-harmonica drone (the mirror's voice)
- distant tecolote hoots
- very low brown-noise room tone
- candle flutter and gutter
- crickets that stop abruptly; later cross-fade to dawn birds (FM chirps)
- huarache scuffs on a dirt floor; fast steps
- hanging-cradle rope and wood creaks
- scissors opening: metal slide plus inharmonic ring (protection motif)
- iron tock on a wooden sill
- wind gust and shutter creak
- distant fogón crackle with long reverb
- distant low female hum gliding 150→300 Hz (transformation)
- fire ignition whumpf (40 Hz sub plus noise burst) and distant roar
- crackle sweep synced to the title igniting
- village dogs barking; one yelp then silence
- distant wooden shutter clacks as village windows go dark
- band-pass whooshes as orbs fly past (panned)
- low tom heartbeat 60 → 110 BPM
- owl alarm scream, bill clacks, heavy wing flaps, two alarm hoots
- close fire crackle and roar (wide stereo)
- scissors ring ping, hiss and reversed guttural inhale when the orb is repelled
- clay roof-tile knocks
- sand and grit trickle
- ember ticks
- fire rumble panning across the ceiling
- newborn whimpers (formant, wordless) and coo
- airy reverse-whoosh grains (vital-energy motes)
- gasp, chair scrape and clatter
- nail scraping out of adobe; glass rattling in its tin frame
- whip-pan whoosh
- thin pained exhale from the witch's face
- digital zero, then a single ember tick
- SLAM: 35 Hz sub boom, body thump, glass impact
- glass crack crackle (granular ticks)
- formant shriek with vocal fry and saturation
- fingernail-on-glass screech (FM 2.8–3.6 kHz)
- receding roar with doppler drop; distant spark pop; far dog bark
- mirror clack back onto the nail
- distant chapel bell, single toll
- faint far-off female giggle (formant risita), twice
- six rippling distant ignitions and six soft extinguishes
- deep tom hit for the lockup; short reverse swell into the outro
- standard outro audio

## Factibilidad

ENGINE AND FILES
Built on the existing leyendas kit without modifying it. Anything extra lives in src/leyendas/d06_brujas.tsx, and the score goes in scripts/leyendas/d06.py.
EP06_LEN changes from 1200 to 1335 (44.5 s), with LEN = 1335 in d06.py; the standard outro follows (1335–1470). Key frames: title 360, tecolote 660, window orb 702, face 978, SLAM 1026, re-hang 1086, breath reveal 1173, lockup 1254.
Everything is deterministic (hash, noise2D, cached precomputed sims), never Math.random.

PER-FRAME PIPELINE
(1) REFLECTED WORLD. Paint into an oversized offscreen canvas (1240×2200), so the 2θ rotation, the 40 px drop and the −8° tilt never show an edge. Layers go back to front with onPlane, with fogAmount for depth. Rack focus uses dof() per plane with an animated focus distance; blur is cached at quarter resolution.
- Hills are smoothPath silhouettes.
- The fogón light fan is a beam() from the hut doorway.
- The shadow puppet is one smoothPath silhouette with ik2 arms and simChain hair driven by updraft. Its dissolve is an fbm threshold mask climbing from the ground (destination-out) with gold edge sparks.
- Village windows: rgrad lights with per-window off times.
- Lighting uses a light list (candle plus every orb: position, radius, colour, intensity) applied as additive radial passes masked to room silhouettes.
(2) MIRROR TRANSFORM. drawImage the world with rotate(2θ) about (540, −180) plus the drop translation. The whip is a horizontal translate with 6 sub-sampled draws at 1/6 alpha (9 frames only), cross-dissolving into the climax close set.
(3) GHOST DOUBLES. Redraw only the bright sprites (candle, orbs, moon, sparks) from the light list at +5/+9 px, 18%, with 'screen' blending. No pixel processing.
(4) GLASS LAYER, screen-locked:
- Foxing: cached noiseTile, thresholded and weighted to the edges, multiply #1A0F07.
- Scratches: about 120 precomputed segments whose alpha rises near on-screen light positions.
- Bevel: 24 px edge darkening plus post ca.
- FOG: a 270×480 canvas recomputed from scratch every frame, so it holds no state. Alpha = Σ breath puffs (radial blobs with grow/decay curves) − wipe masks (cloth path stroked destination-out up to time t), × (1 − latent6Mask). It is composited as a quarter-resolution blurred copy of the frame plus a white veil, weighted by fog alpha.
- LATENT 6 MASK: Rye '6' rendered with fillText into an offscreen canvas at lockup size and position, edges displaced by noise. Await document.fonts.load('580px Rye') under delayRender before the first paint. The SOOT TRAIL is that mask intersected with a thick stroke along a 14-point skeleton authored over Rye's 6, revealed by length, in charcoal #1A120C with dying ember particles, and smeared by the palm print plus smoke so it stays illegible. The same mask carves the clear 6 out of the dawn fog, gets the ember edge, then fills solid for the lockup.
- CRACK: a hash-seeded branching polyline revealed by length, drawn as a dark/bright double line with a 3 px offset sliver; it persists faintly to the end.
- HAND OF FIRE: tendril chain tips lerp to five finger capsules plus a palm in 3 frames. On contact it swaps to a flat Path2D print with char fill (paintShape plus noise) and precomputed Voronoi crack polylines stroked additive #F26D3D, cooling over 1.5 s.
(5) The abuela's fingers at the screen edges (31.4–36.6 s): blurred silhouette capsules drawn ABOVE the glass layer.
(6) Post per frame through Scene's return:
- bloom 0.6 at rest, 1.1 in attacks; halation 0.5
- grain 0.06; vignette 0.35 (+15% in the dread beat)
- hatch 0.12 (0.30 for the face), with hatchInk lerped toward gold by orb-light share
- flash 0.12 at 22.0 and 0.9 for 2 frames at 34.2; ca spike; exposure ramps; stage.shake
(7) DOM text through Line (soft / whisper / burn) and LeyendaLockup (top 380, bottom 1170). The 6 is drawn on canvas by the episode.

ORB (Canvas2D, no WebGL needed)
Three stacked radial gradients. A shell polygon r(θ,t) filled additively. Six bezier flame lobes deformed by pnoise and oriented against velocity, plus flame2D tongues around the rim. Stateless embers along p(t − k·dt). The 'curtain' reveal widens an angular gap in the shell. Subliminal face: two soft ellipses cut with destination-out.

CROSS SHADOW
The scissors Path2D scaled from the orb centre by k = (z_target − z_orb)/(z_scissors − z_orb), filled multiply in deep brown with blur proportional to orb radius. The 8-frame full-screen version is the same cross drawn on the glass layer.

WITCH FACE
About 40 cubic Bézier paths authored as SVG strings in three keyframes (hungry, recognition, horror) with identical structure, interpolated with easing. Each is stroked twice: wide blurred orange (additive) plus a thin white-gold core. Hatching is parallel lines clipped to six shadow regions. Hair uses flame2D tongues in a polar band. Eyes are glow() cores.

OTHER RIGS (rig.ts)
- Abuela: six-part silhouette, ik2 plus springFollow, rebozo simCloth 10×14, 18 fringe simChains, angular damped spring for dozing.
- Eye ECU: one hand-authored rig with lid and iris params, reused at dawn.
- Tendrils: 7 simChains with springFollow tip targets.
- Tecolote: 4 keyposes plus feather chains plus a head spring.
- Mirror and cradle: damped-pendulum ODEs precomputed with impulse timestamps.
- Baby hand: palm plus five two-segment capsule fingers.

OPTIONAL 3D
Only the scissors, as a tiny three.js mesh for one true specular glint at 24.9 s. The 2D version with an animated rim is sufficient.

PERFORMANCE
Cache sky, hills, wall textures, foxing and scratches. Run fog and blur at quarter resolution. Sub-sample the whip only. Target ≤1.2 s/frame on 4 cores, about 25–30 min for 1335 frames.

AUDIO (numpy, in d06.py, reusing leyendas_sfx blocks where they fit: tecolote, risita, susto hits, crujidos, viento, grillos)
- Hum: glottal pulse train with jitter through nasal formants (250 / 1000 / 2500 Hz).
- Harp: Karplus-Strong. Glass harmonica: sines with swells. Choir: six detuned formant voices.
- Tom: pitched sine drop plus noise. Fire: low-passed pink noise plus crackle impulses.
- Owl: band-passed noise with AM. Baby: formant at f0 450–520 Hz.
- Shriek: formant glide 600→1400 Hz plus fry plus tanh saturation.
- Slam and crack: sub plus transient plus granular ticks. Nail screech: FM near 3 kHz.
- Scissors and bell: modal synthesis. Birds: FM chirps.

## Riesgos

1) DEVICE CLARITY: viewers must understand 'we are inside a mirror' within 2 s. The fog bloom, the cloth wipe and «Soy el espejo de la abuela.» do this, and the glass tells stay on all the way through. Test with fresh eyes on a phone.
2) THE WITCH FACE is the riskiest drawing; if it looks cartoonish the scare dies. Use ember lines only, half veiled by flame, with trembling handheld and hatching, and iterate with stills. Fallback: coal eyes and a dark mouth hole inside the parted flames.
3) HALLOWEEN DRIFT: no pointed hats, brooms, cauldrons, green skin, hooked noses, bats, pumpkins or cobwebs (watch the vigas and reeds). The bruja is fire plus a village woman's ember face; the tecolote is a Mexican omen.
4) BABY SAFETY AND TASTE: the baby is never touched or burned. Tendrils stop 40 px short, the threat is shown only as light motes, there are whimpers but no crying in pain, and the story ends with a coo and a grasp. «dejan sus piernas junto al fogón…» is text plus a shadow only. If the client finds it too strong, use «dejan su cuerpo junto al fogón…».
5) LAYER-ORDER TRAPS:
- Outside orbs are painted before the wall cut-out, frame, shutters and scissors.
- Cradle ropes cross in front of the window and in front of window orbs.
- Interior tendrils go between the cradle's back and front rims.
- The abuela's fingers go above the glass layer; the hand of fire and soot print go on the glass layer.
- Text is always on top, and never shows while the fingers, orb or hand fill the frame (no text from 22.0 to 39.9 s).
- The oversized world canvas prevents black edges during the rotation, drop and whip.
6) THE 6 MUST READ INSTANTLY at dawn: sharp warm dawn through the stroke against grey fog, ≈580 px tall, held about 1.6 s before the lockup builds. The soot version during 34.4–38.5 s must NOT be readable (smeared, cracked, smoked), or the payoff is spoiled. The two 'eye' lights must sit inside the 6's loop without breaking the glyph's silhouette.
7) TEXT AND INSTAGRAM UI: all narrative text sits in the floor band (block tops 1240–1465, bottoms ≤1560), inside the 340 px bottom margin. Check title plus credit on a real Reels overlay; if crowded, move the credit into the lockup's lower space.
8) PERFORMANCE: fog, blur and whip sub-samples are the heavy parts, so keep them at quarter resolution and cache static layers.
9) PHOTOSENSITIVITY AND LOUDNESS: one 2-frame flash at 0.9 and a 0.12 startle flash, never repeated. Peaks stay ≤ −1 dBTP, and the pre-slam silence must be true digital zero.
10) LENGTH: 44.5 s is near the 45 s cap. If needed, trim 0.3–0.5 s from the flyover or the time-lapse.
11) MUSIC RIGHTS: the hum stays wordless; 'A la roro niño' is a traditional melody in our own arrangement.
12) SERIES CONTINUITY: Días 2 and 3 also involve children. Keep this episode about protection and the mirror, not grief, and keep the eyes white-gold (red glowing eyes belong to Día 3).

## Especificación de construcción

- **environments:** - REFLECTED ROOM, NIGHT (1240×2200 oversized world canvas, painted back to front):
- adobe wall (surface 'adobe' + speckle) with a window cut-out at x 300–1000, y 330–1030, two open plank shutters, wooden sill at y 1030
- vigas + carrizo reed ceiling band y 0–320 with gaps for light leaks (no cobwebs)
- hanging wooden cradle, 360 px wide, centred x 690, y 1040–1260, on 4 mecate ropes up to a viga (ropes cross in front of the window)
- abuela's wooden chair at left, x 180–420, with a petate underneath
- small table and veladora in the lower-left foreground (x 130, y 1650, dof-blurred bokeh)
- dark dirt floor band y 1280–1580 kept clean for text
Lit by a light list (candle + every orb).
- EXTERIOR THROUGH THE WINDOW, NIGHT:
- sky gradient #071A22→#12343C with a hashed starfield
- bone half moon behind a drifting cloud band (noiseTile)
- far ridge y≈760 (#0B2228)
- middle hill y≈860 (#0F2D31) with a lone hut (120×80 px at x≈640) with a doorway, smoke hole and smoke column
- near hill y≈960 (#13383A) with 10–14 village houses (adobe fronts, tile roofs as half-cylinder stroke rows, 4–6 warm windows with individual off-times), magueyes and milpa terraces
- two fogBands tinted #1F5C48 drifting in opposite directions
- a dark ridge line usable for the six sting lights at y≈900–950
- EXTERIOR VARIANTS:
- DAWN (37.4–41.8 s): violet-teal top melting into gold and sand at the horizon, with warm beams and dust motes entering the room; the candle burns down to a stub during the time-lapse.
- NIGHT RETURN (41.8–42.6 s): sky gold → violet → teal-black in 0.8 s; room darkened to #231305 with vignette.
- FOGÓN LIGHT FAN on the middle hill: a beam() from the hut doorway spreading across the ground mist, with an enlarged shadow-puppet silhouette inside it, pulsing brighter as the arms rise, flaring white at 12.0 s, then dark.
- HOOK / DAWN EXTREME CLOSE-UP: the abuela's eye and cheekbone in engraving style.
- hand-authored Bézier outline; iris with two catchlights; lid; lashes; wrinkles as hatch clipped to shadow regions
- candle under-light at night, dawn backlight at the end
- about 55% of the frame, centre y≈820
- a soft out-of-focus window behind
- CLIMAX CLOSE SET (handheld mirror, 31.95–36.2 s): the dark ceiling and reeds plus part of the wall behind the orb, which sits about 40 cm from the glass and fills 70% of the frame. It is reached by a horizontal whip translate of the room canvas with 6-sample motion blur and a cross-dissolve.
- GLASS LAYER (screen-locked, always frontmost):
- warm-silver multiply #EFE7D7
- cached corner foxing #1A0F07
- about 120 hairline scratches that sparkle near lights
- 24 px bevel darkening + prismatic fringe
- ghost doubles of bright lights (+5/+9 px, 18%, screen)
It also hosts fog, wipe streaks, the soot print and trail, the crack, the full-screen cross shadow, and the lockup 6.
- LOCKUP STATE: reflection darkened to #231305 with vignette, a faint crack on the glass, the solid fire 6 at x 540, y 540–1120, and a dark ridge with six small fire points (two inside the 6's loop at (500, 945) and (585, 945), four to the right).
- OUTRO: the existing standard 4.5 s animated Westhill logo outro, appended after frame 1335.
- **characters_and_rigs:** - MIRROR / CAMERA RIG: a precomputed damped-pendulum ODE, θ(t) = Σ A·e^(−(t−ti)/τ)·sin(2π(t−ti)/2.8).
- impulses: touch 2.3 s (0.5°, τ 2.5); drafts 14.5 s (0.2°), 23.5 s (0.15°), 26.2–31 s (irregular 0.3–0.4°); re-hang 36.2 s (crooked 3°); straighten 38.5 s (→0 over 0.4 s); dead still 20–22 s
- world rotated by 2θ about (540, −180)
- handheld mode 31.75–36.2 s: drop 40 px + tilt −8° (easeOut 0.2 s), whip 31.95–32.25 s, 5% spring overshoot, 6 px / 9 Hz tremor
- ABUELA BODY SILHOUETTE (six parts: hood, torso, skirt, upper arm, forearm, hand) with paintShape rim light.
- arms: ik2 with springFollow lag 0.12 s
- walk: 1.1 s per step, 10° lean, 5 px bob
- rebozo: simCloth 10×14 pinned at crown and shoulders, 18 fringe simChains, skirt hem cloth strip
- scissors gesture: 0→90° in 0.5 s, easeOutBack
- rope-rocking arm
- dozing: angular damped spring (nods 10°, 18°, drop 25°), hand slide-off 0.8 s, sleeping breath 3 px / 3.4 s
- waking: lunge filling the frame in 0.4 s
- dawn: sleeping pose beside the cradle
- ABUELA EYE ECU RIG: lid open/close (blink 4+5 frames), widen (+30% over 0.6 s), iris catchlights, under-light vs backlight; the same asset is used in the hook and the dawn reveal.
- ABUELA HANDS / FINGERS: partial silhouettes with a silver ring. Four blurred finger capsules per side gripping the screen edges (above the glass, warm rim), withdrawing at 36.3–36.6 s. One finger for the baby to grasp at the cradle rim.
- REBOZO-CORNER WIPE: a cloth strip (terracotta/green stripes) with 8 fringe simChains, directional blur, and a wipe path used as the fog destination-out mask. Used at 0.6–1.25 s and 38.5–39.0 s.
- NEWBORN:
- swaddle: striped sarape, breathing +1.5% / 1.2 s, wriggles on whimpers
- tiny hand: palm ellipse + five two-segment capsule fingers, rise 60 px, phase-offset curls, grasp curl 0→1 over 0.3 s at 37.0 s
- CRADLE: precomputed damped pendulum with 4 rope simChains.
- push 4.6 s (3°, P 2.4)
- rope-rocking 9–17 s (P 2.6)
- dies out by 21 s
- self-swing from draft impulses 27–31 s
- BRUJA SHADOW PUPPET (9.6–12.0 s): one smoothPath kneeling silhouette ≈260 px tall projected inside the light fan.
- ik2 arms rise 20°→150° (easeInOutSine)
- hair simChains in a heat updraft
- fbm threshold dissolve climbing from the ground with a gold sparkling edge, removing knees, legs and skirt
- upper half hangs, then collapses to a point at 12.0 s
- ORB RIG (shared by all orbs):
- three radial gradient layers + fbm shell polygon r(θ,t) = R(1 + 0.18·fbm)
- six pnoise-deformed bezier flame lobes against velocity + flame2D rim tongues; stateless ember trail
- Catmull-Rom flight with 0.7 Hz bob and darts
- ignition (point → r70 → settle in 8 frames)
- subliminal face hollows (destination-out), held as eyes at the window
- flinch crumple on a spring (ζ 0.4) + 150-spark burst
- curtain reveal (widening angular gap)
- exit comet (scale 3→0.05 over 0.9 s) + spark burst
- light-list registration
- INTERIOR FEEDING FORM: the orb's lower half descending 240 px over 2.2 s, with 7 tendril simChains (14 links) whose tips follow springFollow targets near the bundle, clamped 40 px away. Vital motes are spiral paths from the swaddle into the core; the core pulses on each arrival.
- WITCH TRUE FACE: about 40 cubic Bézier paths as SVG strings in 3 keyframes with identical topology (hungry, recognition, horror), eased interpolation, 2 px tremble.
- double stroke: wide blurred additive orange + thin white-gold core
- hatching clipped to 6 shadow regions
- flame-tongue hair in a polar band; glow() coal eyes
- lunge scale 1.0→3.2 in 5 frames
- design: an ageless village woman, strong brow and cheekbones, NO hooked nose
- HAND OF FIRE → SOOT PRINT: tendril tips converge into five finger capsules + palm in 3 frames, slam on the glass, then swap to a flat Path2D print with char fill (paintShape + noise) and precomputed Voronoi ember-crack polylines (additive #F26D3D) cooling over 1.5 s. The index-fingertip drag (34.4–35.0 s) feeds the soot-trail reveal.
- OTHER BRUJAS:
- two flyover orbs (ignite 14.6 s / 15.1 s, cross the roofs, dip at 16.9 s, dart away and wink out at 35.6 s)
- six sting lights (ignite in an 80 ms ripple at 42.6 s, breathe at 0.8 Hz, blink out right to left 60 ms apart at 43.9 s)
- TECOLOTE: 2D owl silhouette with a 380 px wingspan and moon rim.
- 4 wing keyposes eased + primary feather chains
- 3-flap landing in 0.5 s
- head snap 90° on a spring (0.15 s)
- amber eye discs
- orange underlight at 22.9 s
- takeoff up-left
- **effects:** - BREATH FOG: a 270×480 canvas recomputed every frame from analytic puffs (hook at 0.10 s, dawn at 39.10 s) minus wipe masks, × (1 − latent6Mask). Composited as a quarter-resolution blurred frame copy + 60% white veil weighted by fog alpha; ragged fbm edges; evaporates edges-inward at 41.8 s.
- LATENT 6 MASK: Rye '6' via fillText into an offscreen canvas at ≈580 px, x 540, y 540–1120 (await document.fonts.load under delayRender), with noise-displaced edges. It drives four states:
- soot trail (34.4–38.5 s, mask ∩ thick skeleton stroke revealed by length, charcoal #1A120C, smeared and smoked, illegible)
- clear stroke in the fog (39.1 s)
- ember edge glow (40.2 s)
- solid gold → cempasúchil fill with ember rim and rising sparks (41.8 s)
- GLASS CRACK: a hash-seeded branching polyline from the palm, revealed over 4 frames at 34.2 s, dark/bright double line with a 3 px refraction-offset sliver, persisting faintly through the lockup.
- CROSS SHADOW: the scissors Path2D projected from the orb centre by the depth ratio k, multiply deep brown, blur ∝ orb radius, sweeping over floor, cradle and abuela (23.8–25.4 s). Full-screen glass version for 8 frames (35% darker, wide soft edge). One more sweep as the orb exits at 35.3 s.
- LIGHT LIST + ORB LIGHT POOLS: additive radial passes masked to room and roof silhouettes. Warm pools slide across the village tile roofs during the flyover. The candle is the key light at rest; the orb overpowers it at 23.4–25.4 s and 28.8–35 s.
- GRABADO DE LUMBRE: post hatch 0.12 base (0.30 during 32.6–34.2 s). hatchInk lerped from [35,19,5] toward ≈[122,74,22] by orb-light share each frame.
- GHOST DOUBLES of bright sprites (+5/+9 px, 18%, screen) and SCRATCH SPARKLE (alpha rising with proximity to on-screen lights).
- FOXING and BEVEL: a cached edge-weighted noise multiply, plus a 24 px edge darkening with prismatic fringe via post ca.
- FOGÓN LIGHT FAN + SHADOW DISSOLVE: beam() from the hut doorway; fbm-threshold destination-out climbing from the ground on the shadow, with gold edge sparkles; a white flare, then darkness at 12.0 s.
- VILLAGE WINDOWS GOING DARK one by one (14.8–16.8 s), each a quick warm-to-dark fade.
- CANDLE: candle2D with lean driven by a spring toward drafts and the ceiling (27.2 s), standing perfectly still 20–22 s, guttering in exposure dips; burned to a stub during the time-lapse.
- PARTICLES: orb ember trails; 150-spark flinch burst; roof grit trickle (40 grains, 26.6 s); 25 drifting embers through the reeds; spark bursts on the exit and the 6; dawn dust motes in beams.
- REED LIGHT LEAKS: thin additive orange lines masked to the gaps in the carrizo, sliding left to right with the unseen orb (27.2–28.8 s).
- VITAL MOTES: bone-white points spiralling up from the swaddle into the orb core, each triggering a core pulse (28.8–31.2 s).
- FIRE-HAND SOOT PRINT with Voronoi ember cracks cooling over 1.5 s, smoking and blurring as she is yanked away.
- TIME-LAPSE DISSOLVE (37.4–38.4 s): sky ramp, candle burn-down, beams entering. NIGHT RETURN (41.8–42.6 s).
- WHIP: 6-sub-sample horizontal motion blur for 9 frames + cross-dissolve to the close set.
- POST (per-frame Scene return):
- bloom 0.6 → 1.1 in attacks; halation 0.5; grain 0.06; vignette 0.35 (+15% at 20–22 s)
- exposure −0.15 at 9 s, rising in attacks
- flash 0.12 at 22.0 s and 0.9 for 2 frames at 34.2 s
- ca spike 12 px decaying 0.4 s at 34.2 s
- stage.shake 4 px at 22.0 s and 30 px at 34.2 s
- **typography_moments:** - T1, 0.30–2.10 s: «Soy el espejo de la abuela.» Alike 64 px, bone #D9CDB6, centred, block top y=1410, soft, surfacing through the fog.
- T2, 2.60–5.60 s: «Me colgó frente a la cuna» / «la noche que nació la niña.» Alike 56 px, bone, two lines, block top y=1410, soft.
- T3, 6.00–8.80 s: «Abrió unas tijeras en cruz» / «y las puso en la ventana.» Alike 56 px, bone, two lines, block top y=1410, soft.
- T4, 9.10–11.80 s: «Dicen que, al caer la noche,» / «dejan sus piernas junto al fogón…» Alike 54 px, bone, two lines, block top y=1410, soft (fallback: «dejan su cuerpo junto al fogón…»).
- TITLE, 12.10–14.40 s: «LAS BRUJAS» / «DE FUEGO» Rye 84 px, cempasúchil #F26D3D with gold glow, lineHeight 1.1, block top y=1265, burn mode with letters igniting left to right, charring edges and shedding sparks.
- CREDIT, 12.70–14.40 s: «Altar 1 · Ala Sur» / «Psicología y Ciencias de la Educación» Alike 34 px, sand #E0BB8F, two lines, block top y=1465 (bottom ≈1550).
- T5, 14.60–17.00 s: «Vuelan sobre los techos» / «buscando recién nacidos.» Alike 56 px, bone, whisper mode, two lines, block top y=1410.
- T6, 17.30–19.90 s: «Pero ninguna soporta» / «ver su propio reflejo.» Alike 58 px, bone, with 'reflejo' accented gold #F5C242, two lines, block top y=1410, soft.
- T7, 20.10–21.60 s: «Yo no puedo cerrar los ojos.» Alike 60 px, bone, single line, block top y=1410, soft; must be fully gone before 22.0 s.
- NO TEXT from 22.0 to 39.9 s: the images carry the climax.
- T8, 39.90–41.60 s: «Ella también está contando.» Alike 56 px, bone, single line, block top y=1240 (below the 6), soft.
- LOCKUP, 41.80–44.50 s, LeyendaLockup with top=380, bottom=1170, color #D9CDB6, dateColor #F5C242:
- 'FALTAN' Rye 92 at 41.90 s
- the canvas-drawn fire «6» (Rye glyph, ≈580 px, x 540, y 540–1120, gold → cempasúchil with ember rim) from 41.80 s
- 'DÍAS' Rye 92 at 42.10 s
- '28 · 10' Alike 52 at ≈y 1298, from 42.40 s
Dip to deep brown at 44.20–44.50 s.
- **audio_cues:** - 0.00–0.10 digital silence; 0.10 warm exhale on glass ('haa' formant, LP 3 kHz, 0.5 s)
- 0.60–1.25 rebozo squeak on glass (band-passed noise, 18 Hz stick-slip)
- 0.70 glass-harmonica drone in (D4 + A4, 0.7 Hz beating, −24 dB), continuous mirror voice
- 1.35 tiny distant crackle + 40 Hz sub swell (−30 dB); 1.60 distant tecolote double hoot
- 2.2–17 room tone (brown noise), candle flutter, crickets at −30 dB; huarache scuffs 3.0 / 3.9; rope creak at each swing end
- 3.40 abuela's wordless hum of 'A la roro niño' starts (formant 'mmm', f0≈220 Hz, D major, rubato 60 BPM)
- 6.90 scissors open: metal slide + inharmonic ring 2.1 / 3.4 / 5.9 kHz (PROTECTION MOTIF); 7.60 iron tock on sill; 8.40 harp pluck D3
- 9.0 wind gust + shutter creak; distant fogón crackle with long reverb; drone slides D→C#
- 9.6–11.4 distant low female hum gliding 150→300 Hz (−28 dB, heavy reverb)
- 12.20 ignition whumpf (40 Hz + noise) + distant roar; crackle sweep with the title letters; choir pad in (D–F–A + E♭, −22 dB)
- 14.6–16.9 three orb whooshes panned to x; dogs (three voices, one yelp then silence); distant shutter clacks per dark window; tom heartbeat 60 BPM
- 17.3–19.4 hum slows and sags −30 cents; 19.40 breaks off mid-note into a sleepy exhale; tom stops
- 20.0–22.0 room tone −45 dB + 3.2 kHz glass sine −42 dB; 20.30 crickets cut dead
- 22.00 owl wing burst + alarm scream (2–7 kHz AM) + bill clacks; 22.90 two alarm hoots + fading flaps; low fire rumble starts under the window
- 23.4–25.4 close fire crackle and roar in wide stereo, choir swell; 24.90 scissors ring + hiss + reversed guttural inhale; 25.40 near silence, fire moving under the window then upward
- 26.60 and 27.20 clay tile knocks; grit trickle; ceiling rumble panning L→R; ember ticks; 28.30 newborn whimper (f0≈480 Hz); tom returns 70 BPM accelerating
- 28.8–31.2 choir swells; harp 'A la roro' in D minor, detuned with missing notes; reverse-whoosh grain per mote; 30.40 weaker second whimper; tom 110 BPM
- 31.20 sharp gasp; chair scrape and clatter; fast steps; nail scraping out of adobe; glass rattle in tin; 31.95 whip whoosh
- 32.6–33.8 close roar + choir + rising string-like cluster; 33.30 thin pained exhale; 33.80–34.10 DIGITAL ZERO; 34.10 single ember tick
- 34.20 SLAM: 35 Hz sub boom + body thump + glass impact + crack crackle + saturated formant shriek with fry (34.20–35.00, energy at 80–200 Hz and 1–3 kHz)
- 34.40–35.00 fingernail-on-glass screech (FM 2.8–3.6 kHz) synced to the drag; 35.30 scissors ring as she passes; roar receding with doppler; 35.90 distant pop; far dog bark
- 36.20 mirror clack onto the nail, glass ring decays; 37.00 baby coo + abuela's shaky exhale; 37.20 harp first phrase in warm D major; crickets → dawn birds; 38.20 single chapel bell toll
- 38.50 cloth squeak (wipe); 39.10 close exhale (fog); 39.50 harp stops mid-phrase; drone returns on D + E♭; 40.60 far-off female giggle (risita, long reverb, left)
- 41.80 lockup hit: deep tom + scissors ring + choir D minor (add9); night wind returns
- 42.60 six distant ignitions rippling within 80 ms; 43.90 six soft 'pff' extinguishes + faint giggle; 44.30 short reverse swell into the outro
- 44.5–49.0 standard outro audio; the drone's E♭ resolves to D under the logo ignition
- MASTER: −14 LUFS integrated, true peak ≤ −1 dBTP via sfx.master; the 33.80–34.10 window must stay true digital zero

## Injertos de los otros tratamientos

FROM A:
(1) The transformation choreography (kneeling, arms rising, hair lifting in an updraft, body fraying from the knees up, collapsing into a point of fire). It becomes a giant shadow inside the fogón's light fan on the hillside mist, seen through the window. That keeps the mirror rule and still makes «dejan sus piernas» visible without showing anything graphic.
(2) The post-reveal sting: six lights ignite on the ridge (six brujas, six days) and blink out like eyes closing before the logo. I add two of them sitting inside the loop of the 6 like a pair of eyes.
(3) The faculty credit under the title.
(4) Subliminal single-frame face hollows in the orb core, held as 'eyes' at the window.
(5) Sound discipline: digital zero before the slam, braam and shriek energy at 80–200 Hz for phone speakers, one 2-frame flash only.
(6) Explicit back-to-front layer tables.
(7) The fire face kept noisy and mostly negative space.

FROM B:
(1) 'Grabado de lumbre': the post hatch ink warms from deep brown to gold whenever fire is the key light, so the engraving 'catches fire'. This is cheap with the kit's hatch and hatchInk uniforms.
(2) Orbs carry noise-deformed flame lobes that stream like hair, so they read as living fire and never as bulbs or UFOs.
(3) Nature falling silent on cue: crickets cut dead, the village goes dark window by window, each with a distant shutter clack.
(4) Ignition grammar for the orbs: a point flares to r70, then settles.

FIXES TO C:
(1) The witch's hand is no longer a charred human hand. Her seven flame tendrils snap into a five-fingered hand of fire that chars into a soot print on contact, which stays true to a bruja who has left her body behind.
(2) The true face is a village woman drawn in ember lines, not a hooked-nose crone.
(3) Re-hang timing is consistent.
(4) The soot smear is illegible until the dawn breath reveals the 6.
(5) The exit path is clarified.
(6) Text is retimed and resized to fit the floor band inside the safe zone.
(7) The lockup uses the kit's LeyendaLockup with the episode's own fire 6.
(8) The tecolote sound is coherent with an owl (alarm scream, bill clacks, hoots).
