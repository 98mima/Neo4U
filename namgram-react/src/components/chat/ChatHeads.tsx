import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux';
import { CLEAR_NEW_MESSAGES, loadChatHeads } from '../../redux/chat/actions';
import { IUser } from '../../models/user';
import { useHistory } from 'react-router-dom';

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
});

function ChatHeads() {
  const classes = useStyles();
  const history = useHistory();
  const auth = useSelector((state: RootState) => state.auth.auth);
  const chatHeads = useSelector((state: RootState) => state.chat.chatHeads);
  const dispatch = useDispatch();

  useEffect(() => {
    if (auth) dispatch(loadChatHeads(auth.username));
    return () => {};
  }, [auth]);

  return (
    <Grid item xs={3} className={classes.borderRight500}>
      <List>
        {chatHeads &&
          chatHeads.map((user: IUser) => (
            <ListItem
              button
              key={user.id}
              onClick={() => {
                dispatch({ type: CLEAR_NEW_MESSAGES });
                history.push(`/chat/${user.username}`);
              }}
            >
              <ListItemIcon>
                <Avatar alt="Remy Sharp" src={user.profilePic} />
              </ListItemIcon>
              <ListItemText primary={`${user.name} ${user.lastname}`}>
                Remy Sharp
              </ListItemText>
            </ListItem>
          ))}
      </List>
    </Grid>
  );
}

export default ChatHeads;
