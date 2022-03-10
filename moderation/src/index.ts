import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

type EventType = "PostCreated" | "CommentCreated" | "CommentUpdated" | "CommentModerated";
type Status = "approved" | "rejected" | "pending";
interface Data  {
  id: string;
  title: string;
  content: string;
  postId: string;
  status: Status;
}

app.post('/events', async (request:Request<{},{},{type:EventType, data:Data}>, response:Response) => {
  const { type, data } = request.body;

  if (type === 'CommentCreated') {
    const status = data.content.includes('sex') ? 'rejected' : 'approved';

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentModerated',
      data: {
        id: data.id,
        postId: data.postId,
        status,
        content: data.content
      }
    });
  }

  response.send({});
});

app.listen(4003, () => {
  console.log('Listening on 4003');
});
