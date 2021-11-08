import React from 'react';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/styles';
import { Card, Typography } from '@material-ui/core';

const useStyles = makeStyles({
  card: {
    width: 'auto',
    height: '100%',
    padding: '24px',
    border: '2px solid none',
    borderRadius: '8px',
    boxSizing: 'border-box',
    marginLeft: '12px',
  },
});

type AlgorithmCardProps = {
  className?: string;
  title: string;
  onClick: () => void;
};

const AlgorithmCard: React.FC<AlgorithmCardProps> = (
  props: AlgorithmCardProps,
) => {
  const { className, title, onClick } = props;

  const materialClasses = useStyles();
  const classes = classNames('algorithm-card', materialClasses, className);

  return (
    <Card
      style={{
        marginTop: '10px',
        background: 'whitesmoke',
      }}
      className={materialClasses.card}
      onClick={onClick}
    >
      <Typography variant="h6">{title}</Typography>
    </Card>
  );
};

export default AlgorithmCard;
