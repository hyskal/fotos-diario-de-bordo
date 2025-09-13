// Sistema de Diário de Bordo - CETEP/LNAB - Versão Firebase Limpa
const CONFIG = {
    maxPhotos: 6,
    maxStudents: 10,
    allowedFileTypes: ['image/jpeg', 'image/png'],
    maxFileSize: 10485760, // 10MB
    imageCompression: {
        maxWidth: 800,
        quality: 0.8
    },
    firebase: {
        storagePath: 'diarios/'
    }
};

// Estado da aplicação
let selectedPhotos = [];
let generatedPdfBlob = null;
let currentDownloadUrl = '';
let elements = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar Firebase carregar
    const checkFirebase = () => {
        if (window.firebaseStorage) {
            console.log('✅ Firebase disponível');
            initializeApp();
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
});

function initializeApp() {
    initializeElements();
    initializeEventListeners();
    updatePhotoCounter();
}

function initializeElements() {
    elements = {
        form: document.getElementById('diaryForm'),
        turmaInput: document.getElementById('turma'),
        studentsContainer: document.getElementById('studentsContainer'),
        addStudentBtn: document.getElementById('addStudentBtn'),
        dropZone: document.getElementById('dropZone'),
        photoInput: document.getElementById('photoInput'),
        photosPreview: document.getElementById('photosPreview'),
        photosGrid: document.getElementById('photosGrid'),
        photoCounter: document.getElementById('photoCounter'),
        generateBtn: document.getElementById('generateBtn'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        successPopup: document.getElementById('successPopup'),
        fileName: document.getElementById('fileName'),
        downloadPdfBtn: document.getElementById('downloadPdfBtn')
    };
}

function initializeEventListeners() {
    // Estudantes
    elements.addStudentBtn.addEventListener('click', addStudentField);

    // Upload de fotos
    elements.dropZone.addEventListener('click', () => elements.photoInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.photoInput.addEventListener('change', handleFileSelect);

    // Botão principal
    elements.generateBtn.addEventListener('click', generateAndSendPDF);

    // Download PDF local
    elements.downloadPdfBtn.addEventListener('click', downloadLocalPDF);

    // Drag & Drop prevention
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, e => e.preventDefault(), false);
    });
}

// === GERENCIAMENTO DE ESTUDANTES ===
function addStudentField() {
    const currentStudents = elements.studentsContainer.children.length;
    
    if (currentStudents >= CONFIG.maxStudents) {
        alert('Máximo de 10 estudantes permitidos.');
        return;
    }

    const studentDiv = document.createElement('div');
    studentDiv.className = 'student-input';
    studentDiv.innerHTML = `
        <input type="text" class="student-name" placeholder="Nome completo do estudante" required>
        <button type="button" class="remove-student-btn" onclick="removeStudent(this)">✕</button>
    `;
    
    elements.studentsContainer.appendChild(studentDiv);
    
    // Mostrar botão remover no primeiro campo também
    const firstRemoveBtn = elements.studentsContainer.children[0].querySelector('.remove-student-btn');
    if (firstRemoveBtn) {
        firstRemoveBtn.style.display = 'block';
    }
}

function removeStudent(button) {
    const studentDiv = button.parentElement;
    studentDiv.remove();
    
    // Esconder botão remover se só tem 1 estudante
    const remainingStudents = elements.studentsContainer.children.length;
    if (remainingStudents === 1) {
        const firstRemoveBtn = elements.studentsContainer.children[0].querySelector('.remove-student-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

// === GERENCIAMENTO DE FOTOS ===
function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

async function processFiles(files) {
    for (const file of files) {
        if (selectedPhotos.length >= CONFIG.maxPhotos) {
            alert('Máximo de 6 fotos permitidas.');
            break;
        }

        if (!CONFIG.allowedFileTypes.includes(file.type)) {
            alert('Tipo de arquivo não permitido. Use apenas JPG ou PNG.');
            continue;
        }

        if (file.size > CONFIG.maxFileSize) {
            alert('Arquivo muito grande. Máximo: 10MB');
            continue;
        }

        try {
            const compressedPhoto = await compressImageLocally(file);
            selectedPhotos.push(compressedPhoto);
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar imagem');
        }
    }

    updatePhotoPreview();
    updatePhotoCounter();
}

// === COMPRESSÃO LOCAL DE IMAGENS (do script-4.js) ===
function compressImageLocally(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let { width, height } = img;
            
            // Redimensionar se necessário
            if (width > CONFIG.imageCompression.maxWidth) {
                height = (height * CONFIG.imageCompression.maxWidth) / width;
                width = CONFIG.imageCompression.maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', CONFIG.imageCompression.quality);
            
            resolve({
                id: Date.now() + Math.random(),
                url: compressedDataUrl,
                width: width,
                height: height,
                name: file.name
            });
        };
        
        img.onerror = () => reject('Erro ao carregar a imagem para processamento.');
        img.src = URL.createObjectURL(file);
    });
}

function updatePhotoPreview() {
    if (selectedPhotos.length === 0) {
        elements.photosPreview.style.display = 'none';
        return;
    }

    elements.photosPreview.style.display = 'block';
    elements.photosGrid.innerHTML = '';

    selectedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.url}" alt="Foto ${index + 1}">
            <button type="button" class="remove-photo-btn" onclick="removePhoto(${photo.id})">✕</button>
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
    elements.photoCounter.textContent = `${selectedPhotos.length} / ${CONFIG.maxPhotos} fotos`;
}

// === FUNÇÃO PRINCIPAL ===
async function generateAndSendPDF() {
    if (!validateForm()) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }

    try {
        showProgress();
        
        // ETAPA 1: Gerar PDF
        updateProgressStep(1, 'active');
        updateProgressBar(50, 'Gerando PDF...');
        
        const pdfBlob = await generatePDF();
        generatedPdfBlob = pdfBlob;
        
        updateProgressStep(1, 'completed');

        // ETAPA 2: Upload Firebase
        updateProgressStep(2, 'active');
        updateProgressBar(75, 'Enviando para professor...');
        
        const downloadUrl = await uploadToFirebase(pdfBlob);
        currentDownloadUrl = downloadUrl;
        
        updateProgressStep(2, 'completed');
        updateProgressBar(100, 'Concluído!');

        // Mostrar popup de sucesso
        setTimeout(() => {
            hideProgress();
            showSuccessPopup();
        }, 1000);

    } catch (error) {
        console.error('Erro:', error);
        hideProgress();
        alert(`Erro: ${error.message}`);
    }
}

// === GERAÇÃO DE PDF (Baseado no script-4.js) ===
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dataHora = new Date();
    
    // Configurações (do script-4.js)
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidthMm = 25;
    const logoHeightMm = 25;
    const logoMargin = 10;
    
    // Função para adicionar logo (se existir)
    function addLogo(doc) {
        // Logo será adicionado aqui se disponível
        // doc.addImage(logoImg, 'PNG', pageWidth - logoWidthMm - logoMargin, logoMargin, logoWidthMm, logoHeightMm);
    }
    
    addLogo(doc);
    
    // Header com informações
    const turma = getTurma();
    const estudantes = getStudentNames();
    const headerText = `${estudantes} - ${turma} - Gerado em: ${dataHora.toLocaleString()}`;
    
    doc.setFontSize(10);
    const headerTextX = 20;
    const headerTextY = 20;
    const textWidth = pageWidth - (logoWidthMm + logoMargin) - headerTextX - 10;
    const splitText = doc.splitTextToSize(headerText, textWidth);
    doc.text(splitText, headerTextX, headerTextY, { align: 'left' });
    
    // Adicionar fotos se existirem
    if (selectedPhotos.length > 0) {
        await addPhotosToPDF(doc);
    }
    
    return doc.output('blob');
}

async function addPhotosToPDF(doc) {
    let y = 35;
    let cellWidth = 85;
    let cellHeight, margin;
    
    // Lógica do script-4.js para layout adaptativo
    if (selectedPhotos.length <= 4) {
        cellHeight = 110;
        margin = 10;
    } else {
        cellHeight = 76.5;
        margin = 5;
    }
    
    let x = 20;
    const cellPadding = 2;
    
    selectedPhotos.forEach((imageData, index) => {
        // Quebra de página se necessário
        if (doc.internal.pageSize.height < y + cellHeight + margin) {
            doc.addPage();
            y = 20;
        }
        
        // Calcular dimensões mantendo proporção
        let finalWidth = cellWidth;
        let finalHeight = (imageData.height * finalWidth) / imageData.width;
        
        if (finalHeight > cellHeight) {
            finalHeight = cellHeight;
            finalWidth = (imageData.width * finalHeight) / imageData.height;
        }
        
        // Nova linha a cada 2 fotos
        if (index % 2 === 0 && index !== 0) {
            y += cellHeight + margin;
            x = 20;
        }
        
        // Centralizar imagem na célula
        const imgX = x + (cellWidth - finalWidth) / 2;
        const imgY = y + (cellHeight - finalHeight) / 2;
        
        // Desenhar borda da célula
        doc.rect(x - cellPadding, y - cellPadding, cellWidth + 2 * cellPadding, cellHeight + 2 * cellPadding);
        
        // Adicionar imagem
        doc.addImage(imageData.url, 'JPEG', imgX, imgY, finalWidth, finalHeight);
        
        x += cellWidth + margin;
    });
}

// === UPLOAD PARA FIREBASE ===
async function uploadToFirebase(pdfBlob) {
    const fileName = generatePdfFileName();
    const filePath = CONFIG.firebase.storagePath + fileName;
    
    try {
        const storageRef = window.firebaseRef(window.firebaseStorage, filePath);
        
        const snapshot = await window.firebaseUploadBytes(storageRef, pdfBlob, {
            contentType: 'application/pdf',
            customMetadata: {
                turma: getTurma(),
                estudantes: getStudentNames(),
                data: new Date().toISOString()
            }
        });
        
        const downloadURL = await window.firebaseGetDownloadURL(snapshot.ref);
        console.log('✅ PDF enviado para Firebase:', downloadURL);
        
        return downloadURL;
        
    } catch (error) {
        console.error('❌ Erro Firebase:', error);
        throw new Error('Falha ao enviar para professor. Tente novamente.');
    }
}

// === PROGRESS E UI ===
function showProgress() {
    elements.progressContainer.style.display = 'block';
    resetProgressSteps();
}

function hideProgress() {
    elements.progressContainer.style.display = 'none';
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
    document.querySelectorAll('.progress-step').forEach(step => {
        step.className = 'progress-step';
    });
}

function showSuccessPopup() {
    const fileName = generatePdfFileName();
    elements.fileName.textContent = fileName;
    elements.successPopup.style.display = 'block';
}

function closePopup() {
    elements.successPopup.style.display = 'none';
    
    // 🧹 LIMPAR TODOS OS CAMPOS PARA NOVO ENVIO
    clearAllFields();
}

// === NOVA FUNÇÃO: LIMPAR CAMPOS COMPLETO ===
function clearAllFields() {
    // Limpar campo turma
    if (elements.turmaInput) {
        elements.turmaInput.value = '';
    }
    
    // Resetar container de estudantes para apenas 1 campo vazio
    if (elements.studentsContainer) {
        elements.studentsContainer.innerHTML = `
            <div class="student-input">
                <input type="text" class="student-name" placeholder="Nome completo do estudante" required>
                <button type="button" class="remove-student-btn" onclick="removeStudent(this)" style="display: none;">✕</button>
            </div>
        `;
    }
    
    // Limpar fotos selecionadas
    selectedPhotos = [];
    updatePhotoPreview();
    updatePhotoCounter();
    
    // Limpar input de arquivo
    if (elements.photoInput) {
        elements.photoInput.value = '';
    }
    
    // Limpar estados globais
    generatedPdfBlob = null;
    currentDownloadUrl = '';
    
    // Remover classes de drag-over se existir
    if (elements.dropZone) {
        elements.dropZone.classList.remove('drag-over');
    }
    
    // Garantir que botão está habilitado
    if (elements.generateBtn) {
        elements.generateBtn.disabled = false;
        elements.generateBtn.textContent = '🚀 Gerar PDF e Enviar para Professor';
    }
    
    // Scroll para o topo suave
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    console.log('✅ Campos limpos - Pronto para novo envio');
}


function downloadLocalPDF() {
    if (generatedPdfBlob) {
        const fileName = generatePdfFileName();
        const url = URL.createObjectURL(generatedPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// === FUNÇÕES AUXILIARES ===
function validateForm() {
    const turma = getTurma();
    const estudantes = getStudentNames();
    return turma.length > 0 && estudantes.length > 0;
}

function getTurma() {
    return elements.turmaInput.value.trim();
}

function getStudentNames() {
    const inputs = document.querySelectorAll('.student-name');
    const names = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(name => name.length > 0);
    return names.join(', ');
}

function generatePdfFileName() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const dataFormatada = `${dia}${mes}${ano}`;
    
    const turma = getTurma().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const estudantes = getStudentNames().replace(/\s+/g, '-').replace(/[^\w-]/g, '').substring(0, 30);
    
    return `${dataFormatada}-${turma}-${estudantes}.pdf`;
}

// === FUNÇÕES GLOBAIS ===
window.removeStudent = removeStudent;
window.removePhoto = removePhoto;
window.closePopup = closePopup;

console.log('✅ Sistema Diário de Bordo - Firebase Limpo inicializado');
