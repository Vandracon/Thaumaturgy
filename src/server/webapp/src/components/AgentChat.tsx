import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "./AgentChat.css";
import axios from "axios";

interface AgentChatProps {}

interface ChatMessage {
  id: number;
  sender: "user" | "agent" | "tool";
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

  const AGENT_NO_RESPONSE = "[System: Agent gave no response.]";

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    // Initial message load
    setMessages([]);
    fetchMessages();

    // Scroll event listener to load more messages when reaching the top
    const handleScroll = () => {
      if (chatContainer && chatContainer.scrollTop === 0) {
        // User scrolled to the top, fetch more messages
        setCurrentPage((prevPage) => prevPage + 1);
        fetchMessages();
      }
    };

    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }

    // Cleanup event listener on unmount
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Adjust scroll position after new messages are added
  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    if (chatContainer && chatContainer.dataset.previousScrollTop) {
      const previousScrollTop = parseFloat(
        chatContainer.dataset.previousScrollTop,
      );
      const previousScrollHeight = parseFloat(
        chatContainer.dataset.previousScrollHeight as string,
      );
      const newScrollHeight = chatContainer.scrollHeight;

      // Restore scroll position based on height difference
      chatContainer.scrollTop =
        previousScrollTop + (newScrollHeight - previousScrollHeight);
    }
  }, [messages]);

  let page = 1;
  let pageSize = 20;
  let historyRequestPending = false;
  let reachedEnd = false;

  const fetchMessages = async () => {
    try {
      if (historyRequestPending == true || reachedEnd) return;
      historyRequestPending = true;

      // Capture current scroll height and top position before loading new messages
      const previousScrollHeight =
        chatContainerRef.current?.scrollHeight.toString();
      const previousScrollTop = chatContainerRef.current?.scrollTop.toString();

      //console.log(`Getting chat history page ${page}`);
      const response = await axios.get(
        `/api/v1/mod/agent/${agentId}/chat/history?page=${page}&pageSize=${pageSize}`,
      );
      reachedEnd = response.data.entries.length == 0;
      if (reachedEnd) return;
      response.data.entries.reverse();

      let messages: Array<ChatMessage> = processChatHistory(
        response.data.entries,
      );

      //console.log(`chat history for page ${page}`, response.data.entries);
      page++;

      setMessages((prevMessages) => [...messages, ...prevMessages]);

      // Store scroll positions in ref so we can access them in the next useEffect
      if (chatContainerRef.current) {
        chatContainerRef.current.dataset.previousScrollTop = previousScrollTop;
        chatContainerRef.current.dataset.previousScrollHeight =
          previousScrollHeight;
      }

      if (page == 2) scrollToBottom(); // Initial request
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to fetch chat.");
    } finally {
      historyRequestPending = false;
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
    scrollToBottom();
    setUserMessage(""); // Clear the input field

    // Make an API call to send the message to the agent
    try {
      setIsTyping(true);

      const response = await axios.post(`/api/v1/agent/${agentId}/chat`, {
        message: userMessage,
      });

      parseLiveMessages(response.data.messages, true);
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    });
  };

  const getMessagesKey = () => {
    let key = `messages-${agentId}`;
    return key;
  };

  let messageIdIndex = 0;
  const generateMessageId = () => {
    messageIdIndex++;
    return messageIdIndex;
  };

  // General helper to add a message to the current state
  const addMessage = (newMessage: ChatMessage) => {
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Process each message in live chat
  const parseLiveMessages = (
    messages: Array<any>,
    checkForSendMessageReply: boolean = false,
  ) => {
    let foundSendMessage = false;

    for (let msg of messages) {
      // Handle "send_message" function calls
      if (msg.function_call?.name === "send_message") {
        const agentMessage: ChatMessage = {
          id: generateMessageId(),
          sender: "agent",
          text: JSON.parse(msg.function_call.arguments).message,
          type: "message",
          fullData: messages,
        };
        addMessage(agentMessage);
        foundSendMessage = true;
      } else if (msg.function_call) {
        const toolCall: ChatMessage = {
          id: generateMessageId(),
          sender: "tool",
          text: msg.function_call?.name + ": " + msg.function_call.arguments,
          type: "message",
          fullData: messages,
        };
        addMessage(toolCall);
      } else if (msg.function_return && msg.function_return != "None") {
        const toolReturn: ChatMessage = {
          id: generateMessageId(),
          sender: "tool",
          text: msg.function_return,
          type: "message",
          fullData: messages,
        };
        addMessage(toolReturn);
      }

      // Handle internal monologue
      if (msg.internal_monologue) {
        const agentMonologue: ChatMessage = {
          id: generateMessageId(),
          sender: "agent",
          text: msg.internal_monologue,
          type: "internal_monologue",
          fullData: msg,
        };
        addMessage(agentMonologue);
      }
    }

    // Add "No Response" message if no "send_message" is found
    if (!foundSendMessage && checkForSendMessageReply) {
      addMessage({
        id: generateMessageId(),
        sender: "agent",
        text: AGENT_NO_RESPONSE,
        type: "message",
        fullData: messages,
      });
    }
  };

  // Helper to process agent messages
  const processAgentMessage = (msg: any): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    let reply = "";
    let msgType: "agent" | "tool" = "agent";

    // Add internal monologue message
    messages.push({
      id: generateMessageId(),
      sender: "agent",
      text: msg.text,
      type: "internal_monologue",
      fullData: msg,
    });

    try {
      const toolCalls = JSON.parse(msg.tool_calls);
      for (let call of toolCalls) {
        if (call.tool_call_type === "function") {
          if (call.function.name === "send_message") {
            reply += JSON.parse(call.function.arguments).message;
          } else {
            reply += `${call.function.name}: ${call.function.arguments}`;
            msgType = "tool";
          }
        }
      }

      messages.push({
        id: generateMessageId(),
        sender: msgType,
        text: reply,
        type: "message",
        fullData: msg,
      });
    } catch (error) {
      console.error("Error parsing tool_calls data in agent message", error);
    }

    return messages;
  };

  // Helper to process tool messages
  const processToolMessage = (msg: any): ChatMessage | null => {
    if (msg.text && msg.text.length && msg.name !== "send_message") {
      return {
        id: generateMessageId(),
        sender: "tool",
        text: msg.text,
        type: "message",
        fullData: msg,
      };
    }
    return null;
  };

  // Helper to process user messages
  const processUserMessage = (msg: any): ChatMessage | null => {
    try {
      const data = JSON.parse(msg.text);
      if (data?.type === "user_message") {
        return {
          id: generateMessageId(),
          sender: "user",
          text: data.message,
          type: "message",
          fullData: msg,
        };
      }
    } catch (error) {
      console.error("Error parsing user message text", error);
    }
    return null;
  };

  // Main function to process chat history
  const processChatHistory = (entries: any[]): Array<ChatMessage> => {
    const messages: ChatMessage[] = [];

    for (const msg of entries) {
      switch (msg.role) {
        case "assistant":
          messages.push(...processAgentMessage(msg));
          break;
        case "tool": {
          const toolMsg = processToolMessage(msg);
          if (toolMsg) messages.push(toolMsg);
          break;
        }
        case "user": {
          const userMsg = processUserMessage(msg);
          if (userMsg) messages.push(userMsg);
          break;
        }
        default:
          console.warn("Unknown message role:", msg.role);
      }
    }

    return messages;
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
            className={`chat-bubble ${
              msg.sender === "user"
                ? "user-bubble"
                : msg.sender === "tool"
                  ? "agent-bubble tool"
                  : msg.type === "internal_monologue"
                    ? "agent-bubble internal-monologue"
                    : "agent-bubble"
            }`}
            onClick={() => handleMessageClick(msg)} // Add click event to show modal
          >
            {msg.type === "internal_monologue" ? `"${msg.text}"` : msg.text}
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
