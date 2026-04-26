const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("189319772768-3pg8t9sikhl8vipd2nh9meo0e8s3jkgf.apps.googleusercontent.com"); // Paste your Client ID here

router.post("/google-login", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "189319772768-3pg8t9sikhl8vipd2nh9meo0e8s3jkgf.apps.googleusercontent.com", // Paste your Client ID here
    });

    const { name, email, picture } = ticket.getPayload();

    // Inga user already database-la irukkara-nu check panni, 
    // illana pudhu user-ah create pannanum.
    // Appram unga app-oda JWT token-ah return pannanum.
    
    // Simple response for testing:
    const appToken = "GENERATE_YOUR_JWT_TOKEN_HERE"; 
    res.json({ token: appToken, user: { name, email, picture } });

  } catch (error) {
    res.status(400).json({ message: "Google verification failed" });
  }
});