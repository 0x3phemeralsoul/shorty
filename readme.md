# Development Env
run `node bot.js`

start `ngrok http 3000`

copy the public URL which forwards to localhost:3000

paste the public URL into webhook integrations on Shortcut app

open `http://127.0.0.1:4040` on your browser to see events coming in, you can replay them.


# Docker

`docker build -t shorty-app .`

`docker run -ti --name shorty -v $(pwd)/dev/shorty/:/usr/src/app/ -p 3000:3000 shorty-app`


# install Discord bot in new server


https://pipedream.com/apps/discord-bot#getting-started