# Pendientes por validar con el Comité Organizador

Los materiales usan **exactamente** la información que mandó la Facultad. Nadie reescribió ningún título,
nombre ni horario. Llegaron tres archivos y no coinciden entre sí en algunos puntos:

- `Programa_Westhill_Triptico.docx` (modificado el 06/10/2026 a las 21:16, el más reciente y el único con nombres completos)
- `Programa_Westhill.xlsx` y `Programa_Westhill_1.xlsx` (06/10/2026, 20:53–20:54)

**Criterio aplicado:** el tríptico es la fuente principal. El Excel solo se usó cuando el tríptico no traía el dato.
Cada caso está abajo para que el Comité lo confirme.

## 1. Diferencias entre archivos (necesitan confirmación)

| # | Dónde | Tríptico (.docx) | Excel (.xlsx) | Qué se aplicó |
|---|-------|------------------|---------------|---------------|
| 1 | **Jueves 22, 14:00–15:00** | La ponencia «Importancia del tamiz neonatal como factor preventivo de enfermedades metabólicas congénitas» (Dr. Carlos Cortés Reyes) aparece **dos veces** (14:00–14:30 y 14:30–15:00), y la jornada termina a las **15:00** | Aparece una sola vez (14:00–14:30) y la jornada termina a las **14:30** | **Una sola vez, 14:00–14:30, fin de jornada 14:30** (parece un renglón duplicado por error). Si la ponencia dura una hora, hay que cambiarla a 14:00–15:00 |
| 2 | **Viernes 23, 08:00–08:30** | «Urgencias médico quirúrgicas / Toxicología Clínica», Dr. José Antonio Bandillo Torres | Solo dice «Antonio Chimal» en la columna de actividad, sin ponente | **Lo del tríptico.** Confirmar el nombre del ponente (¿Bandillo Torres o Chimal?) |
| 3 | **Jueves 22, 13:00 · AMIR** | Dr. Jorge Macías Garza | «Dra. Iris y Dr. Jorge Macías» | **Lo del tríptico** (solo el Dr. Jorge Macías Garza). Si la Dra. Iris también participa, necesitamos su nombre completo para su flyer y su constancia |
| 4 | **Jueves 22, 11:30 · Anemias y leucemias** | Dra. Guadalupe Rodríguez | «Dra. Guadalupe Rodríguez · Jefa de Hematología, La Raza» | Nombre del tríptico, más el cargo del Excel, que aparece en el tríptico, las pantallas y su flyer (no en la constancia) |
| 5 | Nombres cortos en el Excel | Dr. Alan Maximiliano de los Santos Bernal · Dr. César A. Escalante Campillo · Dr. Asisclo de Jesús Villagómez Ortíz | Dr. Alan · Dr. César Escalante · Dr. Asisclo | Nombres completos del tríptico |

## 2. Nombres que podrían tener un error de escritura (NO se cambiaron)

Los nombres propios se dejaron tal como llegaron. Antes de imprimir las constancias, confirmar con cada ponente:

- **Dr. Francisco Gutierez Delgado**: ¿«Gutiérrez»?
- **Dr. Luis Armano Gervacio Blanco**: ¿«Armando»?
- **Dr. Alejandro Ortíz García-Robles** y **Dr. Asisclo de Jesús Villagómez Ortíz**: el apellido suele escribirse «Ortiz», sin acento
- **Dr. Oscar Alejandro Romo Pérez** (¿«Óscar»?) y **Dr. Iker Paris García Pérez** (¿«París»?): solo si el ponente lo escribe así

## 3. Correcciones de ortografía aplicadas

| Original (tríptico) | Corregido |
|---|---|
| Urgencias médico quirúrgicas /Toxicoligia Clinica | Urgencias médico quirúrgicas / Toxicología Clínica |

No hubo otras correcciones. `scripts/verificar_datos.py` compara cada título, nombre y horario contra los archivos originales; la única diferencia que reporta es esta.

## 4. Información que falta para cerrar los materiales

- **Firmantes de las constancias**: nombre y cargo de las dos personas que firman (hoy dicen «Nombre y firma / Cargo»).
- **Lista de participantes** para las constancias de asistencia (llenar `datos/participantes.csv`, una persona por renglón).
- **Fotos de los ponentes** (opcional): si las mandan, se colocan en los flyers individuales; hoy cada flyer usa un ícono del tema.
- Si existe: **sala o auditorio**, **liga o QR de registro**, **logos de patrocinadores** (para «Actividad de patrocinadores»).
- **Impresión del tríptico**: el archivo es A4 horizontal y no tiene sangrado. Si la imprenta pide 3 mm de sangrado, se agrega.

## 5. Textos que agregamos (no venían en el material)

Son solo de diseño o de formato; el Comité puede pedir que se cambien:

- **Tríptico**: «Ponentes» (índice de ponentes por día), «Organiza», «DÍA 1 / DÍA 2 / DÍA 3» y la sede «Instalaciones de la Universidad Westhill» (tomada del correo).
- **Flyers**: «Ponencia», «Ponente», «Programa · Día N», y en la Mesa redonda «Actividad destacada» / «Participa».
- **Constancias**: la redacción completa.
  - Participantes: «La Facultad de Medicina de la Universidad Westhill otorga la presente CONSTANCIA a … por su asistencia al Westhill Medical Leadership Summit 2026: «Fronteras de la Medicina…», celebrado los días 21, 22 y 23 de octubre de 2026 en las instalaciones de la Universidad Westhill.»
  - Ponentes: «… por su valiosa participación como ponente con la conferencia «[título]», impartida el [día y fecha] de 2026 en el Westhill Medical Leadership Summit 2026: «Fronteras de la Medicina…».»
- **Plantilla de diapositivas**: textos de ejemplo («Título de la diapositiva», «Idea clave», «Conclusiones», etc.) y la diapositiva de cierre «¡Gracias!».
