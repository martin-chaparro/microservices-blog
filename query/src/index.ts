import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(express.json());
app.use(cors());

interface Comment {
  id: string;
  content: string;
  status: string;
}

interface Post {
  id: string;
  title: string;
  comments: Comment[];
}

interface Posts {
  [key: string]: Post;
}

interface Data  {
  id: string;
  title: string;
  content: string;
  postId: string;
  status: string;
}

const posts:Posts = {};

type EventType = "PostCreated" | "CommentCreated" | "CommentUpdated";

const handleEvent = (type:EventType, data:Data) => {
  if (type === "PostCreated") {
    const { id, title } = data;
    
    posts[id] = { id, title, comments: [] };
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    post.comments.push({ id, content, status });
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    const comment = post.comments.find((comment:Comment) => {
      return comment.id === id;
    });
    if (comment) {
      comment.content = content;
      comment.status = status;
    }
  }
};

app.get("/posts", (request:Request, response:Response) => {
  response.send(posts);
});

app.post("/events", (request:Request<{},{},{type:EventType,data:Data}>, response:Response) => {
  const { type, data } = request.body;

  handleEvent(type, data);

  response.send({});
});

app.listen(4002, async () => {
  console.log("Listening on 4002");
  try {
    const response = await axios.get("http://event-bus-srv:4005/events");

    for (let event of response.data) {
      console.log("Processing event:", event.type);

      handleEvent(event.type, event.data);
    }
  } catch (error:any) {
    console.log(error.message);
  }
});
