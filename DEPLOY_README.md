# PrintReady WEB INTEGRATED V1.2｜2026-10-11

網站結構：
- `/index.html`：幫我印好 PUBLIC V1.4 主站
- `/excel/index.html`：PrintReady Excel V1

V1.2 整合更新：
- Excel 頁新增「回報問題 / 功能許願」，送到既有 PrintReady Google Form。
- Excel 回報會自動標示工具為 `📊 Excel 幫我整理`。
- Excel 成功載入真實 Excel / CSV 後，匿名送出 `excel` 功能代碼到既有使用狀況 Worker。
- 不送檔名、Excel / CSV 內容或個人資料。
- 原本「幫我印好」與 Excel 核心功能不改。

另外需要同步部署：
1. Cloudflare Usage Worker 更新到 `PrintReady_USAGE_WORKER_V1.2_EXCEL.js`，才能接受 `excel` 事件並在「PrintReady 使用狀況」顯示。
2. Google Form 若「使用工具」欄是選項題，新增 `📊 Excel 幫我整理`；若是簡答題則不用改欄位結構。
