# 🚀 Planify — Enterprise-Grade Collaborative Project Management Tool


[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15%2B-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

> Built as part of the **Invoqe Full-Stack Development Internship Program** (Task 3: Project Management Tool). Planify is a real-time, production-grade collaborative workspace inspired by industry leaders like Trello and Asana, featuring modern clean UI architecture, secure JWT authentication, and live WebSocket synchronization.

---

## 🌟 Executive Summary & Overview

Modern engineering teams require fast, intuitive, and deterministic task-tracking tools. **Planify** bridges the gap between clean aesthetics and robust performance. Built from the ground up with zero AI-generated shortcuts in core logic, it delivers complete multi-user collaboration, real-time board mutations, granular role-based access control (RBAC), and comprehensive project lifecycle management.

## 📊 Workflow & Architecture

<div align="center">
  <img src="./workflow-diagram.png" alt="Planify System Workflow" width="100%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>
---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React.js / Next.js 15 (App Router, TypeScript)
* **Styling:** Tailwind CSS (Clean Light Theme UI Architecture)
* **Icons & UI Elements:** Lucide React, custom accessible modal primitives
* **State Management:** React Context + Real-time Socket Client

### **Backend**
* **Runtime & Framework:** Node.js / NestJS 10 (TypeScript)
* **API Architecture:** RESTful endpoints with strict validation pipes
* **Real-Time Layer:** Socket.io (bidirectional WebSocket gateway)
* **Authentication:** JSON Web Tokens (JWT) with bcrypt password hashing

### **Database & ORM**
* **Database:** PostgreSQL
* **ORM:** Prisma ORM (Fully relational schema with cascading rules and composite keys)

---

## ✨ Key Features Implemented

* **Secure Authentication & RBAC:** Complete sign-up, login, token-based guards, and role enforcement (`ADMIN` vs. `MEMBER`). Only admins can manage team members and delete projects.
* **Kanban Task Board & List View:** Interactive dual-view project boards with 3 core columns (*To Do*, *In Progress*, *Done*).
* **Drag-and-Drop Workflow:** Instant optimistic UI feedback when moving task cards across columns.
* **Real-Time Synchronization:** Live broadcast of task status mutations, comments, and task creation across multiple connected browser sessions via WebSockets.
* **Granular Task Details & Checklists:** Subtask checklist engine, priority tagging (Low, Medium, High), due dates, and direct author comment threads.
* **Activity Audit Logging:** Real-time tracking of project actions and member activity logs.

---

## 📂 Database Architecture (Prisma Schema)

Planify utilizes a robust relational schema mapping out 6 core models:
1. **User:** Manages credentials, profile data, and system roles.
2. **Project:** Core workspace container for tasks and members.
3. **ProjectMember:** Junction table handling multi-tenant user-to-project associations and RBAC roles.
4. **Task:** Core item entity linked to projects, assignees, and statuses.
5. **Comment:** Discussion threads tied to individual tasks.
6. **Activity:** Immutable audit trail logging project actions.

---

## 🚀 Local Setup & Installation Guide

Follow these steps to run the application locally on your machine:

### **1. Clone the Repository**
```bash
git clone [https://github.com/namanyawalkar2006/Invoqe_ProjectManagement.git](https://github.com/namanyawalkar2006/Invoqe_ProjectManagement.git)
cd Invoqe_ProjectManagement
```
### **2. Install Dependencies
```bash
npm install
```
### **3. Configure Environment Variables
Create a .env file in the root directory based on the .env.example template:

Code snippet
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invoqe_projectmanagement?schema=public"
JWT_SECRET="your_secure_jwt_secret_key"
JWT_EXPIRES_IN="7d"
VITE_API_BASE_URL="http://localhost:3000/api/v1"

### **4. Run Database Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```
### **5. Start the Development Servers
```bash
npm run dev
```
Frontend Application: http://localhost:5173

Backend API & WebSockets: http://localhost:3000
``
### **🎥 Project Demo & Pitch
GitHub Repository: Invoqe_ProjectManagement

Demo Video: [Insert Link to your Loom / YouTube Demo Video Here]

Live Deployment: [Insert Deployment Link if hosted on Vercel/Render]
``
### **👤 Author
Naman Kalpesh Yawalkar

Full-Stack Engineering Intern @ Invoqe
