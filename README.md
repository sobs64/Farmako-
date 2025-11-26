# 🏥 Farmako+ - Doctor Appointment Management System

A modern, full-stack web application for managing doctor appointments with real-time queue management, wait time prediction, and patient-doctor communication features.

![Farmako+](https://img.shields.io/badge/Farmako+-Healthcare-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Features Breakdown](#-features-breakdown)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 👨‍⚕️ Doctor Features
- **Dashboard Management**: View and manage patient queue in real-time
- **Schedule Creation**: Create weekly availability with interactive day/time slot picker
- **Appointment Management**: Start, manage, and complete patient sessions
- **Remarks System**: Add clinical remarks and notes during active sessions
- **Patient Chat**: View and respond to patient messages
- **Queue Monitoring**: Real-time view of waiting and in-progress patients
- **Schedule Timeline**: Visual weekly availability timeline

### 👤 Patient Features
- **Doctor Discovery**: Browse available doctors and their specializations
- **Smart Booking**: Day-first booking flow with real-time slot availability
- **Wait Time Prediction**: See estimated wait time based on queue position
- **Appointment History**: View all past and upcoming appointments sorted by real-time
- **Doctor Chat**: Direct messaging with doctors
- **Remarks View**: Access doctor's clinical remarks and notes
- **Schedule View**: Track upcoming and past appointments

### 🎨 General Features
- **Dark Mode**: Full dark mode support with theme persistence
- **Multi-language**: Language selection (English/Español)
- **Real-time Updates**: Live queue and appointment status updates
- **Responsive Design**: Mobile-friendly interface
- **Secure Authentication**: JWT-based authentication system
- **Role-based Access**: Separate dashboards for doctors and patients

## 🛠 Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **React Router DOM 6.30.1** - Routing
- **Vite 5.4.0** - Build tool
- **Tailwind CSS 3.4.18** - Styling
- **Axios 1.7.2** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB** - Database
- **Mongoose 8.19.2** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
Farmako+
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── api/                    # API configuration
│   │   │   └── axios.js
│   │   ├── components/              # React components
│   │   │   ├── ChatWindow.jsx      # Patient chat component
│   │   │   ├── DoctorChatWindow.jsx # Doctor chat component
│   │   │   ├── RemarksModal.jsx    # Remarks modal
│   │   │   └── layout/             # Layout components
│   │   │       ├── DashboardLayout.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Topbar.jsx
│   │   ├── context/                # React contexts
│   │   │   ├── AuthContext.jsx     # Authentication context
│   │   │   └── ThemeContext.jsx    # Theme & language context
│   │   ├── pages/                  # Page components
│   │   │   ├── AppointmentHistory.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── Schedule.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/               # API services
│   │   │   └── api.js
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   ├── vite.config.js              # Vite configuration
│   └── tailwind.config.js          # Tailwind configuration
│
├── server/                         # Backend Express application
│   ├── src/
│   │   ├── config/                 # Configuration files
│   │   │   └── db.js               # MongoDB connection
│   │   ├── controllers/            # Route controllers
│   │   │   ├── appointmentController.js
│   │   │   ├── authController.js
│   │   │   ├── doctorController.js
│   │   │   ├── queueController.js
│   │   │   └── scheduleController.js
│   │   ├── middleware/             # Express middleware
│   │   │   └── authMiddleware.js   # JWT authentication
│   │   ├── models/                 # Mongoose models
│   │   │   ├── Appointment.js
│   │   │   ├── Schedule.js
│   │   │   └── User.js
│   │   ├── routes/                 # API routes
│   │   │   ├── appointmentRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── scheduleRoutes.js
│   │   ├── utils/                  # Utility functions
│   │   │   └── predictWaitTime.js # Wait time prediction
│   │   └── server.js               # Server entry point
│   └── package.json
│
└── README.md                       # Project documentation
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Farmako+
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

## ⚙️ Configuration

### Server Configuration

Create a `.env` file in the `server/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/farmako-plus
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/farmako-plus

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=5000
```

### Client Configuration

The client is configured to connect to `http://localhost:5000` by default. If your server runs on a different port, update the API base URL in `client/src/api/axios.js`.

## 🏃 Running the Application

### Development Mode

1. **Start the MongoDB server** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:5000`

3. **Start the frontend development server** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:5173` (or the next available port)

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd server
   npm start
   ```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (doctor/patient)
- `POST /api/auth/login` - Login user
- `GET /api/auth/doctors` - Get all doctors

### Appointments
- `POST /api/appointments` - Book new appointment
- `GET /api/appointments/patient` - Get patient's appointments
- `GET /api/appointments/doctor` - Get doctor's appointments
- `GET /api/appointments/queue/:id` - Get doctor's queue
- `PATCH /api/appointments/:id/status` - Update appointment status
- `PATCH /api/appointments/:id/remarks` - Add/update remarks

### Schedules
- `POST /api/schedules` - Create/update doctor schedule
- `GET /api/schedules/doctor/:id` - Get doctor's schedule

## 🎯 Features Breakdown

### 1. Appointment Management
- Real-time appointment booking with day-first selection
- Status tracking (waiting → in_progress → completed)
- Appointment history sorted by real scheduled time
- Remarks system for clinical notes

### 2. Queue Management
- Real-time patient queue display
- Wait time prediction based on:
  - Number of patients ahead
  - Average appointment duration (minimum 10 minutes per patient)
  - Queue position tracking

### 3. Schedule Management
- Interactive schedule creation with day/time picker
- Weekly availability timeline visualization
- Real-time slot availability checking

### 4. Communication
- Patient-doctor chat system
- Message persistence (localStorage)
- Unread message indicators
- Real-time chat updates

### 5. Theme & Localization
- Light/Dark mode toggle
- Theme persistence
- Multi-language support (English/Español)
- Language preference storage

### 6. User Experience
- Responsive design for all screen sizes
- Real-time data updates
- Intuitive navigation with sidebar
- Status badges and visual indicators

## 💡 Usage Guide

### For Doctors

1. **Register/Login**: Create an account with doctor role and specialization
2. **Create Schedule**: 
   - Go to Dashboard → Create New Schedule
   - Select day using day pills
   - Choose time slots (multiple selection supported)
   - Save schedule
3. **Manage Appointments**:
   - View queue in Dashboard
   - Start session when patient arrives
   - Add remarks during active session
   - Complete session when done
4. **Chat with Patients**: Click chat button to view and respond to patient messages

### For Patients

1. **Register/Login**: Create an account with patient role
2. **Book Appointment**:
   - Browse available doctors
   - Click "View Slots & Book"
   - Select day first
   - Choose available time slot for that day
   - Confirm booking
3. **View Wait Time**: Check estimated wait time based on queue position
4. **Chat with Doctor**: Click 💬 button on doctor card to start conversation
5. **View History**: Check past appointments and doctor's remarks

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally or check Atlas connection string
   - Verify `MONGO_URI` in `.env` file

2. **Port Already in Use**
   - Change `PORT` in server `.env` file
   - Update client API base URL if needed

3. **CORS Errors**
   - Ensure server is running before starting client
   - Check that API base URL matches server port

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET is set in server `.env`

## 📸 Screenshots

### Doctor Dashboard
- Queue management with real-time updates
- Interactive schedule creation interface
- Patient chat with message history
- Appointment workflow with status management

### Patient Dashboard
- Doctor browsing with specialization
- Day-first booking flow
- Wait time prediction display
- Appointment history with remarks

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔒 Security Notes

- JWT tokens are stored in localStorage
- Passwords are hashed using bcryptjs
- API routes are protected with authentication middleware
- CORS is enabled for development (configure for production)

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the client: `cd client && npm run build`
2. Deploy the `dist` folder
3. Update API base URL to production server URL

### Backend Deployment (Heroku/Railway)
1. Set environment variables in your hosting platform
2. Ensure MongoDB connection is accessible
3. Update CORS settings for production domain

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Sohan B** - *Author and Developer*

## 🙏 Acknowledgments

- Built with React and Express
- UI components styled with Tailwind CSS
- Icons provided by Lucide React

---

**Note**: Make sure to set up your MongoDB connection and JWT secret before running the application. For production deployment, use environment variables and secure your API endpoints.

