// Sistema de Diário de Bordo - CETEP/LNAB
// Configurações globais
const CONFIG = {
    maxPhotos: 6,
    maxStudents: 10,
    allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxFileSize: 10485760, // 10MB
    imageCompression: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8
    }
};

const MESSAGES = {
    success: 'PDF gerado com sucesso!',
    error: 'Erro ao gerar PDF. Verifique os dados e tente novamente.',
    maxPhotos: 'Máximo de 6 fotos permitidas.',
    invalidFile: 'Tipo de arquivo não permitido. Use apenas JPG ou PNG.',
    fillRequired: 'Preencha todos os campos obrigatórios.',
    processing: 'Processando imagens e gerando PDF...',
    maxStudents: 'Máximo de 10 estudantes permitidos.'
};

// Estado da aplicação
let selectedPhotos = [];
let generatedPdfBlob = null;

// Elementos DOM
let elements = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    initializeElements();
    initializeEventListeners();
    updatePhotoCounter();
});

function initializeElements() {
    elements = {
        form: document.getElementById('diaryForm'),
        turmaInput: document.getElementById('turma'),
        studentsContainer: document.getElementById('studentsContainer'),
        addStudentBtn: document.getElementById('addStudentBtn'),
        dropZone: document.getElementById('dropZone'),
        photoInput: document.getElementById('photoInput'),
        selectPhotosBtn: document.getElementById('selectPhotosBtn'),
        photosPreview: document.getElementById('photosPreview'),
        photoCount: document.getElementById('photoCount'),
        generatePdfBtn: document.getElementById('generatePdfBtn'),
        generateBtnText: document.getElementById('generateBtnText'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        downloadPdfBtn: document.getElementById('downloadPdfBtn'),
        clearFormBtn: document.getElementById('clearFormBtn'),
        messageContainer: document.getElementById('messageContainer')
    };
    
    console.log('Elementos inicializados:', elements);
}

function initializeEventListeners() {
    // Estudantes
    if (elements.addStudentBtn) {
        elements.addStudentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clicado em adicionar estudante');
            addStudentField();
        });
    }
    
    // Upload de fotos - múltiplos métodos para garantir funcionamento
    if (elements.selectPhotosBtn && elements.photoInput) {
        elements.selectPhotosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clicado em selecionar fotos');
            elements.photoInput.click();
        });
    }
    
    if (elements.photoInput) {
        elements.photoInput.addEventListener('change', function(e) {
            console.log('Arquivos selecionados:', e.target.files);
            handleFileSelect(e);
        });
    }
    
    // Drag and drop
    if (elements.dropZone) {
        elements.dropZone.addEventListener('click', function(e) {
            e.preventDefault();
            if (elements.photoInput) {
                console.log('Drop zone clicado');
                elements.photoInput.click();
            }
        });
        
        elements.dropZone.addEventListener('dragover', handleDragOver);
        elements.dropZone.addEventListener('dragleave', handleDragLeave);
        elements.dropZone.addEventListener('drop', handleDrop);
    }
    
    // Ações principais
    if (elements.generatePdfBtn) {
        elements.generatePdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clicado em gerar PDF');
            generatePDF();
        });
    }
    
    if (elements.downloadPdfBtn) {
        elements.downloadPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clicado em baixar PDF');
            downloadPDF();
        });
    }
    
    if (elements.clearFormBtn) {
        elements.clearFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clicado em limpar formulário');
            clearForm();
        });
    }
    
    // Prevenir comportamento padrão de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
    
    console.log('Event listeners inicializados');
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// === GERENCIAMENTO DE ESTUDANTES ===
function addStudentField() {
    if (!elements.studentsContainer) {
        console.error('Container de estudantes não encontrado');
        return;
    }
    
    const currentStudents = elements.studentsContainer.querySelectorAll('.student-input-group').length;
    console.log('Estudantes atuais:', currentStudents);
    
    if (currentStudents >= CONFIG.maxStudents) {
        showMessage(MESSAGES.maxStudents, 'error');
        return;
    }
    
    const studentGroup = document.createElement('div');
    studentGroup.className = 'student-input-group';
    
    studentGroup.innerHTML = `
        <div class="form-group">
            <label class="form-label">Nome do Estudante *</label>
            <input type="text" name="student" class="form-control student-input" 
                   placeholder="Nome completo do estudante" required>
        </div>
        <button type="button" class="remove-student-btn">
            - Remover
        </button>
    `;
    
    // Adicionar evento para o botão de remover
    const removeBtn = studentGroup.querySelector('.remove-student-btn');
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        removeStudentField(this);
    });
    
    elements.studentsContainer.appendChild(studentGroup);
    console.log('Campo de estudante adicionado');
}

function removeStudentField(button) {
    if (!elements.studentsContainer) return;
    
    const studentGroups = elements.studentsContainer.querySelectorAll('.student-input-group');
    
    if (studentGroups.length > 1) {
        button.parentElement.remove();
        console.log('Campo de estudante removido');
    }
}

// === GERENCIAMENTO DE FOTOS ===
function handleDragOver(e) {
    if (elements.dropZone) {
        elements.dropZone.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (elements.dropZone) {
        elements.dropZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (elements.dropZone) {
        elements.dropZone.classList.remove('drag-over');
    }
    const files = Array.from(e.dataTransfer.files);
    console.log('Arquivos arrastados:', files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    console.log('Arquivos selecionados pelo input:', files);
    processFiles(files);
    e.target.value = ''; // Limpar input
}

function processFiles(files) {
    console.log('Processando arquivos:', files);
    
    const validFiles = files.filter(file => {
        console.log('Verificando arquivo:', file.name, file.type, file.size);
        
        if (!CONFIG.allowedFileTypes.includes(file.type)) {
            showMessage(MESSAGES.invalidFile, 'error');
            return false;
        }
        if (file.size > CONFIG.maxFileSize) {
            showMessage('Arquivo muito grande. Máximo 10MB.', 'error');
            return false;
        }
        return true;
    });
    
    console.log('Arquivos válidos:', validFiles);
    
    const totalPhotos = selectedPhotos.length + validFiles.length;
    if (totalPhotos > CONFIG.maxPhotos) {
        const remainingSlots = CONFIG.maxPhotos - selectedPhotos.length;
        showMessage(`${MESSAGES.maxPhotos} Você pode adicionar apenas ${remainingSlots} foto(s).`, 'error');
        return;
    }
    
    validFiles.forEach(file => {
        compressAndAddPhoto(file);
    });
}

function compressAndAddPhoto(file) {
    console.log('Comprimindo foto:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calcular dimensões mantendo proporção
            let { width, height } = img;
            const maxWidth = CONFIG.imageCompression.maxWidth;
            const maxHeight = CONFIG.imageCompression.maxHeight;
            
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
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar imagem comprimida
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para blob
            canvas.toBlob(function(blob) {
                const photoData = {
                    id: Date.now() + Math.random(),
                    file: blob,
                    name: file.name,
                    url: URL.createObjectURL(blob),
                    width: width,
                    height: height
                };
                
                selectedPhotos.push(photoData);
                console.log('Foto adicionada:', photoData.name);
                updatePhotoPreview();
                updatePhotoCounter();
            }, 'image/jpeg', CONFIG.imageCompression.quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removePhoto(photoId) {
    console.log('Removendo foto:', photoId);
    selectedPhotos = selectedPhotos.filter(photo => {
        if (photo.id === photoId) {
            URL.revokeObjectURL(photo.url);
            return false;
        }
        return true;
    });
    
    updatePhotoPreview();
    updatePhotoCounter();
}

function updatePhotoPreview() {
    if (!elements.photosPreview) return;
    
    if (selectedPhotos.length === 0) {
        elements.photosPreview.classList.add('hidden');
        return;
    }
    
    elements.photosPreview.classList.remove('hidden');
    
    const photosGrid = selectedPhotos.map(photo => `
        <div class="photo-item">
            <img src="${photo.url}" alt="${photo.name}">
            <button type="button" class="remove-photo-btn" onclick="removePhoto(${photo.id})">
                ×
            </button>
        </div>
    `).join('');
    
    elements.photosPreview.innerHTML = `
        <h3>Fotos Selecionadas</h3>
        <div class="photos-grid">
            ${photosGrid}
        </div>
    `;
    
    console.log('Preview de fotos atualizado');
}

function updatePhotoCounter() {
    if (elements.photoCount) {
        elements.photoCount.textContent = selectedPhotos.length;
    }
}

// === GERAÇÃO DE PDF ===
async function generatePDF() {
    console.log('Iniciando geração de PDF...');
    
    if (!validateForm()) {
        console.log('Validação do formulário falhou');
        return;
    }
    
    setLoadingState(true);
    showMessage(MESSAGES.processing, 'info');
    
    try {
        // Verificar se jsPDF está disponível
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF não foi carregado. Verifique a conexão com a internet.');
        }
        
        console.log('jsPDF disponível, criando documento...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const dataHora = new Date();

        // Configurações do PDF baseadas no script.js
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Adicionar logo simulado (como no script.js)
        const logoWidthMm = 25;
        const logoHeightMm = 25;
        const logoMargin = 10;
        
        // Função para adicionar logo em cada página
        function addLogo(doc) {
            // Simular logo com retângulo colorido
            doc.setFillColor(30, 58, 138); // Cor azul CETEP
            doc.rect(pageWidth - logoWidthMm - logoMargin, logoMargin, logoWidthMm, logoHeightMm, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('CETEP/LNAB', pageWidth - logoWidthMm/2 - logoMargin, logoMargin + logoHeightMm/2, { align: 'center' });
        }

        addLogo(doc);

        // Header com informações (baseado no script.js)
        const turma = elements.turmaInput ? elements.turmaInput.value.trim() : '';
        const studentInputs = document.querySelectorAll('.student-input');
        const students = Array.from(studentInputs).map(input => input.value.trim()).filter(name => name);
        const titulo = students.join(', ');
        
        const headerText = `${titulo} - ${turma} - Gerado em: ${dataHora.toLocaleString()}`;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const headerTextX = 20;
        const headerTextY = 20;
        const textWidth = pageWidth - (logoWidthMm + logoMargin) - headerTextX - 10;
        const splitText = doc.splitTextToSize(headerText, textWidth);
        doc.text(splitText, headerTextX, headerTextY, { align: 'left' });

        // Adicionar fotos se existirem (usando lógica do script.js)
        if (selectedPhotos.length > 0) {
            console.log('Adicionando fotos ao PDF...');
            await addPhotosWithScriptLogic(doc, selectedPhotos);
        }
        
        // Gerar blob do PDF
        console.log('Gerando blob do PDF...');
        generatedPdfBlob = doc.output('blob');
        
        setLoadingState(false);
        showDownloadButton();
        showMessage(MESSAGES.success, 'success');
        
        console.log('PDF gerado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        setLoadingState(false);
        showMessage(`${MESSAGES.error} (${error.message})`, 'error');
    }
}

// Função que implementa a lógica do script.js para organizar fotos no PDF
async function addPhotosWithScriptLogic(doc, photos) {
    let y = 35;
    let cellWidth = 85; 
    let cellHeight;
    let margin;

    // Lógica de tamanho baseada na quantidade de fotos (como no script.js)
    if (photos.length <= 4) {
        cellHeight = 110;
        margin = 10;
    } else {
        cellHeight = 76.5;
        margin = 5;
    }

    let x = 20; 
    const cellPadding = 2;
    
    // Função para adicionar logo em novas páginas
    function addLogo(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const logoWidthMm = 25;
        const logoHeightMm = 25;
        const logoMargin = 10;
        
        doc.setFillColor(30, 58, 138);
        doc.rect(pageWidth - logoWidthMm - logoMargin, logoMargin, logoWidthMm, logoHeightMm, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('CETEP/LNAB', pageWidth - logoWidthMm/2 - logoMargin, logoMargin + logoHeightMm/2, { align: 'center' });
        doc.setTextColor(0, 0, 0);
    }
    
    for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];
        
        // Verificar se precisa de nova página
        if (doc.internal.pageSize.height < y + cellHeight + margin) {
            doc.addPage();
            addLogo(doc);
            y = 20;
            x = 20;
        }
        
        // Calcular dimensões finais da imagem mantendo proporção
        let finalWidth = cellWidth;
        let finalHeight = (photo.height * finalWidth) / photo.width;

        if (finalHeight > cellHeight) {
            finalHeight = cellHeight;
            finalWidth = (photo.width * finalHeight) / photo.height;
        }

        // Posicionar imagens em 2 colunas (como no script.js)
        if (index % 2 === 0 && index !== 0) {
            y += cellHeight + margin; 
            x = 20; 
        }
        
        // Calcular posição centralizada da imagem na célula
        const imgX = x + (cellWidth - finalWidth) / 2;
        const imgY = y + (cellHeight - finalHeight) / 2;
        
        // Desenhar borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(x - cellPadding, y - cellPadding, cellWidth + 2 * cellPadding, cellHeight + 2 * cellPadding);
        
        // Adicionar imagem
        try {
            await addImageToPDF(doc, photo.url, imgX, imgY, finalWidth, finalHeight);
            console.log(`Foto ${index + 1} adicionada ao PDF`);
        } catch (error) {
            console.error('Erro ao adicionar foto:', error);
        }
        
        // Mover para próxima posição
        x += cellWidth + margin;
    }
}

function validateForm() {
    console.log('Validando formulário...');
    
    if (!elements.turmaInput) {
        console.error('Campo turma não encontrado');
        return false;
    }
    
    const turma = elements.turmaInput.value.trim();
    const studentInputs = document.querySelectorAll('.student-input');
    const students = Array.from(studentInputs).map(input => input.value.trim());
    
    console.log('Dados do formulário:', { turma, students, fotos: selectedPhotos.length });
    
    if (!turma) {
        showMessage('Preencha o campo Turma.', 'error');
        elements.turmaInput.focus();
        return false;
    }
    
    if (students.length === 0 || students.some(name => !name)) {
        showMessage('Preencha todos os nomes dos estudantes.', 'error');
        return false;
    }
    
    // Para teste, vamos permitir gerar PDF sem fotos temporariamente
    if (selectedPhotos.length === 0) {
        console.log('Aviso: Nenhuma foto selecionada, mas continuando...');
        showMessage('Nenhuma foto foi selecionada. O PDF será gerado apenas com as informações.', 'warning');
    }
    
    console.log('Formulário válido!');
    return true;
}

function addImageToPDF(doc, imageUrl, x, y, width, height) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                doc.addImage(img, 'JPEG', x, y, width, height);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = reject;
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
    });
}

function setLoadingState(loading) {
    if (elements.generatePdfBtn) {
        elements.generatePdfBtn.disabled = loading;
    }
    
    if (elements.generateBtnText) {
        elements.generateBtnText.textContent = loading ? 'Gerando...' : 'Gerar PDF';
    }
    
    if (elements.loadingSpinner) {
        if (loading) {
            elements.loadingSpinner.classList.remove('hidden');
        } else {
            elements.loadingSpinner.classList.add('hidden');
        }
    }
}

function showDownloadButton() {
    if (elements.downloadPdfBtn) {
        elements.downloadPdfBtn.classList.remove('hidden');
        console.log('Botão de download exibido');
    }
}

// === DOWNLOAD DO PDF ===
function downloadPDF() {
    if (!generatedPdfBlob) {
        showMessage('Nenhum PDF foi gerado ainda.', 'error');
        return;
    }
    
    const turma = elements.turmaInput ? elements.turmaInput.value.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Turma';
    const dataHora = new Date();
    const dia = String(dataHora.getDate()).padStart(2, '0');
    const mes = String(dataHora.getMonth() + 1).padStart(2, '0');
    const ano = dataHora.getFullYear();
    const dataFormatada = `${dia}${mes}${ano}`;

    const turmaSanitizada = turma.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const studentInputs = document.querySelectorAll('.student-input');
    const students = Array.from(studentInputs).map(input => input.value.trim()).filter(name => name);
    const tituloSanitizado = students.join('-').replace(/\s+/g, '-').replace(/[^\w-]/g, '').substring(0, 50);
    
    const filename = `${dataFormatada}-${turmaSanitizada}-${tituloSanitizado}.pdf`;
    
    const url = URL.createObjectURL(generatedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('PDF baixado com sucesso!', 'success');
    console.log('Download do PDF concluído:', filename);
}

// === LIMPEZA DO FORMULÁRIO ===
function clearForm() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        // Limpar campos
        if (elements.form) {
            elements.form.reset();
        }
        
        // Remover estudantes extras
        if (elements.studentsContainer) {
            const studentGroups = elements.studentsContainer.querySelectorAll('.student-input-group');
            for (let i = 1; i < studentGroups.length; i++) {
                studentGroups[i].remove();
            }
        }
        
        // Limpar fotos
        selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
        selectedPhotos = [];
        
        // Resetar interface
        updatePhotoPreview();
        updatePhotoCounter();
        
        if (elements.downloadPdfBtn) {
            elements.downloadPdfBtn.classList.add('hidden');
        }
        
        generatedPdfBlob = null;
        
        showMessage('Formulário limpo com sucesso!', 'success');
        console.log('Formulário limpo');
    }
}

// === SISTEMA DE MENSAGENS ===
function showMessage(text, type = 'info') {
    if (!elements.messageContainer) return;
    
    const message = document.createElement('div');
    message.className = `message message--${type}`;
    message.textContent = text;
    
    elements.messageContainer.appendChild(message);
    console.log(`Mensagem exibida (${type}):`, text);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
    
    // Permitir fechar clicando
    message.addEventListener('click', () => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    });
}

// Tornar funções globais para uso inline no HTML
window.removePhoto = removePhoto;
