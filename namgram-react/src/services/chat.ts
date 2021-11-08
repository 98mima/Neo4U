import axios from "axios";

export async function sendToUser(from: string, to: string, content: string) {
  return axios
    .post(`chat/send`, {
      usernameSender: from,
      usernameReceiver: to,
      message: content,
    })
    .then((res) => res.data);
}

export async function sendToGroup(from: string, to: string, content: string) {
    return axios
      .post(`room/send`, {
        sender: from,
        room: to,
        message: content,
      })
      .then((res) => res.data);
  }

export async function loadUserMessages(username: string, username2: string) {
  return axios
    .post<{ messages: { sender: string; message: string; date: string }[] | any[] }>(
      `chat/join`, {username, username2}
    )
    .then((res) => {
      if(res.data.messages)
        return res.data.messages;
      else
        return res.data;
    });
}

export async function getActiveUsers(username: string){
  return axios.get<{chatters: string[]}>(`chat/getActive/${username}`)
    .then(res => res.data.chatters);
}

export async function getRecommended(name?: string, algorithm?: string){
    return axios
    .get<{ rooms: Array<any>}>(`room/getJaccard/${name}`)
    .then((res) => {
          console.log(algorithm)
        return res.data;
      })
  }

export async function getJaccard(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/getJaccard/${name}`)
      .then((res) => {
        return res.data;
      })
  }
  
  export async function getEuclidean(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/getEuclidean/${name}`)
      .then((res) => {
        return res.data;
      })
  }
  export async function getPearson(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/getPearson/${name}`)
      .then((res) => {
        return res.data;
      })
  } export async function getCosine(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/getCosine/${name}`)
      .then((res) => {
        return res.data;
      })
  } 
  export async function getAdamicAdar(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/getAdamicAdar/${name}`)
      .then((res) => {
        return res.data;
      })
  }

  export async function getRoom(name?: string){
    return axios
      .get<{ rooms: Array<any>}>(`room/get/${name}`)
      .then((res) => {
          console.log('stize soba')
          console.log(res.data)
        return res.data;
      })
  }

  export async function getRec( algorithm: string,name?: string){
    return axios
      .get<{ posts: Array<any>}>(`room/get${algorithm}/${name}`)
      .then((res) => {
          console.log('algoritam: ' + algorithm)
          console.log(res.data)
        return res.data;
      })
  }
