Steps to create a release:

### Build Project

- Run `npm run build` to compile thaumaturgy code
- Build docker images (see `CONTRIBUTORS.md`)
- Save docker images to file (so we don't have to use docker hub to host it)

Save image to file:
`docker save -o <path-to-output-file>.tar <image-name>:<tag>`

Load image from file:
`docker load -i <path-to-input-file>.tar`

### Make Distro

- Create folder `release`
- Create folder within `release` called `thaumaturgy`
- Set/Update version number in the `config/default.json` file
- Copy the config folder (except dev.json) to releases/thaumaturgy
- Create a folder path `release/thaumaturgy/instance/memgpt`
- Inside folder above, create a sqlite.db empty file.
- Create a file within `release/thaumaturgy/instance/memgpt/.env with the following contents:

```
MEMGPT_SERVER_PASS=password
MEMGPT_PG_DB=memgpt
MEMGPT_PG_USER=memgpt
MEMGPT_PG_PASSWORD=memgpt
MEMGPT_PG_URL=memgpt
MEMGPT_PG_HOST=memgpt_db
OPENAI_API_KEY=
```

- Create a file within `release/thaumaturgy/instance/memgpt/config with contents:

```
[defaults]
preset = memgpt_chat
persona = sam_pov
human = basic

[model]
model_endpoint = http://host.docker.internal:5001
model_endpoint_type = koboldcpp
model_wrapper = chatml
context_window = 8192

[embedding]
embedding_endpoint_type = local
embedding_model = BAAI/bge-small-en-v1.5
embedding_dim = 384
embedding_chunk_size = 300

[archival_storage]
type = chroma
path = root/.memgpt/chroma

[recall_storage]
type = sqlite
path = root/.memgpt

[metadata_storage]
type = sqlite
path = root/.memgpt

[version]
memgpt_version = 0.3.25

[client]
anon_clientid = 00000000-0000-0000-0000-000000000000
```

- Create two empty files `thaumaturgy.db` and `thaumaturgydebug.db` in the `release/thaumaturgy/local/instance/thaumaturgy` folder
- (Optional but recommended) Copy skyrim_characters.csv to `releease/thaumaturgy/data`
- Copy the Thaumaturgy and MemGPT docker image to `release` folder
- Zip and distribute (name zip with some version number)
