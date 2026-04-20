import { useState } from 'react'
import { Topbar } from '../components/Topbar'
import { useSelectedResident, useStore } from '../store/store'
import type { DietType, FeedingMethod } from '../store/types'
import { formatDateTime } from '../utils/date'

const feedingLabel: Record<string, string> = {
  oral: '經口進食',
  ng_tube: '鼻餵管',
  gastrostomy: '胃造廔',
}

const dietTypeLabel: Record<string, string> = {
  full: '硬 / 普通',
  soft: '軟',
  liquid: '流質',
}

export default function ResidentsBasicsPage() {
  const resident = useSelectedResident()
  const { dispatch } = useStore()

  const [medicalSummary, setMedicalSummary] = useState(resident?.medicalSummary ?? '')
  const [oralCheckNotes, setOralCheckNotes] = useState(resident?.oralCheckNotes ?? '')

  if (!resident) {
    return (
      <div className="page">
        <Topbar />
        <div className="page__header">
          <h1>分頁 B｜住民基本資料</h1>
          <p className="muted">請先從上方選擇住民</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar />
      <div className="page__header">
        <div>
          <h1>分頁 B｜住民基本資料</h1>
          <p className="muted">{resident.bedNo}｜{resident.name}（{resident.age} 歲）</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section className="card">
          <div className="card__title">1. 基本資料 / 病歷摘要 / 口腔檢查表（可由社工上傳紙本）</div>

          <label className="field">
            <span className="label">病歷摘要（示意）</span>
            <textarea
              value={medicalSummary}
              onChange={(e) => setMedicalSummary(e.target.value)}
              rows={4}
              placeholder="中風 / 慢性病 / 既往史…"
            />
          </label>

          <label className="field">
            <span className="label">口腔檢查表備註（示意）</span>
            <textarea
              value={oralCheckNotes}
              onChange={(e) => setOralCheckNotes(e.target.value)}
              rows={4}
              placeholder="牙齒/假牙狀態、口腔衛生、疼痛等"
            />
          </label>

          <div className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
            <button
              className="btn"
              onClick={() =>
                dispatch({
                  type: 'update_resident',
                  id: resident.id,
                  patch: { medicalSummary, oralCheckNotes },
                })
              }
            >
              儲存
            </button>
          </div>

          <div className="divider" />

          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <label className="field" style={{ minWidth: 280 }}>
              <span className="label">上傳紙本（僅記錄檔名）</span>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  for (const f of files) dispatch({ type: 'add_attachment', residentId: resident.id, name: f.name })
                  e.currentTarget.value = ''
                }}
              />
            </label>
          </div>

          {resident.attachments.length ? (
            <ul className="list">
              {resident.attachments.map((a) => (
                <li key={a.id}>
                  <span className="muted">{formatDateTime(a.addedAt)}</span> — {a.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">尚無附件</p>
          )}
        </section>

        <section className="card">
          <div className="card__title">2. 目前飲食狀況</div>

          <label className="field">
            <span className="label">a. 進食方式</span>
            <select
              value={resident.dietStatus.feedingMethod}
              onChange={(e) =>
                dispatch({
                  type: 'update_resident',
                  id: resident.id,
                  patch: {
                    dietStatus: { ...resident.dietStatus, feedingMethod: e.target.value as FeedingMethod },
                  },
                })
              }
            >
              <option value="oral">經口進食</option>
              <option value="ng_tube">鼻餵管</option>
              <option value="gastrostomy">胃造廔</option>
            </select>
          </label>

          <label className="field">
            <span className="label">b. 餐食類型</span>
            <select
              value={resident.dietStatus.dietType}
              onChange={(e) =>
                dispatch({
                  type: 'update_resident',
                  id: resident.id,
                  patch: {
                    dietStatus: { ...resident.dietStatus, dietType: e.target.value as DietType },
                  },
                })
              }
            >
              <option value="full">硬 / 普通</option>
              <option value="soft">軟</option>
              <option value="liquid">流質</option>
            </select>
          </label>

          <label className="field">
            <span className="label">c. 口語治療師建議事項</span>
            <textarea
              value={resident.dietStatus.slpNotes}
              onChange={(e) =>
                dispatch({
                  type: 'update_resident',
                  id: resident.id,
                  patch: {
                    dietStatus: { ...resident.dietStatus, slpNotes: e.target.value },
                  },
                })
              }
              rows={4}
            />
          </label>

          <label className="field">
            <span className="label">d. 營養師建議事項</span>
            <textarea
              value={resident.dietStatus.dietitianNotes}
              onChange={(e) =>
                dispatch({
                  type: 'update_resident',
                  id: resident.id,
                  patch: {
                    dietStatus: { ...resident.dietStatus, dietitianNotes: e.target.value },
                  },
                })
              }
              rows={4}
            />
          </label>

          <div className="hint">
            <div className="hint__title">快速摘要</div>
            <div className="hint__body">
              <div>進食方式：{feedingLabel[resident.dietStatus.feedingMethod]}</div>
              <div>餐食類型：{dietTypeLabel[resident.dietStatus.dietType]}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
