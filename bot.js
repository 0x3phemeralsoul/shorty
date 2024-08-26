require('dotenv').config(); // Load environment variables from .env

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');

// Initialize Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Load secrets from environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;

// Initialize Express server for webhook
const app = express();
app.use(express.json());

// User map for Shortcut to Discord
let users = new Map();
users.set('64d22622-528c-4615-9314-2e9939307824', '@674714406218891327'); // decr1pto
users.set('6380d6b1-fb27-4965-bfa2-f08f2c948292', '@593551141921357862'); // amusing
users.set('6380d4da-0ae7-4ca5-a7f4-59ba335b4460', '@1041280647655850064'); // 3phy
users.set('656f49bd-1c7a-42bb-874e-2a028317b06b', '@1157492699415457892'); // oddaf
users.set('64d0f1b4-991e-4d95-b3fe-521a7cd53e04', '@1138099723807494295'); // p3th1um

// Endpoint to receive webhook events
app.post('/', async (req, res) => {
  const event = req.body;
  const primary_id = event.actions[0].id;
  console.log('primary_id' , primary_id)

  try {
    // Fetch the story details using Shortcut API
    const story = await axios.get(`https://api.app.shortcut.com/api/v3/stories/${primary_id}`, {
      headers: {
        "Shortcut-Token": SHORTCUT_API_TOKEN,
        "Content-Type": "application/json"
      }
    });

    const story_data = story.data;
    const story_url = story_data.app_url;
    const story_name = story_data.name;
    const workflow_id = story_data.workflow_id;
    const workflow_state_id = story_data.workflow_state_id;
   

    if (workflow_id == 500000183 && workflow_state_id == 500000189) {
      let task_owners = story_data.tasks.map(task => task.owner_ids[0]);
      let discord_mentions = task_owners.map(owner => `<${users.get(owner)}>`);
      
      let message = `The story [${story_name}](${story_url}) is ready for review by ${discord_mentions.join(', ')}`;
      
      const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
      channel.send(message);

      res.status(200).send('Event processed');
    } else {
      res.status(200).send('No action required');
    }
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Log in to Discord with your bot token
client.login(DISCORD_TOKEN);
