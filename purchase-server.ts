import { NS } from "./types/NetscriptDefinitions/index"

export async function main(ns: NS) {
    const requestedRamCount = ns.args[0] as number
    const requestedHostname = (ns.args[1] ?? "spk-node") as string
    const moneyAvailable = ns.getPlayer().money

    const requestedRam = Math.pow(2, requestedRamCount)

    const serverCost = ns.getPurchasedServerCost(requestedRam)
    if (serverCost > moneyAvailable) {
        ns.tprint(`Insufficient Funds Available. Required: ${serverCost}`)
        ns.exit()
    }

    const result = await ns.prompt(`Purchase ${requestedRam}GB server for $${serverCost}?`)
    if (result) {
        const purchasedHostname = ns.purchaseServer(requestedHostname, requestedRam)
        ns.tprint(`Purchased Server: ${purchasedHostname}`)
    }
}