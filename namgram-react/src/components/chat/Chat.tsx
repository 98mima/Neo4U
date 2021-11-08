import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import MessageArea from "./MessageArea";
import ChatHeads from "./ChatHeads";
import { useParams } from "react-router-dom";

const useStyles = makeStyles({
  chatSection: {
    width: "100%",
    height: "80vh",
  },
});

const Chat = () => {
  const { username } = useParams<{ username: string }>();
  const classes = useStyles();

  return (
    <div>
      <Grid container component={Paper} className={classes.chatSection}>
        <ChatHeads />
        {username && <MessageArea />}
      </Grid>
    </div>
  );
};

export default Chat;
