# Seattle Protests

A community event listing website for protests, strikes, and rallies in the Seattle/King County area. This application features a MongoDB backend with JWT authentication for admin functionality and an approval workflow for user-submitted events.

## Features

- **Public Event Listings**: Browse upcoming events organized by time (Today, This Week, This Month)
- **Event Submission**: Community members can submit events for approval
- **Admin Dashboard**: Authenticated admins can approve, manage, and delete events
- **Approval Workflow**: All submitted events require admin approval before appearing publicly
- **JWT Authentication**: Secure cookie-based admin sessions

## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Vite (development server & build tool)
- Modular architecture (events, admin, utils, API layer)

**Backend:**
- Node.js with Express
- MongoDB for data persistence
- JWT for authentication
- bcrypt for password hashing

## Prerequisites

Before setting up this project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Installation guide](https://www.mongodb.com/docs/manual/installation/)
- **npm** (comes with Node.js)

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/solidarityseattle/solidarityseattle.github.io.git
cd solidarityseattle.github.io
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB

Make sure MongoDB is installed and running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
# MongoDB should start automatically as a service after installation
```

The application will automatically create the required database (`solidarity_seattle`) and collection (`website_events`) on first connection.

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following environment variables:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017

# JWT secret for admin authentication (generate a secure random string)
JWT_SECRET=your_secure_random_string_here

# Admin password hash (see instructions below)
ADMIN_HASH=your_bcrypt_hash_here
```

#### Generating an Admin Password Hash

To create a bcrypt hash for your admin password:

1. Add this line somewhere in `server.js`:
   ```javascript
   bcrypt.hash("YourPasswordHere", 10).then((hash) => console.log(hash));
   ```

2. Run the server once:
   ```bash
   node server.js
   ```

3. Copy the hash that appears in the console

4. Paste it into your `.env.local` file as the `ADMIN_HASH` value

5. Remove the hash generation line from `server.js`

**Example `.env.local` file:**
```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ADMIN_HASH=$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK
```

### 5. Configure Vite API URL (Optional)

By default, the frontend uses relative URLs that are proxied through Vite. If you need to change the API URL, create a `.env` file:

```bash
touch .env
```

Add:
```env
VITE_API_URL=http://localhost:3000/api
```

For development with the default proxy setup, you can leave this empty or omit it entirely.

## Running the Application

### Development Mode

The easiest way to run both the frontend and backend together:

```bash
npm run dev
```

This command uses `concurrently` to start:
- **Vite dev server** on `http://localhost:8000` (frontend)
- **Express server** on `http://localhost:3000` (backend API)

Open your browser and navigate to `http://localhost:8000`

### Running Frontend and Backend Separately

**Start the backend:**
```bash
node server.js
```

**Start the frontend (in a separate terminal):**
```bash
npm run dev
```

### Production Build

To create a production build:

```bash
npm run build
```

This generates optimized static files in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
solidarityseattle.github.io/
├── src/                    # Frontend source files
│   ├── main.js            # Application entry point
│   ├── events.js          # Public event fetching and rendering
│   ├── admin.js           # Admin authentication and management
│   ├── utils.js           # Shared utility functions
│   └── api.js             # Centralized API client
├── public/                # Static assets
├── server.js              # Express backend server
├── index.html             # Main HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── .env.local            # Local environment variables (not in git)
```

## API Endpoints

### Public Endpoints

- `GET /api/events` - Get all approved events
- `POST /api/add` - Submit a new event (requires approval)

### Admin Endpoints (require authentication)

- `POST /api/admin/login` - Authenticate and receive JWT cookie
- `POST /api/admin/logout` - Clear authentication cookie
- `GET /api/admin/events` - Get all events (approved and unapproved)
- `PATCH /api/events/:id/approve` - Approve a pending event
- `DELETE /api/events/:id` - Delete an event

## Database Schema

Events are stored in MongoDB with the following structure:

```javascript
{
  _id: ObjectId,           // Auto-generated MongoDB ID
  title: String,           // Event title
  timestamp: Date,         // Combined date and time of event
  location: String,        // Event location
  description: String,     // Event description
  createdAt: Date,         // When the event was submitted
  approved: Boolean        // Whether admin has approved the event
}
```

## Development Notes

- **Week Logic**: The week runs Monday-Sunday (calculated in `utils.js:isThisWeek()`)
- **CORS**: In development, the Vite proxy handles cross-origin requests. For production, configure CORS origins in `server.js`
- **Security**: The `secure` cookie flag is automatically set to `true` in production and `false` in development
- **Input Sanitization**: User inputs are sanitized on the frontend before submission

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoDB connection failed"**
- Ensure MongoDB is running: `mongosh` (if this connects, MongoDB is running)
- Check your `MONGODB_URI` in `.env.local`
- On macOS: `brew services list` to check MongoDB status

### Admin Login Not Working

**Error: 404 on login**
- Ensure both Vite and the backend server are running
- Check that `VITE_API_URL` matches your backend URL
- Verify the Vite proxy configuration in `vite.config.js`

**Error: "Incorrect password"**
- Verify your `ADMIN_HASH` in `.env.local` matches the bcrypt hash of your password
- Make sure you generated the hash correctly using the instructions above

### Port Already in Use

If port 3000 or 8000 is already in use:
- Change the backend port in `server.js`
- Change the frontend port in `vite.config.js`

## Contributing

This is a community project. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [ISC License](LICENSE).

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
