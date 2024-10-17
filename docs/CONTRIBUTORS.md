from the root directory, run `npm run build` to build the server.
from the root directory, go to `/src/Server/webapp` and run `npm run build` to build the webapp

Then you can build the images below

Building MemGPT Docker Image (From MemGPT repo):

`docker build --build-arg MEMGPT_ENVIRONMENT=PRODUCTION -t vandracon/thaumaturgy/memgpt:1.0.0 .`

Building Thaumaturgy Docker Image:

`docker build -t vandracon/thaumaturgy:1.0.0 .`
