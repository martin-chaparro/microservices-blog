import express, { Request, Response } from "express";
import { randomBytes } from "crypto";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(express.json());
app.use(cors());

interface Post {
  id: string;
  title: string;
}

interface Posts {
  [key: string]: Post;
}

const posts:Posts = {}

app.get("/posts", (request: Request, response:Response) => {
  response.send(posts);
});

app.post("/posts/create", async (request:Request<{},{},{title:string}>, response:Response) => {
  const id = randomBytes(4).toString("hex");
  const { title } = request.body;

  posts[id] = {
    id,
    title,
  };

  await axios.post("http://event-bus-srv:4005/events", {
    type: "PostCreated",
    data: {
      id,
      title,
    },
  });

  response.status(201).send(posts[id]);
});

app.post("/events", (request:Request, response:Response) => {
  console.log("Received Event", request.body.type);

  response.send({});
});

app.listen(4000, () => {
  console.log("Listening on 4000");
});
