document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const uploadContent = document.querySelector('.upload-content');
    const removeFileBtn = document.getElementById('removeFile');
    const splitBtn = document.getElementById('splitBtn');
    const form = document.getElementById('uploadForm');
    const statusMessage = document.getElementById('statusMessage');
    const rulesContainer = document.getElementById('rulesContainer');
    const addRuleBtn = document.getElementById('addRuleBtn');

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                updateUIForFile(file);
            } else {
                showMessage('Please upload a PDF file.', 'error');
            }
        }
    }

    function updateUIForFile(file) {
        fileName.textContent = file.name;
        uploadContent.style.display = 'none';
        fileInfo.style.display = 'flex';
        splitBtn.disabled = false;
        window.currentFile = file;
    }

    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        resetUI();
    });

    function resetUI() {
        fileInput.value = '';
        window.currentFile = null;
        fileInfo.style.display = 'none';
        uploadContent.style.display = 'block';
        splitBtn.disabled = true;
        statusMessage.textContent = '';
    }

    // Rules Logic
    addRule(); // Init with one

    addRuleBtn.addEventListener('click', () => addRule());

    function addRule() {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'rule-row';
        ruleDiv.innerHTML = `
            <div class="rule-inputs">
                <input type="text" class="rule-name" placeholder="Name (e.g. Intro)" title="Name of this part (optional)">
                <input type="text" class="rule-range" placeholder="Range (e.g. 1-5)" required>
            </div>
            <div class="rule-options">
                <label class="checkbox-container" title="Split into single pages">
                    <input type="checkbox" class="rule-burst">
                    <span class="checkmark"></span>
                    <span class="label-text">Burst</span>
                </label>
                <button type="button" class="btn-icon delete-rule" title="Remove rule"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        
        rulesContainer.appendChild(ruleDiv);
        lucide.createIcons();

        ruleDiv.querySelector('.delete-rule').addEventListener('click', () => {
             if (rulesContainer.children.length > 1) {
                 ruleDiv.remove();
             } else {
                 ruleDiv.querySelector('.rule-name').value = '';
                 ruleDiv.querySelector('.rule-range').value = '';
                 ruleDiv.querySelector('.rule-burst').checked = false;
             }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rules = [];
        const rows = document.querySelectorAll('.rule-row');
        
        rows.forEach(row => {
            const range = row.querySelector('.rule-range').value.trim();
            const name = row.querySelector('.rule-name').value.trim();
            const burst = row.querySelector('.rule-burst').checked;

            if (range) {
                rules.push({ range, name, burst });
            }
        });

        if (rules.length === 0) {
            showMessage('Please add at least one split rule.', 'error');
            return;
        }

        const formData = new FormData();
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        } else if (window.currentFile) {
            formData.append('file', window.currentFile);
        } else {
            showMessage('No file selected.', 'error');
            return;
        }
        
        formData.append('rules', JSON.stringify(rules));

        splitBtn.disabled = true;
        splitBtn.innerHTML = '<span>Processing...</span><i data-lucide="loader-2" class="spin"></i>';
        if (window.lucide) {
            lucide.createIcons();
        }

        try {
            const response = await fetch('/split', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisp = response.headers.get('Content-Disposition');
                let downName = 'download';
                if (contentDisp && contentDisp.indexOf('filename=') !== -1) {
                     downName = contentDisp.split('filename=')[1].replace(/"/g, '');
                }
                a.download = downName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showMessage('Download started!', 'success');
            } else {
                const data = await response.json();
                showMessage(data.error || 'An error occurred.', 'error');
            }
        } catch (error) {
            console.error(error);
            showMessage('Network error.', 'error');
        } finally {
            splitBtn.disabled = false;
            splitBtn.innerHTML = '<span>Split & Download</span><i data-lucide="download"></i>';
            if (window.lucide) {
            if (window.lucide) {
                lucide.createIcons();
            }
        }
        }
    });

    function showMessage(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.className = type;
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = '';
        }, 5000);
    }
});

// Add spin animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin { 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);
