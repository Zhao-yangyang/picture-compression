let currentFile = null;
let compressedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const compressBtn = document.getElementById('compressBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // 拖拽上传
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });

    // 文件选择上传
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // 压缩比例滑块
    qualitySlider.addEventListener('input', (e) => {
        document.getElementById('qualityValue').textContent = e.target.value;
    });

    // 压缩按钮
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) {
            alert('请先上传图片！');
            return;
        }
        
        try {
            const quality = document.getElementById('quality').value / 100;
            // 显示加载状态
            compressBtn.textContent = '压缩中...';
            compressBtn.disabled = true;
            
            await compressImage(currentFile, quality);
            
            // 恢复按钮状态
            compressBtn.textContent = '开始压缩';
            compressBtn.disabled = false;
        } catch (error) {
            console.error('压缩失败:', error);
            alert('压缩失败，请重试！');
            compressBtn.textContent = '开始压缩';
            compressBtn.disabled = false;
        }
    });

    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (compressedImage) {
            // 从base64创建下载链接
            const link = document.createElement('a');
            const extension = currentFile.name.split('.').pop().toLowerCase();
            link.download = `compressed-image.${extension}`;
            link.href = compressedImage;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});

// 处理图片上传
async function handleImageUpload(file) {
    if (!file.type.match('image.*')) {
        alert('请上传图片文件！');
        return;
    }

    currentFile = file;

    // 显示原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('originalPreview').src = e.target.result;
        document.getElementById('originalSize').textContent = formatFileSize(file.size);
        
        // 显示压缩设置区域，隐藏预览区域
        document.getElementById('compressionSettings').style.display = 'block';
        document.getElementById('previewContainer').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// 压缩图片
async function compressImage(file, quality) {
    try {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: false, // 禁用 WebWorker
            quality: quality
        };

        const compressedFile = await imageCompression(file, options);
        
        // 直接转换为base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const base64String = e.target.result;
                    document.getElementById('compressedPreview').src = base64String;
                    compressedImage = base64String;
                    document.getElementById('compressedSize').textContent = formatFileSize(compressedFile.size);
                    document.getElementById('previewContainer').style.display = 'block';
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
        });
    } catch (error) {
        throw error;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 