const express = require("express");

const personController = require("../controllers/person");

const router = express.Router();

router.get("/all", personController.getAll);
router.get("/byId/:id", personController.get);
router.get("/byEmail/:email", personController.getByEmail);
router.get("/byUsername/:username", personController.getByUsername);
router.get("/getFollowing/:username", personController.getFollowing);
router.get("/getFollowers/:username", personController.getFollowers);
router.get(
  "/getRecommendedPeople/:username",
  personController.getRecommendedPeople
);
router.get(
  "/getRecommendedImages/:username",
  personController.getRecommendedImages
);
router.post("/follow", personController.follow);
router.post("/unfollow", personController.unfollow);
router.delete("/delete/:username", personController.deletePerson);

module.exports = router;
