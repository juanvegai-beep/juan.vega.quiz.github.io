// Clase principal de la aplicación
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.currentQuestion = null;
        this.correctAnswer = null;
        this.fundamentoCorrect = null;
        this.answeredCorrectly = false;
        this.lastTapTime = 0;
        this.doubleTapDelay = 300; // milliseconds
    }

    // Navegar a pantalla de configuración
    goToConfig() {
        this.hideAllScreens();
        document.getElementById('config-screen').classList.add('active');
    }

    // Volver a pantalla principal
    goToMain() {
        this.hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        this.updateTotalScore();
    }

    // Ocultar todas las pantallas
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    // Cargar archivo Excel
    loadExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById('file-name').textContent = `📄 ${file.name}`;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Obtener la primera hoja
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                this.parseQuestions(jsonData);
                
                if (this.questions.length > 0) {
                    document.getElementById('start-game-btn').disabled = false;
                    this.showMessage('success', `¡Excelente! ${this.questions.length} preguntas cargadas correctamente.`);
                } else {
                    this.showMessage('error', 'No se encontraron preguntas válidas en el archivo.');
                }
            } catch (error) {
                console.error('Error al leer el archivo:', error);
                this.showMessage('error', 'Error al procesar el archivo. Verifica el formato.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // Parsear preguntas desde el Excel
    parseQuestions(data) {
        this.questions = [];
        
        // Saltar la fila de encabezados (índice 0)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            // Verificar que la fila tenga datos
            if (!row || row.length < 7) continue;
            
            const question = {
                pregunta: row[0],
                opcion1: row[1],
                opcion2: row[2],
                opcion3: row[3],
                opcion4: row[4],
                respuestaCorrecta: row[5],
                fundamentoLegal: row[6]
            };
            
            // Validar que todos los campos necesarios existan
            if (question.pregunta && question.opcion1 && question.opcion2 && 
                question.opcion3 && question.opcion4 && question.respuestaCorrecta && 
                question.fundamentoLegal) {
                this.questions.push(question);
            }
        }
    }

    // Iniciar el juego
    startGame() {
        if (this.questions.length === 0) {
            alert('Por favor, carga un archivo de preguntas primero.');
            return;
        }

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.hideAllScreens();
        document.getElementById('question-screen').classList.add('active');
        this.loadQuestion();
    }

    // Cargar pregunta actual
    loadQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showFinishScreen();
            return;
        }

        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.answeredCorrectly = false;
        
        // Actualizar número de pregunta
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.questions.length;
        
        // Actualizar barra de progreso
        const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = progress + '%';
        
        // Mostrar pregunta
        document.getElementById('question-text').textContent = this.currentQuestion.pregunta;
        
        // Crear opciones
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        const options = [
            this.currentQuestion.opcion1,
            this.currentQuestion.opcion2,
            this.currentQuestion.opcion3,
            this.currentQuestion.opcion4
        ];
        
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => {
                // Si el botón está bloqueado, resetear todo
                if (button.disabled) {
                    this.resetAllOptions('question');
                } else {
                    this.checkAnswer(option, button);
                }
            };
            button.ondblclick = () => {
                // Doble clic en cualquier botón bloqueado resetea todo
                if (button.disabled) {
                    this.resetAllOptions('question');
                }
            };
            optionsContainer.appendChild(button);
        });
        
        // Agregar evento de clic al contenedor para resetear
        const container = document.querySelector('#question-screen .container');
        container.onclick = (e) => {
            // Solo resetear si se hace clic en el fondo, no en los botones
            if (e.target === container || e.target.classList.contains('question-box') || 
                e.target.id === 'question-text') {
                this.resetAllOptions('question');
            }
        };
        
        // Ocultar elementos
        document.getElementById('feedback-message').classList.remove('show');
        document.getElementById('next-to-fundamento-btn').classList.add('hidden');
    }

    // Verificar respuesta
    checkAnswer(selectedAnswer, button) {
        const feedbackElement = document.getElementById('feedback-message');
        
        if (selectedAnswer === this.currentQuestion.respuestaCorrecta) {
            // Respuesta correcta - deshabilitar todos los botones
            const allButtons = document.querySelectorAll('#options-container .option-btn');
            allButtons.forEach(btn => btn.disabled = true);
            
            button.classList.add('correct');
            this.answeredCorrectly = true;
            this.correctAnswer = selectedAnswer;
            
            feedbackElement.className = 'feedback-message success show';
            feedbackElement.textContent = '🎉 ¡Correcto! ¡Has ganado una moneda! 🪙';
            
            // Mostrar animación de fiesta
            this.showPartyAnimation();
            
            // Mostrar botón para ir al fundamento
            setTimeout(() => {
                document.getElementById('next-to-fundamento-btn').classList.remove('hidden');
            }, 1500);
            
        } else {
            // Respuesta incorrecta - marcar botón y bloquear todos
            const allButtons = document.querySelectorAll('#options-container .option-btn');
            allButtons.forEach(btn => btn.disabled = true);
            
            button.classList.add('incorrect');
            
            feedbackElement.className = 'feedback-message error show';
            feedbackElement.innerHTML = '❌ Incorrecto. Haz clic en el fondo para intentar de nuevo.';
        }
    }

    // Reiniciar todas las opciones al hacer doble tap
    resetAllOptions(type) {
        const container = type === 'question' ? '#options-container' : '#fundamento-options-container';
        const allButtons = document.querySelectorAll(`${container} .option-btn`);
        
        // Remover todas las clases y reactivar todos los botones
        allButtons.forEach(btn => {
            btn.classList.remove('incorrect');
            btn.classList.remove('correct');
            btn.disabled = false;
            // Forzar el estilo blanco original
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        });
        
        // Ocultar mensaje de feedback
        const feedbackId = type === 'question' ? 'feedback-message' : 'feedback-fundamento-message';
        document.getElementById(feedbackId).classList.remove('show');
    }

    // Reintentar pregunta (quitar marcas incorrectas)
    retryQuestion() {
        const allButtons = document.querySelectorAll('#options-container .option-btn');
        
        // Quitar clases de incorrecto y reactivar botones
        allButtons.forEach(btn => {
            if (btn.classList.contains('incorrect')) {
                btn.classList.remove('incorrect');
            }
            if (!btn.classList.contains('correct')) {
                btn.disabled = false;
            }
        });
        
        // Ocultar mensaje de feedback
        document.getElementById('feedback-message').classList.remove('show');
    }

    // Ir a pantalla de fundamento
    goToFundamento() {
        this.hideAllScreens();
        document.getElementById('fundamento-screen').classList.add('active');
        this.loadFundamento();
    }

    // Cargar pregunta de fundamento
    loadFundamento() {
        // Actualizar barra de progreso
        const progress = ((this.currentQuestionIndex + 0.5) / this.questions.length) * 100;
        document.getElementById('progress-fill-fundamento').style.width = progress + '%';
        
        // Mostrar repaso
        document.getElementById('recap-question').textContent = this.currentQuestion.pregunta;
        document.getElementById('recap-answer').textContent = this.correctAnswer;
        
        // Obtener fundamentos para las opciones
        const fundamentoOptions = this.getFundamentoOptions();
        
        // Crear opciones de fundamento
        const fundamentoContainer = document.getElementById('fundamento-options-container');
        fundamentoContainer.innerHTML = '';
        
        fundamentoOptions.forEach((fundamento) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = fundamento;
            button.onclick = () => {
                // Si el botón está bloqueado, resetear todo
                if (button.disabled) {
                    this.resetAllOptions('fundamento');
                } else {
                    this.checkFundamento(fundamento, button);
                }
            };
            button.ondblclick = () => {
                // Doble clic en cualquier botón bloqueado resetea todo
                if (button.disabled) {
                    this.resetAllOptions('fundamento');
                }
            };
            fundamentoContainer.appendChild(button);
        });
        
        // Agregar evento de clic al contenedor para resetear
        const container = document.querySelector('#fundamento-screen .container');
        container.onclick = (e) => {
            // Solo resetear si se hace clic en el fondo, no en los botones
            if (e.target === container || e.target.classList.contains('recap-box') ||
                e.target.classList.contains('question-box')) {
                this.resetAllOptions('fundamento');
            }
        };
        
        // Ocultar elementos
        document.getElementById('feedback-fundamento-message').classList.remove('show');
        document.getElementById('next-question-btn').classList.add('hidden');
    }

    // Obtener opciones de fundamento (3 incorrectas + 1 correcta)
    getFundamentoOptions() {
        const correctFundamento = this.currentQuestion.fundamentoLegal;
        const options = [correctFundamento];
        
        // Obtener fundamentos de otras preguntas
        const otherFundamentos = this.questions
            .filter(q => q.fundamentoLegal !== correctFundamento)
            .map(q => q.fundamentoLegal);
        
        // Seleccionar 3 fundamentos aleatorios diferentes
        while (options.length < 4 && otherFundamentos.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherFundamentos.length);
            const fundamento = otherFundamentos[randomIndex];
            
            if (!options.includes(fundamento)) {
                options.push(fundamento);
            }
            
            otherFundamentos.splice(randomIndex, 1);
        }
        
        // Mezclar opciones
        return this.shuffleArray(options);
    }

    // Mezclar array
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Verificar fundamento
    checkFundamento(selectedFundamento, button) {
        const feedbackElement = document.getElementById('feedback-fundamento-message');
        
        if (selectedFundamento === this.currentQuestion.fundamentoLegal) {
            // Fundamento correcto - deshabilitar todos los botones
            const allButtons = document.querySelectorAll('#fundamento-options-container .option-btn');
            allButtons.forEach(btn => btn.disabled = true);
            
            button.classList.add('correct');
            this.score++; // Incrementar puntuación
            
            feedbackElement.className = 'feedback-message success show';
            feedbackElement.textContent = '⚖️ ¡Correcto! Has dominado esta pregunta completamente. 🎉';
            
            // Mostrar animación de fiesta
            this.showPartyAnimation();
            
            // Mostrar botón para siguiente pregunta
            setTimeout(() => {
                document.getElementById('next-question-btn').classList.remove('hidden');
            }, 1500);
            
        } else {
            // Fundamento incorrecto - marcar botón y bloquear todos
            const allButtons = document.querySelectorAll('#fundamento-options-container .option-btn');
            allButtons.forEach(btn => btn.disabled = true);
            
            button.classList.add('incorrect');
            
            feedbackElement.className = 'feedback-message error show';
            feedbackElement.innerHTML = '❌ Fundamento incorrecto. Haz clic en el fondo para intentar de nuevo.';
        }
    }

    // Reintentar fundamento (quitar marcas incorrectas)
    retryFundamento() {
        const allButtons = document.querySelectorAll('#fundamento-options-container .option-btn');
        
        // Quitar clases de incorrecto y reactivar botones
        allButtons.forEach(btn => {
            if (btn.classList.contains('incorrect')) {
                btn.classList.remove('incorrect');
            }
            if (!btn.classList.contains('correct')) {
                btn.disabled = false;
            }
        });
        
        // Ocultar mensaje de feedback
        document.getElementById('feedback-fundamento-message').classList.remove('show');
    }

    // Siguiente pregunta
    nextQuestion() {
        this.currentQuestionIndex++;
        this.hideAllScreens();
        document.getElementById('question-screen').classList.add('active');
        this.loadQuestion();
    }

    // Mostrar animación de fiesta
    showPartyAnimation() {
        const partyElement = document.getElementById('party-animation');
        partyElement.classList.remove('hidden');
        
        // Crear confetti
        this.createConfetti();
        
        // Ocultar después de 1.5 segundos
        setTimeout(() => {
            partyElement.classList.add('hidden');
        }, 1500);
    }

    // Crear confetti
    createConfetti() {
        const confettiContainer = document.querySelector('.confetti-container');
        confettiContainer.innerHTML = '';
        
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD700', '#95E1D3', '#F38181'];
        const symbols = ['⭐', '🌟', '✨', '💫', '🎊'];
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.fontSize = (Math.random() * 20 + 20) + 'px';
            confetti.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear`;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Agregar animación CSS dinámicamente
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Mostrar mensaje
    showMessage(type, message) {
        alert(message);
    }

    // Salir del juego
    exitGame() {
        if (confirm('¿Estás seguro de que quieres salir? Se perderá tu progreso actual.')) {
            this.goToMain();
        }
    }

    // Mostrar pantalla de finalización
    showFinishScreen() {
        this.hideAllScreens();
        document.getElementById('finish-screen').classList.add('active');
        
        // Actualizar puntuación final
        document.getElementById('final-score-number').textContent = this.score;
        document.getElementById('correct-answers').textContent = this.score;
        
        // Actualizar puntuación total
        const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
        const newTotalScore = totalScore + this.score;
        localStorage.setItem('totalScore', newTotalScore.toString());
        
        this.updateTotalScore();
    }

    // Actualizar puntuación total
    updateTotalScore() {
        const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
        document.getElementById('total-score').textContent = totalScore;
    }

    // Reiniciar juego
    restartGame() {
        this.startGame();
    }
}

// Inicializar la aplicación
const app = new QuizApp();

// Actualizar puntuación total al cargar
window.addEventListener('load', () => {
    app.updateTotalScore();
});
