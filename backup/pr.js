// urlChecker.js

function extractGitHubPullRequestUrls(texts) {
    // Define the regex pattern
    const githubPullRequestRegex = /https?:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;

    // Initialize an array to store the results
    const results = [];

    // Loop through each text string in the array
    texts.forEach(text => {
        // Find all matches in the text
        const matches = text.match(githubPullRequestRegex);
        if (matches) {
            matches.forEach(match => {
                results.push(match);
            });
        }
    });

    return results;
}


function isGitHubPullRequestUrls(texts) {
    // Define the regex pattern
    const githubPullRequestRegex = /https?:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;


        return texts.match(githubPullRequestRegex);

}

/* // Example usage:
const texts = [
    "[https://github.com/makerdao/dss-cron/pull/33](https://github.com/makerdao/dss-cron/pull/33)",
    "This is the PR [https://github.com/makerdao/dss-cron/pull/33](https://github.com/makerdao/dss-cron/pull/33)",
    "Check out this pull request: https://github.com/makerdao/dss-cron/pull/33",
    "https://github.com/user/repo/pull/1234 is another one.",
    "Invalid URL: https://example.com/user/repo/pull/5678"
];

const urls = extractGitHubPullRequestUrls(texts);
console.log(urls); */






function getComments(comments){
    const results  = []

    comments.forEach(comment => {
        if (comment.text != null){ 
        results.push(comment.text)
        }

    })
    return results;
}


/* const comments = [                                                                                                                                                                                 
    {                                                                                                                                                                                         
      app_url: 'https://app.shortcut.com/dewiz/story/2022/claim-vat-q1-at-least#activity-2234',                                                                                               
      entity_type: 'story-comment',                                                                                                                                                           
      deleted: false,                                                                                                                                                                         
      story_id: 2022,                                                                                                                                                                         
      mention_ids: [],                                                                                                                                                                        
      author_id: '6380d4da-0ae7-4ca5-a7f4-59ba335b4460',                                                                                                                                      
      member_mention_ids: [],                                                                                                                                                                 
      linked_to_slack: false,                                                                                                                                                                 
      updated_at: '2024-08-28T15:14:23Z',                                                                                                                                                     
      group_mention_ids: [],                                                                                                                                                                  
      external_id: null,                                                                                                                                                                      
      parent_id: null,                                                                                                                                                                        
      id: 2234,                                                                                                                                                                               
      position: 1,                                                                                                                                                                            
      reactions: [],                                                                                                                                                                          
      created_at: '2024-08-28T15:14:23Z',                                                                                                                                                     
      text: '[https://github.com/makerdao/dss-cron/pull/33](https://github.com/makerdao/dss-cron/pull/33)'                                                                                    
    },                                                                                                                                                                                        
    {                                                                                                                                                                                         
      app_url: 'https://app.shortcut.com/dewiz/story/2022/claim-vat-q1-at-least#activity-2235',                                                                                               
      entity_type: 'story-comment',                                                                                                                                                           
      deleted: false,                                                                                                                                                                         
      story_id: 2022,                                                                                                                                                                         
      mention_ids: [],                                                                                                                                                                        
      author_id: '6380d4da-0ae7-4ca5-a7f4-59ba335b4460',                                                                                                                                      
      member_mention_ids: [],                                                                                                                                                                 
      linked_to_slack: false,                                                                                                                                                                 
      updated_at: '2024-08-28T15:16:04Z',                                                                                                                                                     
      group_mention_ids: [],                                                                                                                                                                  
      external_id: null,                                                                                                                                                                      
      parent_id: null,                                                                                                                                                                        
      id: 2235,                                                                                                                                                                               
      position: 2,                                                                                                                                                                            
      reactions: [],                                                                                                                                                                          
      created_at: '2024-08-28T15:16:04Z',                                                                                                                                                     
      text: 'bla\n'                            
    }
];

const textComments = getComments(comments);
console.log(textComments); */


module.exports = {extractGitHubPullRequestUrls, getComments, isGitHubPullRequestUrls};

