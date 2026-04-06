const vturbTemplates = {};

function initVturbTemplates() {
    if (Object.keys(vturbTemplates).length === 0) {
        document.querySelectorAll('.vturb-video-container').forEach((container, index) => {
            vturbTemplates[index] = container.innerHTML;
            container.dataset.vidx = index;
        });
    }
}

document.addEventListener('DOMContentLoaded', initVturbTemplates);

function destroyAndPauseVideos(nextScreenId) {
    try {
        initVturbTemplates();

        const killElement = (el) => {
            try {
                if (el.pause) el.pause();
                el.muted = true;
                el.src = "";
                el.removeAttribute('src');
                if (el.load) el.load();
                el.remove();
            } catch(e){}
        };

        // 1. Limpeza Recursiva de Mídias (Varre DOM e Shadow DOM)
        function nuke(root) {
            if (!root) return;
            // Pega tudo que pode produzir som
            root.querySelectorAll('video, audio, iframe, vturb-smartplayer, .vturb-smartplayer').forEach(el => {
                // Se o elemento estiver fora de uma "screen" ou em uma "screen" diferente da próxima, ele morre
                const parentScreen = el.closest ? el.closest('.screen') : null;
                if (!parentScreen || parentScreen.id !== nextScreenId) {
                    killElement(el);
                }
            });
            // Mergulha em Shadow Roots caso existam (comum no VTurb)
            root.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) nuke(el.shadowRoot);
            });
        }
        
        nuke(document);

        // 2. Zerar fisicamente os containers inativos
        document.querySelectorAll('.vturb-video-container').forEach(container => {
            const screenParent = container.closest('.screen');
            if (screenParent && screenParent.id !== nextScreenId) {
                container.innerHTML = ''; 
            }
        });

        // 3. Remover scripts do player ativos na memória
        document.querySelectorAll('script[src*="converteai.net"]').forEach(s => s.remove());

        // 4. Renascimento da tela de destino
        const nextScreenEl = document.getElementById(nextScreenId);
        if (nextScreenEl) {
            nextScreenEl.querySelectorAll('.vturb-video-container').forEach(container => {
                const idx = container.dataset.vidx;
                if (idx !== undefined && container.innerHTML.trim() === '') {
                    container.innerHTML = vturbTemplates[idx];
                }
            });
        }
    } catch(err) {
        console.error("Erro crítico no controle de mídias: ", err);
    }
}

function nextScreen(screenId, isBack = false) {
    destroyAndPauseVideos(screenId);
    
    if (screenId === 'finish') {
        finishQuiz();
        return;
    }

    if (screenId === 'calc-analysis') {
        let hm = currentHeight / 100;
        let imc = currentWeight / (hm * hm);
        let status = '';
        let color = '';
        
        if (imc < 18.5) {
            status = 'Abaixo do peso';
            color = '#f59e0b';
        } else if (imc < 25) {
            status = 'Peso normal';
            color = '#22c55e';
        } else if (imc < 30) {
            status = 'Sobrepeso';
            color = '#dc2626';
        } else {
            status = 'Obesidade';
            color = '#991b1b';
        }
        
        document.getElementById('final-imc').textContent = imc.toFixed(1);
        const stText = document.getElementById('imc-status-text');
        if(stText) {
            stText.textContent = status;
            stText.style.color = color;
        }
        
        screenId = 'screen-analise';
    }

    const currentActive = document.querySelector('.screen.active');
    
    // Validação de checkboxes obrigatórios
    if (currentActive && !isBack) {
        const checkboxScreens = ['screen-areas', 'screen-barriers', 'screen-goals', 'screen-rotina'];
        if (checkboxScreens.includes(currentActive.id)) {
            const checked = currentActive.querySelectorAll('input[type="checkbox"]:checked');
            if (checked.length === 0) {
                const err = currentActive.querySelector('.inline-error-msg');
                if (err) err.style.display = 'block';
                return;
            } else {
                const err = currentActive.querySelector('.inline-error-msg');
                if (err) err.style.display = 'none';
            }
        }
    }

    if (currentActive) {
        currentActive.style.animation = 'none'; // previne re-trigger indesejado
        currentActive.classList.remove('active');
    }

    const nextActive = document.getElementById(screenId);
    if (nextActive) {
        nextActive.classList.add('active');
        nextActive.style.animation = 'slideIn 0.3s ease-out forwards';
    }
    
    // Gatilhos específicos por tela
    if (screenId === 'screen-loading-final') {
        startFinalLoading();
    }
    // Meta Pixel: Track PageView on screen change
    if (typeof fbq === 'function') {
        fbq('track', 'PageView');
    }

    // UTMify: Forçar nova varredura de links em SPAs
    if (window.utmify && typeof window.utmify.scan === 'function') {
        window.utmify.scan();
    }

    if (screenId === 'screen-vsl') {
        const videoId1 = '69c5ed6c6983e3eba6d383e5';
        loadVturb1();
        
        const checkPlayer1 = setInterval(() => {
            if (window.smartplayer && window.smartplayer.instances && window.smartplayer.instances.length > 0) {
                const player = window.smartplayer.instances.find(i => i.options.id === videoId1);
                if (player) {
                    // Espera 1 segundo após carregar e inicia a barrinha (Garante que o vídeo já está na tela)
                    setTimeout(() => {
                        startVslProgress();
                    }, 1000);
                    clearInterval(checkPlayer1);
                }
            }
        }, 500);
    }
    if (screenId === 'screen-loading-vsl2') {
        startLoading2();
    }
    if (screenId === 'screen-vsl-2') {
        const videoId2 = '69c5f7343a29b825b3ad51e0';
        loadVturb2();

        const checkPlayer2 = setInterval(() => {
            if (window.smartplayer && window.smartplayer.instances && window.smartplayer.instances.length > 0) {
                const player = window.smartplayer.instances.find(i => i.options.id === videoId2);
                if (player) {
                    setTimeout(() => {
                        startVslProgress2();
                    }, 1000);
                    clearInterval(checkPlayer2);
                }
            }
        }, 500);
    }
    if (screenId === 'screen-loading-vsl3') {
        startLoading3();
    }
    if (screenId === 'screen-sales-page') {
        startSalesTimer();
        // Garante scan extra na pagina de vendas
        setTimeout(() => {
            if (window.utmify && typeof window.utmify.scan === 'function') {
                window.utmify.scan();
            }
        }, 500);
    }
    
    // Retorna para o topo da tela
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Voltar é o mesmo de avançar visualmente na troca de classe, 
// a animação poderia ser invertida, mas pra SPA simples isso funciona super bem.
function prevScreen(screenId) {
    nextScreen(screenId, true);
}

let isTransitioning = false;

// Selecionar rádio em listas/grids e pular pra próxima etapa
function selectOptionAndNext(element, nextScreenId) {
    if (isTransitioning) return; // bloqueia duplos cliques
    
    // Remove "selected" de todos os irmãos (seja option-item ou image-option)
    const parentContainer = element.closest('.options-list, .image-grid');
    const options = parentContainer.querySelectorAll('.option-item, .image-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Adiciona "selected" no clicado
    element.classList.add('selected');
    
    // Força input checked
    const radio = element.querySelector('input[type="radio"]');
    if(radio) radio.checked = true;

    isTransitioning = true;
    
    // Aguarda um instante para feedback visual e então vai pra próxima tela
    setTimeout(() => {
        nextScreen(nextScreenId);
        isTransitioning = false;
    }, 400); // 400ms dá tempo ótimo pra ver o botão preencher
}

// Toggle para checkboxes (permite mais de uma)
function toggleCheckbox(element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    const errorDiv = element.closest('.screen').querySelector('.inline-error-msg');
    if (errorDiv) errorDiv.style.display = 'none';
    
    setTimeout(() => {
        if(checkbox.checked) {
            element.classList.add('selected');
            if (checkbox.value === 'corpo-todo' || checkbox.value === 'todas') {
                const parent = element.closest('.options-list, .split-layout');
                const allItems = parent.querySelectorAll('.checkbox-option');
                allItems.forEach(item => {
                    item.classList.add('selected');
                    const cb = item.querySelector('input[type="checkbox"]');
                    if (cb) cb.checked = true;
                });
            }
        } else {
            element.classList.remove('selected');
        }
    }, 10);
}

// Garantia para labels: atualiza classes ao mudar inputs diretos
document.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', function(e) {
        const label = this.closest('.option-item');
        if (this.checked) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    });
});

function saveNameAndNext(nextScreenId) {
    const nameInputEl = document.getElementById('user-name-input');
    const nameInput = nameInputEl.value.trim();
    const err = document.getElementById('name-error');
    if (err) err.style.display = 'none';
    
    // Verificação de obrigatoriedade
    if (nameInput === "") {
        if (err) err.style.display = 'block';
        nameInputEl.focus();
        return;
    }
    
    const nameDisplay = document.getElementById('display-name');
    const nameDisplay2 = document.getElementById('display-name-2');
    const nameDisplay3 = document.getElementById('display-name-3');
    const nameDisplay4 = document.getElementById('display-name-4');
    const nameDisplay5 = document.getElementById('display-name-5');
    const nameDisplay6 = document.getElementById('display-name-6');
    const nameDisplay7 = document.getElementById('display-name-7');
    const nameDisplay8 = document.getElementById('display-name-8');
    
    // Mostramos o nome (com a primeira letra maiúscula)
    const firstName = nameInput.split(" ")[0];
    const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    nameDisplay.textContent = formattedName;
    if(nameDisplay2) nameDisplay2.textContent = formattedName;
    if(nameDisplay3) nameDisplay3.textContent = formattedName;
    if(nameDisplay4) nameDisplay4.textContent = formattedName;
    if(nameDisplay5) nameDisplay5.textContent = formattedName;
    if(nameDisplay6) nameDisplay6.textContent = formattedName;
    if(nameDisplay7) nameDisplay7.textContent = formattedName;
    if(nameDisplay8) nameDisplay8.textContent = formattedName;
    
    nextScreen(nextScreenId);
}

// Variáveis Numéricas
let currentWeight = 75;
let targetWeight = 65;
let currentHeight = 165;

function adjustValue(type, amount) {
    if(type === 'height') {
        currentHeight += amount;
        if(currentHeight < 140) currentHeight = 140;
        if(currentHeight > 200) currentHeight = 200;
        document.getElementById('height-val').textContent = currentHeight;
    } else if (type === 'weight') {
        currentWeight += amount;
        if(currentWeight < 45) currentWeight = 45;
        if(currentWeight > 150) currentWeight = 150;
        document.getElementById('weight-val').textContent = currentWeight;
    } else if (type === 'target-weight') {
        targetWeight += amount;
        if(targetWeight < 40) targetWeight = 40;
        let maxTarget = currentWeight - 1;
        if(targetWeight > maxTarget) targetWeight = maxTarget;
        document.getElementById('target-weight-val').textContent = targetWeight;
        updateMeta();
    }
}

function initTargetWeightAndNext() {
    let maxTarget = currentWeight - 1;
    document.getElementById('max-target-weight-label').textContent = maxTarget + " kg";
    
    // Ajusta o target default para 10kg a menos, se possível
    let idealTarget = currentWeight - 10;
    if(idealTarget < 40) idealTarget = 40;
    targetWeight = idealTarget;
    
    if(targetWeight > maxTarget) {
        targetWeight = maxTarget;
    }
    
    document.getElementById('target-weight-val').textContent = targetWeight;
    updateMeta();
    nextScreen('screen-target-weight');
}

function updateMeta() {
    let lost = currentWeight - targetWeight;
    if(lost < 1) lost = 1;
    document.getElementById('lost-amount').textContent = lost;
}

function confirmObjectiveAndNext() {
    document.getElementById('current-w-display').textContent = currentWeight;
    document.getElementById('target-w-display').textContent = targetWeight;
    
    let lost = currentWeight - targetWeight;
    if(lost < 1) lost = 1;
    document.getElementById('diff-w-display').textContent = lost;
    
    nextScreen('screen-objective-confirm');
}

// -------------------------------------------------------------
// Lógica do Carregamento Final e VSL
// -------------------------------------------------------------

function startFinalLoading() {
    let progress = 0;
    const progressCircle = document.getElementById('final-loading-circle');
    const progressText = document.getElementById('final-loading-text');
    const currentStatus = document.getElementById('final-loading-status');
    const dots = document.getElementById('final-loading-dots');
    const headerContainer = document.getElementById('final-loading-header');
    
    // Reseta visual se o usuário refizer
    progressCircle.style.background = `conic-gradient(#a855f7 0deg, #e2e8f0 0deg)`;
    progressText.textContent = `0%`;
    dots.style.display = 'flex';
    headerContainer.innerHTML = ''; 
    currentStatus.textContent = "Aguarde um momento...";
    
    const phrases = [
        "Analisando suas respostas...",
        "Calculando seu metabolismo basal...",
        "Verificando compatibilidade hormonal...",
        "Avaliando seu perfil corporal...",
        "Processando dados de saúde..."
    ];
    
    // Conta até 100% em ~5.5 segundos
    const interval = setInterval(() => {
        progress += 1;
        progressCircle.style.background = `conic-gradient(#a855f7 ${progress * 3.6}deg, #e2e8f0 0deg)`;
        progressText.textContent = `${progress}%`;
        
        if (progress === 10) currentStatus.textContent = phrases[0];
        if (progress === 30) currentStatus.textContent = phrases[1];
        if (progress === 50) currentStatus.textContent = phrases[2];
        if (progress === 70) currentStatus.textContent = phrases[3];
        if (progress === 90) currentStatus.textContent = phrases[4];
        
        if (progress >= 100) {
            clearInterval(interval);
            headerContainer.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; gap: 10px; margin: 25px 0 10px 0;">
                    <div style="background: #22c55e; color: white; width:26px; height:26px; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size:1.1rem; flex-shrink:0;">✓</div>
                    <h3 style="margin:0; font-size:1.15rem; color:#1e293b; font-weight: 800;">Análise concluída com sucesso!</h3>
                </div>
            `;
            dots.style.display = 'none';
            currentStatus.textContent = 'Aguarde um momento...'; // Conforme o print, texto de baixo
            
            setTimeout(() => {
                nextScreen('screen-vsl');
            }, 1800);
        }
    }, 55); 
}

function startVslProgress() {
    const fill = document.getElementById('vsl-progress-fill');
    const pctLabel = document.getElementById('vsl-progress-pct');
    const unlockText = document.getElementById('vsl-progress-text');
    const hiddenBtn = document.getElementById('vsl-hidden-button');
    let progress = 0;
    
    if (fill) fill.style.width = `0%`;
    if (pctLabel) pctLabel.textContent = `0%`;
    if (unlockText) unlockText.innerHTML = `🔒 Assista para continuar...`;
    if (hiddenBtn) hiddenBtn.style.display = 'none';
    
    // Carrega em ~15 segundos (150ms * 100)
    const interval = setInterval(() => {
        progress++;
        if (fill) fill.style.width = `${progress}%`;
        if (pctLabel) pctLabel.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            if (pctLabel) pctLabel.textContent = `100%`;
            if (unlockText) unlockText.innerHTML = `🔓 Plano liberado com sucesso!`;
            if (hiddenBtn) {
                hiddenBtn.style.display = 'block';
                hiddenBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, 600); 
}

function startVslProgress2() {
    const fill = document.getElementById('vsl2-progress-fill');
    const pctLabel = document.getElementById('vsl2-progress-pct');
    const unlockText = document.getElementById('vsl2-progress-text');
    const hiddenBtn = document.getElementById('vsl2-hidden-button');
    let progress = 0;
    
    if (fill) fill.style.width = `0%`;
    if (pctLabel) pctLabel.textContent = `0%`;
    if (unlockText) unlockText.innerHTML = `🔒 Aguarde o final do vídeo...`;
    if (hiddenBtn) {
        hiddenBtn.style.display = 'none';
        hiddenBtn.classList.remove('active'); // Remove classes de animação se houver
    }
    
    const interval = setInterval(() => {
        progress++;
        if (fill) fill.style.width = `${progress}%`;
        if (pctLabel) pctLabel.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            if (pctLabel) pctLabel.textContent = `100%`;
            if (unlockText) unlockText.innerHTML = `🔓 Oferta liberada!`;
            if (hiddenBtn) {
                hiddenBtn.style.display = 'block';
                hiddenBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, 250); // ~25 segundos total
}

function startLoading2() {
    let progress = 0;
    const progressCircle = document.getElementById('loading2-circle');
    const progressText = document.getElementById('loading2-text');
    
    const steps = [
        document.getElementById('l2-step1'),
        document.getElementById('l2-step2'),
        document.getElementById('l2-step3'),
        document.getElementById('l2-step4')
    ];
    
    // reseta os steps
    steps.forEach(st => {
        st.children[0].className = 'l2-icon l2-pending';
        st.children[1].className = 'l2-text';
    });

    const interval = setInterval(() => {
        progress += 1;
        progressCircle.style.background = `conic-gradient(#ec4899 ${progress * 3.6}deg, #e2e8f0 0deg)`;
        progressText.textContent = `${progress}%`;
        
        if (progress === 10) {
            steps[0].children[0].className = 'l2-icon l2-active';
            steps[0].children[1].className = 'l2-text l2-text-active';
        }
        if (progress === 30) {
            steps[0].children[0].className = 'l2-icon l2-done';
            steps[1].children[0].className = 'l2-icon l2-active';
            steps[1].children[1].className = 'l2-text l2-text-active';
        }
        if (progress === 60) {
            steps[1].children[0].className = 'l2-icon l2-done';
            steps[2].children[0].className = 'l2-icon l2-active';
            steps[2].children[1].className = 'l2-text l2-text-active';
        }
        if (progress === 90) {
            steps[2].children[0].className = 'l2-icon l2-done';
            steps[3].children[0].className = 'l2-icon l2-done';
            steps[3].children[1].className = 'l2-text l2-text-active';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                nextScreen('screen-vsl-2');
            }, 800);
        }
    }, 45); 
}

function startVslProgress2() {
    const fill = document.getElementById('vsl2-progress-fill');
    const pctLabel = document.getElementById('vsl2-progress-pct');
    const unlockText = document.getElementById('vsl2-progress-text');
    const hiddenBtn = document.getElementById('vsl2-hidden-button');
    let progress = 0;
    
    if (fill) fill.style.width = `0%`;
    if (pctLabel) pctLabel.textContent = `0%`;
    if (unlockText) unlockText.innerHTML = `🔒 Assista para pegar seu plano.`;
    if (hiddenBtn) hiddenBtn.style.display = 'none';
    
    // Carrega em ~15 segundos
    const interval = setInterval(() => {
        progress++;
        if (fill) fill.style.width = `${progress}%`;
        if (pctLabel) pctLabel.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            if (pctLabel) pctLabel.textContent = `100%`;
            if (unlockText) unlockText.innerHTML = `🔓 Plano liberado!`;
            if (hiddenBtn) {
                hiddenBtn.style.display = 'block';
                hiddenBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, 800); 
}

function startLoading3() {
    let progress = 0;
    const progressFill = document.getElementById('l3-progress-fill');
    
    const steps = [
        document.getElementById('l3-step1'),
        document.getElementById('l3-step2'),
        document.getElementById('l3-step3'),
        document.getElementById('l3-step4'),
        document.getElementById('l3-step5'),
        document.getElementById('l3-step6')
    ];
    
    // reseta
    steps.forEach((st, idx) => {
        st.children[0].className = idx === 0 ? 'l3-icon l3-done' : 'l3-icon l3-pending';
        if (idx === 0) st.children[0].innerHTML = ''; // Limpa emoji se houver
        st.children[1].className = idx === 0 ? 'l3-text l3-text-active' : 'l3-text';
    });

    if(progressFill) progressFill.style.width = '0%';

    const interval = setInterval(() => {
        progress += 1;
        if(progressFill) progressFill.style.width = `${progress}%`;
        
        if (progress === 20) {
            steps[1].children[0].className = 'l3-icon l3-done';
            steps[1].children[0].innerHTML = ''; 
            steps[1].children[1].className = 'l3-text l3-text-active';
        }
        if (progress === 40) {
            steps[2].children[0].className = 'l3-icon l3-done';
            steps[2].children[0].innerHTML = '';
            steps[2].children[1].className = 'l3-text l3-text-active';
        }
        if (progress === 60) {
            steps[3].children[0].className = 'l3-icon l3-done';
            steps[3].children[0].innerHTML = '';
            steps[3].children[1].className = 'l3-text l3-text-active';
        }
        if (progress === 80) {
            steps[4].children[0].className = 'l3-icon l3-done';
            steps[4].children[0].innerHTML = '';
            steps[4].children[1].className = 'l3-text l3-text-active';
        }
        if (progress === 95) {
            steps[5].children[0].className = 'l3-icon l3-done';
            steps[5].children[0].innerHTML = '';
            steps[5].children[1].className = 'l3-text l3-text-active';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                nextScreen('screen-sales-page');
            }, 500);
        }
    }, 45); 
}

// Lógica da Página de Vendas
let salesTimerInterval;
function startSalesTimer() {
    if (salesTimerInterval) clearInterval(salesTimerInterval);
    
    let time = 10 * 60; // 10 minutos em segundos
    const timerDisplay = document.getElementById('sales-timer');
    
    salesTimerInterval = setInterval(() => {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        
        if (timerDisplay) {
            timerDisplay.textContent = minutes + ":" + seconds;
        }
        
        if (time <= 0) {
            clearInterval(salesTimerInterval);
            if (timerDisplay) timerDisplay.textContent = "00:00";
        } else {
            time--;
        }
    }, 1000);
}

function toggleFaq(element) {
    // Fecha todos os outros primeiro (Opcional, mas fica melhor)
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== element) {
            item.classList.remove('active');
        }
    });
    
    // Alterna o atual
    element.classList.toggle('active');
}

function irParaCheckout() {
    // Rastreia o clique para o Meta Pixel
    if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout');
    }
    // Inserir sua URL DE CHECKOUT AQUI
    window.location.href = "https://pay.cakto.com.br/kktndmh_823063"; 
}

function finishQuiz() {
    alert("Incrível! Aqui você pode redirecionar para uma próxima página (checkout ou advertorial).");
}

// VTurb Loading logic
function loadVturb1() {
    const old = document.querySelector('script[src*="69c5ed6c6983e3eba6d383e5"]');
    if (old) old.remove();
    var s=document.createElement("script");
    s.src="https://scripts.converteai.net/17071e3c-3cea-4d2f-aa41-c8246119b53b/players/69c5ed6c6983e3eba6d383e5/v4/player.js";
    s.async=!0;
    document.head.appendChild(s);
}

function loadVturb2() {
    const old = document.querySelector('script[src*="69c5f7343a29b825b3ad51e0"]');
    if (old) old.remove();
    var s=document.createElement("script");
    s.src="https://scripts.converteai.net/17071e3c-3cea-4d2f-aa41-c8246119b53b/players/69c5f7343a29b825b3ad51e0/v4/player.js";
    s.async=!0;
    document.head.appendChild(s);
}
