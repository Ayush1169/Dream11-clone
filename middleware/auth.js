module.exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  } else {
    // Agar user logged in nahi hai ya admin nahi hai
    res.status(403).send("🚫 Access Denied: Only admin can access this route");
  }
};
