# Getting Started

### 1. Be sure to have Mantella (v0.11.4) installed and functioning properly.

It is important that you have Mantella functioning before attempting to use another tool to enhance AI using MemGPT. This will reduce the number of variables at place on the things that can go wrong in full setup. I chose v0.11.4 as it was the most recent release of Mantella to build compatibility with at the time. However, you may find success with newer versions as well.

### 2. Pre-Processed data for some games are available in the data folder.

There are a few ways to create characters.

1. There is an importer in the API that you can post files to that import characters. One such way is to post your skyrim_characters.csv provided by mantella. This can take a while since there LEFT OFF HERE

Instead of running your characters through the importer, I've already done so with Skyrim's character.csv that came with the release. About 400 or so had bios that were too long so I used an LLM to summarize and shorten them a bit; the rest were fine.

I've also included a sqlite database of a freshly imported MemGPT database containing all 2450 (approx) characters. Once you have MemGPT setup, go to your home directory's .memgpt folder and replace the sqlite database there to be good to go. If you configured MemGPT with chroma, you'll want to backup that sqlite database if you ever want to reset or contain multiple pairs of files for different games/saves.
