const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const config = require('config');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const auth = require('../../middleware/auth');

var cors = require('cors');
router.use(cors());

//@route POST api/posts
//@desc Create post
//@access Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const post = await newPost.save();
      res.json(newPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server down.');
    }
  }
);

//@route GET api/posts
//@desc Get all posts
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found.' });
    }
    res.status(500).send('Server down.');
  }
});

//@route DELETE api/posts/:id
//@desc delete a post.
//@access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found.' });
    }

    // check that user can't delete others posts:
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized.' });
    }

    await post.remove();
    res.json({ msg: 'Post removed.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found.' });
    }
    res.status(500).send('Server down.');
  }
});

//@route PUT api/posts/like/:id
//@desc like a post by id.
//@access Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if post is already liked by user.
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked.' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server down.');
  }
});

//@route PUT api/posts/unlike/:id
//@desc remove like from a post by id.
//@access Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if post is already liked by user.
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ==
      0
    ) {
      return res.status(400).json({ msg: 'Post not liked yet.' });
    }
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server down.');
  }
});

//@route POST api/posts/comment/:id
//@desc Comment on a post
//@access Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server down.');
    }
  }
);

//@route DELETE api/posts/comment/:id/:commentId
//@desc delete a comment from a post.
//@access Private
router.delete('/comment/:id/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found.' });
    }

    //pull out comment.
    var i;
    var commentIndex = -1;
    for (i = 0; i < post.comments.length; i++) {
      if (post.comments[i].id == req.params.commentId) {
        commentIndex = i;
        break;
      }
    }
    if (commentIndex == -1) {
      return res.status(404).json({ msg: 'Comment not found.' });
    }
    // check that user can't delete others commentss:
    if (post.comments[commentIndex].user.toString() != req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete this comment.' });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({ msg: 'comment removed.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found.' });
    }
    res.status(500).send('Server down.');
  }
});

module.exports = router;
