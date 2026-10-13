
(function(){
  "use strict";

  const FORM_ENDPOINT="https://docs.google.com/forms/d/e/1FAIpQLSeHTsDgpzZZKG1Uz1rNltKLOLUuOTmsIQaHReLP9GSzzPkzXQ/formResponse";
  const FORM_VIEW="https://docs.google.com/forms/d/e/1FAIpQLSeHTsDgpzZZKG1Uz1rNltKLOLUuOTmsIQaHReLP9GSzzPkzXQ/viewform";
  const FIELDS={
    kind:"entry.689706475",
    body:"entry.25719909",
    tool:"entry.1215590251",
    environment:"entry.1199012304",
    contact:"entry.1654610563"
  };

  const DEFAULT_PROBLEM_TYPES=[
    "功能不能用",
    "結果不對",
    "不知道怎麼操作",
    "畫面顯示異常",
    "下載／輸出問題",
    "其他"
  ];
  const DEFAULT_IDEA_TYPES=[
    "現有功能更好用",
    "新增功能",
    "手機版",
    "操作更簡單",
    "其他"
  ];

  const config=Object.assign({
    tool:"PrintReady",
    version:"",
    features:["其他"],
    problemTypes:DEFAULT_PROBLEM_TYPES,
    ideaTypes:DEFAULT_IDEA_TYPES
  },window.PrintReadyFeedbackConfig||{});

  let mode="bug";
  let mounted=false;

  function el(id){ return document.getElementById(id); }
  function esc(s){
    return String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function options(items){
    return (items||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  }
  function detectBrowser(){
    const ua=navigator.userAgent||"";
    if(/Edg\//.test(ua))return "Edge";
    if(/OPR\//.test(ua))return "Opera";
    if(/Chrome\//.test(ua))return "Chrome";
    if(/Firefox\//.test(ua))return "Firefox";
    if(/Safari\//.test(ua)&&!/Chrome\//.test(ua))return "Safari";
    return "其他瀏覽器";
  }
  function detectOS(){
    const ua=navigator.userAgent||"";
    const p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||"";
    if(/Windows/i.test(p)||/Windows/i.test(ua))return "Windows";
    if(/Android/i.test(ua))return "Android";
    if(/iPhone|iPad|iPod/i.test(ua))return "iPhone / iPad";
    if(/Mac/i.test(p)||/Mac OS/i.test(ua))return "macOS";
    if(/Linux/i.test(p)||/Linux/i.test(ua))return "Linux";
    return p||"未知系統";
  }
  function pageLabel(){
    try{
      const u=new URL(location.href);
      return u.pathname||"/";
    }catch(_){
      return location.pathname||"/";
    }
  }
  function envText(){
    return `${detectOS()} / ${detectBrowser()} / ${innerWidth}×${innerHeight}`;
  }
  function formFallbackUrl(kind){
    const p=new URLSearchParams();
    p.set("usp","pp_url");
    p.set(FIELDS.kind,kind);
    p.set(FIELDS.tool,config.tool);
    return `${FORM_VIEW}?${p.toString()}`;
  }

  function mount(){
    if(mounted)return;
    mounted=true;

    const wrap=document.createElement("div");
    wrap.id="prcFeedbackRoot";
    wrap.innerHTML=`
      <div class="prc-feedback-fabs" aria-label="PrintReady 回報工具">
        <a id="prcBugBtn" class="prc-feedback-fab" href="${esc(formFallbackUrl("🐞 問題回報"))}" target="_blank" rel="noopener noreferrer">🐞 回報問題</a>
        <a id="prcIdeaBtn" class="prc-feedback-fab" href="${esc(formFallbackUrl("💡 功能許願"))}" target="_blank" rel="noopener noreferrer">💡 功能許願</a>
      </div>

      <div id="prcBackdrop" class="prc-feedback-backdrop prc-hidden" role="dialog" aria-modal="true" aria-labelledby="prcTitle">
        <div class="prc-feedback-modal">
          <h3 id="prcTitle">🐞 回報問題</h3>
          <div id="prcHelp" class="prc-feedback-help">選一下狀況與功能，再告訴我們發生什麼事。</div>

          <div class="prc-feedback-grid">
            <div class="prc-field">
              <label id="prcTypeLabel" for="prcType">你遇到哪種狀況？</label>
              <select id="prcType"></select>
            </div>
            <div class="prc-field">
              <label id="prcFeatureLabel" for="prcFeature">發生在哪裡？</label>
              <select id="prcFeature"><option value="" selected disabled>請選擇功能</option>${options(config.features)}</select>
            </div>
          </div>

          <div class="prc-field">
            <label id="prcDescLabel" for="prcDesc">請描述發生什麼事</label>
            <textarea id="prcDesc"></textarea>
          </div>

          <div class="prc-field">
            <label id="prcExpectedLabel" for="prcExpected">你原本希望結果是什麼？（選填）</label>
            <textarea id="prcExpected" class="prc-short"></textarea>
          </div>

          <div class="prc-field">
            <label for="prcContact">聯絡方式（選填）</label>
            <input id="prcContact" type="text" autocomplete="email" placeholder="例如 Email">
          </div>

          <div id="prcResult" class="prc-result prc-hidden"></div>

          <div class="prc-actions">
            <button id="prcSend" class="prc-send" type="button">送出回報</button>
            <button id="prcClose" class="prc-close" type="button">關閉</button>
          </div>
          <div class="prc-fallback">如果頁內回報無法使用，右下角按鈕本身仍可直接開啟 Google 表單。</div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    el("prcBugBtn").addEventListener("click",e=>{e.preventDefault();open("bug")});
    el("prcIdeaBtn").addEventListener("click",e=>{e.preventDefault();open("idea")});
    el("prcClose").addEventListener("click",close);
    el("prcSend").addEventListener("click",send);
    el("prcBackdrop").addEventListener("click",e=>{if(e.target===el("prcBackdrop"))close()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!el("prcBackdrop").classList.contains("prc-hidden"))close()});
  }

  function open(kind){
    mode=kind==="idea"?"idea":"bug";
    const isBug=mode==="bug";

    el("prcTitle").textContent=isBug?"🐞 回報問題":"💡 功能許願";
    el("prcHelp").textContent=isBug
      ?"選一下狀況與功能，再告訴我們發生什麼事。"
      :"選一下改善方向與相關功能，再告訴我們你的想法。";

    el("prcTypeLabel").textContent=isBug?"你遇到哪種狀況？":"想改善哪一類？";
    el("prcFeatureLabel").textContent=isBug?"發生在哪裡？":"跟哪個功能有關？";
    el("prcDescLabel").textContent=isBug?"請描述發生什麼事":"希望怎麼改？";
    el("prcExpectedLabel").textContent=isBug?"你原本希望結果是什麼？（選填）":"為什麼你會需要這個功能？（選填）";

    el("prcType").innerHTML=options(isBug?config.problemTypes:config.ideaTypes);
    el("prcDesc").placeholder=isBug
      ?"例如：按下載後沒有反應，或輸出的檔案結果不對。"
      :"例如：希望可以一次處理多個檔案，並保留原本檔名。";
    el("prcExpected").placeholder=isBug
      ?"例如：希望按下下載後能正常取得檔案。"
      :"例如：我常常一次要處理很多檔案。";

    el("prcDesc").value="";
    el("prcExpected").value="";
    el("prcContact").value="";
    el("prcFeature").value="";
    el("prcResult").classList.add("prc-hidden");

    const sendBtn=el("prcSend");
    sendBtn.disabled=false;
    sendBtn.textContent=isBug?"送出回報":"送出許願";
    el("prcBackdrop").classList.remove("prc-hidden");
    setTimeout(()=>el("prcDesc").focus(),30);
  }

  function close(){
    el("prcBackdrop").classList.add("prc-hidden");
  }

  function buildBody(){
    const isBug=mode==="bug";
    const type=el("prcType").value||"其他";
    const feature=el("prcFeature").value;
    const desc=(el("prcDesc").value||"").trim();
    const expected=(el("prcExpected").value||"").trim();

    const lines=[
      `【${isBug?"狀況":"許願類型"}】${type}`,
      `【功能位置】${feature}`,
      `【${isBug?"描述":"希望怎麼改"}】${desc}`
    ];
    if(expected)lines.push(`【${isBug?"期待結果":"使用情境"}】${expected}`);
    lines.push(
      `【版本】${config.version||"未標示"}`,
      `【頁面】${pageLabel()}`,
      `【畫面】${innerWidth}×${innerHeight}`,
      `【時間】${new Date().toLocaleString()}`
    );
    return lines.join("\n");
  }

  async function send(){
    const feature=(el("prcFeature").value||"").trim();
    if(!feature){
      el("prcResult").classList.remove("prc-hidden");
      el("prcResult").textContent="⚠️ 請先選擇相關功能；真的不確定可以選「其他」。";
      el("prcFeature").focus();
      return;
    }

    const desc=(el("prcDesc").value||"").trim();
    if(!desc){
      el("prcResult").classList.remove("prc-hidden");
      el("prcResult").textContent=mode==="bug"?"⚠️ 請先描述發生什麼事。":"⚠️ 請先寫下希望怎麼改。";
      el("prcDesc").focus();
      return;
    }

    const isBug=mode==="bug";
    const btn=el("prcSend");
    btn.disabled=true;
    btn.textContent="正在送出…";
    el("prcResult").classList.remove("prc-hidden");
    el("prcResult").textContent="正在送出，請稍候…";

    const p=new URLSearchParams();
    p.set(FIELDS.kind,isBug?"🐞 問題回報":"💡 功能許願");
    p.set(FIELDS.body,buildBody());
    p.set(FIELDS.tool,config.tool);
    p.set(FIELDS.environment,envText());
    p.set(FIELDS.contact,(el("prcContact").value||"").trim());

    try{
      await fetch(FORM_ENDPOINT,{method:"POST",mode:"no-cors",body:p});
      el("prcResult").textContent=isBug?"✅ 問題回報已送出。":"✅ 功能許願已送出。";
      btn.textContent="✅ 已送出";
      setTimeout(close,1000);
    }catch(_){
      el("prcResult").innerHTML=
        `⚠️ 目前無法直接送出。<a href="${esc(formFallbackUrl(isBug?"🐞 問題回報":"💡 功能許願"))}" target="_blank" rel="noopener noreferrer">改用 Google 表單</a>`;
      btn.disabled=false;
      btn.textContent=isBug?"重新送出":"重新送出許願";
    }
  }

  function init(){
    if(!document.body)return;
    mount();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* PrintReady home media entry candidate.
   Runs only on the main home page; other tools that share feedback.js are untouched. */
(function(){
  "use strict";

  function mountHomeMediaEntry(){
    const home=document.getElementById("homeStart");
    if(!home||document.getElementById("printreadyMediaEntry"))return;

    const before=home.querySelector(".home-main-actions");
    if(!before)return;

    if(!document.getElementById("printreadyMediaEntryStyle")){
      const style=document.createElement("style");
      style.id="printreadyMediaEntryStyle";
      style.textContent=`
        .media-entry{
          display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;
          margin:0 0 11px;padding:13px 14px;border:1px solid #ddd6ea;border-radius:14px;
          background:#f7f5fb;color:var(--text);text-decoration:none;transition:.16s ease
        }
        .media-entry:hover{background:#f2eef9;border-color:#c5b8dc;transform:translateY(-1px)}
        .media-entry-icon{font-size:26px;line-height:1}
        .media-entry-title{font-size:14px;font-weight:950;margin-bottom:3px}
        .media-entry-sub{font-size:11px;line-height:1.5;color:var(--muted)}
        .media-entry-go{font-size:11px;font-weight:950;color:#66507f;white-space:nowrap}
        @media(max-width:520px){.media-entry{grid-template-columns:auto minmax(0,1fr)}.media-entry-go{grid-column:2}}
      `;
      document.head.appendChild(style);
    }

    const link=document.createElement("a");
    link.id="printreadyMediaEntry";
    link.className="media-entry";
    link.href="./media/index.html";
    link.target="_blank";
    link.rel="noopener";
    link.setAttribute("aria-label","開啟影音工具（新分頁）");
    link.innerHTML=`
      <span class="media-entry-icon">🎬</span>
      <span>
        <span class="media-entry-title">影音工具</span>
        <span class="media-entry-sub">影片／音樂轉檔、字幕、分割、合併、素材抽取，都在你的電腦本機處理。</span>
      </span>
      <span class="media-entry-go">開啟 ↗</span>
    `;
    home.insertBefore(link,before);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountHomeMediaEntry,{once:true});
  else mountHomeMediaEntry();
})();
