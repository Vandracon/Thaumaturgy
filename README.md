# Intro

This is a service I built to enable me to play games using the Mantella mod with a more robust backend, particularly agent based with memory and function calling abilities. This service is designed to sit between Mantella (or some other service) and the LLM in which it will proxy requests to Letta (MemGPT) or the LLM directly using OpenAI style API.

# Quick Start

- Download zip from `Releases` and extract.
- Open command line to the extracted folder.
- Run `docker-compose up`
- This will download and start Thaumaturgy as well as its "sidecar" container service called Letta (MemGPT).
- Go to `localhost:8050` and configure your LLM settings via `LLM Config` tab on the UI.
  - I recommend using Ollama.
  - Default endpoint.
  - The model name you have set in Ollama.
  - The default `llama3` model wrapper.
  - A context window that makes sense.
  - The service will then restart a couple times when you save.
- Be sure you have a local LLM running on the port specified.
- Go to `agents` on the UI, then create or pick one to optionally chat with in browser to ensure things are working properly.
- Refer to the `Getting Started` tab in the UI for edits to make in the Mantella config.

# Docker

Given the number of separate services (and potentially more added later) I decided that the official way to run this is to have docker installed on your system. All of your data is stored in a single folder you can grab from Releases. The install images are located on dockerhub so once you run `docker-compose up` from the release folder, it will download, create and start everything up. You can copy the release folder and have multiple instances for different games, saves, etc. The most important stuff is the instance data located in `local/instance`. This contains the databases for Letta (plus Chroma), Thaumaturgy, and anything else added in the future.

# Additional Info

### 1. Be sure to have Mantella (v0.11.4) installed and functioning properly.

It's possible that a different version will work but this project has not been built against nor tested with them.
It is important that you have Mantella functioning before attempting to use this tool to enhance the AI. This will reduce the number of variables in play on the things that can go wrong in a full initial setup. I chose v0.11.4 as it was the most recent release of Mantella to build compatibility with at the time. However, you may find success with newer versions as well.

### 2. Pre-Processed data for some games are available in the data folder.

There are a few ways to create characters.

1. There is an importer in the API that you can post files to that import characters. One such way is to post your skyrim_characters.csv provided by Mantella. This can take a while since there are over 2700 characters and each agent needs to be created from that into the system. It takes about an hour for me.

   (Instead of running your characters through the importer, I've already done so with Skyrim's character.csv that came with the release. About 400 or so had bios that were too long so I used an LLM to summarize and shorten them a bit; the rest were fine. This service automatically does this for you if you decide to do your own import).

   I've also included a SQLite database of a freshly imported MemGPT database containing all 2700 (approximate) characters. There is also a base install folder both inside the `local/profiles` folder should you want to start with a clean state.

   The data for the service exists inside of `local/instance`. So if you want to make a backup, just copy the instance folder and rename it with a date or something. You could copy the whole release folder if you have different config values between saves. If you want to use an install from the `profiles` folder, then copy the contents (thaumaturgy & memgpt folders) and paste them into `local/instance` (be sure its empty first to be safe).

2. You can create agents in the web UI as well `localhost:8050`. You can even create a test agent and can chat with it in the UI to make sure things are running correctly before using in a game. The last page should have one already made with \_\_\_ prepended to the agent name.

### 3. Ollama is the recommended and supported local LLM provider.

I've used various versions of LM Studio and Kobold. Since MemGPT also talks to this service and the way they require some of it setup (turning off prompt formatting, context overflow being set to `stop at limit`, etc.) I have found both services to work well but then break when it came down to a specific thing, namely: summaries or group chats. Kobold, for some reason, was quite a bit slower then LM Studio but handled the different types of requests well. LM Studio worked great, but only 0.2.x versions. 0.3.x made an API change that breaks MemGPT being able to make requests to it. So to reduce complexity and gotchas, I decided to recommend and use Ollama as it takes the best of both system user experiences. You can even give each agent different AI models if you prefer, and Ollama will swap them in and out based on what agent you're speaking to. It's best to just take a moment and learn how it works and is setup, it's not too difficult in comparison to the alternatives. I would imagine the time troubleshooting why summary requests from Mantella don't return anything but other requests work fine or some other caveat is greater than the time it takes to figure out how to use Ollama.

### 4. Your results will vary depending on which AI model you use.

When developing, I used a few different local LLMs. It is important to find one that can do function calling to ensure agents can properly manage their internal state. This might block off some LLMs you like if it can't handle it. If your context window goes beyond what the LLM can handle, its possible that it will call functions with syntax errors in them.

If you want to ensure a good working environment, I suggest the following before experimenting:

Top Choice: `Mistral-Nemo-Instruct-2407-GGUF` 13B. 10k context (maybe more?). This model follows instructions well, does summaries well, and roleplays well, and calls functions and manages its own memory well. It hasn't given me some censored wall nor speak like an assistant or "I can't do that since I'm just an AI model" (It breaks immersion in a Medieval setting). It also stays in character well. I wouldn't go any lower than Q5_KM quants.

Runner Up: `daybreak-kunoichi-dpo-7b` 8192 context (wouldn't go higher). This is pretty solid but was bit lighter on its self memory management function calling for my preferences, great roleplay though. It's also smaller at 7b. For quants, same as above.. stay at or above Q5_KM for solid results.

Other: `neuralhermes-2.5-mistral-7b.Q5_K_M` 8192 context. A little slower and might be a lower role play quality but can handle functions and self memory management.

### 5. Runtime Performance

The performance overall is pretty good. I imagine Mantella by itself is faster overall but a simple one-on-one exchange should be about the same. Some things to note:

- The first message to an agent after startup can take a little longer for the agent to boot up and get cached.
- If the agent decides to perform functions (summary, search convo history, add to archival memory, edit what it knows about you, or alter its own personality, etc) then it makes a call to the LLM and can chain commands in order to complete them. So this processing can make a message take longer than usual. In general, it is just a simple request and reply that happens.
- Thaumaturgy has a dynamic timeout feature. This means it will increase how long it waits if requests take longer than they should and gradually reduces the wait if requests are coming in much faster than expected. This prevents the system from waiting forever on a request that failed (bad function call or some other error). You can monitor the logs for messages and response times. If it times out, the NPC will say something like "I have no response at the moment".

### 6. Additional Information

Refer to the web UI documentation once you have the system up and running `localhost:8050`.
