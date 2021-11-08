import { START_LOADING, STOP_LOADING, SET_ERROR, CLEAR_ERROR, UIActionTypes } from "./actions"

export interface UIState{
    loading: boolean,
    error: string,
}

const initialState: UIState = {
    error: "",
    loading: false,
}

export default (state = initialState, action: UIActionTypes) => {
    switch(action.type){
        case START_LOADING:
            return {...state, loading: true}
        case STOP_LOADING:
            return {...state, loading: false}
        case SET_ERROR:
            return {...state, error: action.payload}
        case CLEAR_ERROR:
            return {...state, error: ''}
        default:
            return {...state}
    }
}