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
                    url: URL.createObjectURL(blob)
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
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        // Configurações do PDF
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // Header com logo e título
        await addHeaderToPDF(pdf, margin, contentWidth, pageWidth);
        
        // Informações da turma e estudantes
        let yPosition = await addTurmaInfoToPDF(pdf, margin, 60);
        yPosition = await addStudentsInfoToPDF(pdf, margin, yPosition + 10);
        
        // Adicionar fotos se existirem
        if (selectedPhotos.length > 0) {
            console.log('Adicionando fotos ao PDF...');
            await addPhotosToPDF(pdf, margin, yPosition + 15, contentWidth);
        }
        
        // Gerar blob do PDF
        console.log('Gerando blob do PDF...');
        generatedPdfBlob = pdf.output('blob');
        
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

async function addHeaderToPDF(pdf, margin, contentWidth, pageWidth) {
    // Logo (simulado com texto)
    pdf.setFillColor(30, 58, 138); // Cor azul CETEP
    pdf.rect(pageWidth - margin - 40, margin, 35, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('CETEP/LNAB', pageWidth - margin - 37, margin + 8);
    
    // Título
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Diário de Bordo', margin, margin + 15);
    
    // Data
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const hoje = new Date().toLocaleDateString('pt-BR');
    pdf.text(`Data: ${hoje}`, margin, margin + 25);
    
    console.log('Header adicionado ao PDF');
}

async function addTurmaInfoToPDF(pdf, margin, yPosition) {
    const turma = elements.turmaInput ? elements.turmaInput.value.trim() : '';
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Turma:', margin, yPosition);
    
    pdf.setFont(undefined, 'normal');
    pdf.text(turma, margin + 20, yPosition);
    
    console.log('Info da turma adicionada ao PDF');
    return yPosition;
}

async function addStudentsInfoToPDF(pdf, margin, yPosition) {
    const studentInputs = document.querySelectorAll('.student-input');
    const students = Array.from(studentInputs).map(input => input.value.trim());
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Estudantes:', margin, yPosition);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    
    let currentY = yPosition + 7;
    students.forEach((student, index) => {
        pdf.text(`${index + 1}. ${student}`, margin + 5, currentY);
        currentY += 5;
    });
    
    console.log('Info dos estudantes adicionada ao PDF');
    return currentY;
}

async function addPhotosToPDF(pdf, margin, yPosition, contentWidth) {
    const photosPerRow = selectedPhotos.length <= 4 ? 2 : 2;
    const photoWidth = (contentWidth - 10) / photosPerRow;
    const photoHeight = photoWidth * 0.75; // Proporção 4:3
    
    let x = margin;
    let y = yPosition;
    let photosInCurrentRow = 0;
    
    for (let i = 0; i < selectedPhotos.length; i++) {
        if (photosInCurrentRow === photosPerRow) {
            x = margin;
            y += photoHeight + 10;
            photosInCurrentRow = 0;
        }
        
        try {
            await addImageToPDF(pdf, selectedPhotos[i].url, x, y, photoWidth, photoHeight);
            console.log(`Foto ${i + 1} adicionada ao PDF`);
        } catch (error) {
            console.error('Erro ao adicionar foto:', error);
        }
        
        x += photoWidth + 10;
        photosInCurrentRow++;
    }
}

function addImageToPDF(pdf, imageUrl, x, y, width, height) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                pdf.addImage(img, 'JPEG', x, y, width, height);
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
    const hoje = new Date().toISOString().split('T')[0];
    const filename = `Diario_${turma}_${hoje}.pdf`;
    
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