from the root directory, run `npm run build` to build the server.
from the root directory, go to `/src/Server/webapp` and run `npm run build` to build the webapp

Then you can build the images below

Building MemGPT Docker Image (From MemGPT repo):

`docker build --target development --build-arg MEMGPT_ENVIRONMENT=DEVELOPMENT -t vandracon/thaumaturgy/memgpt .`

Building Thaumaturgy Docker Image:

`docker build -t vandracon/thaumaturgy:1.0.0 .`
