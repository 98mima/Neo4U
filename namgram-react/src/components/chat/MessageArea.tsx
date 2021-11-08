import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Fab from '@material-ui/core/Fab';
import TextField from '@material-ui/core/TextField';
import SendIcon from '@material-ui/icons/SendOutlined';
import { useParams } from 'react-router-dom';
import { RootState } from '../../redux';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadChat,
  loadRoom,
  sendGroupMessage,
  sendMessage,
} from '../../redux/chat/actions';
import moment from 'moment';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  chatSection: {
    width: '100%',
    height: '80vh',
  },
  headBG: {
    backgroundColor: '#e0e0e0',
  },
  borderRight500: {
    borderRight: '1px solid #e0e0e0',
  },
  messageArea: {
    height: '70vh',
    overflowY: 'auto',
  },
  myMessage: {
    textAlign: 'right',
  },
  theirMessage: {
    textAlign: 'left',
  },
});

function MessageArea(props: { isGroupChat?: boolean }) {
  const { isGroupChat = false } = props;

  const { username, name } = useParams<{ username: string; name: string }>();

  const classes = useStyles();
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');

  const auth = useSelector((state: RootState) => state.auth.auth);
  const chatter = useSelector((state: RootState) => state.chat.chatter);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const socket = useSelector((state: RootState) => state.auth.socket);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.currentTarget.value);
  };

  const handleSendMessage = () => {
    setNewMessage('');
    if (isGroupChat) {
      dispatch(
        sendGroupMessage(auth?.username as string, name as string, newMessage),
      );
    } else
      dispatch(
        sendMessage(
          auth?.username as string,
          chatter?.username as string,
          newMessage,
        ),
      );
    socket?.emit('chat', {
      from: auth?.username,
      to: chatter?.username,
      body: newMessage,
    });
  };

  useEffect(() => {
    if (auth) {
      if (!isGroupChat) dispatch(loadChat(auth?.username as string, username));
      else dispatch(loadRoom(name, auth.username));
    }
  }, [auth, username, name, isGroupChat, dispatch]);

  return (
    <React.Fragment>
      {(username || name) && (
        <Grid item xs={9}>
          <List className={classes.messageArea}>
            {messages.map((message, i) => (
              <ListItem key={i}>
                <Grid
                  container
                  className={
                    message.myMessage ? classes.myMessage : classes.theirMessage
                  }
                >
                  {isGroupChat && (
                    <Grid item xs={12}>
                      <ListItemText secondary={message.sender}></ListItemText>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <ListItemText
                      secondary={moment(message.date).fromNow()}
                    ></ListItemText>
                  </Grid>

                  <Grid item xs={12}>
                    <ListItemText primary={message.body}></ListItemText>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Grid container style={{ padding: '20px' }}>
            <Grid item xs={11}>
              <TextField
                value={newMessage}
                onChange={onChange}
                label="Type Something"
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <Fab onClick={handleSendMessage} color="primary" aria-label="add">
                <SendIcon />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
      )}
    </React.Fragment>
  );
}

export default MessageArea;
