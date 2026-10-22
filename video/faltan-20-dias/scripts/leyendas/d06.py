"""Partitura y diseño sonoro del día 6 · «Lo que vio el espejo» · Las Brujas de Fuego (en producción).

Sincronía: los frames de EV son copia de src/leyendas/d06/timeline.ts (30 fps). Cues completos en el plan de la etapa SCORE.
"""
import numpy as np

import leyendas_sfx as L  # noqa: F401
import music as M  # noqa: F401
import sfx  # noqa: F401
from sfx import SR, midi  # noqa: F401

FPS = 30
LEN = 1350  # frames del episodio (igual que EP06_LEN en src/leyendas/d06_brujas.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro

# momentos clave (frames) — copia de d06/timeline.ts
EV = dict(
    breathHook=3, wipe1=(18, 38), star=(40, 60), blink=51, touch=69, walk=(84, 132), push=138,
    scissorsLift=192, scissorsOpen=207, tock=228, sit=(236, 262), rockStart=270,
    shadowArms=(288, 324), fray=(324, 357), collapse=360, ignite=366,
    orb2=438, orb3=453, windowsDark=(444, 504), dip=507, nods=(528, 552, 570), handSlide=(570, 594),
    humBreak=582, cricketsStop=609, owlLand=660, owlSnap=676, underlight=687, owlLaunch=690,
    orbRise=(702, 732), crossFull=(714, 722), flinch=747, orbDrop=(762, 777), knocks=(798, 816),
    selfSwing=810, whimper=849, feed=(864, 930), whimper2=912, gasp=936, fill=(942, 954), tearOff=952,
    whip=(958, 968), faceOpen=(978, 990), morph=(990, 1011), freeze=1014, zero=(1014, 1023),
    lunge=(1021, 1026), slam=1026, drag=(1032, 1050), exit=(1050, 1077), rehang=1086,
    fingersOut=(1089, 1098), grasp=1110, lapse=(1122, 1152), straighten=(1155, 1167), wipe2=(1155, 1170),
    breath2=1173, ember6=1206, fogGone=(1244, 1259), night=(1244, 1268), lockup=1246, sixOn=1281,
    sixOff=1319, endDip=LEN - 8,
)


def fr(f):
    return f / FPS


def hum(notes, at, bus, gain=0.16, f0_mul=1.0, sag=0.0, cut=None):
    """Arrullo sin palabras (voz de mujer joven, vocal «m/u»): lista de (midi, beats) a ~60 BPM en 3/4."""
    t = at
    for k, (m, b) in enumerate(notes):
        d = b * 1.0
        if cut is not None and t >= cut:
            break
        f = midi(m) * f0_mul * (1 - sag * k / max(1, len(notes)))
        v = L.formants(L.glottal(f, d + 0.25, seed=k), 'u') * M.adsr(int((d + 0.25) * SR), 0.12, 0.2, 0.8, 0.35)
        bus.place(v, t, gain, -0.15, wet=0.5)
        t += d
    return t


# arrullo original en re mayor, 3/4, célula de sexta ascendente (distinto de «A la roro» y «Señora Santa Ana»)
CUNA = [(62, 1), (71, 1), (69, 1), (66, 2), (67, 1), (64, 1), (66, 1), (62, 2), (0, 1),
        (62, 1), (71, 1), (69, 1), (74, 2), (71, 1), (69, 1), (66, 1), (62, 3)]


def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    T = fr(LEN)
    E = {k: (v if not isinstance(v, (tuple, list)) else v) for k, v in EV.items()}
    f = fr
    # camas: viento bajo todo el episodio, grillos hasta que la noche se queda quieta
    bus.place2(sfx.wind_bed(int(T * SR), 41), 0, 0.10, wet=0.3)
    cr = L.crickets(f(E['cricketsStop']) + 0.4, density=0.8)
    cr[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
    bus.place(cr, 0, 0.07, 0.2, wet=0.3)
    # gancho: aliento sobre el vidrio, limpieza con el rebozo, toque
    bus.place(sfx.air(3, 1.2, (300, 800), (800, 2400)), f(E['breathHook']), 0.30, 0, wet=0.3)
    bus.place(L.muffle(sfx.rustle(5, 0.8), 0.3), f(E['wipe1'][0]), 0.35, 0.1)
    bus.place(sfx.bell(midi(86), 1.6), f(E['blink']), 0.05, 0.2, wet=0.8)
    bus.place(L.thud(1) * 0.5, f(E['touch']), 0.25)
    # la madre: pasos, empuja la cuna, tijeras abiertas en cruz, «toc» en el alféizar, se sienta
    for k in range(5):
        bus.place(L.thud(10 + k), f(E['walk'][0]) + k * 0.33, 0.12, -0.2 + k * 0.08)
    bus.place(L.creak(0.8, 2, 300), f(E['push']), 0.22, 0.1, wet=0.2)
    bus.place(L.glass_rattle(0.3, 3) * 0.6, f(E['scissorsOpen']), 0.18, 0.3, wet=0.3)
    bus.place(sfx.wood(1800), f(E['tock']), 0.30, 0.3, wet=0.3)
    bus.place(L.creak(1.2, 4, 260), f(E['sit'][0]), 0.18, -0.2)
    for k in range(6):
        bus.place(L.creak(0.6, 20 + k, 240 + 10 * (k % 2)), f(E['rockStart']) + k * 1.9, 0.07, -0.25)
    # el arrullo, que se arrastra y se rompe cuando la madre cabecea
    hum(CUNA, f(E['rockStart']) + 0.4, bus, 0.15, cut=f(E['humBreak']), sag=0.03)
    # el fogón en el cerro: la sombra se deshace, ignición y título
    bus.place(sfx.fire(f(E['ignite']) - f(E['shadowArms'][0]) + 2, 6) * np.linspace(0.2, 1, int((f(E['ignite']) - f(E['shadowArms'][0]) + 2) * SR)), f(E['shadowArms'][0]), 0.10, -0.4, wet=0.4)
    bus.place(L.reverse_swell(L.fire_whoosh(1.0, 7), 1.0), f(E['ignite']) - 1.0, 0.35, 0, wet=0.3)
    bus.place(L.fire_whoosh(1.4, 8), f(E['ignite']), 0.55, 0, wet=0.4)
    bus.place(sfx.boom(9), f(E['ignite']) + 0.05, 0.45, wet=0.3)
    bus.place(L.drone_dark(f(E['zero'][0]) - f(E['ignite']), root=38, seed=2), f(E['ignite']), 0.13, wet=0.5)
    # vuelo sobre los techos: orbes que pasan y ventanas que se apagan
    for k, at in enumerate((E['orb2'], E['orb3'])):
        bus.place(L.fire_whoosh(1.1, 11 + k), f(at), 0.30, (-0.5, 0.5)[k], wet=0.4)
    for k in range(5):
        bus.place(sfx.wood(900 + 60 * k) * 0.6, f(E['windowsDark'][0]) + k * 0.4, 0.10, -0.6 + 0.3 * k, wet=0.5)
    # mariposa negra contra el vidrio: golpes de papel y zumbido de alas
    for k, dt in enumerate((0.0, 0.25)):
        bus.place(sfx.thump(900, 400, 0.08, 0.03), f(E['owlLand']) + dt, 0.30, 0.1)
    bz = sfx.bp(sfx.noise(int(1.0 * SR), 33), 120, 900) * (0.6 + 0.4 * np.sin(np.arange(int(1.0 * SR)) / SR * 2 * np.pi * 8))
    bus.place(bz, f(E['owlLand']), 0.10, 0.1)
    bus.place(sfx.air(4, 0.5, (400, 1000), (1000, 3000)), f(E['owlLaunch']), 0.25, -0.4)
    # el orbe sube junto a la ventana, la sombra de las tijeras en cruz lo detiene
    bus.place(L.riser(f(E['flinch']) - f(E['orbRise'][0]), seed=3, root=50), f(E['orbRise'][0]), 0.25, wet=0.4)
    bus.place(sfx.fire(2.0, 12), f(E['orbRise'][0]) + 0.3, 0.22, 0.2, wet=0.3)
    bus.place(sfx.bell(midi(81), 2.2), f(E['crossFull'][0]), 0.10, 0.3, wet=0.8)
    bus.place(L.stinger(4, 1.6), f(E['flinch']), 0.35, wet=0.4)
    bus.place(L.fire_whoosh(0.9, 13), f(E['orbDrop'][0]), 0.30, 0.5)
    # el techo: golpes sobre el carrizo, el espejo se mece solo, la niña gime
    for k, at in enumerate(E['knocks']):
        bus.place(L.muffle(L.thud(30 + k), 0.4), f(at), 0.45, 0, wet=0.3)
    bus.place(L.thud(33), f(E['knocks'][-1]) + 0.3, 0.35)
    bus.place(L.creak(1.4, 6, 520), f(E['selfSwing']), 0.15, 0, wet=0.3)
    for k, at in enumerate((E['whimper'], E['whimper2'])):
        bus.place(L.wail(0.7, 760 + 40 * k, seed=40 + k, seq=('e', 'a', 'a'), drop=0.25), f(at), 0.08, 0.1, wet=0.4)
    # alimentarse: susurros de lumbre y el pulso de la niña que se apaga
    bus.place(L.whisper(f(E['feed'][1]) - f(E['feed'][0]), seed=8, bright=0.7), f(E['feed'][0]), 0.10, -0.3, wet=0.6)
    bus.place(L.heartbeat_seq(6, 96, seed=9), f(E['feed'][0]), 0.18)
    # despierta: grito ahogado, arranca el espejo del clavo, latigazo
    bus.place(sfx.air(5, 0.6, (500, 1500), (1500, 4000)), f(E['gasp']), 0.30, -0.2)
    bus.place(L.glass_rattle(0.6, 14), f(E['tearOff']), 0.40, 0, wet=0.2)
    bus.place(sfx.air(6, 0.4, (300, 900), (900, 3000)), f(E['whip'][0]), 0.40, 0.3)
    # el rostro de la bruja; silencio digital antes del golpe
    bus.place(L.riser(f(E['zero'][0]) - f(E['faceOpen'][0]), seed=5, root=46), f(E['faceOpen'][0]), 0.30, wet=0.3)
    bus.place(sfx.fire(f(E['zero'][0]) - f(E['faceOpen'][0]), 15), f(E['faceOpen'][0]), 0.30, wet=0.3)
    # golpe: mano de fuego contra el vidrio, grieta y hollín
    bus.place(L.stinger(6, 2.8), f(E['slam']), 0.85, wet=0.4)
    bus.place(sfx.boom(16), f(E['slam']), 0.70, wet=0.3)
    bus.place(L.glass_rattle(1.2, 17), f(E['slam']) + 0.02, 0.55, 0.1, wet=0.3)
    bus.place(L.sub_drop(1.6, 18), f(E['slam']), 0.5)
    bus.place(L.fire_whoosh(1.4, 19), f(E['exit'][0]), 0.40, 0.6, wet=0.5)
    bus.place(L.creak(0.6, 7, 300), f(E['rehang']), 0.20)
    # amanecer: arpa en re mayor, cálida, y el aliento que revela el 6
    t0 = f(E['lapse'][0])
    for k, (m, d) in enumerate(CUNA[:9]):
        if m:
            bus.place(M.pluck(midi(m), 2.4, 0.5, 0.997, 0.8, seed=k), t0 + k * 0.62, 0.22, 0.15, wet=0.6)
    bus.place(M.choir([50, 57, 62, 66], f(E['lockup']) - t0, 'a', 0.6, seed=3, attack=1.5), t0, 0.07, wet=0.8)
    bus.place(sfx.air(7, 1.6, (300, 800), (800, 2400)), f(E['breath2']), 0.32, 0, wet=0.3)
    bus.place(sfx.bell(midi(74), 3.0), f(E['ember6']), 0.12, 0, wet=0.8)
    # noche otra vez: seis lumbres en el cerro, las tijeras se cierran solas
    roar = sfx.fire(T - f(E['lockup']), 20)
    roar *= np.linspace(0.0, 1.0, len(roar)) ** 1.5
    bus.place(sfx.lp(roar, 600), f(E['lockup']), 0.5, wet=0.4)
    bus.place(L.music_box_detuned([74, 71, 69, 66], 0.45, seed=4, detune=0.03), f(E['sixOn']), 0.10, 0.2, wet=0.6)
    bus.place(L.glass_rattle(0.4, 21) * 0.5, f(E['sixOff']), 0.18, 0.2, wet=0.4)
    bus.place(L.drone_dark(T - f(E['lockup']), root=38, seed=22), f(E['lockup']), 0.10, wet=0.5)
    return T
