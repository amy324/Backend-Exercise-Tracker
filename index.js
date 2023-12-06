require('dotenv').config(); 

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI);

const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  const newUser = new User({ username });

  newUser.save()
    .then((user) => {
      res.json({
        username: user.username,
        _id: user._id,
      });
    })
    .catch((err) => {
      res.json({ error: err.message });
    });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date(),
  };

  User.findByIdAndUpdate(_id, { $push: { log: exercise } }, { new: true })
    .then((user) => {
      if (!user) {
        return res.json({ error: 'Invalid user ID' });
      }
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    })
    .catch((err) => {
      res.json({ error: err.message });
    });
});




app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  User.findById(_id, (err, user) => {
    if (err || !user) {
      return res.json({ error: 'Invalid user ID' });
    }

    let log = user.log;

    if (from) {
      log = log.filter((exercise) => new Date(exercise.date) >= new Date(from));
    }

    if (to) {
      log = log.filter((exercise) => new Date(exercise.date) <= new Date(to));
    }

    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
