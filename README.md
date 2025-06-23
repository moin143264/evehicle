# ⚡ EV Charging Station Finder – Backend (Hosted on Railway)

This is the backend service for the EV Charging Station Finder system. It provides RESTful APIs for charging station management, user authentication, search filtering, and real-time station availability. The backend is built using **Node.js**, **Express.js**, and **MongoDB**, and is hosted on **Railway** for easy cloud deployment and scalability.

💻 **GitHub Repo**: https://github.com/moin143264/evehicle

---

## 🛠️ Technologies Used

- **Node.js** – Backend runtime environment  
- **Express.js** – REST API framework  
- **MongoDB** – NoSQL database  
- **Mongoose** – Schema modeling for MongoDB  
- **JWT (JSON Web Tokens)** – Authentication  
- **Railway** – Cloud hosting platform  
- **dotenv** – Environment variable configuration  
- **CORS** – Cross-origin request support

---

## 📂 Key Features

✅ Create, read, update, and delete EV charging station entries  
✅ Search and filter stations by type, location, or availability  
✅ User registration, login, and role-based access  
✅ Station booking logic (if extended)  
✅ Full CRUD for station management by admin  
✅ Secure authentication with JWT tokens  
✅ Fully hosted and deployed using Railway

---

## 🚀 Getting Started (Local Setup)

1. **Clone the repository**
```bash
git clone https://github.com/moin143264/evehicle
cd evehicle
npm install
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret_key
PORT=5000
npm start
📁 Folder Structure
evehicle/
├── models/          # Mongoose schemas (User, Station)
├── routes/          # Auth, station, admin routes
├── controllers/     # Business logic per route
├── middleware/      # JWT verification, error handling
├── utils/           # Helper functions
├── config/          # DB connection logic
├── .env             # Environment variables
🔐 API Endpoints Overview
| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | /api/auth/register | User registration              |
| POST   | /api/auth/login    | User login                     |
| GET    | /api/stations      | Get all stations               |
| POST   | /api/stations      | Add a new station (admin only) |
| PUT    | /api/stations/\:id | Update station                 |
| DELETE | /api/stations/\:id | Delete station                 |
🌐 Hosted On
Railway.app – Project is live and accessible via Railway deployment.

