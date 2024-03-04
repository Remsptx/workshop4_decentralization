import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Nodes = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Nodes[];
};

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());
  let allNodes: Nodes[] = [];

  // TODO implement the status route
  _registry.get("/status", (req, res) => {
    res.status(200).send('live')
  });
  //GET Methods
  _registry.get("/getNodeRegistry", (req, res) => {
    res.json({ nodes: allNodes });
  //POST Methods
  });
  _registry.post("/registerNode", (req: Request<{}, {}, RegisterNodeBody>, res: Response) => {
    const newNode: Nodes = {nodeId: req.body.nodeId, pubKey: req.body.pubKey,
    };
    allNodes.push(newNode);
  });
  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
