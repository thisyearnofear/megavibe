import axios from "axios";

export default async (req, res) => {
  const { addresses } = req.query;
  if (!addresses) {
    return res.status(400).json({ error: "Addresses are required" });
  }

  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
  const NEYNAR_CLIENT_ID = process.env.NEYNAR_CLIENT_ID;
  const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";

  try {
    const response = await axios.get(`${NEYNAR_API_URL}/user/bulk-by-address`, {
      params: { addresses },
      headers: {
        accept: "application/json",
        api_key: NEYNAR_API_KEY,
        "Neynar-Client-Id": NEYNAR_CLIENT_ID,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Neynar proxy error:",
      error.response ? error.response.data : error.message
    );
    res
      .status(error.response ? error.response.status : 500)
      .json({ error: "Failed to fetch from Neynar API" });
  }
};
