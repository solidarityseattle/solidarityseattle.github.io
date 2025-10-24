import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

// Only load .env.local for local development
// In production, use hosting platform's env variables
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

const app = express();
const port = 3000;
const host = "0.0.0.0";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_HASH = process.env.ADMIN_HASH;

const client = new MongoClient(process.env.MONGODB_URI);

if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      //TODO: Fix this later with a real url
      origin: ["https://yourfrontend.com"],
      credentials: true,
    }),
  );
}

//Allows express to read JSON request bodies
app.use(express.json());
app.use(cookieParser());

// add more retries later (but for now for testing 1 is chill)
async function connectToMongo(retries = 1, delay = 2000) {
  while (retries) {
    try {
      await client.connect();
      console.log("Connected successfully to MongoDB");
      return client.db("solidarity_seattle").collection("website_events");
    } catch (err) {
      console.error("MongoDB connection failed, retrying...", err);
      retries -= 1;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("MongoDB connection failed after retries");
}

let eventsCollection;

// Connect to MongoDB when the server starts
connectToMongo()
  .then((collection) => {
    eventsCollection = collection;
    app.listen(port, host, () => {
      console.log(`Server listening at http://${host}:${port}`);
    });
  })
  .catch(console.error);

function authenticateAdmin(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") throw new Error();
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden" });
  }
}

app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;

  if (!ADMIN_HASH)
    return res.status(500).json({ error: "Admin password not set." });
  if (!password) return res.status(400).json({ error: "Password required." });

  const valid = await bcrypt.compare(password, ADMIN_HASH);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  res.json({ success: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// public get: only returns approved events
app.get("/api/events", async (req, res) => {
  if (!eventsCollection) {
    return res.status(503).send("Database not connected.");
  }

  try {
    const events = await eventsCollection.find({ approved: true }).toArray();
    res.json(events);
  } catch (error) {
    res.status(500).send("Error fetching events from database.");
  }
});

// admin get: returns all events
app.get("/api/admin/events", authenticateAdmin, async (req, res) => {
  if (!eventsCollection) {
    return res.status(503).send("Database not connected.");
  }

  try {
    const events = await eventsCollection.find({}).toArray();
    res.json(events);
  } catch (error) {
    res.status(500).send("Error fetching events from database.");
  }
});

app.post("/api/add", async (req, res) => {
  if (!eventsCollection) {
    return res.status(503).send("Database not connected.");
  }

  //Add validation????
  const { title, date, time, location, description } = req.body;

  try {
    const timestamp = new Date(`${date}T${time}`);

    const newEvent = {
      title,
      timestamp,
      location,
      description,
      createdAt: new Date(),
      approved: false,
    };

    const result = await eventsCollection.insertOne(newEvent);

    res
      .status(201)
      .json({ message: "Event sumbitted successfully", id: result.insertedId });
  } catch (error) {
    //Should I be more specific about what error I'm catching??
    console.error("Error inserting event:", error);
    res.status(500).send("Failed to add event.");
  }
});

// Delete by id
app.delete("/api/events/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).send("Deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete event");
  }
});

app.patch("/api/events/:id/approve", authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send("Invalid event ID");
  }

  try {
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: true } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Event not found");
    }

    res.status(200).send("Event approved");
  } catch (err) {
    console.error("Error approving event:", err);
    res.status(500).send("Failed to approve event");
  }
});
