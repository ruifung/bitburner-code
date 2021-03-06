import { NodeStats, NS } from "../types/NetscriptDefinitions/index"

interface Node {
    idx: number
    info: NodeStats
    cheapestUpgrade: UpgradeOption
}

interface UpgradeOption {
    type: 'LEVEL' | 'RAM' | 'CORE' | 'CACHE',
    cost: number,
    performUpgrade: () => {}
}

export async function main(ns: NS) {
    const hacknet = ns.hacknet
    ns.disableLog("sleep")
    while (true) {
        const nodes: Node[] = []
        let totalProduction = 0
        for (let idx = 0; idx < hacknet.numNodes(); idx++) {
            const info = hacknet.getNodeStats(idx)
            const cheapestUpgrade = determineCheapestUpgrade(ns, info, idx)

            if (cheapestUpgrade != undefined) {
                nodes.push({
                    idx,
                    info,
                    cheapestUpgrade
                })
            }
            totalProduction += info.production
            await ns.sleep(1)
        }
        totalProduction += (ns.getScriptIncome()[0] * .5)

        ns.print(`Upgrade Cycle Start. Handling ${nodes.length} nodes.`)
        sortNodes(nodes)
        await ns.sleep(1)

        let idx = 0

        let lastNodeCount = ns.hacknet.numNodes()
        while (idx < nodes.length) {
            const node = nodes[idx]
            const option = node.cheapestUpgrade

            if (lastNodeCount != ns.hacknet.numNodes()) {
                ns.print("Node count changed, terminating cycle.")
                break;
            }

            if (option != undefined && option.cost < hacknet.getPurchaseNodeCost() || hacknet.numNodes() == hacknet.maxNumNodes()) {
                ns.print(`Performing ${option.type} Upgrade on Node ${node.idx}`)
                option.performUpgrade()
                eval("window.skipTimeoutHack = true")
                await ns.sleep(Math.max(Math.ceil((option.cost / totalProduction) * 1000), 100))

                const oldOrder = nodes.map(node => node.idx).join(',')

                const newOption = determineCheapestUpgrade(ns, node.info, node.idx)
                if (newOption == undefined) {
                    nodes.splice(idx, 1)
                } else {
                    node.cheapestUpgrade = newOption
                }

                sortNodes(nodes)
                const newOrder = nodes.map(node => node.idx).join(',')

                if (oldOrder == newOrder) {
                    idx++
                } else {
                    idx = 0
                }

            } else if (hacknet.numNodes() < hacknet.maxNumNodes()) {
                await buyHacknetNode(ns, totalProduction)
                ns.print("New node purchased. Terminating cycle.")
                break;
            }
            await ns.sleep(100)
        }
        ns.print("Upgrade cycle complete.")
        await ns.sleep(1000)
    }
}

async function buyHacknetNode(ns: NS, totalProduction: number) {
    ns.print("Purchasing Hacknet Node")
    ns.hacknet.purchaseNode()
    eval("window.skipTimeoutHack = true")
    await ns.sleep(Math.max(Math.ceil((ns.hacknet.getPurchaseNodeCost() / totalProduction) * 1000), 100))
}

function determineCheapestUpgrade(ns: NS, nodeStats: NodeStats, nodeIdx: number): UpgradeOption | undefined {
    let upgradeOptions: UpgradeOption[] = [
        {
            type: "RAM",
            cost: ns.hacknet.getRamUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeRam(nodeIdx, 1)
        },
        {
            type: "CORE",
            cost: ns.hacknet.getCoreUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeCore(nodeIdx, 1)
        }
    ]
    if (nodeStats.level <= 200) {
        upgradeOptions.push({
            type: "LEVEL",
            cost: ns.hacknet.getLevelUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeLevel(nodeIdx, 1)
        })
    }
    upgradeOptions = upgradeOptions.filter(a => Number.isFinite(a.cost)).sort((a, b) => a.cost - b.cost)
    return upgradeOptions.length > 0 ? upgradeOptions[0] : undefined
}

function sortNodes(nodes: Node[]) {
    nodes.sort((a, b) => a.cheapestUpgrade.cost - b.cheapestUpgrade?.cost)
}