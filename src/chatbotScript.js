document
  .getElementById("userInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") sendMessage();
  });

export function sendMessage() {
  const inputField = document.getElementById("userInput");
  const userMessage = inputField.value.trim();
  if (!userMessage) return;

  appendMessage(userMessage, "user-message");
  const messages = updateLocalStorage({ role: "user", content: userMessage });
  inputField.value = "";

  fetch("https://chat-pump-fun.vercel.app/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-5) }),
  })
    .then((response) => response.json())
    .then((data) => handleResponse(data))
    .catch((error) => console.error("Error:", error));
}

export function appendMessage(message, className) {
  const chatbox = document.getElementById("chatbox");
  const msgDiv = document.createElement("div");
  msgDiv.className = className;
  msgDiv.innerText = message;
  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

document.getElementById("clear-chat").addEventListener("click", function () {
  localStorage.setItem("pumpMessages", JSON.stringify([])); // Store empty array properly
  location.reload(); // Reload the page
});

export function handleResponse(data) {
  const chatbox = document.getElementById("chatbox");
  let botReply = "";

  // Handle a single message
  if (data.message) {
    botReply = data.message;
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "bot-message";
    botMessageDiv.innerHTML = marked.parse(botReply);
    chatbox.appendChild(botMessageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
    
    if (botReply) updateLocalStorage({ role: "assistant", content: botReply });
  }
  // Handle an array of items
  else if (Array.isArray(data)) {
    // Build one markdown string without unwanted indentation
    botReply = data
      .map((item, index) => {
        return (
          `**${index + 1}. ${item.name} (${item.symbol})**\n\n` +
          `${item.description || "No description available."}\n\n` +
          `- **Market Cap:** $${item.usd_market_cap.toLocaleString()}\n` +
          `- **Mint Address:** \`${item.mint}\`\n` +
          `- **Created:** ${new Date(
            item.created_timestamp
          ).toLocaleDateString()}\n` +
          (item.website ? `- [Visit Website](${item.website})\n` : "") +
          (item.twitter ? `- [Twitter](${item.twitter})\n` : "") +
          (item.telegram ? `- [Telegram](${item.telegram})\n` : "") +
          `- **Last Trade:** ${
            item.last_trade_timestamp
              ? new Date(item.last_trade_timestamp).toLocaleString()
              : "N/A"
          }\n` +
          `- **Liquidity:** ${
            item.virtual_sol_reserves
              ? item.virtual_sol_reserves.toLocaleString()
              : "N/A"
          } SOL | ${
            item.virtual_token_reserves
              ? item.virtual_token_reserves.toLocaleString()
              : "N/A"
          } Tokens\n` +
          (item.bonding_curve
            ? `- **Bonding Curve:** \`${item.bonding_curve}\`\n`
            : "")
        );
      })
      .join("\n---\n");

    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "bot-message";
    
    let riskClass = "";
    if (item.warnings && item.warnings.includes("extreme")) {
      riskClass = "extreme-risk";
    } else if (item.warnings && item.warnings.includes("high influence")) {
      riskClass = "high-influence-risk";
    }
    

    botMessageDiv.innerHTML = marked.parse(botReply);
    chatbox.appendChild(botMessageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;

    if (botReply) {
      let splitMessages = botReply.split("\n---\n");

      updateLocalStorage({ role: "assistant", content: splitMessages.slice(0, 5).join("\n---\n") });
    }

  }
}

// Update messages in localStorage
export function updateLocalStorage(newMessage) {
  let messages = JSON.parse(localStorage.getItem("pumpMessages")) || [];


  messages.push(newMessage);

  // If there are more than 10 messages, only keep the last 10
  if (messages.length > 10) {
    messages = messages.slice(-10);
  }

  localStorage.setItem("pumpMessages", JSON.stringify(messages));
  return messages;
}

// Load messages on page load
export function loadMessages() { 
  const chatbox = document.getElementById("chatbox");
  const messages = JSON.parse(localStorage.getItem("pumpMessages")) || [];
  // console.log("Marked: " + marked)
  messages.forEach((msg) => {
    const msgDiv = document.createElement("div");
    msgDiv.className = msg.role === "user" ? "user-message" : "bot-message";

    // Detect Markdown and convert to HTML if bot message
    if (msg.role === "assistant") {
      msgDiv.innerHTML = marked.parse(msg.content); // Converts Markdown to HTML
      console.log(msgDiv);
    } else {
      msgDiv.innerText = msg.content; // Plain text for user messages
    }

    chatbox.appendChild(msgDiv);
  });

  chatbox.scrollTop = chatbox.scrollHeight;
}

// window.onload = loadMessages;
