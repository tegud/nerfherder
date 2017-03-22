# nerfherder

Manual herding of gocd-agents in Rancher can be time consuming, no one wants to have to get all the "Lost Contact" agents and disable/delete them.  Equally, having go-pipelines unceremoniously yank machines from under other pipelines when updating agents, is less than ideal.  Nerfherder aims to take away some of this pain.

## Huh? Nerfherder

It's a name, involes herding, also I like Star Wars, what of it?

## Installation

`npm i`

## Configuration

`TBD`

## Usage
### Agent Cleanup [Implemented]
One of the first goals of nerfherder was to take care of all LostContact agents from within GOCD.  When managing a large number of go-agents with docker, I found it was very common that when agent services were upgraded in Rancher, that the process would leave a lot of "dead agents" in GOCD, which you'd need to manually remove (a two-step process, involving disabling and deleting the LostContact agents).  nerfherder automates this process by periodically "pinging" for LostContact agents.  Any agent in a LostContact state, who's IP range matches the defined rancher subnet, or who's host is listed by rancher for your configured agent, will be disabled then deleted.
*NOTE*: Current disabling and deletion will occur immediately after an agent moves into a LostContact state, this will be changed to allow a configurable grace period so that agents are not destroyed as soon as they move into a LostContact state, in case the container was being restarted or similar.

### Agent Service Upgrades [Planned]
Another pain point encountered is with the upgrade of go-agent services.  If you try and upgrade a service whilst it's in progress, the results can be less than satisfactory.  Therefore instead of just telling Rancher to upgrade a service, instead nerfherder will expose an Upgrade Service webhook, which will manage disabling the agents, waiting until all jobs have completed, and then upgrading the service - once complete, the old agents will be safely removed by the Cleanup process.

### Agent Scheduled Recycling [Planned]
Agents build up baggage, before scaling is implemented, at scheduled points all agents will be disposed of and rebuilt - ensuring no agent strays from it's configured state, and reducing disk footprint

### Agent Service Scaling (Near elastic agents) [Planned]
GOCD has recently implemented elastic agents, this is quite a large body of work to implement, so as a first pass, I intend on merely monitoring GO's agent usage and scaling up/down as required.  E.g. if Agent A's containers are all in use, scale up by one.  If many agents are
