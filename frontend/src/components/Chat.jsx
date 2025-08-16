import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { chatAPI } from '../services/api';

function Chat({ activityId, user }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    // Join activity chat room
    newSocket.emit('join-activity', {
      activityId,
      userId: user.id,
      userName: user.name,
    });

    // Listen for new messages
    newSocket.on('new-message', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    // Listen for user join/leave notifications
    newSocket.on('user-joined', (data) => {
      const systemMessage = {
        type: 'system',
        message: data.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    newSocket.on('user-left', (data) => {
      const systemMessage = {
        type: 'system',
        message: data.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    return () => {
      newSocket.emit('leave-activity', {
        activityId,
        userId: user.id,
        userName: user.name,
      });
      newSocket.disconnect();
    };
  }, [activityId, user]);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.getMessages(activityId);
      setMessages(response.data);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        activityId,
        userId: user.id,
        userName: user.name,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      
      // POST to backend for persistence
      try {
        await chatAPI.sendMessage(activityId, newMessage.trim());
      } catch (err) {
        // Optionally show error
      }
      
      // Emit via socket for real-time
      socket.emit('send-message', messageData);
      setNewMessage('');
    }
  };

  const clearChat = () => {
    if (
      window.confirm(
        'Are you sure you want to clear the chat history? This action cannot be undone.'
      )
    ) {
      setMessages([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-96 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Chat</h3>
        <button
          onClick={clearChat}
          className="text-sm text-red-600 hover:text-red-800"
          title="Clear chat history"
        >
          Clear Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading chat...</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.userId === user.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.type === 'system' ? (
                <div className="text-center w-full">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {msg.message}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-xs ${
                    msg.userId === user.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } rounded-lg px-3 py-2`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.userName}
                  </div>
                  <div>{msg.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
