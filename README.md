# 🤖 Konvox - GPT Clone

A full-stack AI chat application built by **Syeda Bismah**, inspired by ChatGPT — featuring real-time conversations, text-to-speech support, responsive UI, and a seamless AI-powered chat experience.  

🔗 **Live Demo:** [Konvox - Try it here](https://chat-gpt-clone-eta-silk.vercel.app/)

---

## ✨ Overview

Konvox is a custom GPT Clone app designed for a smooth and modern AI chat experience.  
It connects a **React frontend** with a **Node.js + Express backend** and integrates **Socket.io** for real-time chat updates.  
The app mimics conversational intelligence and UI flow like ChatGPT — but with a personalized twist.

---

## 🧠 Features

- ⚡ Real-time chat with instant responses  
- 🗣️ Text-to-Speech (TTS) — hear your AI responses  
- 💬 Chat history stored and fetched dynamically  
- 📱 Responsive design — optimized for mobile and desktop  
- 🧑‍💻 User-friendly UI built with React and TailwindCSS  
- 🌐 Backend API built with Express and MongoDB  
- 🔒 Secure and modular architecture  

---

## 🛠️ Tech Stack

**Frontend:**  
- React.js  
- Tailwind CSS  

**Backend:**  
- Node.js  
- Express.js  
- MongoDB  
- Socket.io  

**AI Integration:**  
- Gemini API  

---

## 🚀 Getting Started

Follow these steps to run the project locally! 👇  

### 📋 Prerequisites

- Node.js and npm installed  
- Git installed  
- Gemini API key  
- MongoDB connection string  

### 1️⃣ Clone the Repository
git clone https://github.com/yourusername/ChatGpt_Clone.git
cd ChatGpt_Clone

### 2️⃣ Install Dependencies

#### Backend
cd backend
npm install

#### Frontend
cd ../frontend
npm install

### 3️⃣ Set Up Environment Variables
##### Create a .env file in the backend folder and add the following:
###### OPENAI_API_KEY=your_openai_api_key
###### MONGO_URI=your_mongo_connection_string
###### PORT=5000

### 4️⃣ Run the App

#### Start Backend
cd backend
npm start

### Start Frontend
cd ../frontend
npm run dev

### Your app should now be live at http://localhost:5173 🎉


---

## 🧩 API Endpoints

| Method  | Endpoint                  | Description           |
|---------|---------------------------|---------------------|
| POST    | `/api/chat`               | Send message to AI   |
| GET     | `/api/chat/messages/:chatId` | Get chat history  |
| DELETE  | `/api/chat/:chatId`       | Delete a conversation|

---

## 📸 Demo Preview

🎯 **Live Demo:** [Click to Try Konvox](https://chat-gpt-clone-eta-silk.vercel.app/)

---

## 💡 Future Enhancements

- 🧬 Multi-user authentication  
- 🗂️ Save and organize chats  
- 🌈 Custom themes and voices  
- 📲 PWA version for mobile devices  

---

## 👩‍💻 Creator

**Konvox** — an AI project by **Syeda Bismah**  

> “Built with ❤️, caffeine, and a touch of curiosity.”

🔗 [LinkedIn Demo Link](https://www.linkedin.com/posts/syeda-bisma-29202428a_ai-mern-geminiai-activity-7378023986015715328-JFIg?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEYgXo4BAjXFP33vgZfKoVRMGfAD-sZmXFE)

---


⭐ **If you like this project, don’t forget to star the repo!** ⭐

