// A union type allows only one of these exact strings. TypeScript reports an
// error during development if code tries to use an unsupported value.
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Attachment {
  id: string
  filename: string
  content_type: string
  size: number
  uploaded_at: string
}

// An interface describes the required shape of an object. This mirrors the
// complete Task model returned by the FastAPI backend.
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  created_at: string
  updated_at: string
  attachments: Attachment[]
}

// Draft cards exist only in React until the user clicks Save.
export interface TaskItem extends Task {
  isDraft?: boolean
}

// New tasks do not include id or timestamps because the backend creates them.
export interface TaskCreate {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

// Partial<T> makes every property in TaskCreate optional. That lets an update
// contain only the fields that the user changed.
export type TaskUpdate = Partial<TaskCreate>
 
