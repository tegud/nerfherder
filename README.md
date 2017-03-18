# nerfherder

Manual herding of gocd-agents in Rancher can be time consuming, no one wants to have to get all the "Lost Contact" agents and disable/delete them.  Equally, having go-pipelines unceremoniously yank machines from under other pipelines when updating agents, is less than ideal.  Nerfherder aims to take away some of this pain.

## Huh? Nerfherder

It's a name, involes herding, also I like Star Wars, what of it?

## Installation

`npm i`

## Configuration

Required environment variables:

NERFHERDER_GO_SERVER - url of the go server
NERFHERDER_GO_USERNAME - GO API username
NERFHERDER_GO_PASSWORD - GO API password
NERFHERDER_RANCHER_SERVER - url of the rancher server
NERFHERDER_RANCHER_API_KEY - Rancher API Key
NERFHERDER_RANCHER_API_SECRET - Rancher API Secret
