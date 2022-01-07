import { NS } from "./types/NetscriptDefinitions/index"

export async function main(ns: NS) {
    const requestedHostname = ns.args[0] 

    if (typeof(requestedHostname) != 'string') {
        ns.print("Please specify a hostname.")
        ns.exit()
    }

    const result = await ns.prompt(`Delete server ${requestedHostname}?`)
    if (result) {
        ns.killall(requestedHostname as string)
        ns.deleteServer(requestedHostname as string)
        ns.tprint(`Deleted Server: ${requestedHostname}`)
    }
}