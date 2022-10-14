const express = require("express");
const router = express.Router();
const ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;

router.get("/", ensureLoggedIn("/"), (req, res) => {
  const data = {
    userinfo: req.session.userinfo,
    tokenSet: req.session.tokenSet,
  };

  res.render("user", { data: data });
});

module.exports = router;
