import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "./AgentChat.css";
import axios from "axios";

interface AgentChatProps {}

interface ChatMessage {
  id: number;
  sender: "user" | "agent";
  text: string;
  type: "message" | "internal_monologue";
  fullData?: any;
}

const AgentChat: React.FC<AgentChatProps> = () => {
  const location = useLocation();
  const { agentId } = useParams<{ agentId: string }>();
  const agentName = location.state?.agentName || agentId;
  const [currentPage, setCurrentPage] = useState(1);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  ); // Modal state
  const chatContainerRef = useRef<HTMLDivElement | null>(null); // Reference to the chat container

  useEffect(() => {
    setMessages([]);
    fetchMessages();

    const chatContainer = chatContainerRef.current;

    // Scroll event listener
    const handleScroll = () => {
      return; // Disabled scroll paging
      // if (chatContainer && chatContainer.scrollTop === 0) {
      //   // User scrolled to the top, fetch more messages
      //   setCurrentPage((prevPage) => prevPage + 1);
      //   fetchMessages();
      // }
    };

    // Add scroll event listener only if chatContainer is not null
    // if (chatContainer) {
    //   chatContainer.addEventListener("scroll", handleScroll);
    // }

    // // Cleanup event listener on unmount
    // return () => {
    //   if (chatContainer) {
    //     chatContainer.removeEventListener("scroll", handleScroll);
    //   }
    // };
  }, []);

  const fetchMessages = async () => {
    try {
      // Get all messages from local storage
      const storedMessages = JSON.parse(
        localStorage.getItem(getMessagesKey()) || "[]",
      );

      // // Variables for pagination
      // const pageSize = 20; // Desired number of messages per page
      // const totalMessages = storedMessages.length;

      // // Calculate the total number of pages
      // const totalPages = Math.ceil(totalMessages / pageSize);

      // // Clamp currentPage to avoid going out of bounds
      // const clampedCurrentPage = Math.max(
      //   0,
      //   Math.min(currentPage, totalPages - 1),
      // );

      // // Calculate start and end indices for slicing
      // const endIndex = Math.max(
      //   totalMessages - clampedCurrentPage * pageSize,
      //   0,
      // );
      // const startIndex = Math.max(endIndex - pageSize, 0);

      // console.log("Total Messages:", totalMessages);
      // console.log("Current Page:", clampedCurrentPage);
      // console.log("Start Index:", startIndex);
      // console.log("End Index:", endIndex);

      // // Get a subset of the messages for the current page
      // const messagesSubset = storedMessages.slice(startIndex, endIndex);

      setMessages((prevMessages) => [...prevMessages, ...storedMessages]);

      // Scroll to bottom
      if (chatContainerRef && chatContainerRef.current)
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to fetch chat.");
    }
  };

  // Handle the submission of a new user message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add the user's message to the chat
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: userMessage.trim(),
      type: "message",
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setUserMessage(""); // Clear the input field
    saveMessageToLocalStorage(newMessage);

    // Make an API call to send the message to the agent
    try {
      setIsTyping(true);

      const response = await axios.post(`/api/v1/agent/${agentId}/chat`, {
        message: userMessage,
      });

      //const fullData = response.data.messages; // Store full response data for modal
      parseMessages(response.data.messages, true, true);
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsTyping(false);
    }
  };

  const getMessagesKey = () => {
    let key = `messages-${agentId}`;
    return key;
  };

  // Save the user's message to local storage
  const saveMessageToLocalStorage = (message: ChatMessage) => {
    const storedMessages = localStorage.getItem(getMessagesKey());
    const parsedMessages: ChatMessage[] = storedMessages
      ? JSON.parse(storedMessages)
      : [];
    parsedMessages.push(message);
    localStorage.setItem(getMessagesKey(), JSON.stringify(parsedMessages));
  };

  const parseMessages = (
    messages: Array<any>,
    saveToLocalStorage: boolean = false,
    checkForSendMessageReply: boolean = false,
  ) => {
    let foundSendMessage = false;
    // Loop through the messages to find "send_message"
    for (let msg of messages) {
      const parsedMsg = msg;

      // Check if the message contains "send_message"
      if (
        parsedMsg.function_call &&
        parsedMsg.function_call.name === "send_message"
      ) {
        const agentMessage: ChatMessage = {
          id: Date.now() + 1,
          sender: "agent",
          text: JSON.parse(parsedMsg.function_call.arguments).message, // Extract the actual message
          type: "message",
          fullData: messages, // Store the full message data for modal
        };
        if (saveToLocalStorage) saveMessageToLocalStorage(agentMessage);
        setMessages((prevMessages) => [...prevMessages, agentMessage]);
        foundSendMessage = true;
      }

      if (parsedMsg.internal_monologue) {
        const agentMonologue: ChatMessage = {
          id: Date.now() + 1,
          sender: "agent",
          text: parsedMsg.internal_monologue,
          type: "internal_monologue",
        };
        if (saveToLocalStorage) saveMessageToLocalStorage(agentMonologue);
        setMessages((prevMessages) => [...prevMessages, agentMonologue]);
      }
    }

    // If no "send_message" is found, show "No Response"
    if (!foundSendMessage && checkForSendMessageReply) {
      const agentMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "agent",
        text: "[System: Agent gave no response.]",
        type: "message",
        fullData: messages, // Store the full message data for modal
      };
      if (saveToLocalStorage) saveMessageToLocalStorage(agentMessage);
      setMessages((prevMessages) => [...prevMessages, agentMessage]);
    }
  };

  // Function to handle message click and show modal
  const handleMessageClick = (message: ChatMessage) => {
    if (message.type == "internal_monologue" || message.sender == "user")
      return;
    setSelectedMessage(message); // Set the clicked message data to be displayed in the modal
  };

  // Function to close the modal
  const closeModal = () => {
    setSelectedMessage(null); // Reset the selected message
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Chat with {agentName}</div>
      <div ref={chatContainerRef} className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={`${msg.sender}-${msg.id}-${index}`} // Unique key combining sender, id, and index
            className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : msg.type == "internal_monologue" ? "agent-bubble internal-monologue" : "agent-bubble"}`}
            onClick={() => handleMessageClick(msg)} // Add click event to show modal
          >
            {msg.type == "internal_monologue" ? '"' + msg.text + '"' : msg.text}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>

      {/* Modal to show full message data */}
      {selectedMessage && (
        <div className="modal">
          <div className="modal-content">
            <h3>Message Details</h3>
            <pre>{JSON.stringify(selectedMessage.fullData, null, 2)}</pre>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AgentChat;
