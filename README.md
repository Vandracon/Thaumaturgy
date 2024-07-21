# Getting Started

### 1. Be sure to have Mantella (v0.11.4) installed and functioning properly.

It is important that you have Mantella functioning before attempting to use another tool to enhance AI using MemGPT. This will reduce the number of variables at place on the things that can go wrong in full setup. I chose the most recent release of Mantella to build compatibility with. However, you may find success with newer versions as well.

### 2. Have MemGPT (tags/0.3.18) running and working properly.

This was again, the most recent release and is even more important to adhere to the version it was tested with. MemGPT is new and an official 1.0 production release isn't due out until August 2024. Go to their github page and git clone / checkout tag above. OR download the release zip at the version mentioned above. Follow their guides for getting a system setup. I tested it using SQLite configurations which worked well even with over 2000 agents (had some trouble with database errors creating too many connections using PostgreSQL).

### 3. Pre-Processed data for some games are available in the data folder.

Instead of running your characters through the importer, I've already done so with Skyrim's character.csv that came with the release. About 400 or so had bios that were too long so I used an LLM to summarize and shorten them a bit; the rest were fine.

I've also included a sqlite database of a freshly imported MemGPT database containing all 2450 (approx) characters. Once you have MemGPT setup, go to your home directory's .memgpt folder and replace the sqlite database there to be good to go. If you configured MemGPT with chroma, you'll want to backup that sqlite database if you ever want to reset or contain multiple pairs of files for different games/saves.
