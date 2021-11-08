import { IMessage } from "../../models/chat"
import { IUser } from "../../models/user"
import { ChatActionTypes, SET_CHAT_HEADS, CLEAR_CHAT_HEADS, CLEAR_NEW_MESSAGES, MESSAGE_SENT, MESSAGE_GROUP_SENT, LOAD_CHAT, LOAD_ROOM, NEW_MESSAGE, CLEAR_CHAT } from "./actions"


export interface ChatState{
    chatHeads: IUser[],
    chatter: IUser | undefined,
    messages: IMessage[],
    chatNotifications: number
}

const initialState: ChatState = {
    chatHeads: [],
    chatter: undefined,
    messages: [],
    chatNotifications: 0
}

// eslint-disable-next-line import/no-anonymous-default-export
export default (state = initialState, action: ChatActionTypes) => {
    switch(action.type){
        case SET_CHAT_HEADS:
            return {...state, chatHeads: action.payload}
        case CLEAR_CHAT_HEADS:
            return {...state, chatHeads: []}
        // case NEW_MESSAGE:
        //     return {...state, chatNotifications: state.chatNotifications + 1, 
        //         chat: {chatter: (state.chat as IChat).chatter, 
        //             messages: [...(state.chat as IChat).messages, action.payload]}}
        case LOAD_CHAT:
            return {...state, messages: action.payload.messages, chatter: action.payload.chatter}
        case LOAD_ROOM:
            {  console.log(action.payload) 
                return {...state, messages: action.payload.messages, chatter: action.payload.chatter}}
        case NEW_MESSAGE:
            return {...state, chatNotifications: state.chatNotifications + 1}
        case CLEAR_NEW_MESSAGES:
            return {...state, chatNotifications: 0}
        case MESSAGE_SENT:
            return {...state, messages: [...state.messages, action.payload]}
        case MESSAGE_GROUP_SENT:
                return {...state, messages: [...state.messages, action.payload]}
        case CLEAR_CHAT:
            return {...state, messages: [], chatter: undefined, chatHeads: []}
        default:
            return {...state}
    }
}