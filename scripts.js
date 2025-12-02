document.addEventListener('DOMContentLoaded', function () {
    const { jsPDF } = window.jspdf;

    const checklistItems = [
        'CHAVE DE RODA', 'ESTEPE', 'MACACO', 'TRIÂNGULO', 'TAPETE', 'CALOTAS',
        'RODA DE LIGA LEVE', 'ANTENA', 'MULTIMÍDIA', 'RÁDIO', 'FRENTE REMOVÍVEL',
        'ADESIVOS/PORTAS', 'DOCUMENTO ORIGINAL', 'CARTÃO DE ABASTECIMENTO'
    ];

    const carModels = {
        'Chevrolet': ['Montana', 'Spin', "Onix", 'S10'],
        'Fiat': ['Strada', 'Fiorino'],
        'Volkswagen': ['Polo', 'Saveiro'],
        'nissan': ['Sentra', 'Frontier'],
        'mitsubishi': ['L200'],
        'ford': ['Ranger', 'Ka'],
        'toyota': ['Hilux', 'SW4']
    };

    let uploadedImagesData = [];
    const signaturePads = {};

    // --- FUNÇÕES DE INICIALIZAÇÃO ---

    function initializeAll() {
        loadBrasaoToCanvas();
        setInitialDateTime();
        initializeChecklist();
        initializeFuelSystem();
        initializeImageUpload();
        initializeSignaturePads();
        initializeDynamicSelects();
        initializeMakeModelSelects();

        document.getElementById('clearFormBtn').addEventListener('click', resetFormState);
        document.getElementById('checklistForm').addEventListener('submit', handleFormSubmit);

        resetFormState();
    }

    const placaInput = document.getElementById("placa");
    const switchPlaca = document.getElementById("tipoPlacaSwitch");

    if (placaInput && switchPlaca) {
        placaInput.addEventListener("input", validarPlaca);
        switchPlaca.addEventListener("change", atualizarMascaraPlaca);
        atualizarMascaraPlaca();
    }

    function atualizarMascaraPlaca() {
        const isMercosul = document.getElementById("tipoPlacaSwitch").checked;
        const placaInput = document.getElementById("placa");
        const hint = document.getElementById("placa-hint");

        placaInput.value = "";
        placaInput.setCustomValidity("");

        if (isMercosul) {
            placaInput.placeholder = "ABC1D23"; // Exemplo Mercosul
            if (hint) hint.textContent = "Formato Mercosul: 3 Letras, 1 Número, 1 Letra, 2 Números";
        } else {
            placaInput.placeholder = "ABC1234"; // Exemplo Antiga
            if (hint) hint.textContent = "Formato Antigo: 3 Letras e 4 Números";
        }
    }

    function validarPlaca() {
        const placaInput = document.getElementById("placa");
        const isMercosul = document.getElementById("tipoPlacaSwitch").checked;

        const valor = placaInput.value.toUpperCase();
        placaInput.value = valor;

        const regexAntiga = /^[A-Z]{3}[0-9]{4}$/;

        const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

        let valido = false;
        let mensagemErro = "";

        if (isMercosul) {
            valido = regexMercosul.test(valor);
            mensagemErro = "Inválido para Mercosul. Ex: ABC1D23";
        } else {
            valido = regexAntiga.test(valor);
            mensagemErro = "Inválido para Antigo. Ex: ABC1234";
        }

        if (!valido && valor.length > 0) { // Só mostra erro se tiver algo digitado
            placaInput.setCustomValidity(mensagemErro);
        } else {
            placaInput.setCustomValidity(""); // Campo válido
        }
    }

    const btnGerar = document.getElementById('generatePdfBtn');
        if (btnGerar) {
            btnGerar.addEventListener('click', function() {
                const form = document.getElementById('checklistForm');
                
                if (!form.checkValidity()) {
                    const campoComErro = form.querySelector(':invalid');
                    
                    if (campoComErro) {
                        campoComErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        campoComErro.focus();
                    }
                }
            });
        }

    function initializeMakeModelSelects() {
        const marcaSelect = document.getElementById('marca-select');
        const marcaOutro = document.getElementById('marca-outro');
        const modeloSelect = document.getElementById('modelo-select');
        const modeloOutro = document.getElementById('modelo-outro');

        marcaSelect.innerHTML = '<option value="">Selecione a Marca...</option>';
        for (const make of Object.keys(carModels)) {
            const option = document.createElement('option');
            option.value = make;
            option.textContent = make;
            marcaSelect.appendChild(option);
        }
        marcaSelect.innerHTML += '<option value="outro">Outro (Digitar)...</option>';

        marcaSelect.addEventListener('change', () => {
            const selectedMake = marcaSelect.value;
            modeloSelect.innerHTML = '<option value="">Selecione o Modelo...</option>';
            modeloOutro.style.display = 'none';
            modeloOutro.value = '';
            marcaOutro.style.display = 'none';
            marcaOutro.value = '';

            if (selectedMake === 'outro') {
                marcaOutro.style.display = 'block';
                marcaOutro.focus();
                modeloSelect.disabled = false;
                modeloSelect.innerHTML = '<option value="outro" selected>Outro (Digitar)...</option>';
                modeloSelect.dispatchEvent(new Event('change'));
            } else {
                modeloSelect.disabled = true;
                if (selectedMake && carModels[selectedMake]) {
                    modeloSelect.disabled = false;
                    carModels[selectedMake].forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modeloSelect.appendChild(option);
                    });
                    modeloSelect.innerHTML += '<option value="outro">Outro</option>';
                }
            }
        });

        modeloSelect.addEventListener('change', () => {
            if (modeloSelect.value === 'outro') {
                modeloOutro.style.display = 'block';
                modeloOutro.focus();
            } else {
                modeloOutro.style.display = 'none';
                modeloOutro.value = '';
            }
        });
    }

    function loadBrasaoToCanvas() {
        const canvas = document.getElementById('brasaoCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = 'assets/Brasao2.png';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.onerror = () => console.error("Não foi possível carregar a imagem do brasão.");
    }

    function setInitialDateTime() {
        const now = new Date();
        now.setHours(now.getHours() - 3);
        const formattedDateTime = now.toISOString().slice(0, 16);
        document.getElementById('dataHora').value = formattedDateTime;
    }

    function initializeChecklist() {
        const checklistGrid = document.querySelector('.checklist-grid');
        const itemsHTML = checklistItems.map(item => {
            const itemSlug = item.toLowerCase().replace(/[^a-z0-9]/g, '');
            return `
                <div class="check-item">
                    <span>${item}</span>
                    <div class="radio-group-inline">
                        <label><input type="radio" name="${itemSlug}" value="Sim"> Sim</label>
                        <label><input type="radio" name="${itemSlug}" value="Não"> Não</label>
                    </div>
                </div>
            `;
        }).join('');
        checklistGrid.innerHTML = itemsHTML;
    }

    function initializeFuelSystem() {
        const fuelSlider = document.getElementById('combustivel');
        const fuelPercentage = document.getElementById('fuelPercentage');
        const fuelDescription = document.getElementById('fuelDescription');
        const fuelProgressFill = document.getElementById('fuelProgressFill');
        const fuelAlert = document.getElementById('fuelAlert');
        const canvas = document.getElementById('fuelGaugeCanvas');
        if (!fuelSlider || !canvas) return;
        const ctx = canvas.getContext('2d');
        function getFuelDescription(value) { if (value === 0) return 'Tanque Vazio'; if (value <= 10) return 'Reserva'; if (value <= 25) return 'Nível Baixo'; if (value <= 40) return 'Menos que Meio'; if (value <= 60) return 'Meio Tanque'; if (value <= 75) return 'Mais que Meio'; if (value <= 90) return 'Quase Cheio'; return 'Tanque Cheio'; }
        function getFuelColor(value) { if (value <= 25) return '#dc3545'; if (value <= 50) return '#ffc107'; return '#28a745'; }
        function drawFuelGauge(value) { const centerX = canvas.width / 2; const centerY = canvas.height - 20; const radius = 70; const startAngle = Math.PI; const endAngle = 2 * Math.PI; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.beginPath(); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.lineWidth = 15; ctx.strokeStyle = '#e9ecef'; ctx.stroke(); const fuelAngle = startAngle + (endAngle - startAngle) * (value / 100); ctx.beginPath(); ctx.arc(centerX, centerY, radius, startAngle, fuelAngle); ctx.lineWidth = 15; ctx.strokeStyle = getFuelColor(value); ctx.stroke(); const pointerAngle = startAngle + (endAngle - startAngle) * (value / 100); const pointerLength = radius - 10; const pointerX = centerX + Math.cos(pointerAngle) * pointerLength; const pointerY = centerY + Math.sin(pointerAngle) * pointerLength; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(pointerX, pointerY); ctx.lineWidth = 3; ctx.strokeStyle = '#2c3e50'; ctx.stroke(); ctx.beginPath(); ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI); ctx.fillStyle = '#2c3e50'; ctx.fill(); for (let i = 0; i <= 100; i += 25) { const angle = startAngle + (endAngle - startAngle) * (i / 100); const innerRadius = radius - 25; const outerRadius = radius - 15; const x1 = centerX + Math.cos(angle) * innerRadius; const y1 = centerY + Math.sin(angle) * innerRadius; const x2 = centerX + Math.cos(angle) * outerRadius; const y2 = centerY + Math.sin(angle) * outerRadius; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = 2; ctx.strokeStyle = '#6c757d'; ctx.stroke(); if (i % 50 === 0) { const textX = centerX + Math.cos(angle) * (innerRadius - 15); const textY = centerY + Math.sin(angle) * (innerRadius - 15); ctx.fillStyle = '#6c757d'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText(i, textX, textY + 5); } } }
        function updateFuelDisplay(value) { fuelPercentage.textContent = value + '%'; fuelDescription.textContent = getFuelDescription(value); fuelProgressFill.style.width = value + '%'; fuelProgressFill.style.backgroundColor = getFuelColor(value); drawFuelGauge(value); if (value <= 25) { fuelAlert.style.display = 'block'; fuelAlert.style.backgroundColor = value <= 10 ? '#f8d7da' : '#fff3cd'; fuelAlert.style.color = value <= 10 ? '#721c24' : '#856404'; fuelAlert.innerHTML = value <= 10 ? '🚨 CRÍTICO: Combustível na reserva!' : '⚠️ Atenção: Nível de combustível baixo!'; } else { fuelAlert.style.display = 'none'; } }
        fuelSlider.addEventListener('input', function () { const value = parseInt(this.value); updateFuelDisplay(value); });
        const initialValue = parseInt(fuelSlider.value); updateFuelDisplay(initialValue);
        function resizeFuelGauge() { const container = canvas.parentElement; const containerWidth = container.offsetWidth; const maxWidth = Math.min(containerWidth - 40, 200); canvas.style.width = maxWidth + 'px'; canvas.style.height = (maxWidth * 0.6) + 'px'; setTimeout(() => { const currentValue = parseInt(fuelSlider.value); updateFuelDisplay(currentValue); }, 100); }
        window.addEventListener('resize', resizeFuelGauge); resizeFuelGauge();
    }

    function getFuelDataForPDF() {
        const fuelSlider = document.getElementById('combustivel');
        const fuelDescription = document.getElementById('fuelDescription');
        if (!fuelSlider) return { percentage: 50, description: 'Meio Tanque' };
        const value = parseInt(fuelSlider.value);
        return {
            percentage: value,
            description: fuelDescription ? fuelDescription.textContent : 'Meio Tanque',
            color: value <= 25 ? '#dc3545' : (value <= 50 ? '#ffc107' : '#28a745')
        };
    }

    function initializeImageUpload() {
        const imageUploadInput = document.getElementById('imageUpload');
        const imagePreviewsContainer = document.getElementById('image-previews');
        imageUploadInput.addEventListener('change', function (event) { const files = event.target.files; if (!files) return; for (const file of files) { const reader = new FileReader(); reader.onload = function (e) { const img = new Image(); img.onload = function () { const maxWidth = 1024, maxHeight = 768; let { width, height } = img; if (width > height) { if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; } } else { if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; } } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8); const imageId = Date.now() + Math.random(); uploadedImagesData.push({ id: imageId, data: compressedDataUrl }); const previewContainer = document.createElement('div'); previewContainer.className = 'preview-image-container'; previewContainer.innerHTML = ` <img src="${compressedDataUrl}" class="preview-image"> <button type="button" class="remove-image-btn" data-id="${imageId}">×</button> `; imagePreviewsContainer.appendChild(previewContainer); }; img.src = e.target.result; }; reader.readAsDataURL(file); } });
        imagePreviewsContainer.addEventListener('click', function (event) { if (event.target.classList.contains('remove-image-btn')) { const imageIdToRemove = event.target.getAttribute('data-id'); uploadedImagesData = uploadedImagesData.filter(img => img.id != imageIdToRemove); event.target.parentElement.remove(); } });
    }

    function initializeSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        signaturePads[canvasId] = signaturePad;
        function resizeCanvas() { let data; if (!signaturePad.isEmpty()) { data = signaturePad.toData(); } const ratio = Math.max(window.devicePixelRatio || 1, 1); canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio; canvas.getContext("2d").scale(ratio, ratio); if (data) { signaturePad.fromData(data); } else { signaturePad.clear(); } }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
    }

    function initializeSignaturePads() {
        initializeSignaturePad('vistoriadorSignaturePad');
        initializeSignaturePad('condutorSignaturePad');
        document.querySelectorAll('.clear-signature-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.target.getAttribute('data-target');
                if (signaturePads[targetId]) {
                    signaturePads[targetId].clear();
                }
            });
        });
    }

    function initializeDynamicSelects() {
        // Função auxiliar para criar a lógica "outro"
        function setupOutroField(selectId, outroId) {
            const select = document.getElementById(selectId);
            const outroInput = document.getElementById(outroId);
            if (!select || !outroInput) return;

            select.addEventListener('change', function () {
                if (this.value === 'outro') {
                    outroInput.style.display = 'block';
                    outroInput.focus();
                } else {
                    outroInput.style.display = 'none';
                    outroInput.value = '';
                }
            });
        }

        // Aplica a lógica para os campos
        setupOutroField('vistoriador-select', 'vistoriador-outro');
        setupOutroField('orgao-select', 'orgao-outro');
    }

    // --- LÓGICA DE LIMPEZA DO FORMULÁRIO (NOVO) ---
    function resetFormState() {
        document.getElementById('checklistForm').reset();
        document.getElementById('image-previews').innerHTML = '';
        uploadedImagesData = [];

        if (signaturePads['vistoriadorSignaturePad']) {
            signaturePads['vistoriadorSignaturePad'].clear();
        }
        if (signaturePads['condutorSignaturePad']) {
            signaturePads['condutorSignaturePad'].clear();
        }

        document.getElementById('vistoriador-outro').style.display = 'none';
        document.getElementById('orgao-outro').style.display = 'none';
        document.getElementById('marca-outro').style.display = 'none';
        document.getElementById('modelo-outro').style.display = 'none';

        const fuelSlider = document.getElementById('combustivel');
        if (fuelSlider) {
            fuelSlider.value = 50;
            fuelSlider.dispatchEvent(new Event('input'));
        }

        setInitialDateTime();
        window.scrollTo(0, 0);
    }

    // --- LÓGICA DE GERAÇÃO DE PDF (ATUALIZADA) ---

    function handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const rawData = Object.fromEntries(formData.entries());

        const processedData = processFormData(rawData);

        generatePDF(processedData);

        resetFormState();
    }

    function processFormData(data) {
        const processed = { ...data };

        processed.vistoriador = (data['vistoriador-select'] === 'outro')
            ? data['vistoriador-outro']
            : data['vistoriador-select'];

        processed.orgao = (data['orgao-select'] === 'outro')
            ? data['orgao-outro']
            : data['orgao-select'];

        processed.marca = (data.marca === 'outro')
            ? data['marca-outro']
            : data.marca;

        processed.modelo = (data.modelo === 'outro')
            ? data['modelo-outro']
            : data.modelo;

        processed.vistoriador = processed.vistoriador || 'NÃO PREENCHIDO';
        processed.orgao = processed.orgao || 'NÃO PREENCHIDO';
        processed.marca = processed.marca || 'NÃO PREENCHIDO';
        processed.modelo = processed.modelo || 'NÃO PREENCHIDO';
        processed.condutor = processed.condutor || 'NÃO PREENCHIDO';
        processed.placa = processed.placa || 'SEM-PLACA';

        return processed;
    }

    function generatePDF(data) {
        const doc = new jsPDF();

        function getRadioValue(name) {
            const selected = document.querySelector(`input[name="${name}"]:checked`);
            return selected ? selected.value : 'NÃO MARCADO';
        }

        const nomeVistoriador = data.vistoriador.toUpperCase();
        const nomeOrgao = data.orgao.toUpperCase();
        const nomeCondutor = data.condutor.toUpperCase();
        const nomeMarca = data.marca.toUpperCase();
        const nomeModelo = data.modelo.toUpperCase();

        let y = 15;

        // Adicionar brasão
        try {
            const brasaoCanvas = document.getElementById('brasaoCanvas');
            doc.addImage(brasaoCanvas.toDataURL('image/png'), 'PNG', 15, y, 20, 20);
        } catch (e) { console.error('Erro ao adicionar brasão do canvas:', e); }

        doc.setFontSize(8);
        doc.text('GOVERNO DO DISTRITO FEDERAL', 105, y, { align: 'center' }); y += 4;
        doc.text('SECRETARIA DE ESTADO DE ECONOMIA - SEEC', 105, y, { align: 'center' }); y += 4;
        doc.text('UNIDADE DE GESTÃO DE FROTA - UNGEF', 105, y, { align: 'center' }); y += 12;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('Checklist - UNGEF', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 10;
        doc.setFontSize(10);
        doc.text('TIPO DE OPERAÇÃO: ' + getRadioValue('tipoOperacao').toUpperCase(), 105, y, { align: 'center' }); y += 12;
        doc.setDrawColor(221, 221, 221); doc.line(15, y, 195, y); doc.setDrawColor(0, 0, 0); y += 12;

        doc.text('MARCA: ' + nomeMarca, 15, y);
        doc.text('MODELO: ' + nomeModelo, 115, y);
        y += 7;
        doc.text('PLACA: ' + (data.placa.toUpperCase()), 15, y);
        doc.text('ÓRGÃO: ' + nomeOrgao, 115, y);
        y += 7;
        doc.text('ODÔMETRO: ' + (data.odometro || 'NÃO PREENCHIDO') + ' KM', 15, y);

        const dateTimeValue = data.dataHora;
        let formattedDateTime = 'NÃO PREENCHIDO';
        if (dateTimeValue) {
            const date = new Date(dateTimeValue);
            formattedDateTime = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
        }
        doc.text('DATA E HORA: ' + formattedDateTime, 115, y); y += 7;

        const fuelData = getFuelDataForPDF();
        doc.text(`NÍVEL DE COMBUSTÍVEL: ${fuelData.percentage}% (${fuelData.description.toUpperCase()})`, 15, y);
        y += 8;
        const gaugeX = 15, gaugeY = y, gaugeWidth = 60, gaugeHeight = 8;
        doc.setFillColor(233, 236, 239); doc.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 'F');
        const fillWidth = (gaugeWidth * fuelData.percentage) / 100;
        if (fuelData.percentage <= 25) {
            doc.setFillColor(220, 53, 69); // Vermelho
        } else if (fuelData.percentage <= 50) {
            doc.setFillColor(255, 193, 7); // Amarelo
        } else {
            doc.setFillColor(40, 167, 69); // Verde
        }
        doc.rect(gaugeX, gaugeY, fillWidth, gaugeHeight, 'F');
        doc.setDrawColor(108, 117, 125); doc.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
        y += 15;

        // Pneus
        doc.setFont('helvetica', 'bold'); doc.text('PNEUS:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
        doc.text('DIANTEIROS: ' + getRadioValue('pneusDianteiros').toUpperCase(), 15, y);
        doc.text('TRASEIROS: ' + getRadioValue('pneusTraseiros').toUpperCase(), 115, y); y += 7;
        doc.setDrawColor(221, 221, 221); doc.line(15, y, 195, y); doc.setDrawColor(0, 0, 0); y += 12;

        // Itens de vistoria
        doc.setFont('helvetica', 'bold'); doc.text('ITENS DE VISTORIA:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
        let col = 0;
        checklistItems.forEach((item) => {
            const itemSlug = item.toLowerCase().replace(/[^a-z0-9]/g, '');
            const value = getRadioValue(itemSlug);
            let checkboxString = (value === 'Sim') ? '[X] Sim [  ] NÃO' : (value === 'Não' ? '[  ] Sim [X] NÃO' : '[  ] Sim [  ] NÃO');
            const xPos = col % 2 === 0 ? 15 : 115;
            if (col % 2 === 0 && col > 0) { y += 7; }
            if (y > 270) { doc.addPage(); y = 15; }
            doc.text(item.toUpperCase() + ': ' + checkboxString, xPos, y);
            col++;
        });
        if (col % 2 !== 0) { y += 7; }
        if (y > 260) { doc.addPage(); y = 15; }
        y += 10;
        doc.setDrawColor(221, 221, 221); doc.line(15, y, 195, y); doc.setDrawColor(0, 0, 0); y += 12;

        // Observações
        doc.setFont('helvetica', 'bold'); doc.text('DANOS, AVARIAS E OBSERVAÇÕES:', 15, y); doc.setFont('helvetica', 'normal'); y += 5;
        const obsText = doc.splitTextToSize((data.observacoes?.toUpperCase() || 'NENHUMA'), 180);
        doc.text(obsText, 15, y);
        y += obsText.length * 5 + 10;

        // Fotos
        if (uploadedImagesData.length > 0) {
            doc.setFont('helvetica', 'bold'); doc.text('FOTOS DE AVARIAS:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
            let imageX = 15, imageY = y;
            for (let i = 0; i < uploadedImagesData.length; i++) {
                const img = uploadedImagesData[i];
                if (imageY > 220) { doc.addPage(); imageY = 15; }
                doc.addImage(img.data, 'JPEG', imageX, imageY, 80, 60);
                if ((i + 1) % 2 === 0) { imageX = 15; imageY += 65; }
                else { imageX = 105; }
            }
            y = imageY;
            if (uploadedImagesData.length % 2 !== 0) { y += 65; }
        }
        if (y > 200) { doc.addPage(); y = 15; }
        doc.setDrawColor(221, 221, 221); doc.line(15, y, 195, y); doc.setDrawColor(0, 0, 0); y += 12;

        // Assinaturas
        doc.setFontSize(10);
        const signatureY = y;
        doc.text('VISTORIADOR UNGEF: ' + nomeVistoriador, 15, signatureY);
        if (!signaturePads['vistoriadorSignaturePad'].isEmpty()) {
            doc.addImage(signaturePads['vistoriadorSignaturePad'].toDataURL('image/png'), 'PNG', 15, signatureY + 2, 60, 20);
        }
        doc.text('_____________________________', 15, signatureY + 25);
        doc.text('CONDUTOR: ' + nomeCondutor, 115, signatureY);
        if (!signaturePads['condutorSignaturePad'].isEmpty()) {
            doc.addImage(signaturePads['condutorSignaturePad'].toDataURL('image/png'), 'PNG', 115, signatureY + 2, 60, 20);
        }
        doc.text('_____________________________', 115, signatureY + 25);
        y = signatureY + 40;

        // Data final
        const today = new Date();
        doc.setFontSize(10);
        doc.text('BRASÍLIA-DF, ' + today.toLocaleDateString('pt-BR'), 105, 275, { align: 'center' });

        // Salvar PDF
        const orgaoArquivo = (nomeOrgao || 'GDF').replace(/[\/\\:]/g, '-').trim();
        const fileName = `CHECKLIST_${orgaoArquivo}_${(data.placa || 'SEM-PLACA').toUpperCase()}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        doc.save(fileName);

    }

    initializeAll();
});