'use client'

import { useState } from 'react'
import JewelleryTab   from './tabs/JewelleryTab'
import MaterialsTab   from './tabs/MaterialsTab'
import CategoriesTab  from './tabs/CategoriesTab'
import ProcessesTab   from './tabs/ProcessesTab'

const TABS = [
  { id: 'jewellery',  label: 'Jewellery Stock' },
  { id: 'materials',  label: 'Materials' },
  { id: 'categories', label: 'Categories' },
  { id: 'processes',  label: 'Processes' },
]

export default function InventoryPage() {
  const [tab, setTab] = useState('jewellery')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '4px',
        width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 18px', borderRadius: '7px', fontSize: '13px',
            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: tab === t.id ? 'rgba(201,168,76,0.15)' : 'transparent',
            color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 500 : 400,
            outline: tab === t.id ? '0.5px solid var(--border-bright)' : 'none',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'jewellery'  && <JewelleryTab />}
      {tab === 'materials'  && <MaterialsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'processes'  && <ProcessesTab />}
    </div>
  )
}