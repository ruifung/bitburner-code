import { NS } from "./types/NetscriptDefinitions/index"


export async function main(ns: NS) {
    const script = ns.args[0] as string
    ns.tprint(`Script RAM: ${ns.getScriptRam(script)}`)
}
