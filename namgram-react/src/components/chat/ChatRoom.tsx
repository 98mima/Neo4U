import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import AlgorithmCard from './components/AlghoritamCard';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { useToasts } from 'react-toast-notifications';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux';
import {
  getJaccard,
  getCosine,
  getAdamicAdar,
  getEuclidean,
  getPearson,
  getRoom,
} from '../../services/chat';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
    padding: '0px 120px',
    boxSizing: 'border-box',
  },
  algorithms: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

type AlgorithmTypes =
  | 'Jaccard'
  | 'Cosine'
  | 'Pearse'
  | 'Euclidean'
  | 'AdamicAdar';

const ChatRoom: React.FC = (props) => {
  const materialClasses = useStyles();

  const history = useHistory();

  const { addToast } = useToasts();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmTypes>();
  const [recommendedRooms, setRecommendedRooms] = useState<Array<any>>();

  const auth = useSelector((state: RootState) => state.auth.auth);

  console.log(recommendedRooms);

  const algorithms = useMemo(
    () =>
      [
        { name: 'Jaccard' },
        { name: 'Cosine' },
        { name: 'Pearse' },
        { name: 'Euclidean' },
        { name: 'AdamicAdar' },
      ] as Array<{ name: AlgorithmTypes }>,
    [],
  );

  const loadSelectedAgorithmRooms = useCallback(
    async (algorithm: AlgorithmTypes) => {
      try {
        switch (algorithm) {
          case 'Jaccard': {
            const { rooms } = await getJaccard(auth?.name);
            setRecommendedRooms(rooms);
            break;
          }
          case 'Cosine': {
            const { rooms } = await getCosine(auth?.name);
            setRecommendedRooms(rooms);
            break;
          }
          case 'Euclidean': {
            const { rooms } = await getEuclidean(auth?.name);
            setRecommendedRooms(rooms);
            break;
          }
          case 'Pearse': {
            const { rooms } = await getPearson(auth?.name);
            setRecommendedRooms(rooms);
            break;
          }
          case 'AdamicAdar': {
            const { rooms } = await getAdamicAdar(auth?.name);
            setRecommendedRooms(rooms);
            break;
          }
          default:
        }
      } catch (e) {
        addToast('ne radi', { appearance: 'error' });
      }
    },
    [addToast, auth],
  );

  useEffect(() => {
    if (!selectedAlgorithm) return;

    loadSelectedAgorithmRooms(selectedAlgorithm);
    setDialogOpen(true);
  }, [loadSelectedAgorithmRooms, selectedAlgorithm]);

  return (
    <div className={materialClasses.root}>
      <Typography variant="h6" className={materialClasses.text}>
        Choose algorithm to display recommended rooms
      </Typography>

      <div className={materialClasses.algorithms}>
        {algorithms.map((alghoritam) => (
          <AlgorithmCard
            title={alghoritam.name}
            onClick={async () => {
              setSelectedAlgorithm(alghoritam.name);
            }}
          />
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'pointer' }} id="draggable-dialog-title">
          Recommended rooms by selected algorithm:
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {recommendedRooms ? (
              <div>
                {recommendedRooms?.map((room) => (
                  <AlgorithmCard
                    title={room.name}
                    onClick={() => {
                      console.log(room.name + ', pribavljanje poruka');
                      getRoom(room.name);
                      history.push(`/room/${room.name}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div>There are no recommended rooms</div>
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatRoom;
