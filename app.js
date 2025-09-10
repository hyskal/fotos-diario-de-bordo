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

// === CONFIGURAÇÕES DE COMPARTILHAMENTO ===
const SHARE_CONFIG = {
    fileIO: {
        url: 'https://file.io',
        defaultExpires: '14d'
    },
    emailJS: {
        serviceId: 'service_1leur7g',      // SEU SERVICE ID
        templateId: 'template_5746a4k',   // SEU TEMPLATE ID
        publicKey: 'rJrfwXQVQ9g6O0dDY'   // SUA PUBLIC KEY
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
let shareLink = null;
let isUploading = false;

// Elementos DOM
let elements = {};

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(SHARE_CONFIG.emailJS.publicKey);
        console.log('EmailJS inicializado com suas credenciais');
    }
    
    initializeElements();
    initializeEventListeners();
    updatePhotoCounter();
});

function initializeElements() {
    elements = {
        // Elementos existentes
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
        messageContainer: document.getElementById('messageContainer'),
        
        // NOVOS ELEMENTOS PARA COMPARTILHAMENTO
        shareOptions: document.getElementById('shareOptions'),
        shareStatus: document.getElementById('shareStatus'),
        emailForm: document.getElementById('emailForm'),
        senderEmail: document.getElementById('senderEmail'),
        teacherEmail: document.getElementById('teacherEmail'),
        emailMessage: document.getElementById('emailMessage'),
        uploadResult: document.getElementById('uploadResult'),
        shareLink: document.getElementById('shareLink'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        progressLabel: document.getElementById('progressLabel')
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

            // Calcular novas dimensões mantendo proporção
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
    if (!elements.photosPreview) return;

    if (selectedPhotos.length === 0) {
        elements.photosPreview.classList.add('hidden');
        return;
    }

    elements.photosPreview.classList.remove('hidden');
    
    const photosGrid = elements.photosPreview.querySelector('.photos-grid') || 
                      createPhotosGrid();

    photosGrid.innerHTML = '';

    selectedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.url}" alt="Foto ${index + 1}">
            <button type="button" class="remove-photo-btn" onclick="removePhoto(${photo.id})">
                ×
            </button>
        `;
        photosGrid.appendChild(photoItem);
    });
}

function createPhotosGrid() {
    const photosGrid = document.createElement('div');
    photosGrid.className = 'photos-grid';
    elements.photosPreview.appendChild(photosGrid);
    return photosGrid;
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

// === GERAÇÃO DE PDF ===
async function generatePDF() {
    if (!validateForm()) {
        showMessage(MESSAGES.fillRequired, 'error');
        return;
    }

    setLoadingState(true);

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Configurações
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;

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

        // Gerar blob e download
        generatedPdfBlob = pdf.output('blob');
        const fileName = generatePdfFileName();
        
        // Download local
        const link = document.createElement('a');
        link.href = URL.createObjectURL(generatedPdfBlob);
        link.download = fileName;
        link.click();

        showMessage(MESSAGES.success, 'success');
        showShareOptions();

    } catch (error) {
        console.error('Erro:', error);
        showMessage(MESSAGES.error, 'error');
    } finally {
        setLoadingState(false);
    }
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
            // Adicionar imagem ao PDF
            pdf.addImage(photo.url, 'JPEG', x, y, photoWidth, photoHeight);
            
            photosInCurrentRow++;
            
            if (photosInCurrentRow >= photosPerRow) {
                // Nova linha
                x = startX;
                y += photoHeight + spacing;
                photosInCurrentRow = 0;
                
                // Verificar se precisa de nova página
                if (y + photoHeight > pdf.internal.pageSize.getHeight() - 20) {
                    pdf.addPage();
                    y = 20;
                }
            } else {
                // Próxima coluna
                x += photoWidth + spacing;
            }
            
        } catch (error) {
            console.error('Erro ao adicionar foto ao PDF:', error);
        }
    }
}

function validateForm() {
    const turma = getTurma();
    const students = getStudentNames();
    
    return turma.length > 0 && students.length > 0;
}

function setLoadingState(isLoading) {
    if (elements.generatePdfBtn) {
        elements.generatePdfBtn.disabled = isLoading;
    }
    
    if (elements.generateBtnText) {
        elements.generateBtnText.textContent = isLoading ? 'Processando...' : 'Gerar PDF';
    }
    
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }
}

function downloadPDF() {
    if (!generatedPdfBlob) {
        showMessage('Nenhum PDF gerado ainda', 'error');
        return;
    }
    
    const fileName = generatePdfFileName();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(generatedPdfBlob);
    link.download = fileName;
    link.click();
}

// === COMPARTILHAMENTO ===
function showShareOptions() {
    if (elements.shareOptions) {
        elements.shareOptions.style.display = 'block';
        elements.shareStatus.className = 'share-status ready';
        elements.shareStatus.textContent = '✅ PDF gerado! Escolha como compartilhar:';
    }
    
    // Verificar se Web Share API está disponível
    const webShareOption = document.getElementById('webShareOption');
    if (webShareOption) {
        if (navigator.share) {
            webShareOption.style.display = 'block';
        } else {
            webShareOption.style.display = 'none';
        }
    }
}

// === WEB SHARE API ===
async function shareNatively() {
    if (!generatedPdfBlob) {
        showMessage('Nenhum PDF gerado ainda', 'error');
        return;
    }
    
    if (navigator.share) {
        try {
            const fileName = generatePdfFileName();
            const file = new File([generatedPdfBlob], fileName, { type: 'application/pdf' });
            
            await navigator.share({
                title: `Diário de Bordo - ${getTurma()}`,
                text: `Diário de bordo da turma ${getTurma()} - ${getStudentNames()}`,
                files: [file]
            });
            
            showMessage('📱 Compartilhado com sucesso!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erro ao compartilhar:', error);
                showMessage('❌ Erro ao compartilhar', 'error');
            }
        }
    } else {
        showMessage('Web Share não disponível neste navegador', 'warning');
    }
}

// === FILE.IO UPLOAD ===
async function uploadToFileIO() {
    if (!generatedPdfBlob) {
        showMessage('Nenhum PDF gerado ainda', 'error');
        return;
    }
    
    if (isUploading) {
        showMessage('Upload em andamento...', 'warning');
        return;
    }
    
    isUploading = true;
    showProgress('Enviando para File.io...', 0);
    
    try {
        const fileName = generatePdfFileName();
        const formData = new FormData();
        formData.append('file', generatedPdfBlob, fileName);
        
        const response = await fetch(`${SHARE_CONFIG.fileIO.url}?expires=${SHARE_CONFIG.fileIO.defaultExpires}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            shareLink = result.link;
            showUploadResult(result.link, SHARE_CONFIG.fileIO.defaultExpires);
            showMessage('🌐 Link gerado com sucesso!', 'success');
        } else {
            throw new Error(result.message || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('Erro no upload:', error);
        showMessage(`❌ Erro no upload: ${error.message}`, 'error');
    } finally {
        isUploading = false;
        hideProgress();
    }
}

// === EMAILJS COM SUAS CREDENCIAIS ===
function showEmailForm() {
    if (elements.emailForm) {
        elements.emailForm.classList.remove('hidden');
    }
    
    // Pre-preencher com dados salvos
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail && elements.senderEmail) {
        elements.senderEmail.value = savedEmail;
    }
}

function hideEmailForm() {
    if (elements.emailForm) {
        elements.emailForm.classList.add('hidden');
    }
}

async function sendViaEmail() {
    const senderEmail = elements.senderEmail?.value.trim() || '';
    const teacherEmail = elements.teacherEmail?.value.trim() || '';
    const message = elements.emailMessage?.value.trim() || '';
    
    // Validações
    if (!senderEmail || !teacherEmail) {
        showMessage('Por favor, preencha os emails obrigatórios', 'error');
        return;
    }
    
    // Verificar se há link do File.io ou gerar um
    let linkToSend = shareLink;
    if (!linkToSend) {
        showMessage('Gerando link para envio...', 'info');
        await uploadToFileIO();
        linkToSend = shareLink;
        
        if (!linkToSend) {
            showMessage('❌ Erro ao gerar link. Tente novamente.', 'error');
            return;
        }
    }
    
    // Salvar email do usuário
    localStorage.setItem('user_email', senderEmail);
    
    // Preparar dados do email
    const studentNames = getStudentNames();
    const turma = getTurma();
    const emailTitle = `${turma} - ${studentNames}`;
    
    const emailBody = `Olá,

Segue o diário de bordo da turma ${turma}.

Estudantes: ${studentNames}

Link para download: ${linkToSend}

${message ? `Mensagem adicional:\n${message}` : ''}

---
Este link expira em 14 dias ou após o primeiro download.
Sistema de Diário de Bordo - CETEP/LNAB`;

    // Parâmetros para EmailJS
    const templateParams = {
        from_email: senderEmail,
        to_email: teacherEmail,
        subject: emailTitle,
        message: emailBody,
        student_names: studentNames,
        turma: turma,
        download_link: linkToSend
    };
    
    try {
        showProgress('Enviando email...', 50);
        
        const response = await emailjs.send(
            SHARE_CONFIG.emailJS.serviceId,    // service_1leur7g
            SHARE_CONFIG.emailJS.templateId,   // template_5746a4k
            templateParams,
            SHARE_CONFIG.emailJS.publicKey     // rJrfwXQVQ9g6O0dDY
        );
        
        console.log('Email enviado com sucesso:', response);
        showMessage('📧 Email enviado com sucesso!', 'success');
        hideEmailForm();
        
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        
        // Tratamento específico para erro 412
        if (error.status === 412) {
            showMessage('❌ Erro de autenticação. Reconecte sua conta Gmail no EmailJS', 'error');
        } else {
            showMessage(`❌ Erro ao enviar email: ${error.text || error.message || 'Tente novamente'}`, 'error');
        }
    } finally {
        hideProgress();
    }
}

// === FUNÇÕES AUXILIARES ===
function getTurma() {
    return elements.turmaInput?.value.trim() || '';
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

function showUploadResult(link, expires) {
    if (elements.uploadResult && elements.shareLink) {
        elements.shareLink.value = link;
        const expirationTime = document.getElementById('expirationTime');
        if (expirationTime) {
            expirationTime.textContent = expires === '14d' ? '14 dias' : expires;
        }
        elements.uploadResult.classList.remove('hidden');
    }
}

function copyLink() {
    if (elements.shareLink) {
        elements.shareLink.select();
        document.execCommand('copy');
        showMessage('📋 Link copiado!', 'success');
        
        // Para navegadores modernos
        if (navigator.clipboard) {
            navigator.clipboard.writeText(elements.shareLink.value);
        }
    }
}

function showProgress(label, percent) {
    if (elements.progressContainer) {
        elements.progressContainer.classList.remove('hidden');
        if (elements.progressFill) elements.progressFill.style.width = `${percent}%`;
        if (elements.progressText) elements.progressText.textContent = `${percent}%`;
        if (elements.progressLabel) elements.progressLabel.textContent = label;
    }
}

function hideProgress() {
    if (elements.progressContainer) {
        elements.progressContainer.classList.add('hidden');
    }
}

function showMessage(message, type) {
    if (!elements.messageContainer) {
        // Criar container se não existir
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

    // Auto remove após 5 segundos
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

function clearForm() {
    // Limpar campos
    if (elements.turmaInput) elements.turmaInput.value = '';
    
    // Limpar estudantes
    if (elements.studentsContainer) {
        elements.studentsContainer.innerHTML = '';
    }
    
    // Limpar fotos
    selectedPhotos = [];
    updatePhotoPreview();
    updatePhotoCounter();
    
    // Limpar PDF gerado
    generatedPdfBlob = null;
    shareLink = null;
    
    // Esconder opções de compartilhamento
    if (elements.shareOptions) {
        elements.shareOptions.style.display = 'none';
    }
    
    showMessage('Formulário limpo', 'success');
}

// === FUNÇÃO DE TESTE ===
function testEmailJSConnection() {
    const testParams = {
        from_email: 'teste@exemplo.com',
        to_email: 'seuemail@gmail.com', // Substitua pelo seu email para teste
        subject: 'Teste EmailJS - CETEP',
        message: 'Este é um email de teste do sistema de diário de bordo.\n\nSe você recebeu este email, a configuração está funcionando!\n\nCredenciais utilizadas:\nService ID: service_1leur7g\nTemplate ID: template_5746a4k\nPublic Key: rJrfwXQVQ9g6O0dDY'
    };
    
    emailjs.send(
        SHARE_CONFIG.emailJS.serviceId,
        SHARE_CONFIG.emailJS.templateId,
        testParams,
        SHARE_CONFIG.emailJS.publicKey
    )
    .then((response) => {
        console.log('Teste enviado com sucesso:', response);
        alert('✅ Email de teste enviado! Verifique sua caixa de entrada.');
    })
    .catch((error) => {
        console.error('Erro no teste:', error);
        alert(`❌ Erro no teste: ${error.text || error.message}`);
    });
}

// Tornar função disponível globalmente para teste
window.testEmailJSConnection = testEmailJSConnection;

// === FUNÇÕES GLOBAIS PARA HTML ===
window.shareNatively = shareNatively;
window.uploadToFileIO = uploadToFileIO;
window.showEmailForm = showEmailForm;
window.hideEmailForm = hideEmailForm;
window.sendViaEmail = sendViaEmail;
window.copyLink = copyLink;
window.removePhoto = removePhoto;
