export type NoteType = 'text' | 'link' | 'image' | 'file'

export interface Note {
  id: string
  type: NoteType
  content: string
  createdAt: string
  fileName?: string
  mimeType?: string
  size?: number
}

export type ItemStatus = 'Do zrobienia' | 'W trakcie' | 'Zrobione'

export interface Item {
  id: string
  title: string
  checked: boolean
  favorite: boolean
  status: ItemStatus
  dueDate?: string
  cost?: number
  notes: Note[]
}

export interface Section {
  id: string
  title: string
  items: Item[]
}

export interface PlannerData {
  sections: Section[]
}
