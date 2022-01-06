import { NS } from "./types/NetscriptDefinitions/index"

export async function main(ns: NS) {
    const requestedRam = ns.args[0] as number
    const requestedHostname = (ns.args[1] ?? "spk-node") as string
    const moneyAvailable = ns.getPlayer().money

    if (Math.log2(requestedRam) % 1 !== 0) {
        ns.tprint("Requested RAM must be power of 2.")
        ns.exit()
    }

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