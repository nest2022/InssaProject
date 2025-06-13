export const modelos = {
  cafetera: {
    url: "GLB/TurinEscene.glb",
    initialHiddenObjects: ["Taza2"],
    textos: [
      { label: "Conexiones", position: [-3.79, -3.2, -2.3] },
      { label: "Bandeja de goteo", position: [-3.75, -3.5, 4.5] },
      { label: "Rejillas de ventilación", position: [-3.8, 4, -2] },
      { label: "Seguro", position: [-6, 0.6, 3] },
      { label: "Menú de selección", position: [-3.75, 3, 4.5], ocultar: [3, 4, 5] },
      { label: "Contenedor 1", position: [-4.75, 4.1, 2.7] },
      { label: "Contenedor 2", position: [-3.75, 3, 3] },
      { label: "Contenedor 3", position: [-2.75, 2, 3] },
    ],
    especificaciones: [
      "Dispensa 3 bebidas diferentes.",
      "3 Contenedores para producto soluble.",
      "Conexión al punto de agua (opcional bomba autónoma).",
      "Fácil manejo y limpieza.",
      "Mayor higiene, frescura y presentación de los productos.",
      "Alto 67cm - Ancho 30cm - Fondo 46cm.",
      "Peso: 20kg.",
      "Potencia: 1800W.",
      "Alimentación: 110V.",
      "Garantía: 18 meses.",
      "Eficiente, rentable, versátil.",
    ],
    animacionesInteractivas: [
      {
        objetoActivador: "Llave",
        fases: [
          {
            nombre: "abrir",
            animacionesAReproducir: [
              { name: "LlaveAnim" },
              { name: "TapaAnim" },
              { name: "CerraduraAnim" },
            ],
            comentarioActivaFase: 3,
          },
          {
            nombre: "cerrar",
            animacionesAReproducir: [
              { name: "LlaveAnim" },
              { name: "TapaAnim" },
              { name: "CerraduraAnim" },
            ],
            reproducirAlReves: true,
            comentarioActivaFase: 5,
          },
        ],
      },
    ],
    comentarios: [
      "Hola, bienvenido. Nos alegra tenerte aquí. Explora nuestro modelo interactivo para conocer a fondo sus componentes y funcionalidades.",
      "Para interactuar con el modelo 3D y cambiar su perspectiva, por favor, haz clic en el botón 'Orbitar' ubicado en la esquina superior derecha de tu pantalla. Esto te permitirá girar el modelo libremente.",
      "Si deseas ocultar o mostrar los nombres y etiquetas informativas de las partes del modelo, utiliza el botón 'Info. 3D'. Esto te ayudará a visualizar el modelo sin distracciones.",
      "¡Ahora puedes hacer clic en la llave para ABRIRLA!",
      "La máquina Turín se distingue por su versatilidad, permitiendo dispensar hasta tres variedades de productos solubles, cada uno almacenado en su propio contenedor individual. Esta característica garantiza una oferta diversificada y optimiza la gestión de insumos.",
      "¡Vuelve hacer clic en la llave para CERRARLA!",
      "A continuación te presentamos el video tutorial para la respectiva programación.", // Updated comment
      "A continuación te presentamos el video tutorial para la instalación de la red hídrica.", // Updated comment
      "Esperamos que esta experiencia interactiva le haya permitido descubrir el potencial de nuestra máquina Turín. Para más información o para adquirir su unidad, no dude en contactarnos. ¡La eficiencia y calidad que busca están a un clic de distancia!",
      "",
    ],
    visibleObjectsConfig: [{ objectName: "Taza2", commentIndex: 6 }],
    videosConfig: [
      { videoUrl: "https://www.youtube.com/embed/gfEwohi0YIM", commentIndex: 6 },
      { videoUrl: "https://www.youtube.com/embed/R8xifsK2IRk", commentIndex: 7 },
    ],
    posicionInicial: [0, 0, 0],
    purchaseUrl: "https://inssa.com.co/form-scoring/index.html?utm_var=DEFAULT-DEFAULT-DEFAULT&utm_person=Lina",
    purchaseCommentIndex: 9,
    returnCommentIndexOnKeepExploring: 8,
  },
  licuadora: {
    url: "GLB/Prueba1.glb",
    initialHiddenObjects: [],
    textos: [
      { label: "Cuchillas", position: [3, 2, 1] },
      { label: "Tapa de seguridad", position: [2, 4, 0] },
    ],
    especificaciones: [
      "Potencia del motor: 500W",
      "Vaso: 2 Litros, vidrio templado",
      "Velocidades: 3 + Pulso",
      "Cuchillas: Acero Inoxidable, desmontables",
    ],
    animacionesInteractivas: [
      {
        objetoActivador: "Cuchillas",
        fases: [
          {
            nombre: "activarCuchillas",
            animacionesAReproducir: [{ name: "AnimCuchillas" }],
            comentarioActivaFase: 3,
          },
          {
            nombre: "desactivarCuchillas",
            animacionesAReproducir: [{ name: "AnimCuchillas" }],
            reproducirAlReves: true,
            comentarioActivaFase: 4,
          },
        ],
      },
    ],
    comentarios: [
      "Hola, bienvenido. Nos alegra tenerte aquí. Explora nuestro modelo interactivo para conocer a fondo sus componentes y funcionalidades.",
      "Para interactuar con el modelo 3D y cambiar su perspectiva, por favor, haz clic en el botón 'Orbitar' ubicado en la esquina superior derecha de tu pantalla. Esto te permitirá girar el modelo libremente.",
      "Si deseas ocultar o mostrar los nombres y etiquetas informativas de las partes del modelo, utiliza el botón 'Info. 3D'. Esto te ayudará a visualizar el modelo sin distracciones.",
      "Segundo comentario de la licuadora. ¡Ahora puedes hacer clic en las cuchillas para ACTIVARLAS!",
      "Tercer comentario de la licuadora. ¡Haz clic para DESACTIVAR las cuchillas!",
      "Cuarto comentario de la licuadora. Esperamos que esta experiencia interactiva le haya permitido descubrir el potencial de nuestra licuadora. Para más información o para adquirir su unidad, no dude en contactarnos. ¡La eficiencia y calidad que busca están a un clic de distancia!",
      "",
    ],
    posicionInicial: [0, -1, 0],
    purchaseUrl: "https://www.innsa.com.co/licuadora-profesional",
    purchaseCommentIndex: 5,
    returnCommentIndexOnKeepExploring: 4,
  },
};
