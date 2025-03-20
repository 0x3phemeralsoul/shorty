require('dotenv').config(); // Load environment variables from .env
const {extractGitHubPullRequestUrls, getComments, isGitHubPullRequestUrls} = require('./pr');

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const winston = require('winston');

// Initialize Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Load secrets from environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEV_DISCORD_CHANNEL_ID = process.env.DEV_DISCORD_CHANNEL_ID;
const CORE_DISCORD_CHANNEL_ID = process.env.CORE_DISCORD_CHANNEL_ID;
const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;
const LOGGER_LEVEL = process.env.LOGGER_LEVEL;
const MAX_RETRIES = process.env.MAX_RETRIES;
const RETRY_DELAY = process.env.RETRY_DELAY;
const PRODUCT_DEVELOPMENT_WORKFLOW_ID = process.env.PRODUCT_DEVELOPMENT_WORKFLOW_ID;
const OPERATIONAL_TASKS_WORKFLOW_ID = process.env.OPERATIONAL_TASKS_WORKFLOW_ID;
const PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID = process.env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID;
const OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID = process.env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID;

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
users.set('67cf13d4-6934-4c04-a577-76ac892ea01f', '@351468603209547798'); // pedro
users.set('67aa8c53-70a9-460f-afba-c98aca3c8923', '@871743111867564124'); // basset

/* let nickname_users = new Map()
nickname_users.set('0xdecr1pto8698', '@674714406218891327'); // decr1pto
nickname_users.set('amusingaxl', '@593551141921357862'); // amusing
nickname_users.set('0x3phemeralsoul', '@1041280647655850064'); // 3phy
nickname_users.set('oddaf6975', '@1157492699415457892'); // oddaf
nickname_users.set('0xp3th1um', '@1138099723807494295'); // p3th1um */

// Endpoint to receive webhook events
app.post('/', async (req, res) => {
    try {
        const event = req.body;
        let story_id = 0;
        for (action in event.actions) {
            //checking the ID from the story, not from the comment or any other item, just the story
            if(event.actions[action].entity_type == 'story' && event.actions[action].action == 'update' ){
                story_id = event.actions[action].id
            }
        }
        
        logger.info(`Received webhook event for story ID: ${story_id}`);
        let in_review_workflow_state_id = 0;
        let discord_channel = 0;

        // Fetch the story details using Shortcut API
        const story = await axios.get(`https://api.app.shortcut.com/api/v3/stories/${story_id}`, {
            headers: {
                "Shortcut-Token": SHORTCUT_API_TOKEN,
                "Content-Type": "application/json"
            }
        });

        console.log(story)

        //TODO: add all workflow states from each workflow cuz then I can tell that a comment is done on a non-review state.
        // detect if the ticket is for CORE or for Devs.
        if (story.data.workflow_id == OPERATIONAL_TASKS_WORKFLOW_ID) {
            discord_channel = CORE_DISCORD_CHANNEL_ID;
        }
        if (story.data.workflow_id  == PRODUCT_DEVELOPMENT_WORKFLOW_ID) {
            discord_channel = DEV_DISCORD_CHANNEL_ID;
        }
        //---------------------------------    
        //
        // the webhook event is a IN REVIEW state change
        //
        //---------------------------------
        if ('changes' in event.actions[0] && 'workflow_state_id' in event.actions[0].changes) {
            in_review_workflow_state_id = event.actions[0].changes.workflow_state_id.new;
        }
        if (in_review_workflow_state_id == PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID || in_review_workflow_state_id == OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID) 
            {

            



            const story_data = story.data;
            const story_url = story_data.app_url;
            const story_name = story_data.name;
            const workflow_id = story_data.workflow_id;
            const workflow_state_id = story_data.workflow_state_id;
            let deadline = null;
            if (story_data.deadline != null) {
                deadline = story_data.deadline.split("T", 1)[0];
            }

            if (workflow_id == OPERATIONAL_TASKS_WORKFLOW_ID || workflow_id == PRODUCT_DEVELOPMENT_WORKFLOW_ID) {
                logger.info(`Story "${story_name}" is ready for review. Workflow state ID: ${workflow_state_id}`);

                let task_owners = story_data.tasks.map(task => task.owner_ids[0]);
                let discord_mentions = task_owners.map(owner => `<${users.get(owner)}>`);
                let last_pr = extractGitHubPullRequestUrls(getComments(story_data.comments));

                if (last_pr.length != 0) {
                    last_pr = last_pr.slice(-1)[0];
                }
                logger.info(`Last PR is "${last_pr}", last PR length "${last_pr.length}"`);
                let message = '';
                let deadline_msg = '';
                let pr_msg = '';
                if (deadline != null) {
                    deadline_msg = ` :bangbang:**Story Due Date** is ${deadline} :bangbang: so the review should be in sooner than that! :exploding_head:`;
                }
                if (last_pr.length != 0) {
                    pr_msg = ` Link to [PR](<${last_pr}>)`;
                }
                message = `[${story_name}](${story_url}) is ready for review by ${discord_mentions.join(', ')}` + pr_msg + deadline_msg;
                const channel = await client.channels.fetch(discord_channel);
                channel.send(message);
                
                logger.info(`Sent message to Discord channel ${discord_channel}: ${message}`);

                res.status(200).send('Event processed');

                in_review_workflow_state_id = 0;
            } else {
                logger.info(`Story "${story_name}" does not meet the criteria for notification.`);
                res.status(200).send('No action required.');
            }

        
    
    //---------------------------------    
    //
    // the webhook event is a COMMENT
    //
    //---------------------------------
        } else{

        
            // if the story is not in review state change, then it is a comment that is worth notifying, if the story is in review state change, the the Review message is more relevant than the comment cuz the comment is the PR and the PR will be in the Review discord message
            // Check for new comments in the event
            let story_name;
            let story_url;
            let story_id;
            let comment_text;
            let mention_ids;
            let discord_mentions = []
            let is_comment_created = false;
            event.actions.forEach(action => {
                //Detecting a comment has been created and fetching the story the comment belongs to
                if (action.action == 'create' && action.entity_type == 'story-comment') {
                    is_comment_created = true;
                    comment_text = action.text;
                    author_id = action.author_id;
                    if(action.hasOwnProperty('mention_ids')){
                    mention_ids = action.mention_ids;
                    discord_mentions = mention_ids.map(owner => `<${users.get(owner)}>`);
                    }
                    
                }
                if (action.action == 'update' && action.entity_type == 'story') {  
                    story_url = action.app_url;
                    story_name = action.name;
                    story_id = action.id

                }
                
                });

                    
                if (is_comment_created && !isGitHubPullRequestUrls(comment_text)){
                    
                    //if the webhook event is due to a new comment AND there are users mentioned in the comment, I mention the users mentioned in the comment.
                    if (comment_text != '' && discord_mentions.length > 0) {
                        const comment_message = `${discord_mentions.join(', ')} New comment on [${story_name}](${story_url})`;
                        const channel = await client.channels.fetch(discord_channel);
                        channel.send(comment_message);
        
                        logger.info(`Sent message with mentions to Discord channel ${discord_channel}: ${comment_message}`);
                        res.status(200).send('Event processed');
                    // if there is a new comment, but not users mentioned in the comment I mention the "owner" of the ticket
                    }else if (comment_text != '' && is_comment_created){
                        
                        story_owners = story.data.owner_ids
                        discord_mentions = story_owners.map(owner => `<${users.get(owner)}>`);
                        if (story_owners.indexOf(author_id) == -1){
                            console.log("starting Event code")
                            console.log("discord channel ", discord_channel)
                            const comment_message = `${discord_mentions.join(', ')} New comment on [${story_name}](${story_url})`;
                            const channel = await client.channels.fetch(discord_channel);
                            channel.send(comment_message);
            
                            logger.info(`Sent message to Discord channel ${discord_channel}: ${comment_message}`);
                            res.status(200).send('Event processed');
                        }

                    }
                }
        }
     } catch (error) {
            logger.error('Error processing event:', error);
            res.status(500).send('Internal Server Error');
            }


});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is listening on port ${PORT}`);
});

// Start the login process with retries
loginWithRetry(client);
