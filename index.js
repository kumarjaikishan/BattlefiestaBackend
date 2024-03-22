const express = require('express');
const app = express();
require('./conn/conn')
const port = process.env.PORT || 5000;
const router = express.Router();
const cors = require('cors')
const login = require('./controller/login_controller')
const checkmembership = require('./utils/checkmembership')
const tournament = require('./controller/tournament_controller')
const tournaentry = require('./controller/tournment_entry_controller')
const Matches = require('./controller/match_controller')
const authmiddlewre = require('./middleware/auth_middleware')
const errorHandle = require('./utils/error_util');
const upload = require('./middleware/multer_middleware')
const upload2 = require('./middleware/multer2')
const emailauth = require('./middleware/email_auth')
const contact = require('./controller/contact_controller')
const member = require('./controller/membership_controller')
const isadmin = require('./middleware/isadmin_middleware')
const admin = require('./controller/admin_controller')

app.use(express.json());
app.use(cors());
app.use(router);
app.use(errorHandle);

app.get('/', (req, res) => {
  return res.status(200).json({
    msg: "Welcome to the Esport Backend"
  })
})

router.route('/signup').post(login.signup, emailauth);    //used
router.route('/login').post(emailauth, login.login);      //used
router.route('/verify').get(login.verify);      //used
router.route('/passreset').get(authmiddlewre,login.passreset);      //used
router.route('/setpassword').post(login.setpassword);      //used
router.route('/checkmail').post(login.checkmail);      //used

router.route('/addtournament').post(authmiddlewre,checkmembership, tournament.addtournament);      //used
router.route('/torunadelete').post(authmiddlewre, tournament.torunadelete);      //used
router.route('/gettournament').get(authmiddlewre, tournament.gettournament);      //used
router.route('/getontournament').post(authmiddlewre, tournament.getontournament);      //used
router.route('/getonetournament').post(tournament.getonetournament);      //used
router.route('/getalltournament').get(tournament.getalltournament);      //used
router.route('/settournament').post(authmiddlewre, tournament.settournament);      //used
router.route('/settournamentlogos').post(authmiddlewre, upload.single('image'), tournament.settournamentlogos);      //used
router.route('/tournamentform').post(authmiddlewre, tournament.tournamentform);      //used
router.route('/gettournamentform').post(tournament.gettournamentform);      //used
router.route('/getenteries').post(tournament.getenteries);      //used
router.route('/updatetournamentform').post(authmiddlewre, tournament.updatetournamentform); //used
router.route('/updatetournamentformcontacts').post(authmiddlewre, tournament.updatetournamentformcontacts); //used
router.route('/pointsystem').post(authmiddlewre, tournament.pointsystem); //used

router.route('/updateteamstatus').post(authmiddlewre, tournaentry.updateteamstatus); //used

// router.route('/Teamregister').post(upload.single('teamLogo'),tournaentry.register);      //used
router.route('/Teamregister').post(upload2.fields([{ name: 'teamLogo', maxCount: 1 }, { name: 'paymentScreenshot', maxCount: 1 }]), tournaentry.register);      //used
router.route('/Teamupdate').post(upload.single('teamLogo'), tournaentry.Teamupdate);      //used
router.route('/teamdelete').post(authmiddlewre, tournaentry.teamdelete);      //used
router.route('/registergpt').post(tournaentry.register);      //used
router.route('/playerregister').post(upload.single('playerLogo'), tournaentry.playerregister);      //used
router.route('/playerupdate').post(upload.single('playerLogo'), tournaentry.playerupdate);      //used

router.route('/addmatches').post(authmiddlewre, Matches.addmatches); //used
router.route('/getmatches').post(Matches.getmatches); //used
router.route('/deletematch').post(Matches.deletematch); //used


router.route('/contact').post(contact.contact); //used
router.route('/profile').get(authmiddlewre, contact.profile); //used
router.route('/updateprofile').post(authmiddlewre, contact.updateprofile); //used
router.route('/updateprofilepic').post(authmiddlewre, upload.single('profilepic'), contact.updateprofilepic); //used

router.route('/manualcheck').post(authmiddlewre, member.manualcheck); //used
router.route('/checkcoupon').post(member.checkcoupon); //used
router.route('/plan').get(member.plan); //used
router.route('/auto').post(member.auto); //used
router.route('/delmemberentry').post(authmiddlewre,isadmin,member.delmemberentry); //used

router.route('/isadmin').get(authmiddlewre,isadmin,admin.falsee);
router.route('/memshipentry').get(authmiddlewre,isadmin,admin.allmembershipentry);
router.route('/contactformlist').get(authmiddlewre,isadmin,admin.contactformlist);
router.route('/getvoucher').get(authmiddlewre,isadmin,admin.getvoucher);
router.route('/editvoucher').post(authmiddlewre,isadmin,admin.editvoucher);
router.route('/createvoucher').post(authmiddlewre,isadmin,admin.createvoucher);
router.route('/deletevoucher').post(authmiddlewre,isadmin,admin.deletevoucher);
router.route('/createmembership').post(authmiddlewre,isadmin,admin.createmembership);
router.route('/getmembership').get(authmiddlewre,isadmin,admin.getmembership);
router.route('/getusers').get(authmiddlewre,isadmin,admin.getusers);
router.route('/emailreply').post(authmiddlewre,isadmin,admin.emailreply);
router.route('/contactusdelete').post(authmiddlewre,isadmin,admin.contactusdelete);


app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found, kindly Re-Check api End point' });
});

app.listen(port, () => {
  console.log(`server listening at ${port}`);
})
