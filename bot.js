require('dotenv').config(); // Load environment variables from .env
const {extractGitHubPullRequestUrls, getComments} = require('./pr');

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const winston = require('winston');

// Initialize Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Load secrets from environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;
const LOGGER_LEVEL= process.env.LOGGER_LEVEL

// Configure winston for logging
const logger = winston.createLogger({
  level: LOGGER_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(), // Logs to console
    new winston.transports.File({ filename: 'app.log' }) // Logs to file
  ]
});

// Function to handle login with retry mechanism
async function loginWithRetry(client, retries = 0) {
    try {
        await client.login(DISCORD_TOKEN);
        logger.info('Logged in to Discord successfully');
    } catch (err) {
        if (retries < MAX_RETRIES) {
            logger.warn(`Login attempt ${retries + 1} failed. Retrying in ${RETRY_DELAY / 1000} seconds...`);
            retries += 1;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            await loginWithRetry(client, retries);
        } else {
            logger.error('Max login attempts reached. Failed to log in to Discord:', err);
            process.exit(1); // Exit the process with an error code
        }
    }
}

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
    let in_review_workflow_state_id = 0

    
    if('changes' in event.actions[0]&& 'workflow_state_id' in event.actions[0].changes){
        in_review_workflow_state_id = event.actions[0].changes.workflow_state_id.new
    }

    if (in_review_workflow_state_id == 500000189){

        logger.info(`Received webhook event for story ID: ${primary_id}`);

        try {
            // Fetch the story details using Shortcut API
            const story = await axios.get(`https://api.app.shortcut.com/api/v3/stories/${primary_id}`, {
            headers: {
                "Shortcut-Token": SHORTCUT_API_TOKEN,
                "Content-Type": "application/json"
            }
            });

            const story_data = story.data;
            //console.log(story_data)
            const story_url = story_data.app_url;
            const story_name = story_data.name;
            const workflow_id = story_data.workflow_id;
            const workflow_state_id = story_data.workflow_state_id;
            let deadline = null
            if(story_data.deadline != null){
                deadline = story_data.deadline.split("T", 1)[0];
            }

            if (workflow_id == 500000183 && workflow_state_id == 500000189) {
                logger.info(`Story "${story_name}" is ready for review. Workflow state ID: ${workflow_state_id}`);

                let task_owners = story_data.tasks.map(task => task.owner_ids[0]);
                let discord_mentions = task_owners.map(owner => `<${users.get(owner)}>`);
                console.log('comments', story_data.comments)
                let last_pr = extractGitHubPullRequestUrls(getComments(story_data.comments))
                
                if (last_pr.length != 0){
                    last_pr.slice(-1)[0]
                }
                logger.info(`Last PR is "${last_pr}"`);
                let message = ''
                let deadline_msg =  ''
                let pr_msg = ''
                if(deadline != null){
                    deadline_msg= ` :bangbang:**Story Due Date** is ${deadline} :bangbang: so the review should be in sooner than that! :exploding_head:`;
                }
                if(last_pr != ''){
                    pr_msg = ` Link to [PR](<${last_pr}>)`;
                }
                message = `[${story_name}](${story_url}) is ready for review by ${discord_mentions.join(', ')}`+pr_msg+deadline_msg;
                
                const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
                channel.send(message);

                logger.info(`Sent message to Discord channel ${DISCORD_CHANNEL_ID}: ${message}`);

                res.status(200).send('Event processed');
            } else {
                logger.info(`Story "${story_name}" does not meet the criteria for notification.`);
                res.status(200).send('No action required');
            }

        } catch (error) {
            logger.error('Error processing event:', error);
            res.status(500).send('Internal Server Error');
        }
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
});

// Start the login process with retries
loginWithRetry(client);