// Import do axios já está disponível via CDN no HTML
// A função atualizarNegocio está definida neste arquivo (linha ~297)

// Array para armazenar os itens
let itemsArray = [];
let selectedComment = 'Enviado Filial';

// Variáveis para elementos do DOM
let textInput, charCount, itemsList, itemCount, errorMessage, commentSelect;

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    textInput = document.getElementById('textInput');
    charCount = document.getElementById('charCount');
    itemsList = document.getElementById('itemsList');
    itemCount = document.getElementById('itemCount');
    errorMessage = document.getElementById('errorMessage');
    commentSelect = document.getElementById('commentSelect');

    // Verifica se os elementos existem
    if (!textInput || !charCount || !itemsList || !itemCount || !errorMessage || !commentSelect) {
        console.error('Erro: Elementos do DOM não encontrados!');
        return;
    }

    selectedComment = commentSelect.value;
    commentSelect.addEventListener('change', function() {
        selectedComment = this.value;
    });

    // Atualiza o contador de caracteres
    textInput.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;
        
        // Adiciona classe para feedback visual quando próximo do limite
        if (currentLength === 8) {
            this.classList.add('complete');
            // Adiciona ao array e limpa o input
            addItem(this.value);
        } else {
            this.classList.remove('complete');
        }
    });

    // Previne Enter de submeter o formulário
    textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    // Inicializa a listagem
    updateList();
});

// Função para adicionar item ao array
function addItem(text) {
    if (text.length === 8 && text.trim() !== '') {
        // Verifica se o item já existe (comparação case-insensitive)
        const textUpper = text.toUpperCase();
        const itemExists = itemsArray.some(item => item.toUpperCase() === textUpper);
        
        if (itemExists) {
            // Mostra mensagem de erro
            showErrorMessage();
            // Adiciona classe de erro ao input
            textInput.classList.add('error');
            // Remove a classe após animação
            setTimeout(() => {
                textInput.classList.remove('error');
            }, 2000);
            // Limpa o input
            textInput.value = '';
            charCount.textContent = '0';
            textInput.classList.remove('complete');
            textInput.focus();
            return;
        }
        
        // Se não existe, adiciona normalmente
        itemsArray.push(text);
        updateList();
        hideErrorMessage();
        textInput.value = '';
        charCount.textContent = '0';
        textInput.classList.remove('complete');
        textInput.focus();
    }
}

// Função para mostrar mensagem de erro
function showErrorMessage() {
    errorMessage.style.display = 'flex';
    errorMessage.classList.add('show');
    // Remove a mensagem automaticamente após 4 segundos
    setTimeout(() => {
        hideErrorMessage();
    }, 4000);
}

// Função para esconder mensagem de erro
function hideErrorMessage() {
    errorMessage.classList.remove('show');
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 300);
}

// Função para atualizar a exibição da listagem
function updateList() {
    itemCount.textContent = itemsArray.length;
    
    if (itemsArray.length === 0) {
        itemsList.innerHTML = '<p class="empty-message">Nenhum item adicionado ainda.</p>';
    } else {
        itemsList.innerHTML = itemsArray.map((item, index) => `
            <div class="item-card" data-index="${index}">
                <span class="item-number">#${index + 1}</span>
                <span class="item-text">${item}</span>
                <span class="check-icon" style="display: none;">✓</span>
                <span class="status-message" style="display: none;"></span>
                <button class="remove-btn" onclick="removeItem(${index})" title="Remover item">×</button>
            </div>
        `).join('');
    }
    
    // Esconde mensagem de conclusão quando a lista é atualizada
    const completionMessage = document.getElementById('completionMessage');
    if (completionMessage) {
        completionMessage.style.display = 'none';
    }
}


// Função para remover item do array (precisa estar no escopo global para onclick)
window.removeItem = function(index) {
    itemsArray.splice(index, 1);
    updateList();
};

// Função para processar entrada (precisa estar no escopo global para onclick)
window.processarEntrada = function() {
    const processBtn = document.getElementById('processBtn');
    const completionMessage = document.getElementById('completionMessage');
    
    // Verifica se há itens para processar
    if (itemsArray.length === 0) {
        return;
    }
    
    // Desabilita o botão durante o processamento
    processBtn.disabled = true;
    processBtn.classList.add('processing');
    processBtn.textContent = 'Processando...';
    
    // Esconde mensagem de conclusão anterior se existir
    if (completionMessage) {
        completionMessage.style.display = 'none';
    }
    
    // Remove todos os checks existentes
    const allCards = document.querySelectorAll('.item-card');
    allCards.forEach(card => {
        const checkIcon = card.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.style.display = 'none';
        }
    });
    
    // Percorre o array e adiciona checks progressivamente
    let currentIndex = 0;
    
    async function processNextItem() {
        if (currentIndex >= itemsArray.length) {
            // Processamento concluído
            processBtn.disabled = false;
            processBtn.classList.remove('processing');
            processBtn.textContent = 'Dar entrada';
            
            
            // Mostra mensagem de conclusão
            if (completionMessage) {
                completionMessage.style.display = 'flex';
                completionMessage.classList.add('show');
            }
            
            return;
        }
        
        // Obtém o valor do item atual
        const currentItem = itemsArray[currentIndex];
        
        // Imprime o valor do item no console
        console.log(currentItem);

        // Encontra o card correspondente
        const card = document.querySelector(`.item-card[data-index="${currentIndex}"]`);
        let statusMessage = null;
        
        if (card) {
            // Cria ou obtém o elemento de mensagem de status
            statusMessage = card.querySelector('.status-message');
            if (!statusMessage) {
                statusMessage = document.createElement('span');
                statusMessage.className = 'status-message';
                card.appendChild(statusMessage);
            }
        }

        try {
            // Aguarda a consulta da API
            const negocios = await consultarNegocioPorNome(currentItem);
                negocios.forEach(async (negocio) => {
                console.log(negocio.ID);
                const resultado = await atualizarNegocio(negocio.ID, {
                    COMMENTS: selectedComment
                });
                console.log(resultado);
                // Exibe mensagem de sucesso
                if (resultado) {
                    statusMessage.textContent = 'Negócio atualizado no Bitrix';
                    statusMessage.className = 'status-message status-success';
                    statusMessage.style.display = 'block';
                } else {
                    statusMessage.textContent = 'Erro ao atualizar negócio no Bitrix';
                    statusMessage.className = 'status-message status-error';
                    statusMessage.style.display = 'block';
                }

            });
            
            if (negocios.length > 0) {
                const negocio = negocios[0];
                console.log(negocio);
                
                // Exibe mensagem de sucesso
                if (statusMessage) {
                    statusMessage.textContent = 'Negócio encontrado no Bitrix';
                    statusMessage.className = 'status-message status-success';
                    statusMessage.style.display = 'block';
                    console.log(negocio);
                }
            } else {
                // Exibe mensagem de não encontrado
                if (statusMessage) {
                    statusMessage.textContent = 'Negócio não encontrado no Bitrix';
                    statusMessage.className = 'status-message status-error';
                    statusMessage.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Erro ao consultar negócio:', error);
            // Exibe mensagem de erro
            if (statusMessage) {
                statusMessage.textContent = 'Erro ao consultar Bitrix';
                statusMessage.className = 'status-message status-error';
                statusMessage.style.display = 'block';
            }
        }

        // Atualiza o check icon
        if (card) {
            const checkIcon = card.querySelector('.check-icon');
            if (checkIcon) {
                checkIcon.style.display = 'inline-flex';
                checkIcon.classList.add('show');
                card.classList.add('checked');
            }
        }
        
        currentIndex++;
        
        // Aguarda um pouco antes de processar o próximo item (para efeito visual)
        setTimeout(processNextItem, 300);
    }
    
    // Inicia o processamento
    processNextItem();
};

// ========== FUNÇÕES BITRIX (via backend) ==========
// Consultar negócios pelo nome (busca parcial)
async function consultarNegocioPorNome(nomeNegocio) {
    console.log(`📄 [${new Date().toLocaleTimeString()}] Consultando negócios pelo nome "${nomeNegocio}" ...`);
    
    if (!nomeNegocio || typeof nomeNegocio !== "string") {
        console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Nome inválido para busca: "${nomeNegocio}"`);
        return [];
    }
    
    try {
        const resposta = await axios.get('/api/negocios', {
            params: {
                nome: nomeNegocio
            }
        });

        const negocios = resposta?.data?.result || [];

        if (negocios.length === 0) {
            console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Nenhum negócio encontrado contendo "${nomeNegocio}" no título.`);
            return [];
        }

        return negocios;

    } catch (err) {
        const detalheErro = err.response?.data || err.message;
        console.error(`❌ [${new Date().toLocaleTimeString()}] Erro ao consultar negócios pelo nome "${nomeNegocio}":`, detalheErro);
        return [];
    }
}

// Atualizar negócio no Bitrix
async function atualizarNegocio(negocioId, campos) {
    console.log(`📄 [${new Date().toLocaleTimeString()}] Atualizando negócio ${negocioId} ...`);
    
    if (!negocioId || (typeof negocioId !== "string" && typeof negocioId !== "number")) {
        console.warn(`⚠️ [${new Date().toLocaleTimeString()}] ID do negócio inválido: "${negocioId}"`);
        return false;
    }
    
    if (!campos || typeof campos !== "object") {
        console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Campos inválidos para atualização`);
        return false;
    }
    
    try {
        const resposta = await axios.post('/api/negocios/atualizar', {
            id: negocioId,
            fields: campos
        });

        const resultado = resposta?.data?.result || false;

        if (resultado === true) {
            console.log(`✅ [${new Date().toLocaleTimeString()}] Negócio ${negocioId} atualizado com sucesso!`);
            return true;
        } else {
            console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Não foi possível atualizar negócio ${negocioId}`);
            return false;
        }

    } catch (err) {
        const detalheErro = err.response?.data || err.message;
        console.error(`❌ [${new Date().toLocaleTimeString()}] Erro ao atualizar negócio ${negocioId}:`, detalheErro);
        return false;
    }
}


