import { IUser } from "./user";

export interface IMessage {
  myMessage: boolean;
  date: string;
  body: string;

  sender?: string;
}

export interface IChat {
  chatter: IUser;
  messages: IMessage[];
}
