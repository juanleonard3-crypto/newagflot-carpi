# Fundamentos para la Construcción de Prompt

Unidad curricular del Trayecto Técnico Profesional Inicial "Auxiliar en Inteligencia Artificial", ISFD y T "República Federal de Alemania", El Colorado, Formosa. Docente: José Luis Méndez. Ciclo lectivo 2026.

Idea central: un prompt eficaz no es acumular palabras, es una estructura de información donde cada elemento cumple una función. La calidad del prompt es su adecuación al propósito y al resultado. No hay una fórmula universal.

## Núcleo Temático I: comunicación con sistemas de IA
- Un sistema conversacional genera una respuesta nueva a partir de la instrucción; no es un buscador, que devuelve resultados existentes.
- Prompt: instrucción, pregunta, pedido o conjunto de indicaciones que se da a la IA. La instrucción es la acción concreta que se pide, con verbos de acción (explicá, resumí, compará, clasificá, reformulá, generá, analizá, corregí). Cada verbo orienta un tipo de respuesta.
- Un prompt gramaticalmente correcto puede ser insuficiente si deja demasiado para interpretar. La utilidad depende de aportar contexto, definir el resultado esperado y evaluar críticamente.

## Núcleo Temático II: construcción estructurada
Componentes iniciales: propósito, contexto, destinatario y tarea.
- Propósito: para qué recurro a la IA. No es lo mismo que la tarea: "redactar un correo" es tarea; "informar un cambio de fecha sin generar confusión" es propósito.
- Contexto: información que ayuda a interpretar la tarea en una situación concreta. Relevante y suficiente. No asumir que la IA conoce lo que solo está en la cabeza del usuario.
- Destinatario: para quién se genera la respuesta (nivel, lenguaje, tono).
- Tarea: acción concreta con verbo claro.

Clase del 28/09/2026: datos, ejemplos, preguntas, estructura y descomposición.
- Datos: instrucciones (qué hacer), contexto (explica la situación), datos de trabajo (material concreto sobre el que opera la IA). Tres preguntas para decidir qué datos incluir: ¿cambia o condiciona el resultado?, ¿la IA podría resolver bien sin este dato?, ¿es confiable, actual y pertinente? Conviene etiquetar bloques ("Datos disponibles:", "Condiciones:", "Formato esperado:"). Cuando faltan datos: señalarlo antes de responder, no inventar, o hacer hasta tres preguntas de aclaración.
- Ejemplos: zero-shot (sin ejemplos), one-shot (un ejemplo), few-shot (varios ejemplos que muestran un patrón). Sirven para formato específico, criterios difíciles de definir, estilo homogéneo o matices. Los ejemplos no son neutrales: deben ser coherentes, representativos y con formato consistente; no agregarlos solo para alargar.
- Preguntas cerradas (sí/no, selección, clasificación; sirven para verificar y comparar, pero pueden ocultar matices) y abiertas (explorar, analizar, proponer; pueden dispersarse si son demasiado amplias). Conviene combinarlas.
- Estructura orientativa: objetivo → contexto → tarea → condiciones → formato esperado. No es fórmula obligatoria; permite revisar el prompt por partes. Usar encabezados, listas, comillas triples o etiquetas para separar instrucciones y material de referencia.
- Descomposición (prompt chaining): dividir en subtareas verificables, donde la salida de un paso es la entrada del siguiente. Conviene dividir cuando hay varios verbos que son tareas distintas, una tarea depende de otra, hay que revisar datos antes de la producción final o se quieren reutilizar resultados intermedios. Si la tarea es simple, estable y verificable, un solo prompt alcanza.
- Errores frecuentes: datos sin instrucción, ejemplos contradictorios, preguntar muy abierto cuando se necesita verificar, pedir demasiado en una pasada, confundir "más largo" con "mejor", no definir qué hacer cuando falta información, no especificar el formato.
- El 05/10 se realiza el autoevaluativo del Núcleo II y arranca el Núcleo III.

## Núcleo Temático III: evaluación, iteración y diseño aplicado
Ciclo: prompt → resultado → evaluación → detección de problemas → reformulación → nueva respuesta. La IA genera; la persona evalúa. Respuesta generada no es necesariamente respuesta correcta: puede estar bien redactada y convincente y aun así ser incompleta, imprecisa, contradictoria o incorrecta, porque la IA generativa produce contenido por patrones y probabilidades.

Criterios de evaluación: pertinencia, completitud, precisión, coherencia, cumplimiento de condiciones (extensión, formato, tono, destinatario, restricciones) y verificabilidad. Se evalúa según el propósito.

Información faltante: en el prompt (agregar datos o pedir aclaraciones antes de responder) o en la respuesta (el dato estaba en el prompt pero la IA lo omitió: reformular y reforzar qué elementos son obligatorios). Condición útil: "Si falta algún dato necesario, indicá qué información necesitás antes de generar la respuesta. No inventes información." Reduce, no elimina, los errores.

Inconsistencias: internas, con los datos proporcionados, numéricas, temporales, de formato, de tono o destinatario. Ejemplo: presupuesto máximo $150.000 y tabla con $50.000 + $60.000 + $55.000 = $165.000: se viola una restricción aunque el formato sea correcto. Al corregir, no pedir solo "Corregí": señalar el problema con precisión y pedir revisar usando únicamente los datos originales.

Alucinaciones: datos, fuentes, citas, libros, DOI o estadísticas inventados con apariencia convincente. Confianza en el lenguaje no equivale a confiabilidad. Señales de alerta: datos muy específicos que no diste, estadísticas sin fuente, citas textuales sin referencia, enlaces sospechosos, conclusiones demasiado categóricas. Una señal de alerta no prueba falsedad, obliga a verificar con una fuente adecuada. Pedir fuentes no garantiza que sean reales: hay que comprobar que existan y contengan la información.

Grounding: darle a la IA la fuente y pedir "Utilizá exclusivamente el siguiente texto. Si la respuesta no aparece, indicá 'información no disponible'". Reduce, no elimina, los errores.

Evaluar: comparar la respuesta con el prompt (tabla sí/no por objetivo, destinatario, datos obligatorios, restricciones, formato y tono). Definir criterios antes de generar reduce la subjetividad. Un resultado útil no tiene que ser perfecto, pero hay que poder justificar por qué sirve. No delegar toda la evaluación a otra IA.

Reformulación: modificar la instrucción con un propósito concreto a partir del análisis del resultado. Dirigida (cambia lo identificado como problema) vs. indiscriminada (agrega cosas sin analizar qué falló). Respuesta general: agregar contexto, alcance o criterios. Falta un dato: incorporarlo y exigirlo. Extensión inadecuada: definir palabras o secciones. Lenguaje inadecuado: precisar destinatario o nivel. La IA hace supuestos: pedir aclaraciones.

Iteración: repetición controlada del ciclo. Cambiar una variable por vez facilita saber qué cambio mejoró. Comparar versiones con criterios (adecuación al objetivo, completitud, precisión, cumplimiento de restricciones, consistencia, utilidad), no por cuál "suena mejor". Una versión no es mejor por tener más texto. Ejemplo: V1 "Avisá que la clase será virtual", V2 con destinatario y tono formal, V3 con indicación operativa (ingresar al Aula Virtual en el horario habitual).

Registro de pruebas: anotar versión exacta del prompt, cambio respecto de la anterior, resultado, problema que se quería corregir, criterios y decisión (conservar, reformular o descartar). Errores al iterar: cambiar demasiado a la vez, no definir criterio, elegir por extensión, no guardar versiones, seguir iterando cuando ya cumple. Mejorar un prompt no es agregar palabras, es hacer cambios justificados y comprobar sus efectos.

Diseño aplicado: partir de la situación real, no de la herramienta. Componentes: situación, contexto, tarea, datos, restricciones, tipo de salida, criterios de calidad. Ámbitos: educativo, comercial (canal como WhatsApp, Instagram o cartel), productivo (no completar datos inexistentes), institucional (fidelidad a los datos, delimitar la fuente), comunitario (El Colorado y Formosa solo cuando el contexto local modifica el resultado). Por tipo de tarea: texto (destinatario, tono, extensión, estructura, datos obligatorios), imagen (sujeto, composición, encuadre, iluminación, estilo, formato), resolución de problemas (datos, restricciones, criterios, supuestos), apoyo técnico (entorno, síntomas, pruebas previas, seguridad, pasos numerados y verificación).
