import type { AlfredAPI } from '../shared/types'

declare global {
  interface Window {
    alfred: AlfredAPI
  }
}
