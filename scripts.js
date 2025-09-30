document.addEventListener('DOMContentLoaded', function () {

    const { jsPDF } = window.jspdf;

    const checklistItems = ['CHAVE DE RODA', 'ESTEPE', 'MACACO', 'TRIÂNGULO', 'TAPETE', 'CALOTAS', 'RODA DE LIGA LEVE', 'ANTENA', 'MULTIMÍDIA C/ CONTROLE', 'FRENTE REMOVÍVEL', 'ADESIVOS/PORTAS', 'DOCUMENTO ORIGINAL', 'CARTÃO DE ABASTECIMENTO'];
    let uploadedImagesData = [];
    const signaturePads = {};

    function initializeAll() {
        loadBrasaoToCanvas();
        setInitialDateTime();
        initializeChecklist();
        initializeFuelSlider();
        initializeImageUpload();
        initializeSignaturePads();
        initializeDynamicSelects();
    }

    function loadBrasaoToCanvas() {
        const canvas = document.getElementById('brasaoCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = 'assets/Brasao2.png'; // Usando o nome do arquivo que você especificou
        img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); };
        img.onerror = () => { console.error("Não foi possível carregar a imagem do brasão."); };
    }

    function setInitialDateTime() {
        const now = new Date();
        now.setHours(now.getHours() - 3);
        const formattedDateTime = now.toISOString().slice(0, 16);
        document.getElementById('dataHora').value = formattedDateTime;
    }

    function initializeChecklist() {
        const checklistGrid = document.querySelector('.checklist-grid');
        checklistItems.forEach(item => {
            const itemSlug = item.toLowerCase().replace(/[\/ ]/g, '_');
            const itemHTML = `<div class="check-item"><span>${item}</span><div class="radio-group-inline"><label><input type="radio" name="${itemSlug}" value="Sim"> Sim</label><label><input type="radio" name="${itemSlug}" value="Não"> Não</label></div></div>`;
            checklistGrid.innerHTML += itemHTML;
        });
    }

    function initializeFuelSlider() {
        const fuelSlider = document.getElementById('combustivel');
        const fuelLevelLabel = document.getElementById('fuelLevelLabel');
        fuelSlider.addEventListener('input', () => {
            const value = parseFloat(fuelSlider.value);
            if (value === 0) fuelLevelLabel.textContent = 'Vazio';
            else if (value <= 0.25) fuelLevelLabel.textContent = '1/4';
            else if (value <= 0.5) fuelLevelLabel.textContent = '1/2';
            else if (value <= 0.75) fuelLevelLabel.textContent = '3/4';
            else fuelLevelLabel.textContent = 'Cheio';
        });
    }

    function initializeImageUpload() {
        const imageUploadInput = document.getElementById('imageUpload');
        const imagePreviewsContainer = document.getElementById('image-previews');
        imageUploadInput.addEventListener('change', function (event) {
            const files = event.target.files; if (!files) return;
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const maxWidth = 1024, maxHeight = 768;
                        let width = img.width, height = img.height;
                        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
                        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
                        const canvas = document.createElement('canvas');
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        const imageId = Date.now() + "_" + Math.random();
                        uploadedImagesData.push({ id: imageId, data: compressedDataUrl });
                        const previewContainer = document.createElement('div');
                        previewContainer.className = 'preview-image-container';
                        previewContainer.innerHTML = `<img src="${compressedDataUrl}" class="preview-image"><button type="button" class="remove-image-btn" data-id="${imageId}">&times;</button>`;
                        imagePreviewsContainer.appendChild(previewContainer);
                    }
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        imagePreviewsContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-image-btn')) {
                const imageIdToRemove = event.target.getAttribute('data-id');
                uploadedImagesData = uploadedImagesData.filter(img => img.id != imageIdToRemove);
                event.target.parentElement.remove();
            }
        });
    }

    function initializeSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: 'rgb(0, 0, 0)' });
        signaturePads[canvasId] = signaturePad;
        function resizeCanvas() {
            let data; if (!signaturePad.isEmpty()) { data = signaturePad.toData(); }
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            if (data) { signaturePad.fromData(data); } else { signaturePad.clear(); }
        }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
    }

    function initializeSignaturePads() {
        initializeSignaturePad('vistoriadorSignaturePad');
        initializeSignaturePad('condutorSignaturePad');
        document.querySelectorAll('.clear-signature-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.target.getAttribute('data-target');
                if (signaturePads[targetId]) { signaturePads[targetId].clear(); }
            });
        });
    }

    function initializeDynamicSelects() {
        const vistoriadorSelect = document.getElementById('vistoriador-select');
        const vistoriadorOutroInput = document.getElementById('vistoriador-outro');

        vistoriadorSelect.addEventListener('change', function () {
            if (this.value === 'outro') {
                vistoriadorOutroInput.style.display = 'block';
                vistoriadorOutroInput.focus();
            } else {
                vistoriadorOutroInput.style.display = 'none';
                vistoriadorOutroInput.value = '';
            }
        });

        const orgaoSelect = document.getElementById('orgao-select');
        const orgaoOutroInput = document.getElementById('orgao-outro');

        orgaoSelect.addEventListener('change', function () {
            if (this.value === 'outro') {
                orgaoOutroInput.style.display = 'block';
                orgaoOutroInput.focus();
            } else {
                orgaoOutroInput.style.display = 'none';
                orgaoOutroInput.value = '';
            }
        });
    }

    initializeAll();

    document.getElementById('checklistForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const doc = new jsPDF();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        function getRadioValue(name) { const selected = document.querySelector(`input[name="${name}"]:checked`); return selected ? selected.value : 'NÃO MARCADO'; }

        let nomeVistoriador = data['vistoriador-select'];
        if (nomeVistoriador === 'outro') {
            nomeVistoriador = data['vistoriador-outro'];
        }
        nomeVistoriador = (nomeVistoriador || 'NÃO PREENCHIDO').toUpperCase();

        let nomeOrgao = data['orgao-select'];
        if (nomeOrgao === 'outro') {
            nomeOrgao = data['orgao-outro'];
        }
        nomeOrgao = (nomeOrgao || 'NÃO PREENCHIDO').toUpperCase();

        let nomeCondutor = data['condutor'];
        nomeCondutor = (nomeCondutor || 'NÃO PREENCHIDO').toUpperCase();

        let y = 15;
        try { const brasaoCanvas = document.getElementById('brasaoCanvas'); const brasaoDataUrl = brasaoCanvas.toDataURL('image/png'); doc.addImage(brasaoDataUrl, 'PNG', 15, y, 20, 20); }
        catch (e) { console.error("Erro ao adicionar brasão do canvas:", e); }

        doc.setFontSize(8); 
        doc.text('GOVERNO DO DISTRITO FEDERAL', 105, y, { align: 'center' }); y += 4;
        doc.text('SECRETARIA DE ESTADO DE ECONOMIA - SEEC', 105, y, { align: 'center' }); y += 4;
        doc.text('UNIDADE DE GESTÃO DE FROTA - UNGEF', 105, y, { align: 'center' }); y += 12;
        doc.setFontSize(14); 
        doc.setFont('helvetica', 'bold');
        doc.text('Checklist - UNGEF', 105, y, { align: 'center' }); 
        doc.setFont('helvetica', 'normal'); y += 10;
        doc.setFontSize(10);
        doc.text(`TIPO DE OPERAÇÃO: ${getRadioValue('tipoOperacao').toUpperCase()}`, 105, y, { align: 'center' }); y += 12;
        doc.setDrawColor(221, 221, 221); 
        doc.line(15, y, 195, y); 
        doc.setDrawColor(0, 0, 0); y += 12;
        doc.text(`MARCA: ${data.marca.toUpperCase() || 'NÃO PREENCHIDO'}`, 15, y);
        doc.text(`MODELO: ${data.modelo.toUpperCase() || 'NÃO PREENCHIDO'}`, 115, y); y += 7;
        doc.text(`PLACA: ${data.placa.toUpperCase() || 'NÃO PREENCHIDO'}`, 15, y);
        doc.text(`ÓRGÃO: ${nomeOrgao || 'NÃO PREENCHIDO'}`, 115, y); y += 7;
        doc.text(`ODÔMETRO: ${data.odometro || 'NÃO PREENCHIDO'} KM`, 15, y);

        const dateTimeValue = data.dataHora; let formattedDateTime = 'NÃO PREENCHIDO';
        if (dateTimeValue) { const date = new Date(dateTimeValue); formattedDateTime = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ''); }
        doc.text(`DATA E HORA: ${formattedDateTime}`, 115, y); y += 7;
        doc.text(`NÍVEL DE COMBUSTÍVEL: ${document.getElementById('fuelLevelLabel').textContent.toUpperCase()}`, 15, y); y += 10;
        doc.setFont('helvetica', 'bold'); doc.text('PNEUS:', 15, y); 
        doc.setFont('helvetica', 'normal'); y += 7;
        doc.text(`DIANTEIROS: ${getRadioValue('pneusDianteiros').toUpperCase()}`, 15, y);
        doc.text(`TRASEIROS: ${getRadioValue('pneusTraseiros').toUpperCase()}`, 115, y); y += 7;
        doc.setDrawColor(221, 221, 221); 
        doc.line(15, y, 195, y); 
        doc.setDrawColor(0, 0, 0); y += 12;
        doc.setFont('helvetica', 'bold'); 
        doc.text('ITENS DE VISTORIA:', 15, y); 
        doc.setFont('helvetica', 'normal'); y += 7;

        let col = 0;
        checklistItems.forEach(item => {
            const itemSlug = item.toLowerCase().replace(/[\/ ]/g, '_'); const value = getRadioValue(itemSlug);
            let checkboxString;
            if (value === 'Sim') { checkboxString = `[X] Sim   [ ] NAO`; } else if (value === 'Não') { checkboxString = `[ ] Sim   [X] NAO`; } else { checkboxString = `[ ] Sim   [ ] NAO`; }
            const xPos = col % 2 === 0 ? 15 : 115;
            if (col % 2 === 0 && col > 0) { y += 7; } if (y > 270) { doc.addPage(); y = 15; }
            doc.text(`${item.toUpperCase()}: ${checkboxString}`, xPos, y); col++;
        });
        y = (col % 2 !== 0) ? y + 7 : y; if (y > 260) { doc.addPage(); y = 15; } y += 10;
        doc.setDrawColor(221, 221, 221); 
        doc.line(15, y, 195, y); 
        doc.setDrawColor(0, 0, 0); y += 12;
        doc.setFont('helvetica', 'bold'); 
        doc.text('DANOS, AVARIAS E OBSERVAÇÕES:', 15, y);
        doc.setFont('helvetica', 'normal'); y += 5;
        const obsText = doc.splitTextToSize(data.observacoes.toUpperCase() || 'NENHUMA', 180); 
        doc.text(obsText, 15, y); y += obsText.length * 5 + 10;
        if (uploadedImagesData.length > 0) {
            doc.setFont('helvetica', 'bold'); 
            doc.text('FOTOS DE AVARIAS:', 15, y); 
            doc.setFont('helvetica', 'normal'); y += 7;
            let imageX = 15; let imageY = y;
            for (let i = 0; i < uploadedImagesData.length; i++) {
                const img = uploadedImagesData[i];
                if (imageY > 220) { doc.addPage(); imageY = 15; }
                doc.addImage(img.data, 'JPEG', imageX, imageY, 80, 60);
                if (i % 2 === 0) { imageX = 105; } else { imageX = 15; imageY += 65; }
            }
            y = imageY;
            if (uploadedImagesData.length % 2 !== 0) { y += 65; }
        }
        if (y > 200) { doc.addPage(); y = 15; }
        doc.setDrawColor(221, 221, 221); doc.line(15, y, 195, y); 
        doc.setDrawColor(0, 0, 0); y += 12;
        doc.setFontSize(10);
        const signatureY = y;
        doc.text(`VISTORIADOR UNGEF: ${nomeVistoriador}`, 15, signatureY);
        if (!signaturePads['vistoriadorSignaturePad'].isEmpty()) { const signatureImage = signaturePads['vistoriadorSignaturePad'].toDataURL('image/png'); doc.addImage(signatureImage, 'PNG', 15, signatureY + 2, 60, 20); }
        doc.text('________________________________', 15, signatureY + 25);
        doc.text(`CONDUTOR: ${nomeCondutor}`, 115, signatureY);
        if (!signaturePads['condutorSignaturePad'].isEmpty()) { const signatureImage = signaturePads['condutorSignaturePad'].toDataURL('image/png'); doc.addImage(signatureImage, 'PNG', 115, signatureY + 2, 60, 20); }
        doc.text('________________________________', 115, signatureY + 25);
        y = signatureY + 40;
        const today = new Date();
        doc.setFontSize(10);
        doc.text(`BRASÍLIA-DF, ${today.toLocaleDateString('pt-BR')}`, 105, 275, { align: 'center' });
        doc.save(`Checklist_${(data.placa || 'SEM-PLACA').toUpperCase()}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    });
});