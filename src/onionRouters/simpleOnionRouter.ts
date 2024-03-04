import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";
import {generateRsaKeyPair, exportPubKey, exportPrvKey, rsaDecrypt, symDecrypt} from "../crypto";
import * as http from "http";
export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());
  const { publicKey, privateKey } = await generateRsaKeyPair();
  const stringPubKey = await exportPubKey(publicKey);
  const stringPrvKey = await exportPrvKey(privateKey);

  let lastReceivedEncryptedMessage: string| null = null;
  let lastReceivedDecryptedMessage: string| null = null;
  let lastMessageDestination : number| null = null;
  const jsonNode = JSON.stringify({
    nodeId,
    pubKey: stringPubKey,
  });

  const publication = {
    hostname: 'localhost',
    port: 8080,
    path: '/registerNode',
    method: 'POST',
    headers: {'Content-Type': 'application/json','Content-Length': jsonNode.length},
  };
  const req = http.request(publication, (res) => {
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });
  req.on('error', (error) => {
    console.error(`Problem with request: ${error.message}`);
  });

  // Write data to request body
  req.write(jsonNode);
  req.end();

  // TODO implement the status route
  onionRouter.get("/status", (req, res) => {
    res.status(200).send('live')
  });

  // GET Methods
  onionRouter.get('/getLastReceivedEncryptedMessage', (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });
  onionRouter.get('/getLastReceivedDecryptedMessage', (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });
  onionRouter.get('/getLastMessageDestination', (req, res) => {
    res.json({ result: lastMessageDestination });
  });
  onionRouter.get("/getPrivateKey", (req, res) => {
    res.json({ result: stringPrvKey });
  });

  //POST Methods
  onionRouter.post("/message", async (req, res) => {
    //We need to decrypt the message to send it to the next node or the final receiver
    const encryptedMessage = req.body;
    const followMessage = await symDecrypt(await rsaDecrypt(encryptedMessage, privateKey),encryptedMessage);
    const nextPort = parseInt(followMessage.slice(0, 10), 10); //Get the 10 first values (nextPort)
    const actualMessage = followMessage.slice(10);
  // New values
    lastReceivedEncryptedMessage = encryptedMessage;
    lastReceivedDecryptedMessage = actualMessage;
    lastMessageDestination = nextPort;
    await fetch(`http://localhost:${nextPort}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: actualMessage}),
    });
    res.status(200).send("success");
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
