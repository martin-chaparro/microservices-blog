import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { randomBytes } from "crypto";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(bodyParser.json());
app.use(cors());

interface Comment {
  id: string;
  content: string;
  status: "approved" | "rejected" | "pending";
}

interface Comments {
  [key: string]: Comment[];
}

type EventType = "PostCreated" | "CommentCreated" | "CommentUpdated" | "CommentModerated";
type Status = "approved" | "rejected" | "pending";
interface Data {
  id: string;
  title: string;
  content: string;
  postId: string;
  status: Status;
}

const commentsByPostId: Comments = {};
console.log()

app.get("/posts/:id/comments", (request: Request, response: Response) => {
  const postId = request.params.id;
  response.send(commentsByPostId[postId] || []);
});

app.post("/posts/:id/comments", async (request: Request<{ id: string }, {}, { content: string }>, response) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = request.body;
  const postId = request.params.id;
  const comments = commentsByPostId[postId] || [];

  comments.push({ id: commentId, content, status: "pending" });

  commentsByPostId[request.params.id] = comments;

  await axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: request.params.id,
      status: "pending",
    },
  });

  response.status(201).send(comments);
});

app.post("/events", async (request: Request<{}, {}, { type: EventType, data: Data }>, response: Response) => {
  console.log("Event Received:", request.body.type);

  const { type, data } = request.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment: Comment) => {
      return comment.id === id;
    });
    if (comment) {
      comment.status = status;
    }

    await axios.post("http://event-bus-srv:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }

  response.send({});
});

app.listen(4001, () => {
  console.log("Listening on 4001");
});
