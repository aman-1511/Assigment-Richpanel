import React, { useEffect, useRef, useState, version } from "react";
import { Menu, RotateCw, SendHorizontal, ChevronDown } from "lucide-react";

import { Api, GraphApi } from "../Api/Axios";
import {
  getDate,
  getDuration,
  getTime,
  showError,
  showSuccess,
} from "../lib/utils";
import { useLoader } from "../hooks/loader";
import CustomerInformation from "./CustomerInformation";
import ChatCustomers from "./ChatCustomers";
import ChatDock from "./ChatDock";

const ChatPortal = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const loader = useLoader();
  const socketRef = useRef();

  const getClientDetails = async (chat) => {
    try {
      const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
      console.log("In getClientDetails - FB_PAGE_DETAILS:", pageDetails);
      const pageDetailsParsed = JSON.parse(pageDetails ? pageDetails : "{}");
      if (!pageDetailsParsed.id) {
        throw new Error("Please connect to a facebook page");
      }

      const clientId = chat?.clientId;
      console.log("Getting details for client ID:", clientId);
      
      const res = await GraphApi.get(`/${clientId}`, {
        params: {
          access_token: pageDetailsParsed.pageAccessToken,
          fields: "name,first_name,last_name,profile_pic,email",
        },
      });
      console.log("Graph API response for client:", res.data);
      
      const clientDetails = res.data;
      chat.client = clientDetails;
      return chat;
    } catch (error) {
      console.error("Error in getClientDetails:", error);
      const errorCode = error?.response?.data?.error?.code;
      if (errorCode === 190) {
        showError("Access token expired ... please reconnect to facebook page");
        return chat; // Return chat even if we couldn't get details
      }
      showError(error?.message);
      return chat; // Return chat even if we couldn't get details
    }
  };

  const updateChat = async (clientId, senderId, message) => {
    try {
      let chatExists = false;
      const updatedChats = chats?.map((c) => {
        if (c?.clientId === clientId) {
          chatExists = true;
          const updatedChat = {
            ...c,
            messages: [
              ...c.messages,
              {
                senderId: senderId,
                message: message,
                time: Date.now(),
              },
            ],
          };
          console.log("Updated chat:", updatedChat);
          if (updatedChat?.clientId === selectedChat?.clientId) {
            setSelectedChat(updatedChat);
          }
          return updatedChat;
        }
        return c;
      });

      // If chat does not exist create one
      if (chatExists) {
        setChats(updatedChats);
      } else {
        const newChat = {
          clientId: clientId,
          senderId: clientId,
          messages: [
            {
              senderId: senderId,
              message: message,
              time: Date.now(),
            },
          ],
        };

        console.log("Creating new chat:", newChat);
        const newChatWithDetails = await getClientDetails(newChat);
        console.log("New chat with details:", newChatWithDetails);
        setChats((prev) => [...prev, newChatWithDetails]);
        
        // If no chat is selected, select this new one
        if (!selectedChat) {
          setSelectedChat(newChatWithDetails);
        }
      }
    } catch (error) {
      console.error("Error updating chat:", error);
      showError("Failed to update chat");
    }
  };

  const getAllMessages = async () => {
    loader.setLoading(true);
    try {
      const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
      console.log("FB_PAGE_DETAILS from localStorage:", pageDetails);
      const pageDetailsParsed = JSON.parse(pageDetails ? pageDetails : "{}");
      console.log("Parsed page details:", pageDetailsParsed);
      
      if (!pageDetailsParsed.id) {
        throw new Error("Please connect to a facebook page");
      }
      
      console.log("Making API call to get all messages with pageId:", pageDetailsParsed.id);
      const res = await Api.get("/messages", {
        params: { pageId: pageDetailsParsed.id },
      });

      console.log("Response from getAllMessages API:", res.data);
      const allChats = res.data.messages || [];
      console.log("All chats from API:", allChats);
      
      if (allChats.length === 0) {
        console.log("No conversations found in API response");
        setChats([]);
        loader.setLoading(false);
        return;
      }
      
      // Fetch client details for each sender
      const allChatsNamedPromises = allChats?.map((chat) => {
        return getClientDetails(chat);
      });

      const __chats = await Promise.all(allChatsNamedPromises.filter(Boolean));
      console.log("Chats with client details:", __chats);
      setChats(__chats.filter(Boolean));
      
      // If we have chats but none selected, select the first one
      if (__chats.length > 0 && !selectedChat) {
        setSelectedChat(__chats[0]);
      }
    } catch (error) {
      console.error("Error in getAllMessages:", error);
      showError(error?.message || "Failed to fetch messages");
    } finally {
      loader.setLoading(false);
    }
  };
  
  const selectAChat = (chat) => {
    setSelectedChat(chat);
  };

  // Functions for socket connection and handling receive message

  const joinChat = (pageId) => {
    try {
      const payload = { action: "join-chat", pageId: pageId };
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(payload));
        console.log("Joined chat for pageId:", pageId);
      } else {
        console.error("Socket not open, cannot join chat");
      }
    } catch (error) {
      console.error("Error joining chat:", error);
    }
  };

  const handleReceiveMessage = (payload) => {
    console.log("Message received:", payload);
    if (!payload.senderId) {
      console.warn("Received message without senderId");
      return;
    }
    const { senderId, pageId, message, created_at } = payload;
    updateChat(senderId, senderId, message);
  };

  const handleInitConfirmation = (payload) => {
    loader.setLoading(false);
    if (payload.status === 400) {
      showError(payload?.message || "Failed to initialize connection");
    } else {
      console.log("Socket connection initialized successfully");
    }
  };

  const initSocket = () => {
    const ENDPOINT = import.meta.env.VITE_SOCKET_ENDPOINT;
    console.log("Socket ENDPOINT:", ENDPOINT);
    
    const __pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
    console.log("Page details for socket initialization:", __pageDetails);
    
    let pageDetails = {};
    if (__pageDetails && __pageDetails !== "") {
      try {
        pageDetails = JSON.parse(__pageDetails);
        console.log("Parsed page details for socket:", pageDetails);
        
        const pageId = pageDetails?.id;
        if (!pageId) {
          console.error("No page ID found in page details");
          return;
        }
        
        console.log("Initializing socket with pageId:", pageId);
        
        socketRef.current = new WebSocket(ENDPOINT);
        
        socketRef.current.onopen = () => {
          console.log("Socket connection opened");
          joinChat(pageId);
          loader.setLoading(true);
        };
        
        socketRef.current.onmessage = (res) => {
          try {
            const payload = JSON.parse(res.data);
            console.log("Socket message received:", payload);
            
            if (payload?.action === "message") {
              handleReceiveMessage(payload);
            } else if (payload?.action === "socket-init-confirmation") {
              handleInitConfirmation(payload);
            }
          } catch (error) {
            console.error("Error handling socket message:", error);
          }
        };
        
        socketRef.current.onerror = (error) => {
          console.error("Socket error:", error);
        };
        
        socketRef.current.onclose = (event) => {
          console.log("Socket connection closed:", event);
        };
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    } else {
      console.warn("No page details found in localStorage for socket initialization");
    }
  };

  useEffect(() => {
    console.log("ChatPortal component mounted");
    
    // Check if FB_PAGE_DETAILS exists in localStorage
    const pageDetails = localStorage.getItem("FB_PAGE_DETAILS");
    console.log("FB_PAGE_DETAILS on mount:", pageDetails);
    
    if (!pageDetails || pageDetails === "{}") {
      console.warn("No Facebook page details found in localStorage, showing error");
      showError("Please connect to a Facebook page to see conversations");
    }
    
    if (!socketRef.current) {
      console.log("Initializing socket connection");
      initSocket();
    }
    
    console.log("Fetching all messages");
    getAllMessages();
    
    // Set up polling to refresh messages
    const intervalId = setInterval(() => {
      console.log("Refreshing messages...");
      getAllMessages();
    }, 30000); // Refresh every 30 seconds
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex w-full justify-between overflow-hidden">
      {/* Customers will be shown here */}
      <div className="flex flex-col min-w-[180px]  w-[20%] border-r">
        <div className="overflow-hidden border-b border-black flex items-center justify-between p-3 opacity-65 gap-10">
          <div className="flex items-center gap-2 ">
            <Menu className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Conversations</h1>
          </div>
          <RotateCw
            className="h-6 w-6 cursor-pointer"
            onClick={() => {
              getAllMessages();
            }}
          />
        </div>

        <ChatCustomers chats={chats} selectAChat={selectAChat} selectedChat={selectedChat} />
      </div>

      {selectedChat ? (
        <>
          {/* Main chat section */}
          <ChatDock chat={selectedChat} updateChat={updateChat} />
          {/* Personal Info */}

          <div className="w-[22%]">
            <CustomerInformation chat={selectedChat} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-500">Select a conversation or connect to Facebook to see messages</p>
        </div>
      )}
    </div>
  );
};

export default ChatPortal;
