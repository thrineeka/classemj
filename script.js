let model, webcam, labelContainer, maxPredictions;

// Ruta a tu modelo descargado localmente
// Asegúrate de que esta ruta sea correcta y apunte a tu carpeta de modelo
const LOCAL_MODEL_PATH = './my_model_files/';

// Inicializa el modelo y la webcam
async function init() {
    const modelURL = LOCAL_MODEL_PATH + "model.json";
    const metadataURL = LOCAL_MODEL_PATH + "metadata.json";

    try {
        // Carga el modelo y los metadatos desde los archivos locales
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Configura la webcam
        const flip = true; // Voltear la webcam para que sea como un espejo
        webcam = new tmImage.Webcam(200, 200, flip); // Ancho, alto, voltear
        await webcam.setup(); // Solicita acceso a la cámara
        await webcam.play();
        window.requestAnimationFrame(loop); // Inicia el bucle de predicción

        // Añade la webcam al DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        // Prepara el contenedor de etiquetas para mostrar las predicciones
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = ''; // Limpia el mensaje de carga inicial

        // Creamos un div principal para la "predicción destacada"
        const mainPredictionDiv = document.createElement("div");
        mainPredictionDiv.id = "main-prediction";
        mainPredictionDiv.innerHTML = `<div class="prediction-text" style="font-size: 1.8em;">Predicción: <span style="color: #6c757d;">Cargando...</span></div>`;
        mainPredictionDiv.innerHTML += `<div class="confidence-bar"><div class="confidence-fill" style="width:0%; background-color: #6c757d;"></div></div>`;
        labelContainer.appendChild(mainPredictionDiv);

        // Luego, un contenedor para las barras de confianza detalladas
        const detailedPredictionsDiv = document.createElement("div");
        detailedPredictionsDiv.id = "detailed-predictions";
        detailedPredictionsDiv.style.marginTop = "20px";
        labelContainer.appendChild(detailedPredictionsDiv);


        // Crea los elementos para cada clase (nombre y barra de confianza)
        for (let i = 0; i < maxPredictions; i++) {
            const classDiv = document.createElement("div");
            classDiv.className = "prediction-item-detailed"; // Nueva clase para diferenciar
            classDiv.style.marginBottom = "5px"; // Pequeño margen entre barras

            const className = document.createElement("span");
            className.className = "detailed-prediction-text";
            className.innerText = "Clase " + (i + 1) + ": ";

            const confidenceValue = document.createElement("span");
            confidenceValue.className = "detailed-confidence-value";
            confidenceValue.innerText = "0%";

            const confidenceBarContainer = document.createElement("div");
            confidenceBarContainer.className = "confidence-bar-detailed";
            const confidenceBarFill = document.createElement("div");
            confidenceBarFill.className = "confidence-fill-detailed";
            confidenceBarFill.style.width = "0%";
            confidenceBarContainer.appendChild(confidenceBarFill);

            classDiv.appendChild(className);
            classDiv.appendChild(confidenceValue);
            classDiv.appendChild(confidenceBarContainer);
            detailedPredictionsDiv.appendChild(classDiv);
        }

        // Mensaje de listo
        document.getElementById("label-container").querySelector("#main-prediction .prediction-text span").innerText = "¡Listo! Apunta tu cámara.";


    } catch (error) {
        console.error("Error al inicializar el modelo o la webcam:", error);
        document.getElementById("label-container").innerHTML = "<p style='color: red;'>Error al cargar el modelo o acceder a la webcam. Asegúrate de permitir el acceso y que los archivos del modelo estén en la ruta correcta.</p>";
    }
}


// Bucle principal de predicción
async function loop() {
    webcam.update(); // Actualiza el frame de la webcam
    await predict(); // Realiza la predicción
    window.requestAnimationFrame(loop); // Vuelve a llamar al bucle para el siguiente frame
}

// Realiza la predicción del modelo
async function predict() {
    const prediction = await model.predict(webcam.canvas);

    let maxConfidence = 0;
    let predictedClass = "No reconocido";
    let predictedClassColor = "#6c757d"; // Color por defecto (gris)

    // Actualiza las barras de confianza detalladas
    for (let i = 0; i < maxPredictions; i++) {
        const currentClassPrediction = prediction[i];
        const classDiv = document.getElementById("detailed-predictions").childNodes[i];
        
        // Actualiza el texto de la clase
        classDiv.querySelector(".detailed-prediction-text").innerText = `${currentClassPrediction.className}: `;
        classDiv.querySelector(".detailed-confidence-value").innerText = `${(currentClassPrediction.probability * 100).toFixed(0)}%`;

        // Actualiza la barra de confianza
        const confidenceFill = classDiv.querySelector(".confidence-fill-detailed");
        confidenceFill.style.width = (currentClassPrediction.probability * 100) + "%";

        // Encuentra la predicción con mayor confianza para la visualización principal
        if (currentClassPrediction.probability > maxConfidence) {
            maxConfidence = currentClassPrediction.probability;
            predictedClass = currentClassPrediction.className;
        }
    }
    
    // Muestra la clase con mayor confianza de forma prominente
    const mainPredictionText = document.querySelector("#main-prediction .prediction-text span");
    const mainConfidenceFill = document.querySelector("#main-prediction .confidence-fill");

    if (maxConfidence > 0.75) { // Umbral alto para "reconocido"
        predictedClassColor = "#28a745"; // Verde para positivo
        mainPredictionText.innerText = `${predictedClass}`;
    } else if (maxConfidence > 0.5) { // Umbral medio para "posible"
        predictedClassColor = "#ffc107"; // Amarillo para incierto
        mainPredictionText.innerText = `${predictedClass} (Posible)`;
    } else { // Bajo umbral para "no reconocido"
        predictedClassColor = "#dc3545"; // Rojo para negativo/no reconocido
        mainPredictionText.innerText = `No reconocido`;
    }

    mainPredictionText.style.color = predictedClassColor;
    mainConfidenceFill.style.width = `${(maxConfidence * 100).toFixed(0)}%`;
    mainConfidenceFill.style.backgroundColor = predictedClassColor;
}

// Inicializa todo cuando la ventana se carga
window.onload = init;