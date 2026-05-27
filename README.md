
🚀 Real-Time Chat Engine with Hybrid Responsive UX
A full-stack chat application engineered for high-performance real-time communication. This project features bidirectional event streaming, persistent connection states, dynamic UI layout orchestration, and a tailored hybrid UX supporting unified Desktop (Mouse) and Mobile (Touch/Gesture) workflows.

🛠️ Tech Stack & Architecture
Frontend
Core Library: React 18 (Hooks, Refs, Portals, Context)

State Management: Zustand (Decoupled, atomic global store management)

Styling & UI: Tailwind CSS + DaisyUI (Utility-first framework with dynamic theme contextual support)

Real-Time Layer: Socket.io-client (WebSockets with automatic polling fallback)

Icons: Lucide React

Backend Layout Structure (Supported)
Runtime Environment: Node.js (v18+)

Framework: Express.js (REST API Endpoints + Middleware Routing)

Database: MongoDB + Mongoose (Document-based message caching & indexing)

Communication: Socket.io (Event emit, broadcasting, and targeted room piping)

🌟 Key Features & Implementation Highlights
⚡ Hybrid Viewport Ergonomics (Desktop + Mobile Friendly)
Dynamic Layout Retention: Implements CSS h-[100dvh] container boundaries alongside Flexbox min-h-0 calculation rules. This completely prevents layout shifting or screen clipping when mobile virtual software keyboards slide into view.

iOS Safe-Zone Support: Uses native layout padding utilities (pb-[safe-area-inset-bottom]) to prevent hardware interactions (like gesture bars or home pills) from overlapping action items.

🧠 Smart Action Routing (Long-Press vs. Context Menu)
Unified Pointer Tracking: Abstracted boundary monitoring detects touch sequences (onTouchStart, onTouchEnd) vs traditional pointer configurations (onContextMenu).

Viewport Boundary Logic: Dynamically calculates client coordinates relative to window bounds to flip menus safely away from screen boundaries, avoiding dead-space overflow.

Anti-Scroll Cancellation: Includes scroll trigger dampening via onTouchMove cancellation loops to verify menu selection intent.

⚙️ Scalable Engineering Patterns
Optimistic UI Updates: Messages are pushed to state layers instantly before network confirmation handlers settle. Text layers are dynamically cached on exception catch blocks to ensure Zero-Loss data recovery for the user.

Auto-Sizing Layout Elements: Integrated runtime size monitors calculate raw scrollHeight bounds dynamically, smoothly scaling message fields upward (up to a custom 120px wrapper cap) rather than cramming long entries into narrow text inputs.

📂 Core Component Breakdowns
1. The Chat Workspace Layer (ChatContainer.jsx)
Coordinates message queues directly alongside real-time sync hooks. Manages data lifecycles, real-time tracking portals, and modal overlays.

2. The Smart Text Hub (MessageInput.jsx)
Handles input capture, dynamic resizing, file encoding (via standard FileReader streaming), and custom keystroke behavior. It limits the Enter submission bypass to screens wider than 768px, matching standard mobile app patterns.

⏱️ Quick API & WebSocket Contracts
WebSocket Events Managed
TypeScript
// Outbound Events
socket.emit("editMessage", { messageId: string, newText: string, receiverId: string });
socket.emit("deleteForEveryone", { messageId: string, receiverId: string });
socket.emit("deleteForMe", { messageId: string, receiverId: string });

// Inbound Subscriptions
socket.on("messageEdited", (updatedMessage) => { /* Update State Layer */ });
socket.on("messageDeleted", ({ messageId }) => { /* Cascade Delete UI */ });
🚀 Getting Started
1. Clone the repository
Bash
git clone https://github.com/yourusername/realtime-chat-engine.git
cd realtime-chat-engine
2. Install dependencies
Bash
# Install Frontend dependencies
cd frontend
npm install

# Install Backend dependencies
cd ../backend
npm install
3. Environment Setup
Create a .env file in your root backend directory:

Code snippet
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
4. Run the development environment
Bash
# Run backend (from backend folder)
npm run dev

# Run frontend (from frontend folder)
npm run dev
