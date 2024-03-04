import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";
import {GetNodeRegistryBody, Nodes} from "@/src/registry/registry";
import {createRandomSymmetricKey, exportSymKey, rsaEncrypt, symEncrypt} from "../crypto";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());
  let lastReceivedMessage : string | null = null;
  let lastSentMessage : string | null = null;
  let lastCircuit: Nodes[] = [];

  // TODO implement the status route
  _user.get("/status", (req, res) => {
    res.status(200).send('live')
  });

  //GET Methods
  _user.get('/getLastReceivedMessage', (req, res) => {
    res.json({ result: lastReceivedMessage });
  });
  _user.get('/getLastSentMessage', (req, res) => {
    res.json({ result: lastSentMessage });
  });
  //POST Methods
  _user.post("/message", (req, res) => {
    lastReceivedMessage = req.body.message;
    res.status(200).send("success");
  });



  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });
  return server;
}
