class PrototypingTool {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.resizingElement = null;
        this.resizeHandle = null;
        this.offset = { x: 0, y: 0 };
        this.gridSize = 0;
        this.history = [];
        this.currentHistoryIndex = -1;
        this.maxZIndex = 1;
        this.clipboard = null;
        this.panelDefaultSize = {
            width: 200,
            height: 150
        };
        this.stickyColors = [
            '#fff740', // 노랑
            '#ff7eb9', // 핑크
            '#7afcff', // 하늘
            '#98ff98', // 연두
            '#ffb347'  // 주황
        ];
        this.pages = new Map(); // 페이지 저장소
        this.currentPageId = null; // 현재 페이지 ID
    
        this.scale = 1;  // 줌 레벨
        this.isPanning = false;  // 패닝 중인지 여부
        this.lastPanPosition = { x: 0, y: 0 };  // 마지막 패닝 위치
        this.canvasOffset = { x: 0, y: 0 };  // 캔버스 오프셋
    
        this.devicePresets = {
            'desktop': { width: 1920, height: 1080 },
            'laptop': { width: 1366, height: 768 },
            'iphone12': { width: 390, height: 844 },
            'galaxy': { width: 412, height: 915 },
            'ipad': { width: 820, height: 1180 },
            'custom': { width: null, height: null }
        };
        this.currentDevice = 'desktop';
        this.snapThreshold = 5; // 스냅이 작동할 거리 (픽셀)
        this.snapEnabled = true; // 스냅 기능 활성화 여부
    
        this.loremText = "Lorem ipsum dolor sit amet..."; // 생략
        this.loremVariants = { /* ... */ }; // 생략
    
        // 첫 페이지 생성
        this.createPage('Home');
        
        // 초기 캔버스 크기 설정
        this.initializeCanvasSize();
        
        this.initializeEvents();
        this.saveHistory();
    }
    
    initializeCanvasSize() {
        const canvas = document.getElementById('canvas');
        const canvasArea = document.querySelector('.canvas-area');
        const preset = this.devicePresets[this.currentDevice];
        
        if (canvas && preset) {
            // 캔버스 크기 설정
            canvas.style.width = `${preset.width}px`;
            canvas.style.height = `${preset.height}px`;
            
            // transform 초기화
            canvas.style.transform = 'translate(0, 0) scale(1)';
            canvas.style.transformOrigin = '0 0';
    
            // 캔버스 영역 스크롤 위치를 왼쪽 상단으로 초기화
            if (canvasArea) {
                canvasArea.scrollLeft = 0;
                canvasArea.scrollTop = 0;
            }
    
            // 오프셋 초기화
            this.canvasOffset = { x: 0, y: 0 };
            this.scale = 1;
        }
    }

    // updateCanvasTransform 함수도 수정하여 transform 원점 유지
    updateCanvasTransform() {
        const canvas = document.getElementById('canvas');
        canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.scale})`;
        canvas.style.transformOrigin = '0 0';
    }

    createPage(pageName) {
        const pageId = Date.now();
        const page = {
            id: pageId,
            name: pageName,
            elements: [],
            device: this.currentDevice,
            gridSize: this.gridSize
        };
        
        this.pages.set(pageId, page);
        
        if (!this.currentPageId) {
            this.currentPageId = pageId;
        }
        
        this.updatePageList();
        return pageId;
    }

    initializeEvents() {
        // 이벤트 위임을 사용하여 컴포넌트 버튼 이벤트 처리
        document.querySelector('.components-panel').addEventListener('click', e => {
            const btn = e.target.closest('.component-btn');
            if (btn) this.addElement(btn.dataset.type);
        });
    
        // 캔버스 이벤트
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('click', e => {
            if (e.target === canvas) this.clearSelection();
        });
    
        // 키보드 이벤트 통합 (단축키 + 방향키)
        const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
        
        document.addEventListener('keydown', e => {
            // 요소가 선택된 상태에서의 키 이벤트
            if (this.selectedElement) {
                // Delete 키 처리
                if (e.key === 'Delete') {
                    this.deleteSelected();
                    return;
                }
    
                // 방향키 처리
                if (ARROW_KEYS.has(e.key)) {
                    e.preventDefault();
                    const moveAmount = e.shiftKey ? 10 : 1;
                    const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
                    
                    // 좌표 업데이트
                    if (e.key === 'ArrowUp') this.selectedElement.y -= moveAmount;
                    else if (e.key === 'ArrowDown') this.selectedElement.y += moveAmount;
                    else if (e.key === 'ArrowLeft') this.selectedElement.x -= moveAmount;
                    else if (e.key === 'ArrowRight') this.selectedElement.x += moveAmount;
                    
                    // DOM 업데이트는 한 번만
                    elementDiv.style.left = `${this.selectedElement.x}px`;
                    elementDiv.style.top = `${this.selectedElement.y}px`;
                    
                    this.updateProperties();
                    
                    // 디바운스된 히스토리 저장
                    if (this.saveTimeout) clearTimeout(this.saveTimeout);
                    this.saveTimeout = setTimeout(() => this.saveHistory(), 500);
                    return;
                }
            }
    
            // Ctrl/Cmd 단축키 처리
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (key === 'z' || key === 'y' || key === 'c' || key === 'v') {
                    e.preventDefault();
                    if (key === 'z') this.undo();
                    else if (key === 'y') this.redo();
                    else if (key === 'c') this.copyElement();
                    else if (key === 'v') this.pasteElement();
                }
            }
        });
    
        // 줌과 패닝 이벤트 초기화
        this.initializeZoomAndPan();
    }

    initializeZoomAndPan() {
        const canvasArea = document.querySelector('.canvas-area');
    
        // 줌 이벤트
        canvasArea.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.zoom(delta, e.clientX, e.clientY);
            }
        }, { passive: false });
    
        // 스페이스바 패닝
        let isSpacePressed = false;
        document.addEventListener('keydown', (e) => {
            // 편집 가능한 요소에 포커스가 있을 때는 스페이스바 이벤트를 무시
            if (e.code === 'Space' && !isSpacePressed && 
                !(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || 
                  document.activeElement.contentEditable === 'true')) {
                e.preventDefault();
                isSpacePressed = true;
                canvasArea.classList.add('panning');
                document.body.style.cursor = 'grab';
                this.isPanning = true;
            }
        });
    
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                isSpacePressed = false;
                canvasArea.classList.remove('panning');
                document.body.style.cursor = 'default';
                this.isPanning = false;
            }
        });
    
        // 패닝 마우스 이벤트
        let isPanningActive = false;
        canvasArea.addEventListener('mousedown', (e) => {
            if (this.isPanning) {
                e.preventDefault();
                isPanningActive = true;
                canvasArea.classList.add('panning');
                document.body.style.cursor = 'grabbing';
                this.lastPanPosition = { x: e.clientX, y: e.clientY };
            }
        });
    
        canvasArea.addEventListener('mousemove', (e) => {
            if (isPanningActive && this.isPanning) {
                const dx = e.clientX - this.lastPanPosition.x;
                const dy = e.clientY - this.lastPanPosition.y;
    
                this.canvasOffset.x += dx;
                this.canvasOffset.y += dy;
    
                this.lastPanPosition = { x: e.clientX, y: e.clientY };
                this.updateCanvasTransform();
            }
        });
    
        document.addEventListener('mouseup', () => {
            if (isPanningActive) {
                isPanningActive = false;
                if (this.isPanning) {
                    document.body.style.cursor = 'grab';
                }
            }
        });
    }

    zoom(delta, clientX, clientY) {
        const canvasArea = document.querySelector('.canvas-area');
        const canvas = document.getElementById('canvas');
        const rect = canvasArea.getBoundingClientRect();
    
        // 마우스 위치를 기준으로 줌
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
    
        const newScale = Math.min(Math.max(this.scale * delta, 0.1), 3); // 0.1배에서 3배까지 제한
        
        if (newScale !== this.scale) {
            const scaleChange = newScale / this.scale;
            
            // 마우스 포인터 위치 기준으로 offset 조정
            this.canvasOffset.x = mouseX - (mouseX - this.canvasOffset.x) * scaleChange;
            this.canvasOffset.y = mouseY - (mouseY - this.canvasOffset.y) * scaleChange;
            
            this.scale = newScale;
            this.updateCanvasTransform();
        }
    }

    resetZoom() {
        this.scale = 1;
        this.canvasOffset = { x: 0, y: 0 };
        this.updateCanvasTransform();
    }
    
    handlePan = (e) => {
        const dx = e.clientX - this.lastPanPosition.x;
        const dy = e.clientY - this.lastPanPosition.y;
    
        this.canvasOffset.x += dx;
        this.canvasOffset.y += dy;
    
        this.lastPanPosition = { x: e.clientX, y: e.clientY };
        this.updateCanvasTransform();
    }
    
    updateCanvasTransform() {
        const canvas = document.getElementById('canvas');
        canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.scale})`;
        canvas.style.transformOrigin = '0 0';
    }


    copyElement() {
        if (!this.selectedElement) return;
        
        // 깊은 복사를 위해 JSON 사용
        this.clipboard = JSON.parse(JSON.stringify(this.selectedElement));
        
        // 복사 성공 피드백 (옵션)
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.transition = 'transform 0.1s';
            elementDiv.style.transform = 'scale(1.05)';
            setTimeout(() => {
                elementDiv.style.transform = 'scale(1)';
            }, 100);
        }
    }
    
    pasteElement() {
        if (!this.clipboard) return;
        
        // 새로운 ID 생성과 위치 조정
        const newElement = {
            ...this.clipboard,
            id: Date.now(),
            x: this.clipboard.x + 20, // 약간 오프셋을 주어 겹치지 않게
            y: this.clipboard.y + 20,
            zIndex: this.maxZIndex + 1
        };
        
        this.maxZIndex++;
        this.elements.push(newElement);
        this.renderElement(newElement);
        this.selectElement(newElement);
        this.saveHistory();
    }

    // 캔버스 경계선에만 스냅하도록 단순화된 계산
    calculateSnap(x, y, width, height) {
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        let snappedX = x;
        let snappedY = y;
        const guides = [];

        // 왼쪽 경계
        if (Math.abs(x) < this.snapThreshold) {
            snappedX = 0;
            guides.push({ type: 'vertical', position: 0 });
        }
        
        // 오른쪽 경계
        if (Math.abs(x + width - canvasRect.width) < this.snapThreshold) {
            snappedX = canvasRect.width - width;
            guides.push({ type: 'vertical', position: canvasRect.width });
        }
        
        // 상단 경계
        if (Math.abs(y) < this.snapThreshold) {
            snappedY = 0;
            guides.push({ type: 'horizontal', position: 0 });
        }
        
        // 하단 경계
        if (Math.abs(y + height - canvasRect.height) < this.snapThreshold) {
            snappedY = canvasRect.height - height;
            guides.push({ type: 'horizontal', position: canvasRect.height });
        }

        return { x: snappedX, y: snappedY, guides };
    }

    // 요소의 스냅 포인트 계산
    getElementSnapPoints(element) {
        const points = [];
        // 중심점
        points.push({
            x: element.x + element.width / 2,
            y: element.y + element.height / 2
        });
        // 모서리
        points.push({ x: element.x, y: element.y }); // 좌상단
        points.push({ x: element.x + element.width, y: element.y }); // 우상단
        points.push({ x: element.x, y: element.y + element.height }); // 좌하단
        points.push({ x: element.x + element.width, y: element.y + element.height }); // 우하단
        // 중앙선
        points.push({ x: element.x, y: element.y + element.height / 2 }); // 좌중앙
        points.push({ x: element.x + element.width, y: element.y + element.height / 2 }); // 우중앙
        points.push({ x: element.x + element.width / 2, y: element.y }); // 상중앙
        points.push({ x: element.x + element.width / 2, y: element.y + element.height }); // 하중앙
        
        return points;
    }

    // 현재 드래그 중인 요소의 스냅 포인트 계산
    getSnapPoints(element) {
        return this.getElementSnapPoints({
            ...element,
            x: this.draggedElement ? this.draggedElement.x : element.x,
            y: this.draggedElement ? this.draggedElement.y : element.y
        });
    }

    setCanvasSize(deviceType) {
        if (!confirm('Changing canvas size will clear all elements. Continue?')) {
            return;
        }
        const canvas = document.getElementById('canvas');

        if (deviceType === 'custom') {
            const width = prompt('Enter width (px):', '800');
            const height = prompt('Enter height (px):', '600');
            if (width && height) {
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
            }
        } else {
            const size = this.devicePresets[deviceType];
            canvas.style.width = `${size.width}px`;
            canvas.style.height = `${size.height}px`;
        }

        // 모든 요소 초기화
        this.elements = [];
        canvas.innerHTML = '';
        this.selectedElement = null;
        this.updateProperties();
        this.updateLayersList();
        
        // 그리드 설정 유지
        if (this.gridSize > 0) {
            canvas.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        }

        this.currentDevice = deviceType;
        this.saveHistory();
    }

    // 스냅 가이드라인 표시
    showSnapGuides(guides) {
        // 기존 가이드라인 제거
        document.querySelectorAll('.snap-guide').forEach(guide => guide.remove());

        guides.forEach(guide => {
            const guideElement = document.createElement('div');
            guideElement.className = 'snap-guide';
            
            if (guide.type === 'vertical') {
                guideElement.style.width = '2px';
                guideElement.style.height = '100%';
                guideElement.style.left = `${guide.position}px`;
                guideElement.style.top = '0';
            } else {
                guideElement.style.height = '2px';
                guideElement.style.width = '100%';
                guideElement.style.left = '0';
                guideElement.style.top = `${guide.position}px`;
            }

            document.getElementById('canvas').appendChild(guideElement);

            // 1초 후 가이드라인 제거
            setTimeout(() => guideElement.remove(), 1000);
        });
    }

    addElement(type) {
        this.maxZIndex++;
        if (type === 'image') {
            this.showImageDialog();
            return;
        }
        const element = {
            id: Date.now(),
            type,
            x: 100,
            y: 100,
            width: type === 'link' ? 150 :
                    (type === 'box' ? 200 : 
                    (type === 'sticky' ? 200 : 
                    (type === 'panel' ? this.panelDefaultSize.width : 120))),
            height: type === 'link' ? 60 :
                    (type === 'box' ? 200 : 
                    (type === 'sticky' ? 200 : 
                    (type === 'panel' ? this.panelDefaultSize.height : 40))),
            name: this.generateElementName(type),
            content: type === 'link' ? '🔗 Click to set target page' :
                    (type === 'sticky' ? 'Double click to edit memo' : 
                    (type === 'panel' ? '' : type.charAt(0).toUpperCase() + type.slice(1))),
            zIndex: this.maxZIndex,
            opacity: type === 'sticky' ? 1 : undefined,
            fontSize: type === 'text' ? 16 : undefined,
            // 패널의 기본 색상 설정
            backgroundColor: type === 'box' ? '#ffffff' : 
                        (type === 'panel' ? '#ffffff' : undefined),
            borderColor: type === 'box' ? '#dddddd' : 
                        (type === 'panel' ? '#dddddd' : undefined),
            showX: type === 'box' ? true : undefined,
            headerColor: type === 'panel' ? '#f5f5f5' : undefined,
            isPanel: type === 'panel',
            isBold: false,
            stickyColor: type === 'sticky' ? this.stickyColors[0] : undefined,
            targetPageId: null,
            justifyContent: type === 'text' ? 'center' : undefined
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();
    }

    handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            // 파일 타입 체크
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Please select an image file.'));
                return;
            }
    
            // 파일 크기 체크 (1MB = 1048576 bytes)
            const maxSize = 1 * 1048576; // 1MB
            if (file.size > maxSize) {
                reject(new Error('Image size must be less than 1MB. Please compress your image and try again.'));
                return;
            }
    
            const reader = new FileReader();
            
            reader.onload = () => {
                const tempImage = new Image();
                tempImage.onload = () => {
                    // 이미지 크기 제한 (예: 최대 500x500)
                    const maxDimension = 500;
                    let width = tempImage.width;
                    let height = tempImage.height;
    
                    if (width > maxDimension || height > maxDimension) {
                        const ratio = Math.min(maxDimension / width, maxDimension / height);
                        width *= ratio;
                        height *= ratio;
                    }
    
                    const element = {
                        id: Date.now(),
                        type: 'image',
                        x: 100,
                        y: 100,
                        width: width,
                        height: height,
                        name: this.generateElementName('image'),
                        content: reader.result,
                        aspectRatio: tempImage.width / tempImage.height,
                        zIndex: this.maxZIndex
                    };
                    resolve(element);
                };
    
                tempImage.onerror = () => {
                    reject(new Error('Failed to load image.'));
                };
    
                tempImage.src = reader.result;
            };
    
            reader.onerror = () => {
                reject(new Error('Failed to read file.'));
            };
    
            reader.readAsDataURL(file);
        });
    }

    generateElementName(type) {
        const counts = this.elements.reduce((acc, el) => {
            if (el.type === type) {
                acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
        }, {});
        
        const count = (counts[type] || 0) + 1;
        
        switch(type) {
            case 'text':
                return `Text ${count}`;
            case 'button':
                return `Button ${count}`;
            case 'input':
                return `Input ${count}`;
            case 'panel':
                return `Panel ${count}`;
            case 'box':
                return `Box ${count}`;
            case 'sticky':
                return `Note ${count}`;
            case 'image':
                return `Image ${count}`;
            default:
                return `Element ${count}`;
        }
    }

    showImageDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'image-dialog';
        dialog.innerHTML = `
            <div class="image-dialog-content">
                <h3>Add Image</h3>
                <div class="image-input-group">
                    <label>Select Image File:</label>
                    <small style="display: block; color: #666; margin-bottom: 8px;">
                        File size must be less than 1MB
                    </small>
                    <input type="file" accept="image/*" class="image-file-input">
                </div>
                <div class="dialog-buttons">
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(dialog);
    
        const fileInput = dialog.querySelector('.image-file-input');
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const element = await this.handleImageUpload(file);
                    this.elements.push(element);
                    this.renderElement(element);
                    this.selectElement(element);
                    this.saveHistory();
                    document.body.removeChild(dialog);
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    createImageElement(src) {
        const element = {
            id: Date.now(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            content: src,
            zIndex: this.maxZIndex,
            aspectRatio: null // 이미지 비율 보존을 위해 추가
        };

        // 이미지 로드 후 비율 계산
        const img = new Image();
        img.onload = () => {
            element.aspectRatio = img.width / img.height;
            element.height = element.width / element.aspectRatio;
            this.renderElement(element);
            this.updateProperties();
        };
        img.src = src;

        this.elements.push(element);
        this.selectElement(element);
        this.saveHistory();
    }

    renderElement(element) {
        const div = document.createElement('div');
        div.id = `element-${element.id}`;
        div.className = `element ${element.type}`;
        
        // 공통 스타일 적용
        Object.assign(div.style, {
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.width}px`,
            height: `${element.height}px`,
            zIndex: element.zIndex || 1
        });
    
        // 요소 타입별 렌더링
        const elementContent = {
            image: () => {
                const img = document.createElement('img');
                Object.assign(img, {
                    src: element.content,
                    style: 'width: 100%; height: 100%; object-fit: contain;',
                    draggable: false,
                    alt: 'Uploaded image'
                });
                return img;
            },
            
            box: () => {
                div.style.backgroundColor = element.backgroundColor || '#ffffff';
                div.style.borderColor = element.borderColor || '#dddddd';
                
                const placeholder = document.createElement('div');
                placeholder.className = `box-placeholder ${element.showX ? '' : 'hide-x'}`;
                placeholder.innerHTML = `
                    <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#ddd" stroke-width="1"/>
                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="#ddd" stroke-width="1"/>
                    </svg>
                `;
                return placeholder;
            },
            
            sticky: () => {
                div.style.backgroundColor = element.stickyColor;
                const content = document.createElement('div');
                content.className = 'sticky-content';
                content.style.fontSize = `${element.fontSize}px`;
                content.textContent = element.content;
                
                // 더블클릭 이벤트 처리
                const handleDblClick = e => {
                    e.stopPropagation();
                    if (!e.target.closest('.resize-handle')) {
                        this.startEditingSticky(element);
                    }
                };
                
                div.addEventListener('dblclick', handleDblClick);
                content.addEventListener('dblclick', handleDblClick);
                
                return content;
            },
            
            panel: () => {
                Object.assign(div.style, {
                    backgroundColor: element.backgroundColor || '#ffffff',
                    borderColor: element.borderColor || '#dddddd'
                });
                
                const container = document.createElement('div');
                container.innerHTML = `
                    <div class="panel-header" style="background-color: ${element.headerColor || '#f5f5f5'}; border-bottom-color: ${element.borderColor || '#dddddd'}">
                        <div class="panel-title">Panel</div>
                        <button class="panel-close">×</button>
                    </div>
                    <div class="panel-content" style="background-color: ${element.backgroundColor || '#ffffff'}">${element.content}</div>
                `;
                
                container.querySelector('.panel-close').addEventListener('click', e => {
                    e.stopPropagation();
                    if (confirm('Delete this panel?')) {
                        this.deleteElement(element.id);
                    }
                });
                
                return container;
            },
            
            text: () => {
                div.textContent = element.content;
                if (element.fontSize) div.style.fontSize = `${element.fontSize}px`;
                if (element.isBold) div.style.fontWeight = 'bold';
                div.style.justifyContent = element.justifyContent || 'center';
                
                div.addEventListener('dblclick', e => {
                    e.stopPropagation();
                    this.startEditing(element);
                });
                
                return null;
            },
            
            link: () => {
                const content = document.createElement('div');
                content.className = 'link-content';
                content.textContent = element.content;
                
                if (this.previewMode && element.targetPageId) {
                    div.addEventListener('click', e => {
                        e.stopPropagation();
                        this.switchPage(element.targetPageId);
                    });
                }
                
                return content;
            },
            
            button: () => {
                div.textContent = element.content;
                div.addEventListener('dblclick', e => {
                    e.stopPropagation();
                    this.startEditingButton(element);
                });
                return null;
            },
            
            input: () => {
                const input = document.createElement('input');
                Object.assign(input, {
                    type: 'text',
                    placeholder: element.content,
                    style: 'width:100%;height:100%;border:none;padding:4px;'
                });
                return input;
            }
        };
    
        // 요소 타입별 콘텐츠 생성 및 추가
        const content = elementContent[element.type]?.();
        if (content) div.appendChild(content);
    
        // 공통 이벤트 리스너 추가
        div.addEventListener('mousedown', e => {
            if (!this.previewMode && !e.target.classList.contains('panel-close') && !e.target.classList.contains('resize-handle')) {
                this.startDragging(e, element);
            }
        });
    
        div.addEventListener('click', e => {
            if (!this.previewMode && !e.target.classList.contains('panel-close')) {
                e.stopPropagation();
                this.selectElement(element);
            }
        });
    
        document.getElementById('canvas').appendChild(div);
        this.updateLayersList();
    }

    startEditing(element) {
        if (element.type !== 'text') return;
        
        const elementDiv = document.getElementById(`element-${element.id}`);
        const currentText = element.content;
        
        elementDiv.innerHTML = '';
        const editableDiv = document.createElement('div');
        editableDiv.contentEditable = true;
        editableDiv.className = 'editable-text';
        editableDiv.textContent = currentText;
        editableDiv.style.width = '100%';
        editableDiv.style.height = '100%';
        editableDiv.style.outline = 'none';
        editableDiv.style.justifyContent = element.justifyContent || 'center';
        editableDiv.style.fontSize = element.fontSize ? `${element.fontSize}px` : '16px';
        
        elementDiv.appendChild(editableDiv);
        
        // 텍스트 선택
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        editableDiv.focus();

        // Ctrl+B 단축키 처리
        editableDiv.addEventListener('keydown', (e) => {
            if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleBold();
                // 편집 중인 div에도 볼드 상태 적용
                editableDiv.style.fontWeight = element.isBold ? 'bold' : 'normal';
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });

        // lorem 감지 및 변환을 위한 입력 이벤트
        editableDiv.addEventListener('input', (e) => {
            const text = e.target.textContent.trim().toLowerCase();
            
            // lorem 변형들 감지
            if (text === 'lorem') {
                e.target.textContent = this.loremVariants.medium;
            } else if (text === '1lorem' || text === '.lorem') {
                e.target.textContent = this.loremVariants.short;
            } else if (text === '2lorem' || text === '..lorem') {
                e.target.textContent = this.loremVariants.medium;
            } else if (text === '3lorem' || text === '...lorem') {
                e.target.textContent = this.loremVariants.long;
            }
        });

        // 편집 완료 처리
        const finishEditing = () => {
            const newText = editableDiv.textContent;
            element.content = newText;
            elementDiv.textContent = newText;
            // 볼드 상태 유지
            elementDiv.style.fontWeight = element.isBold ? 'bold' : 'normal';
            this.saveHistory();
        };

        editableDiv.addEventListener('blur', finishEditing);
        
        editableDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });
    }

    startEditingButton(element) {
        const elementDiv = document.getElementById(`element-${element.id}`);
        const currentText = element.content;
        
        elementDiv.innerHTML = '';
        const editableDiv = document.createElement('div');
        editableDiv.contentEditable = true;
        editableDiv.className = 'editable-text';
        editableDiv.textContent = currentText;
        editableDiv.style.width = '100%';
        editableDiv.style.height = '100%';
        editableDiv.style.display = 'flex';
        editableDiv.style.alignItems = 'center';
        editableDiv.style.justifyContent = 'center';
        editableDiv.style.outline = 'none';
        editableDiv.style.color = 'white';  // 버튼 텍스트 색상 유지
        editableDiv.style.cursor = 'text';
        
        elementDiv.appendChild(editableDiv);
        
        // 텍스트 선택
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        editableDiv.focus();
    
        const finishEditing = () => {
            const newText = editableDiv.textContent;
            element.content = newText;
            elementDiv.textContent = newText;
            this.saveHistory();
        };
    
        editableDiv.addEventListener('blur', finishEditing);
        
        editableDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });
    }

    startEditingSticky(element) {
        const elementDiv = document.getElementById(`element-${element.id}`);
        const contentDiv = elementDiv.querySelector('.sticky-content');
        
        // 이미 편집 중인 경우 리턴
        if (contentDiv.contentEditable === 'true') return;
        
        // contentEditable 속성 추가
        contentDiv.contentEditable = true;
        contentDiv.classList.add('editable');
        
        // 포커스 및 텍스트 선택
        contentDiv.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentDiv);
        selection.removeAllRanges();
        selection.addRange(range);
    
        const finishEditing = () => {
            contentDiv.contentEditable = false;
            contentDiv.classList.remove('editable');
            element.content = contentDiv.textContent || element.content;
            this.saveHistory();
            this.updateProperties();
        };
    
        // blur와 Ctrl+Enter로 편집 완료
        contentDiv.addEventListener('blur', finishEditing, { once: true });
        contentDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                contentDiv.blur();
            }
        });
    }

    toggleBold() {
        if (!this.selectedElement || this.selectedElement.type !== 'text') return;
        
        this.selectedElement.isBold = !this.selectedElement.isBold;
        
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.fontWeight = this.selectedElement.isBold ? 'bold' : 'normal';
        }
        
        this.updateProperties();
        this.saveHistory();
    }

    startDragging(e, element) {
        this.draggedElement = element;
        const rect = document.getElementById(`element-${element.id}`).getBoundingClientRect();
        this.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        const moveHandler = (e) => this.handleDrag(e);
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            this.draggedElement = null;
            this.saveHistory();
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }

    handleDrag(e) {
        if (!this.draggedElement) return;

        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        
        let x = e.clientX - rect.left - this.offset.x;
        let y = e.clientY - rect.top - this.offset.y;

        // 그리드 스냅 (기존 기능 유지)
        if (this.gridSize > 0) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }

        // 경계선 스냅
        if (this.snapEnabled) {
            const snapResult = this.calculateSnap(
                x, 
                y, 
                this.draggedElement.width, 
                this.draggedElement.height
            );
            x = snapResult.x;
            y = snapResult.y;
            
            // 가이드라인 표시
            this.showSnapGuides(snapResult.guides);
        }

        // 요소 위치 업데이트
        this.draggedElement.x = Math.max(0, x);
        this.draggedElement.y = Math.max(0, y);

        const elementDiv = document.getElementById(`element-${this.draggedElement.id}`);
        elementDiv.style.left = `${this.draggedElement.x}px`;
        elementDiv.style.top = `${this.draggedElement.y}px`;

        this.updateProperties();
    }

    selectElement(element) {
        this.clearSelection();  // 먼저 이전 선택을 모두 해제
        this.selectedElement = element;
        const div = document.getElementById(`element-${element.id}`);
        div.classList.add('selected');  // 현재 요소에 'selected' 클래스 추가
        this.updateProperties();
        this.updateLayersList();
        this.addResizeHandles(div);  // 필요한 경우 리사이즈 핸들 추가
    }

    addResizeHandles(elementDiv) {
        // 기존 핸들 제거
        elementDiv.querySelectorAll('.resize-handle').forEach(handle => handle.remove());

        // 8방향 리사이즈 핸들 추가
        const positions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResizing(e, this.selectedElement, pos);
            });
            elementDiv.appendChild(handle);
        });
    }

    startResizing(e, element, handle) {
        this.resizingElement = element;
        this.resizeHandle = handle;
        this.startSize = {
            width: element.width,
            height: element.height,
            x: element.x,
            y: element.y
        };
        this.startPos = {
            x: e.clientX,
            y: e.clientY
        };

        const moveHandler = (e) => this.handleResize(e);
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            this.resizingElement = null;
            this.resizeHandle = null;
            this.saveHistory();
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }

    handleResize(e) {
        if (!this.resizingElement) return;
    
        const dx = e.clientX - this.startPos.x;
        const dy = e.clientY - this.startPos.y;
        
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const guides = [];
    
        // 리사이즈 방향에 따른 계산 매핑
        const resizeCalculations = {
            e: { 
                width: Math.max(50, this.startSize.width + dx),
                snapCondition: (newX, newWidth) => Math.abs(newX + newWidth - canvasRect.width) < this.snapThreshold,
                snapWidth: (newX) => canvasRect.width - newX,
                guide: { type: 'vertical', position: canvasRect.width }
            },
            w: {
                width: Math.max(50, this.startSize.width - dx),
                x: this.startSize.x + (this.startSize.width - Math.max(50, this.startSize.width - dx)),
                snapCondition: (newX) => Math.abs(newX) < this.snapThreshold,
                snapX: () => 0,
                snapWidth: (newX) => this.startSize.x + this.startSize.width,
                guide: { type: 'vertical', position: 0 }
            },
            s: {
                height: Math.max(30, this.startSize.height + dy),
                snapCondition: (newY, newHeight) => Math.abs(newY + newHeight - canvasRect.height) < this.snapThreshold,
                snapHeight: (newY) => canvasRect.height - newY,
                guide: { type: 'horizontal', position: canvasRect.height }
            },
            n: {
                height: Math.max(30, this.startSize.height - dy),
                y: this.startSize.y + (this.startSize.height - Math.max(30, this.startSize.height - dy)),
                snapCondition: (newY) => Math.abs(newY) < this.snapThreshold,
                snapY: () => 0,
                snapHeight: (newY) => this.startSize.y + this.startSize.height,
                guide: { type: 'horizontal', position: 0 }
            }
        };
    
        // 초기 값 설정
        let newWidth = this.startSize.width;
        let newHeight = this.startSize.height;
        let newX = this.startSize.x;
        let newY = this.startSize.y;
    
        // 리사이즈 핸들 방향 분해
        const directions = this.resizeHandle.split('');
        
        // 각 방향별로 계산 수행
        directions.forEach(direction => {
            const calc = resizeCalculations[direction];
            if (!calc) return;
    
            // 너비/높이 업데이트
            if ('width' in calc) {
                newWidth = calc.width;
                if ('x' in calc) newX = calc.x;
                
                if (calc.snapCondition(newX, newWidth)) {
                    if (calc.snapWidth) newWidth = calc.snapWidth(newX);
                    if (calc.snapX) newX = calc.snapX();
                    guides.push(calc.guide);
                }
            }
            
            if ('height' in calc) {
                newHeight = calc.height;
                if ('y' in calc) newY = calc.y;
                
                if (calc.snapCondition(newY, newHeight)) {
                    if (calc.snapHeight) newHeight = calc.snapHeight(newY);
                    if (calc.snapY) newY = calc.snapY();
                    guides.push(calc.guide);
                }
            }
        });
    
        // 이미지 비율 유지 처리
        if (this.resizingElement.type === 'image' && this.resizingElement.aspectRatio && !e.shiftKey) {
            if (directions.some(d => ['e', 'w'].includes(d))) {
                newHeight = newWidth / this.resizingElement.aspectRatio;
            } else if (directions.some(d => ['n', 's'].includes(d))) {
                newWidth = newHeight * this.resizingElement.aspectRatio;
            }
        }
    
        // 그리드 스냅 처리
        if (this.gridSize > 0) {
            const roundToGrid = value => Math.round(value / this.gridSize) * this.gridSize;
            newWidth = roundToGrid(newWidth);
            newHeight = roundToGrid(newHeight);
            newX = roundToGrid(newX);
            newY = roundToGrid(newY);
        }
    
        // 요소 업데이트
        const updates = {
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY
        };
    
        // 요소와 DOM 업데이트
        Object.assign(this.resizingElement, updates);
        
        const elementDiv = document.getElementById(`element-${this.resizingElement.id}`);
        Object.assign(elementDiv.style, {
            width: `${newWidth}px`,
            height: `${newHeight}px`,
            left: `${newX}px`,
            top: `${newY}px`
        });
    
        // 가이드라인과 속성 업데이트
        this.showSnapGuides(guides);
        this.updateProperties();
    }

    updateProperties() {
        const propertiesDiv = document.getElementById('properties');
        
        if (!this.selectedElement) {
            propertiesDiv.innerHTML = '<p>No element selected</p>';
            return;
        }
    
        // 각 요소 타입별 특수 컨트롤 생성 함수
        const specialControls = {
            panel: (element) => ({
                title: 'Panel Colors',
                html: `
                    <div class="color-controls">
                        ${this.createColorControl('Background', element.backgroundColor, 'backgroundColor')}
                        ${this.createColorControl('Border', element.borderColor, 'borderColor')}
                        ${this.createColorControl('Header', element.headerColor, 'headerColor')}
                    </div>
                `,
                handler: 'updatePanelColor'
            }),
    
            link: (element) => ({
                title: 'Target Page',
                html: `
                    <select class="link-target-select" onchange="tool.updateLinkTarget(this.value)">
                        <option value="">Select target page...</option>
                        ${Array.from(this.pages.entries())
                            .filter(([pageId]) => pageId !== this.currentPageId)
                            .map(([pageId, page]) => `
                                <option value="${pageId}" ${element.targetPageId === pageId ? 'selected' : ''}>
                                    ${page.name}
                                </option>
                            `).join('')}
                    </select>
                `
            }),
    
            box: (element) => ({
                title: 'Box Style',
                html: `
                    <div class="box-controls">
                        ${this.createColorControl('Background', element.backgroundColor, 'backgroundColor')}
                        ${this.createColorControl('Border', element.borderColor, 'borderColor')}
                        <div class="checkbox-control">
                            <label>
                                <input type="checkbox" 
                                    ${element.showX ? 'checked' : ''}
                                    onchange="tool.updateBoxStyle('showX', this.checked)">
                                Show X Mark
                            </label>
                        </div>
                    </div>
                `,
                handler: 'updateBoxStyle'
            }),
    
            text: (element) => ({
                title: 'Text Style',
                html: `
                    <div class="text-controls">
                        <button 
                            class="style-button ${element.isBold ? 'active' : ''}"
                            onclick="tool.toggleBold()"
                            title="Bold">
                            <b>B</b>
                        </button>
                        <input type="number" 
                            class="property-input" 
                            value="${element.fontSize || 16}"
                            onchange="tool.updateFontSize(this.value)"
                            style="width: 60px">
                        <div class="text-align-controls">
                            ${this.createAlignButton('start', element)}
                            ${this.createAlignButton('center', element)}
                            ${this.createAlignButton('end', element)}
                        </div>
                    </div>
                `
            }),
    
            sticky: (element) => ({
                title: 'Sticky Style',
                html: `
                    <div class="sticky-colors">
                        ${this.stickyColors.map(color => `
                            <button 
                                class="color-button ${element.stickyColor === color ? 'active' : ''}"
                                style="background-color: ${color}"
                                onclick="tool.updateStickyColor('${color}')"
                            ></button>
                        `).join('')}
                    </div>
                    ${this.createStickyControls(element)}
                `
            })
        };
    
        // 공통 속성 섹션 생성
        const commonSections = [
            {
                title: 'Type',
                content: this.selectedElement.type
            },
            {
                title: 'Layer Position',
                content: `
                    <div class="layer-controls">
                        <button onclick="tool.moveToTop()">맨 위로</button>
                        <button onclick="tool.moveUp()">위로</button>
                        <button onclick="tool.moveDown()">아래로</button>
                        <button onclick="tool.moveToBottom()">맨 아래로</button>
                    </div>
                `
            },
            {
                title: 'Position',
                content: this.createNumberInputs({
                    x: Math.round(this.selectedElement.x),
                    y: Math.round(this.selectedElement.y)
                })
            },
            {
                title: 'Size',
                content: this.createNumberInputs({
                    width: Math.round(this.selectedElement.width),
                    height: Math.round(this.selectedElement.height)
                })
            },
            {
                title: 'Content',
                content: `
                    <textarea 
                        class="property-input auto-resize" 
                        onchange="tool.updateElementProperty('content', this.value)"
                        oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'"
                    >${this.selectedElement.content}</textarea>
                `
            }
        ];
    
        // 최종 HTML 생성
        const specialControl = specialControls[this.selectedElement.type]?.(this.selectedElement);
        
        const sections = [
            ...commonSections.map(section => this.createPropertyGroup(section.title, section.content)),
            specialControl && this.createPropertyGroup(specialControl.title, specialControl.html)
        ].filter(Boolean);
    
        propertiesDiv.innerHTML = sections.join('');
    
        // textarea 자동 높이 조절
        const textarea = propertiesDiv.querySelector('textarea.auto-resize');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }
    
    // 헬퍼 메서드들
    createPropertyGroup(title, content) {
        return `
            <div class="property-group">
                <label class="property-label">${title}</label>
                <div>${content}</div>
            </div>
        `;
    }
    
    createColorControl(label, value, property) {
        return `
            <div class="color-control">
                <label>${label}</label>
                <input type="color" 
                    value="${value || '#ffffff'}"
                    onchange="tool.updatePanelColor('${property}', this.value)">
            </div>
        `;
    }
    
    createNumberInputs(values) {
        return Object.entries(values)
            .map(([key, value]) => `
                <input type="number" 
                    class="property-input" 
                    value="${value}"
                    onchange="tool.updateElementProperty('${key}', this.value)">
            `).join('');
    }
    
    createAlignButton(align, element) {
        const icons = {
            start: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" /></svg>',
            center: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>',
            end: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>'
        };
        
        return `
            <button 
                class="style-button ${element.textAlign === align ? 'active' : ''}"
                onclick="tool.updateTextAlign('${align}')"
                title="Align ${align}">
                ${icons[align]}
            </button>
        `;
    }
    
    createStickyControls(element) {
        return `
            <div class="sticky-controls">
                <div class="control-group">
                    <label>Opacity</label>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.1" 
                        value="${element.opacity}"
                        onchange="tool.updateStickyStyle('opacity', this.value)"
                        class="opacity-slider">
                    <span>${Math.round(element.opacity * 100)}%</span>
                </div>
                <div class="control-group">
                    <label>Font Size</label>
                    <input 
                        type="number" 
                        min="8" 
                        max="72" 
                        value="${element.fontSize}"
                        onchange="tool.updateStickyStyle('fontSize', this.value)"
                        class="font-size-input">
                    <span>px</span>
                </div>
            </div>
        `;
    }

    updateTextAlign(align) {
        if (!this.selectedElement || this.selectedElement.type !== 'text') return;
        
        this.selectedElement.justifyContent = align;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.justifyContent = align;
            // 편집 중인 경우에도 적용
            const editableDiv = elementDiv.querySelector('.editable-text');
            if (editableDiv) {
                editableDiv.style.justifyContent = align;
            }
        }
        
        this.updateProperties();
        this.saveHistory();
    }

    updateLinkTarget(pageId) {
        if (!this.selectedElement || this.selectedElement.type !== 'link') return;
        
        // pageId를 숫자로 변환 (select의 value는 문자열로 전달됨)
        const targetPageId = pageId ? parseInt(pageId) : null;
        this.selectedElement.targetPageId = targetPageId;
        
        // content 업데이트
        if (targetPageId && this.pages.has(targetPageId)) {
            this.selectedElement.content = `🔗 Go to: ${this.pages.get(targetPageId).name}`;
        } else {
            this.selectedElement.content = '🔗 Click to set target page';
        }
        
        // DOM 업데이트
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            const linkContent = elementDiv.querySelector('.link-content');
            if (linkContent) {
                linkContent.textContent = this.selectedElement.content;
            }
        }
        
        this.saveHistory();
    }
    
    // 미리보기 모드 토글
    togglePreviewMode() {
        this.previewMode = !this.previewMode;
        document.body.classList.toggle('preview-mode', this.previewMode);
        
        const previewButton = document.querySelector('.toolbar button[title="Toggle Preview Mode"]');
        if (previewButton) {
            previewButton.textContent = this.previewMode ? '✏️ Edit' : '👁️ Preview';
        }
        
        if (this.previewMode) {
            this.clearSelection();
        }
    }

    updateStickyStyle(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'sticky') return;
    
        this.selectedElement[property] = property === 'opacity' ? 
            parseFloat(value) : 
            parseInt(value);
    
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        const contentDiv = elementDiv.querySelector('.sticky-content');
        
        switch(property) {
            case 'opacity':
                elementDiv.style.opacity = value;
                this.updateProperties(); // 퍼센트 표시 업데이트
                break;
            case 'fontSize':
                contentDiv.style.fontSize = `${value}px`;
                break;
        }
    
        this.saveHistory();
    }

    updateBoxStyle(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'box') return;
        
        this.selectedElement[property] = value;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        const placeholder = elementDiv.querySelector('.box-placeholder');
        const lines = elementDiv.querySelectorAll('line');
    
        switch (property) {
            case 'backgroundColor':
                elementDiv.style.backgroundColor = value;
                break;
            case 'borderColor':
                elementDiv.style.borderColor = value;
                break;
            case 'showX':
                placeholder.classList.toggle('hide-x', !value);
                break;
            case 'xColor': // X 표시 색상 변경 옵션 추가
                lines.forEach(line => line.setAttribute('stroke', value));
                break;
        }
        
        this.saveHistory();
    }

    updateBoxColor(color) {
        if (!this.selectedElement || this.selectedElement.type !== 'box') return;
        
        this.selectedElement.backgroundColor = color;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.backgroundColor = color;
        
        this.saveHistory();
    }

    updateStickyColor(color) {
        if (!this.selectedElement || this.selectedElement.type !== 'sticky') return;
        
        this.selectedElement.stickyColor = color;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.backgroundColor = color;
        
        this.updateProperties();
        this.saveHistory();
    }

    updatePanelColor(colorType, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'panel') return;

        this.selectedElement[colorType] = value;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);

        switch(colorType) {
            case 'backgroundColor':
                elementDiv.style.backgroundColor = value;
                elementDiv.querySelector('.panel-content').style.backgroundColor = value;
                break;
            case 'borderColor':
                elementDiv.style.borderColor = value;
                elementDiv.querySelector('.panel-header').style.borderBottomColor = value;
                break;
            case 'headerColor':
                elementDiv.querySelector('.panel-header').style.backgroundColor = value;
                break;
        }

        this.saveHistory();
    }

    updateElementProperty(property, value) {
        if (!this.selectedElement) return;
    
        const numValue = property === 'content' ? value : Number(value);
        this.selectedElement[property] = numValue;
    
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        switch(property) {
            case 'x':
                elementDiv.style.left = `${numValue}px`;
                break;
            case 'y':
                elementDiv.style.top = `${numValue}px`;
                break;
            case 'width':
                elementDiv.style.width = `${numValue}px`;
                break;
            case 'height':
                elementDiv.style.height = `${numValue}px`;
                break;
            case 'content':
                if (this.selectedElement.type === 'input') {
                    elementDiv.querySelector('input').placeholder = value;
                } else if (this.selectedElement.type === 'panel') {
                    // 패널의 경우 content 부분만 업데이트
                    const contentDiv = elementDiv.querySelector('.panel-content');
                    if (contentDiv) {
                        contentDiv.textContent = value;
                    }
                } else {
                    elementDiv.textContent = value;
                }
                break;
        }
    
        this.saveHistory();
        this.updateLayersList();
    }

    updateFontSize(size) {
        if (!this.selectedElement || this.selectedElement.type !== 'text') return;
        
        const fontSize = Math.max(8, Math.min(72, parseInt(size))); // 8px ~ 72px 제한
        this.selectedElement.fontSize = fontSize;
        
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.fontSize = `${fontSize}px`;
        
        this.saveHistory();
    }

    increaseFontSize() {
        if (!this.selectedElement || this.selectedElement.type !== 'text') return;
        const currentSize = this.selectedElement.fontSize || 16;
        this.updateFontSize(currentSize + 2);
    }

    decreaseFontSize() {
        if (!this.selectedElement || this.selectedElement.type !== 'text') return;
        const currentSize = this.selectedElement.fontSize || 16;
        this.updateFontSize(currentSize - 2);
    }

    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';
    
        [...this.elements].reverse().forEach(element => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item${element === this.selectedElement ? ' selected' : ''}`;
            
            layerItem.innerHTML = `
                <div class="layer-info">
                    <span class="layer-name">${element.name}</span>
                    <small class="layer-type">${element.type}</small>
                </div>
                <div class="layer-actions">
                    <button class="edit-name-btn" onclick="tool.editElementName(${element.id})" title="Edit Name">✏️</button>
                    <button class="delete-btn" onclick="tool.deleteElement(${element.id})" title="Delete">🗑️</button>
                </div>
            `;
    
            layerItem.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.selectElement(element);
                }
            });
            layersList.appendChild(layerItem);
        });
    }

    editElementName(elementId) {
        const element = this.elements.find(el => el.id === elementId);
        if (!element) return;
    
        const newName = prompt('Enter new name:', element.name);
        if (newName && newName.trim()) {
            element.name = newName.trim();
            this.updateLayersList();
            this.saveHistory();
        }
    }

    deleteElement(id) {
        const elementToDelete = id ? this.elements.find(e => e.id === id) : this.selectedElement;
        if (!elementToDelete) return;

        const elementDiv = document.getElementById(`element-${elementToDelete.id}`);
        if (elementDiv) elementDiv.remove();

        this.elements = this.elements.filter(e => e !== elementToDelete);
        if (this.selectedElement === elementToDelete) {
            this.selectedElement = null;
        }

        this.updateProperties();
        this.updateLayersList();
        this.saveHistory();
    }

    deleteSelected() {
        this.deleteElement();
    }

    setGridSize(size) {
        this.gridSize = parseInt(size);
        const canvas = document.getElementById('canvas');
        if (this.gridSize > 0) {
            canvas.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        } else {
            canvas.style.backgroundSize = '0';
        }
    }

    clearSelection() {
        document.querySelectorAll('.element.selected').forEach((el) => {
            el.classList.remove('selected');
            el.querySelectorAll('.resize-handle').forEach(handle => handle.remove());  // 리사이즈 핸들 제거
        });
        this.selectedElement = null;
        this.updateProperties();
        this.updateLayersList();
    }

    // 요소를 맨 위로 이동
    moveToTop() {
        if (!this.selectedElement) return;
        
        this.maxZIndex++;
        this.selectedElement.zIndex = this.maxZIndex;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.zIndex = this.maxZIndex;
        this.saveHistory();
    }

    // 요소를 한 단계 위로 이동
    moveUp() {
        if (!this.selectedElement) return;
        
        const currentZ = this.selectedElement.zIndex || 0;
        const upperElement = this.elements.find(el => el.zIndex === currentZ + 1);
        
        if (upperElement) {
            upperElement.zIndex = currentZ;
            document.getElementById(`element-${upperElement.id}`).style.zIndex = currentZ;
            
            this.selectedElement.zIndex = currentZ + 1;
            document.getElementById(`element-${this.selectedElement.id}`).style.zIndex = currentZ + 1;
        } else {
            this.moveToTop();
        }
        
        this.saveHistory();
    }

    // 요소를 한 단계 아래로 이동
    moveDown() {
        if (!this.selectedElement) return;
        
        const currentZ = this.selectedElement.zIndex || 0;
        const lowerElement = this.elements.find(el => el.zIndex === currentZ - 1);
        
        if (lowerElement && currentZ > 1) {
            lowerElement.zIndex = currentZ;
            document.getElementById(`element-${lowerElement.id}`).style.zIndex = currentZ;
            
            this.selectedElement.zIndex = currentZ - 1;
            document.getElementById(`element-${this.selectedElement.id}`).style.zIndex = currentZ - 1;
        } else {
            this.moveToBottom();
        }
        
        this.saveHistory();
    }

    // 요소를 맨 아래로 이동
    moveToBottom() {
        if (!this.selectedElement) return;
        
        this.elements.forEach(element => {
            if (element !== this.selectedElement) {
                element.zIndex = (element.zIndex || 0) + 1;
                const elementDiv = document.getElementById(`element-${element.id}`);
                elementDiv.style.zIndex = element.zIndex;
            }
        });
        
        this.selectedElement.zIndex = 1;
        document.getElementById(`element-${this.selectedElement.id}`).style.zIndex = 1;
        
        this.maxZIndex = Math.max(...this.elements.map(el => el.zIndex || 0));
        this.saveHistory();
    }

    // 실행 취소/다시 실행 관련 메서드
    saveHistory() {
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        this.history.push(JSON.stringify(this.elements));
        this.currentHistoryIndex++;
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.loadState(this.history[this.currentHistoryIndex]);
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            this.loadState(this.history[this.currentHistoryIndex]);
        }
    }

    loadState(state) {
        this.elements = JSON.parse(state);
        this.selectedElement = null;
        document.getElementById('canvas').innerHTML = '';
        this.elements.forEach(element => this.renderElement(element));
        this.updateProperties();
    }

    // 저장/불러오기 관련 메서드
    save() {
        // 현재 페이지 상태 저장
        if (this.currentPageId) {
            const currentPage = this.pages.get(this.currentPageId);
            if (currentPage) {
                currentPage.elements = this.elements;
                currentPage.device = this.currentDevice;
                currentPage.gridSize = this.gridSize;
            }
        }
        
        const data = {
            pages: Array.from(this.pages.entries()).map(([pageId, page]) => ({
                id: pageId,
                name: page.name,
                elements: page.elements,
                device: page.device,
                gridSize: page.gridSize
            })),
            currentPageId: this.currentPageId,
            maxZIndex: this.maxZIndex
        };
        
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prototype.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    load() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // 페이지 맵 재구성
                    this.pages = new Map(
                        data.pages.map(page => [
                            page.id,
                            {
                                id: page.id,
                                name: page.name,
                                elements: page.elements,
                                device: page.device,
                                gridSize: page.gridSize
                            }
                        ])
                    );
                    
                    // 현재 페이지 ID 설정
                    this.currentPageId = data.currentPageId;
                    
                    // maxZIndex 복원
                    this.maxZIndex = data.maxZIndex || Math.max(
                        ...data.pages.flatMap(page => 
                            page.elements.map(el => el.zIndex || 0)
                        ),
                        0
                    );
    
                    // 현재 페이지로 전환
                    if (this.currentPageId && this.pages.has(this.currentPageId)) {
                        const currentPage = this.pages.get(this.currentPageId);
                        this.elements = currentPage.elements || [];
                        this.currentDevice = currentPage.device;
                        this.setGridSize(currentPage.gridSize || 0);
                        
                        // UI 업데이트
                        this.renderCanvas();
                        this.updatePageList();
                    } else if (this.pages.size > 0) {
                        // 현재 페이지가 없으면 첫 번째 페이지로
                        this.currentPageId = this.pages.keys().next().value;
                        this.switchPage(this.currentPageId);
                    }
    
                } catch (error) {
                    console.error('Error loading file:', error);
                    alert('Failed to load the file. Please make sure it is a valid prototype file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // 이미지로 내보내기
    async exportAsImage() {
        const canvas = document.getElementById('canvas');

        // 현재 상태를 저장
        const originalStyle = canvas.style.backgroundImage;
        const selectedElement = this.selectedElement;
        const resizeHandles = document.querySelectorAll('.resize-handle');
        
        try {
            // 1. 그리드 제거
            canvas.style.backgroundImage = 'none';
            
            // 2. 선택된 요소의 상태 제거
            if(selectedElement) {
                const selectedDiv = document.getElementById(`element-${selectedElement.id}`);
                if(selectedDiv) selectedDiv.classList.remove('selected');
            }
            
            // 3. 리사이즈 핸들 임시 숨김
            resizeHandles.forEach(handle => {
                handle.style.display = 'none';
            });

            // html2canvas 옵션 설정
            const options = {
                backgroundColor: '#ffffff',
                scale: 2, // 고해상도
                useCORS: true,
                logging: false,
                removeContainer: false,
                ignoreElements: (element) => {
                    // resize-handle 클래스를 가진 요소 무시
                    return element.classList.contains('resize-handle');
                }
            };

            // 이미지 생성
            const imageCanvas = await html2canvas(canvas, options);
            
            // 이미지 다운로드
            const link = document.createElement('a');
            link.download = 'prototype.png';
            link.href = imageCanvas.toDataURL('image/png', 1.0);
            link.click();

        } catch (error) {
            console.error('Failed to export image:', error);
            alert('Failed to export image. Please try again.');
        } finally {
            // 모든 상태 복원
            canvas.style.backgroundImage = originalStyle;
            
            if(selectedElement) {
                const selectedDiv = document.getElementById(`element-${selectedElement.id}`);
                if(selectedDiv) {
                    selectedDiv.classList.add('selected');
                    // 리사이즈 핸들 다시 표시
                    this.addResizeHandles(selectedDiv);
                }
            }

            // 숨겼던 리사이즈 핸들 복원
            resizeHandles.forEach(handle => {
                handle.style.display = '';
            });
        }
    }

    showShortcutGuide() {
        const modal = document.createElement('div');
        modal.className = 'shortcut-modal';
        
        modal.innerHTML = `
            <div class="shortcut-content">
                <button class="shortcut-close" onclick="this.closest('.shortcut-modal').remove()">×</button>
                <h2 style="margin-bottom: 20px;">Keyboard Shortcuts</h2>
                
                <div class="shortcut-section">
                    <h3>General</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <span>Copy</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span class="key">C</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Paste</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span class="key">V</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Undo</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span class="key">Z</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Redo</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span class="key">Y</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Delete Selected</span>
                            <div class="shortcut-keys">
                                <span class="key">Del</span>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="shortcut-section">
                    <h3>Text Editing</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <span>Bold Text</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span class="key">B</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Finish Editing</span>
                            <div class="shortcut-keys">
                                <span class="key">Enter</span>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="shortcut-section">
                    <h3>Moving & Resizing</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <span>Move 1px</span>
                            <div class="shortcut-keys">
                                <span class="key">↑</span>
                                <span class="key">↓</span>
                                <span class="key">←</span>
                                <span class="key">→</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Move 10px</span>
                            <div class="shortcut-keys">
                                <span class="key">Shift</span>
                                <span class="key">+</span>
                                <span class="key">↑</span>
                                <span class="key">↓</span>
                                <span class="key">←</span>
                                <span class="key">→</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Free Resize Image <small>(Release aspect ratio)</small></span>
                            <div class="shortcut-keys">
                                <span class="key">Shift</span>
                                <span class="key">+ Drag</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="shortcut-section">
                    <h3>lorem ipsum</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <span>lorem</span>
                            <div class="shortcut-keys">
                                <span class="key">lorem</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>lorem</span>
                            <div class="shortcut-keys">
                                <span class="key">1lorem, .lorem</span>
                                <span class="key">2lorem, ..lorem</span>
                                <span class="key">3lorem, ...lorem</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    
        // Mac 사용자를 위한 단축키 수정
        if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
            modal.querySelectorAll('.key').forEach(key => {
                if (key.textContent === 'Ctrl') {
                    key.textContent = '⌘';
                }
            });
        }
    
        document.body.appendChild(modal);
    
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    
        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // HTML로 내보내기
    exportAsHTML() {
        // CSS 스타일 생성
        const styles = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            .prototype-container {
                position: relative;
                width: ${this.currentDevice ? this.devicePresets[this.currentDevice].width : '100%'};
                height: ${this.currentDevice ? this.devicePresets[this.currentDevice].height : '100%'};
                background: white;
                overflow: hidden;
            }
            .element {
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 8px;
            }
            .element.button {
                background: #2196f3;
                color: white;
                border: none;
                cursor: pointer;
                text-align: center;
            }
            .element.input input {
                width: 100%;
                height: 100%;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 4px;
            }
            .element.text {
                background: transparent;
                border: none;
            }
        `;

        // HTML 생성
        let elementsHTML = '';
        this.elements.forEach(element => {
            const style = `
                left: ${element.x}px;
                top: ${element.y}px;
                width: ${element.width}px;
                height: ${element.height}px;
                z-index: ${element.zIndex || 1};
                ${element.type === 'text' ? `font-size: ${element.fontSize || 16}px;` : ''}
            `;

            let content = '';
            switch(element.type) {
                case 'button':
                    content = `<button style="width:100%;height:100%;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;display:flex;justify-content:center;align-items:center;">${element.content}</button>`;
                    break;
                case 'input':
                    content = `<input type="text" placeholder="${element.content}" style="width:100%;height:100%;">`;
                    break;
                case 'text':
                    content = element.content;
                    break;
            }

            elementsHTML += `
                <div class="element ${element.type}" style="${style}">
                    ${content}
                </div>
            `;
        });

        // 최종 HTML 문서 생성
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Exported Prototype</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="prototype-container">
                    ${elementsHTML}
                </div>
            </body>
            </html>`;

        // HTML 파일 다운로드
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'prototype.html';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    // HTML 내보내기시 인터랙션 코드 생성
    generateInteractions() {
        let js = '';
        
        // 버튼 클릭 이벤트 등 인터랙션 코드 추가
        this.elements.forEach(element => {
            if (element.type === 'button') {
                js += `
                    document.querySelector('#element-${element.id} button').addEventListener('click', function() {
                        console.log('Button clicked:', '${element.content}');
                    });
                `;
            }
        });

        return js;
    }

    addNewPage() {
        const pageName = prompt('Enter page name:', `Page ${this.pages.size + 1}`);
        if (pageName && pageName.trim()) {
            this.createPage(pageName.trim());
        }
    }
    
    switchPage(pageId) {
        if (!this.pages.has(pageId)) return;
        
        // 현재 페이지 상태 저장
        if (this.currentPageId) {
            const currentPage = this.pages.get(this.currentPageId);
            currentPage.elements = this.elements;
            currentPage.device = this.currentDevice;
            currentPage.gridSize = this.gridSize;
        }
        
        // 새 페이지 로드
        const newPage = this.pages.get(pageId);
        this.elements = [...newPage.elements];
        this.currentPageId = pageId;
        this.currentDevice = newPage.device;
        this.gridSize = newPage.gridSize;
        
        // UI 업데이트
        this.renderCanvas();
        this.updatePageList();
    }
    
    renamePage(pageId) {
        const page = this.pages.get(pageId);
        if (!page) return;
        
        const newName = prompt('Enter new page name:', page.name);
        if (newName && newName.trim()) {
            page.name = newName.trim();
            this.updatePageList();
        }
    }
    
    deletePage(pageId) {
        if (this.pages.size <= 1) {
            alert('Cannot delete the last page');
            return;
        }
        
        if (confirm('Are you sure you want to delete this page?')) {
            this.pages.delete(pageId);
            if (this.currentPageId === pageId) {
                this.currentPageId = this.pages.keys().next().value;
                this.switchPage(this.currentPageId);
            } else {
                this.updatePageList();
            }
        }
    }
    
    updatePageList() {
        const pagesList = document.getElementById('pages-list');
        pagesList.innerHTML = '';
        
        this.pages.forEach((page, pageId) => {
            const pageItem = document.createElement('div');
            pageItem.className = `page-item${pageId === this.currentPageId ? ' active' : ''}`;
            
            pageItem.innerHTML = `
                <span class="page-name">${page.name}</span>
                <div class="page-actions">
                    <button onclick="tool.renamePage(${pageId})" title="Rename">✏️</button>
                    <button onclick="tool.deletePage(${pageId})" title="Delete">🗑️</button>
                </div>
            `;
            
            pageItem.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.switchPage(pageId);
                }
            });
            
            pagesList.appendChild(pageItem);
        });
    }
    
    // 캔버스 렌더링 메서드
    renderCanvas() {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = '';
        this.elements.forEach(element => this.renderElement(element));
        this.selectedElement = null;
        this.updateProperties();
        this.updateLayersList();
    }

    
}

// 툴 초기화
const tool = new PrototypingTool();