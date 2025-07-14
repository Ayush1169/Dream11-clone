var express = require('express');
var router = express.Router();
const User = require('./users')
const passport = require('passport');
const Match = require('./match')
const { ensureAdmin } = require('../middleware/auth')
const axios = require('axios')
/* ✅ HOME PAGE ROUTE WITH AUTO MATCH STATUS LOGIC */

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    // Update live matches to completed if time passed
    await Match.updateMany(
      { status: "live", endTime: { $lt: now } },
      { $set: { status: "completed" } }
    );

    // Update upcoming matches to live if time hit
    await Match.updateMany(
      { status: "upcoming", startTime: { $lte: now }, endTime: { $gte: now } },
      { $set: { status: "live" } }
    );

    // Delete completed matches older than 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    await Match.deleteMany({ status: "completed", endTime: { $lt: oneHourAgo } });

    const liveMatches = await Match.find({ status: "live" });
    const upcomingMatches = await Match.find({ status: "upcoming" });
    const completedMatches = await Match.find({ status: "completed" });

    res.render("index", {
      title: "Dream11 Clone",
      user: req.user,
      liveMatches,
      upcomingMatches,
      completedMatches
    });
  } catch (err) {
    console.error("Home Page Error:", err);
    res.status(500).send("Failed to load homepage");
  }
});

router.get('/login', (req, res,) => {
  res.render('login', {error: req.flash('error')});
  })

router.get('/register', (req, res,) => {
  res.render('register', {error: req.flash('error')})
})

router.post('/register', async(req, res) => {
  const { name, username, password, role} = req.body

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return res.status(400).send('User already exists')
  }

  const userData = new User({ name, username, role})

  User.register(userData, password, (err, user) => {
    if (err) {
      console.error("Registor Error:", err)
      return res.status(400).send("registration failed:" + err.message)
    }
    req.login(user, (err) => {
      if (err) {
        console.error("Login Error:", err)
        return next(err)
      }
      res.redirect('/login')
    })
  }) 
})

router.post('/login', (req, res, next) => {
  console.log("🟢 Login Attempt:", req.body);

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.error("🔥 Error:", err);
      return next(err);
    }
    if (!user) {
      console.warn("❌ Login failed:", info);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        console.error("⚠️ Login error:", err);
        return next(err);
      }
      console.log("✅ Login success:", user.username);
      return res.redirect('/');
    });
  })(req, res, next);
});


router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {return next(err)}
    res.redirect('/') 
  })
})

// routes/index.js me temporary add karo test ke liye

router.get('/test-users', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.get('/add', ensureAdmin, (req, res) => {
  res.render('addmatch', { title: 'Add Match'})
})

router.post('/add', ensureAdmin, async (req, res) => {
  const { teamA, teamB, startTime, endTime, status} = req.body
  console.log("🟢 Match data received:", req.body);
  try {
    await Match.create({ teamA, teamB, startTime, endTime, status })
    res.redirect('/')
  } catch (err) {
    console.error("match creation error:", err)
    res.send("something went wrong")
  }
})

router.get('/match/live/:id', async (req, res) => {
  try {
    // get match by sportmonksId
    const match = await Match.findOne({ sportmonksId: req.params.id });

    if (!match) return res.status(404).send("Match not found");

    const response = await axios.get(`https://cricket.sportmonks.com/api/v2.0/livescores/${req.params.id}`, {
      params: {
        api_token: process.env.SPORTMONKS_KEY,
        include: 'localteam,visitorteam,scoreboards'
      }
    });

    const liveData = response.data.data;

    res.render('live-match', {
      match,
      scoreboard: liveData.scoreboards || []
    });

  } catch (err) {
    console.error("❌ Live match fetch error:", err.response?.data || err.message);
    res.status(500).send("Live match failed to load");
  }
});


router.get('/team/create/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).send("Match not found");

    res.render('create-team', { match });
  } catch (err) {
    console.error("Error in /team/create:", err);
    res.status(500).send("Server error");
  }
});

router.get("/test-live", async (req, res) => {
  try {
    const response = await axios.get('https://cricket.sportmonks.com/api/v2.0/livescores', {
      params: {
        api_token: process.env.SPORTMONKS_KEY
      },
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    // 👇 YEH ADD KAR
    console.log("✅ API Response Raw Data:", response.data);

    const data = response.data.data;

    const formatted = data.map(match => ({
      teamA: match.localteam?.name || "TBD",
      teamB: match.visitorteam?.name || "TBD",
      startTime: match.starting_at,
      status: match.status
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Test Live API Error:", err.response?.data || err.message);
    res.status(500).send("API Failed");
  }
});



// ✅ Match Squad Endpoint (optional for team creation)
router.get("/match/squad/:matchId", async (req, res) => {
  try {
    const response = await axios.get(`https://cricket.sportmonks.com/api/v2.0/teams/${req.params.matchId}`, {
      params: {
        api_token: process.env.SPORTMONKS_KEY
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("Squad fetch error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch squad");
  }
});

router.get("/seed/live", ensureAdmin, async (req, res) => {
  try {
    const response = await axios.get('https://cricket.sportmonks.com/api/v2.0/livescores', {
      params: {
        api_token: process.env.SPORTMONKS_KEY,
        include: 'localteam,visitorteam'
      }
    });

    const data = response.data.data;

    for (const match of data) {
      const exists = await Match.findOne({
        teamA: match.localteam?.name,
        teamB: match.visitorteam?.name,
        sportmonksId: match.id,
        status: 'live'
      });

      if (!exists) {
        await Match.create({
          teamA: match.localteam?.name || "TBD",
          teamB: match.visitorteam?.name || "TBD",
          startTime: match.starting_at,
          endTime: match.ending_at || new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'live',
          sportmonksId: match.id
        });
      }
    }

    console.log("✅ Live matches seeded");
    res.redirect('/');
  } catch (err) {
    console.error("❌ Seeding error:", err.response?.data || err.message);
    res.status(500).send("Failed to seed live matches.");
  }
});


module.exports = router;
