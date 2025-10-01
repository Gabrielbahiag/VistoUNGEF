document.addEventListener('DOMContentLoaded', function () {
    const { jsPDF } = window.jspdf;

    const checklistItems = [
        'CHAVE DE RODA', 'ESTEPE', 'MACACO', 'TRIÂNGULO', 'TAPETE', 'CALOTAS',
        'RODA DE LIGA LEVE', 'ANTENA', 'MULTIMÍDIA', 'RÁDIO', 'FRENTE REMOVÍVEL',
        'ADESIVOS/PORTAS', 'DOCUMENTO ORIGINAL', 'CARTÃO DE ABASTECIMENTO'
    ];

    let uploadedImagesData = [];
    const signaturePads = {};

    function initializeAll() {
        loadBrasaoToCanvas();
        setInitialDateTime();
        initializeChecklist();
        initializeFuelSystem(); // Nova função para sistema de combustível
        initializeImageUpload();
        initializeSignaturePads();
        initializeDynamicSelects();
        clearForm();
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

        img.onerror = () => {
            console.error("Não foi possível carregar a imagem do brasão.");
        };
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

    // SISTEMA DE COMBUSTÍVEL APRIMORADO
    function initializeFuelSystem() {
        const fuelSlider = document.getElementById('combustivel');
        const fuelPercentage = document.getElementById('fuelPercentage');
        const fuelDescription = document.getElementById('fuelDescription');
        const fuelProgressFill = document.getElementById('fuelProgressFill');
        const fuelAlert = document.getElementById('fuelAlert');
        const canvas = document.getElementById('fuelGaugeCanvas');

        if (!fuelSlider || !canvas) return;

        const ctx = canvas.getContext('2d');

        // Função para obter descrição do nível de combustível
        function getFuelDescription(value) {
            if (value === 0) return 'Tanque Vazio';
            if (value <= 10) return 'Reserva';
            if (value <= 25) return 'Nível Baixo';
            if (value <= 40) return 'Menos que Meio';
            if (value <= 60) return 'Meio Tanque';
            if (value <= 75) return 'Mais que Meio';
            if (value <= 90) return 'Quase Cheio';
            return 'Tanque Cheio';
        }

        // Função para obter cor baseada no nível
        function getFuelColor(value) {
            if (value <= 25) return '#dc3545'; // Vermelho
            if (value <= 50) return '#ffc107'; // Amarelo
            return '#28a745'; // Verde
        }

        // Função para desenhar o gauge
        function drawFuelGauge(value) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height - 20;
            const radius = 70;
            const startAngle = Math.PI; // 180 graus
            const endAngle = 2 * Math.PI; // 360 graus

            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Desenhar fundo do gauge
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.lineWidth = 15;
            ctx.strokeStyle = '#e9ecef';
            ctx.stroke();

            // Desenhar arco do combustível
            const fuelAngle = startAngle + (endAngle - startAngle) * (value / 100);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, fuelAngle);
            ctx.lineWidth = 15;
            ctx.strokeStyle = getFuelColor(value);
            ctx.stroke();

            // Desenhar ponteiro
            const pointerAngle = startAngle + (endAngle - startAngle) * (value / 100);
            const pointerLength = radius - 10;
            const pointerX = centerX + Math.cos(pointerAngle) * pointerLength;
            const pointerY = centerY + Math.sin(pointerAngle) * pointerLength;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(pointerX, pointerY);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();

            // Desenhar centro do ponteiro
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#2c3e50';
            ctx.fill();

            // Desenhar marcações
            for (let i = 0; i <= 100; i += 25) {
                const angle = startAngle + (endAngle - startAngle) * (i / 100);
                const innerRadius = radius - 25;
                const outerRadius = radius - 15;
                const x1 = centerX + Math.cos(angle) * innerRadius;
                const y1 = centerY + Math.sin(angle) * innerRadius;
                const x2 = centerX + Math.cos(angle) * outerRadius;
                const y2 = centerY + Math.sin(angle) * outerRadius;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#6c757d';
                ctx.stroke();

                // Adicionar números
                if (i % 50 === 0) {
                    const textX = centerX + Math.cos(angle) * (innerRadius - 15);
                    const textY = centerY + Math.sin(angle) * (innerRadius - 15);
                    ctx.fillStyle = '#6c757d';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(i, textX, textY + 5);
                }
            }
        }

        // Função para atualizar todos os elementos visuais
        function updateFuelDisplay(value) {
            // Atualizar textos
            fuelPercentage.textContent = value + '%';
            fuelDescription.textContent = getFuelDescription(value);

            // Atualizar barra de progresso
            fuelProgressFill.style.width = value + '%';
            fuelProgressFill.style.backgroundColor = getFuelColor(value);

            // Desenhar gauge
            drawFuelGauge(value);

            // Mostrar/ocultar alerta
            if (value <= 25) {
                fuelAlert.style.display = 'block';
                fuelAlert.style.backgroundColor = value <= 10 ? '#f8d7da' : '#fff3cd';
                fuelAlert.style.color = value <= 10 ? '#721c24' : '#856404';
                fuelAlert.innerHTML = value <= 10 ? 
                    '🚨 CRÍTICO: Combustível na reserva!' : 
                    '⚠️ Atenção: Nível de combustível baixo!';
            } else {
                fuelAlert.style.display = 'none';
            }
        }

        // Event listener para o slider
        fuelSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            updateFuelDisplay(value);
        });

        // Inicializar com valor padrão
        const initialValue = parseInt(fuelSlider.value);
        updateFuelDisplay(initialValue);

        // Adicionar responsividade ao canvas
        function resizeFuelGauge() {
            const container = canvas.parentElement;
            const containerWidth = container.offsetWidth;
            const maxWidth = Math.min(containerWidth - 40, 200);

            canvas.style.width = maxWidth + 'px';
            canvas.style.height = (maxWidth * 0.6) + 'px';

            // Redesenhar após redimensionar
            setTimeout(() => {
                const currentValue = parseInt(fuelSlider.value);
                updateFuelDisplay(currentValue);
            }, 100);
        }

        // Event listener para redimensionamento
        window.addEventListener('resize', resizeFuelGauge);
        resizeFuelGauge(); // Chamada inicial
    }

    // Função para obter dados do combustível para o PDF
    function getFuelDataForPDF() {
        const fuelSlider = document.getElementById('combustivel');
        const fuelPercentage = document.getElementById('fuelPercentage');
        const fuelDescription = document.getElementById('fuelDescription');

        if (!fuelSlider) return { percentage: 50, description: 'Meio Tanque' };

        const value = parseInt(fuelSlider.value);
        return {
            percentage: value,
            description: fuelDescription ? fuelDescription.textContent : 'Meio Tanque',
            color: value <= 25 ? '#dc3545' : (value <= 50 ? '#ffc107' : '#28a745')
        };
    }

    function clearForm() {
        document.getElementById('clearFormBtn').addEventListener('click', () => {
            document.getElementById('checklistForm').reset();
            document.getElementById('image-previews').innerHTML = '';
            uploadedImagesData = [];

            if (signaturePads['vistoriadorSignaturePad']) {
                signaturePads['vistoriadorSignaturePad'].clear();
            }
            if (signaturePads['condutorSignaturePad']) {
                signaturePads['condutorSignaturePad'].clear();
            }

            // Resetar sistema de combustível
            const fuelSlider = document.getElementById('combustivel');
            if (fuelSlider) {
                fuelSlider.value = 50;
                fuelSlider.dispatchEvent(new Event('input'));
            }

            setInitialDateTime();
            window.scrollTo(0, 0);
        });
    }

    function initializeImageUpload() {
        const imageUploadInput = document.getElementById('imageUpload');
        const imagePreviewsContainer = document.getElementById('image-previews');

        imageUploadInput.addEventListener('change', function (event) {
            const files = event.target.files;
            if (!files) return;

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const maxWidth = 1024, maxHeight = 768;
                        let { width, height } = img;

                        if (width > height) {
                            if (width > maxWidth) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = (width * maxHeight) / height;
                                height = maxHeight;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        const imageId = Date.now() + Math.random();

                        uploadedImagesData.push({
                            id: imageId,
                            data: compressedDataUrl
                        });

                        const previewContainer = document.createElement('div');
                        previewContainer.className = 'preview-image-container';
                        previewContainer.innerHTML = `
                            <img src="${compressedDataUrl}" class="preview-image">
                            <button type="button" class="remove-image-btn" data-id="${imageId}">×</button>
                        `;

                        imagePreviewsContainer.appendChild(previewContainer);
                    };
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

            if (data) {
                signaturePad.fromData(data);
            } else {
                signaturePad.clear();
            }
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
                if (signaturePads[targetId]) {
                    signaturePads[targetId].clear();
                }
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

    // GERAÇÃO DE PDF ATUALIZADA
    document.getElementById('checklistForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const doc = new jsPDF();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        function getRadioValue(name) {
            const selected = document.querySelector(`input[name="${name}"]:checked`);
            return selected ? selected.value : 'NÃO MARCADO';
        }

        let nomeVistoriador = data['vistoriador-select'];
        if (nomeVistoriador === 'outro') {
            nomeVistoriador = data['vistoriador-outro'];
        }
        nomeVistoriador = nomeVistoriador || 'NÃO PREENCHIDO';
        nomeVistoriador = nomeVistoriador.toUpperCase();

        let nomeOrgao = data['orgao-select'];
        if (nomeOrgao === 'outro') {
            nomeOrgao = data['orgao-outro'];
        }
        nomeOrgao = nomeOrgao || 'NÃO PREENCHIDO';
        nomeOrgao = nomeOrgao.toUpperCase();

        let nomeCondutor = data['condutor'];
        nomeCondutor = nomeCondutor || 'NÃO PREENCHIDO';
        nomeCondutor = nomeCondutor.toUpperCase();

        let y = 15;

        // Adicionar brasão
        try {
            const brasaoCanvas = document.getElementById('brasaoCanvas');
            const brasaoDataUrl = brasaoCanvas.toDataURL('image/png');
            doc.addImage(brasaoDataUrl, 'PNG', 15, y, 20, 20);
        } catch (e) {
            console.error('Erro ao adicionar brasão do canvas:', e);
        }

        // Cabeçalho
        doc.setFontSize(8);
        doc.text('GOVERNO DO DISTRITO FEDERAL', 105, y, { align: 'center' });
        y += 4;
        doc.text('SECRETARIA DE ESTADO DE ECONOMIA - SEEC', 105, y, { align: 'center' });
        y += 4;
        doc.text('UNIDADE DE GESTÃO DE FROTA - UNGEF', 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Checklist - UNGEF', 105, y, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        y += 10;

        doc.setFontSize(10);
        doc.text('TIPO DE OPERAÇÃO: ' + getRadioValue('tipoOperacao').toUpperCase(), 105, y, { align: 'center' });
        y += 12;

        // Linha separadora
        doc.setDrawColor(221, 221, 221);
        doc.line(15, y, 195, y);
        doc.setDrawColor(0, 0, 0);
        y += 12;

        // Informações do veículo
        doc.text('MARCA: ' + (data.marca?.toUpperCase() || 'NÃO PREENCHIDO'), 15, y);
        doc.text('MODELO: ' + (data.modelo?.toUpperCase() || 'NÃO PREENCHIDO'), 115, y);
        y += 7;
        doc.text('PLACA: ' + (data.placa?.toUpperCase() || 'NÃO PREENCHIDO'), 15, y);
        doc.text('ÓRGÃO: ' + (nomeOrgao || 'NÃO PREENCHIDO'), 115, y);
        y += 7;
        doc.text('ODÔMETRO: ' + (data.odometro || 'NÃO PREENCHIDO') + ' KM', 15, y);

        const dateTimeValue = data.dataHora;
        let formattedDateTime = 'NÃO PREENCHIDO';
        if (dateTimeValue) {
            const date = new Date(dateTimeValue);
            formattedDateTime = date.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
            }).replace(',', '');
        }
        doc.text('DATA E HORA: ' + formattedDateTime, 115, y);
        y += 7;

        // SISTEMA DE COMBUSTÍVEL APRIMORADO NO PDF
        const fuelData = getFuelDataForPDF();
        doc.text(`NÍVEL DE COMBUSTÍVEL: ${fuelData.percentage}% (${fuelData.description.toUpperCase()})`, 15, y);

        y += 8;
        const gaugeX = 15;
        const gaugeY = y;
        const gaugeWidth = 60;
        const gaugeHeight = 8;

        // Fundo do gauge
        doc.setFillColor(233, 236, 239);
        doc.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 'F');

        // Preenchimento do combustível
        const fillWidth = (gaugeWidth * fuelData.percentage) / 100;
        if (fuelData.percentage <= 25) {
            doc.setFillColor(220, 53, 69); // Vermelho
        } else if (fuelData.percentage <= 50) {
            doc.setFillColor(255, 193, 7); // Amarelo
        } else {
            doc.setFillColor(40, 167, 69); // Verde
        }
        doc.rect(gaugeX, gaugeY, fillWidth, gaugeHeight, 'F');

        // Borda do gauge
        doc.setDrawColor(108, 117, 125);
        doc.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

        y += 15;

        // Pneus
        doc.setFont('helvetica', 'bold');
        doc.text('PNEUS:', 15, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
        doc.text('DIANTEIROS: ' + getRadioValue('pneusDianteiros').toUpperCase(), 15, y);
        doc.text('TRASEIROS: ' + getRadioValue('pneusTraseiros').toUpperCase(), 115, y);
        y += 7;

        // Linha separadora
        doc.setDrawColor(221, 221, 221);
        doc.line(15, y, 195, y);
        doc.setDrawColor(0, 0, 0);
        y += 12;

        // Itens de vistoria
        doc.setFont('helvetica', 'bold');
        doc.text('ITENS DE VISTORIA:', 15, y);
        doc.setFont('helvetica', 'normal');
        y += 7;

        let col = 0;
        checklistItems.forEach((item) => {
            const itemSlug = item.toLowerCase().replace(/[^a-z0-9]/g, '');
            const value = getRadioValue(itemSlug);

            let checkboxString = '';
            if (value === 'Sim') {
                checkboxString = '[X] Sim [  ] NÃO';
            } else if (value === 'Não') {
                checkboxString = '[  ] Sim [X] NÃO';
            } else {
                checkboxString = '[  ] Sim [  ] NÃO';
            }

            const xPos = col % 2 === 0 ? 15 : 115;
            if (col % 2 === 0 && col > 0) {
                y += 7;
            }

            if (y > 270) {
                doc.addPage();
                y = 15;
            }

            doc.text(item.toUpperCase() + ': ' + checkboxString, xPos, y);
            col++;
        });

        if (col % 2 !== 0) {
            y += 7;
        }

        if (y > 260) {
            doc.addPage();
            y = 15;
        }

        y += 10;

        // Linha separadora
        doc.setDrawColor(221, 221, 221);
        doc.line(15, y, 195, y);
        doc.setDrawColor(0, 0, 0);
        y += 12;

        // Observações
        doc.setFont('helvetica', 'bold');
        doc.text('DANOS, AVARIAS E OBSERVAÇÕES:', 15, y);
        doc.setFont('helvetica', 'normal');
        y += 5;

        const obsText = doc.splitTextToSize((data.observacoes?.toUpperCase() || 'NENHUMA'), 180);
        doc.text(obsText, 15, y);
        y += obsText.length * 5 + 10;

        // Fotos
        if (uploadedImagesData.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('FOTOS DE AVARIAS:', 15, y);
            doc.setFont('helvetica', 'normal');
            y += 7;

            let imageX = 15;
            let imageY = y;

            for (let i = 0; i < uploadedImagesData.length; i++) {
                const img = uploadedImagesData[i];

                if (imageY > 220) {
                    doc.addPage();
                    imageY = 15;
                }

                doc.addImage(img.data, 'JPEG', imageX, imageY, 80, 60);

                if ((i + 1) % 2 === 0) {
                    imageX = 15;
                    imageY += 65;
                } else {
                    imageX = 105;
                }
            }

            y = imageY;
            if (uploadedImagesData.length % 2 !== 0) {
                y += 65;
            }
        }

        if (y > 200) {
            doc.addPage();
            y = 15;
        }

        // Linha separadora final
        doc.setDrawColor(221, 221, 221);
        doc.line(15, y, 195, y);
        doc.setDrawColor(0, 0, 0);
        y += 12;

        // Assinaturas
        doc.setFontSize(10);
        const signatureY = y;

        doc.text('VISTORIADOR UNGEF: ' + nomeVistoriador, 15, signatureY);
        if (!signaturePads['vistoriadorSignaturePad'].isEmpty()) {
            const signatureImage = signaturePads['vistoriadorSignaturePad'].toDataURL('image/png');
            doc.addImage(signatureImage, 'PNG', 15, signatureY + 2, 60, 20);
        }
        doc.text('_____________________________', 15, signatureY + 25);

        doc.text('CONDUTOR: ' + nomeCondutor, 115, signatureY);
        if (!signaturePads['condutorSignaturePad'].isEmpty()) {
            const signatureImage = signaturePads['condutorSignaturePad'].toDataURL('image/png');
            doc.addImage(signatureImage, 'PNG', 115, signatureY + 2, 60, 20);
        }
        doc.text('_____________________________', 115, signatureY + 25);

        y = signatureY + 40;

        // Data final
        const today = new Date();
        doc.setFontSize(10);
        doc.text('BRASÍLIA-DF, ' + today.toLocaleDateString('pt-BR'), 105, 275, { align: 'center' });

        // Salvar PDF
        doc.save(`Checklist_${data.placa || 'SEM-PLACA'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    });
});