# canvas
프로토타이핑툴

## 리펙토링 계획
* 프로젝트 마무리 후 리펙토링
* 아래와 같은 폴더 구조를 가질 예정
```
src/
├── core/
│   ├── PrototypingTool.js        # 메인 클래스 및 초기화
│   ├── constants.js              # 상수 정의 (디바이스 프리셋, 색상 등)
│   └── state.js                  # 전역 상태 관리
├── features/
│   ├── elements/
│   │   ├── ElementManager.js     # 요소 관리 (생성, 삭제, 수정)
│   │   ├── ElementRenderer.js    # 요소 렌더링
│   │   └── types/               # 각 요소 타입별 클래스
│   │       ├── Button.js
│   │       ├── Input.js
│   │       ├── Text.js
│   │       ├── Box.js
│   │       ├── Panel.js
│   │       ├── Sticky.js
│   │       ├── Image.js
│   │       └── Link.js
│   ├── interactions/
│   │   ├── DragManager.js       # 드래그 앤 드롭 관리
│   │   ├── ResizeManager.js     # 리사이즈 관리
│   │   └── SnapManager.js       # 스냅 기능 관리
│   ├── canvas/
│   │   ├── CanvasManager.js     # 캔버스 관리
│   │   ├── GridManager.js       # 그리드 관리
│   │   └── ZoomManager.js       # 줌/패닝 관리
│   ├── pages/
│   │   └── PageManager.js       # 페이지 관리
│   └── history/
│       └── HistoryManager.js    # 실행취소/다시실행 관리
├── ui/
│   ├── PropertyPanel.js         # 속성 패널 UI
│   ├── LayerPanel.js           # 레이어 패널 UI
│   └── Toolbar.js              # 툴바 UI
└── utils/
    ├── exporters/
    │   ├── ImageExporter.js    # 이미지 내보내기
    │   └── HTMLExporter.js     # HTML 내보내기
    └── helpers.js              # 유틸리티 함수
```