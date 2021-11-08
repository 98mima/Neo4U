const express = require('express');

const chatController = require('../controllers/chatRoom');

const router = express.Router();

router.get('/get/:room', chatController.getRoom);

//SIMILARITY
//nalazi najslicnijeg korisnika na osnovu istih topica u kojima su ucestvovali i vraca topice koje je najslicniji user like, dislike
router.get('/getJaccard/:name', chatController.getJaccard);
//nalazi najslicnijeg korisnika na osnovu toga kako su ocenili sa dislike iste topice i vraca topice u kojima je ucestvovao najslicniji user
router.get('/getEuclidean/:name', chatController.getEuclidean);
//nalazi najslicnijeg korisnika na osnovu toga kako su ocenili sa like iste topice i vraca topice koje je kreirao najslicniji user
router.get('/getPearson/:name', chatController.getPearson);
//nnalazi najslicnijeg korisnika (kojeg prati user) na osnovu ocena like/dislike za topice i vraca topice u kojima je ucestvovao najslicniji korisnik
router.get('/getCosine/:name', chatController.getCosine);

//TOPOLOGICAL LINK PREDICTION
//nalazi najslicnijeg usera na osnovu topica u kojima su ucestvovali i na osnovu topica koje su lajkovali i vraca topice koje je lajkovao najslicni user
router.get('/getAdamicAdar/:name', chatController.getAdamicAdar);
//same community
//nalazi najslicnijeg usera na osnovu topica koje su zajedno lajkovali ili dislike i vraca topice koje je kreirao ili u kojima je ucestvovao najslicni user


router.post('/add', chatController.addRoom);
router.post('/send', chatController.groupSendMessage);

module.exports = router;