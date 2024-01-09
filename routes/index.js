var express = require('express');
var router = express.Router();
const userModel = require('./users');    // User Model
const postModel = require('./posts');    // User Model
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require('./multer')  // Multer script

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function (req, res) {
  res.render('index', { footer: false });
});

router.get('/login', function (req, res) {
  res.render('login', { footer: false });
});

router.get('/feed', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts')
  const posts = await postModel.find().populate('user')
  res.render('feed', { footer: true, posts, user });
});

// Profile 
router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts')
  res.render('profile', { footer: true, user });
});

router.get('/search', isLoggedIn, async function (req, res) {
  const user = await userModel.find({ username: req.user })
  res.render('search', { footer: true, user });
});

router.get('/like/post/:id', isLoggedIn, async function (req, res) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id);

    // Check if the user has already liked the post
    const likedIndex = post.likes.indexOf(user._id);

    if (likedIndex === -1) {
      // If not liked, add the user to the likes array
      post.likes.push(user._id);
    } else {
      // If already liked, remove the user from the likes array
      post.likes.splice(likedIndex, 1);
    }

    // Save the updated post
    await post.save();

    // Redirect back to the post or the feed page
    const referer = req.headers.referer || '/feed';
    res.redirect(referer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// edit profile 
router.get('/edit', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render('edit', { footer: true, user });
});

// Upload Post 
router.get('/upload', isLoggedIn, function (req, res) {
  res.render('upload', { footer: true });
});

router.post('/upload', upload.single('image'), isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const post = await postModel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption,
  })

  user.posts.push(post._id);
  await user.save();
  res.redirect('/feed');
});

router.get('/username/:username', isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const users = await userModel.find({ username: regex })
  res.json(users);
});

// Register Route
router.post('/register', (req, res, next) => {
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  })

  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/login');
      })
    })
})

// Login 
router.post('/login', passport.authenticate('local', {
  successRedirect: "/profile",
  failureRedirect: '/login'
}), function (req, res) {
});

// Logout
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err) };
    res.redirect('/login');
  })
});

// Edit-update profile details
router.post('/update', upload.single('image'), async (req, res, next) => {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }
  );

  if (req.file) {
    user.profileImage = req.file.filename;
  }

  await user.save();
  res.redirect('/profile');
})

// isLoggedIn
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
