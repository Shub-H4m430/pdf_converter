
const uploadAreaImages = document.getElementById('uploadAreaImages');
const uploadAreaPdfs = document.getElementById('uploadAreaPdfs');
const imageInput = document.getElementById('imageInput');
const pdfInput = document.getElementById('pdfInput');
const selectedImages = document.getElementById('selectedImages');
const selectedPdfs = document.getElementById('selectedPdfs');
const imagesFilesList = document.getElementById('imagesFilesList');
const pdfsFilesList = document.getElementById('pdfsFilesList');
const uploadImagesForm = document.getElementById('uploadImagesForm');
const mergePdfsForm = document.getElementById('mergePdfsForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingMessage = document.getElementById('loadingMessage');
const convertImagesBtn = document.getElementById('convertImagesBtn');
const mergePdfsBtn = document.getElementById('mergePdfsBtn');

// File management
let imagesArray = [];
let pdfsArray = [];
let currentTab = 'images';

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    animateOnLoad();
});

function initializeEventListeners() {
    // Tab switching - make functions global
    window.switchTab = switchTab;
    window.clearFiles = clearFiles;
    window.removeFile = removeFile;
    
    // Click to browse files - Images
    if (uploadAreaImages && imageInput) {
        uploadAreaImages.addEventListener('click', () => imageInput.click());
    }
    
    // Click to browse files - PDFs
    if (uploadAreaPdfs && pdfInput) {
        uploadAreaPdfs.addEventListener('click', () => pdfInput.click());
    }
    
    // File input changes
    if (imageInput) {
        imageInput.addEventListener('change', (e) => handleFileSelect(e, 'images'));
    }
    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => handleFileSelect(e, 'pdfs'));
    }
    
    // Drag and drop events - Images
    if (uploadAreaImages) {
        uploadAreaImages.addEventListener('dragover', (e) => handleDragOver(e, 'images'));
        uploadAreaImages.addEventListener('dragleave', (e) => handleDragLeave(e, 'images'));
        uploadAreaImages.addEventListener('drop', (e) => handleDrop(e, 'images'));
    }
    
    // Drag and drop events - PDFs
    if (uploadAreaPdfs) {
        uploadAreaPdfs.addEventListener('dragover', (e) => handleDragOver(e, 'pdfs'));
        uploadAreaPdfs.addEventListener('dragleave', (e) => handleDragLeave(e, 'pdfs'));
        uploadAreaPdfs.addEventListener('drop', (e) => handleDrop(e, 'pdfs'));
    }
    
    // Form submissions
    if (uploadImagesForm) {
        uploadImagesForm.addEventListener('submit', (e) => handleFormSubmit(e, 'images'));
    }
    if (mergePdfsForm) {
        mergePdfsForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pdfs'));
    }
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (uploadAreaImages) {
            uploadAreaImages.addEventListener(eventName, preventDefaults, false);
        }
        if (uploadAreaPdfs) {
            uploadAreaPdfs.addEventListener(eventName, preventDefaults, false);
        }
        document.body.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function switchTab(tab, button) {
    currentTab = tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Show/hide sections
    const imagesSection = document.getElementById('images-section');
    const mergeSection = document.getElementById('merge-section');
    
    if (imagesSection) {
        imagesSection.style.display = tab === 'images' ? 'block' : 'none';
    }
    if (mergeSection) {
        mergeSection.style.display = tab === 'merge' ? 'block' : 'none';
    }
}

function handleDragOver(e, type) {
    const uploadArea = type === 'images' ? uploadAreaImages : uploadAreaPdfs;
    if (uploadArea) {
        uploadArea.classList.add('dragover');
    }
}

function handleDragLeave(e, type) {
    const uploadArea = type === 'images' ? uploadAreaImages : uploadAreaPdfs;
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
}

function handleDrop(e, type) {
    const uploadArea = type === 'images' ? uploadAreaImages : uploadAreaPdfs;
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
    const files = e.dataTransfer.files;
    handleFiles(files, type);
}

function handleFileSelect(e, type) {
    const files = e.target.files;
    handleFiles(files, type);
}

function handleFiles(files, type) {
    const validFiles = Array.from(files).filter(file => {
        if (type === 'images') {
            if (file.type.startsWith('image/')) {
                return true;
            } else {
                showNotification(`${file.name} is not a valid image file`, 'error');
                return false;
            }
        } else if (type === 'pdfs') {
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                return true;
            } else {
                showNotification(`${file.name} is not a valid PDF file`, 'error');
                return false;
            }
        }
        return false;
    });
    
    if (validFiles.length > 0) {
        if (type === 'images') {
            imagesArray = [...imagesArray, ...validFiles];
            updateFilesList('images');
            showSelectedFiles('images');
        } else if (type === 'pdfs') {
            pdfsArray = [...pdfsArray, ...validFiles];
            updateFilesList('pdfs');
            showSelectedFiles('pdfs');
        }
    }
}

function updateFilesList(type) {
    const filesList = type === 'images' ? imagesFilesList : pdfsFilesList;
    const filesArray = type === 'images' ? imagesArray : pdfsArray;
    
    if (!filesList) return;
    
    filesList.innerHTML = '';
    
    filesArray.forEach((file, index) => {
        const fileItem = createFileItem(file, index, type);
        filesList.appendChild(fileItem);
    });
    
    // Update form data
    updateFormData(type);
}

function createFileItem(file, index, type) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.style.animation = 'fadeIn 0.3s ease-out';
    
    const fileSize = formatFileSize(file.size);
    const fileIcon = getFileIcon(file.type);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="${fileIcon}"></i>
            </div>
            <div class="file-details">
                <h5>${file.name}</h5>
                <small>${fileSize}</small>
            </div>
        </div>
        <button type="button" class="remove-file" onclick="removeFile(${index}, '${type}')" title="Remove file">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    return fileItem;
}

function getFileIcon(fileType) {
    const iconMap = {
        'image/jpeg': 'fas fa-file-image',
        'image/jpg': 'fas fa-file-image',
        'image/png': 'fas fa-file-image',
        'image/gif': 'fas fa-file-image',
        'image/bmp': 'fas fa-file-image',
        'image/tiff': 'fas fa-file-image',
        'image/webp': 'fas fa-file-image',
        'application/pdf': 'fas fa-file-pdf'
    };
    
    return iconMap[fileType] || 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeFile(index, type) {
    if (type === 'images') {
        imagesArray.splice(index, 1);
        if (imagesArray.length === 0) {
            hideSelectedFiles('images');
        } else {
            updateFilesList('images');
        }
    } else if (type === 'pdfs') {
        pdfsArray.splice(index, 1);
        if (pdfsArray.length === 0) {
            hideSelectedFiles('pdfs');
        } else {
            updateFilesList('pdfs');
        }
    }
}

function clearFiles(type) {
    if (type === 'images') {
        imagesArray = [];
        if (imageInput) {
            imageInput.value = '';
        }
        hideSelectedFiles('images');
    } else if (type === 'pdfs') {
        pdfsArray = [];
        if (pdfInput) {
            pdfInput.value = '';
        }
        hideSelectedFiles('pdfs');
    }
    showNotification('All files cleared', 'info');
}

function showSelectedFiles(type) {
    const selectedFilesEl = type === 'images' ? selectedImages : selectedPdfs;
    if (selectedFilesEl) {
        selectedFilesEl.style.display = 'block';
        selectedFilesEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hideSelectedFiles(type) {
    const selectedFilesEl = type === 'images' ? selectedImages : selectedPdfs;
    if (selectedFilesEl) {
        selectedFilesEl.style.display = 'none';
    }
}

function updateFormData(type) {
    const fileInput = type === 'images' ? imageInput : pdfInput;
    const filesArray = type === 'images' ? imagesArray : pdfsArray;
    
    if (!fileInput) return;
    
    // Create new DataTransfer object to update file input
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
}

function handleFormSubmit(e, type) {
    const filesArray = type === 'images' ? imagesArray : pdfsArray;
    const submitBtn = type === 'images' ? convertImagesBtn : mergePdfsBtn;
    
    if (filesArray.length === 0) {
        e.preventDefault();
        const fileType = type === 'images' ? 'image' : 'PDF';
        showNotification(`Please select at least one ${fileType}`, 'error');
        return;
    }
    
    // Show loading overlay
    showLoading();
    
    // Add some visual feedback
    if (submitBtn) {
        const loadingText = type === 'images' ? 
            '<i class="fas fa-spinner fa-spin"></i> Converting...' : 
            '<i class="fas fa-spinner fa-spin"></i> Merging...';
        
        submitBtn.innerHTML = loadingText;
        submitBtn.disabled = true;
    }
    
    // Hide loading after download likely starts (shorter timeout)
    setTimeout(() => {
        hideLoading();
        resetForm(type);
    }, 2000); // 2 seconds - enough time for processing to start
    
    // Also hide loading when window gets focus (user likely finished with download)
    const handleWindowFocus = () => {
        setTimeout(() => {
            hideLoading();
            resetForm(type);
        }, 500);
        window.removeEventListener('focus', handleWindowFocus);
    };
    
    // Add focus listener after a short delay
    setTimeout(() => {
        window.addEventListener('focus', handleWindowFocus);
    }, 1000);
}

function resetForm(type) {
    const submitBtn = type === 'images' ? convertImagesBtn : mergePdfsBtn;
    
    if (submitBtn) {
        const originalText = type === 'images' ? 
            '<i class="fas fa-file-pdf"></i> Convert to PDF' : 
            '<i class="fas fa-object-group"></i> Merge PDFs';
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add some dynamic loading messages
        const messages = [
            'Processing your files...',
            'Almost done...',
            'Finalizing...'
        ];
        
        let messageIndex = 0;
        const loadingText = loadingMessage;
        
        if (loadingText) {
            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                loadingText.textContent = messages[messageIndex];
            }, 2000);
            
            // Store interval ID to clear it later if needed
            loadingOverlay.messageInterval = messageInterval;
        }
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear message interval
        if (loadingOverlay.messageInterval) {
            clearInterval(loadingOverlay.messageInterval);
        }
    }
    
    // Reset buttons
    if (convertImagesBtn) {
        convertImagesBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Convert to PDF';
        convertImagesBtn.disabled = false;
    }
    if (mergePdfsBtn) {
        mergePdfsBtn.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
        mergePdfsBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `flash-message flash-${type}`;
    notification.style.animation = 'fadeIn 0.3s ease-out';
    
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        ${message}
        <button class="close-flash" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    if (container && header) {
        container.insertBefore(notification, header.nextSibling);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function animateOnLoad() {
    // Animate elements on page load
    const elements = document.querySelectorAll('.container > *');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'all 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Error handling for file operations
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    hideLoading();
    showNotification('An unexpected error occurred. Please try again.', 'error');
});

// Add fadeOut animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);