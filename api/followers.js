// /api/followers.js
export default async function handler(req, res) {
  const { user } = req.query; // ?user=gotaga

  if (!user) {
    return res
      .status(400)
      .json({ error: "Paramètre 'user' manquant (ex: ?user=gotaga)" });
  }

  try {
    // Étape 1 : Obtenir un App Access Token
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res
        .status(500)
        .json({ error: "Impossible d’obtenir un access token Twitch." });
    }

    // Étape 2 : Obtenir le broadcaster_id via le login
    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${user}`,
      {
        headers: {
          "Client-Id": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: "Utilisateur Twitch introuvable" });
    }

    const broadcasterId = userData.data[0].id;

    // Étape 3 : Récupérer le total de followers
    const followersRes = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`,
      {
        headers: {
          "Client-Id": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const followersData = await followersRes.json();

    return res.status(200).json({
      user: userData.data[0].display_name,
      broadcaster_id: broadcasterId,
      followers_total: followersData.total,
      last_update: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erreur API Twitch :", err);
    return res.status(500).json({ error: "Erreur serveur interne" });
  }
}
