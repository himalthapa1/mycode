# Study Group App - Authentication System

A complete MERN stack authentication system with login and registration pages.

## Features

✅ **Backend (Node.js/Express/MongoDB)**
- User registration with validation
- Secure login with JWT tokens
- Password hashing with bcrypt
- Rate limiting (5 requests/minute)
- Input validation
- Error handling with proper HTTP status codes
- CORS configuration

✅ **Frontend (React)**
- Registration page with form validation
- Login page with authentication
- Protected dashboard route
- Real-time form validation
- Error message display
- Responsive design
- Loading states

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory (or use the existing one):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studygroup
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Frontend Setup

```bash
# From root directory
npm install
```

## Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas and update the `MONGODB_URI` in `.env`

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Start Frontend Development Server

```bash
# From root directory
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. **Register a New Account**
   - Navigate to `http://localhost:5173/register`
   - Fill in username, email, and password
   - Click "Register"
   - You'll be redirected to the login page

2. **Login**
   - Navigate to `http://localhost:5173/login`
   - Enter your email and password
   - Click "Login"
   - You'll be redirected to the dashboard

3. **Dashboard**
   - View your user information
   - Logout when done

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/verify` - Verify JWT token (requires Authorization header)

## Project Structure

```
study-group-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── __tests__/
│   │   ├── user.property.test.js
│   │   ├── validation.property.test.js
│   │   └── registration.property.test.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Auth.css
│   │   └── Dashboard.css
│   ├── utils/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
└── README_AUTH.md
```

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens for authentication (24-hour expiration)
- Rate limiting on auth endpoints
- Input validation and sanitization
- CORS protection
- Protected routes requiring authentication

## Testing

Backend includes property-based tests using fast-check:

```bash
cd backend
npm test
```

Tests include:
- Password hashing verification
- Input validation
- Registration flows
- Login authentication

## Technologies Used

**Backend:**
- Express.js
- MongoDB with Mongoose
- bcryptjs
- jsonwebtoken
- express-validator
- express-rate-limit
- cors

**Frontend:**
- React 18
- React Router DOM
- Axios
- CSS3

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB port (default: 27017)

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is running on port 5000

### JWT Token Issues
- Clear localStorage in browser
- Check `JWT_SECRET` is set in `.env`
- Verify token hasn't expired (24-hour default)

## Next Steps

- Add password reset functionality
- Implement email verification
- Add social authentication (Google, GitHub)
- Create study group features
- Add user profiles
- Implement real-time chat

## License

MIT
