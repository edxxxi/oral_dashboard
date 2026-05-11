# 高齡吞嚥風險防範｜口腔功能統合儀表板
## 功能與分頁

### Dashboard（首頁）
- 住民清單總覽（床號/姓名）
- 風險紅黃綠燈（示意演算法）
- 搜尋與風險篩選
- 風險分佈圖

### 分頁 A｜系統管理
1. 工作人員帳號管理（新增/停用）
2. 系統使用回饋（可送出回饋、狀態切換）

### 分頁 B｜住民基本資料
1. 基本資料 / 病歷摘要 / 口腔檢查表（可「選檔」上傳，原型僅記錄檔名）
2. 目前飲食狀況
   - 進食方式：經口 / 鼻餵管 / 胃造廔
   - 餐食類型：普通 / 軟 / 流質
   - 口語治療師、營養師建議事項

### 分頁 C｜評估量表
提供四大跨專業臨床評估工具（具備自動計分與風險判定功能）：
1. **EAT-10 吞嚥能力篩檢**（照服員/語言治療師）
2. **MNA-SF 簡易營養篩檢表**（營養師）
3. **咀嚼能力篩檢**
4. **認知功能評估**（SPMSQ 簡易精神狀態檢查）

### 分頁 D｜綜合分析報告
- **AI 綜合風險判定**（紅黃綠燈視覺化）
- **系統餐食建議**與詳細備餐指導（普通/軟質/流質飲食）
- **認知功能評估指標看板**（直接呈現最新 SPMSQ 判定）
- **歷史趨勢變化圖**（以動態折線圖追蹤數月內的體重與風險等級變化）

---

## 如何在本機啟動

### 1) 安裝套件（第一次才需要）
```bash
npm install
```

### 2) 啟動開發伺服器
```bash
npm run dev
```

### 3) 打開瀏覽器
終端機會顯示類似：
- `Local: http://localhost:5173/`

用瀏覽器開啟該網址即可。

---

## 正式環境：Supabase 帳號與權限管理

本專案已改為：
- 使用 **Supabase Auth** 登入
- 由 **主管（admin）** 在系統管理頁手動建立/停用/刪除帳號、手動設定密碼
- 其他角色必須先由主管建立帳號後才能登入

### 1) 前端環境變數
建立 `.env`（或部署平台環境變數）：

```bash
VITE_SUPABASE_URL=你的Supabase專案URL
VITE_SUPABASE_ANON_KEY=你的Supabase anon key
```

### 2) 建立資料表與 RLS
到 Supabase SQL Editor 執行：

`supabase/sql/001_auth_staff.sql`

`supabase/sql/002_assessment_scales.sql`（建立評估量表題庫並匯入 EAT-10 / MNA-SF / SPMSQ / RSST 題目）

### 3) 部署管理帳號用的 Edge Function
先安裝並登入 Supabase CLI，然後在專案根目錄執行：

```bash
supabase functions deploy admin-staff --no-verify-jwt=false
```

> `admin-staff` 會使用 `SUPABASE_SERVICE_ROLE_KEY` 做帳號建立/刪除/改密碼，僅允許已登入且為主管角色的人呼叫。

### 4) 建立第一個主管帳號（只做一次）
1. 在 Supabase Dashboard → Authentication → Users 手動新增第一個主管使用者（email/password）。
2. 回到 SQL Editor，依 `001_auth_staff.sql` 內註解，把該使用者寫入 `public.staff_accounts`，角色設為 `admin`。

完成後，即可用該主管登入系統並管理其他帳號。
