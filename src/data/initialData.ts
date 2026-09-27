import { ModulePage, User, StudentSubmission } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-teacher-1',
    username: 'profesor',
    password: 'profe123',
    name: 'Prof. Daniel Alarcón',
    role: 'teacher',
    gradeGroup: 'Docente Titular',
  },
  {
    id: 'user-student-1',
    username: 'alumno1',
    password: 'alumno123',
    name: 'Sofía Martínez',
    role: 'student',
    gradeGroup: '3º ESO - Grupo A',
  },
  {
    id: 'user-student-2',
    username: 'alumno2',
    password: 'alumno123',
    name: 'Mateo Gómez',
    role: 'student',
    gradeGroup: '3º ESO - Grupo A',
  },
  {
    id: 'user-student-3',
    username: 'alumno3',
    password: 'alumno123',
    name: 'Lucía Fernández',
    role: 'student',
    gradeGroup: '3º ESO - Grupo B',
  },
];

export const INITIAL_MODULES: ModulePage[] = [
  {
    id: 'mod-mates-1',
    title: 'Desafíos Matemáticos: Álgebra y Lógica Operativa',
    slug: 'desafios-matematicos-algebra',
    subject: 'Matemáticas',
    description: 'Ejercicios interactivos sobre jerarquía de operaciones, resolución de ecuaciones de primer grado y cálculo de probabilidades.',
    estimatedMinutes: 20,
    difficulty: 'intermedio',
    isPublished: true,
    author: 'Prof. Daniel Alarcón',
    createdAt: '2026-09-20',
    theoryMarkdown: `### 📌 Fundamentos Teóricos Clave

1. **Jerarquía de las Operaciones (PEMDAS)**:
   - Paréntesis y corchetes primero.
   - Exponentes y potencias.
   - Multiplicaciones y Divisiones (de izquierda a derecha).
   - Sumas y Restas (de izquierda a derecha).

2. **Ecuaciones de Primer Grado**:
   - Todo término que suma pasa restando al otro miembro.
   - Todo factor multiplicativo no nulo pasa dividiendo al miembro opuesto.`,
    exercises: [
      {
        id: 'ex-m1-1',
        type: 'multiple-choice',
        prompt: 'Calcula el valor numérico exacto de la siguiente expresión combinada: 12 - 3 × 2 + 8 ÷ 4',
        options: ['8', '10', '14', '22'],
        correctAnswer: '8',
        points: 2,
        hint: 'Recuerda efectuar primero la multiplicación (3 × 2) y la división (8 ÷ 4) antes de restar o sumar.',
        explanation: 'Siguiendo el orden de operaciones: 12 - (3 × 2) + (8 ÷ 4) = 12 - 6 + 2 = 6 + 2 = 8.',
      },
      {
        id: 'ex-m1-2',
        type: 'fill-blank',
        prompt: 'Resuelve la incógnita en la igualdad: 3x + 15 = 36. El valor de x es [7].',
        instructions: 'Escribe únicamente el número en la casilla correspondiente.',
        correctAnswer: '7',
        points: 2,
        hint: 'Resta 15 en ambos lados: 3x = 21. Luego divide entre 3.',
        explanation: '3x = 36 - 15 = 21 ➔ x = 21 / 3 = 7.',
      },
      {
        id: 'ex-m1-3',
        type: 'true-false',
        prompt: '¿Es el número 1 clasificado como un número primo en el conjunto de los números naturales?',
        correctAnswer: 'false',
        points: 2,
        hint: 'Revisa la definición matemática estricta de número primo.',
        explanation: 'Falso. Por definición matemática moderna, un número primo es un entero mayor que 1 que tiene exactamente dos divisores positivos distintos (1 y sí mismo). El 1 solo tiene un divisor.',
      },
      {
        id: 'ex-m1-4',
        type: 'short-answer',
        prompt: 'Un vehículo viaja a una velocidad constante de 80 km/h durante exactamente 3.5 horas. ¿Cuántos kilómetros recorre en total?',
        instructions: 'Ingresa únicamente la cifra numérica del resultado.',
        correctAnswer: '280',
        points: 2,
        hint: 'Aplica la fórmula elemental de cinemática: Distancia = Velocidad × Tiempo.',
        explanation: 'Distancia = 80 km/h × 3.5 h = 280 km.',
      },
      {
        id: 'ex-m1-5',
        type: 'multiple-choice',
        prompt: 'En una urna hay 4 bolas rojas, 6 bolas azules y 10 bolas verdes. Si extraemos una bola al azar, ¿cuál es la probabilidad simplificada de obtener una bola azul?',
        options: ['3/10', '1/5', '6/14', '1/3'],
        correctAnswer: '3/10',
        points: 2,
        hint: 'Divide el número de casos favorables entre el número total de casos (4 + 6 + 10).',
        explanation: 'Total de bolas = 4 + 6 + 10 = 20. Casos favorables = 6. Probabilidad = 6/20 = 3/10 (30%).',
      },
    ],
  },
  {
    id: 'mod-lengua-1',
    title: 'Comprensión Lectora: Análisis Crítico y Textual',
    slug: 'comprension-lectora-analisis',
    subject: 'Lengua y Literatura',
    description: 'Lectura comentada, identificación del tema central, figuras retóricas y precisión léxica.',
    estimatedMinutes: 25,
    difficulty: 'básico',
    isPublished: true,
    author: 'Prof. Daniel Alarcón',
    createdAt: '2026-09-22',
    theoryMarkdown: `### 📖 Texto de Lectura: "El Viaje del Conocimiento"

*"Las palabras no son meras herramientas para nombrar el mundo existente; son llaves que abren realidades que aún no sospechamos. Quien lee con atención no consume información: dialoga con mentes que desafiaron el tiempo y la distancia."*

Ten presente la distinción entre **hecho** (verificable de forma objetiva) y **opinión o tesis** (juicio subjetivo o valoración del autor).`,
    exercises: [
      {
        id: 'ex-l1-1',
        type: 'multiple-choice',
        prompt: 'Según el texto, ¿qué función primordial cumplen las palabras más allá de etiquetar objetos o conceptos ya existentes?',
        options: [
          'Son llaves que permiten descubrir y abrir nuevas realidades y posibilidades de pensamiento.',
          'Sirven exclusivamente como registro contable y administrativo en la historia.',
          'Son adornos poéticos prescindibles en el razonamiento científico.',
          'Impiden la comunicación fluida entre mentes de distintas épocas.',
        ],
        correctAnswer: 'Son llaves que permiten descubrir y abrir nuevas realidades y posibilidades de pensamiento.',
        points: 2,
        explanation: 'El texto afirma explícitamente: "son llaves que abren realidades que aún no sospechamos".',
      },
      {
        id: 'ex-l1-2',
        type: 'multiple-choice',
        prompt: 'En la frase: "Las palabras son llaves que abren realidades", ¿qué figura retórica se está empleando?',
        options: ['Metáfora', 'Hipérbaton', 'Onomatopeya', 'Pleonasmo'],
        correctAnswer: 'Metáfora',
        points: 2,
        explanation: 'Es una metáfora pura: identifica directamente un elemento real (las palabras) con uno figurado (llaves) sin usar nexo comparativo como "como" o "cual".',
      },
      {
        id: 'ex-l1-3',
        type: 'fill-blank',
        prompt: 'Completa la cita: "Quien lee con atención no consume [información]: dialoga con mentes que desafiaron el tiempo".',
        instructions: 'Escribe la palabra exacta en minúsculas.',
        correctAnswer: 'información',
        points: 2,
        hint: 'Aparece en la segunda oración del texto de lectura.',
        explanation: 'El fragmento exacto dice: "no consume información".',
      },
      {
        id: 'ex-l1-4',
        type: 'open-question',
        prompt: 'En 3 a 5 líneas, explica con tus propias palabras qué significa la afirmación "dialogar con mentes que desafiaron el tiempo y la distancia".',
        instructions: 'Redacta un párrafo reflexivo y conciso con buena ortografía y puntuación.',
        correctAnswer: 'Reflexión sobre cómo la lectura nos conecta con pensadores del pasado.',
        points: 4,
        hint: 'Piensa en qué sucede cuando lees a autores que vivieron hace siglos o en países lejanos.',
        explanation: 'Criterio de corrección: El alumno debe resaltar que a través de los libros podemos acceder al pensamiento vivo de autores de otras épocas y lugares geográficos.',
      },
    ],
  },
  {
    id: 'mod-ciencias-1',
    title: 'Ciencias Naturales: El Método Científico y los Ecosistemas',
    slug: 'metodo-cientifico-ecosistemas',
    subject: 'Ciencias Naturales',
    description: 'Etapas del método experimental, formulación de hipótesis e interacciones tróficas en los biomas.',
    estimatedMinutes: 20,
    difficulty: 'avanzado',
    isPublished: true,
    author: 'Prof. Daniel Alarcón',
    createdAt: '2026-09-24',
    theoryMarkdown: `### 🔬 Esquema del Método Científico

1. **Observación**: Identificación rigurosa de un fenómeno natural.
2. **Pregunta de investigación**: Delimitación clara del problema.
3. **Hipótesis**: Explicación tentativa y contrastable empíricamente.
4. **Experimentación**: Control de variable independiente vs. variable dependiente.
5. **Conclusión**: Validación o refutación de la hipótesis formulada.`,
    exercises: [
      {
        id: 'ex-c1-1',
        type: 'multiple-choice',
        prompt: 'Un grupo de estudiantes investiga si la cantidad de luz solar diaria influye en la tasa de crecimiento de las plantas de judía. ¿Cuál es la variable independiente en este experimento?',
        options: [
          'La cantidad de horas de exposición a la luz solar.',
          'La altura en centímetros alcanzada por la planta.',
          'El tipo de maceta empleada.',
          'La fecha en la que se compraron las semillas.',
        ],
        correctAnswer: 'La cantidad de horas de exposición a la luz solar.',
        points: 2,
        hint: 'La variable independiente es aquella que el experimentador manipula activamente para observar sus efectos.',
        explanation: 'La variable independiente es la causa manipulada (horas de luz). La variable dependiente es el efecto medido (crecimiento de la planta).',
      },
      {
        id: 'ex-c1-2',
        type: 'true-false',
        prompt: '¿En una red trófica marina, el fitoplancton actúa como organismo productor autótrofo?',
        correctAnswer: 'true',
        points: 2,
        explanation: 'Verdadero. El fitoplancton realiza la fotosíntesis captando energía lumínica para transformar materia inorgánica en biomasa orgánica, constituyendo la base de la cadena alimentaria marina.',
      },
      {
        id: 'ex-c1-3',
        type: 'fill-blank',
        prompt: 'El proceso celular mediante el cual las plantas capturan dióxido de carbono y agua para generar glucosa y oxígeno se denomina [fotosíntesis].',
        correctAnswer: 'fotosíntesis',
        points: 2,
        hint: 'Contiene tilde en la segunda sílaba.',
        explanation: 'La fotosíntesis es la reacción anabólica fundamental en organismos con clorofila.',
      },
    ],
  },
  {
    id: 'mod-externo-1',
    title: 'Página Externa / Taller Interactivo de Geometría',
    slug: 'taller-geometria-externa',
    subject: 'Tecnología e Informática',
    description: 'Demostración de página HTML complementaria subida por el profesor al repositorio de GitHub Pages.',
    estimatedMinutes: 15,
    difficulty: 'intermedio',
    isPublished: true,
    author: 'Prof. Daniel Alarcón',
    createdAt: '2026-09-25',
    externalUrl: './ejercicios/geometria-interactiva.html',
    theoryMarkdown: `Esta página es un ejemplo real de cómo el profesor puede subir sus propios archivos \`.html\` a GitHub Pages (en la carpeta \`public/ejercicios/\` o en cualquier ruta) y vincularlos para que sus alumnos los realicen directamente dentro del portal educativo.`,
    exercises: [
      {
        id: 'ex-ext-1',
        type: 'multiple-choice',
        prompt: 'Tras explorar el simulador interactivo de geometría adjunto, ¿qué propiedad cumplen todos los triángulos en el plano euclídeo?',
        options: [
          'La suma de sus tres ángulos interiores siempre es exactamente 180°.',
          'Todos sus lados deben medir exactamente lo mismo.',
          'Siempre tienen al menos dos ángulos rectos.',
          'Su área se calcula sumando la longitud de los tres lados.',
        ],
        correctAnswer: 'La suma de sus tres ángulos interiores siempre es exactamente 180°.',
        points: 2,
        explanation: 'En la geometría euclidiana plana, la suma de los ángulos de cualquier triángulo es igual a dos ángulos rectos, es decir, 180 grados.',
      },
    ],
  },
];

export const INITIAL_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub-1',
    studentId: 'user-student-1',
    studentName: 'Sofía Martínez',
    moduleId: 'mod-mates-1',
    moduleTitle: 'Desafíos Matemáticos: Álgebra y Lógica Operativa',
    answers: {
      'ex-m1-1': '8',
      'ex-m1-2': '7',
      'ex-m1-3': 'false',
      'ex-m1-4': '280',
      'ex-m1-5': '3/10',
    },
    score: 10,
    maxScore: 10,
    percentage: 100,
    submittedAt: '2026-09-24T10:15:00Z',
    feedback: '¡Excelente desempeño! Demostraste un dominio sólido de la jerarquía operacional.',
  },
  {
    id: 'sub-2',
    studentId: 'user-student-2',
    studentName: 'Mateo Gómez',
    moduleId: 'mod-mates-1',
    moduleTitle: 'Desafíos Matemáticos: Álgebra y Lógica Operativa',
    answers: {
      'ex-m1-1': '10',
      'ex-m1-2': '7',
      'ex-m1-3': 'false',
      'ex-m1-4': '280',
      'ex-m1-5': '3/10',
    },
    score: 8,
    maxScore: 10,
    percentage: 80,
    submittedAt: '2026-09-24T11:42:00Z',
    feedback: 'Buen trabajo. Repasa el orden de resolución en operaciones combinadas en el primer ejercicio.',
  },
];
