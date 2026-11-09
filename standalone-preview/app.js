/**
 * Bebesup Customer Experience & Brand Strategy Survey - Application Engine (app.js)
 */

(function () {
  const STORAGE_KEY = "bebesup_survey_strategy_v4";

  // State
  let answers = {};
  let currentSection = 0;
  let isCompleted = false;

  // DOM Elements
  const stepListEl = document.getElementById("step-list");
  const stepMetaEl = document.getElementById("step-meta");
  const stepTitleMetaEl = document.getElementById("step-title-meta");
  const progressTrackEl = document.getElementById("progress-indicator");
  const sectionContentEl = document.getElementById("section-content");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const errorAlertEl = document.getElementById("error-alert");

  // Load from LocalStorage if available
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      answers = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Storage load error", e);
  }

  // Helper: Check if question is visible
  function isQuestionVisible(q) {
    if (!SURVEY_CONDITIONS[q.id]) return true;
    return SURVEY_CONDITIONS[q.id](answers);
  }

  // Helper: Get list of active sections
  function getActiveSections() {
    const active = [];
    for (let s = 0; s < SECTION_TITLES.length; s++) {
      const qs = SURVEY_QUESTIONS.filter(q => q.section === s && isQuestionVisible(q));
      if (qs.length > 0) {
        active.push(s);
      }
    }
    return active;
  }

  // Helper: Get current outer step info
  function getCurrentStepInfo() {
    const stepIdx = SURVEY_STEPS.findIndex(s => s.sections.includes(currentSection));
    const stepNum = stepIdx !== -1 ? stepIdx + 1 : 1;
    const stepObj = SURVEY_STEPS[stepIdx] || SURVEY_STEPS[0];
    return { stepNum, totalSteps: SURVEY_STEPS.length, stepObj };
  }

  // Update Sidebar & Progress
  function updateNavigationUI() {
    const activeSections = getActiveSections();
    const activeIdx = activeSections.indexOf(currentSection);
    const { stepNum, totalSteps, stepObj } = getCurrentStepInfo();

    // Step Meta (01 / 06)
    stepMetaEl.textContent = `0${stepNum} / 0${totalSteps}`;
    stepTitleMetaEl.textContent = stepObj.label;

    // Progress Bar
    const progressPercent = Math.min(100, Math.round(((stepNum - 1) / (totalSteps - 1)) * 100));
    progressTrackEl.style.width = `${progressPercent}%`;

    // Sidebar Step Highlight
    const lis = stepListEl.querySelectorAll("li");
    lis.forEach((li, idx) => {
      li.className = "";
      if (idx + 1 === stepNum) {
        li.classList.add("active");
      } else if (idx + 1 < stepNum) {
        li.classList.add("completed");
      }
    });

    // Buttons
    prevBtn.disabled = activeIdx <= 0;
    const isLastSection = activeIdx === activeSections.length - 1;
    nextBtn.textContent = isLastSection ? "의견 제출하기 ✓" : "다음으로 →";
  }

  // Format Phone Number: 010-XXXX-XXXX
  function formatPhoneNumber(val) {
    const cleaned = (val || "").replace(/[^0-9]/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }

  // Save State
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (e) {}
  }

  // Show Error Alert
  function showError(msg) {
    if (!msg) {
      errorAlertEl.style.display = "none";
      errorAlertEl.textContent = "";
      return;
    }
    errorAlertEl.textContent = msg;
    errorAlertEl.style.display = "block";
    errorAlertEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Render Current Section
  function renderSection() {
    showError(null);
    updateNavigationUI();

    const activeSections = getActiveSections();
    if (!activeSections.includes(currentSection)) {
      currentSection = activeSections[0] || 0;
    }

    const qs = SURVEY_QUESTIONS.filter(q => q.section === currentSection && isQuestionVisible(q));

    let html = "";

    // Section 0 Welcome Banner
    if (currentSection === 0) {
      html += `
        <h2>평소 물티슈를<br/>어떻게 사용하고 계신가요?</h2>
        <p class="muted">
          안녕하세요, 베베숲입니다. 저희가 더 좋은 제품을 만들고 앞으로 고객님께 꼭 필요한 브랜드로 변화하기 위해 소중한 고객님의 솔직하고 가감 없는 생각을 듣고자 합니다.
          정답은 없습니다. 평소 경험과 가장 가까운 답변을 편하게 선택해주세요.
        </p>
        <div class="benefit-card">
          <strong>🎁 설문 참여자 전원 경품 추첨 & 인터뷰 혜택</strong>
          <p>설문에 응답해주신 모든 분 중 추첨을 통해 경품을 드리며, 1:1 심층 인터뷰(약 30분)에 참여해주시는 분께는 <strong>시그니처 블랙 20팩 & 홈&스킨 선물박스</strong>을 선물로 드립니다.</p>
          <span>예상 소요 시간 약 4분</span>
        </div>
      `;
    } else {
      const { stepObj } = getCurrentStepInfo();
      html += `<h2>${stepObj.label}</h2>`;
    }

    // Render Each Question
    qs.forEach((q) => {
      html += renderQuestion(q);
    });

    sectionContentEl.innerHTML = html;
    bindQuestionEvents();
  }

  // Render HTML for single question
  function renderQuestion(q) {
    const val = answers[q.id];
    const otherVal = answers[q.id + "_other"] || "";

    let badges = [];
    if (q.required) badges.push("필수");
    if (q.type === "multi") {
      badges.push(q.max ? `최대 ${q.max}개 선택` : "복수 선택");
    }

    let hintHtml = q.hint ? `<div class="question-hint">${q.hint}</div>` : "";

    let privacyBoxHtml = "";
    if (q.id === "Q27-agree") {
      privacyBoxHtml = `<div class="privacy-box">${PRIVACY_TERMS.general}</div>`;
    }

    let bodyHtml = "";

    switch (q.type) {
      case "single":
        bodyHtml = `
          <div class="choices" data-qid="${q.id}" data-type="single">
            ${q.options.map(opt => {
              const checked = val === opt;
              const isOther = opt.includes("기타");
              return `
                <div>
                  <label class="choice ${checked ? "selected" : ""}">
                    <input type="radio" name="${q.id}" value="${opt}" ${checked ? "checked" : ""} />
                    <span>${opt}</span>
                  </label>
                  ${isOther && checked ? `
                    <div class="other-input-wrap">
                      <input type="text" data-other-for="${q.id}" placeholder="직접 브랜드명 또는 의견을 적어주세요" value="${otherVal}" />
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `;
        break;

      case "multi":
        const selectedArr = Array.isArray(val) ? val : [];
        bodyHtml = `
          <div class="choices" data-qid="${q.id}" data-type="multi" data-max="${q.max || 99}">
            ${q.options.map(opt => {
              const checked = selectedArr.includes(opt);
              const isOther = opt.includes("기타");
              return `
                <div>
                  <label class="choice ${checked ? "selected" : ""}">
                    <input type="checkbox" name="${q.id}" value="${opt}" ${checked ? "checked" : ""} />
                    <span>${opt}</span>
                  </label>
                  ${isOther && checked ? `
                    <div class="other-input-wrap">
                      <input type="text" data-other-for="${q.id}" placeholder="직접 의견을 적어주세요" value="${otherVal}" />
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `;
        break;

      case "text":
        bodyHtml = `
          <div class="text-input-wrap">
            <textarea data-qid="${q.id}" placeholder="내용을 편하게 적어주세요.">${val || ""}</textarea>
          </div>
        `;
        break;

      case "phone":
        bodyHtml = `
          <div class="text-input-wrap">
            <input type="tel" data-qid="${q.id}" placeholder="010-1234-5678" maxlength="13" value="${formatPhoneNumber(val || "")}" />
          </div>
        `;
        break;

      case "score":
        bodyHtml = `
          <div class="score-grid" data-qid="${q.id}">
            ${q.options.map(score => {
              const selected = val === score;
              return `
                <button type="button" class="score-btn ${selected ? "selected" : ""}" data-score="${score}">
                  ${score}
                </button>
              `;
            }).join("")}
          </div>
        `;
        break;
    }

    return `
      <fieldset id="field-${q.id}">
        <legend>
          <small>${q.id} ${badges.map(b => `<b>${b}</b>`).join(" ")}</small>
          ${q.title}
        </legend>
        ${hintHtml}
        ${privacyBoxHtml}
        ${bodyHtml}
      </fieldset>
    `;
  }

  // Bind Events for Form Elements
  function bindQuestionEvents() {
    sectionContentEl.querySelectorAll(".choices[data-type='single'] input[type='radio']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        const qid = e.target.name;
        answers[qid] = e.target.value;
        saveState();
        renderSection();
      });
    });

    sectionContentEl.querySelectorAll(".choices[data-type='multi'] input[type='checkbox']").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const parent = e.target.closest(".choices");
        const qid = parent.dataset.qid;
        const max = parseInt(parent.dataset.max, 10) || 99;

        let current = Array.isArray(answers[qid]) ? [...answers[qid]] : [];
        if (e.target.checked) {
          if (current.length >= max) {
            e.target.checked = false;
            showError(`최대 ${max}개까지만 선택하실 수 있습니다.`);
            return;
          }
          current.push(e.target.value);
        } else {
          current = current.filter(v => v !== e.target.value);
        }

        answers[qid] = current;
        saveState();
        renderSection();
      });
    });

    sectionContentEl.querySelectorAll(".text-input-wrap textarea").forEach(tx => {
      tx.addEventListener("input", (e) => {
        const qid = e.target.dataset.qid;
        answers[qid] = e.target.value;
        saveState();
      });
    });

    sectionContentEl.querySelectorAll(".text-input-wrap input[type='tel']").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const qid = e.target.dataset.qid;
        const formatted = formatPhoneNumber(e.target.value);
        e.target.value = formatted;
        answers[qid] = formatted;
        saveState();
      });
    });

    sectionContentEl.querySelectorAll("input[data-other-for]").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const qid = e.target.dataset.otherFor;
        answers[qid + "_other"] = e.target.value;
        saveState();
      });
    });

    sectionContentEl.querySelectorAll(".score-grid button").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const grid = e.target.closest(".score-grid");
        const qid = grid.dataset.qid;
        const score = e.target.dataset.score;
        answers[qid] = score;
        saveState();
        renderSection();
      });
    });
  }

  // Validate Current Section
  function validateCurrentSection() {
    const qs = SURVEY_QUESTIONS.filter(q => q.section === currentSection && isQuestionVisible(q));

    for (const q of qs) {
      const val = answers[q.id];

      if (q.required) {
        if (val === undefined || val === null || val === "") {
          return `${q.id} 문항에 응답해주세요.`;
        }
        if (Array.isArray(val) && val.length === 0) {
          return `${q.id} 문항에 최소 1개 이상 선택해주세요.`;
        }
      }

      if (q.type === "multi" && q.max && Array.isArray(val)) {
        if (val.length > q.max) {
          return `${q.id} 문항은 최대 ${q.max}개까지 선택 가능합니다.`;
        }
      }

      if (q.type === "phone" && val) {
        const cleaned = val.replace(/[^0-9]/g, "");
        if (!/^(010\d{8}|01[16789]\d{7,8})$/.test(cleaned)) {
          return "휴대전화 번호를 정확히 입력해주세요. (예: 010-1234-5678)";
        }
      }

      if (q.id === "Q27-agree" && val === "동의하지 않습니다") {
        return "경품 추첨 및 당첨 안내를 위해 개인정보 수집·이용 동의가 필요합니다.";
      }

      const isOtherChecked = Array.isArray(val) ? val.some(v => typeof v === 'string' && v.includes("기타")) : (typeof val === "string" && val.includes("기타"));
      if (isOtherChecked) {
        const otherVal = (answers[q.id + "_other"] || "").trim();
        if (!otherVal) {
          return `${q.id} 문항의 기타 직접 입력란을 작성해주세요.`;
        }
      }
    }

    return null;
  }

  // Next Button Click Handler
  nextBtn.addEventListener("click", () => {
    const error = validateCurrentSection();
    if (error) {
      showError(error);
      return;
    }

    const activeSections = getActiveSections();
    const activeIdx = activeSections.indexOf(currentSection);

    if (activeIdx < activeSections.length - 1) {
      currentSection = activeSections[activeIdx + 1];
      renderSection();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitSurvey();
    }
  });

  // Prev Button Click Handler
  prevBtn.addEventListener("click", () => {
    const activeSections = getActiveSections();
    const activeIdx = activeSections.indexOf(currentSection);

    if (activeIdx > 0) {
      currentSection = activeSections[activeIdx - 1];
      renderSection();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Survey Submit Completion
  function submitSurvey() {
    isCompleted = true;
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    progressTrackEl.style.width = "100%";

    const interviewJoined = answers["Q24-interview"] && answers["Q24-interview"].includes("참여");

    sectionContentEl.innerHTML = `
      <div class="success-card">
        <div class="eyebrow">THANK YOU</div>
        <h2>소중한 의견 진심으로 감사드립니다.</h2>
        <p>
          남겨주신 솔직한 평가와 뼈아픈 조언은 베베숲이 앞으로 고객님께 꼭 필요한 브랜드로 변화하는 데 가장 중요한 나침반이 됩니다.<br/>
          보내주신 마음에 깊이 감사드립니다.
        </p>
        <p style="margin-top:16px; font-weight:700; color:var(--primary); font-size:15px;">🎁 설문 참여 경품 추첨 결과는 입력해주신 연락처로 개별 안내드립니다.</p>
        ${interviewJoined ? `<p style="margin-top:8px; font-weight:700; color:#173a31; font-size:15px;">🎙️ 1:1 심층 인터뷰 대상자로 선정되실 경우, 별도로 연락드리겠습니다. (시그니처 블랙 20팩 & 홈&스킨 선물박스 증정)</p>` : ""}
        
        <div class="success-actions">
          <button type="button" class="btn primary" id="export-json-btn">📥 응답 결과 JSON 다운로드</button>
          <button type="button" class="btn secondary" id="copy-json-btn">📋 클립보드 복사</button>
          <button type="button" class="btn secondary" id="reset-survey-btn">🔄 처음부터 다시 작성</button>
        </div>

        <details style="margin-top:30px; text-align:left; background:#f9fbfa; border:1px solid #dce5e1; border-radius:10px; padding:16px;">
          <summary style="cursor:pointer; font-weight:600; color:var(--text-main);">내가 작성한 응답 데이터 전체 확인</summary>
          <pre style="margin-top:12px; font-size:13px; color:#2c3e38; overflow-x:auto;">${JSON.stringify(answers, null, 2)}</pre>
        </details>
      </div>
    `;

    document.getElementById("export-json-btn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(answers, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bebesup_comprehensive_survey_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("copy-json-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(JSON.stringify(answers, null, 2)).then(() => {
        alert("응답 결과가 클립보드에 복사되었습니다!");
      });
    });

    document.getElementById("reset-survey-btn").addEventListener("click", () => {
      if (confirm("정말로 답변을 초기화하고 처음부터 다시 작성하시겠습니까?")) {
        localStorage.removeItem(STORAGE_KEY);
        answers = {};
        currentSection = 0;
        prevBtn.style.display = "inline-flex";
        nextBtn.style.display = "inline-flex";
        renderSection();
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Initial Run
  renderSection();
})();
