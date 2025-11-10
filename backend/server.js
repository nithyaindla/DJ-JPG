import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let accessToken = "";

// Function to get Spotify access token
async function getAccessToken() {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "client_credentials",
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  accessToken = response.data.access_token;
  console.log("Access token retrieved:", accessToken);
}

await getAccessToken();


app.post("/recommend", async (req, res) => {
  const { emotion } = req.body;

  // Basic mapping of emotions to Spotify’s audio features
  const moodFeatures = {
    happy: { valence: 0.9, energy: 0.8 },
    sad: { valence: 0.2, energy: 0.3 },
    calm: { valence: 0.6, energy: 0.4 },
    energetic: { valence: 0.8, energy: 0.9 },
  };

  const features = moodFeatures[emotion.toLowerCase()] || moodFeatures["calm"];

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/recommendations",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          limit: 10,
          seed_genres: "pop",
          target_valence: features.valence,
          target_energy: features.energy,
        },
      }
    );

    const tracks = response.data.tracks.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
      url: track.external_urls.spotify,
    }));

    res.json({ emotion, recommendations: tracks });
  } catch (error) {
    console.error("Error fetching recommendations:", error.message);
    res.status(500).send("Something went wrong");
  }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
