export const START_LOADING = 'START_LOADING'
export const STOP_LOADING = 'STOP_LOADING'

export const SET_ERROR = 'SET_ERROR'
export const CLEAR_ERROR = 'CLEAR_ERROR'


export interface StartLoadingAction {
    type: typeof START_LOADING
}

export interface StopLoadingAction {
    type: typeof STOP_LOADING
}

export interface SetErrorAction {
    type: typeof SET_ERROR,
    payload: string
}

export interface ClearErrorAction {
    type: typeof CLEAR_ERROR
}



export type UIActionTypes = StartLoadingAction | StopLoadingAction | SetErrorAction
 | ClearErrorAction