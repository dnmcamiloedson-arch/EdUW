# Guía de estilo de la serie

## Nombre de la serie

Leyendas · Grabado nocturno vivo

## Look

ONE PRODUCTION, NINE DEVICES. Every episode is a living 19th-century Mexican broadside print, lit only by practical light. Each episode keeps its own device (flashlight, shutter, mirror, traveller's eyes, coffin lid, dashcam, water, roll call, warm home). Texture, grade, type, cards, lockup, transitions and sound are shared.

THREE LAYERS, IDENTICAL IN ALL 9:
(1) PAINTED PLANES. Each shot has 5–7 flat 2D planes at real depths (stage.onPlane), painted far→near. Every form is shaded with paintShape: body gradient, inner shadow on the side away from the key, rim from the motivated source, texture ≤ 0.25. Put fogBand layers between planes, use dof() by depth, and in most shots add one dark, defocused foreground occluder.
(2) MOTIVATED LIGHT ONLY. One warm practical key (flashlight, candle, farol, bulb, match, headlights, fire orb, dawn) against a cold teal moon fill. Light leads the eye: the story focus is the brightest area, and the second brightest is ≤ 70% of it. Glowing eyes are always the smallest, brightest thing in frame.
(3) THE BROWN-INK ENGRAVING. The Post hatch pass is the series' paper and ink. Its burin lines live in mid-shadows and light falloff, vanish in hot cores and emissives, and are always brown. Its strength is dramaturgy:
- it thickens with the supernatural (scare spike);
- it thins where the device needs clarity;
- it LIFTS when the spell breaks (dawn in d8, love in d0).

HATCH LADDER (base → peak; scare spike = base + 0.25, cap 0.75):
- d8 flashlight: 0.55 → 0.7. Memory 0.45. Dawn 0.5 → 0. Title 0.12–0.15.
- d7 bulb: 0.22.
- d6 mirror: 0.15, face beat 0.30. Ink turns lumbre-gold with fire.
- d5 farol: 0.24 (raised from 0.06 so the 'estampa grabada' finish is actually visible).
- d4 coffin: 0.20 → 0.35 across the acts. Mummy face 0.45. 1865: 0.2 → 0.4. Panteón 0.3.
- d3 dashcam: 0.12, rising to 0.35 whenever the child is in frame (the ghost is engraved). Face frames 0.6.
- d2 water: 0.2.
- d1: 0 under the fluorescents (the living's light has no ink). Born at 0.2 when the first legend wakes.
- d0: 0.18 in the dread, softer spike (+0.15). Dissolves to 0.06 after the turn, 0.04 on HOY, 0 in the city outro.
- Floor: every legend story shot has hatch ≥ 0.12, except silence cards and d1's fluorescent hook.
- hatchScale 5 (allowed 4.5–6). hatchAngle 0.6 rad, or −0.6 when the key comes from the upper left (d7).

SHARED TEXTURE STACK:
- Blacks are never neutral. Paint floor #0B0703, shadows on #231305. True near-black #050302 only on deliberate silence cards.
- Luminance-weighted film grain.
- Bloom only on practicals, eyes, metal glints and the numeral.
- Mild edge CA.
- Brown-anchored grade (see post_presets).

COMPOSITION:
- Subject and eyes sit between y 500 and 1150. Nothing important within 60 px of the edges.
- Keep the Reels icon column clear: no key subject or text at x > 960 between y 1000 and 1650.
- The IG feed shows a 4:5 crop (y 285–1635), so the hook image, title card and lockup must read inside it.
- Verticality is scale: tall reveals climb the frame (Charro column, upright coyote shadow).

LAYER ORDER (explicit per shot):
sky → far planes → fog → mid planes → contact shadows on the ground → character → foreground occluders → device/screen layer (d6 glass, d3 mirror and dashboard, d5 eyelids, d7 shutter) → Post → DOM text.
- Every figure touching a surface has a contact shadow (blurred ellipse multiplied in #231305 at 0.5–0.7).
- Cast shadows agree with the key.

POLISH QA on contact sheets (stills.mjs at 0.5 scale, every 15 frames). Check for:
- wrong depth order and floating feet;
- unmotivated light;
- text over faces or eyes;
- banding (add noise to any gradient wider than 400 px);
- hatch moiré;
- anything outside the safe zone.

BANNED: 3D characters (3D-looking work only for small props: the 2.5D coin, glass, candles); gore, blood, wounds, severed limbs; Halloween imagery (pumpkins, bats, cobwebs); calavera or Catrina horror; copyrighted characters; any text in imagery other than programmatic Rye/Alike (calendar, KM post, carved 4, OSD).

## Paleta

BRAND ANCHORS (all 9 episodes):
- deep brown #231305: every shadow, the hatch ink, the lockup field;
- cempasúchil #F26D3D: the path, petals, danger accents, FALTAN/DÍAS;
- gold #F5C242: flame cores, love and memory, the numerals, the title's main word, HOY;
- sand #E0BB8F: lit walls, quotes, credits;
- bone #D9CDB6: narration text, moonlit highlights, cloth, the pale dead;
- terracotta #A83A25: fire falloff, adobe and tezontle, numeral rims;
- green #1F5C48: base of all night ambience, doors and shutters, the Ala Norte zoclo.

DERIVED COLORS (night and fire only, always built from the anchors):
- teal ambient #2B5A63 / #163640 mixed with #1F5C48;
- deep teal shadow #16303A / #0F2E2F;
- cold rims: #9FC3C4 (moon), #9FD3D6 (La Llorona only), #BFD6DA (d0 door blade);
- flame core #FFF4D6 / #FFF1C9;
- burnt-gold 'lumbre' hatch ink #7A4A16;
- paint black floor #0B0703; silence-card black #050302.

COLOR GRAMMAR:
- Warm = the living's love, home, the altars and the count. Cold = grief, night, the side of the dead.
- Cempasúchil and gold are reserved for meaning (petals, flames, the number, accent words). Never decorate with them.
- Teal may fill up to ~60% of a night frame, but highlights and practicals stay warm. Every thumbnail must read brown-teal-gold, with no neutral greys anywhere.

SATURATED RED EXCEPTION. Red (#C8402A family) appears only on:
- the abuela's listón (d8);
- the red tin toy car and the child's eyes (d3, and their cameo in d1);
- the granddaughter's thread bracelet (d0).
Never as liquid, on skin, or as a full-frame flash. Water highlights are always white or teal, so no drop can read as blood.

EPISODE SIGNATURES (inside the shared grade):
- d8: cold teal dark, bone flashlight cookie with a sand/terracotta halo, gold chaneque eyes, the red listón.
- d7: tungsten gold bulb vs teal street, whitewashed sand wall over terracotta adobe, gold eyeshine.
- d6: veladora-gold room, teal window night, white-gold brujas fire (the only saturated thing), ghost-doubled lights.
- d5: moon teal behind the traveller, tin-lantern orange, cold silver (#D9CDB6, specular #C9D8D6), devil's gold turning to coal.
- d4: amber match → cold teal last match → mineral bone; wood from #A83A25 toward #3B2412.
- d3: painted dashcam teal fog; bone child with teal-grey shadow #5E7F7A and cold rim #BFE0D8; red eyes.
- d2: cold teal-blue night and water #0F2A2A vs candle, petals and the children's lights; her bone is the only near-white.
- d1: cold neutral fluorescent #E6EEE0 for 2 s, then brand warmth rising altar by altar. Ala Sur zoclo #A83A25, Ala Norte zoclo #1F5C48.
- d0: full candle warmth; the teal door blade (#16303A→#2B5560) turns gold over 2.5 s when she enters.

SERIES CONSTANTS:
- Title main word gold #F5C242 with a #F26D3D glow (cold #9FD3D6 glow only for La Llorona: warm love against cold grief).
- Numeral 'brasa' gradient #FFF1C9 → #F5C242 → #F26D3D with a #A83A25 rim.
- FALTAN/DÍAS #F26D3D. Date #E0BB8F.
- Narration bone, quotes sand, credits sand.

## Presets de postproducción

All values are kit PostOpts (kit/post.tsx). paint() returns the world preset, with per-frame overrides only for scares, transitions and light events.

INK CONSTANTS:
- INK = [0.137,0.075,0.020] (#231305): default brown ink.
- INK_DEEP = [0.043,0.027,0.012] (#0B0703): pitch-dark worlds.
- INK_LUMBRE = [0.478,0.290,0.086] (#7A4A16): fire as the key light.
Defaults unless noted: exposure 1, hatchScale 5, hatchAngle 0.6.

UNITS:
- ca is in kit px (≈0.7 px real offset per unit at the corners).
- shadows/highlights are ADDITIVE tints.
- Convert d3's treatment numbers: ca 0.0015 → 1.6 and 0.012 → 12; the multiplicative highlight tint (1.0, 0.92, 0.80) → [0.03,0.016,-0.006].

LUNA · moonlit exterior (d2 alley/river, d4 panteón, d1 patio, d6 hills, d5 road ambience):
{contrast 1.08, saturation 0.85, shadows [0,0.012,0.028], highlights [0.015,0.01,0], bloom 0.5, bloomThr 0.72, halation 0.2, ca 1.5, vignette 0.6, grain 0.07, hatch 0.28, hatchInk INK}
- Ranges: hatch 0.22–0.35, vignette 0.5–0.7.
- d2 uses hatch 0.2 (reflections need clarity). d4 panteón: hatch 0.3, hatchScale 5.5.

LINTERNA · flashlight POV (d8) = d8 POST_NIGHT, unchanged:
{contrast 1.08, saturation 0.88, shadows [0,0.01,0.022], highlights [0.015,0.008,0], bloom 0.5, bloomThr 0.72, halation 0.22, ca 1.6, vignette 0.9, grain 0.075, hatch 0.55, hatchInk INK_DEEP}
- Plus paint flashlight({dark 0.92–0.95, color '#EDE3CF'}). The hatch peaks in the beam's falloff.

FAROL · tin-lantern POV (d5; also d4's 1865 gravedigger lantern):
{contrast 1.07, saturation 0.88, shadows [0.004,0.01,0.02], highlights [0.035,0.018,-0.008], bloom 0.55, bloomThr 0.72, halation 0.35, ca 1.4, vignette 0.55, grain 0.07, hatch 0.24, hatchInk INK}
- Lantern flicker drives exposure 1 ± 0.04 (7 Hz noise + 0.7 Hz swing).

FOCO · single tungsten bulb (d7) = d7 POST_BASE, unchanged:
{contrast 1.06, saturation 0.9, shadows [0,0.014,0.03], highlights [0.03,0.016,-0.005], bloom 0.5, bloomThr 0.72, halation 0.25, ca 1.0, vignette 0.4, grain 0.07, hatch 0.22, hatchAngle -0.6, hatchInk INK}

VELADORA · candle interior (d6 room, d1 altars):
{contrast 1.06, saturation 0.95, shadows [0.01,0.005,0], highlights [0.035,0.015,-0.01], bloom 0.6, bloomThr 0.7, halation 0.35, ca 1.3, vignette 0.5, grain 0.065, hatch 0.24, hatchInk INK}
- d1 altars: hatch 0.2.

ESPEJO · mirror world (d6) = VELADORA + {ca 2.0 (old-glass bevel fringe), vignette 0.38, grain 0.06, hatch 0.15, hatchInk = mix(INK, INK_LUMBRE, orbLightShare)}
- 20–22 s dread: vignette 0.53. Face beat: hatch 0.30.
- Attacks: {bloom 1.1, bloomThr 0.62, halation 0.5, exposure up to 1.1}.
- Slam: SUSTO with ca 12.
- The glass layer (ghost doubles +5/+9 px at 18% screen, foxing multiply ≤ 0.25, scratches, fog, soot, crack) is painted last on the canvas, so it is graded and hatched with the room and the hatch reads as engraving on the glass.

LUMBRE · fire as key (d6 attacks, d1 petal ignition, d5 coin ember, d8 listón fuse, d4 match strike):
{contrast 1.08, saturation 1.0, shadows [0.012,0.004,0], highlights [0.05,0.02,-0.015], bloom 1.0 (0.9–1.2), bloomThr 0.62, halation 0.5, ca 1.6, vignette 0.5, grain 0.065, hatch 0.22, hatchInk INK_LUMBRE}
- Exposure 1 ± 0.06 with 5–9 Hz fire noise.

ATAÚD · coffin (d4). One preset per act, all sharing {ca 1.2, vignette 0.65, grain 0.085, hatchInk INK_DEEP}:
- CERILLO (first match): {contrast 1.08, saturation 0.92, shadows [0.012,0.005,0], highlights [0.04,0.018,-0.012], bloom 0.6, bloomThr 0.7, halation 0.4, hatch 0.2}. On the strike: exposure 1.4→1.0 and flash 0.6→0 over 8 frames.
- RENDIJAS (lantern beams through the cracks): {bloom 0.9, bloomThr 0.6, shadows [0.014,0.006,0], hatch 0.22}.
- ÚLTIMO CERILLO: {saturation 0.7, shadows [0,0.012,0.02], highlights [0.012,0.012,0.012], bloom 0.5, hatch 0.28}.
- LOS AÑOS (moon thread): {saturation 0.6, shadows [0,0.014,0.024], highlights [0.01,0.012,0.012], hatch 0.35, grain 0.09}.
- Mummy face (frames 876–888): hatch 0.45.
- 1865 (lantern flood): exposure 0.3→1.1 over 1.2 s, bloom 1.2→0.7, halation 0.4, hatch 0.2→0.4, hatchInk INK.
- PANTEÓN: LUNA with hatch 0.3.
- SILENCIO cards: paint #050302, {bloom 0, hatch 0, grain 0.10, vignette 0.65}.

DASHCAM · found footage (d3):
{exposure 0.95, contrast 1.14, saturation 0.75, shadows [0.03,0.06,0.06], highlights [0.03,0.016,-0.006], bloom 0.6, bloomThr 0.7, halation 0.35, ca 1.6, vignette 0.45, grain 0.12, scan 0.06, hatch 0.12, hatchInk INK}
- Child in frame: hatch → 0.35 over 6 frames, back over 12.
- Headlight bleach (f590–599): exposure 1.25, bloom 0.9, halation 0.6.
- Face frames: hatch 0.6.
- Stare: auto-exposure pump, exposure 0.95 ± 0.06·sin(2π·0.8t).
- glitch only on file artifacts (boot f4–6, the brake dropout), ≤ 0.35.
- Coda: {saturation 0.85, grain 0.10, highlights [0.045,0.022,-0.01], hatch 0.12→0.06}.

CASA · warm home (d0):
- ESPERA (dread, 18–24.7 s): {exposure 0.8, contrast 1.06, saturation 0.9, shadows [0,0.014,0.03], highlights [0.03,0.015,-0.008], bloom 0.55, bloomThr 0.7, halation 0.4, ca 1.2, vignette 0.4, grain 0.045, hatch 0.18, hatchInk INK}.
- CÁLIDA (lerp in from 28.0 s over 2.5 s): {exposure 1.0, contrast 1.04, saturation 1.0, shadows [0.012,0.006,0], highlights [0.04,0.02,-0.01], bloom 0.6, bloomThr 0.7, halation 0.4, ca 1.0, vignette 0.3, grain 0.045}, with hatch 0.18→0.06 over 4 s.
- Match flare (0.33 s): exposure 1.35→1.0 over 8 frames, flash 0.25.
- Slam: SUSTO at reduced strength (flash 0.35, ca 5, hatch +0.15).
- HOY: {bloom 0.7, bloomThr 0.62, vignette 0.35, hatch 0.04}.
- City outro: {contrast 1.05, saturation 0.95, shadows [0.004,0.012,0.022], highlights [0.04,0.02,-0.01], bloom 0.75, bloomThr 0.6, halation 0.4, ca 1.0, vignette 0.45, grain 0.045, hatch 0}.

MEMORIA · sepia memory (d8 kitchen; any full-frame memory) = d8 POST_MEMORY, unchanged:
{contrast 1.06, saturation 0.82, shadows [0.02,0.008,0], highlights [0.035,0.018,-0.01], bloom 0.6, bloomThr 0.7, halation 0.35, ca 1.2, vignette 0.95, grain 0.07, hatch 0.45, hatchAngle 0.75, hatchInk INK}
- Plus a canvas oval vignette, gate weave ±1.5 px at 0.8 Hz and one gold light leak. This is the only world with gate weave.

AMANECER · dawn release (d8 B9–B11, d6 dawn, d5 end if dawn-lit) = d8 POST_DAWN:
{contrast 1.03, saturation 0.9, shadows [0.01,0.012,0.02], highlights [0.04,0.025,0], bloom 0.45, bloomThr 0.75, halation 0.3, ca 1.2, grain 0.065}
- vignette = the episode's world value (d8 0.8).
- Hatch fades from the world value to ≤ 0.12 across the dawn shot: the spell lifts.

FLUORESCENTE · the living's light (d1 hook, 0–2 s only):
{contrast 1.0, saturation 0.75, shadows [0,0.004,0.006], highlights [0,0.006,0.004], bloom 0.35, bloomThr 0.8, halation 0.1, ca 1.0, vignette 0.35, grain 0.06, hatch 0}
- When the tubes die, lerp into VELADORA/LUNA over 12 frames. Hatch goes 0 → 0.2 with the first awakening.

RÓTULO · title card: the active world + {bloom 0.7, bloomThr 0.6, vignette max(world, 0.8), hatch 0.15}, plus a canvas radial #231305 scrim at 0.55 behind the title block.

CIFRA · numeral and lockup (days 8–1):
{contrast 1.06, saturation 0.95, shadows [0.01,0.005,0], highlights [0.03,0.015,-0.01], bloom 0.75, bloomThr 0.6, halation 0.35, ca 1.2, vignette 0.8, grain 0.065, hatch 0.12, hatchInk INK}
- Last 6 frames: fade 0→1.

SUSTO · main jump scare overlay, added on top of the active world on the exact frame:
- f0: flash 0.5 (max 0.6), decaying to 0 over 4 frames; exposure 1.1.
- ca jumps to 8 (6–10; 12 only for d6's glass crack) and decays exponentially over 12 frames.
- hatch +0.25 (cap 0.75) for 4–13 frames: the print itself flinches. This is the series' scare signature.
- stage.shake(t, t0, 18–40, 0.6, 22).
- Zoom punch 1.00→1.07 in 3 frames, settling over 10.
- glitch is reserved for camera devices: d3 (≤ 0.35, 2–4 frames) and d1's KM 31 headlight cut (0.3). d2, d5 and d1's final lunge use the hatch spike instead.
- Minor scares: ca 3–4, no flash, hatch +0.1, shake ≤ 8 px.
- Photosensitivity: flash ≤ 0.6, never more than 3 flashes per second, never a saturated red full-frame flash. This caps d2's 0.85, d1's 0.8 and d4's 0.7 at 0.6.

HATCH BOIL (handheld or moving shots with hatch ≥ 0.3; static shots never boil):
- hatchAngle = base + (hash(floor(f/4), seed) − 0.5) × 0.004, so the plate 'reprints' at 7.5 fps instead of sliding like a screen overlay.
- Recommended kit addition for the engine owner: hatchPhase (default 0, so existing episodes are unaffected). It adds to both hatch coordinates and is driven by the focus plane's screen motion projected on the hatch normal / hatchScale, so the lines ride the world in pans.

DELIVERY:
- grain ≤ 0.085 everywhere, except d3 (0.12) and silence cards (0.10).
- hatchScale never below 4.5 (finer lines alias after Instagram re-encoding).
- No per-frame random hatch.

## Tipografía

FONTS AND RENDERING:
- Only Rye (western wood type) and Alike (serif).
- Story text is DOM through kit Line: above Post, never hatched or grained.
- Canvas text only for numerals and diegetic prints (calendar, KM post, carved 4, OSD tear echo). Load the font first (document.fonts.load + delayRender) and use the same Rye metrics as the DOM lockup.
- Safe zone y 262–1568 (Line clamps it; check custom components yourself).
- Max width 940 px; 860 px in the lower band, because of the Reels icon column.

TYPE SCALE:
- Narration: Alike 60 (56–64; a single short line up to 66; never below 52), bone #D9CDB6, lineHeight 1.28, tracking 0.01em, mode soft, scrim 0.35–0.45.
- Abuela label (series motif): «Mi abuela decía:» in Rye 46, sand #E0BB8F, tracking 0.08em. Used in d8 and d0; d0 moves from Alike 46 to this label.
- Remembered sayings and warnings: Alike 62–66, sand, inside « ».
- The dead speaking for themselves (d0 only: the hook saying, «…canta y no llores.», «—Tápate, mija.»): Alike 62–66, gold #F5C242 with #F26D3D glow, whisper.
- Human or overheard dialogue: Alike 54–60, sand, opening raya —.
- The legend's own voice: Rye 54–64 in the entity's color. El Charro: bone with cold glow #9FC3C4. La Llorona: bone with glow #9FD3D6; «¡AY, MIS HIJOS!» slams in Rye 110 on two lines; far laments use Alike 46→36 whisper, as d2 designs.
- Commands: Rye 88–96, UPPERCASE, gold with #F26D3D glow, slam or flicker (NO VOLTEES., NO PARPADEES.).
- Punch lines: Rye 72–96, sentence case, bone, slam on a sound frame (Corrí., Despiertas., Seguían gritando.). Up to 140 on black (Tú.).
- Place and date stamps: Rye 52–56, gold, tracking 0.06–0.12em (GUANAJUATO · 1833, Carretera México–Toluca.).
- Location labels: Alike 34, UPPERCASE, tracking 0.3em, bone at 70%, y 300 (27 · 10 · ALA SUR).
- Diegetic data: d3 OSD only. Alike 30–32 with fixed-width digit spans; warnings in terracotta.

ACCENTS (Line accent prop; ≤ 1 per line, ≤ 2 per block):
- Gold #F5C242: what is loved, counted or hoped (ocho, 31, noche, reflejo, nunca se fueron).
- Cempasúchil #F26D3D: what threatens, or the path (chaneques, sombra, sí, por ti, curva, cerca, agua, alma, gritos).
- Terracotta text only for d3's OSD warning and «Casi nunca.».

BANDS:
- A (sky): block top 300–560.
- B (center): 600–1180, reserved for titles, slams, numerals and the lockup.
- C (ground): block top 1180–1460, block bottom ≤ 1560, width ≤ 860.

HOME BAND PER EPISODE. Narration stays in its home band and moves only when the image demands it, never mid-line.
- d8: A, 420–600.
- d7: A, 276–430 (the shutter band); C, 1400–1560 for the rule lines.
- d6: C, 1410.
- d5: A, 380–680 (sky); C, 1120–1360.
- d4: B, 600–960 (the lid is the screen).
- d3: A, 470–700, never over the mirror (262–418).
- d2: C, 1220–1370.
- d1: A, 470–560; altar cards at 1350–1424.
- d0: A, 390–470; C at 1180, under the calendar.
Never place text over eyes, faces, the key light core, or the numeral zone (y 600–1250) in the last 5 s.

LAYOUT:
- ≤ 2 lines per block. 3 lines only for a quoted warning of ≤ 10 words (d8 T04).
- ≤ 32 characters per line at 60 px (hard max 36).
- Break by sense units; no orphan word except in punch lines.
- ≤ 2 blocks on screen at once (setup + payoff, e.g. «Él no voltea.» / «Su sombra, sí.»).

READING TIME:
- Minimum on screen = characters/20 + 0.3 s, never under 1.0 s. Aim for characters/16 + 0.4 s when the edit allows. This replaces 0.35 s/word + 0.6 s.
- Titles ≥ 1.7 s, with the credits readable ≥ 1.1 s.
- Lockup complete (date in) ≥ 2.0 s.

MODES:
- soft: the default.
- flicker: only for text lit by an unstable practical (flashlight, bulb, candle, hazard relay, dying monitor), with beam tied to that light's intensity.
- whisper: heard whispers, far voices, the dead's voice.
- slam: only on an impact frame that has a sound.
- burn: fire legends and fire lines only (Brujas and Charro titles, «Te sepultaron con vida.», «Tú.»).
- type: not used.
- Exit through Line out (16-frame blur; 8 for slam). At a scare, hard cut to black with no blur-out.

PUNCTUATION AND STYLING:
- Always open ¡ and ¿. Quotes in « », dialogue with raya —, the single ellipsis glyph ….
- Middle dot with spaces for dates and credits (28 · 10, Altar 7 · Ala Norte). Periods on story sentences.
- All of — … ¿ ¡ « » Ú Í É Ñ · exist in both fonts.
- No faux italic and no skewX. d0's SungLine shows the hum through letters appearing on the notes, with the baseline riding the pitch ±4 px.
- No strokes, and no shadows beyond Line's own glow and drop shadow.
- Never ofrenda, evento or concurso.

TITLE CARD (days 8–2). Layout, sizes, colors and timing are identical across episodes; only the anchor Y and the entry mode change.
Y = top of the block, allowed 300–1090, so the block (≈460–500 px) ends above 1560. All lines scrim 0, lineHeight 1.05.
1. Article line: Rye 64, tracking 0.3em, bone.
2. Main word: Rye 128–140 (fit ≤ 900 px), tracking 0.04em, gold #F5C242, glow #F26D3D (La Llorona: #9FD3D6).
3. Complement (optional): Rye 80–120 (fit ≤ 900), gold.
4. Seal (a DOM SVG ornament, not text): two 70 px gold hairlines (1.5 px, 70% opacity) around a 12 px eight-petal cempasúchil rosette, 26 px below the last title line. It opens from the center (scaleX 0→1, E.out, 12 frames).
5. Credit: «Altar N · Ala Sur/Norte», Alike 44, sand, tracking 0.08em, 30 px below the seal.
6. Faculty: Alike 34, sand at 85%, tracking 0.06em, 56 px below the credit.

Title card timing:
- Frame T = the series title sting. The title enters with slam (1.35→1 in 7 frames) or the episode's mode.
- Seal at T+6, credit at T+10, faculty at T+16.
- Hold ≥ 1.7 s, then exit with a 10-frame blur or a fog sink.
- RÓTULO post dims the world behind it.
- The title is either the exhale after the main scare or the hook's door-slam.

Title card per episode (Rye widths measured):
- d8: LOS / CHANEQUES (128 = 862 px) · Altar 7 · Ala Norte · Negocios · Económico Administrativo · slam · Y≈760.
- d7: EL / NAHUAL (140 = 662) · Altar 2 · Ala Sur · Institute · flicker with the bulb · Y≈276–300. Add the credit and faculty lines, which the treatment lacks.
- d6: LAS / BRUJAS (128 = 566) / DE FUEGO (96 = 543) · Altar 1 · Ala Sur · Psicología y Ciencias de la Educación · burn · Y≈1090 (the treatment's 1265 overflows the safe zone).
- d5: EL / CHARRO (140 = 661) / NEGRO (116 = 459) · Altar 3 · Ala Sur · Arquitectura · burn · Y≈1000–1060 or ≈380 in the sky band, clear of the eyes and the lantern. Hold extended from 1.1 s to ≥ 1.7 s.
- d4: LAS / MOMIAS (128 = 617) / DE GUANAJUATO (80 = 762) · Altar 5 · Ala Norte · Odontología · slam · Y≈380.
- d3: EL NIÑO FANTASMA (article style, Rye 64, tracking 0.1em, ≈780) / DEL KM 31 (128 ≈ 745) · Altar 4 · Ala Norte · Medicina · flicker like a dying monitor · Y≈760. Hold extended from 1.1 s to ≥ 1.7 s.
- d2: LA / LLORONA (140 = 758, cold glow) · Altar 6 · Ala Norte · Derecho y Relaciones Internacionales · slam · Y≈700.

COMPACT ALTAR CARD (d1 roll call, always in the same position):
- Name: Rye 56, gold, burn, fit ≤ 900 px (El Niño Fantasma del KM 31 ≈ 52), at y 1350.
- Seal: 120 px.
- «Altar N · Facultad»: Alike 32, sand, at y 1424, entering +0.25 s after the name.
- Brown scrim at 35% from y 1300 to 1500. Exit: 0.3 s fade.

FIXES FOR THE IN-PROGRESS EPISODES:
- d8: article LOS changes from gold 70 px / 0.12em to bone 64 px / 0.3em; credit 48 → 44 px; add the seal and the full faculty line.
- d7: add the credit and faculty lines.

## Movimiento

CAMERA:
- No linear moves. Use camPath (Catmull-Rom) with E.inOut; arrivals use E.out.
- Dread push-ins: 1.5–3% zoom per second. Reveal cranes ≤ 45°/s.
- Fast turns (whips, head turns): 0.25–0.35 s on a critically damped spring with one small overshoot. Add 6-subframe directional blur only above 40 px/frame.

HANDHELD (stage.handheld(t, amp)):
- POV walk: amp 0.6–1.0, plus a step bob (walk: 1.8 Hz, 6 px, ±0.5° roll; run: 3 Hz, 18 px, ±2°).
- Locked or tripod shots: amp 0.15.
- Held breath: amp → 0 over 6 frames. The freeze is itself a cue.
- After a scare: 8–9 Hz tremor of 1.5–2 px for about 1 s.

DEVICES keep their own physics and nothing else:
- d3: car physics only (road buzz, seam bumps, curve roll, brake nose-dive).
- d6: damped pendulum only; the reflection turns at 2θ about (540, −180).
- d5: the traveller's walk and blinks.
- d4: breathing bob of 8–10 px that stops for good when the heart stops.
- d7: one uncut crouched shot with breathing.
- d1: whip pans between frontal altar plates.

shake() only on impacts and scares: 18–40 px, 0.6 s, 22 Hz. Brakes and door slams: 6–12 px.

CHARACTERS. The living have weight and breath:
- anticipation of 2–6 frames;
- 2–4 frames of overlap between joints and fingers;
- cloth follow-through (simCloth/simChain lag of 0.12–0.2 s);
- ik2 limbs with foot-lock and heel-toe roll, no sliding;
- springFollow ω 0.15–0.3 for heads and hands.

The supernatural moves less, or impossibly:
- stillness while the cloth lives (the Charro, La Llorona's freeze);
- a glide with no step or bob (La Llorona: ±3 px float at 0.35 Hz);
- tilts that are too slow (the Niño: 8° over 3 s);
- synchronized groups (40 pairs of chaneque eyes tilting 15° together);
- 1–2 frame snaps, only at scares.

Hanging and swinging objects use analytic damped oscillation, θ = A·e^(−t/τ)·sin(2πt/P) (sombrero shadow, mirror, cradle, hat on its brim).

EYES:
- Blink: close in 2–4 frames, hold 2, open in 3–5, eased.
- Supernatural eyes ignite from a 2 px point in 12 frames (E.out), or in 2 frames at a jump scare. They never blink except as a cue.

SIMULATION DEFAULTS (kit rig):
- Dry cloth (sarape, rebozo): simCloth gravity 0.3, damping 0.97, iterations 5.
- Ghost or underwater cloth (La Llorona): gravity 0.06, damping 0.988, with a slow curl-noise gust.
- Wet heavy cloth (the Niño's camisón): damping 0.9, higher gravity.
- Hair, fringe, manes: simChain gravity 0.35, damping 0.96, 9–16 strands.
- Wind only through gust(seed, 0.08–0.15).
- Everything is precomputed and deterministic: hash and noise2D only, never Math.random.

TIMING:
- Every event sits on a frame constant shared by dXX/timeline.ts and scripts/leyendas/dXX.py.
- Cuts land on footsteps, knocks, hoofbeats, drips and creaks.
- Scares land on an exact frame after 0.25–1.2 s of silence (≥ 0.6 s preferred before the main jump scare). No cut in the 2 s before a scare, so the eye can settle.
- Hooks start in motion (no fade-in longer than 3 frames), with a 3–8 frame silent 'did I see that?' subliminal inside the first 2 s that pays off later.
- Dread plays in long takes (5–12 s, or the one-shot devices); builds and chases cut every 2–4 s.

TRANSITIONS (only these seven):
1. CORTE EN SONIDO: a hard cut on a story sound (the default).
2. NEGRO DE SUSTO: smash cut to #050302 with 0.3–1.5 s of true digital silence.
3. HUMO DE COPAL: a smoke-advection wipe of 12–20 frames, only between memory and present.
4. DESTELLO: bloom white-out (match flare, sunbeam). Flash 0→0.6 in 4–6 frames, cut at the peak, decay over 6.
5. NIEBLA: the nearest fogBand rises to cover the frame in 10–16 frames (the 'fog sink' after titles).
6. CORTE POR FORMA: a match cut on shape or on a locked screen position (the same stone, the puddle that never moves, the numeral).
7. DEVICE CUTS: blinks (d5), file dropouts and the rewind (d3), the shutter (d7), mirror swings and the tear-off (d6), bricks and the 1865 opening (d4), altar whip pans (d1).
Banned: crossfades outside (3), slides, spins, zoom transitions, decorative whip wipes.

TEXT MOTION:
- Line modes only. Text never tracks the camera.
- Slams land on the sound frame. Titles follow the title-card timing. No typewriter effect.

ENDING:
- The number reveal is the story object transforming (fuse, petals settling, coin landing, shadow coming to rest, breath fog, knocks lighting the groove, page tearing).
- Then LeyendaLockup's letter-by-letter entry, an ember hold, and an 8-frame end dip into the outro.

## Motivos recurrentes

1. THE ABUELAS' WORD. Each legend is framed by what an abuela, or the people, said:
- «Mi abuela decía:» in Rye 46 sand (d8 and d0);
- «Eso decía mi abuela.» (d5);
- the abuela who protects the cradle (d6);
- «Dicen que…» (d2, d3).
Day 0 pays it off: the abuela comes home.

2. THE NUMBER IS A STORY OBJECT. It is always the Rye glyph, always ends as an ember-gold numeral, and is never a swapped digit:
- d8: the listón laid out as an 8;
- d7: the shadow of the sombrero and cane as a 7;
- d6: the breath-fog fingertip 6;
- d5: the devil's coin 5;
- d4: the carved 4, lit by four knocks;
- d3: the KM post 3, once the child's hand covers the 1;
- d2: the petal path 2 with the children's two lights;
- d1: the fire-and-petal path 1;
- d0: the torn calendar page 28.

3. THE ALTAR CREDIT. Every legend's title card names its altar, wing and faculty under the same seal (cempasúchil rosette between gold hairlines). Day 1 repeats the seven compact cards in altar order, using the wing grammar: Ala Sur zoclo terracotta, Ala Norte zoclo green.

4. CEMPASÚCHIL in every episode, tied to an altar. Where the treatment has none, add it as a set detail:
- d8: the stolen petal ring;
- d7: petals toward a far door;
- d6: petals on the sill;
- d5: the dry wreath on the roadside cross and the coin's engraved wreath;
- d4: dry petals on the panteón flagstones, then fresh ones on the niche ledge;
- d3: fresh flowers beside the plastic ones when the veladora is lit;
- d2: the river path;
- d1: the patio path;
- d0: the trail from the door.

5. ONE LIGHT IS LEFT. Each legend leaves or relights one veladora near the end, where the story allows:
- d3: the descanso candle;
- d4: the niche ledge;
- d2: the children's two lights;
- d6: the veladora and the six lights;
- d8: the kitchen veladora in memory.
Day 1 lights seven in the roll call; day 0 lights the home.

6. THE CRICKETS THAT STOP. The same cricket bed (leyendas_sfx.crickets, one seed family) cuts out before the threat in d8, d7, d6 and d0, and returns in d0's outro, so the audience learns the cue.

7. EYES AS SIGNATURE. Day 1 reads each legend in under a second through silhouette + eyes + motif:
- chaneques: gold pairs;
- nahual: gold eyeshine;
- brujas: eye-hollows in the fire orb;
- charro: ember almonds;
- momias: the empty socket;
- Niño: red points;
- La Llorona: cold hollows with a 2 px glint.

8. THE TECOLOTE AS WITNESS (optional easter egg). One owl silhouette or hoot per episode: the quiote (d5), the sill (d6), after the scare (d7). Suggested placements: over the river (d8), on a delineator (d3), on a cornice (d2), in the arcade (d1). Never bats.

9. THE LISTÓN. The red listón of d8 returns in d0 as the orange listón in the abuela's braids in the photo and in the granddaughter's braid, plus the girl's red thread bracelet. The series opens and closes on a tied ribbon.

10. THE LAST LINE BRIDGES TO THE COUNT:
- «Me buscaron ocho días.»
- «De noche, quién sabe.»
- «Ella también está contando.»
- «esperando al que sigue.»
- «Seguían gritando.»
- «Hasta esta noche.»
- «…sin saber que nunca se fueron.»
- «Mañana te esperan.»
- «Hoy, en cada altar, alguien vuelve a casa.»

11. THE SERIES 'RE'. Every score resolves toward D, the key of the Westhill outro, so each cut into the logo feels like coming home.

12. THE SPELL LIFTS. The engraving thins at the release (d8 dawn, d6 dawn, d3 coda) and dissolves on day 0 when love replaces legend.

## Lockup

STANDARD LOCKUP (days 8–2): LeyendaLockup with the kit defaults: top 470, bottom 1290, color #F26D3D, dateColor #E0BB8F, fecha '28 · 10'.
- FALTAN caps occupy ≈ y 491–561, DÍAS caps ≈ 1311–1381, the date ≈ 1430–1472.
- FALTAN and DÍAS are always cempasúchil, the path. d7's gold FALTAN and d6's bone/gold variant revert to the defaults.

NUMERAL SLOT:
- Rye digit 600 px tall (allowed 560–680), which is a font size of ≈ 790 px.
- Centered at x 540, y 925 (box ≈ 625–1225), ≥ 45 px clear of both cap lines.
- Drawn on the canvas (under Post) from the same Rye glyph: the story object itself becomes the glyph.

NUMERAL MATERIAL ('brasa'):
- Vertical gradient #FFF1C9 (0%) → #F5C242 (35%) → #F26D3D (100%), with a 2 px #A83A25 outer rim.
- Engraved hatch inside the stroke: a canvas pattern clipped to the glyph, 5 px period at 0.6 rad, #A83A25 at 0.3 alpha, lower 60% only.
- glow() halo r ≈ 0.6 × glyph height, #F26D3D at 0.35, pulsing ±6% at 0.8 Hz.
- 10–14 ember particles rising from the top edges.
- Post: CIFRA preset.

TIMING:
- T = the numeral is formed. FALTAN appears at T on the numeral hit, DÍAS at T+6, the date at T+18.
- The date must be fully in for ≥ 2.0 s before the end dip; the lockup is on screen ≥ 2.6 s in total.
- To reach this, extend d5 by 0.3 s, d4 by 0.5 s and d3 by 0.6 s. All stay ≤ 45 s.

END DIP (last 8 frames):
- The numeral cools from gold to terracotta and the embers lift.
- DOM opacity 1→0: wrap LeyendaLockup in a div, because Post fade and flash do not touch the DOM.
- Post fade 0→1 over the last 6 frames.
- The standard 4.5 s outro starts on #030100 and ignites the logo from below at frame 8, so the embers hand the fire to the logo.

DEVICE-LOCKED NUMERALS. When the world fixes the glyph (d7: shadow on the wall at y≈470–1040, top 296, bottom 1140; d6: breath-fog 6 at y 540–1120, top 380, bottom 1170):
- set top ≈ glyphTop − 150 and bottom = glyphBottom + 50–100, so the caps clear the glyph by 40–60 px;
- keep the default colors.

d4 NUMERAL: lift the carved 4 into the standard slot. Scale ≈ 1.6–1.8 with forward parallax over 18 frames (E.out), to ≥ 560 px. Fallback: 400 px with top 560 / bottom 1150.

DAY 1: FALTA / 1 / DÍA with the defaults.
- The 1 is the 680 px petal-and-fire path, with a clean Rye 1 at 35% over it.
- The seven altar lights return as a crown (Ala Norte) and footlights (Ala Sur).

DAY 0 (no LeyendaLockup):
- HOY in Rye 240, gold #F5C242 with #F26D3D glow, centered y≈820. Its letters lift off the calendar paper on a spring (ζ 0.85, 3-frame stagger): the same letter-by-letter DNA as the kit lockup. HOY is the only gold head word in the series (arrival, not path).
- '28 · 10' in Alike 88, sand, tracking 0.2em, centered y≈1080. The canvas Rye 28 cross-fades into it.
- Then «Hoy, en cada altar, / alguien vuelve a casa.» (Alike 64, bone, y 400).
- Then the special emotional outro: the CDMX valley with petal paths and motes forming the Westhill logo at the standard outro placement (centered y≈930, 880 px wide), held to the last frame.

COVER FRAME: use the held lockup frame, or the title card, as the Reel cover. All key text sits inside the 4:5 center crop (y 285–1635).

## Dibujo de personajes

NEVER 3D. Every character is 2D: silhouettes, partial views, shadows, glowing eyes, hands, cloth, hair. 3D-looking work is only for small props (the 2.5D coin, glass, candles).

SILHOUETTE FIRST:
- Draw the outline with smooth beziers (smoothPath) and test it filled flat black at half size: the pose must read.
- Value separation: a figure is ≥ 25% darker or lighter than what is behind it, never the same value.
- Dark figures get a rim. Pale figures (La Llorona, the Niño) get an interior shadow toward cold grey #6F7F86 / #5E7F7A.

PROPORTIONS:
- Adults: 7–7.5 heads (La Llorona 7.5, tall and slender, hem 3 px above the stones, feet never shown).
- Elderly: 6.5–7 heads with a 6–10° forward stoop (don Fermín, the abuelas).
- Child of 5–6: ≈ 5.5 heads, thin limbs, oversized clothes (the Niño).
- Chaneques: ≈ 60 cm, head a third of the body, palm-hat brim, long fingers.
- The horse: 1.3× real size, seen only in parts.

HANDS:
- Palm + four fingers + thumb, drawn as tapered capsules with rounded caps; 3 phalanges per finger, each rotating at its joint.
- Young hands: smooth, warm sand-to-brown gradient.
- Old hands: hatch strokes clipped per segment, stipple spots, a 5 Hz / 0.8 px tremor.
- Fear tremor: 8–9 Hz, 1.5–2 px.

MATERIAL (kit paintShape):
- Body gradient (vgrad/rgrad).
- Inner shadow on the side away from the key, 8–20% of the form's width.
- Rim from the motivated source: 2–3 px for figures under 400 px tall, 6–14 px for near or hero figures over 800 px.
- Texture alpha ≤ 0.25 (weave, skin, bark). Halo only for emissive forms.
- Rim colors: moon #9FC3C4 (#9FD3D6 for La Llorona); candle and lantern #F5C242; fire #F26D3D; tungsten bulb #F5C242→#F26D3D; dawn #E0BB8F.
- Flat black cutouts are banned: even the Charro's #0B0704 body has an inner shadow and two rims (moon and lantern).

SHADOWS:
- Every figure touching a surface gets a contact shadow, drawn before the figure.
- Cast shadows come from the motivated light. Penumbra grows with distance (blurred() 3–14 px) and agrees with the light's position (d7 bulb, d0 veladoras, d5 moon behind the traveller, d1 candle behind the camera).
- Shadows can be characters (the nahual's own rig, the abuela's shadow in d0). They obey the projection until the scripted moment they break it.

FACES:
- Only stylized engraving faces, and only where a treatment calls for one:
  - jump-scare faces: chaneque, coyote snarl, the witch in the mirror, the mummy, the Niño, La Llorona;
  - portraits: the d6 abuela's eye, the d0 photo.
- Build them from 30–60 hand-authored bezier strokes plus baked hatch at the same 5 px period and brown ink as the post hatch, so baked and post engraving read as one burin.
- Eyes are emissive points, or hollow sockets with a 2 px glint.
- No teeth, except the mummy's six bone teeth (a nod to Odontología). No wounds, decay, blood, blue lips or gore.
- Scare faces stay on screen ≤ 0.7 s.
- Living heroes (the narrators, the granddaughter) never get facial features: backs, hands and rim-lit cheek lines only.

EYES (series vocabulary; the brightest small thing in frame thanks to bloomThr). glow() stacks with a tiny core:
- gold: core #F5C242, rim #F26D3D (chaneques, nahual, coyote eyeshine);
- ember almonds: core #FFF1C9, halo #F26D3D, outer #A83A25 (Charro);
- red points (the Niño only);
- cold hollows #0B0705 with a 2 px #9FD3D6 glint (La Llorona);
- eye-like hollows inside the fire orb (brujas).

CLOTH AND HAIR:
- Veils, rebozos, sarapes, dresses and camisones: simCloth pinned at the crown, shoulders or waist.
- Hair, fringes, manes, tails, rosaries and listones: simChain.
- Every visible fabric keeps moving a little (gust), even when the body is frozen. A frozen body with living cloth is the series' uncanny signature.

FIGURES IN DAYS 1 AND 0:
- Day 1 reuses each episode's character design, simplified (same silhouette, palette, eyes and motion vocabulary), so all seven read instantly.
- Day 0 shows no creature: the abuela exists only as a coherent force field, and as a shadow only when she touches the living.

## Sonido

LOUDNESS:
- Master through sfx.master to −14 LUFS integrated, true peak ≤ −1 dBTP, 48 kHz.
- Before a scare, beds sit around −30 LUFS short-term. The main scare is 6–10 dB above its surroundings before mastering.
- d0's slam is 4 dB below the legend scares. d5's jump stays 2 dB under its ride peak.
- Scares and booms carry energy at 80–200 Hz, not only sub-bass, so they land on phone speakers. Tame formant shrieks at 3–5 kHz.

SILENCE:
- Pre-scare silences are true digital zero: 0.25–1.2 s, and ≥ 0.6 s before the main jump scare.
- They must survive the limiter, fades and dither; verify by reading the samples.
- Pulling the bed away (crickets stop, dogs stop mid-bark) is the series' dread cue.

TONAL HOME = D. The standard outro is in D major (strings D3–A3–D4–F♯4, marimba D5–F♯5–A5–D6, bells D6 and A6), so every score resolves toward D:
- d8: D minor.
- d7: D minor pentatonic; the ocarina goes A→D on the 7.
- d6: D (major hum, minor attacks, D under the logo).
- d5: A harmonic minor, the dominant of D. It ends on an unresolved E that the outro resolves.
- d4: D. The withheld last D may land softly on the outro's ignition.
- d3: D minor → D major.
- d1: D Phrygian → D major.
- d0: D major.
- d2 keeps E minor → E major for La Llorona's son. Its E-major tail decays below −40 dBFS before the outro begins.

SONG MAP. Each public-domain melody belongs to one episode only. Melody only, in our own arrangement, transcribed from a folk or public-domain edition, never from a recording, never sung with words.
- d2: the son 'La Llorona'.
- d4: 'Las Golondrinas' (Serradell, 1862).
- d0: 'Cielito Lindo' (1882), the abuela's song; «canta y no llores» is d0's payoff.
- d6: 'A la roro niño' (anonymous).
- d3: 'Señora Santa Ana' (anonymous).
- d8 uses its treatment's own fallback, an original D-minor cradle melody (A4–F4–A4–F4 | G4–F4–E4–D4), so 'A la roro niño' stays with d6's cradle.
- d5 replaces 'Cielito Lindo' with an original whistled nine-note charro motif in A harmonic minor: A4–C5–E5–D5–C5–B4–G♯4–B4–E4. It drives the nine silver-button harp harmonics and the false serenade in A major, and the requinto ends on E. The devil must not whistle the song that brings the abuela home on day 0.
- d7's ocarina nocturne (A–G–F–D) and d1's 'Falta uno' are original.

DAY 1 LEITMOTIFS. Each awakening is sealed by the teponaztli A–D knock plus ≤ 2 s of that legend's motif:
- brujas: 'A la roro' on choir, plus the scissors' ring;
- nahual: the ocarina A–G–F–D;
- charro: the last three whistle notes;
- Niño: a music-box D6 and 'Señora Santa Ana';
- momias: a bell toll and 'Las Golondrinas' on harp;
- La Llorona: the son on detuned music box;
- chaneques: the falling-third call and a giggle.

SERIES INSTRUMENTS:
- Karplus-Strong requinto and nylon guitar; harp; formant choirs and hums.
- Teponaztli (two tones, A–D); huéhuetl (sine drop 90→55 Hz plus skin noise); clay ocarina or barro whistle.
- Music box: detuned for dread, in tune for tenderness.
- Bowed glass; low strings (sul ponticello clusters, sul tasto cello); church bell (doble de difuntos).
- The silbato de la muerte is reserved for the animal and forest spirits (d7, d8).
- No modern synth pads, EDM risers or trailer horns; braams are built as low-string clusters.

TITLE STING (identical on all seven legend titles):
- a 0.25 s reverse copal-air swell into a huéhuetl hit (90→55 Hz, 1.2 s decay);
- the teponaztli A–D two-tone knock;
- a low 'oo' choir on the episode tonic at −24 dB;
- 6 dB under the main scare.

SCARE STINGER ANATOMY:
1. True silence.
2. On the exact frame: a sub drop (28–55 Hz) + a dissonant low-string cluster with body at 80–200 Hz + the legend's own voice:
   - death whistle (nahual, chaneques);
   - the dry, full-band lament (La Llorona);
   - a formant shriek (bruja);
   - the horse's scream (Charro);
   - a formant scream (mummy);
   - a wet child's gasp (KM 31).
3. A 0.3–1.5 s near-silent aftershock: 8 kHz tinnitus, one drip, an owl.

SPACE:
- Far = low-passed, wet, mono, quiet (laments around −24 dB).
- Close = dry, full-band, wide.
- Behind = centered, with a high-frequency roll-off and a few ms of delay.
- 'Close and dry means danger' is shared by d8's call, d3's hum, d2's lament and d5's spur.

BEDS AND FOLEY:
- An ambience bed is always present except in deliberate silences: river, wind, crickets and distant dogs; fire; room tone; AM radio (d3); the coffin-muffled world (d4, where each brick lowers the low-pass).
- Foley follows motion: every cut lands on a step, knock, hoof, drip or creak.

VOICES:
- Formant synthesis only (leyendas_sfx wail, whisper, giggle, sigh, glottal hums). Never intelligible words, never TTS.
- Abuelas hum on 'mm' (f0 ≈ 220 Hz, breathy, 4.8–5 Hz vibrato). Children hum nasally around 250 / 2200 Hz.

LOCKUP AND OUTRO HANDOFF:
- The episode's own number riser and hit; FALTAN lands on the hit.
- One harp pluck on the tonic when '28 · 10' appears, plus a soft music-box tonic two octaves up at −24 dB, then a 0.3–0.5 s tail.
- Keep the outro's opening clear: its noise burst at frame 5 and the 110→55 Hz thump at frame 8. A single soft tonic may coincide with the ignition.
- make_cap_audio applies the final 6-frame fade.
- Day 0: STANDARD_OUTRO = False. It scores its own outro, ending D add9 → D with both hums in thirds and the crickets returning.
