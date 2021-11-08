import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import MessageArea from './MessageArea';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadRoom } from '../../redux/chat/actions';
import { RootState } from '../../redux';

const useStyles = makeStyles({
  chatSection: {
    width: '100%',
    height: '80vh',
  },
});

// type MessageRoom = {
//     message: string;
//     messages: Array<{sender: string, message: string, date: string}>;
//     chatters: Array<IUser>
// }

const Chat = () => {
  const { name } = useParams<{ name: string }>();
  const classes = useStyles();

  return (
    <div>
      <Grid container component={Paper} className={classes.chatSection}>
        <div
          style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: '20px' }}
        >
          Room: {name}
        </div>
        <MessageArea isGroupChat />
      </Grid>
    </div>
  );
};

export default Chat;
