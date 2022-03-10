import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

interface Event {
  type: EventType;
  data: Data;
}

type Events = Event[];

type EventType = "PostCreated" | "CommentCreated" | "CommentUpdated" | "CommentModerated";
type Status = "approved" | "rejected" | "pending";
interface Data  {
  id: string;
  title: string;
  content: string;
  postId: string;
  status: Status;
}

const events: Events = [];

app.post("/events", (request: Request<{},{},Event>, response: Response) => {
  const event = request.body;

  events.push(event);

  axios.post("http://posts-clusterip-srv:4000/events", event).catch((err:Error) => {
    console.log(err.message);
  });
  axios.post("http://comments-srv:4001/events", event).catch((err:Error) => {
    console.log(err.message);
  });
  axios.post("http://query-srv:4002/events", event).catch((err:Error) => {
    console.log(err.message);
  });
  axios.post("http://moderation-srv:4003/events", event).catch((err:Error) => {
    console.log(err.message);
  });
  response.send({ status: "OK" });
});

app.get("/events", (request: Request, response: Response) => {
  response.send(events);
});

app.listen(4005, () => {
  console.log("Listening on 4005");
});
