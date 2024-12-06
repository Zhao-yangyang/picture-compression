// 状态管理
const state = {
    currentFile: null,
    compressedImage: null,
    isCompressing: false
};

// DOM 元素
const elements = {
    fileInput: document.getElementById('fileInput'),
    fullUploadArea: document.getElementById('fullUploadArea'),
    quality: document.getElementById('qualitySlider'),
    qualityValue: document.getElementById('qualityValue'),
    compressBtn: document.getElementById('compressBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    originalPreview: document.getElementById('originalPreview'),
    compressedPreview: document.getElementById('compressedPreview'),
    originalSize: document.getElementById('originalSize'),
    compressedSize: document.getElementById('compressedSize'),
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    controlArea: document.getElementById('controlArea')
};

// 工具函数
const utils = {
    // 格式化文件大小
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 显示提示消息
    showToast(message, duration = 3000) {
        elements.toast.textContent = message;
        elements.toast.style.display = 'block';
        setTimeout(() => {
            elements.toast.style.display = 'none';
        }, duration);
    },

    // 显示/隐藏加载状态
    toggleLoading(show) {
        elements.loading.style.display = show ? 'flex' : 'none';
    },

    // 更新滑块背景
    updateSliderBackground(slider) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${value}%, #eee ${value}%, #eee 100%)`;
    },

    // 控制预览卡片显示
    togglePreviewCard(show) {
        const previewCard = document.getElementById('previewCard');
        if (show) {
            previewCard.classList.add('active');
        } else {
            previewCard.classList.remove('active');
        }
    },

    // 控制图片显示
    toggleImage(imgElement, show) {
        if (show) {
            imgElement.classList.add('active');
        } else {
            imgElement.classList.remove('active');
        }
    },

    // 重置预览
    resetPreview() {
        utils.toggleImage(elements.originalPreview, false);
        utils.toggleImage(elements.compressedPreview, false);
        elements.originalSize.textContent = '0 KB';
        elements.compressedSize.textContent = '0 KB';
    },

    // 控制上传区域折叠状态
    toggleUploadArea(collapse) {
        const uploadCard = document.getElementById('uploadCard');
        const fullUploadArea = elements.fullUploadArea;
        const controlArea = elements.controlArea;

        if (collapse) {
            uploadCard.classList.add('collapsed');
            fullUploadArea.style.display = 'none';
            controlArea.style.display = 'block';
            console.log('Collapsing upload area'); // 调试日志
        } else {
            uploadCard.classList.remove('collapsed');
            fullUploadArea.style.display = 'flex';
            controlArea.style.display = 'none';
            console.log('Expanding upload area'); // 调试日志
        }
    },

    // 更新预览区域的提示文字
    updatePreviewPlaceholder(element, status) {
        const messages = {
            waiting: '等待图片上传...',
            ready: '准备开始压缩...',
            compressing: '正在压缩...',
            done: '压缩完成'
        };
        element.closest('.preview-image').setAttribute('data-placeholder', messages[status]);
    },

    // 控制下载按钮显示
    toggleDownloadBtn(show) {
        if (elements.downloadBtn) {
            const wrapper = elements.downloadBtn.closest('.download-btn-wrapper');
            if (show) {
                wrapper.classList.add('active');
                elements.downloadBtn.classList.add('active');
            } else {
                wrapper.classList.remove('active');
                elements.downloadBtn.classList.remove('active');
            }
        }
    }
};

// 事件处理
const handlers = {
    // 处理文件上传
    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            utils.showToast('请上传图片文件');
            return;
        }

        // 重置预览状态
        utils.resetPreview();
        
        // 折叠上传区域
        utils.toggleUploadArea(true);
        
        state.currentFile = file;
        elements.originalSize.textContent = utils.formatSize(file.size);

        // 显示原图预览
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.originalPreview.src = e.target.result;
            elements.originalPreview.onload = () => {
                utils.toggleImage(elements.originalPreview, true);
                utils.togglePreviewCard(true);
                utils.updatePreviewPlaceholder(elements.compressedPreview, 'ready');
            };
        };
        reader.readAsDataURL(file);

        // 重置压缩预览时隐藏下载按钮
        utils.toggleDownloadBtn(false);
        elements.compressedPreview.src = '';
        state.compressedImage = null;
    },

    // 处理图片压缩
    async handleCompress() {
        if (!state.currentFile) {
            utils.showToast('请先选择图片');
            return;
        }

        if (state.isCompressing) {
            return;
        }

        try {
            state.isCompressing = true;
            utils.toggleLoading(true);
            utils.updatePreviewPlaceholder(elements.compressedPreview, 'compressing');

            const quality = elements.quality.value / 100;
            console.log('Compressing with quality:', quality); // 调试日志

            const options = {
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                quality: quality
            };

            const compressedFile = await imageCompression(state.currentFile, options);
            
            // 显示压缩后预览
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.compressedPreview.src = e.target.result;
                elements.compressedPreview.onload = () => {
                    utils.toggleImage(elements.compressedPreview, true);
                    utils.updatePreviewPlaceholder(elements.compressedPreview, 'done');
                    utils.toggleDownloadBtn(true); // 压缩成功时显示下载按钮
                };
                state.compressedImage = e.target.result;
                elements.compressedSize.textContent = utils.formatSize(compressedFile.size);
            };
            reader.readAsDataURL(compressedFile);

            utils.showToast('压缩完成！');
        } catch (error) {
            console.error('压缩失败:', error);
            utils.showToast('压缩失败，请重试');
            utils.toggleImage(elements.compressedPreview, false);
            utils.updatePreviewPlaceholder(elements.compressedPreview, 'ready');
            utils.toggleDownloadBtn(false); // 压缩失败时隐藏下载按钮
        } finally {
            state.isCompressing = false;
            utils.toggleLoading(false);
        }
    },

    // 处理图片下载
    handleDownload() {
        if (!state.compressedImage) {
            utils.showToast('请先压缩图片');
            return;
        }

        const link = document.createElement('a');
        link.download = `compressed-${state.currentFile.name}`;
        link.href = state.compressedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// 初始化事件监听
function initializeEventListeners() {
    // 文件选择
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlers.handleFileUpload(e.target.files[0]);
        }
    });

    // 拖拽上传 - 使用 fullUploadArea 替代 dropZone
    elements.fullUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fullUploadArea.classList.add('dragover');
    });

    elements.fullUploadArea.addEventListener('dragleave', () => {
        elements.fullUploadArea.classList.remove('dragover');
    });

    elements.fullUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fullUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handlers.handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // 质量滑块事件
    if (elements.quality) {
        elements.quality.addEventListener('input', (e) => {
            const value = e.target.value;
            elements.qualityValue.textContent = `${value}%`;
            utils.updateSliderBackground(e.target);
        });

        // 初始化滑块背景
        utils.updateSliderBackground(elements.quality);
    } else {
        console.error('Quality slider element not found');
    }

    // 压缩按钮事件
    if (elements.compressBtn) {
        elements.compressBtn.addEventListener('click', handlers.handleCompress);
    } else {
        console.error('Compress button element not found');
    }

    // 下载按钮
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', handlers.handleDownload);
    } else {
        console.error('Download button element not found');
    }
}

// 初始化应用
function initializeApp() {
    // 检查所有必需的DOM元素
    const requiredElements = [
        'fileInput',
        'fullUploadArea',
        'quality',
        'qualityValue',
        'compressBtn',
        'downloadBtn'
    ];

    const missingElements = requiredElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    initializeEventListeners();
    utils.resetPreview();
    utils.togglePreviewCard(false);
    utils.toggleUploadArea(false);
    utils.updateSliderBackground(elements.quality);
    utils.toggleDownloadBtn(false);
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp); 