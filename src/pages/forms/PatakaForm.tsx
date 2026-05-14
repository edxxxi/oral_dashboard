import { useState } from 'react'
import type { PatakaAssessment } from '../../store/types'

type PatakaFormProps = {
  defaultPataka?: PatakaAssessment
  allowEdit: boolean
  onUploadAudio: (file: File) => Promise<Pick<PatakaAssessment, 'audioPath' | 'audioFileName' | 'uploadedAt' | 'uploadedBy'>>
  onDownloadAudio: (audioPath: string, audioFileName?: string) => Promise<void>
  onSubmit: (patch: { nursingData: { pataka: PatakaAssessment }; notes?: string }) => Promise<void> | void
  onSwitchResident?: () => void
}

export function PatakaForm({
  defaultPataka,
  allowEdit,
  onUploadAudio,
  onDownloadAudio,
  onSubmit,
  onSwitchResident,
}: PatakaFormProps) {
  const [db60Passed, setDb60Passed] = useState(Boolean(defaultPataka?.db60Passed ?? defaultPataka?.db50Passed))
  const [clarityPassed, setClarityPassed] = useState(Boolean(defaultPataka?.clarityPassed))
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audioMeta, setAudioMeta] = useState<Pick<PatakaAssessment, 'audioPath' | 'audioFileName' | 'uploadedAt' | 'uploadedBy'>>({
    audioPath: defaultPataka?.audioPath,
    audioFileName: defaultPataka?.audioFileName,
    uploadedAt: defaultPataka?.uploadedAt,
    uploadedBy: defaultPataka?.uploadedBy,
  })
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const hasVoiceRisk = !(db60Passed && clarityPassed)

  const handleSave = async () => {
    if (!allowEdit || saving) return
    setSaving(true)
    try {
      let nextMeta = { ...audioMeta }
      if (selectedFile) {
        nextMeta = await onUploadAudio(selectedFile)
        setAudioMeta(nextMeta)
        setSelectedFile(null)
      }

      await onSubmit({
        nursingData: {
          pataka: {
            db60Passed,
            clarityPassed,
            ...nextMeta,
          },
        },
        notes: notes.trim() || undefined,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '儲存失敗'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!audioMeta.audioPath || downloading) return
    setDownloading(true)
    try {
      await onDownloadAudio(audioMeta.audioPath, audioMeta.audioFileName)
    } catch (error) {
      const message = error instanceof Error ? error.message : '下載失敗'
      alert(message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '26px', fontWeight: 500, lineHeight: 1.6 }}>
          💡 說明：Pataka 聲音評估請以「是 / 否」勾選。
          <br />
          1. 聲音是否達 60 分貝
          <br />
          2. 聲音是否明晰
          <br />
          若兩項任一為「否」，判定為口說不良風險。
        </p>
      </div>

      {!allowEdit && (
        <div style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', borderRadius: '8px', padding: '12px 16px' }}>
          目前僅護理人員與主管可新增 Pataka 評估；你仍可下載既有音檔。
        </div>
      )}

      <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#111827' }}>聲音檔案</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept="audio/*"
            disabled={!allowEdit || saving}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: '18px' }}
          />
          {audioMeta.audioPath && (
            <button className="btn btn--sub" type="button" disabled={downloading} onClick={handleDownload}>
              {downloading ? '下載中…' : `下載既有音檔${audioMeta.audioFileName ? `（${audioMeta.audioFileName}）` : ''}`}
            </button>
          )}
        </div>
        {selectedFile && <p style={{ marginTop: '12px', color: '#374151' }}>待上傳：{selectedFile.name}</p>}
      </div>

      <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', color: '#111827' }}>聲音評估（是 / 否）</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '22px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>題目</th>
              <th style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #e5e7eb', width: 90 }}>是</th>
              <th style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #e5e7eb', width: 90 }}>否</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px 10px' }}>聲音是否達 60 分貝</td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="radio"
                  name="pataka-db60"
                  checked={db60Passed}
                  disabled={!allowEdit || saving}
                  onChange={() => setDb60Passed(true)}
                  style={{ width: '24px', height: '24px' }}
                />
              </td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="radio"
                  name="pataka-db60"
                  checked={!db60Passed}
                  disabled={!allowEdit || saving}
                  onChange={() => setDb60Passed(false)}
                  style={{ width: '24px', height: '24px' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 10px' }}>聲音是否明晰</td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="radio"
                  name="pataka-clarity"
                  checked={clarityPassed}
                  disabled={!allowEdit || saving}
                  onChange={() => setClarityPassed(true)}
                  style={{ width: '24px', height: '24px' }}
                />
              </td>
              <td style={{ textAlign: 'center' }}>
                <input
                  type="radio"
                  name="pataka-clarity"
                  checked={!clarityPassed}
                  disabled={!allowEdit || saving}
                  onChange={() => setClarityPassed(false)}
                  style={{ width: '24px', height: '24px' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div
          style={{
            marginTop: '14px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: hasVoiceRisk ? '#fef2f2' : '#f0fdf4',
            color: hasVoiceRisk ? '#991b1b' : '#166534',
            border: `1px solid ${hasVoiceRisk ? '#fecaca' : '#bbf7d0'}`,
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          {hasVoiceRisk ? '⚠️ 口說不良風險' : '✅ 無口說不良風險'}
        </div>
      </div>

      <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', color: '#111827' }}>備註</h3>
        <textarea
          value={notes}
          disabled={!allowEdit || saving}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="可填寫檢測時狀況、操作說明等"
          style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '18px' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn" type="button" disabled={!allowEdit || saving} onClick={() => { void handleSave() }}>
          {saving ? '儲存中…' : '儲存 Pataka 評估'}
        </button>
        {onSwitchResident && (
          <button className="btn btn--sub" type="button" onClick={onSwitchResident}>
            🔄 切換住民
          </button>
        )}
      </div>
    </div>
  )
}
