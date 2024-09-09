Building MemGPT Docker Image (From MemGPT repo):

`docker build --target development --build-arg MEMGPT_ENVIRONMENT=DEVELOPMENT -t vandracon/thaumaturgy/memgpt .`

Building Thaumaturgy Docker Image:

`docker build -t vandracon/thaumaturgy:1.0.0 .`

To update prompt for agents
TODO: make sure to update prompt txt file in file system in addition to calling rest call for updating system of existing agents.
