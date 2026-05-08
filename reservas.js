let dealIdInput;
let consultarBtn;
let statusMessage;
let resultCard;
let dealName;
let dealComment;
let notaInput;
let vendaEfetuadaBtn;
let currentDealId = null;

document.addEventListener('DOMContentLoaded', () => {
    dealIdInput = document.getElementById('dealIdInput');
    consultarBtn = document.getElementById('consultarBtn');
    statusMessage = document.getElementById('statusMessage');
    resultCard = document.getElementById('resultCard');
    dealName = document.getElementById('dealName');
    dealComment = document.getElementById('dealComment');
    notaInput = document.getElementById('notaInput');
    vendaEfetuadaBtn = document.getElementById('vendaEfetuadaBtn');

    if (!dealIdInput || !consultarBtn || !statusMessage || !resultCard || !dealName || !dealComment || !notaInput || !vendaEfetuadaBtn) {
        console.error('Elementos da pagina de reservas nao encontrados.');
        return;
    }

    consultarBtn.addEventListener('click', consultarNegocioPorId);
    vendaEfetuadaBtn.addEventListener('click', registrarVendaEfetuada);
    dealIdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            consultarNegocioPorId();
        }
    });
});

async function consultarNegocioPorId() {
    const id = dealIdInput.value.trim();
    currentDealId = null;

    if (!/^\d+$/.test(id)) {
        renderStatus('Informe um ID numerico valido.', true);
        resultCard.classList.add('hidden');
        return;
    }

    consultarBtn.disabled = true;
    renderStatus('Consultando negocio no Bitrix...', false);
    resultCard.classList.add('hidden');

    try {
        const resposta = await axios.get(`/api/negocios/${id}`);
        const negocio = resposta?.data?.result;

        if (!negocio) {
            renderStatus('Negocio nao encontrado.', true);
            resultCard.classList.add('hidden');
            return;
        }

        dealName.textContent = negocio.TITLE || '-';
        dealComment.textContent = negocio.COMMENTS || '-';
        notaInput.value = '';
        currentDealId = String(negocio.ID || id);
        resultCard.classList.remove('hidden');
        renderStatus('Negocio encontrado com sucesso.', false);
    } catch (error) {
        const erroApi = error?.response?.data?.error;
        renderStatus(erroApi || 'Erro ao consultar o Bitrix.', true);
        resultCard.classList.add('hidden');
    } finally {
        consultarBtn.disabled = false;
    }
}

async function registrarVendaEfetuada() {
    const numeroNota = notaInput.value.trim();

    if (!currentDealId) {
        renderStatus('Consulte um negocio antes de registrar a venda.', true);
        return;
    }

    if (!numeroNota) {
        renderStatus('Informe o Numero da Nota para continuar.', true);
        notaInput.focus();
        return;
    }

    vendaEfetuadaBtn.disabled = true;
    renderStatus('Atualizando negocio no Bitrix...', false);

    try {
        const resposta = await axios.post('/api/negocios/atualizar', {
            id: currentDealId,
            fields: {
                UF_CRM_1738864459271: numeroNota,
                UF_CRM_1778268617547: true
            }
        });

        const atualizado = resposta?.data?.result === true;
        if (atualizado) {
            renderStatus('Venda efetuada registrada com sucesso no Bitrix.', false);
            return;
        }

        renderStatus('Nao foi possivel atualizar o negocio no Bitrix.', true);
    } catch (error) {
        const erroApi = error?.response?.data?.error;
        renderStatus(erroApi || 'Erro ao atualizar negocio no Bitrix.', true);
    } finally {
        vendaEfetuadaBtn.disabled = false;
    }
}

function renderStatus(message, isError) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
}
