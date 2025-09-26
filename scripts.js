document.addEventListener('DOMContentLoaded', function () {
    const { jsPDF } = window.jspdf;

    function loadBrasaoToCanvas() {
        const canvas = document.getElementById('brasaoCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = 'assets/Brasao2.png'; 

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.onerror = function () {
            console.error("Não foi possível carregar a imagem do brasão. Verifique o caminho em assets/brasao.png");
        }
    }
    loadBrasaoToCanvas();

    function setInitialDateTime() {
        const now = new Date();
        now.setHours(now.getHours() - 3);
        const formattedDateTime = now.toISOString().slice(0, 16);
        document.getElementById('dataHora').value = formattedDateTime;
    }
    setInitialDateTime();

    const checklistItems = [
        'CHAVE DE RODA', 'ESTEPE', 'MACACO', 'TRIÂNGULO', 'TAPETE', 'CALOTAS',
        'RODA DE LIGA LEVE', 'ANTENA', 'MULTIMÍDIA C/ CONTROLE',
        'FRENTE REMOVÍVEL', 'ADESIVOS/PORTAS', 'DOCUMENTO ORIGINAL', 'CARTÃO DE ABASTECIMENTO'
    ];

    const checklistGrid = document.querySelector('.checklist-grid');

    checklistItems.forEach(item => {
        const itemSlug = item.toLowerCase().replace(/[\/ ]/g, '_');
        const itemHTML = `<div class="check-item">
        <span>${item}</span><div class="radio-group-inline"><label><input type="radio" name="${itemSlug}" value="Sim"> Sim</label><label><input type="radio" name="${itemSlug}" value="Não"> Não</label></div></div>`;
        checklistGrid.innerHTML += itemHTML;
    });

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

    const imageUploadInput = document.getElementById('imageUpload');
    const imagePreviewsContainer = document.getElementById('image-previews');
    let uploadedImagesData = [];

    imageUploadInput.addEventListener('change', async function (event) {
        const files = event.target.files;
        if (!files) return;

        for (const file of files) {
            const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1024, useWebWorker: true }; // Mantida a compressão agressiva
            try {
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imageDataUrl = e.target.result;
                    const imageId = Date.now() + "_" + Math.random();
                    uploadedImagesData.push({ id: imageId, data: imageDataUrl });
                    const previewContainer = document.createElement('div');
                    previewContainer.className = 'preview-image-container';
                    previewContainer.innerHTML = `<img src="${imageDataUrl}" class="preview-image"><button class="remove-image-btn" data-id="${imageId}">&times;</button>`;
                    imagePreviewsContainer.appendChild(previewContainer);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Erro ao comprimir imagem:', error);
                alert('Ocorreu um erro ao processar a imagem.');
            }
        }
    });

    imagePreviewsContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('remove-image-btn')) {
            const imageIdToRemove = event.target.getAttribute('data-id');
            uploadedImagesData = uploadedImagesData.filter(img => img.id != imageIdToRemove);
            event.target.parentElement.remove();
        }
    });

    const signaturePads = {};

    function initializeSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        signaturePads[canvasId] = signaturePad;


        function resizeCanvas() {
            let data;
            if (!signaturePad.isEmpty()) {
                data = signaturePad.toData();
            }

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);

            // Se havia uma assinatura, desenha-a de volta
            if (data) {
                signaturePad.fromData(data);
            } else {
                signaturePad.clear();
            }
        }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
    }

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


    document.getElementById('checklistForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const doc = new jsPDF();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        const brasaoImg = document.getElementById("brasaoParaPDF");

        function getValue(key) {
            const value = data[key] || 'Não preenchido';
            if (typeof value === 'string') { return value.toUpperCase(); }
            return value;
        }

        function getRadioValue(name) {
            const selected = document.querySelector(`input[name="${name}"]:checked`);
            return selected ? selected.value : 'NÃO MARCADO';
        }

        let y = 15;
        try {
            const brasaoCanvas = document.getElementById('brasaoCanvas');
            const brasaoDataUrl = brasaoCanvas.toDataURL('image/png', 0.7);
            doc.addImage(brasaoDataUrl, 'JPEG', 15, y, 20, 20);
        } catch (e) {
            console.error("Erro ao adicionar brasão do canvas:", e);
        }
        doc.setFontSize(8);
        doc.text('GOVERNO DO DISTRITO FEDERAL', 105, y, { align: 'center' }); y += 4;
        doc.text('SECRETARIA DE ESTADO DE ECONOMIA - SEEC', 105, y, { align: 'center' }); y += 4;
        doc.text('UNIDADE DE GESTÃO DE FROTA - UNGEF', 105, y, { align: 'center' }); y += 8;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('CHECKLIST DE VISTORIA', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 10;

        doc.setFontSize(10);
        doc.text(`TIPO DE OPERAÇÃO: ${getRadioValue('tipoOperacao').toUpperCase()}`, 15, y); y += 7;
        doc.text(`MARCA: ${getValue('marca')}`, 15, y); doc.text(`MODELO: ${getValue('modelo')}`, 105, y); y += 7;
        doc.text(`PLACA: ${getValue('placa')}`, 15, y); doc.text(`ÓRGÃO: ${getValue('orgao')}`, 105, y); y += 7;
        doc.text(`ODÔMETRO: ${getValue('odometro')} KM`, 15, y);
        const dateTimeValue = getValue('dataHora');
        let formattedDateTime = 'NÃO PREENCHIDO';
        if (dateTimeValue && dateTimeValue !== 'NÃO PREENCHIDO') {
            const date = new Date(dateTimeValue);
            formattedDateTime = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
        }
        doc.text(`DATA E HORA: ${formattedDateTime}`, 105, y); y += 7;
        doc.text(`NÍVEL DE COMBUSTÍVEL: ${fuelLevelLabel.textContent.toUpperCase()}`, 15, y); y += 10;
        doc.setFont('helvetica', 'bold'); doc.text('PNEUS:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
        doc.text(`DIANTEIROS: ${getRadioValue('pneusDianteiros').toUpperCase()}`, 20, y); doc.text(`TRASEIROS: ${getRadioValue('pneusTraseiros').toUpperCase()}`, 105, y); y += 10;
        doc.setFont('helvetica', 'bold'); doc.text('ITENS DE VISTORIA:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
        let col = 0;
        checklistItems.forEach(item => {
            const itemSlug = item.toLowerCase().replace(/[\/ ]/g, '_'); const value = getRadioValue(itemSlug);
            let checkboxString;
            if (value === 'Sim') {
                checkboxString = `[X] Sim   [ ] NAO`;
            } else if (value === 'Não') {
                checkboxString = `[ ] Sim   [X] NAO`;
            } else { checkboxString = `[ ] Sim   [ ] NAO`; }

            const xPos = col % 2 === 0 ? 20 : 105;
            if (col % 2 === 0 && col > 0) { y += 7; } if (y > 270) { doc.addPage(); y = 15; }
            doc.text(`${item.toUpperCase()}: ${checkboxString}`, xPos, y); col++;
            
        });
        y = (col % 2 !== 0) ? y + 7 : y;
        if (y > 260) { doc.addPage(); y = 15; }
        y += 10;
        doc.setFont('helvetica', 'bold'); doc.text('DANOS, AVARIAS E OBSERVAÇÕES:', 15, y); doc.setFont('helvetica', 'normal'); y += 5;
        const obsText = doc.splitTextToSize(getValue('observacoes'), 180);
        doc.text(obsText, 15, y); y += obsText.length * 5 + 10;
        if (uploadedImagesData.length > 0) {
            doc.setFont('helvetica', 'bold'); doc.text('FOTOS DE AVARIAS:', 15, y); doc.setFont('helvetica', 'normal'); y += 7;
            for (const img of uploadedImagesData) {
                if (y > 220) { doc.addPage(); y = 15; }
                doc.addImage(img.data, 'JPEG', 15, y, 80, 60); y += 65;
            }
        }

        const vistoriadorPad = signaturePads['vistoriadorSignaturePad'];
        const condutorPad = signaturePads['condutorSignaturePad'];
        if (y > 200) { doc.addPage(); y = 15; }
        doc.setFontSize(10);
        doc.text(`VISTORIADOR UNGEF: ${getValue('vistoriador')}`, 15, y);
        if (!vistoriadorPad.isEmpty()) {
            const signatureImage = vistoriadorPad.toDataURL('image/png');
            doc.addImage(signatureImage, 'PNG', 15, y + 2, 60, 20);
        }
        doc.text('___________________________________', 15, y + 25);
        y += 40;
        if (y > 250) { doc.addPage(); y = 15; }
        doc.text(`CONDUTOR: ${getValue('condutor')}`, 15, y);
        if (!condutorPad.isEmpty()) {
            const signatureImage = condutorPad.toDataURL('image/png');
            doc.addImage(signatureImage, 'PNG', 15, y + 2, 60, 20);
        }
        doc.text('___________________________________', 15, y + 25);

        const today = new Date();
        doc.setFontSize(10);
        doc.text(`BRASÍLIA-DF, ${today.toLocaleDateString('pt-BR')}`, 105, 275, { align: 'center' });

        doc.save(`Checklist_${getValue('placa').toUpperCase()}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    });
});