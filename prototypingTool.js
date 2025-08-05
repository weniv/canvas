class PrototypingTool {
    constructor() {
        this.checkMobileAccess();
        this.elements = [];
        this.selectedElement = null;
        this.selectedElements = []; // 다중 선택을 위한 배열
        this.draggedElement = null;
        this.resizingElement = null;
        this.resizeHandle = null;
        this.offset = { x: 0, y: 0 };
        this.gridSize = 0;
        this.history = [];
        this.currentHistoryIndex = -1;
        this.maxZIndex = 1;
        this.clipboard = null;
        this.isTextPlacementMode = false; // 텍스트 배치 모드 플래그
        this.textPlacementClickHandler = null;
        this.textPlacementEscHandler = null;
        this.textPlacementOutsideClickHandler = null;
        this.panelDefaultSize = {
            width: 200,
            height: 150,
        };
        this.snapThreshold = 5;
        this.snapGuides = [];
        this.zoomAnimationId = null;

        // 무한 캔버스 관련 설정
        this.scale = 1; // 줌 레벨
        this.isPanning = false; // 패닝 중인지 여부
        this.lastPanPosition = { x: 0, y: 0 }; // 마지막 패닝 위치
        this.canvasOffset = { x: 100, y: 100 }; // 캔버스 오프셋

        this.lastMousePosition = null;
        this.autoScrollState = {
            isScrolling: false,
            scrollIntervalId: null,
            direction: { x: 0, y: 0 },
            speed: { x: 0, y: 0 },
        };

        // 줌 초기화 플래그
        this.zoomInitialized = false;

        // 테이블 기본 설정
        this.tableDefaults = {
            rows: 3,
            cols: 3,
            cellPadding: 8,
            borderColor: "#dddddd",
            headerBgColor: "#f5f5f5",
            cellBgColor: "#ffffff",
            textColor: "#000000",
            fontSize: 14,
            headerFontWeight: "bold",
            cellFontWeight: "normal",
        };

        // 아이콘 경로 매핑 (HTML의 data-icon 값과 img src 경로 매핑)
        this.iconPaths = {
            close: "./src/images/icon-asset-x.svg",
            "arrow-up": "./src/images/icon-asset-arrow.svg",
            "arrow-down": "./src/images/icon-asset-arrow.svg",
            plus: "./src/images/icon-asset-plus.svg",
            hamburger: "./src/images/icon-asset-hamburger.svg",
            home: "./src/images/icon-asset-home.svg",
            search: "./src/images/icon-asset-search.svg",
            user: "./src/images/icon-asset-person.svg",
            setting: "./src/images/icon-asset-setting.svg",
            link: "./src/images/icon-asset-link.svg",
            speaker: "./src/images/icon-asset-speaker.svg",
            share: "./src/images/icon-asset-share.svg",
            "anglebracket-open": "./src/images/icon-asset-anlgebracket.svg",
            "anglebracket-close": "./src/images/icon-asset-anlgebracket.svg",
            writing: "./src/images/icon-asset-writing.svg",
            image: "./src/images/icon-asset-Image.svg",
            download: "./src/images/icon-asset-download.svg",
            upload: "./src/images/icon-asset-upload.svg",
            heart: "./src/images/icon-asset-heart.svg",
            "heart-fill": "./src/images/icon-asset-heart-fill.svg",
            check: "./src/images/icon-asset-check.svg",
            "check-fill": "./src/images/icon-asset-check-fill.svg",
            "square-check": "./src/images/icon-asset-square-check.svg",
            "square-check-fill": "./src/images/icon-asset-square-check-fill.svg",
            calendar: "./src/images/icon-asset-calendar.svg",
        };

        this.iconDefaultSize = 26; // 기본 크기
        this.iconColors = [
            "#000000", // 검정
            "#FF0000", // 빨강
            "#00FF00", // 초록
            "#0000FF", // 파랑
            "#FFA500", // 주황
        ];

        this.stickyColors = [
            "#fff740", // 노랑
            "#ff7eb9", // 핑크
            "#7afcff", // 하늘
            "#98ff98", // 연두
            "#ffb347", // 주황
        ];

        this.buttonColors = ["#2E6FF2", "#fff", "#D9DBE0"];

        // 페이지
        this.pages = new Map(); // 페이지 저장소
        this.currentPageId = null; // 현재 페이지 ID

        // 줌과 패닝
        this.scale = 1; // 줌 레벨
        this.isPanning = false; // 패닝 중인지 여부
        this.lastPanPosition = { x: 0, y: 0 }; // 마지막 패닝 위치
        this.canvasOffset = { x: 0, y: 0 }; // 캔버스 오프셋

        // 디바이스 프리셋
        this.devicePresets = {
            desktop: { width: 1920, height: 1080 },
            laptop: { width: 1366, height: 768 },
            iphone12: { width: 390, height: 844 },
            galaxy: { width: 412, height: 915 },
            ipad: { width: 820, height: 1180 },
            custom: { width: null, height: null },
        };
        this.currentDevice = "desktop";
        this.snapThreshold = 9; // 스냅이 작동할 거리 (픽셀)
        this.snapEnabled = true; // 스냅 기능 활성화 여부

        this.loremText =
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

        // 첫 페이지 생성
        this.createPage("Home");

        this.initializeEvents();
        this.saveHistory();

        // 툴바 드롭다운
        this.initializeDropdowns();

        // 헤더 버튼
        this.initializeHeaderButtons();

        this.loadFromLocalStorage();

        // 초기화 후에 호출
        this.initializeZoomAndPan();
        this.initializeCanvasControls();

        document.addEventListener("mousemove", (e) => {
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        });
    }

    // 헤더 버튼 초기화 메서드
    initializeHeaderButtons() {
        // JSON 파일 불러오기 버튼만 별도 처리 (드롭다운이 없음)
        const jsonButton = document.querySelector(".json-button");
        jsonButton.addEventListener("click", () => this.load());
    }

    // 저장 옵션 닫기 메서드
    closeSaveOptions() {
        const saveButton = document.querySelector(".save-button");
        const saveOptions = document.querySelector(".save-options");

        saveButton.classList.remove("active");
        saveOptions.style.display = "none";
    }

    // 로컬 스토리지 저장 메서드
    saveAsLocal() {
        try {
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
                    gridSize: page.gridSize,
                })),
                currentPageId: this.currentPageId,
                maxZIndex: this.maxZIndex,
            };

            localStorage.setItem("canvasData", JSON.stringify(data));

            // 성공 알림
            this.showNotification("저장 완료", "로컬 스토리지에 저장되었습니다.");
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            // 오류 알림
            this.showNotification("저장 실패", "용량이 너무 큰 경우 JSON 다운로드를 이용해주세요.", "error");
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem("canvasData");
            if (savedData) {
                const data = JSON.parse(savedData);

                // Reconstruct the pages Map
                this.pages = new Map(
                    data.pages.map((page) => [
                        page.id,
                        {
                            id: page.id,
                            name: page.name,
                            elements: page.elements,
                            device: page.device,
                            gridSize: page.gridSize,
                        },
                    ])
                );

                // Set current page ID
                this.currentPageId = data.currentPageId;

                // Set maxZIndex
                this.maxZIndex = data.maxZIndex || 1;

                // Load the current page's elements and settings
                if (this.currentPageId && this.pages.has(this.currentPageId)) {
                    const currentPage = this.pages.get(this.currentPageId);
                    this.elements = currentPage.elements || [];
                    this.currentDevice = currentPage.device;
                    this.setGridSize(currentPage.gridSize || 0);
                }

                // Render the canvas with loaded elements
                this.renderCanvas();
                this.updatePageList();

                // Save initial state to history
                this.saveHistory();
            } else {
                // If no saved data exists, create the initial page
                this.createPage("Home");
            }
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            // If there's an error, create a new initial page
            this.createPage("Home");
        }
    }

    // 알림 표시 메서드
    showNotification(title, message, type = "success") {
        const notification = document.createElement("div");
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === "success" ? "#4CAF50" : "#F44336"};
        color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 300px;
        font-size: 14px;
    `;

        notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
        <div>${message}</div>
    `;

        document.body.appendChild(notification);

        // 3초 후 알림 제거
        setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transition = "opacity 0.3s ease";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initializeDropdowns() {
        // 툴바와 헤더의 드롭다운을 가진 버튼들 선택
        const dropdownButtons = document.querySelectorAll(".toolbar .dropdown-container button, .header .dropdown-container button");

        // 헤더와 툴바 드롭다운에 구분 클래스 추가
        document.querySelectorAll(".header .dropdown-menu").forEach((dropdown) => {
            dropdown.classList.add("header-dropdown");
        });

        document.querySelectorAll(".toolbar .dropdown-menu").forEach((dropdown) => {
            dropdown.classList.add("toolbar-dropdown");
        });

        // 각 버튼에 클릭 이벤트 추가
        dropdownButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                this.handleDropdownToggle(e);
            });
        });

        // 드롭다운 외부 클릭 시 닫기
        document.addEventListener("click", () => {
            this.closeAllDropdowns();
        });

        // ESC 키 누를 때 모든 드롭다운 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeAllDropdowns();
            }
        });

        // 전역 툴팁 관리자 초기화
        this.initTooltipManager();
    }

    handleDropdownToggle(e) {
        const button = e.target.closest('[aria-haspopup="true"]');

        if (!button) {
            return;
        }

        const dropdown = button.nextElementSibling;

        if (!dropdown || !dropdown.classList.contains("dropdown-menu")) {
            return;
        }

        // 현재 드롭다운이 열려있는지 확인
        const isCurrentDropdownOpen = dropdown.classList.contains("show");

        // 다른 모든 드롭다운 즉시 닫기
        this.closeAllDropdowns();

        // 현재 드롭다운이 닫혀있었다면 즉시 열기
        if (!isCurrentDropdownOpen) {
            // 지연 없이 즉시 열기
            this.openDropdown(dropdown, button);
        }
    }

    openDropdown(dropdown, button) {
        // show 클래스와 상태를 먼저 설정
        dropdown.classList.add("show");
        button.setAttribute("aria-expanded", "true");
        button.classList.add("active");

        // 즉시 위치 설정 (애니메이션 없이)
        this.positionDropdown(button, dropdown);

        // 드롭다운 아이템 클릭 이벤트 바인딩
        dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.handleDropdownItemClick(item, dropdown);
            });
        });
    }

    moveDropdownToBody(dropdown, button) {
        const isHeaderDropdown = button.closest(".header") !== null;

        if (isHeaderDropdown && dropdown.parentElement !== document.body) {
            // 원래 위치 정보 저장
            dropdown._originalParent = dropdown.parentElement;
            dropdown._originalNextSibling = dropdown.nextElementSibling;

            // 현재 위치를 저장 (이후 위치 계산 참조용)
            const originalRect = dropdown.getBoundingClientRect();

            // body로 이동하기 전에 CSS transition 비활성화
            const originalTransition = dropdown.style.transition;
            dropdown.style.transition = "none";

            // body로 이동
            document.body.appendChild(dropdown);

            // 필요한 스타일 적용
            dropdown.style.position = "fixed";
            dropdown.style.pointerEvents = "auto";
            dropdown.style.isolation = "isolate";

            // transition은 나중에 복원될 예정 (positionDropdown에서)
        }
    }

    restoreDropdownPosition(dropdown) {
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
            // 원래 위치로 되돌림
            if (dropdown._originalNextSibling) {
                dropdown._originalParent.insertBefore(dropdown, dropdown._originalNextSibling);
            } else {
                dropdown._originalParent.appendChild(dropdown);
            }

            // 참조 정리
            delete dropdown._originalParent;
            delete dropdown._originalNextSibling;

            // 추가했던 스타일 제거
            dropdown.style.position = "";
            dropdown.style.pointerEvents = "";
            dropdown.style.isolation = "";
        }
    }

    initTooltipManager() {
        // 전역 툴팁 요소 생성
        this.globalTooltip = document.createElement("div");
        this.globalTooltip.className = "global-tooltip";
        this.globalTooltip.style.cssText = `
            position: fixed;
            background: #202124;
            color: white;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
            pointer-events: none;
            z-index: 999999;
            transform: translateX(-50%);
        `;

        // 툴팁 화살표 추가
        const arrow = document.createElement("div");
        arrow.style.cssText = `
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-bottom-color: #202124;
        `;
        this.globalTooltip.appendChild(arrow);

        document.body.appendChild(this.globalTooltip);

        // 툴바 버튼들에 이벤트 바인딩
        this.bindToolbarEvents();
    }

    bindToolbarEvents() {
        // 툴바의 모든 버튼에 툴팁 이벤트 바인딩
        document.querySelectorAll(".toolbar .tool-btn").forEach((button) => {
            const tooltipText = button.getAttribute("aria-label") || button.getAttribute("title");

            button.addEventListener("mouseenter", (e) => {
                this.showTooltip(e.target, tooltipText);
            });

            button.addEventListener("mouseleave", () => {
                this.hideTooltip();
            });
        });

        // 헤더의 버튼들에도 툴팁 이벤트 바인딩
        document.querySelectorAll(".header .header-btn").forEach((button) => {
            const tooltipText = button.getAttribute("aria-label") || button.getAttribute("title");

            button.addEventListener("mouseenter", (e) => {
                this.showTooltip(e.target, tooltipText);
            });

            button.addEventListener("mouseleave", () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        if (!text) return;

        // 숨겨진 상태인지 확인
        const isHidden = !this.globalTooltip.classList.contains("show");

        // 숨겨진 상태라면 transition 없이 즉시 위치 이동
        if (isHidden) {
            this.globalTooltip.style.transition = "none";
        }

        // 텍스트 설정 (첫 번째 자식이 화살표이므로 직접 textContent 설정)
        this.globalTooltip.childNodes[1] ? (this.globalTooltip.childNodes[1].textContent = text) : this.globalTooltip.appendChild(document.createTextNode(text));

        // 버튼 위치 계산
        const rect = element.getBoundingClientRect();

        // 툴팁을 버튼 중앙 아래에 배치
        const left = rect.left + rect.width / 2;
        const top = rect.bottom + 8;

        this.globalTooltip.style.left = left + "px";
        this.globalTooltip.style.top = top + "px";

        // 숨겨진 상태에서만 transition 복원 및 표시
        if (isHidden) {
            // 브라우저가 위치 변경을 적용할 수 있도록 강제 리플로우
            void this.globalTooltip.offsetHeight;

            // transition 복원 후 표시
            this.globalTooltip.style.transition = "all 0.2s ease";
            this.globalTooltip.classList.add("show");
            this.globalTooltip.style.opacity = "1";
            this.globalTooltip.style.visibility = "visible";
        }
    }

    hideTooltip() {
        this.globalTooltip.classList.remove("show");
        this.globalTooltip.style.opacity = "0";
        this.globalTooltip.style.visibility = "hidden";
        this.globalTooltip.style.transition = "none";
    }

    handleDropdownItemClick(dropdownItem, dropdown) {
        // 드롭다운 닫기
        dropdown.classList.remove("show");

        // 버튼 상태 초기화
        const button = dropdown.previousElementSibling;
        if (button) {
            button.setAttribute("aria-expanded", "false");
            button.classList.remove("active");
        }

        // 헤더의 저장하기 드롭다운 아이템 처리
        if (dropdown.classList.contains("save-options")) {
            const onclick = dropdownItem.getAttribute("onclick");
            if (onclick) {
                // onclick 속성의 함수 호출
                if (onclick.includes("saveAsLocal()")) {
                    this.saveAsLocal();
                } else if (onclick.includes("save()")) {
                    this.save();
                } else if (onclick.includes("exportAsImage()")) {
                    this.exportAsImage();
                }
            }
            return;
        }

        // 헤더의 단축키 안내 드롭다운 처리 (클릭 시 아무것도 하지 않음, 단순히 드롭다운만 닫힘)
        if (dropdown.classList.contains("help-options")) {
            return;
        }

        // 아이템 타입에 따른 처리
        const itemType =
            dropdownItem.dataset.shape || dropdownItem.dataset.button || dropdownItem.dataset.icon || dropdownItem.dataset.input || dropdownItem.dataset.alert || dropdownItem.dataset.memo;

        if (itemType) {
            // 도형 추가
            if (dropdownItem.dataset.shape) {
                this.addElement("shape", itemType);
            }
            // 버튼 추가
            else if (dropdownItem.dataset.button) {
                this.addElement("button", itemType);
            }
            // 아이콘 추가
            else if (dropdownItem.dataset.icon) {
                this.addElement("icon", itemType);
            }
            // 입력 추가
            else if (dropdownItem.dataset.input) {
                this.addElement("input", itemType);
            }
            // 알림 추가
            else if (dropdownItem.dataset.alert) {
                this.addElement("alert", itemType);
            }
            // 메모 추가
            else if (dropdownItem.dataset.memo) {
                this.addElement("sticky-" + itemType);
            }
        }
    }

    addIconElement(iconType) {
        this.maxZIndex++;
        const position = this.findAvailablePosition(40, 40);

        const element = {
            id: Date.now(),
            type: "icon",
            x: position.x,
            y: position.y,
            width: 40,
            height: 40,
            name: this.generateElementName("icon"),
            content: iconType,
            iconType: iconType,
            zIndex: this.maxZIndex,
            opacity: 1,
            iconSize: 40,
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    addButtonElement(buttonType) {
        this.maxZIndex++;
        const position = this.findAvailablePosition(120, 40);

        // 버튼 타입에 따른 기본 배경색 설정
        let defaultBackgroundColor;
        switch (buttonType) {
            case "activate":
                defaultBackgroundColor = "#2E6FF2";
                break;
            case "normal":
                defaultBackgroundColor = "#ffffff";
                break;
            case "hover":
            case "deactivate":
                defaultBackgroundColor = "#D9DBE0";
                break;
            default:
                defaultBackgroundColor = "#2E6FF2";
        }

        const element = {
            id: Date.now(),
            type: "button",
            x: position.x,
            y: position.y,
            width: 120,
            height: 40,
            name: this.generateElementName("button"),
            content: "Button",
            buttonType: buttonType,
            zIndex: this.maxZIndex,
            opacity: 1,
            fontSize: 14,
            backgroundColor: defaultBackgroundColor,
            textColor: buttonType === "normal" ? "#000000" : buttonType === "hover" ? "#121314" : "#ffffff", // buttonType에 따른 기본 텍스트 색상
            fontWeight: "normal",
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    addShapeElement(shapeType) {
        this.maxZIndex++;
        const height = shapeType === "line" ? 1 : shapeType === "arrow" ? 16 : 200;
        const position = this.findAvailablePosition(200, height);

        const element = {
            id: Date.now(),
            type: "shape",
            x: position.x,
            y: position.y,
            width: 200,
            height: height,
            name: this.generateElementName("shape"),
            content: "",
            shapeType: shapeType,
            zIndex: this.maxZIndex,
            opacity: 1,
            fill: "#D9D9D9",
            borderWidth: shapeType === "line" || shapeType === "arrow" ? 1 : undefined,
            borderColor: shapeType === "line" || shapeType === "arrow" ? "#000000" : undefined,
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    addInputElement(inputType) {
        this.maxZIndex++;
        const position = this.findAvailablePosition(322, 40);

        const element = {
            id: Date.now(),
            type: "input",
            x: position.x,
            y: position.y,
            width: 322,
            height: 40,
            name: this.generateElementName("input"),
            content: "Input",
            label: "Label",
            buttonText: "입력",
            errorMessage: "※ 유효하지 않은 정보입니다.",
            inputType: inputType,
            zIndex: this.maxZIndex,
            opacity: 1,
            fontSize: 14,
            textColor: "#000000", // 입력 필드 기본 텍스트 색상
            fontWeight: "normal",
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    addAlertElement(alertType) {
        this.maxZIndex++;
        const position = this.findAvailablePosition(338, 120);

        const element = {
            id: Date.now(),
            type: "alert",
            x: position.x,
            y: position.y,
            width: 338,
            height: 120,
            name: this.generateElementName("alert"),
            content: "Alert message",
            primaryButtonText: alertType === "warning" ? "나가기" : "확인",
            secondaryButtonText: alertType === "warning" ? "취소" : "",
            alertType: alertType,
            zIndex: this.maxZIndex,
            opacity: 1,
            fontSize: 14,
            textColor: "#121314", // 알림 기본 텍스트 색상
            fontWeight: "normal",
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    addStickyElement(stickyType) {
        this.maxZIndex++;

        let stickyColor;
        switch (stickyType) {
            case "yellow":
                stickyColor = "#fff740";
                break;
            case "pink":
                stickyColor = "#ff7eb9";
                break;
            case "blue":
                stickyColor = "#7afcff";
                break;
            case "green":
                stickyColor = "#98ff98";
                break;
            case "orange":
                stickyColor = "#ffb347";
                break;
            default:
                stickyColor = "#fff740";
        }

        const position = this.findAvailablePosition(200, 200);

        const element = {
            id: Date.now(),
            type: "sticky",
            x: position.x,
            y: position.y,
            width: 200,
            height: 200,
            name: this.generateElementName("sticky"),
            content: "Double click to edit memo",
            stickyColor: stickyColor,
            zIndex: this.maxZIndex,
            opacity: 1,
            fontSize: 16,
            textColor: "#000000", // 메모 기본 텍스트 색상
            fontWeight: "normal",
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    closeAllDropdowns() {
        document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
            if (dropdown.classList.contains("show")) {
                // 부드러운 닫기 애니메이션을 위해 opacity만 먼저 변경
                dropdown.style.opacity = "0";

                // 짧은 애니메이션 후 완전히 제거
                setTimeout(() => {
                    dropdown.classList.remove("show");
                    dropdown.style.zIndex = "";
                    dropdown.style.visibility = "";
                    dropdown.style.display = "";
                    dropdown.style.opacity = "";
                    dropdown.style.transition = "";

                    // 헤더 드롭다운이었다면 원래 위치로 복원
                    this.restoreDropdownPosition(dropdown);
                }, 150); // 150ms 애니메이션
            } else {
                // 이미 닫혀있는 경우 즉시 정리
                dropdown.classList.remove("show");
                dropdown.style.zIndex = "";
                dropdown.style.visibility = "";
                dropdown.style.display = "";
                dropdown.style.opacity = "";
                dropdown.style.transition = "";

                this.restoreDropdownPosition(dropdown);
            }
        });

        // 모든 버튼 상태 즉시 초기화
        document.querySelectorAll(".toolbar button, .header button").forEach((button) => {
            button.setAttribute("aria-expanded", "false");
            button.classList.remove("active");
        });
    }

    positionDropdown(button, dropdown) {
        const buttonRect = button.getBoundingClientRect();
        const isHeaderButton = button.closest(".header") !== null;

        // 헤더 드롭다운의 경우 body로 이동
        if (isHeaderButton) {
            this.moveDropdownToBody(dropdown, button);
        }

        // CSS transition을 비활성화하여 즉시 위치 변경
        const originalTransition = dropdown.style.transition;
        dropdown.style.transition = "none";

        // 즉시 위치와 표시 상태 설정
        dropdown.style.position = "fixed";
        dropdown.style.display = "grid";
        dropdown.style.visibility = "visible";
        dropdown.style.opacity = "1";

        // z-index 설정
        if (isHeaderButton) {
            dropdown.style.zIndex = "999999";
        } else {
            dropdown.style.zIndex = "10000";
        }

        // 위치 계산 및 즉시 적용
        if (isHeaderButton) {
            // 헤더 버튼의 경우: 버튼 아래에서 4px 떨어지고 오른쪽 정렬
            // 먼저 임시로 화면 밖에 두고 크기 측정
            dropdown.style.left = "-9999px";
            dropdown.style.top = "-9999px";

            // 브라우저가 크기를 계산할 수 있도록 강제 리플로우
            const dropdownRect = dropdown.getBoundingClientRect();

            // 실제 위치 계산 및 적용
            const finalTop = buttonRect.bottom + 4;
            const finalLeft = buttonRect.right - dropdownRect.width;

            dropdown.style.top = `${finalTop}px`;
            dropdown.style.left = `${finalLeft}px`;
        } else {
            // 툴바 버튼의 경우: 버튼 바로 아래 중앙 정렬
            // 먼저 임시로 화면 밖에 두고 크기 측정
            dropdown.style.left = "-9999px";
            dropdown.style.top = "-9999px";

            // 브라우저가 크기를 계산할 수 있도록 강제 리플로우
            const dropdownRect = dropdown.getBoundingClientRect();

            // 실제 위치 계산
            const finalTop = buttonRect.bottom + 1;
            const buttonCenterX = buttonRect.left + buttonRect.width / 2;
            const dropdownLeft = buttonCenterX - dropdownRect.width / 2;

            // 화면 경계 체크
            const maxLeft = window.innerWidth - dropdownRect.width - 10;
            const minLeft = 10;
            const finalLeft = Math.max(minLeft, Math.min(maxLeft, dropdownLeft));

            // 실제 위치 적용
            dropdown.style.top = `${finalTop}px`;
            dropdown.style.left = `${finalLeft}px`;
        }

        // 위치 설정 후 잠시 뒤에 transition 복원 (부드러운 닫기 애니메이션을 위해)
        setTimeout(() => {
            dropdown.style.transition = originalTransition;
        }, 10);
    }

    // 모바일 접속 체크 메서드 추가
    checkMobileAccess() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            const mobileOverlay = document.createElement("div");
            mobileOverlay.className = "mobile-overlay";
            mobileOverlay.innerHTML = `
                <div class="mobile-message">
                    <h2>Mobile Device Detected</h2>
                    <p>Sorry, this prototyping tool is currently only supported on desktop environments.</p>
                    <p>For the best experience, please access from a desktop computer.</p>
                    <button class="mobile-close-btn">OK</button>
                </div>
            `;

            document.body.appendChild(mobileOverlay);

            // 확인 버튼 클릭 시 오버레이 제거
            const closeBtn = mobileOverlay.querySelector(".mobile-close-btn");
            closeBtn.addEventListener("click", () => {
                mobileOverlay.remove();
            });
        }
    }

    createPage(pageName) {
        const pageId = Date.now();
        const page = {
            id: pageId,
            name: pageName,
            elements: [],
            device: this.currentDevice,
            gridSize: 20, // 새 페이지의 기본 그리드 크기를 20px로 설정
        };

        this.pages.set(pageId, page);

        if (!this.currentPageId) {
            this.currentPageId = pageId;
            this.gridSize = page.gridSize; // 첫 페이지인 경우에만 현재 그리드 크기 설정
            this.setGridSize(page.gridSize); // 캔버스에 그리드 적용
        }

        this.updatePageList();
        return pageId;
    }

    initializeEvents() {
        // 이벤트 위임을 사용하여 컴포넌트 버튼 이벤트 처리
        document.querySelector("#shape-options").addEventListener("click", (e) => {
            const btn = e.target.closest(".component-btn");
            if (btn) this.addElement(btn.dataset.type);
        });

        document.querySelectorAll("header > div > button").forEach((button) => {
            const title = button.getAttribute("title");
            if (title) {
                button.setAttribute("data-tooltip", title);
            }
        });

        document.querySelectorAll(".toolbar-group > button").forEach((button) => {
            const title = button.getAttribute("title");
            if (title) {
                button.setAttribute("data-tooltip", title);
            }
        });

        // 캔버스 이벤트
        const canvas = document.getElementById("canvas");
        canvas.addEventListener("click", (e) => {
            if (e.target === canvas) this.clearSelection();
        });

        // 키보드 이벤트 통합 (단축키 + 방향키)
        const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

        document.addEventListener("keydown", (e) => {
            // 요소가 선택된 상태에서의 키 이벤트

            // 편집 가능한 요소 체크 (텍스트 입력 중인지 확인)
            const isEditableElement =
                ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) ||
                document.activeElement.isContentEditable ||
                document.activeElement.contentEditable === "true" ||
                document.activeElement.classList.contains("editable-text");

            // Backspace 또는 Delete 키로 선택된 요소 삭제 (편집 중이 아닐 때만)
            if ((e.key === "Delete" || e.key === "Backspace") && !isEditableElement) {
                if (this.selectedElements.length > 0) {
                    // 다중 선택된 요소들 삭제
                    this.deleteMultipleElements();
                    return;
                } else if (this.selectedElement) {
                    // 단일 선택된 요소 삭제
                    this.deleteSelected();
                    return;
                }
            }

            if (this.selectedElement) {
                // 방향키 처리 (입력 필드가 포커스되어 있지 않을 때만)
                if (ARROW_KEYS.has(e.key) && !isEditableElement) {
                    e.preventDefault();
                    const moveAmount = e.shiftKey ? 10 : 1;
                    const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);

                    // 좌표 업데이트
                    if (e.key === "ArrowUp") this.selectedElement.y -= moveAmount;
                    else if (e.key === "ArrowDown") this.selectedElement.y += moveAmount;
                    else if (e.key === "ArrowLeft") this.selectedElement.x -= moveAmount;
                    else if (e.key === "ArrowRight") this.selectedElement.x += moveAmount;

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
                if (key === "z" || key === "y" || key === "c" || key === "v") {
                    e.preventDefault();
                    if (key === "z") this.undo();
                    else if (key === "y") this.redo();
                    else if (key === "c") this.copyElement();
                    else if (key === "v") this.pasteElement();
                }
            }
        });

        // 줌과 패닝 이벤트 초기화
        this.initializeZoomAndPan();
    }

    initializeZoomAndPan() {
        const canvasArea = document.querySelector(".canvas-area");

        // 이미 초기화되었는지 확인
        if (this.zoomInitialized) {
            return;
        }

        // 초기 커서 설정
        const canvasAreaElement = document.querySelector(".canvas-area");
        if (canvasAreaElement) {
            canvasAreaElement.style.cursor = "default";
        }

        // 터치 이벤트 변수
        let isTouchPanning = false;
        let lastTouchPosition = null;
        let initialTouchDistance = 0;
        let initialScale = 1;

        // touchstart 이벤트 리스너
        canvasArea.addEventListener(
            "touchstart",
            (e) => {
                if (e.touches.length === 2) {
                    // 두 손가락 터치 시작
                    e.preventDefault();
                    isTouchPanning = true;

                    // 두 터치 포인트의 중앙 위치 계산
                    lastTouchPosition = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    };

                    // 초기 터치 거리 계산 (핀치 줌을 위해)
                    initialTouchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

                    initialScale = this.scale;
                }
            },
            { passive: false }
        );

        // touchmove 이벤트 리스너
        canvasArea.addEventListener(
            "touchmove",
            (e) => {
                if (isTouchPanning && e.touches.length === 2) {
                    e.preventDefault();

                    // 현재 두 터치 포인트의 중앙 위치 계산
                    const currentTouchPosition = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    };

                    // 이동 거리 계산
                    const dx = currentTouchPosition.x - lastTouchPosition.x;
                    const dy = currentTouchPosition.y - lastTouchPosition.y;

                    // 캔버스 이동
                    this.canvasOffset.x += dx;
                    this.canvasOffset.y += dy;

                    // 핀치 줌 처리
                    const currentTouchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

                    // 두 손가락 사이 거리가 변했다면 줌 적용
                    if (Math.abs(currentTouchDistance - initialTouchDistance) > 10) {
                        const scaleFactor = currentTouchDistance / initialTouchDistance;
                        const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.1), 5); // 0.1배에서 5배까지 제한

                        if (newScale !== this.scale) {
                            const scaleChange = newScale / this.scale;

                            // 터치 중심점을 기준으로 확대/축소
                            this.canvasOffset.x = currentTouchPosition.x - (currentTouchPosition.x - this.canvasOffset.x) * scaleChange;
                            this.canvasOffset.y = currentTouchPosition.y - (currentTouchPosition.y - this.canvasOffset.y) * scaleChange;

                            this.scale = newScale;
                            this.updateZoomValue();
                        }
                    }

                    lastTouchPosition = currentTouchPosition;
                    this.updateCanvasTransform();
                    this.updateGridBackground();
                }
            },
            { passive: false }
        );

        // touchend 이벤트 리스너
        canvasArea.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
                isTouchPanning = false;
                lastTouchPosition = null;
            }
        });

        // touchcancel 이벤트 리스너
        canvasArea.addEventListener("touchcancel", (e) => {
            isTouchPanning = false;
            lastTouchPosition = null;
        });

        // 줌 이벤트
        canvasArea.addEventListener(
            "wheel",
            (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();

                    // 더 민감한 줌 속도 (피그마 스타일)
                    const delta = e.deltaY > 0 ? 0.85 : 1.15;

                    // 애니메이션 없이 직접 줌 적용
                    this.zoom(delta, e.clientX, e.clientY);
                }
            },
            { passive: false }
        );

        // 스페이스바 패닝
        let isSpacePressed = false;

        // 전체 document에 대한 스페이스바 기본 동작 방지
        document.addEventListener("keydown", (e) => {
            // contentEditable 요소 체크
            const isEditableElement = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) || document.activeElement.isContentEditable || document.activeElement.contentEditable === "true";

            // 편집 가능한 요소가 아닐 때만 스페이스바 기본 동작 방지
            if (e.code === "Space" && !isEditableElement) {
                e.preventDefault();
            }
        });

        document.addEventListener("keydown", (e) => {
            // contentEditable 요소 체크
            const isEditableElement = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) || document.activeElement.isContentEditable || document.activeElement.contentEditable === "true";

            if (e.code === "Space" && !isSpacePressed && !isEditableElement) {
                isSpacePressed = true;
                canvasArea.classList.add("panning");
                canvasArea.style.cursor = "grab";
                this.isPanning = true;
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.code === "Space") {
                isSpacePressed = false;
                canvasArea.classList.remove("panning");
                canvasArea.style.cursor = "default";
                this.isPanning = false;
            }
        });

        // 패닝 마우스 이벤트
        let isPanningActive = false;
        let isTwoFingerPanning = false;
        let lastTwoFingerPosition = null;

        canvasArea.addEventListener("mousedown", (e) => {
            if (this.isPanning || e.button === 1) {
                // 스페이스바 누르거나 중간 마우스 버튼일 때 패닝 활성화
                e.preventDefault();
                isPanningActive = true;
                canvasArea.classList.add("panning");
                canvasArea.style.cursor = "grabbing";
                this.lastPanPosition = { x: e.clientX, y: e.clientY };
            }
        });

        // 트랙패드 두 손가락 제스처 감지
        canvasArea.addEventListener(
            "touchstart",
            (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    isTwoFingerPanning = true;
                    lastTwoFingerPosition = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    };
                }
            },
            { passive: false }
        );

        canvasArea.addEventListener(
            "touchmove",
            (e) => {
                if (isTwoFingerPanning && e.touches.length === 2) {
                    e.preventDefault();
                    const currentPosition = {
                        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    };

                    const dx = currentPosition.x - lastTwoFingerPosition.x;
                    const dy = currentPosition.y - lastTwoFingerPosition.y;

                    this.canvasOffset.x += dx;
                    this.canvasOffset.y += dy;

                    lastTwoFingerPosition = currentPosition;
                    this.updateCanvasTransform();
                }
            },
            { passive: false }
        );

        canvasArea.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
                isTwoFingerPanning = false;
                lastTwoFingerPosition = null;
            }
        });

        canvasArea.addEventListener("mousemove", (e) => {
            if (isPanningActive && (this.isPanning || e.buttons === 4)) {
                // 스페이스바 누르거나 중간 마우스 버튼일 때 패닝
                const dx = e.clientX - this.lastPanPosition.x;
                const dy = e.clientY - this.lastPanPosition.y;

                this.canvasOffset.x += dx;
                this.canvasOffset.y += dy;

                this.lastPanPosition = { x: e.clientX, y: e.clientY };
                this.updateCanvasTransform();
            }
        });

        document.addEventListener("mouseup", (e) => {
            if (isPanningActive) {
                isPanningActive = false;
                if (this.isPanning) {
                    canvasArea.style.cursor = "grab";
                } else {
                    canvasArea.style.cursor = "default";
                    canvasArea.classList.remove("panning");
                }
            }
        });

        // 초기 캔버스 위치 설정 (가운데 정렬)
        this.resetCanvasView();

        // 그리드 업데이트
        this.updateGridBackground();
        window.addEventListener("resize", () => this.updateGridBackground());

        // 초기화 완료 플래그 설정
        this.zoomInitialized = true;
    }

    zoom(delta, clientX, clientY) {
        const canvasArea = document.querySelector(".canvas-area");
        const rect = canvasArea.getBoundingClientRect();

        // 마우스 위치를 기준으로 줌
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        // 줌 속도 조정 - 피그마와 유사하게
        const zoomFactor = delta > 1 ? 1.03 : 0.97;
        const newScale = Math.min(Math.max(this.scale * zoomFactor, 0.1), 5); // 0.1배에서 5배까지 제한

        if (newScale !== this.scale) {
            const scaleChange = newScale / this.scale;

            // 마우스 포인터 위치 기준으로 offset 조정
            this.canvasOffset.x = mouseX - (mouseX - this.canvasOffset.x) * scaleChange;
            this.canvasOffset.y = mouseY - (mouseY - this.canvasOffset.y) * scaleChange;

            this.scale = newScale;
            this.updateCanvasTransform();

            // 그리드 배경 업데이트
            this.updateGridBackground();
            this.updateZoomValue();

            // 프레임 그리드 업데이트
            this.updateFrameGrids();
        }
    }

    // 프레임 그리드 업데이트 메서드
    updateFrameGrids() {
        // 모든 프레임 요소 찾기
        const frameElements = this.elements.filter((el) => el.type === "frame");

        // 각 프레임 요소에 그리드 적용
        frameElements.forEach((frame) => {
            const frameEl = document.getElementById(`element-${frame.id}`);
            if (!frameEl) return;

            // 더 작은 그리드 간격 적용 (피그마 스타일)
            const baseGridSize = 8; // 기본 그리드 크기를 10px에서 8px로 줄임

            // 프레임 크기에 따라 그리드 크기 조정
            const minDimension = Math.min(frame.width, frame.height);
            let gridSizeFactor = 1;

            if (minDimension >= 1000) {
                gridSizeFactor = 8; // 64px 그리드
            } else if (minDimension >= 500) {
                gridSizeFactor = 4; // 32px 그리드
            } else if (minDimension >= 200) {
                gridSizeFactor = 2; // 16px 그리드
            }

            const effectiveGridSize = (baseGridSize * gridSizeFactor) / this.scale;

            // SVG 그리드 배경 생성 - 더 가벼운 색상
            const svgGrid = `
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-${frame.id}" width="${effectiveGridSize}" height="${effectiveGridSize}" patternUnits="userSpaceOnUse">
                            <path d="M ${effectiveGridSize} 0 L 0 0 0 ${effectiveGridSize}" fill="none" stroke="#E8E8E8" stroke-width="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-${frame.id})" />
                </svg>
            `;

            // 인코딩하여 배경 이미지로 설정
            const encodedSVG = encodeURIComponent(svgGrid);

            // 기존 배경색 유지하면서 그리드 추가
            const bgColor = frame.backgroundColor || "#ffffff";
            frameEl.style.backgroundImage = `url('data:image/svg+xml,${encodedSVG}')`;
            frameEl.style.backgroundColor = bgColor;
        });
    }

    // 그리드 배경 업데이트 메서드
    updateGridBackground() {
        const canvasArea = document.querySelector(".canvas-area");

        canvasArea.style.backgroundImage = "none";
        canvasArea.style.backgroundColor = "#f0f0f0";
    }

    // 캔버스 컨트롤 초기화
    initializeCanvasControls() {
        // 줌 인 버튼
        const zoomInBtn = document.getElementById("zoom-in");
        if (zoomInBtn) {
            zoomInBtn.addEventListener("click", () => {
                const canvasArea = document.querySelector(".canvas-area");
                const rect = canvasArea.getBoundingClientRect();
                // 화면 중앙을 기준으로 줌
                this.zoom(1.15, rect.left + rect.width / 2, rect.top + rect.height / 2); // 버튼 클릭 시 더 큰 폭의 줌
            });
        }

        // 줌 아웃 버튼
        const zoomOutBtn = document.getElementById("zoom-out");
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener("click", () => {
                const canvasArea = document.querySelector(".canvas-area");
                const rect = canvasArea.getBoundingClientRect();
                // 화면 중앙을 기준으로 줌
                this.zoom(0.85, rect.left + rect.width / 2, rect.top + rect.height / 2); // 버튼 클릭 시 더 큰 폭의 줌
            });
        }

        // 뷰 리셋 버튼
        const resetViewBtn = document.getElementById("reset-view");
        if (resetViewBtn) {
            resetViewBtn.addEventListener("click", () => {
                this.resetCanvasView();
            });
        }

        // 초기 줌 값 업데이트
        this.updateZoomValue();
    }

    // 줌 값 표시 업데이트
    updateZoomValue() {
        const zoomValueEl = document.querySelector(".zoom-value");
        if (zoomValueEl) {
            zoomValueEl.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    // 캔버스 뷰 리셋
    resetCanvasView() {
        this.scale = 1;

        this.canvasOffset = { x: 100, y: 100 };

        this.updateCanvasTransform();
        this.updateGridBackground();
        this.updateZoomValue();
        this.updateFrameGrids();
    }

    resetZoom() {
        if (this.elements.length === 0) return;

        document.getElementById("canvas").innerHTML = "";
        this.elements = [];
        this.maxZIndex = 1;
        this.selectedElement = null;

        this.updateProperties();
        this.updateLayersList();

        if (this.currentPageId) {
            const currentPage = this.pages.get(this.currentPageId);
            if (currentPage) {
                currentPage.elements = this.elements;
            }
        }

        this.saveHistory();
    }

    updateCanvasTransform() {
        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.scale})`;
            canvas.style.transformOrigin = "0 0";
        }
    }

    copyElement() {
        if (!this.selectedElement) return;

        // 깊은 복사를 위해 JSON 사용
        this.clipboard = JSON.parse(JSON.stringify(this.selectedElement));

        // 복사 성공 피드백 (옵션)
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.transition = "transform 0.1s";
            elementDiv.style.transform = "scale(1.05)";
            setTimeout(() => {
                elementDiv.style.transform = "scale(1)";
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
            zIndex: this.maxZIndex + 1,
        };

        this.maxZIndex++;
        this.elements.push(newElement);
        this.renderElement(newElement);
        this.selectElement(newElement);
        this.saveHistory();
    }

    // 캔버스 경계선에만 스냅하도록 단순화된 계산
    calculateSnap(x, y, width, height) {
        const canvas = document.getElementById("canvas");
        // 실제 캔버스의 크기를 가져옵니다 (offsetWidth/Height 사용)
        const canvasWidth = parseInt(canvas.style.width);
        const canvasHeight = parseInt(canvas.style.height);

        let snappedX = x;
        let snappedY = y;
        const guides = [];

        // 왼쪽 경계
        if (Math.abs(x) < this.snapThreshold) {
            snappedX = 0;
            guides.push({ type: "vertical", position: 0 });
        }

        // 오른쪽 경계
        // 요소의 오른쪽 끝이 캔버스 오른쪽 끝과 일치하는지 확인
        if (Math.abs(x + width - canvasWidth) < this.snapThreshold) {
            snappedX = canvasWidth - width;
            guides.push({ type: "vertical", position: canvasWidth });
        }

        // 상단 경계
        if (Math.abs(y) < this.snapThreshold) {
            snappedY = 0;
            guides.push({ type: "horizontal", position: 0 });
        }

        // 하단 경계
        // 요소의 하단이 캔버스 하단과 일치하는지 확인
        if (Math.abs(y + height - canvasHeight) < this.snapThreshold) {
            snappedY = canvasHeight - height;
            guides.push({ type: "horizontal", position: canvasHeight });
        }

        return { x: snappedX, y: snappedY, guides };
    }

    // 요소의 스냅 포인트 계산
    getElementSnapPoints(element) {
        const points = [];
        // 중심점
        points.push({
            x: element.x + element.width / 2,
            y: element.y + element.height / 2,
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
            y: this.draggedElement ? this.draggedElement.y : element.y,
        });
    }

    setCanvasSize(deviceType) {
        let frameSize;

        if (deviceType === "custom") {
            frameSize = {
                width: 100,
                height: 100,
            };
        } else {
            frameSize = this.devicePresets[deviceType];
        }

        if (frameSize) {
            const canvasArea = document.querySelector(".canvas-area");

            // 항상 새 프레임 생성 (기존 프레임은 유지)
            this.maxZIndex++; // 기존 요소들 위에 새 프레임이 오도록 zIndex 증가

            this.maxZIndex++;

            // 스마트 포지셔닝으로 프레임 위치 찾기
            const position = this.findAvailablePosition(frameSize.width, frameSize.height);

            // 새 프레임 생성
            const element = {
                id: Date.now(),
                type: "frame",
                x: position.x,
                y: position.y,
                width: frameSize.width,
                height: frameSize.height,
                name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Frame`,
                backgroundColor: "#ffffff",
                borderColor: "#d9dbe0",
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);

            // 프레임 옵션 드롭다운 닫기
            const frameOptionsDropdown = document.querySelector(".frame-options");
            const frameButton = document.querySelector('button[title="프레임 사이즈"]');
            if (frameOptionsDropdown && frameButton) {
                frameOptionsDropdown.style.display = "none";
                frameButton.setAttribute("aria-expanded", "false");
                frameButton.classList.remove("active");
            }

            // 현재 페이지 업데이트
            if (this.currentPageId) {
                const currentPage = this.pages.get(this.currentPageId);
                if (currentPage) {
                    currentPage.elements = this.elements;
                }
            }

            this.saveHistory();

            // 새로 추가된 요소를 포함하여 뷰 최적화
            this.optimizeViewForNewElement(element);
        }
    }

    // 스냅 가이드라인 표시
    showSnapGuides(guides) {
        // 기존 가이드라인 제거
        document.querySelectorAll(".snap-guide").forEach((guide) => guide.remove());

        const canvas = document.getElementById("canvas");
        // 실제 캔버스 크기를 가져옵니다.
        const canvasWidth = parseInt(canvas.style.width);
        const canvasHeight = parseInt(canvas.style.height);

        guides.forEach((guide) => {
            const guideElement = document.createElement("div");
            guideElement.className = "snap-guide";

            if (guide.type === "vertical") {
                guideElement.style.width = "2px";
                guideElement.style.height = `${canvasHeight}px`;
                // position을 실제 캔버스 크기 기준으로 계산
                guideElement.style.left = `${guide.position}px`;
                guideElement.style.top = "0";
            } else {
                guideElement.style.height = "2px";
                guideElement.style.width = `${canvasWidth}px`;
                guideElement.style.left = "0";
                // position을 실제 캔버스 크기 기준으로 계산
                guideElement.style.top = `${guide.position}px`;
            }

            canvas.appendChild(guideElement);

            // 1초 후 가이드라인 제거
            setTimeout(() => guideElement.remove(), 1000);
        });
    }

    findAvailablePosition(width, height) {
        const canvasArea = document.querySelector(".canvas-area");

        // 현재 사용자가 보는 캔버스의 중앙 계산
        const visibleCenterX = (canvasArea.clientWidth / 2 - this.canvasOffset.x) / this.scale;
        const visibleCenterY = (canvasArea.clientHeight / 2 - this.canvasOffset.y) / this.scale;

        if (this.elements.length === 0) {
            // 빈 캔버스: 사용자가 보는 중앙에 배치
            const centerX = visibleCenterX - width / 2;
            const centerY = visibleCenterY - height / 2;
            return this.snapToGrid(centerX, centerY);
        }

        // 기존 요소가 있을 때: 최대한 가운데 위치시키고, 가운데 자리가 없으면 오른쪽 여백에 배치
        const visibleArea = {
            left: -this.canvasOffset.x / this.scale,
            top: -this.canvasOffset.y / this.scale,
            right: (-this.canvasOffset.x + canvasArea.clientWidth) / this.scale,
            bottom: (-this.canvasOffset.y + canvasArea.clientHeight) / this.scale,
        };

        const placementArea = {
            left: visibleArea.left + 20,
            top: visibleArea.top + 20,
            right: visibleArea.right - width - 20,
            bottom: visibleArea.bottom - height - 20,
        };

        // 1. 먼저 가시 영역의 정중앙에서 시작
        const centerPosition = {
            x: visibleCenterX - width / 2,
            y: visibleCenterY - height / 2,
        };

        // 중앙 위치가 사용 가능한지 확인
        if (
            centerPosition.x >= placementArea.left &&
            centerPosition.y >= placementArea.top &&
            centerPosition.x + width <= placementArea.right &&
            centerPosition.y + height <= placementArea.bottom &&
            !this.isPositionOccupied(centerPosition.x, centerPosition.y, width, height)
        ) {
            console.log("Found center position:", centerPosition);
            return this.snapToGrid(centerPosition.x, centerPosition.y);
        }

        // 2. 중앙 주변에서 나선형 검색
        const centerSearchResult = this.findNearestAvailablePosition(centerPosition.x, centerPosition.y, width, height, placementArea);
        if (centerSearchResult) {
            return centerSearchResult;
        }

        // 3. 중앙 주변에 자리가 없으면 오른쪽 여백에 배치
        const rightMarginPosition = {
            x: placementArea.right - width,
            y: visibleCenterY - height / 2,
        };

        // 오른쪽 여백 위치가 사용 가능한지 확인
        if (
            rightMarginPosition.x >= placementArea.left &&
            rightMarginPosition.y >= placementArea.top &&
            rightMarginPosition.y + height <= placementArea.bottom &&
            !this.isPositionOccupied(rightMarginPosition.x, rightMarginPosition.y, width, height)
        ) {
            console.log("Found right margin position:", rightMarginPosition);
            return this.snapToGrid(rightMarginPosition.x, rightMarginPosition.y);
        }

        // 4. 오른쪽 여백에도 자리가 없으면 오른쪽 여백 주변에서 검색
        const rightSearchResult = this.findNearestAvailablePosition(rightMarginPosition.x, rightMarginPosition.y, width, height, placementArea);
        if (rightSearchResult) {
            console.log("Found near-right margin position:", rightSearchResult);
            return rightSearchResult;
        }

        // 5. 마지막 수단: 그리드 검색
        const gridResult = this.findPositionByGridSearch(width, height, placementArea);
        console.log("Grid search result:", gridResult);

        // 그리드 검색 결과가 가시 영역 밖에 있는지 확인
        if (gridResult && this.isPositionOutsideVisibleArea(gridResult.x, gridResult.y, width, height, visibleArea)) {
            console.log("Element will be placed outside visible area, switching to full view");
            this.switchToFullView();
        }

        return gridResult;
    }

    findNearestAvailablePosition(startX, startY, width, height, searchArea) {
        const maxAttempts = 30;
        const step = 25;

        if (startX >= searchArea.left && startY >= searchArea.top && startX + width <= searchArea.right && startY + height <= searchArea.bottom) {
            if (!this.isPositionOccupied(startX, startY, width, height)) {
                return this.snapToGrid(startX, startY);
            }
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const radius = attempt * step;

            const directions = [
                { x: 0, y: -1 },
                { x: 1, y: -1 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
                { x: -1, y: 1 },
                { x: -1, y: 0 },
                { x: -1, y: -1 },
            ];

            for (let dir of directions) {
                const x = startX + dir.x * radius;
                const y = startY + dir.y * radius;

                if (x >= searchArea.left && y >= searchArea.top && x + width <= searchArea.right && y + height <= searchArea.bottom) {
                    if (!this.isPositionOccupied(x, y, width, height)) {
                        return this.snapToGrid(x, y);
                    }
                }
            }
        }

        return null;
    }

    generateSpiralPositions(centerX, centerY, radius, step) {
        const positions = [];

        if (radius === 0) {
            positions.push({ x: centerX, y: centerY });
            return positions;
        }

        const directions = [
            { x: 0, y: -1 },
            { x: 1, y: -1 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
            { x: -1, y: 1 },
            { x: -1, y: 0 },
            { x: -1, y: -1 },
        ];

        directions.forEach((dir) => {
            positions.push({
                x: centerX + dir.x * radius,
                y: centerY + dir.y * radius,
            });
        });

        return positions;
    }

    isPositionOccupied(x, y, width, height, excludeElement = null) {
        const margin = 15;

        const newRect = {
            left: x - margin,
            top: y - margin,
            right: x + width + margin,
            bottom: y + height + margin,
        };

        const isOccupied = this.elements.some((element) => {
            if (excludeElement && element.id === excludeElement.id) {
                return false;
            }

            const elementRect = {
                left: element.x,
                top: element.y,
                right: element.x + element.width,
                bottom: element.y + element.height,
            };

            const overlaps = !(newRect.right < elementRect.left || newRect.left > elementRect.right || newRect.bottom < elementRect.top || newRect.top > elementRect.bottom);
            return overlaps;
        });

        return isOccupied;
    }

    findPositionByGridSearch(width, height, searchArea) {
        const gridSize = 30;
        console.log("Starting grid search...");

        for (let y = searchArea.top; y + height <= searchArea.bottom; y += gridSize) {
            for (let x = searchArea.left; x + width <= searchArea.right; x += gridSize) {
                if (!this.isPositionOccupied(x, y, width, height)) {
                    console.log("Grid search found position:", { x, y });
                    return this.snapToGrid(x, y);
                }
            }
        }

        console.log("Grid search failed, using fallback position");
        const rightMost = Math.max(...this.elements.map((el) => el.x + el.width));
        const bottomMost = Math.max(...this.elements.map((el) => el.y + el.height));

        return this.snapToGrid(rightMost + 50, Math.max(searchArea.top, bottomMost + 50));
    }

    snapToGrid(x, y) {
        if (this.gridSize > 0) {
            return {
                x: Math.round(x / this.gridSize) * this.gridSize,
                y: Math.round(y / this.gridSize) * this.gridSize,
            };
        }
        return { x: Math.round(x), y: Math.round(y) };
    }

    // 위치가 가시 영역 밖에 있는지 확인
    isPositionOutsideVisibleArea(x, y, width, height, visibleArea) {
        const elementRight = x + width;
        const elementBottom = y + height;

        return x < visibleArea.left || y < visibleArea.top || elementRight > visibleArea.right || elementBottom > visibleArea.bottom;
    }

    // 전체뷰로 전환
    switchToFullView() {
        // 모든 요소를 포함하는 영역 계산
        if (this.elements.length === 0) return;

        let minX = Infinity,
            minY = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity;

        this.elements.forEach((element) => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });

        // 여백 추가
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // 캔버스 영역 계산
        const canvasArea = document.querySelector(".canvas-area");
        const canvasWidth = canvasArea.clientWidth;
        const canvasHeight = canvasArea.clientHeight;

        // 전체 영역의 크기
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // 적절한 스케일 계산
        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // 최대 100% 줌

        // 중앙 정렬을 위한 오프셋 계산
        const newOffsetX = (canvasWidth - contentWidth * newScale) / 2 - minX * newScale;
        const newOffsetY = (canvasHeight - contentHeight * newScale) / 2 - minY * newScale;

        // 부드러운 애니메이션으로 전환
        this.animateToView(newScale, newOffsetX, newOffsetY);
    }

    // 부드러운 뷰 전환 애니메이션
    animateToView(targetScale, targetOffsetX, targetOffsetY) {
        const startScale = this.scale;
        const startOffsetX = this.canvasOffset.x;
        const startOffsetY = this.canvasOffset.y;

        const duration = 500; // 0.5초
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 이징 함수 (부드러운 전환)
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);

            this.scale = startScale + (targetScale - startScale) * easeOutCubic;
            this.canvasOffset.x = startOffsetX + (targetOffsetX - startOffsetX) * easeOutCubic;
            this.canvasOffset.y = startOffsetY + (targetOffsetY - startOffsetY) * easeOutCubic;

            // transform 속성 적용하지 않음
            // this.updateCanvasTransform();
            this.updateZoomValue();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // 텍스트 배치 모드 시작
    startTextPlacement() {
        // 기존 이벤트 리스너 정리 (안전을 위해)
        this.cancelTextPlacement();

        // 텍스트 버튼 활성화
        const textBtn = document.getElementById("text-btn");
        if (textBtn) {
            textBtn.classList.add("active");
        }

        // 캔버스 커서 변경
        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.style.cursor = "crosshair";
        }

        // 텍스트 배치 모드 플래그 설정
        this.isTextPlacementMode = true;

        // 캔버스 클릭 이벤트 리스너 추가 (캡처 단계에서 처리)
        this.textPlacementClickHandler = (e) => this.handleTextPlacementClick(e);
        canvas.addEventListener("click", this.textPlacementClickHandler, true);

        // ESC 키로 취소 기능
        this.textPlacementEscHandler = (e) => {
            if (e.key === "Escape") {
                this.cancelTextPlacement();
            }
        };
        document.addEventListener("keydown", this.textPlacementEscHandler);

        // 다른 곳 클릭 시 취소
        this.textPlacementOutsideClickHandler = (e) => {
            if (!canvas.contains(e.target) && !textBtn.contains(e.target)) {
                this.cancelTextPlacement();
            }
        };
        document.addEventListener("click", this.textPlacementOutsideClickHandler);
    }

    // 텍스트 배치 모드 취소
    cancelTextPlacement() {
        // 텍스트 버튼 비활성화
        const textBtn = document.getElementById("text-btn");
        if (textBtn) {
            textBtn.classList.remove("active");
        }

        // 캔버스 커서 복원
        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.style.cursor = "";
        }

        // 텍스트 배치 모드 플래그 해제
        this.isTextPlacementMode = false;

        // 이벤트 리스너 제거
        if (this.textPlacementClickHandler) {
            canvas.removeEventListener("click", this.textPlacementClickHandler, true);
            this.textPlacementClickHandler = null;
        }
        if (this.textPlacementEscHandler) {
            document.removeEventListener("keydown", this.textPlacementEscHandler);
            this.textPlacementEscHandler = null;
        }
        if (this.textPlacementOutsideClickHandler) {
            document.removeEventListener("click", this.textPlacementOutsideClickHandler);
            this.textPlacementOutsideClickHandler = null;
        }
    }

    // 텍스트 배치 클릭 처리
    handleTextPlacementClick(e) {
        if (!this.isTextPlacementMode) return;

        // 클릭된 요소가 캔버스 자체인지 확인
        const canvas = document.getElementById("canvas");
        if (e.target !== canvas && !canvas.contains(e.target)) {
            return;
        }

        // 이벤트 전파 중단
        e.preventDefault();
        e.stopPropagation();

        // 캔버스 좌표 계산 (마우스 클릭 위치 그대로 사용)
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        // 텍스트 요소 생성
        this.createTextElement(x, y);

        // 텍스트 배치 모드 종료
        this.cancelTextPlacement();
    }

    // 텍스트 요소 생성
    createTextElement(x, y) {
        this.maxZIndex++;

        const element = {
            id: Date.now(),
            type: "text",
            x: x,
            y: y,
            width: 50, // 더 작은 초기 너비
            height: 30,
            name: this.generateElementName("text"),
            content: "",
            zIndex: this.maxZIndex,
            opacity: 1,
            fontSize: 16,
            fontFamily: "Arial, sans-serif",
            color: "#000000",
            textAlign: "left",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);

        // 바로 텍스트 편집 시작 (약간의 지연으로 DOM이 완전히 렌더링된 후 편집 시작)
        setTimeout(() => {
            this.startTextEditing(element);
        }, 10);
    }

    // 텍스트 편집 시작
    startTextEditing(element) {
        if (element.type !== "text") return;

        const elementDiv = document.getElementById(`element-${element.id}`);
        if (!elementDiv) return;

        // 이미 편집 중인지 확인
        if (elementDiv.querySelector(".editable-text")) {
            return;
        }

        // 기존 내용 제거
        elementDiv.innerHTML = "";

        // 편집 가능한 텍스트 영역 생성
        const textarea = document.createElement("textarea");
        textarea.className = "editable-text";
        textarea.value = element.content || "";
        textarea.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-family: ${element.fontFamily};
            font-size: ${element.fontSize}px;
            color: ${element.color};
            text-align: ${element.textAlign};
            font-weight: ${element.fontWeight};
            font-style: ${element.fontStyle};
            text-decoration: ${element.textDecoration};
            resize: none;
            padding: 0;
            margin: 0;
            line-height: 1.2;
            overflow: hidden;
        `;

        elementDiv.appendChild(textarea);
        textarea.focus();

        // 자동 크기 조정
        const adjustSize = () => {
            // 높이 조정
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
            element.height = textarea.scrollHeight;
            elementDiv.style.height = element.height + "px";

            // 너비 조정 - 텍스트 길이에 따라 동적 조정
            textarea.style.width = "auto";
            const textWidth = textarea.scrollWidth;
            const newWidth = Math.max(textWidth + 20, 50); // 패딩 포함, 최소 너비 50px
            element.width = newWidth;
            elementDiv.style.width = element.width + "px";
        };

        textarea.addEventListener("input", adjustSize);
        adjustSize();

        // 편집 완료 처리
        const finishEditing = () => {
            const newContent = textarea.value.trim();

            if (newContent === "") {
                // 내용이 없으면 요소 삭제
                this.deleteElement(element.id);
                return;
            }

            element.content = newContent;

            // 텍스트 크기에 따라 너비 조정
            const tempSpan = document.createElement("span");
            tempSpan.style.fontSize = element.fontSize ? `${element.fontSize}px` : "16px";
            tempSpan.style.fontFamily = element.fontFamily || "Arial, sans-serif";
            tempSpan.style.fontWeight = element.fontWeight || "normal";
            tempSpan.style.fontStyle = element.fontStyle || "normal";
            tempSpan.style.textDecoration = element.textDecoration || "none";
            tempSpan.style.visibility = "hidden";
            tempSpan.style.position = "absolute";
            tempSpan.style.whiteSpace = "nowrap";
            tempSpan.textContent = newContent;

            document.body.appendChild(tempSpan);
            const newWidth = Math.max(tempSpan.offsetWidth + 20, 50); // 패딩 포함, 최소 너비 50px
            document.body.removeChild(tempSpan);

            element.width = newWidth;
            element.height = textarea.scrollHeight;

            // 텍스트 영역 제거하고 일반 텍스트로 렌더링
            elementDiv.innerHTML = "";
            elementDiv.textContent = element.content;
            elementDiv.style.width = `${element.width}px`;
            elementDiv.style.height = `${element.height}px`;

            // 이벤트 리스너 제거
            textarea.removeEventListener("input", adjustSize);
            textarea.removeEventListener("blur", finishEditing);
            textarea.removeEventListener("keydown", handleKeydown);
        };

        // 키보드 이벤트 처리
        const handleKeydown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === "Escape") {
                e.preventDefault();
                this.deleteElement(element.id);
            }
        };

        textarea.addEventListener("blur", finishEditing);
        textarea.addEventListener("keydown", handleKeydown);
    }

    // 새로 추가된 요소를 포함하여 전체뷰 최적화
    optimizeViewForNewElement(newElement) {
        if (!newElement) return;

        // 기존 요소들과 새 요소를 모두 포함하는 영역 계산
        let minX = newElement.x,
            minY = newElement.y;
        let maxX = newElement.x + newElement.width,
            maxY = newElement.y + newElement.height;

        this.elements.forEach((element) => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });

        // 여백 추가
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // 캔버스 영역 계산
        const canvasArea = document.querySelector(".canvas-area");
        const canvasWidth = canvasArea.clientWidth;
        const canvasHeight = canvasArea.clientHeight;

        // 전체 영역의 크기
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // 적절한 스케일 계산
        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // 최대 100% 줌

        // 중앙 정렬을 위한 오프셋 계산
        const newOffsetX = (canvasWidth - contentWidth * newScale) / 2 - minX * newScale;
        const newOffsetY = (canvasHeight - contentHeight * newScale) / 2 - minY * newScale;

        // 부드러운 애니메이션으로 전환
        this.animateToView(newScale, newOffsetX, newOffsetY);
    }

    addElement(type, subtype = null) {
        // sticky-yellow, sticky-pink 등의 형식 처리
        if (type.startsWith("sticky-")) {
            const color = type.split("-")[1];
            this.addStickyElement(color);
            return;
        }

        this.maxZIndex++;

        if (type === "image") {
            this.showImageDialog();
            return;
        }
        if (type === "icon") {
            if (subtype) {
                this.addIconElement(subtype);
            } else {
                this.showIconDialog();
            }
            return;
        }
        if (type === "table") {
            this.addTableElement();
            return;
        }
        if (type === "input") {
            if (subtype) {
                this.addInputElement(subtype);
            } else {
                this.showInputDialog();
            }
            return;
        }
        if (type === "button") {
            if (subtype) {
                this.addButtonElement(subtype);
            } else {
                this.showButtonDialog();
            }
            return;
        }
        if (type === "shape") {
            if (subtype) {
                this.addShapeElement(subtype);
            } else {
                this.showShapeDialog();
            }
            return;
        }
        if (type === "triangle") {
            this.addShapeElement("triangle");
            return;
        }
        if (type === "alert") {
            if (subtype) {
                this.addAlertElement(subtype);
            } else {
                this.showAlertDialog();
            }
            return;
        }
        if (type === "sticky") {
            if (subtype) {
                this.addStickyElement(subtype);
            } else {
                this.showMemoDialog();
            }
            return;
        }
        if (type === "text") {
            this.startTextPlacement();
            return;
        }

        const shapeSize = {
            square: { width: 200, height: 200 },
            circle: { width: 200, height: 200 },
            polygon: { width: 200, height: 200 },
            star: { width: 200, height: 200 },
            line: { width: 200, height: 1 },
            arrow: { width: 200, height: 16 },
            triangle: { width: 200, height: 200 },
        };

        const size = shapeSize[type] || { width: 200, height: 200 };

        const elementWidth =
            type === "icon" ? this.iconDefaultSize : type === "link" ? 150 : type === "box" ? 200 : type === "sticky" ? 200 : type === "panel" ? this.panelDefaultSize.width : size.width;

        const elementHeight =
            type === "icon" ? this.iconDefaultSize : type === "link" ? 60 : type === "box" ? 200 : type === "sticky" ? 200 : type === "panel" ? this.panelDefaultSize.height : size.height;

        const position = this.findAvailablePosition(elementWidth, elementHeight);

        const element = {
            id: Date.now(),
            type,
            x: position.x,
            y: position.y,
            width: elementWidth,
            height: elementHeight,
            name: this.generateElementName(type),
            content: type === "icon" ? Object.keys(this.iconPaths)[0] : type === "sticky" ? "Double click to edit memo" : type === "panel" ? "" : type.charAt(0).toUpperCase() + type.slice(1),
            iconColor: type === "icon" ? this.iconColors[0] : undefined,
            zIndex: this.maxZIndex,
            opacity: type === "sticky" ? 1 : undefined,
            fontSize: type === "text" ? 16 : undefined,
            backgroundColor: "#fff",
            borderColor: "#D9DBE0",
            showX: ["square", "circle", "polygon", "star"].includes(type),
            radius: 0,
            headerColor: type === "panel" ? "#f5f5f5" : undefined,
            isPanel: type === "panel",
            isBold: false,
            stickyColor: type === "sticky" ? this.stickyColors[0] : undefined,
            targetPageId: null,
            justifyContent: type === "text" ? "center" : undefined,
            shapeType: type,
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    // 테이블 요소 추가 메서드
    addTableElement() {
        this.maxZIndex++;
        const position = this.findAvailablePosition(400, 200);

        const element = {
            id: Date.now(),
            type: "table",
            x: position.x,
            y: position.y,
            width: 400,
            height: 200,
            name: this.generateElementName("table"),
            rows: this.tableDefaults.rows,
            cols: this.tableDefaults.cols,
            data: this.generateEmptyTableData(this.tableDefaults.rows, this.tableDefaults.cols),
            zIndex: this.maxZIndex,
            cellPadding: this.tableDefaults.cellPadding,
            borderColor: this.tableDefaults.borderColor,
            headerBgColor: this.tableDefaults.headerBgColor,
            cellBgColor: this.tableDefaults.cellBgColor,
            textColor: this.tableDefaults.textColor,
            fontSize: this.tableDefaults.fontSize,
            headerFontWeight: this.tableDefaults.headerFontWeight,
            cellFontWeight: this.tableDefaults.cellFontWeight,
        };

        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.saveHistory();

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    // 빈 테이블 데이터 생성
    generateEmptyTableData(rows, cols) {
        const data = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push(i === 0 ? `Header ${j + 1}` : `Cell ${i},${j + 1}`);
            }
            data.push(row);
        }
        return data;
    }

    showButtonDialog() {
        const dialog = document.querySelector(".button-options");
        const button = document.querySelector('button[title="버튼 추가"]');

        // 기존 이벤트 리스너 제거
        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        // 하나의 이벤트 리스너로 처리
        oldDialog.addEventListener("click", (e) => {
            const buttonItem = e.target.closest(".button-item");
            if (!buttonItem) return;

            const buttonKey = buttonItem.dataset.button;
            if (!buttonKey) return;

            const element = {
                id: Date.now(),
                type: "button",
                x: 100,
                y: 100,
                name: this.generateElementName("button"),
                content: "button",
                buttonType: buttonKey,
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);
            this.saveHistory();

            // 다이얼로그 닫기
            oldDialog.style.display = "none";
            // 버튼 비활성화
            if (button) button.classList.remove("active");
        });
    }

    showShapeDialog() {
        const dialog = document.querySelector(".shape-options");

        // 모든 이전 이벤트 리스너 제거
        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        // 이벤트 위임을 사용한 단일 이벤트 리스너
        oldDialog.addEventListener("click", (e) => {
            const shapeItem = e.target.closest(".shape-item");
            if (!shapeItem) return;

            const shapeKey = shapeItem.dataset.shape;
            if (!shapeKey) return;

            const element = {
                id: Date.now(),
                type: "shape",
                shapeType: shapeKey,
                x: 100,
                y: 100,
                width: 200,
                height: shapeKey === "line" ? 1 : shapeKey === "arrow" ? 16 : 200,
                name: this.generateElementName("shape"),
                content: "",
                backgroundColor: shapeKey === "line" ? "#000000" : "#ffffff",
                borderColor: shapeKey === "line" ? "#000000" : "#d9dbe0",
                showX: ["square", "circle", "polygon", "star"].includes(shapeKey),
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);
            this.saveHistory();

            // 도형 옵션 다이얼로그 닫기
            oldDialog.style.display = "none";
        });
    }

    showIconDialog() {
        const dialog = document.querySelector(".icon-options");
        const button = document.querySelector('button[title="아이콘 추가"]');

        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        oldDialog.addEventListener("click", (e) => {
            const iconItem = e.target.closest(".icon-item");
            if (!iconItem) return;

            const iconKey = iconItem.dataset.icon;
            if (!iconKey) return;

            const element = {
                id: Date.now(),
                type: "icon",
                x: 100,
                y: 100,
                width: this.iconDefaultSize,
                height: this.iconDefaultSize,
                name: this.generateElementName("icon"),
                content: iconKey,
                iconColor: this.iconColors[0],
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);
            this.saveHistory();

            // 다이얼로그 닫기
            oldDialog.style.display = "none";
            // 버튼 비활성화
            if (button) button.classList.remove("active");
        });
    }

    // 메모 다이얼로그 핸들러
    showMemoDialog() {
        const dialog = document.querySelector(".memo-options");
        const button = document.querySelector('button[title="메모 추가"]');

        // 이전 이벤트 리스너 제거를 위해 복제
        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        // 각 메모 옵션에 대한 클릭 이벤트 리스너 추가
        oldDialog.addEventListener("click", (e) => {
            const memoBtn = e.target.closest("button");
            if (!memoBtn) return;

            // color 추출
            const commandValue = memoBtn.getAttribute("onclick");
            if (commandValue) {
                const match = commandValue.match(/tool\.addElement\('([^']+)'\)/);
                if (match) {
                    const type = match[1];
                    this.addElement(type);
                }
            }

            // 다이얼로그 닫기
            oldDialog.style.display = "none";
            if (button) button.classList.remove("active");
        });
    }

    // 입력칸 다이얼로그 핸들러 수정
    showInputDialog() {
        const dialog = document.querySelector(".input-options");
        const button = document.querySelector('button[title="입력칸 추가"]');

        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        oldDialog.addEventListener("click", (e) => {
            const inputItem = e.target.closest(".input-item");
            if (!inputItem) return;

            const inputKey = inputItem.dataset.input;
            if (!inputKey) return;

            const element = {
                id: Date.now(),
                type: "input",
                inputType: inputKey,
                x: 100,
                y: 100,
                width: 322,
                height: 62,
                name: this.generateElementName("input"),
                label: "Label Text",
                errorMessage: "※ 유효하지 않은 정보입니다.",
                buttonText: "확인",
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);
            this.saveHistory();

            // 다이얼로그 닫기
            oldDialog.style.display = "none";
            // 버튼 비활성화
            if (button) button.classList.remove("active");
        });
    }

    // 알림 다이얼로그 핸들러 수정
    showAlertDialog() {
        const dialog = document.querySelector(".alert-options");
        const button = document.querySelector('button[title="알림 추가"]');

        const oldDialog = dialog.cloneNode(true);
        dialog.parentNode.replaceChild(oldDialog, dialog);

        oldDialog.addEventListener("click", (e) => {
            const alertItem = e.target.closest(".alert-item");
            if (!alertItem) return;

            const alertKey = alertItem.dataset.alert;
            if (!alertKey) return;

            const element = {
                id: Date.now(),
                type: "alert",
                alertType: alertKey,
                x: 100,
                y: 100,
                width: "auto",
                height: "auto",
                name: this.generateElementName("alert"),
                content: "새로운 업데이트가 있습니다.",
                zIndex: this.maxZIndex,
            };

            this.elements.push(element);
            this.renderElement(element);
            this.selectElement(element);
            this.saveHistory();

            // 다이얼로그 닫기
            oldDialog.style.display = "none";
            // 버튼 비활성화
            if (button) button.classList.remove("active");
        });
    }

    handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            // 파일 타입 체크
            if (!file || !file.type.startsWith("image/")) {
                reject(new Error("Please select an image file."));
                return;
            }

            // 파일 크기 체크 (1MB = 1048576 bytes)
            const maxSize = 1 * 1048576; // 1MB
            if (file.size > maxSize) {
                reject(new Error("Image size must be less than 1MB. Please compress your image and try again."));
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
                        type: "image",
                        x: 100,
                        y: 100,
                        width: width,
                        height: height,
                        name: this.generateElementName("image"),
                        content: reader.result,
                        aspectRatio: tempImage.width / tempImage.height,
                        zIndex: this.maxZIndex,
                    };
                    resolve(element);
                };

                tempImage.onerror = () => {
                    reject(new Error("Failed to load image."));
                };

                tempImage.src = reader.result;
            };

            reader.onerror = () => {
                reject(new Error("Failed to read file."));
            };

            reader.readAsDataURL(file);
        });
    }

    // generateElementName 함수 수정
    generateElementName(type) {
        if (!Array.isArray(this.elements)) {
            this.elements = []; // 배열이 아닌 경우 빈 배열로 초기화
        }

        const counts = this.elements.reduce((acc, el) => {
            if (el.type === type) {
                acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
        }, {});

        const count = (counts[type] || 0) + 1;

        switch (type) {
            case "text":
                return `Text ${count}`;
            case "button":
                return `Button ${count}`;
            case "input":
                return `Input ${count}`;
            case "panel":
                return `Panel ${count}`;
            case "box":
                return `Box ${count}`;
            case "sticky":
                return `Note ${count}`;
            case "image":
                return `Image ${count}`;
            case "icon":
                return `Icon ${count}`;
            default:
                return `Element ${count}`;
        }
    }

    showImageDialog() {
        const dialog = document.createElement("div");
        dialog.className = "image-dialog";
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

        // 모달 닫기 함수
        const closeDialog = () => {
            if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
            }
        };

        // ESC 키로 모달 닫기
        const handleEscKey = (e) => {
            if (e.key === "Escape") {
                closeDialog();
                document.removeEventListener("keydown", handleEscKey);
            }
        };
        document.addEventListener("keydown", handleEscKey);

        // 외부 클릭으로 모달 닫기
        const handleOutsideClick = (e) => {
            if (e.target === dialog) {
                closeDialog();
                document.removeEventListener("click", handleOutsideClick);
            }
        };
        document.addEventListener("click", handleOutsideClick);

        const fileInput = dialog.querySelector(".image-file-input");
        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const element = await this.handleImageUpload(file);
                    this.elements.push(element);
                    this.renderElement(element);
                    this.selectElement(element);
                    this.saveHistory();
                    closeDialog();
                    document.removeEventListener("keydown", handleEscKey);
                    document.removeEventListener("click", handleOutsideClick);
                } catch (error) {
                    alert(error.message);
                }
            }
        });

        dialog.querySelector(".cancel-btn").addEventListener("click", () => {
            closeDialog();
            document.removeEventListener("keydown", handleEscKey);
            document.removeEventListener("click", handleOutsideClick);
        });
    }

    createImageElement(src) {
        const element = {
            id: Date.now(),
            type: "image",
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            content: src,
            zIndex: this.maxZIndex,
            aspectRatio: null, // 이미지 비율 보존을 위해 추가
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

        // 새로 추가된 요소를 포함하여 뷰 최적화
        this.optimizeViewForNewElement(element);
    }

    renderElement(element) {
        const div = document.createElement("div");
        div.id = `element-${element.id}`;
        div.className = `element ${element.type}`;

        // 공통 스타일 적용
        Object.assign(div.style, {
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.width}px`,
            height: element.type === "alert" ? "auto" : `${element.height}px`,
            zIndex: element.zIndex || 1,
            borderColor: "transparent",
            borderStyle: "none",
            borderWidth: "0px",
            boxSizing: "border-box",
            opacity: 1, // 항상 불투명
        });

        // borderPosition이 outside인 경우 margin 적용
        if (element.borderPosition === "outside") {
            div.style.margin = `-${element.borderWidth || 1}px`;
        }

        // 알림 요소의 경우 최소 높이 설정
        if (element.type === "alert") {
            div.style.minHeight = `${element.height}px`;
        }

        if (element.type === "shape") {
            div.classList.add(element.shapeType);

            const innerContainer = document.createElement("div");
            innerContainer.style.width = "100%";
            innerContainer.style.height = "100%";
            innerContainer.style.position = "relative";
            innerContainer.style.backgroundColor = "transparent";
            innerContainer.style.border = "none";

            switch (element.shapeType) {
                case "square":
                    // 정사각형
                    innerContainer.style.backgroundColor = this.setAlphaToColor(element.fill || "#D9D9D9", element.fillOpacity);

                    if (element.showX) {
                        // SVG로 대각선 생성
                        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        svg.style.position = "absolute";
                        svg.style.top = "0";
                        svg.style.left = "0";
                        svg.style.width = "100%";
                        svg.style.height = "100%";
                        svg.style.pointerEvents = "none";

                        // 첫 번째 대각선 (좌상단 → 우하단)
                        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line1.setAttribute("x1", "0");
                        line1.setAttribute("y1", "0");
                        line1.setAttribute("x2", "100%");
                        line1.setAttribute("y2", "100%");
                        line1.setAttribute("stroke", element.borderColor);
                        line1.setAttribute("stroke-width", "1");

                        // 두 번째 대각선 (우상단 → 좌하단)
                        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line2.setAttribute("x1", "100%");
                        line2.setAttribute("y1", "0");
                        line2.setAttribute("x2", "0");
                        line2.setAttribute("y2", "100%");
                        line2.setAttribute("stroke", element.borderColor);
                        line2.setAttribute("stroke-width", "1");

                        svg.appendChild(line1);
                        svg.appendChild(line2);
                        innerContainer.appendChild(svg);
                    }
                    break;

                case "circle":
                    // 원형을 위한 자식 div 생성
                    const circleDiv = document.createElement("div");
                    circleDiv.style.width = "100%";
                    circleDiv.style.height = "100%";
                    circleDiv.style.borderRadius = "50%";
                    circleDiv.style.backgroundColor = this.setAlphaToColor(element.fill || "#D9D9D9", element.fillOpacity);

                    // stroke가 있는 경우 border 적용 (fill이 적용되는 내부 div에만)
                    if (element.borderWidth && element.borderWidth > 0) {
                        circleDiv.style.border = `${element.borderWidth}px solid ${element.borderColor || "#000000"}`;
                    } else {
                        circleDiv.style.border = "none";
                    }

                    innerContainer.appendChild(circleDiv);

                    if (element.showX) {
                        // SVG로 대각선만 생성
                        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        svg.setAttribute("width", "100%");
                        svg.setAttribute("height", "100%");
                        svg.style.position = "absolute";
                        svg.style.top = "0";
                        svg.style.left = "0";
                        svg.style.pointerEvents = "none";

                        // 대각선 1 (좌상단 → 우하단)
                        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line1.setAttribute("x1", "0");
                        line1.setAttribute("y1", "0");
                        line1.setAttribute("x2", "100%");
                        line1.setAttribute("y2", "100%");
                        line1.setAttribute("stroke", element.borderColor || "#000000");
                        line1.setAttribute("stroke-width", "1");

                        // 대각선 2 (우상단 → 좌하단)
                        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line2.setAttribute("x1", "100%");
                        line2.setAttribute("y1", "0");
                        line2.setAttribute("x2", "0");
                        line2.setAttribute("y2", "100%");
                        line2.setAttribute("stroke", element.borderColor || "#000000");
                        line2.setAttribute("stroke-width", "1");

                        svg.appendChild(line1);
                        svg.appendChild(line2);
                        innerContainer.appendChild(svg);
                    }
                    break;

                case "line":
                    // 선
                    const line = document.createElement("div");
                    line.style.width = "100%";
                    line.style.height = `${element.borderWidth || 1}px`;
                    line.style.backgroundColor = element.borderColor || "#000000";
                    line.style.position = "absolute";
                    line.style.top = "50%";
                    line.style.transform = "translateY(-50%)";
                    innerContainer.style.border = "none";
                    innerContainer.appendChild(line);
                    break;

                case "arrow":
                    // 화살표
                    const arrowLine = document.createElement("div");
                    const arrowHead = document.createElement("div");

                    // 선 스타일
                    arrowLine.style.width = "100%";
                    arrowLine.style.height = `${element.borderWidth || 1}px`;
                    arrowLine.style.backgroundColor = element.borderColor || "#000000";
                    arrowLine.style.position = "absolute";
                    arrowLine.style.top = "50%";
                    arrowLine.style.transform = "translateY(-50%)";

                    // 화살표 머리 스타일
                    const headSize = Math.max(6, (element.borderWidth || 1) * 2);
                    arrowHead.style.position = "absolute";
                    arrowHead.style.right = "-10px";
                    arrowHead.style.top = "50%";
                    arrowHead.style.width = "0";
                    arrowHead.style.height = "0";
                    arrowHead.style.borderTop = `${headSize}px solid transparent`;
                    arrowHead.style.borderBottom = `${headSize}px solid transparent`;
                    arrowHead.style.borderLeft = `${headSize * 1.5}px solid ${element.borderColor || "#000000"}`;
                    arrowHead.style.transform = "translateY(-50%)";

                    innerContainer.style.border = "none";
                    innerContainer.appendChild(arrowLine);
                    innerContainer.appendChild(arrowHead);
                    break;

                case "triangle":
                    // 삼각형 - SVG 사용
                    const triangleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    triangleSvg.setAttribute("width", "100%");
                    triangleSvg.setAttribute("height", "100%");
                    triangleSvg.style.position = "absolute";
                    triangleSvg.style.top = "0";
                    triangleSvg.style.left = "0";
                    triangleSvg.style.pointerEvents = "none";

                    // 삼각형 경로를 동적으로 생성 (정삼각형)
                    const trianglePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    trianglePath.setAttribute("fill", this.setAlphaToColor(element.fill || "#D9D9D9", element.fillOpacity));
                    trianglePath.setAttribute("stroke", "none");
                    trianglePath.setAttribute("stroke-width", "0");
                    trianglePath.setAttribute("vector-effect", "non-scaling-stroke");

                    // 삼각형 경로를 동적으로 설정하는 함수
                    const updateTrianglePath = () => {
                        const width = element.width || 200;
                        const height = element.height || 200;
                        const centerX = width / 2;
                        const topY = height * 0.1;
                        const bottomY = height * 0.9;
                        const leftX = width * 0.1;
                        const rightX = width * 0.9;

                        const pathData = `M${centerX},${topY} L${rightX},${bottomY} L${leftX},${bottomY} Z`;
                        trianglePath.setAttribute("d", pathData);
                    };

                    updateTrianglePath();
                    triangleSvg.appendChild(trianglePath);
                    innerContainer.style.backgroundColor = "transparent";
                    innerContainer.appendChild(triangleSvg);
                    break;
            }

            div.appendChild(innerContainer);
        } else if (element.type === "image") {
            const img = document.createElement("img");
            Object.assign(img, {
                src: element.content,
                style: "width: 100%; height: 100%; object-fit: contain;",
                draggable: false,
                alt: "Uploaded image",
            });
            div.appendChild(img);
        } else if (element.type === "icon") {
            const wrapper = document.createElement("div");
            wrapper.className = "icon-wrapper";

            // 새로운 아이콘 경로 매핑 사용
            const iconPath = this.iconPaths[element.content];
            if (iconPath) {
                const img = document.createElement("img");
                img.src = iconPath;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                img.style.filter = element.iconColor ? `brightness(0) saturate(100%) ${element.iconColor}` : "";

                // 화살표와 꺽쇠 아이콘에 대한 방향 적용
                if (element.content === "arrow-down") {
                    img.style.transform = "rotate(180deg)";
                } else if (element.content === "anglebracket-close") {
                    img.style.transform = "rotate(180deg)";
                }

                wrapper.appendChild(img);
            }
            div.appendChild(wrapper);
        } else if (element.type === "input") {
            const container = document.createElement("div");
            container.className = `input-container ${element.inputType}`;
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "4px";
            container.style.width = "100%";
            container.style.height = "100%";

            // Label
            const label = document.createElement("label");
            label.textContent = element.label || "Label";
            label.style.fontSize = "12px";
            label.style.fontWeight = "500";
            label.style.cursor = "text";
            label.contentEditable = "true";
            label.addEventListener("blur", () => {
                element.label = label.textContent;
                this.saveHistory();
            });
            label.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    label.blur();
                }
            });

            // Input Wrapper (for button-include case)
            const inputWrapper = document.createElement("div");
            inputWrapper.style.display = "flex";
            inputWrapper.style.flexDirection = element.inputType === "button-include" ? "row" : "column";
            inputWrapper.style.gap = "8px";
            inputWrapper.style.flex = "1";

            // Input
            const input = document.createElement("input");
            input.type = "text";
            input.style.width = "100%";
            input.style.padding = "10px 8px";
            // input.style.borderBottom = "2px solid #D9DBE0";
            input.style.fontSize = `${element.fontSize || 16}px`;
            if (element.textColor) {
                input.style.color = element.textColor;
            }
            if (element.fontWeight) {
                input.style.fontWeight = element.fontWeight;
            }

            inputWrapper.appendChild(input);

            if (element.inputType === "button-include") {
                // input과 버튼을 위한 wrapper
                const buttonWrapper = document.createElement("div");
                buttonWrapper.style.display = "flex";
                buttonWrapper.style.gap = "8px";
                buttonWrapper.style.width = "100%";

                // 입력 필드
                const inputField = document.createElement("div");
                inputField.style.flex = "1"; // 남은 공간 모두 차지
                inputField.style.minWidth = "0"; // overflow 방지
                input.style.width = "100%";
                inputField.appendChild(input);
                buttonWrapper.appendChild(inputField);

                // 버튼
                const button = document.createElement("button");
                button.textContent = element.buttonText || "입력";
                button.style.whiteSpace = "nowrap"; // 버튼 텍스트 줄바꿈 방지
                button.style.padding = "11px 20px";
                button.style.background = "#2E6FF2";
                button.style.color = "#ffffff";
                button.style.border = "none";
                button.style.borderRadius = "10px";
                button.style.fontSize = "14px";
                button.style.minWidth = "100px";
                button.style.width = "fit-content";
                button.style.boxSizing = "border-box";
                button.contentEditable = "true";
                button.addEventListener("blur", () => {
                    element.buttonText = button.textContent;
                    this.saveHistory();
                });
                button.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        button.blur();
                    }
                });
                buttonWrapper.appendChild(button);

                inputWrapper.appendChild(buttonWrapper);
            }

            if (element.inputType === "error") {
                const errorMessage = document.createElement("span");
                errorMessage.className = "error-message";
                errorMessage.textContent = element.errorMessage || "※ 유효하지 않은 정보입니다.";
                errorMessage.style.color = "#47494D";
                errorMessage.style.fontSize = "12px";
                errorMessage.style.lineHeight = "16px";
                errorMessage.style.marginTop = "4px";
                errorMessage.style.cursor = "text";
                errorMessage.contentEditable = "true";
                errorMessage.addEventListener("blur", () => {
                    element.errorMessage = errorMessage.textContent;
                    this.saveHistory();
                });
                errorMessage.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        errorMessage.blur();
                    }
                });
                inputWrapper.appendChild(errorMessage);
            }

            container.appendChild(label);
            container.appendChild(inputWrapper);
            div.appendChild(container);
        } else if (element.type === "alert") {
            const container = document.createElement("div");
            container.className = `alert-container ${element.alertType}`;
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.justifyContent = "center";
            container.style.alignItems = "center";
            container.style.gap = "12px";
            container.style.padding = "28px 80px";
            container.style.borderRadius = "10px";
            container.style.background = "#fff";
            container.style.boxShadow = "0px 4px 20px 0px rgba(0, 0, 0, 0.04)";
            container.style.minHeight = "120px";
            container.style.height = "auto";

            const iconWrapper = document.createElement("div");
            iconWrapper.style.padding = "1.5px";
            const iconSvg =
                element.alertType === "information"
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2.3C6.19512 2.3 2.3 6.19512 2.3 11C2.3 15.8049 6.19512 19.7 11 19.7C15.8049 19.7 19.7 15.8049 19.7 11C19.7 6.19512 15.8049 2.3 11 2.3ZM0.5 11C0.5 5.20101 5.20101 0.5 11 0.5C16.799 0.5 21.5 5.20101 21.5 11C21.5 16.799 16.799 21.5 11 21.5C5.20101 21.5 0.5 16.799 0.5 11Z" fill="#8D9299"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 6.5C11.497 6.5 11.9 6.90294 11.9 7.4V11.9C11.9 12.3971 11.497 12.8 11 12.8C10.5029 12.8 10.1 12.3971 10.1 11.9V7.4C10.1 6.90294 10.5029 6.5 11 6.5Z" fill="#8D9299"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 13.7C11.497 13.7 11.9 14.1029 11.9 14.6V14.66C11.9 15.157 11.497 15.56 11 15.56C10.5029 15.56 10.1 15.157 10.1 14.66V14.6C10.1 14.1029 10.5029 13.7 11 13.7Z" fill="#8D9299"/>
                        </svg>`
                    : element.alertType === "success"
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="22" viewBox="0 0 21 22" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 2.3C5.69512 2.3 1.8 6.19512 1.8 11C1.8 15.8049 5.69512 19.7 10.5 19.7C15.3049 19.7 19.2 15.8049 19.2 11C19.2 6.19512 15.3049 2.3 10.5 2.3ZM0 11C0 5.20101 4.70101 0.5 10.5 0.5C16.299 0.5 21 5.20101 21 11C21 16.799 16.299 21.5 10.5 21.5C4.70101 21.5 0 16.799 0 11Z" fill="#2E6FF2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M14.6544 7.89104C15.046 8.19725 15.1152 8.76288 14.8089 9.15442L10.5859 14.5544C10.4282 14.756 10.1921 14.881 9.93675 14.898C9.68136 14.915 9.43081 14.8225 9.24779 14.6436L6.27086 11.7334C5.91543 11.3859 5.90896 10.8161 6.25643 10.4607C6.60389 10.1053 7.1737 10.0988 7.52914 10.4463L9.78724 12.6537L13.3911 8.04556C13.6973 7.65402 14.2629 7.58484 14.6544 7.89104Z" fill="#2E6FF2"/>
                        </svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2.3C6.19512 2.3 2.3 6.19512 2.3 11C2.3 15.8049 6.19512 19.7 11 19.7C15.8049 19.7 19.7 15.8049 19.7 11C19.7 6.19512 15.8049 2.3 11 2.3ZM0.5 11C0.5 5.20101 5.20101 0.5 11 0.5C16.799 0.5 21.5 5.20101 21.5 11C21.5 16.799 16.799 21.5 11 21.5C5.20101 21.5 0.5 16.799 0.5 11Z" fill="#FF3440"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 6.5C11.497 6.5 11.9 6.90294 11.9 7.4V11.9C11.9 12.3971 11.497 12.8 11 12.8C10.5029 12.8 10.1 12.3971 10.1 11.9V7.4C10.1 6.90294 10.5029 6.5 11 6.5Z" fill="#FF3440"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 13.7C11.497 13.7 11.9 14.1029 11.9 14.6V14.66C11.9 15.157 11.497 15.56 11 15.56C10.5029 15.56 10.1 15.157 10.1 14.66V14.6C10.1 14.1029 10.5029 13.7 11 13.7Z" fill="#FF3440"/>
                        </svg>`;

            iconWrapper.innerHTML = iconSvg;

            // 메시지 텍스트 추가
            const messageText = document.createElement("span");
            messageText.innerHTML =
                element.content ||
                (element.alertType === "information"
                    ? "새로운 업데이트가 있습니다."
                    : element.alertType === "success"
                    ? "완료되었습니다."
                    : `사이트에서 나가시겠습니까? <br /> 변경사항이 저장되지 않을 수 있습니다.`);
            messageText.style.color = element.textColor || "#121314";
            messageText.style.textAlign = "center";
            messageText.style.fontSize = `${element.fontSize || 16}px`;
            messageText.style.fontWeight = element.fontWeight || "500";
            messageText.style.lineHeight = "22px";
            messageText.style.cursor = "text";
            messageText.contentEditable = "true";
            messageText.addEventListener("blur", () => {
                element.content = messageText.innerHTML;
                this.saveHistory();
            });
            messageText.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    messageText.blur();
                }
            });

            const btnWrapper = document.createElement("div");
            btnWrapper.className = "btn-wrapper";

            const createButton = (text, buttonType) => {
                const button = document.createElement("button");
                button.innerText = text;
                button.style.cursor = "text";
                button.contentEditable = "true";
                button.addEventListener("blur", () => {
                    if (buttonType === "primary") {
                        element.primaryButtonText = button.innerText;
                    } else {
                        element.secondaryButtonText = button.innerText;
                    }
                    this.saveHistory();
                });
                button.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        button.blur();
                    }
                });
                return button;
            };

            if (element.alertType === "warning") {
                btnWrapper.appendChild(createButton(element.secondaryButtonText || "취소", "secondary"));
                btnWrapper.appendChild(createButton(element.primaryButtonText || "나가기", "primary"));
            } else {
                btnWrapper.appendChild(createButton(element.primaryButtonText || "확인", "primary"));
            }

            container.appendChild(iconWrapper);
            container.appendChild(messageText);
            container.appendChild(btnWrapper);
            div.appendChild(container);
        } else if (element.type === "sticky") {
            div.style.backgroundColor = this.setAlphaToColor(element.stickyColor, element.fillOpacity);
            const content = document.createElement("div");
            content.className = "sticky-content";
            content.style.fontSize = `${element.fontSize}px`;
            if (element.textColor) {
                content.style.color = element.textColor;
            }
            if (element.fontWeight) {
                content.style.fontWeight = element.fontWeight;
            }
            content.textContent = element.content;

            const handleDblClick = (e) => {
                e.stopPropagation();
                if (!e.target.closest(".resize-handle")) {
                    this.startEditingSticky(element);
                }
            };

            div.addEventListener("dblclick", handleDblClick);
            content.addEventListener("dblclick", handleDblClick);
            div.appendChild(content);
        } else if (element.type === "text") {
            div.textContent = element.content;
            if (element.fontSize) div.style.fontSize = `${element.fontSize}px`;
            if (element.fontFamily) div.style.fontFamily = element.fontFamily;
            if (element.textColor) div.style.color = element.textColor;
            if (element.textAlign) div.style.textAlign = element.textAlign;
            if (element.fontWeight) div.style.fontWeight = element.fontWeight;
            if (element.fontStyle) div.style.fontStyle = element.fontStyle;
            if (element.textDecoration) div.style.textDecoration = element.textDecoration;
            div.style.justifyContent = element.justifyContent || "center";
            div.style.alignItems = "center";
            div.style.display = "flex";
            div.style.width = `${element.width}px`;
            div.style.height = `${element.height}px`;

            div.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                this.startEditing(element);
            });
        } else if (element.type === "link") {
            const content = document.createElement("div");
            content.className = "link-content";
            content.textContent = element.content;

            if (this.previewMode && element.targetPageId) {
                div.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.switchPage(element.targetPageId);
                });
            }
            div.appendChild(content);
        } else if (element.type === "button") {
            div.textContent = element.content;
            div.className = `element button ${element.buttonType || "normal"}`;
            // 버튼 배경색 적용
            if (element.backgroundColor) {
                div.style.backgroundColor = this.setAlphaToColor(element.backgroundColor, element.fillOpacity);
            }
            // 버튼 텍스트 색상 적용
            if (element.textColor) {
                div.style.color = element.textColor;
            }
            if (element.fontSize) {
                div.style.fontSize = `${element.fontSize}px`;
            }
            if (element.fontWeight) {
                div.style.fontWeight = element.fontWeight;
            }

            div.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                this.startEditingButton(element);
            });
        } else if (element.type === "table") {
            const container = document.createElement("div");
            container.className = "table-container";
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.position = "absolute";
            container.style.top = "0";
            container.style.left = "0";

            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.height = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = `${element.fontSize}px`;
            table.style.color = element.textColor;
            table.style.tableLayout = "fixed"; // 추가: 테이블 레이아웃 고정

            element.data.forEach((rowData, i) => {
                const row = document.createElement("tr");
                rowData.forEach((cellData, j) => {
                    const cell = document.createElement(i === 0 ? "th" : "td");
                    cell.textContent = cellData;
                    cell.style.padding = `${element.cellPadding}px`;
                    cell.style.border = `1px solid ${element.borderColor}`;
                    cell.style.backgroundColor = i === 0 ? element.headerBgColor : element.cellBgColor;
                    cell.style.fontWeight = i === 0 ? element.headerFontWeight : element.cellFontWeight;
                    cell.style.textAlign = "center"; // 추가: 가운데 정렬
                    cell.style.verticalAlign = "middle"; // 추가: 수직 가운데 정렬
                    cell.style.wordBreak = "break-word"; // 추가: 긴 텍스트 처리

                    cell.addEventListener("dblclick", (e) => {
                        if (!this.previewMode) {
                            e.stopPropagation();
                            this.startEditingTableCell(element, i, j, e.target);
                        }
                    });

                    row.appendChild(cell);
                });
                table.appendChild(row);
            });

            container.appendChild(table);
            div.appendChild(container);
        } else if (element.type === "panel") {
            Object.assign(div.style, {
                backgroundColor: this.setAlphaToColor(element.backgroundColor || "#ffffff", element.fillOpacity),
                borderColor: element.borderColor || "#dddddd",
            });

            const container = document.createElement("div");
            container.innerHTML = `
                <div class="panel-header" style="background-color: ${element.headerColor || "#f5f5f5"}; border-bottom-color: ${element.borderColor || "#dddddd"}">
                    <div class="panel-title">Panel</div>
                    <button class="panel-close">×</button>
                </div>
                <div class="panel-content" style="background-color: ${element.backgroundColor || "#ffffff"}">${element.content}</div>
            `;

            container.querySelector(".panel-close").addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Delete this panel?")) {
                    this.deleteElement(element.id);
                }
            });

            div.appendChild(container);
        } else if (element.type === "frame") {
            div.style.backgroundColor = this.setAlphaToColor(element.backgroundColor, element.fillOpacity);
            div.style.border = "none";
            div.style.borderRadius = "8px";

            // frame-container 생성
            const container = document.createElement("div");
            container.className = "frame-container";

            const label = document.createElement("div");
            label.className = "frame-label";
            label.textContent = element.name;
            label.setAttribute("contenteditable", "true");

            // 프레임 라벨 편집 이벤트
            label.addEventListener("blur", () => {
                if (label.textContent !== element.name) {
                    element.name = label.textContent;
                    this.updateLayersList();
                }
            });

            label.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    label.blur();
                }
            });

            container.appendChild(label);
            div.appendChild(container);
        }
        // 공통 이벤트 리스너 추가
        div.addEventListener("mousedown", (e) => {
            if (!this.previewMode && !e.target.classList.contains("panel-close") && !e.target.classList.contains("resize-handle")) {
                this.startDragging(e, element);
            }
        });

        div.addEventListener("click", (e) => {
            if (!this.previewMode && !e.target.classList.contains("panel-close")) {
                // 텍스트 배치 모드 중에는 요소 선택 방지
                if (this.isTextPlacementMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                e.stopPropagation();

                // Ctrl/Cmd + 클릭으로 다중 선택
                if (e.ctrlKey || e.metaKey) {
                    if (this.selectedElements.find((el) => el.id === element.id)) {
                        // 이미 선택된 요소면 선택 해제
                        this.removeFromSelection(element);
                        if (this.selectedElements.length === 0) {
                            this.selectedElement = null;
                        } else {
                            this.selectedElement = this.selectedElements[this.selectedElements.length - 1];
                        }
                    } else {
                        // 새로운 요소를 선택에 추가
                        this.addToSelection(element);
                        this.selectedElement = element;
                    }
                } else {
                    // 일반 클릭으로 단일 선택
                    this.selectElement(element);
                }
            }
        });

        // 호버 효과를 위한 이벤트 리스너 추가
        div.addEventListener("mouseenter", (e) => {
            if (!this.previewMode && !div.classList.contains("selected")) {
                // CSS에서 처리되므로 여기서는 특별한 작업 불필요
                // 필요시 추가 로직 구현 가능
            }
        });

        div.addEventListener("mouseleave", (e) => {
            if (!this.previewMode) {
                // CSS에서 처리되므로 여기서는 특별한 작업 불필요
                // 필요시 추가 로직 구현 가능
            }
        });

        document.getElementById("canvas").appendChild(div);

        // border 스타일 적용
        if (element.borderWidth && element.borderWidth > 0) {
            this.applyBorderStyle(element, div);
        }

        this.updateLayersList();
    }

    startEditing(element) {
        if (element.type !== "text") return;

        const elementDiv = document.getElementById(`element-${element.id}`);
        if (!elementDiv) return;

        // 이미 편집 중인지 확인
        if (elementDiv.querySelector(".editable-text")) {
            return;
        }

        const currentText = element.content;

        elementDiv.innerHTML = "";
        const editableDiv = document.createElement("div");
        editableDiv.contentEditable = true;
        editableDiv.className = "editable-text";
        editableDiv.textContent = currentText;
        editableDiv.style.width = "100%";
        editableDiv.style.height = "100%";
        editableDiv.style.outline = "none";
        editableDiv.style.justifyContent = element.justifyContent || "center";
        editableDiv.style.fontSize = element.fontSize ? `${element.fontSize}px` : "16px";

        elementDiv.appendChild(editableDiv);

        // 텍스트 선택
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        editableDiv.focus();

        // Ctrl+B 단축키 처리
        editableDiv.addEventListener("keydown", (e) => {
            if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleBold();
                // 편집 중인 div에도 볼드 상태 적용
                editableDiv.style.fontWeight = element.isBold ? "bold" : "normal";
            } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });

        // 편집 완료 처리
        const finishEditing = () => {
            const newText = editableDiv.textContent;
            element.content = newText;

            // 텍스트 크기에 따라 너비 조정
            const tempSpan = document.createElement("span");
            tempSpan.style.fontSize = element.fontSize ? `${element.fontSize}px` : "16px";
            tempSpan.style.fontFamily = element.fontFamily || "Arial, sans-serif";
            tempSpan.style.fontWeight = element.fontWeight || "normal";
            tempSpan.style.fontStyle = element.fontStyle || "normal";
            tempSpan.style.textDecoration = element.textDecoration || "none";
            tempSpan.style.visibility = "hidden";
            tempSpan.style.position = "absolute";
            tempSpan.style.whiteSpace = "nowrap";
            tempSpan.textContent = newText;

            document.body.appendChild(tempSpan);
            const newWidth = Math.max(tempSpan.offsetWidth + 10, 50); // 패딩 포함, 최소 너비 50px
            document.body.removeChild(tempSpan);

            element.width = newWidth;
            elementDiv.style.width = element.width + "px";

            // 볼드 상태 유지
            elementDiv.style.fontWeight = element.isBold ? "bold" : "normal";
            this.saveHistory();
        };

        editableDiv.addEventListener("blur", finishEditing);

        editableDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });
    }

    startEditingTableCell(tableElement, row, col, cellElement) {
        // 이미 편집 중인지 확인
        if (cellElement.querySelector("input")) return;

        const input = document.createElement("input");
        input.type = "text";
        input.value = tableElement.data[row][col];
        input.style.width = "100%";
        input.style.height = "100%";
        input.style.padding = `${tableElement.cellPadding}px`;
        input.style.border = "none";
        input.style.backgroundColor = "white";
        input.style.fontSize = `${tableElement.fontSize}px`;
        input.style.fontWeight = row === 0 ? tableElement.headerFontWeight : tableElement.cellFontWeight;
        input.style.textAlign = "center"; // 추가: 입력 필드도 가운데 정렬
        input.style.outline = "none"; // 추가: 포커스 아웃라인 제거

        const originalContent = cellElement.textContent;
        cellElement.textContent = "";
        cellElement.appendChild(input);
        input.focus();
        input.select(); // 추가: 텍스트 전체 선택

        const finishEditing = (save) => {
            if (!cellElement.contains(input)) return; // 이미 제거됐는지 확인

            const newValue = input.value;
            if (save) {
                tableElement.data[row][col] = newValue;
                cellElement.textContent = newValue;
                this.saveHistory();
            } else {
                cellElement.textContent = originalContent;
            }

            // 스타일 복원
            cellElement.style.textAlign = "center";
            cellElement.style.verticalAlign = "middle";
        };

        input.addEventListener("blur", () => finishEditing(true));
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            } else if (e.key === "Escape") {
                finishEditing(false);
            }
        });
    }

    startEditingButton(element) {
        const elementDiv = document.getElementById(`element-${element.id}`);
        const currentText = element.content;

        const computedStyle = window.getComputedStyle(elementDiv);
        const currentColor = computedStyle.color;

        elementDiv.innerHTML = "";
        const editableDiv = document.createElement("div");
        editableDiv.contentEditable = true;
        editableDiv.className = "editable-text";
        editableDiv.textContent = currentText;
        editableDiv.style.width = "100%";
        editableDiv.style.height = "100%";
        editableDiv.style.display = "flex";
        editableDiv.style.alignItems = "center";
        editableDiv.style.justifyContent = "center";
        editableDiv.style.outline = "none";
        editableDiv.style.color = currentColor;
        editableDiv.style.cursor = "text";

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
            elementDiv.className = `element button ${element.buttonType || "normal"}`;
            this.saveHistory();
        };

        editableDiv.addEventListener("blur", finishEditing);

        editableDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                editableDiv.blur();
            }
        });
    }

    startEditingSticky(element) {
        const elementDiv = document.getElementById(`element-${element.id}`);
        const contentDiv = elementDiv.querySelector(".sticky-content");

        // 이미 편집 중인 경우 리턴
        if (contentDiv.contentEditable === "true") return;

        // contentEditable 속성 추가
        contentDiv.contentEditable = true;
        contentDiv.classList.add("editable");

        // 포커스 및 텍스트 선택
        contentDiv.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentDiv);
        selection.removeAllRanges();
        selection.addRange(range);

        const finishEditing = () => {
            contentDiv.contentEditable = false;
            contentDiv.classList.remove("editable");
            element.content = contentDiv.textContent || element.content;
            this.saveHistory();
            this.updateProperties();
        };

        // blur와 Ctrl+Enter로 편집 완료
        contentDiv.addEventListener("blur", finishEditing, { once: true });
        contentDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.ctrlKey) {
                contentDiv.blur();
            }
        });
    }

    toggleBold() {
        if (!this.selectedElement || this.selectedElement.type !== "text") return;

        this.selectedElement.isBold = !this.selectedElement.isBold;

        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.fontWeight = this.selectedElement.isBold ? "bold" : "normal";
        }

        this.updateProperties();
        this.saveHistory();
    }

    startDragging(e, element) {
        // 패닝 모드이거나 스페이스바가 눌린 상태면 드래그 시작하지 않음
        if (this.isPanning || e.spaceKey) {
            return;
        }

        this.draggedElement = element;
        const canvas = document.getElementById("canvas");
        const canvasRect = canvas.getBoundingClientRect();

        // 드래그 중인 요소에 dragging 클래스 추가
        const elementDiv = document.getElementById(`element-${element.id}`);
        elementDiv.classList.add("dragging");

        // 스케일을 고려한 오프셋 계산
        this.offset = {
            x: (e.clientX - canvasRect.left) / this.scale - element.x,
            y: (e.clientY - canvasRect.top) / this.scale - element.y,
        };

        // 자동 스크롤 상태 초기화
        this.autoScrollState = {
            isScrolling: false,
            scrollIntervalId: null,
            direction: { x: 0, y: 0 },
            speed: { x: 0, y: 0 },
        };

        const moveHandler = (e) => this.handleDrag(e);
        const upHandler = () => {
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseup", upHandler);

            // 드래그 종료 시 dragging 클래스 제거
            elementDiv.classList.remove("dragging");

            // 드래그 종료 시 자동 스크롤 중지
            if (this.autoScrollState.scrollIntervalId) {
                clearInterval(this.autoScrollState.scrollIntervalId);
                this.autoScrollState.scrollIntervalId = null;
            }

            this.draggedElement = null;
            // 가이드라인 제거
            this.snapGuides.forEach((guide) => guide.remove());
            this.snapGuides = [];
            this.saveHistory();
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);

        // 자동 스크롤 타이머 시작
        this.startAutoScroll();
    }

    startAutoScroll() {
        // 이전 타이머가 있으면 제거
        if (this.autoScrollState.scrollIntervalId) {
            clearInterval(this.autoScrollState.scrollIntervalId);
        }

        // 60fps에 가까운 주기로 업데이트 (약 16.6ms)
        this.autoScrollState.scrollIntervalId = setInterval(() => {
            if (this.autoScrollState.isScrolling) {
                // 스크롤 방향과 속도에 따라 캔버스 이동
                this.canvasOffset.x += this.autoScrollState.speed.x;
                this.canvasOffset.y += this.autoScrollState.speed.y;
                // transform 속성 적용하지 않음
                // this.updateCanvasTransform();

                // 드래그 중인 요소 위치 업데이트 (마우스 위치 유지를 위해)
                if (this.draggedElement) {
                    const elementDiv = document.getElementById(`element-${this.draggedElement.id}`);
                    if (elementDiv) {
                        elementDiv.style.left = `${this.draggedElement.x}px`;
                        elementDiv.style.top = `${this.draggedElement.y}px`;
                    }
                }
            }
        }, 16);
    }

    handleDrag(e) {
        if (!this.draggedElement) return;

        const canvas = document.getElementById("canvas");
        const canvasArea = document.querySelector(".canvas-area");
        const rect = canvas.getBoundingClientRect();
        const canvasAreaRect = canvasArea.getBoundingClientRect();

        // 마우스 위치를 기준으로 요소 위치 계산
        let clientX = e.clientX;
        let clientY = e.clientY;

        // 마우스가 화면 밖으로 나갔을 때 화면 경계에 고정
        if (clientX < canvasAreaRect.left + 1) clientX = canvasAreaRect.left + 1;
        if (clientX > canvasAreaRect.right - 1) clientX = canvasAreaRect.right - 1;
        if (clientY < canvasAreaRect.top + 1) clientY = canvasAreaRect.top + 1;
        if (clientY > canvasAreaRect.bottom - 1) clientY = canvasAreaRect.bottom - 1;

        // 스케일과 오프셋을 고려한 위치 계산
        let x = (clientX - rect.left) / this.scale - this.offset.x;
        let y = (clientY - rect.top) / this.scale - this.offset.y;

        // 그리드 스냅 적용
        if (this.gridSize > 0) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }

        // 다른 요소들과의 정렬 체크
        const snapResult = this.checkAlignment(x, y);
        x = snapResult.x;
        y = snapResult.y;

        // 가이드라인 업데이트
        this.updateGuideLines(snapResult.guides);

        // 음수 좌표 허용
        this.draggedElement.x = x;
        this.draggedElement.y = y;

        const elementDiv = document.getElementById(`element-${this.draggedElement.id}`);
        elementDiv.style.left = `${this.draggedElement.x}px`;
        elementDiv.style.top = `${this.draggedElement.y}px`;

        this.updateProperties();

        // 자동 스크롤 영역 확인 (화면 가장자리에서 20px 이내)
        const scrollMargin = 20;
        const scrollSpeed = 5; // 기본 스크롤 속도
        const maxScrollSpeed = 15; // 최대 스크롤 속도

        // 스크롤 영역과의 거리 계산 (마우스 위치 기준)
        const distLeft = clientX - canvasAreaRect.left;
        const distRight = canvasAreaRect.right - clientX;
        const distTop = clientY - canvasAreaRect.top;
        const distBottom = canvasAreaRect.bottom - clientY;

        // 스크롤 방향과 속도 계산
        const getScrollSpeed = (distance) => {
            if (distance > scrollMargin) return 0;
            // 거리가 가까울수록 더 빠른 스크롤 속도 (반비례 관계)
            return Math.min(maxScrollSpeed, scrollSpeed * (1 + (scrollMargin - distance) / scrollMargin));
        };

        // X축 스크롤 방향과 속도
        if (distLeft < scrollMargin) {
            this.autoScrollState.direction.x = -1;
            this.autoScrollState.speed.x = -getScrollSpeed(distLeft);
            this.autoScrollState.isScrolling = true;
        } else if (distRight < scrollMargin) {
            this.autoScrollState.direction.x = 1;
            this.autoScrollState.speed.x = getScrollSpeed(distRight);
            this.autoScrollState.isScrolling = true;
        } else {
            this.autoScrollState.direction.x = 0;
            this.autoScrollState.speed.x = 0;
        }

        // Y축 스크롤 방향과 속도
        if (distTop < scrollMargin) {
            this.autoScrollState.direction.y = -1;
            this.autoScrollState.speed.y = -getScrollSpeed(distTop);
            this.autoScrollState.isScrolling = true;
        } else if (distBottom < scrollMargin) {
            this.autoScrollState.direction.y = 1;
            this.autoScrollState.speed.y = getScrollSpeed(distBottom);
            this.autoScrollState.isScrolling = true;
        } else {
            this.autoScrollState.direction.y = 0;
            this.autoScrollState.speed.y = 0;
        }

        // 모든 방향의 속도가 0이면 스크롤 중지
        if (this.autoScrollState.speed.x === 0 && this.autoScrollState.speed.y === 0) {
            this.autoScrollState.isScrolling = false;
        }
    }

    // 자동 스크롤 메서드 수정 - 요소 위치 화면 내 유지
    startAutoScroll() {
        // 이전 타이머가 있으면 제거
        if (this.autoScrollState.scrollIntervalId) {
            clearInterval(this.autoScrollState.scrollIntervalId);
        }

        // 60fps에 가까운 주기로 업데이트 (약 16.6ms)
        this.autoScrollState.scrollIntervalId = setInterval(() => {
            if (this.autoScrollState.isScrolling && this.draggedElement) {
                const canvasArea = document.querySelector(".canvas-area");
                const canvas = document.getElementById("canvas");
                const canvasRect = canvas.getBoundingClientRect();
                const canvasAreaRect = canvasArea.getBoundingClientRect();

                // 현재 마우스 위치 추적
                const mousePos = {
                    x: this.lastMousePosition?.x || canvasAreaRect.left + canvasAreaRect.width / 2,
                    y: this.lastMousePosition?.y || canvasAreaRect.top + canvasAreaRect.height / 2,
                };

                // 스크롤 방향과 속도에 따라 캔버스 이동
                this.canvasOffset.x += this.autoScrollState.speed.x;
                this.canvasOffset.y += this.autoScrollState.speed.y;
                // transform 속성 적용하지 않음
                // this.updateCanvasTransform();

                // 드래그 중인 요소의 화면상 위치 계산
                const elementRect = {
                    left: canvasRect.left + this.draggedElement.x * this.scale,
                    top: canvasRect.top + this.draggedElement.y * this.scale,
                    width: this.draggedElement.width * this.scale,
                    height: this.draggedElement.height * this.scale,
                };

                // 요소가 화면을 벗어나는지 확인
                let needsUpdate = false;
                let newX = this.draggedElement.x;
                let newY = this.draggedElement.y;

                // 요소가 화면 밖으로 완전히 벗어나지 않도록 조정
                if (elementRect.left + elementRect.width < canvasAreaRect.left) {
                    // 요소가 왼쪽으로 완전히 벗어남
                    newX = (canvasAreaRect.left - canvasRect.left) / this.scale;
                    needsUpdate = true;
                } else if (elementRect.left > canvasAreaRect.right) {
                    // 요소가 오른쪽으로 완전히 벗어남
                    newX = (canvasAreaRect.right - canvasRect.left - elementRect.width) / this.scale;
                    needsUpdate = true;
                }

                if (elementRect.top + elementRect.height < canvasAreaRect.top) {
                    // 요소가 위로 완전히 벗어남
                    newY = (canvasAreaRect.top - canvasRect.top) / this.scale;
                    needsUpdate = true;
                } else if (elementRect.top > canvasAreaRect.bottom) {
                    // 요소가 아래로 완전히 벗어남
                    newY = (canvasAreaRect.bottom - canvasRect.top - elementRect.height) / this.scale;
                    needsUpdate = true;
                }

                // 요소 위치 업데이트가 필요한 경우
                if (needsUpdate) {
                    this.draggedElement.x = newX;
                    this.draggedElement.y = newY;

                    const elementDiv = document.getElementById(`element-${this.draggedElement.id}`);
                    if (elementDiv) {
                        elementDiv.style.left = `${this.draggedElement.x}px`;
                        elementDiv.style.top = `${this.draggedElement.y}px`;
                    }

                    this.updateProperties();
                } else {
                    // 요소 위치 업데이트 (마우스 위치를 따르도록)
                    // 마우스와 요소 간의 오프셋을 유지
                    const elementDiv = document.getElementById(`element-${this.draggedElement.id}`);
                    if (elementDiv) {
                        // 기존 위치 유지 (오프셋 고려)
                        elementDiv.style.left = `${this.draggedElement.x}px`;
                        elementDiv.style.top = `${this.draggedElement.y}px`;
                    }
                }
            }
        }, 16);
    }

    // 정렬 체크 메서드
    checkAlignment(x, y) {
        const guides = [];
        const draggingElement = this.draggedElement;
        let snappedX = x;
        let snappedY = y;
        let hasSnapped = false;

        // 드래그 중인 요소의 경계와 중심점 계산
        const dragBounds = {
            left: x,
            right: x + draggingElement.width,
            top: y,
            bottom: y + draggingElement.height,
            centerX: x + draggingElement.width / 2,
            centerY: y + draggingElement.height / 2,
        };

        this.elements.forEach((element) => {
            if (element.id === draggingElement.id) return;

            // 다른 요소의 경계와 중심점 계산
            const elementBounds = {
                left: element.x,
                right: element.x + element.width,
                top: element.y,
                bottom: element.y + element.height,
                centerX: element.x + element.width / 2,
                centerY: element.y + element.height / 2,
            };

            // 수직 정렬 체크
            // 왼쪽 경계 정렬
            if (Math.abs(dragBounds.left - elementBounds.left) < this.snapThreshold) {
                snappedX = elementBounds.left;
                hasSnapped = true;
                guides.push({
                    type: "vertical",
                    position: elementBounds.left,
                    start: Math.min(dragBounds.top, elementBounds.top),
                    end: Math.max(dragBounds.bottom, elementBounds.bottom),
                });
            }
            // 중심 정렬
            else if (Math.abs(dragBounds.centerX - elementBounds.centerX) < this.snapThreshold) {
                snappedX = elementBounds.centerX - draggingElement.width / 2;
                hasSnapped = true;
                guides.push({
                    type: "vertical",
                    position: elementBounds.centerX,
                    start: Math.min(dragBounds.top, elementBounds.top),
                    end: Math.max(dragBounds.bottom, elementBounds.bottom),
                });
            }
            // 오른쪽 경계 정렬
            else if (Math.abs(dragBounds.right - elementBounds.right) < this.snapThreshold) {
                snappedX = elementBounds.right - draggingElement.width;
                hasSnapped = true;
                guides.push({
                    type: "vertical",
                    position: elementBounds.right,
                    start: Math.min(dragBounds.top, elementBounds.top),
                    end: Math.max(dragBounds.bottom, elementBounds.bottom),
                });
            }

            // 수평 정렬 체크
            // 상단 경계 정렬
            if (Math.abs(dragBounds.top - elementBounds.top) < this.snapThreshold) {
                snappedY = elementBounds.top;
                hasSnapped = true;
                guides.push({
                    type: "horizontal",
                    position: elementBounds.top,
                    start: Math.min(dragBounds.left, elementBounds.left),
                    end: Math.max(dragBounds.right, elementBounds.right),
                });
            }
            // 중심 정렬
            else if (Math.abs(dragBounds.centerY - elementBounds.centerY) < this.snapThreshold) {
                snappedY = elementBounds.centerY - draggingElement.height / 2;
                hasSnapped = true;
                guides.push({
                    type: "horizontal",
                    position: elementBounds.centerY,
                    start: Math.min(dragBounds.left, elementBounds.left),
                    end: Math.max(dragBounds.right, elementBounds.right),
                });
            }
            // 하단 경계 정렬
            else if (Math.abs(dragBounds.bottom - elementBounds.bottom) < this.snapThreshold) {
                snappedY = elementBounds.bottom - draggingElement.height;
                hasSnapped = true;
                guides.push({
                    type: "horizontal",
                    position: elementBounds.bottom,
                    start: Math.min(dragBounds.left, elementBounds.left),
                    end: Math.max(dragBounds.right, elementBounds.right),
                });
            }
        });

        if (!hasSnapped) {
            this.clearGuideLines();
        }

        return { x: snappedX, y: snappedY, guides };
    }

    // 가이드라인 제거를 위한 새로운 메서드
    clearGuideLines() {
        this.snapGuides.forEach((guide) => guide.remove());
        this.snapGuides = [];
    }

    // 가이드라인 업데이트 메서드
    updateGuideLines(guides) {
        // 새로운 가이드라인이 없으면 기존 가이드라인 유지
        if (guides.length === 0) {
            return;
        }

        // 기존 가이드라인 제거
        this.snapGuides.forEach((guide) => guide.remove());
        this.snapGuides = [];

        guides.forEach((guide) => {
            const guideElement = document.createElement("div");
            guideElement.className = "snap-guide";
            guideElement.style.position = "absolute";
            guideElement.style.backgroundColor = "#2E6FF2";
            guideElement.style.pointerEvents = "none";

            if (guide.type === "vertical") {
                guideElement.style.width = "1px";
                guideElement.style.left = `${guide.position}px`;
                guideElement.style.top = `${guide.start}px`;
                guideElement.style.height = `${guide.end - guide.start}px`;
            } else {
                guideElement.style.height = "1px";
                guideElement.style.top = `${guide.position}px`;
                guideElement.style.left = `${guide.start}px`;
                guideElement.style.width = `${guide.end - guide.start}px`;
            }

            document.getElementById("canvas").appendChild(guideElement);
            this.snapGuides.push(guideElement);
        });
    }

    selectElement(element, isMultiSelect = false) {
        if (!isMultiSelect) {
            this.clearSelection(); // 단일 선택 시 이전 선택을 모두 해제
        }

        this.selectedElement = element;
        this.selectedElements = [element]; // 단일 선택 시에도 배열에 추가

        const div = document.getElementById(`element-${element.id}`);
        div.classList.add("selected"); // 현재 요소에 'selected' 클래스 추가

        // 접근성을 위한 포커스 설정 (선택사항)
        div.setAttribute("tabindex", "0");

        this.updateProperties();
        this.updateLayersList();
        this.addResizeHandles(div); // 필요한 경우 리사이즈 핸들 추가
    }

    // 다중 선택을 위한 메서드
    addToSelection(element) {
        if (!this.selectedElements.find((el) => el.id === element.id)) {
            this.selectedElements.push(element);
            const div = document.getElementById(`element-${element.id}`);
            div.classList.add("selected");
            div.classList.add("multi-selected"); // 다중 선택 시각적 피드백
        }
    }

    removeFromSelection(element) {
        const index = this.selectedElements.findIndex((el) => el.id === element.id);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
            const div = document.getElementById(`element-${element.id}`);
            div.classList.remove("selected");
            div.classList.remove("multi-selected");
        }
    }

    addResizeHandles(elementDiv) {
        // 기존 핸들 제거
        elementDiv.querySelectorAll(".resize-handle").forEach((handle) => handle.remove());

        // 8방향 리사이즈 핸들 추가
        const positions = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];
        positions.forEach((pos) => {
            const handle = document.createElement("div");
            handle.className = `resize-handle ${pos}`;
            handle.addEventListener("mousedown", (e) => {
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
            y: element.y,
        };

        // 스케일을 고려한 시작 위치 저장
        this.startPos = {
            x: e.clientX / this.scale,
            y: e.clientY / this.scale,
        };

        const moveHandler = (e) => this.handleResize(e);
        const upHandler = () => {
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseup", upHandler);
            this.resizingElement = null;
            this.resizeHandle = null;
            this.saveHistory();
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
    }

    handleResize(e) {
        if (!this.resizingElement) return;

        // 스케일을 고려한 마우스 이동 거리 계산
        const dx = e.clientX / this.scale - this.startPos.x;
        const dy = e.clientY / this.scale - this.startPos.y;

        const canvas = document.getElementById("canvas");
        const canvasRect = canvas.getBoundingClientRect();
        const guides = [];

        // 초기 값 설정
        let newWidth = this.startSize.width;
        let newHeight = this.startSize.height;
        let newX = this.startSize.x;
        let newY = this.startSize.y;

        // 원본 비율
        const originalRatio = this.startSize.width / this.startSize.height;

        // 리사이즈 핸들 방향 분해
        const directions = this.resizeHandle.split("");

        // 각 방향별로 계산 수행
        directions.forEach((direction) => {
            switch (direction) {
                case "e":
                    newWidth = Math.max(50, this.startSize.width + dx);
                    if (e.shiftKey) {
                        newHeight = newWidth / originalRatio;
                    }
                    break;
                case "w":
                    const newWidthW = Math.max(50, this.startSize.width - dx);
                    const possibleX = this.startSize.x + (this.startSize.width - newWidthW);
                    newX = possibleX;
                    newWidth = newWidthW;
                    if (e.shiftKey) {
                        newHeight = newWidth / originalRatio;
                    }
                    break;
                case "s":
                    newHeight = Math.max(30, this.startSize.height + dy);
                    if (e.shiftKey) {
                        newWidth = newHeight * originalRatio;
                    }
                    break;
                case "n":
                    const newHeightN = Math.max(30, this.startSize.height - dy);
                    const possibleY = this.startSize.y + (this.startSize.height - newHeightN);
                    newY = possibleY;
                    newHeight = newHeightN;
                    if (e.shiftKey) {
                        newWidth = newHeight * originalRatio;
                    }
                    break;
            }
        });

        // 이미지 비율 유지 처리
        if (this.resizingElement.type === "image" && this.resizingElement.aspectRatio && !e.shiftKey) {
            if (directions.some((d) => ["e", "w"].includes(d))) {
                newHeight = newWidth / this.resizingElement.aspectRatio;
            } else if (directions.some((d) => ["n", "s"].includes(d))) {
                newWidth = newHeight * this.resizingElement.aspectRatio;
            }
        }

        // 삼각형 비율 유지 처리 (자유로운 크기 조정)
        if (this.resizingElement.type === "shape" && this.resizingElement.shapeType === "triangle") {
            // 삼각형은 자유롭게 크기 조정 (비율 제한 없음)
        }

        // 그리드 스냅 처리
        if (this.gridSize > 0) {
            newWidth = Math.round(newWidth / this.gridSize) * this.gridSize;
            newHeight = Math.round(newHeight / this.gridSize) * this.gridSize;
            newX = Math.round(newX / this.gridSize) * this.gridSize;
            newY = Math.round(newY / this.gridSize) * this.gridSize;
        }

        // 요소 업데이트
        Object.assign(this.resizingElement, {
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
        });

        const elementDiv = document.getElementById(`element-${this.resizingElement.id}`);
        Object.assign(elementDiv.style, {
            width: `${newWidth}px`,
            height: `${newHeight}px`,
            left: `${newX}px`,
            top: `${newY}px`,
        });

        // 삼각형인 경우 SVG 경로 업데이트
        if (this.resizingElement.type === "shape" && this.resizingElement.shapeType === "triangle") {
            const svg = elementDiv.querySelector("svg");
            if (svg) {
                const path = svg.querySelector("path");
                if (path) {
                    const centerX = newWidth / 2;
                    const topY = newHeight * 0.1;
                    const bottomY = newHeight * 0.9;
                    const leftX = newWidth * 0.1;
                    const rightX = newWidth * 0.9;
                    const pathData = `M${centerX},${topY} L${rightX},${bottomY} L${leftX},${bottomY} Z`;
                    path.setAttribute("d", pathData);
                }
            }
        }

        this.updateProperties();
    }

    updateProperties() {
        const propertiesDiv = document.getElementById("properties");

        if (!this.selectedElement) {
            propertiesDiv.innerHTML = "";
            return;
        } else {
            propertiesDiv.style.borderTop = "none";
        }

        const element = this.selectedElement;

        // border 제어가 가능한 요소 타입들
        const borderSupportedTypes = ["frame", "shape", "image", "text", "button", "table", "alert"];
        const showBorderControls = borderSupportedTypes.includes(element.type);

        // content 파트를 표시할 요소 타입들 (사용자가 직접 텍스트를 입력하는 요소들)
        const contentSupportedTypes = ["text", "button", "input", "alert", "sticky"];
        const showContentControls = contentSupportedTypes.includes(element.type);

        // text 파트를 표시할 요소 타입들 (텍스트 스타일링이 가능한 요소들)
        const textSupportedTypes = ["text", "button", "input", "alert", "sticky"];
        const showTextControls = textSupportedTypes.includes(element.type);

        // fill 파트를 표시할 요소 타입들 (메모, 선, 화살표, 아이콘, 입력, 알림 제외)
        const fillSupportedTypes = ["frame", "shape", "image", "text", "button", "table", "panel", "box", "link"];
        const showFillControls = fillSupportedTypes.includes(element.type) && !(element.type === "shape" && (element.shapeType === "line" || element.shapeType === "arrow"));

        propertiesDiv.innerHTML = `
            <div class="property-section">
                <div class="property-title">Type</div>
                <div class="property-type">${element.type}</div>
            </div>
            
            <div class="property-section">
                <div class="property-title">Position</div>
                <div class="coordinate-controls">
                    <div class="coordinate-input">
                        <label>X</label>
                        <input type="number" value="${Math.round(element.x || 0)}" 
                            onchange="tool.updateElementProperty('x', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'x', this)">
                    </div>
                    <div class="coordinate-input">
                        <label>Y</label>
                        <input type="number" value="${Math.round(element.y || 0)}"
                            onchange="tool.updateElementProperty('y', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'y', this)">
                    </div>
                </div>
                <div class="alignment-buttons">
                    <button class="alignment-button" onclick="tool.alignElement('top')">
                        <img src="./src/images/icon-align-top.svg" alt="맨 위">
                        맨 위
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('left')">
                        <img src="./src/images/icon-align-left.svg" alt="왼쪽">
                        왼쪽
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('center')">
                        <img src="./src/images/icon-align-center-horizontal.svg" alt="가운데">
                        가운데
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('middle')">
                        <img src="./src/images/icon-align-center-vertical.svg" alt="세로 가운데">
                        세로 가운데
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('bottom')">
                        <img src="./src/images/icon-align-bottom.svg" alt="맨 아래">
                        맨 아래
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('right')">
                        <img src="./src/images/icon-align-right.svg" alt="오른쪽">
                        오른쪽
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('vertical-distribute')">
                        <img src="./src/images/icon-distribute-vertical.svg" alt="세로 간격 맞춤">
                        세로 간격 맞춤
                    </button>
                    <button class="alignment-button" onclick="tool.alignElement('horizontal-distribute')">
                        <img src="./src/images/icon-distribute-horizontal.svg" alt="가로 간격 맞춤">
                        가로 간격 맞춤
                    </button>
                </div>
            </div>

            <div class="property-section">
                <div class="property-title">Z-index</div>
                    <div class="z-index-controls">
                        <button onclick="tool.moveToFront()">맨 앞으로</button>
                        <button onclick="tool.moveForward()">앞으로</button>
                        <button onclick="tool.moveBackward()">뒤로</button>
                        <button onclick="tool.moveToBack()">맨 뒤로</button>
                    </div>
            </div>
    
            <div class="property-section">
                <div class="property-title">Size</div>
                <div class="coordinate-controls">
                    <div class="coordinate-input">
                        <label>W</label>
                        <input type="number" value="${Math.round(element.width || 0)}"
                            onchange="tool.updateElementProperty('width', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'width', this)">
                    </div>
                    <div class="coordinate-input">
                        <label>H</label>
                        <input type="number" value="${Math.round(element.height || 0)}"
                            onchange="tool.updateElementProperty('height', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'height', this)">
                    </div>
                </div>
            </div>
    
            ${
                showContentControls
                    ? `
            <div class="property-section">
                <div class="property-title">
                    Content
                    <button class="copy-content-btn" onclick="tool.copyContentToClipboard('${element.content || ""}')" title="Copy content">
                        <img src="src/images/icon-copy.svg" alt="Copy" style="width: 14px; height: 14px;">
                    </button>
                </div>
                <div class="coordinate-input">
                    <span>${element.content || ""}</span>
                </div>
            </div>
            `
                    : ""
            }
            
            ${
                showFillControls
                    ? `
            <div class="property-section">
                <div class="property-title">Fill</div>
                <div class="color-control">
                    <div class="color-input">
                        <input type="color" class="color-picker" 
                            value="${this.getHexFromColor(
                                element.type === "shape"
                                    ? element.fill || "#D9D9D9"
                                    : element.backgroundColor || (element.type === "button" ? this.getButtonDefaultColor(element.buttonType) : "#FFFFFF")
                            )}"
                            oninput="tool.updateElementProperty('${element.type === "shape" ? "fill" : "backgroundColor"}', this.value)"
                            onchange="tool.updateElementProperty('${element.type === "shape" ? "fill" : "backgroundColor"}', this.value)">
                        <input type="text" class="color-value" 
                            value="${this.getHexFromColor(
                                element.type === "shape"
                                    ? element.fill || "#D9D9D9"
                                    : element.backgroundColor || (element.type === "button" ? this.getButtonDefaultColor(element.buttonType) : "#FFFFFF")
                            ).replace("#", "")}"
                            onchange="tool.updateElementProperty('${element.type === "shape" ? "fill" : "backgroundColor"}', '#' + this.value)">
                    </div>
                    <div class="opacity-control">
                        <input type="range" min="0" max="100" 
                            value="${Math.round((element.fillOpacity !== undefined ? element.fillOpacity : 1) * 100)}"
                            onchange="tool.updateElementProperty('fillOpacity', this.value / 100)">
                        <span class="opacity-value">${Math.round((element.fillOpacity !== undefined ? element.fillOpacity : 1) * 100)}%</span>
                    </div>
                </div>
            </div>
            `
                    : ""
            }
            
            ${
                showTextControls
                    ? `
            <div class="property-section">
                <div class="property-title">Text</div>
                <div class="color-control">
                    <div class="color-input">
                        <label class="ir">Color</label>
                        <input type="color" class="color-picker" 
                            value="${this.getHexFromColor(this.getActualTextColor(element))}"
                            oninput="tool.updateElementProperty('textColor', this.value)"
                            onchange="tool.updateElementProperty('textColor', this.value)">
                        <input type="text" class="color-value" 
                            value="${this.getHexFromColor(this.getActualTextColor(element)).replace("#", "")}"
                            onchange="tool.updateElementProperty('textColor', '#' + this.value)">
                    </div>
                </div>
                <div class="coordinate-controls">
                    <div class="coordinate-input">
                        <label class="font-size-label" >Size</label>
                        <input type="number" value="${element.fontSize || 14}" min="8" max="72"
                            onchange="tool.updateElementProperty('fontSize', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'fontSize', this)">
                    </div>
                </div>
                <div class="style-checkbox">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" class="hidden-checkbox" id="bold-checkbox" 
                            ${element.fontWeight === "bold" ? "checked" : ""}
                            onchange="tool.updateElementProperty('fontWeight', this.checked ? 'bold' : 'normal')">
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Bold</span>
                    </label>
                </div>
            </div>
            `
                    : ""
            }
            
            ${
                showBorderControls
                    ? `
            <div class="property-section">
                <div class="property-title">Stroke</div>
                ${
                    (element.borderWidth && element.borderWidth > 0) || (element.type === "shape" && (element.shapeType === "line" || element.shapeType === "arrow"))
                        ? `
                <div class="color-control">
                    <div class="color-input">
                        <input type="color" class="color-picker" 
                            value="${element.borderColor || "#000000"}"
                            oninput="tool.updateElementProperty('borderColor', this.value)"
                            onchange="tool.updateElementProperty('borderColor', this.value)">
                        <input type="text" class="color-value" 
                            value="${(element.borderColor || "#000000").replace("#", "")}"
                            onchange="tool.updateElementProperty('borderColor', '#' + this.value)">
                    </div>
                    <div class="stroke-controls">
                        <select class="stroke-select" 
                            onchange="tool.updateElementProperty('borderPosition', this.value)">
                            <option value="inside" ${element.borderPosition === "inside" ? "selected" : ""}>Inside</option>
                            <option value="center" ${element.borderPosition === "center" || !element.borderPosition ? "selected" : ""}>Center</option>
                            <option value="outside" ${element.borderPosition === "outside" ? "selected" : ""}>Outside</option>
                        </select>
                        <input type="number" class="stroke-width" 
                            value="${element.borderWidth || 1}" min="0"
                            onchange="tool.updateElementProperty('borderWidth', this.value)"
                            onkeydown="tool.handleNumberInputKeydown(event, 'borderWidth', this)">
                        <button class="stroke-remove-btn" onclick="tool.removeStroke()" title="Remove Stroke">
                            <img src="src/images/icon-X.svg" alt="Remove">
                        </button>
                    </div>
                </div>
                `
                        : `
                <div class="stroke-add-control">
                    <button class="stroke-add-btn" onclick="tool.addStroke()">
                        <img src="src/images/icon-+.svg" alt="Add Stroke">
                        <span>Add Stroke</span>
                    </button>
                </div>
                `
                }
            </div>
            `
                    : ""
            }
            

        `;
    }

    alignElement(position) {
        // 캔버스 영역의 실제 크기 계산
        const canvasArea = document.querySelector(".canvas-area");
        const canvasWidth = canvasArea.offsetWidth;
        const canvasHeight = canvasArea.offsetHeight;

        // 선택된 요소들 결정
        let elementsToAlign = [];
        if (this.selectedElements && this.selectedElements.length > 0) {
            elementsToAlign = this.selectedElements;
        } else if (this.selectedElement) {
            elementsToAlign = [this.selectedElement];
        }

        if (elementsToAlign.length === 0) return;

        switch (position) {
            case "top":
                elementsToAlign.forEach((element) => {
                    element.y = 0;
                    const elementDiv = document.getElementById(`element-${element.id}`);
                    if (elementDiv) {
                        elementDiv.style.top = `${element.y}px`;
                    }
                });
                break;
            case "bottom":
                elementsToAlign.forEach((element) => {
                    element.y = canvasHeight - element.height;
                    const elementDiv = document.getElementById(`element-${element.id}`);
                    if (elementDiv) {
                        elementDiv.style.top = `${element.y}px`;
                    }
                });
                break;
            case "left":
                elementsToAlign.forEach((element) => {
                    element.x = 0;
                    const elementDiv = document.getElementById(`element-${element.id}`);
                    if (elementDiv) {
                        elementDiv.style.left = `${element.x}px`;
                    }
                });
                break;
            case "right":
                elementsToAlign.forEach((element) => {
                    element.x = canvasWidth - element.width;
                    const elementDiv = document.getElementById(`element-${element.id}`);
                    if (elementDiv) {
                        elementDiv.style.left = `${element.x}px`;
                    }
                });
                break;
            case "center":
                if (elementsToAlign.length > 0) {
                    const firstElement = elementsToAlign[0];
                    const centerX = firstElement.x + firstElement.width / 2;

                    elementsToAlign.forEach((element) => {
                        element.x = centerX - element.width / 2;
                        const elementDiv = document.getElementById(`element-${element.id}`);
                        if (elementDiv) {
                            elementDiv.style.left = `${element.x}px`;
                        }
                    });
                }
                break;
            case "middle":
                if (elementsToAlign.length > 0) {
                    const firstElement = elementsToAlign[0];
                    const centerY = firstElement.y + firstElement.height / 2;

                    elementsToAlign.forEach((element) => {
                        element.y = centerY - element.height / 2;
                        const elementDiv = document.getElementById(`element-${element.id}`);
                        if (elementDiv) {
                            elementDiv.style.top = `${element.y}px`;
                        }
                    });
                }
                break;
            case "vertical-distribute":
                if (elementsToAlign.length > 1) {
                    // 세로로 정렬된 요소들을 균등하게 분배
                    const sortedElements = elementsToAlign.sort((a, b) => a.y - b.y);
                    const totalHeight = canvasHeight;
                    const spacing = totalHeight / (sortedElements.length + 1);

                    sortedElements.forEach((element, index) => {
                        element.y = spacing * (index + 1) - element.height / 2;
                        const elementDiv = document.getElementById(`element-${element.id}`);
                        if (elementDiv) {
                            elementDiv.style.top = `${element.y}px`;
                        }
                    });
                }
                break;
            case "horizontal-distribute":
                if (elementsToAlign.length > 1) {
                    // 가로로 정렬된 요소들을 균등하게 분배
                    const sortedElements = elementsToAlign.sort((a, b) => a.x - b.x);
                    const totalWidth = canvasWidth;
                    const spacing = totalWidth / (sortedElements.length + 1);

                    sortedElements.forEach((element, index) => {
                        element.x = spacing * (index + 1) - element.width / 2;
                        const elementDiv = document.getElementById(`element-${element.id}`);
                        if (elementDiv) {
                            elementDiv.style.left = `${element.x}px`;
                        }
                    });
                }
                break;
        }

        this.updateProperties();
        this.saveHistory();
    }

    moveToFront() {
        if (!this.selectedElement) return;
        this.maxZIndex++;
        this.selectedElement.zIndex = this.maxZIndex;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.zIndex = this.maxZIndex;
        this.saveHistory();
    }

    moveForward() {
        if (!this.selectedElement) return;
        const nextZIndex = Math.min(...this.elements.map((el) => (el.zIndex > this.selectedElement.zIndex ? el.zIndex : Infinity)));
        if (nextZIndex !== Infinity) {
            const elementToSwap = this.elements.find((el) => el.zIndex === nextZIndex);
            elementToSwap.zIndex = this.selectedElement.zIndex;
            this.selectedElement.zIndex = nextZIndex;

            const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
            const swapDiv = document.getElementById(`element-${elementToSwap.id}`);
            elementDiv.style.zIndex = nextZIndex;
            swapDiv.style.zIndex = elementToSwap.zIndex;
            this.saveHistory();
        }
    }

    moveBackward() {
        if (!this.selectedElement) return;
        const prevZIndex = Math.max(...this.elements.map((el) => (el.zIndex < this.selectedElement.zIndex ? el.zIndex : -Infinity)));
        if (prevZIndex !== -Infinity) {
            const elementToSwap = this.elements.find((el) => el.zIndex === prevZIndex);
            elementToSwap.zIndex = this.selectedElement.zIndex;
            this.selectedElement.zIndex = prevZIndex;

            const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
            const swapDiv = document.getElementById(`element-${elementToSwap.id}`);
            elementDiv.style.zIndex = prevZIndex;
            swapDiv.style.zIndex = elementToSwap.zIndex;
            this.saveHistory();
        }
    }

    moveToBack() {
        if (!this.selectedElement) return;
        const minZIndex = Math.min(...this.elements.map((el) => el.zIndex));
        this.selectedElement.zIndex = minZIndex - 1;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.zIndex = minZIndex - 1;
        this.saveHistory();
    }

    applyBorderStyle(element, elementDiv) {
        const borderWidth = element.borderWidth || 1;
        const borderColor = element.borderColor || "#000000";
        const position = element.borderPosition || "center";

        // 선과 화살표는 border를 적용하지 않음
        if (element.type === "shape" && (element.shapeType === "line" || element.shapeType === "arrow")) {
            elementDiv.style.borderWidth = "0px";
            elementDiv.style.borderStyle = "none";
            elementDiv.style.borderColor = "transparent";
            elementDiv.style.margin = "0";
            return;
        }

        // 원형 도형은 메인 요소에 border를 적용하지 않음
        if (element.type === "shape" && element.shapeType === "circle") {
            elementDiv.style.borderWidth = "0px";
            elementDiv.style.borderStyle = "none";
            elementDiv.style.borderColor = "transparent";
            elementDiv.style.margin = "0";
            return;
        }

        // 버튼은 border가 추가되어도 크기가 변하지 않도록 처리
        if (element.type === "button") {
            elementDiv.style.borderWidth = `${borderWidth}px`;
            elementDiv.style.borderStyle = "solid";
            elementDiv.style.borderColor = borderColor;
            elementDiv.style.boxSizing = "border-box";
            elementDiv.style.margin = "0";
            return;
        }

        // 테두리 스타일 설정
        elementDiv.style.borderWidth = `${borderWidth}px`;
        elementDiv.style.borderStyle = "solid";
        elementDiv.style.borderColor = borderColor;

        // position에 따른 스타일 적용
        switch (position) {
            case "inside":
                elementDiv.style.boxSizing = "border-box";
                elementDiv.style.margin = "0";
                break;

            case "center":
                elementDiv.style.boxSizing = "content-box";
                elementDiv.style.margin = `-${borderWidth / 2}px`;
                break;

            case "outside":
                elementDiv.style.boxSizing = "content-box";
                elementDiv.style.margin = `-${borderWidth}px`;
                break;
        }

        // 요소의 실제 크기와 위치 정보 업데이트
        element.width = parseFloat(elementDiv.style.width);
        element.height = parseFloat(elementDiv.style.height);
    }

    updateXMark(element, elementDiv) {
        const existingSvg = elementDiv.querySelector("svg");
        if (existingSvg) {
            existingSvg.remove();
        }

        if (element.showX) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.style.position = "absolute";
            svg.style.top = "0";
            svg.style.left = "0";
            svg.style.pointerEvents = "none";

            // 첫 번째 대각선 (좌상단 → 우하단)
            const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line1.setAttribute("x1", "0");
            line1.setAttribute("y1", "0");
            line1.setAttribute("x2", "100%");
            line1.setAttribute("y2", "100%");
            line1.setAttribute("stroke", element.borderColor || "#000000");
            line1.setAttribute("stroke-width", "1");

            // 두 번째 대각선 (우상단 → 좌하단)
            const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line2.setAttribute("x1", "100%");
            line2.setAttribute("y1", "0");
            line2.setAttribute("x2", "0");
            line2.setAttribute("y2", "100%");
            line2.setAttribute("stroke", element.borderColor || "#000000");
            line2.setAttribute("stroke-width", "1");

            svg.appendChild(line1);
            svg.appendChild(line2);
            elementDiv.appendChild(svg);
        }
    }

    // 테이블 구조 업데이트 메서드
    updateTableStructure(value, type) {
        if (!this.selectedElement || this.selectedElement.type !== "table") return;

        const newValue = parseInt(value);
        if (isNaN(newValue) || newValue < 1) return;

        const element = this.selectedElement;

        // 기존 데이터를 복사
        const oldData = JSON.parse(JSON.stringify(element.data));
        let newData = [];

        if (type === "rows") {
            element.rows = newValue;
            // 행 수 조정
            for (let i = 0; i < newValue; i++) {
                if (i < oldData.length) {
                    // 기존 행 유지
                    newData.push(oldData[i]);
                } else {
                    // 새 행 추가
                    const newRow = [];
                    for (let j = 0; j < element.cols; j++) {
                        newRow.push(`Cell ${i},${j + 1}`);
                    }
                    newData.push(newRow);
                }
            }
        } else if (type === "cols") {
            element.cols = newValue;
            // 열 수 조정
            for (let i = 0; i < element.rows; i++) {
                const newRow = [];
                const oldRow = oldData[i] || [];

                for (let j = 0; j < newValue; j++) {
                    if (j < oldRow.length) {
                        // 기존 열 데이터 유지
                        newRow.push(oldRow[j]);
                    } else {
                        // 새 열 데이터 추가
                        newRow.push(i === 0 ? `Header ${j + 1}` : `Cell ${i},${j + 1}`);
                    }
                }
                newData.push(newRow);
            }
        }

        // 새 데이터로 업데이트
        element.data = newData;

        // 테이블 재렌더링
        const elementDiv = document.getElementById(`element-${element.id}`);
        if (elementDiv) {
            const oldContainer = elementDiv.querySelector(".table-container");
            if (oldContainer) {
                elementDiv.removeChild(oldContainer);
            }

            // 테이블 컨테이너 새로 생성
            const container = document.createElement("div");
            container.className = "table-container";
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.overflow = "auto";

            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = `${element.fontSize}px`;
            table.style.color = element.textColor;

            element.data.forEach((rowData, i) => {
                const row = document.createElement("tr");
                rowData.forEach((cellData, j) => {
                    const cell = document.createElement(i === 0 ? "th" : "td");
                    cell.textContent = cellData;
                    cell.style.padding = `${element.cellPadding}px`;
                    cell.style.border = `1px solid ${element.borderColor}`;
                    cell.style.backgroundColor = i === 0 ? element.headerBgColor : element.cellBgColor;
                    cell.style.fontWeight = i === 0 ? element.headerFontWeight : element.cellFontWeight;

                    // 셀 편집 이벤트 리스너 추가
                    cell.addEventListener("dblclick", (e) => {
                        if (!this.previewMode) {
                            e.stopPropagation();
                            this.startEditingTableCell(element, i, j, e.target);
                        }
                    });

                    row.appendChild(cell);
                });
                table.appendChild(row);
            });

            container.appendChild(table);
            elementDiv.appendChild(container);
        }

        this.saveHistory();
        this.updateProperties();
    }

    // 테이블 스타일 업데이트 메서드
    updateTableStyle(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== "table") return;

        const element = this.selectedElement;

        // 숫자 값에 대한 처리
        if (["cellPadding", "fontSize"].includes(property)) {
            element[property] = parseInt(value);
        } else {
            element[property] = value;
        }

        // 테이블 직접 업데이트
        const elementDiv = document.getElementById(`element-${element.id}`);
        if (elementDiv) {
            const table = elementDiv.querySelector("table");
            if (table) {
                // 테이블 전체 스타일 업데이트
                if (property === "fontSize") {
                    table.style.fontSize = `${value}px`;
                } else if (property === "textColor") {
                    table.style.color = value;
                }

                // 셀별 스타일 업데이트
                const cells = table.querySelectorAll("th, td");
                cells.forEach((cell, index) => {
                    const isHeader = cell.tagName.toLowerCase() === "th";

                    switch (property) {
                        case "cellPadding":
                            cell.style.padding = `${value}px`;
                            break;
                        case "borderColor":
                            cell.style.border = "none";
                            break;
                        case "headerBgColor":
                            if (isHeader) {
                                cell.style.backgroundColor = value;
                            }
                            break;
                        case "cellBgColor":
                            if (!isHeader) {
                                cell.style.backgroundColor = value;
                            }
                            break;
                    }
                });
            }
        }

        this.saveHistory();
        this.updateProperties();
    }

    // PrototypingTool 클래스에 추가
    updateIconProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== "icon") return;

        this.selectedElement[property] = value;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);

        switch (property) {
            case "content":
                element.content = value;

                // 아이콘 변경
                if (element.type === "icon") {
                    const iconPath = this.iconPaths[value];
                    if (iconPath) {
                        const wrapper = elementDiv.querySelector(".icon-wrapper");
                        wrapper.innerHTML = "";
                        const img = document.createElement("img");
                        img.src = iconPath;
                        img.style.width = "100%";
                        img.style.height = "100%";
                        img.style.objectFit = "contain";
                        img.style.filter = this.selectedElement.iconColor ? `brightness(0) saturate(100%) ${this.selectedElement.iconColor}` : "";

                        // 화살표와 꺽쇠 아이콘에 대한 방향 적용
                        if (value === "arrow-down") {
                            img.style.transform = "rotate(180deg)";
                        } else if (value === "anglebracket-close") {
                            img.style.transform = "rotate(180deg)";
                        }

                        wrapper.appendChild(img);
                    }
                }
                // 텍스트 요소인 경우 실시간으로 텍스트 업데이트
                else if (element.type === "text") {
                    elementDiv.textContent = value;
                }
                // 버튼 요소인 경우 실시간으로 텍스트 업데이트
                else if (element.type === "button") {
                    const buttonText = elementDiv.querySelector("div");
                    if (buttonText) {
                        buttonText.textContent = value;
                    }
                }
                // 알림 요소인 경우 실시간으로 텍스트 업데이트
                else if (element.type === "alert") {
                    const alertText = elementDiv.querySelector(".alert-text");
                    if (alertText) {
                        alertText.textContent = value;
                    }
                }
                // 메모 요소인 경우 실시간으로 텍스트 업데이트
                else if (element.type === "sticky") {
                    const stickyText = elementDiv.querySelector(".sticky-content");
                    if (stickyText) {
                        stickyText.textContent = value;
                    }
                }
                break;

            case "iconColor":
                // 색상 변경
                const img = elementDiv.querySelector("img");
                if (img) {
                    img.style.filter = value ? `brightness(0) saturate(100%) ${value}` : "";
                }
                break;
        }

        this.saveHistory();
        this.updateProperties();
    }

    updateInputProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== "input") return;

        this.selectedElement[property] = value;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);

        switch (property) {
            case "label":
                const label = elementDiv.querySelector("label");
                if (label) label.textContent = value;
                break;

            case "errorMessage":
                if (this.selectedElement.inputType === "error") {
                    const errorMessage = elementDiv.querySelector(".error-message");
                    if (errorMessage) errorMessage.textContent = value;
                }
                break;

            case "buttonText":
                if (this.selectedElement.inputType === "button-include") {
                    const button = elementDiv.querySelector("button");
                    if (button) button.textContent = value;
                }
                break;
        }

        this.saveHistory();
    }

    // 아이콘 크기 조절을 위한 메서드도 추가
    updateIconSize(size) {
        if (!this.selectedElement || this.selectedElement.type !== "icon") return;

        const newSize = parseInt(size);
        this.selectedElement.width = newSize;
        this.selectedElement.height = newSize;

        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.width = `${newSize}px`;
        elementDiv.style.height = `${newSize}px`;

        this.saveHistory();
        this.updateProperties();
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
        const handlers = {
            panel: "updatePanelColor",
            box: "updateBoxStyle",
        };

        // 현재 선택된 요소의 타입에 따라 적절한 핸들러 선택
        const handler = handlers[this.selectedElement.type] || "updateElementProperty";

        return `
            <div class="color-control">
                <label>${label}</label>
                <input type="color" 
                    value="${value || "#ffffff"}"
                    onchange="tool.${handler}('${property}', this.value)">
            </div>
        `;
    }

    createNumberInputs(values) {
        return Object.entries(values)
            .map(
                ([key, value]) => `
                <input type="number" 
                    class="property-input" 
                    value="${value}"
                    onchange="tool.updateElementProperty('${key}', this.value)"
                    onkeydown="tool.handleNumberInputKeydown(event, '${key}', this)">
            `
            )
            .join("");
    }

    handleNumberInputKeydown(event, property, inputElement) {
        // 화살표 키 이벤트 처리
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault(); // 기본 동작 방지
            event.stopPropagation(); // 이벤트 전파 차단

            // 현재 포커스된 요소가 전달된 inputElement와 같은지 확인
            if (document.activeElement !== inputElement) {
                return;
            }

            const currentValue = parseInt(inputElement.value) || 0;
            const newValue = event.key === "ArrowUp" ? currentValue + 1 : currentValue - 1;

            // 입력 필드 값 업데이트
            inputElement.value = newValue;

            // 요소 속성만 직접 업데이트 (프로퍼티 패널 재렌더링 방지)
            if (this.selectedElement) {
                const element = this.selectedElement;
                const elementDiv = document.getElementById(`element-${element.id}`);

                // 요소 속성 업데이트
                element[property] = newValue;

                // DOM 업데이트
                if (property === "x") elementDiv.style.left = `${newValue}px`;
                if (property === "y") elementDiv.style.top = `${newValue}px`;
                if (property === "width") elementDiv.style.width = `${newValue}px`;
                if (property === "height") elementDiv.style.height = `${newValue}px`;
                if (property === "borderWidth") {
                    // 선과 화살표의 경우 두께 직접 적용
                    if (element.type === "shape") {
                        if (element.shapeType === "line") {
                            // innerContainer 안의 첫 번째 div (라인 요소)를 찾아서 height 설정
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const lineElement = innerContainer.querySelector("div");
                                if (lineElement) {
                                    lineElement.style.height = `${newValue}px`;
                                }
                            }
                        } else if (element.shapeType === "arrow") {
                            // innerContainer 안의 화살표 요소들을 찾아서 두께 설정
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const arrowLine = innerContainer.querySelector("div:first-child");
                                const arrowHead = innerContainer.querySelector("div:last-child");
                                if (arrowLine) {
                                    arrowLine.style.height = `${newValue}px`;
                                }
                                if (arrowHead) {
                                    // 화살표 머리 크기도 두께에 비례하여 조정
                                    const headSize = Math.max(6, newValue * 2);
                                    arrowHead.style.borderTop = `${headSize}px solid transparent`;
                                    arrowHead.style.borderBottom = `${headSize}px solid transparent`;
                                    arrowHead.style.borderLeft = `${headSize * 1.5}px solid ${element.borderColor || "#000000"}`;
                                }
                            }
                        }
                    }
                    this.applyBorderStyle(element, elementDiv);
                }
                if (property === "fontSize") elementDiv.style.fontSize = `${newValue}px`;
                if (property === "borderColor") {
                    // 선과 화살표의 경우 색상 직접 적용
                    if (element.type === "shape") {
                        if (element.shapeType === "line") {
                            // innerContainer 안의 첫 번째 div (라인 요소)를 찾아서 색상 설정
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const lineElement = innerContainer.querySelector("div");
                                if (lineElement) {
                                    lineElement.style.backgroundColor = newValue;
                                }
                            }
                        } else if (element.shapeType === "arrow") {
                            // innerContainer 안의 화살표 요소들을 찾아서 색상 설정
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const arrowLine = innerContainer.querySelector("div:first-child");
                                const arrowHead = innerContainer.querySelector("div:last-child");
                                if (arrowLine) {
                                    arrowLine.style.backgroundColor = newValue;
                                }
                                if (arrowHead) {
                                    const currentBorderLeft = arrowHead.style.borderLeft;
                                    const newBorderLeft = currentBorderLeft.replace(/solid #[0-9a-fA-F]{6}/, `solid ${newValue}`);
                                    arrowHead.style.borderLeft = newBorderLeft;
                                }
                            }
                        } else if (element.shapeType === "circle") {
                            // 원형인 경우 자식 div의 border 색상 변경
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const circleDiv = innerContainer.querySelector("div");
                                if (circleDiv && element.borderWidth && element.borderWidth > 0) {
                                    circleDiv.style.border = `${element.borderWidth}px solid ${newValue}`;
                                }
                            }
                        }
                    }
                }
                if (property === "backgroundColor") {
                    // 배경색 업데이트 - updateElementProperty와 동일한 로직 적용
                    if (element.type === "table") {
                        const table = elementDiv.querySelector("table");
                        if (table) {
                            const headerCells = table.querySelectorAll("th");
                            headerCells.forEach((cell) => {
                                cell.style.backgroundColor = newValue;
                            });
                        }
                    } else if (element.type === "panel") {
                        const panelContent = elementDiv.querySelector(".panel-content");
                        if (panelContent) {
                            panelContent.style.backgroundColor = newValue;
                        }
                    } else if (element.type === "shape") {
                        if (element.shapeType === "circle") {
                            // 원형인 경우 자식 div의 배경색 변경
                            const innerContainer = elementDiv.querySelector("div > div");
                            if (innerContainer) {
                                const circleDiv = innerContainer.querySelector("div");
                                if (circleDiv) {
                                    circleDiv.style.backgroundColor = newValue;
                                }
                            }
                        } else if (element.shapeType === "triangle") {
                            const svg = elementDiv.querySelector("svg");
                            if (svg) {
                                const path = svg.querySelector("path");
                                if (path) {
                                    path.setAttribute("fill", newValue);
                                }
                            }
                        } else {
                            elementDiv.style.backgroundColor = newValue;
                        }
                    } else {
                        elementDiv.style.backgroundColor = newValue;
                    }
                }

                // 히스토리 저장
                this.saveHistory();
            }
        }
    }

    createAlignButton(align, element) {
        const icons = {
            start: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" /></svg>',
            center: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>',
            end: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>',
        };

        return `
            <button 
                class="style-button ${element.textAlign === align ? "active" : ""}"
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
                        onkeydown="tool.handleNumberInputKeydown(event, 'fontSize', this)"
                        class="font-size-input">
                    <span>px</span>
                </div>
            </div>
        `;
    }

    updateTextAlign(align) {
        if (!this.selectedElement || this.selectedElement.type !== "text") return;

        this.selectedElement.justifyContent = align;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            elementDiv.style.justifyContent = align;
            // 편집 중인 경우에도 적용
            const editableDiv = elementDiv.querySelector(".editable-text");
            if (editableDiv) {
                editableDiv.style.justifyContent = align;
            }
        }

        this.updateProperties();
        this.saveHistory();
    }

    updateLinkTarget(pageId) {
        if (!this.selectedElement || this.selectedElement.type !== "link") return;

        // pageId를 숫자로 변환 (select의 value는 문자열로 전달됨)
        const targetPageId = pageId ? parseInt(pageId) : null;
        this.selectedElement.targetPageId = targetPageId;

        // content 업데이트
        if (targetPageId && this.pages.has(targetPageId)) {
            this.selectedElement.content = `🔗 Go to: ${this.pages.get(targetPageId).name}`;
        } else {
            this.selectedElement.content = "🔗 Click to set target page";
        }

        // DOM 업데이트
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        if (elementDiv) {
            const linkContent = elementDiv.querySelector(".link-content");
            if (linkContent) {
                linkContent.textContent = this.selectedElement.content;
            }
        }

        this.saveHistory();
    }

    // 미리보기 모드 토글
    togglePreviewMode() {
        this.previewMode = !this.previewMode;
        document.body.classList.toggle("preview-mode", this.previewMode);

        const previewButton = document.querySelector('.toolbar button[title="Toggle Preview Mode"]');
        if (previewButton) {
            previewButton.textContent = this.previewMode ? "✏️ Edit" : "👁️ Preview";
        }

        if (this.previewMode) {
            this.clearSelection();
        }
    }

    updateStickyStyle(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== "sticky") return;

        this.selectedElement[property] = property === "opacity" ? parseFloat(value) : parseInt(value);

        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        const contentDiv = elementDiv.querySelector(".sticky-content");

        switch (property) {
            case "opacity":
                elementDiv.style.opacity = value;
                this.updateProperties(); // 퍼센트 표시 업데이트
                break;
            case "fontSize":
                contentDiv.style.fontSize = `${value}px`;
                break;
        }

        this.saveHistory();
    }

    updateBoxStyle(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== "box") return;

        const processedValue = property === "radius" ? parseInt(value) : value;
        this.selectedElement[property] = processedValue;

        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        const innerContainer = elementDiv.children[0]; // 내부 컨테이너 참조

        switch (property) {
            case "backgroundColor":
                innerContainer.style.backgroundColor = value;
                break;

            case "borderColor":
                innerContainer.style.borderColor = value;
                const lines = elementDiv.querySelectorAll("line");
                lines.forEach((line) => line.setAttribute("stroke", value));
                break;

            case "showX":
                const placeholder = elementDiv.querySelector(".box-placeholder");
                if (placeholder) {
                    placeholder.classList.toggle("hide-x", !value);
                }
                break;

            case "radius":
                innerContainer.style.borderRadius = `${processedValue}px`;
                break;
        }

        this.saveHistory();
        this.updateProperties();
    }

    updateStickyColor(color) {
        if (!this.selectedElement || this.selectedElement.type !== "sticky") return;

        this.selectedElement.stickyColor = color;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.backgroundColor = color;

        this.updateProperties();
        this.saveHistory();
    }

    updatePanelColor(colorType, value) {
        if (!this.selectedElement || this.selectedElement.type !== "panel") return;

        this.selectedElement[colorType] = value;
        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);

        switch (colorType) {
            case "backgroundColor":
                elementDiv.style.backgroundColor = value;
                elementDiv.querySelector(".panel-content").style.backgroundColor = value;
                break;
            case "borderColor":
                elementDiv.style.borderColor = value;
                elementDiv.querySelector(".panel-header").style.borderBottomColor = value;
                break;
            case "headerColor":
                elementDiv.querySelector(".panel-header").style.backgroundColor = value;
                break;
        }

        this.saveHistory();
    }

    addStroke() {
        if (this.selectedElement) {
            // stroke가 없는 요소에 stroke를 처음 추가할 때 기본값 설정
            if (!this.selectedElement.borderWidth || this.selectedElement.borderWidth === 0) {
                this.updateElementProperty("borderWidth", 1);
                this.updateElementProperty("borderColor", "#000000");
                this.updateElementProperty("borderPosition", "center");
            }

            // 프로퍼티 패널 업데이트
            this.updateProperties();
        }
    }

    removeStroke() {
        if (this.selectedElement) {
            // stroke 값 제거
            this.updateElementProperty("borderWidth", 0);
            this.updateElementProperty("borderColor", "transparent");

            // 프로퍼티 패널 업데이트
            this.updateProperties();
        }
    }

    updateElementProperty(property, value) {
        if (!this.selectedElement) return;

        const element = this.selectedElement;
        const elementDiv = document.getElementById(`element-${element.id}`);

        switch (property) {
            case "fillOpacity":
                element.fillOpacity = parseFloat(value);
                // DOM만 업데이트, element 속성은 원본 HEX 값 유지
                if (element.type === "shape") {
                    const fillWithAlpha = this.setAlphaToColor(element.fill || "#D9D9D9", element.fillOpacity);
                    if (element.shapeType === "square") {
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            innerContainer.style.backgroundColor = fillWithAlpha;
                        }
                    } else if (element.shapeType === "circle") {
                        const circleDiv = elementDiv.querySelector("div[style*='border-radius: 50%']");
                        if (circleDiv) {
                            circleDiv.style.backgroundColor = fillWithAlpha;
                        }
                    } else if (element.shapeType === "triangle") {
                        const svg = elementDiv.querySelector("svg");
                        if (svg) {
                            const path = svg.querySelector("path");
                            if (path) {
                                path.setAttribute("fill", fillWithAlpha);
                            }
                        }
                    }
                } else if (element.type === "sticky") {
                    const stickyColorWithAlpha = this.setAlphaToColor(element.stickyColor || "#fff740", element.fillOpacity);
                    elementDiv.style.backgroundColor = stickyColorWithAlpha;
                } else {
                    const backgroundColorWithAlpha = this.setAlphaToColor(element.backgroundColor || "#FFFFFF", element.fillOpacity);
                    elementDiv.style.backgroundColor = backgroundColorWithAlpha;
                }
                break;
            case "fill":
                element.fill = value; // 원본 HEX 값 저장
                const fillWithAlpha = element.fillOpacity !== undefined ? this.setAlphaToColor(value, element.fillOpacity) : value;

                // 도형인 경우 shapeType에 따라 처리
                if (element.type === "shape") {
                    if (element.shapeType === "square") {
                        // 정사각형인 경우 innerContainer의 배경색 변경
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            innerContainer.style.backgroundColor = fillWithAlpha;
                        }
                    } else if (element.shapeType === "circle") {
                        // 원형인 경우 border-radius: 50%를 가진 자식 div의 배경색 변경
                        const circleDiv = elementDiv.querySelector("div[style*='border-radius: 50%']");
                        if (circleDiv) {
                            circleDiv.style.backgroundColor = fillWithAlpha;
                        }
                    } else if (element.shapeType === "triangle") {
                        // 삼각형인 경우 SVG fill 색상 업데이트
                        const svg = elementDiv.querySelector("svg");
                        if (svg) {
                            const path = svg.querySelector("path");
                            if (path) {
                                path.setAttribute("fill", fillWithAlpha);
                            }
                        }
                    }
                }
                break;

            case "backgroundColor":
                element.backgroundColor = value; // 원본 HEX 값 저장
                const backgroundColorWithAlpha = element.fillOpacity !== undefined ? this.setAlphaToColor(value, element.fillOpacity) : value;

                // 테이블인 경우 제목 행에만 배경색 적용
                if (element.type === "table") {
                    const table = elementDiv.querySelector("table");
                    if (table) {
                        const headerCells = table.querySelectorAll("th");
                        headerCells.forEach((cell) => {
                            cell.style.backgroundColor = backgroundColorWithAlpha;
                        });
                    }
                } else if (element.type === "panel") {
                    // 패널인 경우 패널 내용 부분에만 배경색 적용
                    const panelContent = elementDiv.querySelector(".panel-content");
                    if (panelContent) {
                        panelContent.style.backgroundColor = backgroundColorWithAlpha;
                    }
                } else if (element.type === "shape") {
                    // 도형인 경우 shapeType에 따라 처리
                    if (element.shapeType === "circle") {
                        // 원형인 경우 border-radius: 50%를 가진 자식 div의 배경색 변경
                        const circleDiv = elementDiv.querySelector("div[style*='border-radius: 50%']");
                        if (circleDiv) {
                            circleDiv.style.backgroundColor = backgroundColorWithAlpha;
                        }
                    } else if (element.shapeType === "triangle") {
                        // 삼각형인 경우 SVG fill 색상 업데이트
                        const svg = elementDiv.querySelector("svg");
                        if (svg) {
                            const path = svg.querySelector("path");
                            if (path) {
                                path.setAttribute("fill", backgroundColorWithAlpha);
                            }
                        }
                    } else if (element.shapeType === "circle") {
                        // 원형인 경우 자식 div의 배경색 변경
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const circleDiv = innerContainer.querySelector("div");
                            if (circleDiv) {
                                circleDiv.style.backgroundColor = backgroundColorWithAlpha;
                            }
                        }
                    } else {
                        // 다른 도형들은 기본 처리
                        elementDiv.style.backgroundColor = backgroundColorWithAlpha;
                    }
                } else if (element.type === "button") {
                    // 버튼인 경우 배경색 적용
                    elementDiv.style.backgroundColor = backgroundColorWithAlpha;
                } else {
                    // 기타 요소들은 기본 처리
                    elementDiv.style.backgroundColor = backgroundColorWithAlpha;
                }
                break;

            case "stickyColor":
                element.stickyColor = value; // 원본 HEX 값 저장
                const stickyColorWithAlpha = element.fillOpacity !== undefined ? this.setAlphaToColor(value, element.fillOpacity) : value;
                elementDiv.style.backgroundColor = stickyColorWithAlpha;
                break;
            case "textColor":
                element.textColor = value;
                if (element.type === "text") {
                    elementDiv.style.color = value;
                } else if (element.type === "button") {
                    elementDiv.style.color = value;
                } else if (element.type === "input") {
                    const input = elementDiv.querySelector("input");
                    if (input) {
                        input.style.color = value;
                    }
                } else if (element.type === "alert") {
                    const messageText = elementDiv.querySelector("span");
                    if (messageText) {
                        messageText.style.color = value;
                    }
                } else if (element.type === "sticky") {
                    const content = elementDiv.querySelector(".sticky-content");
                    if (content) {
                        content.style.color = value;
                    }
                }
                break;
            case "fontSize":
                element.fontSize = parseInt(value);
                if (element.type === "text") {
                    elementDiv.style.fontSize = `${value}px`;
                } else if (element.type === "button") {
                    elementDiv.style.fontSize = `${value}px`;
                } else if (element.type === "input") {
                    const input = elementDiv.querySelector("input");
                    if (input) {
                        input.style.fontSize = `${value}px`;
                    }
                } else if (element.type === "alert") {
                    const messageText = elementDiv.querySelector("span");
                    if (messageText) {
                        messageText.style.fontSize = `${value}px`;
                    }
                } else if (element.type === "sticky") {
                    const content = elementDiv.querySelector(".sticky-content");
                    if (content) {
                        content.style.fontSize = `${value}px`;
                    }
                }
                break;
            case "fontWeight":
                element.fontWeight = value;
                if (element.type === "text") {
                    elementDiv.style.fontWeight = value;
                } else if (element.type === "button") {
                    elementDiv.style.fontWeight = value;
                } else if (element.type === "input") {
                    const input = elementDiv.querySelector("input");
                    if (input) {
                        input.style.fontWeight = value;
                    }
                } else if (element.type === "alert") {
                    const messageText = elementDiv.querySelector("span");
                    if (messageText) {
                        messageText.style.fontWeight = value;
                    }
                } else if (element.type === "sticky") {
                    const content = elementDiv.querySelector(".sticky-content");
                    if (content) {
                        content.style.fontWeight = value;
                    }
                }
                break;
            case "borderColor":
                element.borderColor = value;
                elementDiv.style.borderColor = value;

                // 선과 화살표의 경우 색상 직접 적용
                if (element.type === "shape") {
                    if (element.shapeType === "line") {
                        // innerContainer 안의 첫 번째 div (라인 요소)를 찾아서 색상 설정
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const lineElement = innerContainer.querySelector("div");
                            if (lineElement) {
                                lineElement.style.backgroundColor = value;
                            }
                        }
                    } else if (element.shapeType === "arrow") {
                        // innerContainer 안의 화살표 요소들을 찾아서 색상 설정
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const arrowLine = innerContainer.querySelector("div:first-child");
                            const arrowHead = innerContainer.querySelector("div:last-child");
                            if (arrowLine) {
                                arrowLine.style.backgroundColor = value;
                            }
                            if (arrowHead) {
                                // 현재 borderLeft 값을 가져와서 색상만 변경
                                const currentBorderLeft = arrowHead.style.borderLeft;
                                const newBorderLeft = currentBorderLeft.replace(/solid #[0-9a-fA-F]{6}/, `solid ${value}`);
                                arrowHead.style.borderLeft = newBorderLeft;
                            }
                        }
                    } else if (element.shapeType === "circle") {
                        // 원형인 경우 fill이 적용되는 내부 div의 border 색상만 변경
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const circleDiv = innerContainer.querySelector("div");
                            if (circleDiv && element.borderWidth && element.borderWidth > 0) {
                                circleDiv.style.border = `${element.borderWidth}px solid ${value}`;
                            }
                        }
                    }
                }

                // X 표시가 있는 경우 X 표시의 색상도 업데이트
                const svg = elementDiv.querySelector("svg");
                if (svg) {
                    const lines = svg.querySelectorAll("line");
                    lines.forEach((line) => line.setAttribute("stroke", value));
                    // 삼각형인 경우 SVG stroke 색상 업데이트
                    if (element.type === "shape" && element.shapeType === "triangle") {
                        const path = svg.querySelector("path");
                        if (path) {
                            path.setAttribute("stroke", value);
                            // borderWidth가 0이면 stroke를 none으로 설정
                            if (element.borderWidth === 0) {
                                path.setAttribute("stroke", "none");
                            }
                        }
                    }
                }
                // 원형 요소는 applyBorderStyle을 호출하지 않음 (이미 처리됨)
                if (!(element.type === "shape" && element.shapeType === "circle")) {
                    this.applyBorderStyle(element, elementDiv);
                }
                break;

            case "borderPosition":
                element.borderPosition = value;
                this.applyBorderStyle(element, elementDiv);
                break;

            case "borderWidth":
                element.borderWidth = parseInt(value);

                // 선과 화살표의 경우 두께 직접 적용
                if (element.type === "shape") {
                    if (element.shapeType === "line") {
                        // innerContainer 안의 첫 번째 div (라인 요소)를 찾아서 height 설정
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const lineElement = innerContainer.querySelector("div");
                            if (lineElement) {
                                lineElement.style.height = `${value}px`;
                            }
                        }
                    } else if (element.shapeType === "arrow") {
                        // innerContainer 안의 화살표 요소들을 찾아서 두께 설정
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const arrowLine = innerContainer.querySelector("div:first-child");
                            const arrowHead = innerContainer.querySelector("div:last-child");
                            if (arrowLine) {
                                arrowLine.style.height = `${value}px`;
                            }
                            if (arrowHead) {
                                // 화살표 머리 크기도 두께에 비례하여 조정
                                const headSize = Math.max(6, value * 2);
                                arrowHead.style.borderTop = `${headSize}px solid transparent`;
                                arrowHead.style.borderBottom = `${headSize}px solid transparent`;
                                arrowHead.style.borderLeft = `${headSize * 1.5}px solid ${element.borderColor || "#000000"}`;
                            }
                        }
                    } else if (element.shapeType === "circle") {
                        // 원형인 경우 fill이 적용되는 내부 div의 border 두께만 변경
                        const innerContainer = elementDiv.querySelector("div > div");
                        if (innerContainer) {
                            const circleDiv = innerContainer.querySelector("div");
                            if (circleDiv) {
                                if (value > 0) {
                                    circleDiv.style.border = `${value}px solid ${element.borderColor || "#000000"}`;
                                } else {
                                    circleDiv.style.border = "none";
                                }
                            }
                        }
                    }
                }

                // 원형 요소는 applyBorderStyle을 호출하지 않음 (이미 처리됨)
                if (!(element.type === "shape" && element.shapeType === "circle")) {
                    this.applyBorderStyle(element, elementDiv);
                }
                // 삼각형인 경우 SVG stroke-width 업데이트
                if (element.type === "shape" && element.shapeType === "triangle") {
                    const svg = elementDiv.querySelector("svg");
                    if (svg) {
                        const path = svg.querySelector("path");
                        if (path) {
                            if (value === 0) {
                                path.setAttribute("stroke", "none");
                                path.setAttribute("stroke-width", "0");
                            } else {
                                path.setAttribute("stroke", element.borderColor || "#000000");
                                path.setAttribute("stroke-width", value);
                            }
                        }
                    }
                }
                break;
            case "showX":
                element.showX = value;
                this.updateXMark(element, elementDiv);
                break;

            default:
                element[property] = value;
                if (property === "x") elementDiv.style.left = `${value}px`;
                if (property === "y") elementDiv.style.top = `${value}px`;
                if (property === "width") {
                    elementDiv.style.width = `${value}px`;
                    // 삼각형인 경우 SVG 경로 업데이트
                    if (element.type === "shape" && element.shapeType === "triangle") {
                        const svg = elementDiv.querySelector("svg");
                        if (svg) {
                            const path = svg.querySelector("path");
                            if (path) {
                                const centerX = value / 2;
                                const height = element.height || 200;
                                const topY = height * 0.1;
                                const bottomY = height * 0.9;
                                const leftX = value * 0.1;
                                const rightX = value * 0.9;
                                const pathData = `M${centerX},${topY} L${rightX},${bottomY} L${leftX},${bottomY} Z`;
                                path.setAttribute("d", pathData);
                            }
                        }
                    }
                }
                if (property === "height") {
                    elementDiv.style.height = `${value}px`;
                    // 삼각형인 경우 SVG 경로 업데이트
                    if (element.type === "shape" && element.shapeType === "triangle") {
                        const svg = elementDiv.querySelector("svg");
                        if (svg) {
                            const path = svg.querySelector("path");
                            if (path) {
                                const width = element.width || 200;
                                const centerX = width / 2;
                                const topY = value * 0.1;
                                const bottomY = value * 0.9;
                                const leftX = width * 0.1;
                                const rightX = width * 0.9;
                                const pathData = `M${centerX},${topY} L${rightX},${bottomY} L${leftX},${bottomY} Z`;
                                path.setAttribute("d", pathData);
                            }
                        }
                    }
                }
        }

        this.updateProperties();
        this.saveHistory();
    }
    updateFontSize(size) {
        if (!this.selectedElement || this.selectedElement.type !== "text") return;

        const fontSize = Math.max(8, Math.min(72, parseInt(size))); // 8px ~ 72px 제한
        this.selectedElement.fontSize = fontSize;

        const elementDiv = document.getElementById(`element-${this.selectedElement.id}`);
        elementDiv.style.fontSize = `${fontSize}px`;

        this.saveHistory();
    }

    increaseFontSize() {
        if (!this.selectedElement || this.selectedElement.type !== "text") return;
        const currentSize = this.selectedElement.fontSize || 16;
        this.updateFontSize(currentSize + 2);
    }

    decreaseFontSize() {
        if (!this.selectedElement || this.selectedElement.type !== "text") return;
        const currentSize = this.selectedElement.fontSize || 16;
        this.updateFontSize(currentSize - 2);
    }

    copyContentToClipboard(content) {
        if (!content || content.trim() === "") {
            this.showNotification("Copy Failed", "No content to copy", "error");
            return;
        }

        navigator.clipboard
            .writeText(content)
            .then(() => {
                this.showNotification("Copied!", "Content copied to clipboard", "success");
            })
            .catch((err) => {
                console.error("Failed to copy content: ", err);
                this.showNotification("Copy Failed", "Failed to copy content", "error");
            });
    }

    // Layer 관련 함수들 수정
    updateLayersList() {
        const layersList = document.querySelector(".layers-list");
        if (!layersList) return;

        layersList.innerHTML = "";

        [...this.elements].reverse().forEach((element) => {
            const layerItem = document.createElement("div");
            const isActive = element === this.selectedElement;
            layerItem.className = `layer-item${isActive ? " active" : ""}`;
            layerItem.setAttribute("data-element-id", element.id);

            layerItem.innerHTML = `
            <span>${element.name}</span>
            ${
                isActive
                    ? `
                <div class="layer-actions">
                    <button onclick="tool.editElementName(${element.id})">
                        <img src="./src/images/icon-pencil.svg" alt="Rename" />
                    </button>
                    <button onclick="tool.deleteElement(${element.id})">
                        <img src="./src/images/icon-X.svg" alt="Delete" />
                    </button>
                </div>
            `
                    : ""
            }
        `;

            // 레이어 클릭 이벤트
            layerItem.addEventListener("click", (e) => {
                if (!e.target.closest("button")) {
                    this.selectElement(element);
                }
            });

            layersList.appendChild(layerItem);
        });
    }

    // 요소 이름 수정 함수 수정
    editElementName(elementId) {
        const element = this.elements.find((el) => el.id === elementId);
        if (!element) return;

        // 레이어 목록에서 해당 요소의 span을 찾아서 편집 가능하게 만들기
        const layersList = document.querySelector(".layers-list");
        const layerItem = layersList.querySelector(`[data-element-id="${elementId}"]`);
        if (!layerItem) return;

        const nameSpan = layerItem.querySelector("span");
        if (!nameSpan) return;

        // 편집 모드로 전환
        nameSpan.contentEditable = "true";
        nameSpan.focus();
        nameSpan.style.outline = "1px solid #2e6ff2";
        nameSpan.style.padding = "2px 4px";
        nameSpan.style.borderRadius = "2px";

        // 텍스트 선택
        const range = document.createRange();
        range.selectNodeContents(nameSpan);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // 편집 완료 함수
        const finishEditing = () => {
            const newName = nameSpan.textContent.trim();
            if (newName && newName !== element.name) {
                element.name = newName;

                // 프레임 라벨 업데이트
                if (element.type === "frame") {
                    const frameDiv = document.getElementById(`element-${element.id}`);
                    const label = frameDiv.querySelector(".frame-label");
                    if (label) {
                        label.textContent = newName;
                    }
                    this.updateFrameGrids();
                }

                this.updateLayersList();
                this.saveHistory();
            } else {
                nameSpan.textContent = element.name; // 원래 이름으로 복원
            }

            // 편집 모드 해제
            nameSpan.contentEditable = "false";
            nameSpan.style.outline = "";
            nameSpan.style.padding = "";
            nameSpan.style.borderRadius = "";
        };

        // 이벤트 리스너 추가
        const handleKeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finishEditing();
            } else if (e.key === "Escape") {
                nameSpan.textContent = element.name;
                finishEditing();
            }
        };

        const handleBlur = () => {
            finishEditing();
        };

        nameSpan.addEventListener("keydown", handleKeydown);
        nameSpan.addEventListener("blur", handleBlur);
    }
    // 요소 삭제 함수 수정
    deleteElement(id) {
        const elementToDelete = id ? this.elements.find((e) => e.id === id) : this.selectedElement;
        if (!elementToDelete) return;

        const elementDiv = document.getElementById(`element-${elementToDelete.id}`);
        if (elementDiv) elementDiv.remove();

        this.elements = this.elements.filter((e) => e !== elementToDelete);
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

    // 다중 선택된 요소들 삭제
    deleteMultipleElements() {
        if (this.selectedElements.length === 0) return;

        // 선택된 요소들을 역순으로 삭제 (인덱스 변화 방지)
        const elementsToDelete = [...this.selectedElements].reverse();

        elementsToDelete.forEach((element) => {
            // DOM에서 요소 제거
            const elementDiv = document.getElementById(`element-${element.id}`);
            if (elementDiv) {
                elementDiv.remove();
            }

            // 배열에서 요소 제거
            const index = this.elements.findIndex((el) => el.id === element.id);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
        });

        // 선택 상태 초기화
        this.selectedElement = null;
        this.selectedElements = [];

        this.updateProperties();
        this.updateLayersList();
        this.saveHistory();
    }

    setGridSize(size) {
        this.gridSize = parseInt(size);
        this.updateGridBackground();
    }

    clearSelection() {
        document.querySelectorAll(".element.selected").forEach((el) => {
            el.classList.remove("selected");
            el.classList.remove("multi-selected"); // 다중 선택 클래스도 제거
            el.removeAttribute("tabindex"); // 포커스 제거
            el.querySelectorAll(".resize-handle").forEach((handle) => handle.remove()); // 리사이즈 핸들 제거
        });
        this.selectedElement = null;
        this.selectedElements = [];
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
        const upperElement = this.elements.find((el) => el.zIndex === currentZ + 1);

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
        const lowerElement = this.elements.find((el) => el.zIndex === currentZ - 1);

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

        this.elements.forEach((element) => {
            if (element !== this.selectedElement) {
                element.zIndex = (element.zIndex || 0) + 1;
                const elementDiv = document.getElementById(`element-${element.id}`);
                elementDiv.style.zIndex = element.zIndex;
            }
        });

        this.selectedElement.zIndex = 1;
        document.getElementById(`element-${this.selectedElement.id}`).style.zIndex = 1;

        this.maxZIndex = Math.max(...this.elements.map((el) => el.zIndex || 0));
        this.saveHistory();
    }

    // 실행 취소/다시 실행 관련 메서드
    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.loadState(this.history[this.currentHistoryIndex]);
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const state = this.history[this.currentHistoryIndex];
            if (state) {
                const parsedState = JSON.parse(state);
                // pages와 currentPageId가 있는 경우 (새로운 형식)
                if (parsedState.pages) {
                    this.pages = new Map(parsedState.pages);
                    this.currentPageId = parsedState.currentPageId;
                    const currentPage = this.pages.get(this.currentPageId);
                    if (currentPage) {
                        this.elements = currentPage.elements || [];
                    }
                } else {
                    // 이전 형식 지원
                    this.elements = parsedState;
                }
                document.getElementById("canvas").innerHTML = "";
                this.elements.forEach((element) => this.renderElement(element));
                this.selectedElement = null;
                this.updateProperties();
                this.updateLayersList();
                this.updatePageList();
            }
        }
    }

    loadState(state) {
        if (!state) return;

        const parsedState = JSON.parse(state);

        // pages와 currentPageId가 있는 경우 (새로운 형식)
        if (parsedState.pages) {
            this.pages = new Map(parsedState.pages);
            this.currentPageId = parsedState.currentPageId;
            const currentPage = this.pages.get(this.currentPageId);
            if (currentPage) {
                this.elements = currentPage.elements || [];
            }
        } else {
            // 이전 형식 지원
            this.elements = parsedState;
        }

        // 캔버스 초기화 및 요소 다시 렌더링
        document.getElementById("canvas").innerHTML = "";
        this.elements.forEach((element) => this.renderElement(element));
        this.selectedElement = null;

        // UI 업데이트
        this.updateProperties();
        this.updateLayersList();
        this.updatePageList();
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
                gridSize: page.gridSize,
            })),
            currentPageId: this.currentPageId,
            maxZIndex: this.maxZIndex,
        };

        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "prototype.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    load() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    // 페이지 맵 재구성
                    this.pages = new Map(
                        data.pages.map((page) => [
                            page.id,
                            {
                                id: page.id,
                                name: page.name,
                                elements: page.elements,
                                device: page.device,
                                gridSize: page.gridSize,
                            },
                        ])
                    );

                    // 현재 페이지 ID 설정
                    this.currentPageId = data.currentPageId;

                    // maxZIndex 복원
                    this.maxZIndex = data.maxZIndex || Math.max(...data.pages.flatMap((page) => page.elements.map((el) => el.zIndex || 0)), 0);

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
                    console.error("Error loading file:", error);
                    alert("Failed to load the file. Please make sure it is a valid prototype file.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // 이미지로 내보내기
    async exportAsImage() {
        const canvas = document.getElementById("canvas");

        // 현재 상태를 저장
        const originalStyle = canvas.style.backgroundImage;
        const selectedElement = this.selectedElement;
        const resizeHandles = document.querySelectorAll(".resize-handle");

        try {
            // 1. 그리드 제거
            canvas.style.backgroundImage = "none";

            // 2. 선택된 요소의 상태 제거
            if (selectedElement) {
                const selectedDiv = document.getElementById(`element-${selectedElement.id}`);
                if (selectedDiv) selectedDiv.classList.remove("selected");
            }

            // 3. 리사이즈 핸들 임시 숨김
            resizeHandles.forEach((handle) => {
                handle.style.display = "none";
            });

            // html2canvas 옵션 설정
            const options = {
                backgroundColor: "#ffffff",
                scale: 2, // 고해상도
                useCORS: true,
                logging: false,
                removeContainer: false,
                ignoreElements: (element) => {
                    // resize-handle 클래스를 가진 요소 무시
                    return element.classList.contains("resize-handle");
                },
            };

            // 이미지 생성
            const imageCanvas = await html2canvas(canvas, options);

            // 이미지 다운로드
            const link = document.createElement("a");
            link.download = "prototype.png";
            link.href = imageCanvas.toDataURL("image/png", 1.0);
            link.click();
        } catch (error) {
            console.error("Failed to export image:", error);
            alert("Failed to export image. Please try again.");
        } finally {
            // 모든 상태 복원
            canvas.style.backgroundImage = originalStyle;

            if (selectedElement) {
                const selectedDiv = document.getElementById(`element-${selectedElement.id}`);
                if (selectedDiv) {
                    selectedDiv.classList.add("selected");
                    // 리사이즈 핸들 다시 표시
                    this.addResizeHandles(selectedDiv);
                }
            }

            // 숨겼던 리사이즈 핸들 복원
            resizeHandles.forEach((handle) => {
                handle.style.display = "";
            });
        }
    }

    showShortcutGuide() {
        const modal = document.createElement("div");
        modal.className = "shortcut-modal";

        modal.innerHTML = `
            <div class="shortcut-content">
                <button class="shortcut-close" onclick="this.closest('.shortcut-modal').remove()">x</button>
                <h2 style="margin-bottom: 20px;">Keyboard Shortcuts</h2>
                
                <div class="shortcut-section">
                    <h3>Navigation</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <span>Pan Canvas</span>
                            <div class="shortcut-keys">
                                <span class="key">Space</span>
                                <span>+ Drag</span>
                            </div>
                        </div>
                        <div class="shortcut-item">
                            <span>Zoom In/Out</span>
                            <div class="shortcut-keys">
                                <span class="key">Ctrl</span>
                                <span>+ Scroll</span>
                            </div>
                        </div>
                    </div>
                </div>
    
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
                        <div class="shortcut-item">
                            <span>Finish Editing Text</span>
                            <div class="shortcut-keys">
                                <span class="key">Enter</span>
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

                    </div>
                </div>
    

    
            </div>
        `;

        // Mac 사용자를 위한 단축키 수정
        if (navigator.platform.toUpperCase().indexOf("MAC") >= 0) {
            modal.querySelectorAll(".key").forEach((key) => {
                if (key.textContent === "Ctrl") {
                    key.textContent = "⌘";
                }
            });
        }

        document.body.appendChild(modal);

        // 모달 외부 클릭 시 닫기
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                modal.remove();
                document.removeEventListener("keydown", handleEsc);
            }
        };
        document.addEventListener("keydown", handleEsc);
    }

    // PrototypingTool 클래스에 추가

    // 페이지 추가 버튼 클릭 핸들러
    addNewPage() {
        const pageId = Date.now();
        const page = {
            id: pageId,
            name: `Page ${this.pages.size + 1}`,
            elements: [],
            device: this.currentDevice,
            gridSize: this.gridSize,
        };

        this.pages.set(pageId, page);

        if (!this.currentPageId) {
            this.currentPageId = pageId;
        }

        this.updatePageList();
        this.saveHistory();
    }

    // 페이지 목록 업데이트
    updatePageList() {
        const pagesList = document.getElementById("pages-list");
        pagesList.innerHTML = "";

        this.pages.forEach((page, pageId) => {
            const pageItem = document.createElement("div");
            const isActive = pageId === this.currentPageId;
            pageItem.className = `page-item${isActive ? " active" : ""}`;
            pageItem.setAttribute("data-page-id", pageId);

            // active 상태일 때만 수정/삭제 버튼을 포함
            pageItem.innerHTML = `
            <span>${page.name}</span>
            ${
                isActive
                    ? `
                <div class="page-actions">
                    <button onclick="tool.renamePage(${pageId})">
                        <img src="./src/images/icon-pencil.svg" alt="Rename" />
                    </button>
                    <button onclick="tool.deletePage(${pageId})">
                        <img src="./src/images/icon-X.svg" alt="Delete" />
                    </button>
                </div>
            `
                    : ""
            }
        `;

            // 페이지 클릭 이벤트
            pageItem.addEventListener("click", (e) => {
                if (!e.target.closest("button")) {
                    this.switchPage(pageId);
                }
            });

            pagesList.appendChild(pageItem);
        });
    }

    // 페이지 이름 변경
    renamePage(pageId) {
        const page = this.pages.get(pageId);
        if (!page) return;

        // 페이지 목록에서 해당 페이지의 span을 찾아서 편집 가능하게 만들기
        const pagesList = document.getElementById("pages-list");
        const pageItem = pagesList.querySelector(`[data-page-id="${pageId}"]`);
        if (!pageItem) return;

        const nameSpan = pageItem.querySelector("span");
        if (!nameSpan) return;

        // 편집 모드로 전환
        nameSpan.contentEditable = "true";
        nameSpan.focus();
        nameSpan.style.outline = "1px solid #2e6ff2";
        nameSpan.style.padding = "2px 4px";
        nameSpan.style.borderRadius = "2px";

        // 텍스트 선택
        const range = document.createRange();
        range.selectNodeContents(nameSpan);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // 편집 완료 함수
        const finishEditing = () => {
            const newName = nameSpan.textContent.trim();
            if (newName && newName !== page.name) {
                page.name = newName;
                this.updatePageList();
                this.saveHistory();
            } else {
                nameSpan.textContent = page.name; // 원래 이름으로 복원
            }

            // 편집 모드 해제
            nameSpan.contentEditable = "false";
            nameSpan.style.outline = "";
            nameSpan.style.padding = "";
            nameSpan.style.borderRadius = "";
        };

        // 이벤트 리스너 추가
        const handleKeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finishEditing();
            } else if (e.key === "Escape") {
                nameSpan.textContent = page.name;
                finishEditing();
            }
        };

        const handleBlur = () => {
            finishEditing();
        };

        nameSpan.addEventListener("keydown", handleKeydown);
        nameSpan.addEventListener("blur", handleBlur);
    }

    // 페이지 삭제
    deletePage(pageId) {
        if (this.pages.size <= 1) {
            alert("마지막 페이지는 삭제할 수 없습니다.");
            return;
        }

        // 현재 페이지를 삭제하는 경우
        if (this.currentPageId === pageId) {
            // 다른 페이지로 전환
            const otherPageId = [...this.pages.keys()].find((id) => id !== pageId);
            if (otherPageId) {
                this.switchPage(otherPageId);
            }
        }

        this.pages.delete(pageId);
        this.updatePageList();
        this.saveHistory();
    }

    // 페이지 전환
    switchPage(pageId) {
        if (!this.pages.has(pageId) || pageId === this.currentPageId) return;

        // 현재 페이지 상태 저장
        if (this.currentPageId) {
            const currentPage = this.pages.get(this.currentPageId);
            if (currentPage) {
                currentPage.elements = this.elements;
                currentPage.device = this.currentDevice;
                currentPage.gridSize = this.gridSize; // 현재 페이지의 그리드 크기 저장
            }
        }

        // 새 페이지 로드
        const newPage = this.pages.get(pageId);
        this.elements = [...newPage.elements];
        this.currentPageId = pageId;
        this.currentDevice = newPage.device;

        // 페이지별 그리드 설정 복원
        if (typeof newPage.gridSize !== "undefined") {
            this.gridSize = newPage.gridSize;
            this.setGridSize(newPage.gridSize);
        } else {
            // 그리드 크기가 설정되지 않은 페이지의 경우 기본값 20px 설정
            this.gridSize = 20;
            this.setGridSize(20);
        }

        // UI 업데이트
        this.renderCanvas();
        this.updatePageList();
        this.clearSelection();
    }
    // 히스토리 저장 시 페이지 정보도 포함
    saveHistory() {
        const currentPage = this.pages.get(this.currentPageId);
        if (currentPage) {
            currentPage.elements = this.elements;
        }

        const state = {
            pages: Array.from(this.pages.entries()),
            currentPageId: this.currentPageId,
            maxZIndex: this.maxZIndex,
        };

        // 현재 위치 이후의 기록을 제거
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);

        // 새로운 상태 추가
        this.history.push(JSON.stringify(state));
        this.currentHistoryIndex++;
    }

    // 캔버스 렌더링 메서드
    renderCanvas() {
        const canvas = document.getElementById("canvas");
        canvas.innerHTML = "";
        this.elements.forEach((element) => this.renderElement(element));
        this.selectedElement = null;
        this.updateProperties();
        this.updateLayersList();
    }

    // 색상에 alpha 적용 (hex/rgb/rba 모두 지원)
    setAlphaToColor(color, alpha) {
        if (!color) return "";
        if (color.startsWith("rgba")) {
            return color.replace(/rgba?\(([^)]+)\)/, (match, contents) => {
                const parts = contents.split(",").map((s) => s.trim());
                return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha !== undefined ? alpha : parts[3] !== undefined ? parts[3] : 1})`;
            });
        } else if (color.startsWith("rgb")) {
            return color.replace(/rgb\(([^)]+)\)/, (match, contents) => {
                return `rgba(${contents},${alpha !== undefined ? alpha : 1})`;
            });
        } else if (color.startsWith("#")) {
            const rgba = this.hexToRgba(color, alpha !== undefined ? alpha : 1);
            return rgba;
        }
        return color;
    }

    // hex -> rgba 변환
    hexToRgba(hex, alpha = 1) {
        let c = hex.replace("#", "");
        if (c.length === 3)
            c = c
                .split("")
                .map((x) => x + x)
                .join("");
        const num = parseInt(c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // rgba/rgb -> hex 변환
    getHexFromColor(color) {
        if (!color) return "#FFFFFF";
        if (color.startsWith("#")) return color;

        // rgba 또는 rgb에서 hex 추출
        const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
        if (rgbaMatch) {
            const parts = rgbaMatch[1].split(",").map((s) => s.trim());
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }

        return "#FFFFFF";
    }

    // 버튼 타입에 따른 기본 색상 반환
    getButtonDefaultColor(buttonType) {
        switch (buttonType) {
            case "activate":
                return "#2E6FF2";
            case "normal":
                return "#ffffff";
            case "hover":
            case "deactivate":
                return "#D9DBE0";
            default:
                return "#2E6FF2";
        }
    }

    getCurrentTextColor(element) {
        // 요소 타입별로 현재 텍스트 색상을 반환
        switch (element.type) {
            case "text":
                return element.textColor || "#000000";
            case "button":
                // 버튼의 경우 buttonType에 따라 기본 색상 결정
                if (element.textColor) {
                    return element.textColor;
                }
                switch (element.buttonType) {
                    case "normal":
                        return "#000000";
                    case "activate":
                    case "deactivate":
                        return "#ffffff";
                    case "hover":
                        return "#121314";
                    default:
                        return "#ffffff";
                }
            case "input":
                return element.textColor || "#000000";
            case "alert":
                return element.textColor || "#121314";
            case "sticky":
                return element.textColor || "#000000";
            default:
                return "#000000";
        }
    }

    // 실제 DOM에서 현재 텍스트 색상을 가져오는 함수
    getActualTextColor(element) {
        const elementDiv = document.getElementById(`element-${element.id}`);
        if (!elementDiv) {
            return this.getCurrentTextColor(element);
        }

        let computedColor;
        switch (element.type) {
            case "text":
                computedColor = window.getComputedStyle(elementDiv).color;
                break;
            case "button":
                computedColor = window.getComputedStyle(elementDiv).color;
                break;
            case "input":
                const input = elementDiv.querySelector("input");
                computedColor = input ? window.getComputedStyle(input).color : "#000000";
                break;
            case "alert":
                const messageText = elementDiv.querySelector("span");
                computedColor = messageText ? window.getComputedStyle(messageText).color : "#121314";
                break;
            case "sticky":
                const content = elementDiv.querySelector(".sticky-content");
                computedColor = content ? window.getComputedStyle(content).color : "#000000";
                break;
            default:
                computedColor = "#000000";
        }

        // RGB 값을 HEX로 변환
        if (computedColor.startsWith("rgb")) {
            const rgb = computedColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            }
        }

        return computedColor;
    }
}

// 툴 초기화
const tool = new PrototypingTool();
