# 📝 Code Editor 소개
### 프로젝트 소개 
![image](https://github.com/user-attachments/assets/2f201fdd-2682-482e-9d45-2b5e496a4891)

#### Zip파일을 파싱해 code를 edit 하는 미니 프로젝트 
<br />

**🔗배포 링크**

[Elice Code Editor](https://elice-code-editor.vercel.app/)

<br /> 

**🖥️ 시스템 아키텍처**

![image](https://github.com/user-attachments/assets/47a0632f-e761-4ac0-901c-0323aeeefe17)

### 프로젝트 소개 노션

[Elice 커리어 부스트 위크 과제](https://stern015.notion.site/Elice-1ecfcc2d2db380bca5fed01e789bd806?pvs=73)

<br />

### 화면 구성
|Elice Code Editor|
|:---:|
|<img width="1505" alt="스크린샷 2025-05-11 오후 9 29 41" src="https://github.com/user-attachments/assets/e3f1fcf5-dad9-42fe-8887-87868a52c0f1" />
|
|- 파일 업로드 <br/> - 파일 트리뷰 <br/> - 파일 editor <br/> - 파일 editor <br /> - 탭 기능 <br /> - 탭 기능 <br /> - ZIP 파일 다운로드|

<br />

### ⚙ 기술 스택

<div>
코어 - react, typescript 

스타일링 - styled-component

구현 방식 -  React Hooks 기반 Functional Component 구조

성능 최적화 - Lighthouse Panel, vite-plugin-inspect , Chrome DevTools / Performance 탭, React DevTools Profiler
</div>

<br />

### 🖥️ 성능 최적화 과정 

### 사용 툴 

Chrome - performance 탭

### 전반적인 성능 상태
<img width="421" alt="스크린샷 2025-05-11 오후 7 22 38" src="https://github.com/user-attachments/assets/7bbfb7af-8de7-438c-aa75-35f798140799" />


INP : 사용자 인터랙션에 대해 **브라우저가 실제로 화면을 업데이트하기**까지 걸린 시간 - 32ms 

### 성능 결과

| 항목 | 시간  |
| --- | --- |
| Scripting | 1,187ms |
| Rendering | 174ms |
| Painting | 124ms |
| Loading | 15ms |
| Messaging | 4ms |

<img width="720" alt="스크린샷 2025-05-11 오후 7 23 18" src="https://github.com/user-attachments/assets/08006316-55dc-4886-b625-7ad42f4a956c" />


→ prepareRender에서 병목 발생 가능성 파악 

#### 리팩토링 전 

<img width="735" alt="스크린샷 2025-05-11 오후 7 23 48" src="https://github.com/user-attachments/assets/eaa95b56-c6b8-4fe0-a97d-776a820e7a82" />


#### 리팩토링 후 

<img width="712" alt="스크린샷 2025-05-11 오후 7 24 30" src="https://github.com/user-attachments/assets/a500c760-beb6-42c6-b01b-cb042afc54e9" />

<img width="343" alt="스크린샷 2025-05-11 오후 7 24 57" src="https://github.com/user-attachments/assets/d70a2076-1f0c-4d3c-9e5d-45c68874b8f5" />


**🔍 문제 원인** 

- 파일 탭 클릭마다 `monaco.editor.createModel`, `setModel`, `updateOptions` 등 **동기적으로 실행**
- 이 작업들이 **메인 쓰레드를 과도하게 점유**
 : pointerdown → commit → layout → paint가 몰려 **렉 유발**
- 특히 `editor.layout()`도 내부적으로 발생하면서 **렌더링 병목** 발생

**📚 리팩토링 방법**

비동기 작업 지연 처리

```jsx
requestIdleCallback(() => {
            editorRef.current!.setModel(model!);
            editorRef.current!.updateOptions({ readOnly: currentTab.file.isEditable === false });
     });
```

JS 실행 → React Commit → Layout → Paint까지 **동기 렌더링 과다** 
: 한가할 때 처리할 수 있도록 처리
     → 사용자 액션 직후에 렉 없이 즉각 반응하고, 모델 교체나 readOnly 옵션은 **뒤로 미룸**

```jsx
if (!model) {
          currentTab.content.text().then(text => {
            requestIdleCallback(() => {
              model = monaco.editor.createModel(text, getLanguage(fileName), uri);
              editorRef.current!.setModel(model!);
              editorRef.current!.updateOptions({ readOnly: currentTab.file.isEditable === false });

              model!.onDidChangeContent(() => {
                setOpenTabs(prevTabs =>
                  prevTabs.map(tab =>
                    `${tab.file.path}/${tab.file.name}` === activeFile
                      ? { ...tab, modified: true }
                      : tab
                  )
                );
              });
            });
          });
        }
```

| 항목 | 리팩토링 전  | 리팩토링 후  |
| --- | --- | --- |
| function call - self time  | 55.7ms  |**1.8ms** |
| INP  | 32ms | **30ms** |

## 🤔 기술적 이슈와 해결 과정
[관련 노션 페이지](https://stern015.notion.site/1ecfcc2d2db38032b139ea0dbb759c56)

<br />

## 💁‍♂️ 프로젝트 진행자
|Frontend|
|:---:|
| ![](https://github.com/psm1st.png?size=120) |
|[박수민](https://github.com/psm1st)|
