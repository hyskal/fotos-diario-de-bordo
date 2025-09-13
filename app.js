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
    },
    upload: {
        fileIOUrl: 'https://file.io',
        expirationDays: '14d'
    },
    emailJS: {
        serviceId: 'service_1leur7g',
        templateId: 'template_5746a4k',
        publicKey: 'rJrfwXQVQ9g6O0dDY'
    }
};

const MESSAGES = {
    success: 'PDF gerado e enviado com sucesso!',
    error: 'Erro ao processar. Verifique os dados e tente novamente.',
    maxPhotos: 'Máximo de 6 fotos permitidas.',
    invalidFile: 'Tipo de arquivo não permitido. Use apenas JPG ou PNG.',
    fillRequired: 'Preencha todos os campos obrigatórios.',
    processing: 'Processando...',
    maxStudents: 'Máximo de 10 estudantes permitidos.',
    noInternet: 'Erro de conexão. Verifique sua internet.',
    uploadError: 'Falha no upload do arquivo.',
    emailError: 'Falha ao enviar email.'
};

// Estado da aplicação
let selectedPhotos = [];
let generatedPdfBlob = null;
let elements = {};

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(CONFIG.emailJS.publicKey);
        console.log('EmailJS inicializado');
    }
    
    initializeElements();
    initializeEventListeners();
    updatePhotoCounter();
});

function initializeElements() {
    elements = {
        form: document.getElementById('diaryForm'),
        turmaInput: document.getElementById('turma'),
        professorEmailInput: document.getElementById('professorEmail'),
        studentsContainer: document.getElementById('studentsContainer'),
        addStudentBtn: document.getElementById('addStudentBtn'),
        dropZone: document.getElementById('dropZone'),
        photoInput: document.getElementById('photoInput'),
        selectPhotosBtn: document.getElementById('selectPhotosBtn'),
        photosPreview: document.getElementById('photosPreview'),
        photosGrid: document.getElementById('photosGrid'),
        photoCount: document.getElementById('photoCount'),
        generateAndSendBtn: document.getElementById('generateAndSendBtn'),
        generateBtnText: document.getElementById('generateBtnText'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        clearFormBtn: document.getElementById('clearFormBtn'),
        messageContainer: document.getElementById('messageContainer'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        progressSteps: document.getElementById('progressSteps'),
        successPopup: document.getElementById('successPopup'),
        sentToEmail: document.getElementById('sentToEmail'),
        emailSubject: document.getElementById('emailSubject')
    };
    
    console.log('Elementos inicializados:', elements);
}

function initializeEventListeners() {
    // Estudantes
    if (elements.addStudentBtn) {
        elements.addStudentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addStudentField();
        });
    }

    // Upload de fotos
    if (elements.selectPhotosBtn && elements.photoInput) {
        elements.selectPhotosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            elements.photoInput.click();
        });
    }

    if (elements.photoInput) {
        elements.photoInput.addEventListener('change', handleFileSelect);
    }

    // Drag and drop
    if (elements.dropZone) {
        elements.dropZone.addEventListener('click', function(e) {
            e.preventDefault();
            elements.photoInput.click();
        });

        elements.dropZone.addEventListener('dragover', handleDragOver);
        elements.dropZone.addEventListener('dragleave', handleDragLeave);
        elements.dropZone.addEventListener('drop', handleDrop);
    }

    // Ação principal - GERAR E ENVIAR
    if (elements.generateAndSendBtn) {
        elements.generateAndSendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateAndSendPDF();
        });
    }

    if (elements.clearFormBtn) {
        elements.clearFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearForm();
        });
    }

    // Event listener para remover primeiro estudante
    const firstRemoveBtn = document.querySelector('.remove-student-btn');
    if (firstRemoveBtn) {
        firstRemoveBtn.addEventListener('click', function() {
            this.parentElement.remove();
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

    if (currentStudents >= CONFIG.maxStudents) {
        showMessage(MESSAGES.maxStudents, 'error');
        return;
    }

    const studentGroup = document.createElement('div');
    studentGroup.className = 'student-input-group';
    studentGroup.innerHTML = `
        <div class="form-group">
            <label class="form-label">Nome do Estudante</label>
            <input type="text" class="form-control student-name" placeholder="Digite o nome completo" required>
        </div>
        <button type="button" class="remove-student-btn">
            Remover
        </button>
    `;

    elements.studentsContainer.appendChild(studentGroup);

    // Event listener para remover estudante
    const removeBtn = studentGroup.querySelector('.remove-student-btn');
    removeBtn.addEventListener('click', function() {
        studentGroup.remove();
    });
}

// === GERENCIAMENTO DE FOTOS ===
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function handleDragOver(e) {
    elements.dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    elements.dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    elements.dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

async function processFiles(files) {
    for (const file of files) {
        if (selectedPhotos.length >= CONFIG.maxPhotos) {
            showMessage(MESSAGES.maxPhotos, 'error');
            break;
        }

        if (!CONFIG.allowedFileTypes.includes(file.type)) {
            showMessage(MESSAGES.invalidFile, 'error');
            continue;
        }

        if (file.size > CONFIG.maxFileSize) {
            showMessage('Arquivo muito grande. Máximo: 10MB', 'error');
            continue;
        }

        try {
            const compressedPhoto = await compressImage(file);
            selectedPhotos.push(compressedPhoto);
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            showMessage('Erro ao processar imagem', 'error');
        }
    }

    updatePhotoPreview();
    updatePhotoCounter();
}

async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            const { maxWidth, maxHeight, quality } = CONFIG.imageCompression;
            
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => {
                const compressedPhoto = {
                    id: Date.now() + Math.random(),
                    file: blob,
                    name: file.name,
                    url: URL.createObjectURL(blob),
                    width: width,
                    height: height
                };
                resolve(compressedPhoto);
            }, 'image/jpeg', quality);
        };

        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function updatePhotoPreview() {
    if (!elements.photosPreview || !elements.photosGrid) return;

    if (selectedPhotos.length === 0) {
        elements.photosPreview.classList.add('hidden');
        return;
    }

    elements.photosPreview.classList.remove('hidden');
    elements.photosGrid.innerHTML = '';

    selectedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.url}" alt="Foto ${index + 1}">
            <button type="button" class="remove-photo-btn" onclick="removePhoto(${photo.id})">
                ×
            </button>
        `;
        elements.photosGrid.appendChild(photoItem);
    });
}

function removePhoto(photoId) {
    selectedPhotos = selectedPhotos.filter(photo => photo.id !== photoId);
    updatePhotoPreview();
    updatePhotoCounter();
}

function updatePhotoCounter() {
    if (elements.photoCount) {
        elements.photoCount.textContent = `${selectedPhotos.length} / ${CONFIG.maxPhotos}`;
    }
}

// === FUNÇÃO PRINCIPAL: GERAR E ENVIAR ===
async function generateAndSendPDF() {
    if (!validateForm()) {
        showMessage(MESSAGES.fillRequired, 'error');
        return;
    }

    try {
        // Mostrar loading
        setLoadingState(true);
        showProgress();

        // ETAPA 1: Gerar PDF
        updateProgressStep(1, 'active');
        updateProgressBar(20, 'Gerando PDF...');
        
        const pdfBlob = await generatePDF();
        generatedPdfBlob = pdfBlob;
        
        updateProgressStep(1, 'completed');
        updateProgressBar(40, 'PDF gerado com sucesso!');

        // ETAPA 2: Upload para servidor
        updateProgressStep(2, 'active');
        updateProgressBar(60, 'Enviando arquivo para servidor...');
        
        const downloadLink = await uploadToFileIO(pdfBlob);
        
        updateProgressStep(2, 'completed');
        updateProgressBar(80, 'Arquivo enviado!');

        // ETAPA 3: Enviar email
        updateProgressStep(3, 'active');
        updateProgressBar(90, 'Enviando email...');
        
        await sendAutomaticEmail(downloadLink);
        
        updateProgressStep(3, 'completed');
        updateProgressBar(100, 'Concluído!');

        // Mostrar popup de sucesso
        setTimeout(() => {
            hideProgress();
            setLoadingState(false);
            showSuccessPopup(downloadLink);
        }, 1000);

    } catch (error) {
        console.error('Erro no processo:', error);
        hideProgress();
        setLoadingState(false);
        showMessage(`Erro: ${error.message}`, 'error');
    }
}

// === GERAÇÃO DE PDF ===
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Configurações
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Header
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('DIÁRIO DE BORDO - CETEP/LNAB', pageWidth / 2, 30, { align: 'center' });

    // Informações
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    const turma = getTurma();
    const studentNames = getStudentNames();
    const dateTime = new Date().toLocaleString('pt-BR');

    pdf.text(`Turma: ${turma}`, margin, 50);
    pdf.text(`Estudantes: ${studentNames}`, margin, 60);
    pdf.text(`Data/Hora: ${dateTime}`, margin, 70);

    // Fotos
    if (selectedPhotos.length > 0) {
        await addPhotosToPDF(pdf, margin, 90);
    }

    return pdf.output('blob');
}

async function addPhotosToPDF(pdf, startX, startY) {
    const photosPerRow = 2;
    const photoWidth = 85;
    const photoHeight = selectedPhotos.length <= 4 ? 110 : 76.5;
    const spacing = selectedPhotos.length <= 4 ? 10 : 5;

    let x = startX;
    let y = startY;
    let photosInCurrentRow = 0;

    for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        
        try {
            pdf.addImage(photo.url, 'JPEG', x, y, photoWidth, photoHeight);
            
            photosInCurrentRow++;
            
            if (photosInCurrentRow >= photosPerRow) {
                x = startX;
                y += photoHeight + spacing;
                photosInCurrentRow = 0;
                
                if (y + photoHeight > pdf.internal.pageSize.getHeight() - 20) {
                    pdf.addPage();
                    y = 20;
                }
            } else {
                x += photoWidth + spacing;
            }
            
        } catch (error) {
            console.error('Erro ao adicionar foto ao PDF:', error);
        }
    }
}

// === UPLOAD PARA FILE.IO ===
async function uploadToFileIO(pdfBlob) {
    const fileName = generatePdfFileName();
    const formData = new FormData();
    formData.append('file', pdfBlob, fileName);

    try {
        const response = await fetch(`${CONFIG.upload.fileIOUrl}?expires=${CONFIG.upload.expirationDays}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.link;
        } else {
            throw new Error(result.message || 'Erro desconhecido no upload');
        }
        
    } catch (error) {
        console.error('Erro no upload:', error);
        throw new Error(MESSAGES.uploadError);
    }
}

// === EMAIL AUTOMÁTICO ===
async function sendAutomaticEmail(downloadLink) {
    const turma = getTurma();
    const estudantes = getStudentNames();
    const professorEmail = getProfessorEmail();
    const subject = `${turma} - ${estudantes}`;
    
    const emailBody = `Prezado Professor,

Segue o diário de bordo da turma ${turma}.

Estudantes: ${estudantes}
Data: ${new Date().toLocaleString('pt-BR')}

Link para download: ${downloadLink}

Este link expira em 14 dias ou após o primeiro download.

Atenciosamente,
Sistema CETEP/LNAB`;

    const templateParams = {
        to_email: professorEmail,
        subject: subject,
        message: emailBody,
        turma: turma,
        estudantes: estudantes,
        download_link: downloadLink,
        data: new Date().toLocaleString('pt-BR')
    };

    try {
        const response = await emailjs.send(
            CONFIG.emailJS.serviceId,
            CONFIG.emailJS.templateId,
            templateParams
        );
        
        console.log('Email enviado com sucesso:', response);
        return { success: true, subject, professorEmail };
        
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw new Error(MESSAGES.emailError);
    }
}

// === FUNÇÕES DE PROGRESS E UI ===
function showProgress() {
    elements.progressContainer.classList.remove('hidden');
    resetProgressSteps();
}

function hideProgress() {
    elements.progressContainer.classList.add('hidden');
}

function updateProgressBar(percent, text) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${percent}%`;
}

function updateProgressStep(stepNumber, status) {
    const step = document.getElementById(`step${stepNumber}`);
    if (step) {
        step.className = `progress-step ${status}`;
    }
}

function resetProgressSteps() {
    const steps = elements.progressSteps.querySelectorAll('.progress-step');
    steps.forEach(step => {
        step.className = 'progress-step';
    });
}

// === POPUP DE SUCESSO ===
function showSuccessPopup(downloadLink) {
    const professorEmail = getProfessorEmail();
    const subject = `${getTurma()} - ${getStudentNames()}`;
    
    elements.sentToEmail.textContent = professorEmail;
    elements.emailSubject.textContent = subject;
    elements.successPopup.classList.remove('hidden');
    
    // Auto-fechar após 10 segundos
    setTimeout(() => {
        closeSuccessPopup();
    }, 10000);
}

function closeSuccessPopup() {
    elements.successPopup.classList.add('hidden');
}

// === FUNÇÕES AUXILIARES ===
function validateForm() {
    const turma = getTurma();
    const students = getStudentNames();
    const professorEmail = getProfessorEmail();
    
    return turma.length > 0 && students.length > 0 && professorEmail.length > 0;
}

function getTurma() {
    return elements.turmaInput?.value.trim() || '';
}

function getProfessorEmail() {
    return elements.professorEmailInput?.value.trim() || '';
}

function getStudentNames() {
    const studentInputs = document.querySelectorAll('.student-input-group input[type="text"]');
    const names = Array.from(studentInputs)
        .map(input => input.value.trim())
        .filter(name => name.length > 0);
    return names.join(', ');
}

function generatePdfFileName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const turma = getTurma().replace(/[^a-zA-Z0-9]/g, '-');
    const students = getStudentNames().substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-');
    
    return `${day}${month}${year}-${turma}-${students}.pdf`;
}

function setLoadingState(isLoading) {
    if (elements.generateAndSendBtn) {
        elements.generateAndSendBtn.disabled = isLoading;
    }
    
    if (elements.generateBtnText) {
        elements.generateBtnText.textContent = isLoading ? 'Processando...' : '🚀 Gerar PDF e Enviar';
    }
    
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }
}

function showMessage(message, type) {
    if (!elements.messageContainer) {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        document.body.appendChild(container);
        elements.messageContainer = container;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message message--${type}`;
    messageElement.textContent = message;

    elements.messageContainer.appendChild(messageElement);

    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

function clearForm() {
    // Limpar campos
    if (elements.turmaInput) elements.turmaInput.value = '';
    if (elements.professorEmailInput) elements.professorEmailInput.value = '';
    
    // Limpar estudantes
    if (elements.studentsContainer) {
        elements.studentsContainer.innerHTML = `
            <div class="student-input-group">
                <div class="form-group">
                    <label class="form-label">Nome do Estudante</label>
                    <input type="text" class="form-control student-name" placeholder="Digite o nome completo" required>
                </div>
                <button type="button" class="remove-student-btn">
                    Remover
                </button>
            </div>
        `;
        
        // Re-adicionar event listener
        const firstRemoveBtn = elements.studentsContainer.querySelector('.remove-student-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.addEventListener('click', function() {
                this.parentElement.remove();
            });
        }
    }
    
    // Limpar fotos
    selectedPhotos = [];
    updatePhotoPreview();
    updatePhotoCounter();
    
    // Limpar estado
    generatedPdfBlob = null;
    hideProgress();
    
    showMessage('Formulário limpo', 'success');
}

// === FUNÇÕES GLOBAIS ===
window.removePhoto = removePhoto;
window.closeSuccessPopup = closeSuccessPopup;

console.log('Sistema Diário de Bordo inicializado com fluxo automático');
